window.jsqis = (function ($) {

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

    // fixme: not actually a gate...
    gate.randomizer = {randomizer: true};

    // fixme: not actually a gate...
    gate.measurement = {measurement: true};

    var QuantumBitMachine = function (nQubits) {
        // fixme: assert(function () { nQubits > 0 && nQubits < 24 });
        this.nQubits = nQubits;
        var nBasisStates = 1 << nQubits;
        this.amplitudeList = [Complex.one];
        for (var i = 1; i < nBasisStates; ++i) {
            this.amplitudeList.push(complexZero);
        }
    };
    QuantumBitMachine.prototype.copy = function () {
        // http://stackoverflow.com/a/122704/1558890
        return $.extend({}, this);
    };
    QuantumBitMachine.prototype.executeCommand = function (command) {
        var i, j, k, newAmplitudeList = [], rng;
        // fixme: assert list
        // fixme: assert command.length > 0
        if (command[0].mapFunc) {
            // it's a FundamentalQubitGate
            // fixme: assert command.length == command[0].nQubits + 1;
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
        } else if (command[0].measurement) {
            // it's a measurement
            // fixme: assert each register is correct and none is specified more than once
            // FIXME XXX: actually compute probabilities
            rng = createRNG(command[1]); // fixme?
            var registers = command.slice(2),
                target = [];
            for (j = 0; j < registers.length; ++j) {
                target.push((rng() < .5) ? 0 : 1);
            }
            for (i = 0; i < this.amplitudeList.length; ++i) {
                // fixme: better name than c
                var c = this.amplitudeList[i];
                for (j = 0; j < registers.length; ++j) {
                    if ((i & (1 << registers[j])) != (target[j] << registers[j])) {
                        c = complexZero;
                        break;
                    }
                }
                newAmplitudeList.push(c.clone());
            }
        } else if (command[0].randomizer) {
            // it's a randomizer
            // fixme: assert there's just one argument (the seed)
            rng = createRNG(command[1]);
            for (j = 0; j < this.amplitudeList.length; ++j) {
                newAmplitudeList.push(Complex.fromPolar(rng(), 2 * Math.PI * rng()).finalize());
            }
        }
        // now we rescale such that the total probability is 1 again
        if (false && command[0].measurement || (command[0].randomizer && false)) { // fixme! in jsqis-view we should just make an option to rescale such that the biggest is of size one
            var psiMagnitudeSquared = 0;
            for (j = 0; j < newAmplitudeList.length; ++j) {
                psiMagnitudeSquared += newAmplitudeList[j].magnitude() * newAmplitudeList[j].magnitude();
            }
            for (j = 0; j < newAmplitudeList.length; ++j) {
                // NOTE: this divide function likely modifies in place, so we copy first...
                newAmplitudeList[j] = newAmplitudeList[j].clone().divide(psiMagnitudeSquared);
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
        FundamentalQubitGate: FundamentalQubitGate,
        gate: gate,
        QuantumBitMachine: QuantumBitMachine
    };

})(jQuery);
