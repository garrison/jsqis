/*global math, _, jQuery */

// depends: mathjs
// depends: jQuery or underscore.js (very lightly)
// depends: seedrandom.js (optionally, for reproducable simulations)

window.jsqis = (function () {

    var extend = jQuery ? jQuery.extend : _.extend;

    function AssertionError(message) {
        this.message = message;
    }
    AssertionError.prototype.toString = function () {
        return 'AssertionError: ' + this.message;
    };

    function assert (condition, message) {
        if (!condition) {
            throw new AssertionError(message || "unspecified error");
        }
    }

    var invSqrtTwo = Math.sqrt(2) / 2;
    var negativeInvSqrtTwo = -Math.sqrt(2) / 2;
    var complexPhasePiOverFour = math.complex({r: 1, phi: Math.PI / 4});
    var complexPhasePiOverEight = math.complex({r: 1, phi: Math.PI / 8});
    var complexPhaseNegativePiOverEight = math.complex({r: 1, phi: -Math.PI / 8});

    var FundamentalQubitGate = function (nQubits, mapFunc) {
        this.nQubits = nQubits;
        this.mapFunc = mapFunc;
    };

    var gate = {};

    function registerGate (name, gateObject) {
        gateObject.name = name;
        gate[name] = gateObject;
    }

    registerGate("X", new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState ^ (1 << register), 1]
        ];
    }));

    registerGate("Z", new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState, basisState & (1 << register) ? -1 : 1]
//            [basisState, basisState & (1 << register) ? math.complex(0, 1) : math.complex(0, -1)]
        ];
    }));

    registerGate("T", new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState, basisState & (1 << register) ? complexPhasePiOverFour : 1]
