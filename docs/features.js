(function ($, jsqis) {
    $(function () {
        var machine = new jsqis.QuantumBitMachine(1);
        new jsqis.QuantumBitMachineView($("#single-bit-state0"), machine, {color: false});
    });
    $(function () {
        var machine = new jsqis.QuantumBitMachine(1);
        machine.execute([[jsqis.gate.X, 0]]);
        new jsqis.QuantumBitMachineView($("#single-bit-state1"), machine, {color: false});
    });
    $(function () {
        var machine = new jsqis.QuantumBitMachine(1);
        machine.execute([[jsqis.gate.H, 0]]);
        new jsqis.QuantumBitMachineView($("#single-qubit-superposition"), machine, {color: false});
    });
    $(function () {
        var machine = new jsqis.QuantumBitMachine(1);
        machine.execute([[jsqis.gate.H, 0], [jsqis.gate.T, 0], [jsqis.gate.T, 0], [jsqis.gate.T, 0]]);
        new jsqis.QuantumBitMachineView($("#single-qubit-relative-phase"), machine, {color: false});
    });
    $(function () {
        var machine = new jsqis.QuantumBitMachine(1);
        machine.execute([[jsqis.gate.H, 0], [jsqis.gate.T, 0], [jsqis.gate.H, 0]]);
        new jsqis.QuantumBitMachineView($("#single-qubit-phase-amplitude"), machine, {color: false});
        new jsqis.QuantumBitMachineView($("#single-qubit-phase-amplitude-color"), machine, {color: true});
    });
    $(function () {
        var machine = new jsqis.QuantumBitMachine(1);
        machine.execute([[jsqis.gate.H, 0], [jsqis.gate.T, 0], [jsqis.gate.T, 0], [jsqis.gate.T, 0], [jsqis.gate.H, 0]]);
        new jsqis.QuantumBitMachineView($("#invariant-state-1"), machine);
        machine.execute([[jsqis.gate.globalPhase, .25], [jsqis.gate.rescale, .8]]);
        new jsqis.QuantumBitMachineView($("#invariant-state-2"), machine);
        machine.execute([[jsqis.gate.globalPhase, .4], [jsqis.gate.rescale, .6]]);
        new jsqis.QuantumBitMachineView($("#invariant-state-3"), machine);
        machine.execute([[jsqis.gate.globalPhase, .5], [jsqis.gate.rescale, 1]]);
        new jsqis.QuantumBitMachineView($("#invariant-state-4"), machine);
    });
    $(function () {
        new jsqis.QuantumCircuitView($("#circuit-1"), 4, [[jsqis.gate.X, 0], [jsqis.gate.Z, 2], [jsqis.gate.X, 1], [jsqis.gate.CCNOT, 0, 1, 2], [jsqis.gate.randomize, 333], [jsqis.gate.measure, 253, 3]]);
    });
})(jQuery, jsqis);
