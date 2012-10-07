// depends: jsqis-core.js
//          jsqis-view.js

// fixme: make it so more than one machine can be shown on a given slide

(function ($) {
    // initialize QuantumBitMachineView's
    $(".jsqis-machine").each(function () {
        var machine = new jsqis.QuantumBitMachine($(this).data("qubits")),
            machineView = new jsqis.QuantumBitMachineView(this, machine),
            gate = jsqis.gate;
        //// $(elt).data("machine", machine).data("machineView", machineView);

        // find all qubit operations
        // http://stackoverflow.com/questions/8771463/jquery-find-what-order-does-it-return-elements-in
        var machineSlide = $(this).parents('.slide').one();
        machineSlide.find('.slide').add(machineSlide).each(function () {
            if ($(this).hasClass("jsqis-gate")) {
                machine = machine.copy();
                with (gate) {
                    machine.execute(eval($(this).data("operations")));
                }
            }
            $(this).data("machineState", machine);
        }).bind('deck.becameCurrent', function (event) {
            machineView.update($(this).data("machineState"));
            // fixme: we really want the event to bubble, but not call
            // this same function again on the machineSlide ...
            event.stopPropagation();
        });
    });
})(jQuery);
// http://imakewebthings.com/deck.js/docs/#deck-core-theming
