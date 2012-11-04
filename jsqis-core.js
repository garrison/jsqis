// depends: Complex.js
// depends: jQuery (very lightly)

window.jsqis = (function (Complex, $) {

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

    // adapted from http://www.learncpp.com/cpp-tutorial/59-random-number-generation/
    function createRNG (seed) {
        var state = seed;
        return (function () {
            state = 8253729 * state + 2396403;
            state %= 1000000000000;
            return (state % 32767) / 32767; // in range [0, 1);
        });
    };

    var complexZero = new Complex(0, 0).finalize();
    var complexNegativeOne = new Complex(-1, 0).finalize();
    var complexNegativeI = new Complex(0, -1).finalize();
    var complexInvSqrtTwo = new Complex(Math.sqrt(2) / 2, 0).finalize();
    var complexNegativeInvSqrtTwo = new Complex(-Math.sqrt(2) / 2, 0).finalize();
    var complexPhasePiOverFour = Complex.fromPolar(1, Math.PI / 4).finalize();
    var complexPhasePiOverEight = Complex.fromPolar(1, Math.PI / 8).finalize();
    var complexPhaseNegativePiOverEight = Complex.fromPolar(1, -Math.PI / 8).finalize();

    var FundamentalQubitGate = function (nQubits, mapFunc) {
        this.nQubits = nQubits;
        this.mapFunc = mapFunc;
    };

    var gate = {};

    gate.X = new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState ^ (1 << register), Complex.one]
        ];
    });

    gate.Z = new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState, basisState & (1 << register) ? complexNegativeOne : Complex.one]
//            [basisState, basisState & (1 << register) ? Complex.i : complexNegativeI]
        ];
    });

    gate.T = new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState, basisState & (1 << register) ? complexPhasePiOverFour : Complex.one]
//            [basisState, basisState & (1 << register) ? complexPhasePiOverEight : complexPhaseNegativePiOverEight]
        ];
    });

    gate.H = new FundamentalQubitGate(1, function (basisState, register) {
        return [
            [basisState, basisState & (1 << register) ? complexNegativeInvSqrtTwo : complexInvSqrtTwo],
            [basisState ^ (1 << register), complexInvSqrtTwo]
        ];
    });

    gate.CNOT = new FundamentalQubitGate(2, function (basisState, controlRegister, targetRegister) {
        return [
            [basisState & (1 << controlRegister) ? basisState ^ (1 << targetRegister) : basisState, Complex.one]
        ];
    });

    gate.CCNOT = new FundamentalQubitGate(3, function (basisState, controlRegister1, controlRegister2, targetRegister) {
        return [
            [(basisState & (1 << controlRegister1)) && (basisState & (1 << controlRegister2)) ? basisState ^ (1 << targetRegister) : basisState, Complex.one]
        ];
    });

    gate.globalPhase = new FundamentalQubitGate(0, function (basisState, arg) {
        return [
            [basisState, Complex.fromPolar(1, arg)]
        ];
    });

    // These are not actually gates, but instead special operations
    gate.randomize = {randomize: true};
    gate.measure = {measure: true};
    gate.rescale = {rescale: true};

    /**
     * Represents a quantum register with some number of qubits
     */
    var QuantumBitMachine = function (nQubits, options) {
        assert(nQubits > 0 && nQubits < 24);
        this.nQubits = nQubits;
        this.options = $.extend({}, QuantumBitMachine.defaultOptions, options);
        var nBasisStates = 1 << nQubits;
        this.amplitudeList = [Complex.one];
        for (var i = 1; i < nBasisStates; ++i) {
            this.amplitudeList.push(complexZero);
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
        return $.extend({}, this);
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
                newAmplitudeList.push(complexZero.clone());
            }
            for (i = 0; i < this.amplitudeList.length; ++i) {
                if (!this.amplitudeList[i].equals(complexZero)) {
                    var output = command[0].mapFunc.apply(null, [i].concat(command.slice(1)));
                    for (k = 0; k < output.length; ++k) {
                        var bs = output[k][0], amp = output[k][1];
                        // fixme: assert bs < this.amplitudeList.length
                        newAmplitudeList[bs].add(amp.clone().mult(this.amplitudeList[i]));
                    }
                }
            }
        } else if (command[0].measure) {
            // it's a measurement
            // fixme: assert each register is correct and none is specified more than once
            // FIXME XXX: actually compute probabilities
            rng = createRNG(command[1]); // fixme: seed it using a global RNG if no seed is given explicitly
            var registers = command.slice(2),
                target = [];
            for (j = 0; j < registers.length; ++j) {
                target.push((rng() < .5) ? 0 : 1);
            }
            for (i = 0; i < this.amplitudeList.length; ++i) {
                var newAmplitude = this.amplitudeList[i];
                for (j = 0; j < registers.length; ++j) {
                    if ((i & (1 << registers[j])) != (target[j] << registers[j])) {
                        newAmplitude = complexZero;
                        break;
                    }
                }
                newAmplitudeList.push(newAmplitude.clone());
            }
        } else if (command[0].randomize) {
            // it's a randomize operation
            // fixme: assert there's just one argument (the seed)
            rng = createRNG(command[1]);
            for (j = 0; j < this.amplitudeList.length; ++j) {
                newAmplitudeList.push(Complex.fromPolar(rng(), 2 * Math.PI * rng()).finalize());
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
                    psiMagnitudeSquared += newAmplitudeList[j].magnitude() * newAmplitudeList[j].magnitude();
                }
                rescaleInverse = Math.sqrt(psiMagnitudeSquared) / rescaleStrategy;
            } else if (rescaleStrategy == 'max') {
                for (j = 0; j < newAmplitudeList.length; ++j) {
                    var m = newAmplitudeList[j].magnitude();
                    if (m > rescaleInverse) {
                        rescaleInverse = m;
                    }
                }
            } else {
                // invalid rescale strategy
            }
            for (j = 0; j < newAmplitudeList.length; ++j) {
                // NOTE: this divide function likely modifies in place, so we copy first...
                newAmplitudeList[j] = newAmplitudeList[j].clone().divide(rescaleInverse);
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

})(Complex, jQuery);
