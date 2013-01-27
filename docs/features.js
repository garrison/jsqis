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
    $(function () {
        function setupPhoton (elt, commandList) {
            var pv, machine = new jsqis.QuantumBitMachine(1),
                span = $("<span></span>").appendTo(elt);
            if (commandList) {
                machine.execute(commandList);
            }
            pv = new jsqis.PhotonView(span, machine);
            new jsqis.QuantumBitMachineView(span, machine);
            span.hover(function () {
                pv.toggleAnimation(true);
            }, function () {
                pv.toggleAnimation(false);
            });
        }
        setupPhoton($("#photon-polarization1"));
        setupPhoton($("#photon-polarization2"), [[jsqis.gate.X, 0]]);
        setupPhoton($("#photon-polarization3"), [[jsqis.gate.H, 0]]);
        setupPhoton($("#photon-polarization4"), [[jsqis.gate.H, 0], [jsqis.gate.Z, 0]]);
        setupPhoton($("#photon-polarization5"), [[jsqis.gate.H, 0], [jsqis.gate.T, 0], [jsqis.gate.T, 0]]);
        setupPhoton($("#photon-polarization6"), [[jsqis.gate.H, 0], [jsqis.gate.Z, 0], [jsqis.gate.T, 0], [jsqis.gate.T, 0]]);
        setupPhoton($("#photon-polarization7"), [[jsqis.gate.H, 0], [jsqis.gate.Z, 0], [jsqis.gate.T, 0]]);
        setupPhoton($("#photon-polarization8"), [[jsqis.gate.randomize, 2]]);
        setupPhoton($("#photon-polarization9"), [[jsqis.gate.randomize, 1]]);
        setupPhoton($("#photon-polarization10"), [[jsqis.gate.randomize, 0]]);
    });
})(jQuery, jsqis);