//            [basisState, basisState & (1 << register) ? complexPhasePiOverEight : complexPhaseNegativePiOverEight]
        ];
    }));

    registerGate("Rtheta", new FundamentalQubitGate(1, function (basisState, register, arg) {
        var phase = math.complex({r: 1, phi: arg});
        return [
            [basisState, basisState & (1 << register) ? phase : 1]
        ];
    }));

    registerGate("H", new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState, basisState & (1 << register) ? negativeInvSqrtTwo : invSqrtTwo],
            [basisState ^ (1 << register), invSqrtTwo]
        ];
    }));

    registerGate("CNOT", new FundamentalQubitGate(2, function (basisState, controlRegister, targetRegister) {
        return [
            [basisState & (1 << controlRegister) ? basisState ^ (1 << targetRegister) : basisState, 1]
        ];
    }));

    registerGate("CCNOT", new FundamentalQubitGate(3, function (basisState, controlRegister1, controlRegister2, targetRegister) {
        return [
            [(basisState & (1 << controlRegister1)) && (basisState & (1 << controlRegister2)) ? basisState ^ (1 << targetRegister) : basisState, 1]
        ];
    }));

    registerGate("globalPhase", new FundamentalQubitGate(0, function (basisState, arg) {
        var phase = math.complex({r: 1, phi: arg});
        return [
            [basisState, phase]
        ];
    }));

    // These are not actually gates, but instead special operations
    registerGate("randomize", {randomize: true});
    registerGate("measure", {measure: true});
    registerGate("rescale", {rescale: true});

    /**
     * Represents a quantum register with some number of qubits
     */
    var QuantumBitMachine = function (nQubits, options) {
        assert(nQubits > 0 && nQubits < 24);
        this.nQubits = nQubits;
        this.options = extend({}, QuantumBitMachine.defaultOptions, options);
        var nBasisStates = 1 << nQubits;
        this.amplitudeList = [1];
        for (var i = 1; i < nBasisStates; ++i) {
            this.amplitudeList.push(0);
        }
    };
    QuantumBitMachine.defaultOptions = {
        /**
         * Available choices for rescaleStrategy:
         *
         * * 'unity': rescales such that the total probability is one
         *
         * * 'max': rescales such that the largest amplitude has a
         *    magnitude of one (which is often necessary for
         *    effectively visualizing a many-qubit state with much
         *    superposition
         *
         * * a number in the range (0, 1]: rescales such that the
         *   total "probability" is the given value
         *
         * * false or undefined: performs no rescaling
         */
        rescaleStrategy: 'unity'
    };
    QuantumBitMachine.prototype.copy = function () {
        // http://stackoverflow.com/a/122704/1558890
        return extend({}, this);
    };
    QuantumBitMachine.prototype.executeCommand = function (command) {
        var i, j, k, newAmplitudeList = [], rng;
        // fixme: assert list
        assert(command.length > 0);
        assert(command[0] !== undefined);
        if (command[0].mapFunc) {
            // it's a FundamentalQubitGate
            // fixme: assert command.length == command[0].nQubits + 1; EXCEPT in the case of globalPhase (where nQubits == 0)
            // fixme: assert each register is specified no more than once
            for (j = 0; j < this.amplitudeList.length; ++j) {
                newAmplitudeList.push(0);
            }
            for (i = 0; i < this.amplitudeList.length; ++i) {
                if (!math.equal(this.amplitudeList[i], 0)) {
                    var output = command[0].mapFunc.apply(null, [i].concat(command.slice(1)));
                    for (k = 0; k < output.length; ++k) {
                        var bs = output[k][0], amp = output[k][1];
                        // fixme: assert bs < this.amplitudeList.length
                        newAmplitudeList[bs] = math.add(newAmplitudeList[bs], math.multiply(amp, this.amplitudeList[i]));
                    }
                }
            }
        } else if (command[0].measure) {
            // it's a measurement
            // fixme: assert each register is correct and none is specified more than once
            // FIXME XXX: actually compute probabilities
            if (Math.seedrandom)
                Math.seedrandom(command[1]);
            var registers = command.slice(2),
                target = [];
            for (j = 0; j < registers.length; ++j) {
                target.push((Math.random() < .5) ? 0 : 1);
            }
            for (i = 0; i < this.amplitudeList.length; ++i) {
                var newAmplitude = this.amplitudeList[i];
                for (j = 0; j < registers.length; ++j) {
                    if ((i & (1 << registers[j])) != (target[j] << registers[j])) {
                        newAmplitude = 0;
                        break;
                    }
                }
                newAmplitudeList.push(newAmplitude);
            }
        } else if (command[0].randomize) {
            // it's a randomize operation
            // fixme: assert there's just one argument (the seed)
            if (Math.seedrandom)
                Math.seedrandom(command[1]);
            for (j = 0; j < this.amplitudeList.length; ++j) {
                newAmplitudeList.push(math.complex({r: Math.random(), phi: 2 * Math.PI * Math.random()}));
            }
        } else if (command[0].rescale) {
            // we don't actually do anything, but we still need to set newAmplitudeList
            newAmplitudeList = this.amplitudeList.slice(0);
        } else {
            assert(false, "invalid command");
        }

        assert(newAmplitudeList.length == this.amplitudeList.length);

        // determine rescaleStrategy
        var rescaleStrategy = undefined;
        if (command[0].rescale) {
            rescaleStrategy = command[1] || 'unity';
        } else if (this.options.rescaleStrategy && (command[0].measure || command[0].randomize)) {
            rescaleStrategy = this.options.rescaleStrategy;
        }

        // perform any rescale strategy
        if (rescaleStrategy) {
            if (rescaleStrategy == "unity") {
                rescaleStrategy = 1;
            }
            var rescaleInverse = 0;
            if (typeof rescaleStrategy === 'number') {
                var psiMagnitudeSquared = 0;
                for (j = 0; j < newAmplitudeList.length; ++j) {
                    psiMagnitudeSquared += math.square(math.abs(newAmplitudeList[j]));
                }
                rescaleInverse = Math.sqrt(psiMagnitudeSquared) / rescaleStrategy;
            } else if (rescaleStrategy == 'max') {
                for (j = 0; j < newAmplitudeList.length; ++j) {
                    var m = math.abs(newAmplitudeList[j]);
                    if (m > rescaleInverse) {
                        rescaleInverse = m;
                    }
                }
            } else {
                // invalid rescale strategy
            }
            for (j = 0; j < newAmplitudeList.length; ++j) {
                newAmplitudeList[j] = math.divide(newAmplitudeList[j], rescaleInverse);
            }
        }
        this.amplitudeList = newAmplitudeList;
    };
    QuantumBitMachine.prototype.execute = function (commandList) {
        // fixme: assert list
        for (var i = 0; i < commandList.length; ++i) {
            this.executeCommand(commandList[i]);
        }
    };
    QuantumBitMachine.prototype.getState = function () {
        // copy array (http://my.opera.com/GreyWyvern/blog/show.dml/1725165)
        return this.amplitudeList.slice(0);
    };

    return {
        assert: assert,
        FundamentalQubitGate: FundamentalQubitGate,
        gate: gate,
        QuantumBitMachine: QuantumBitMachine
    };

})();
