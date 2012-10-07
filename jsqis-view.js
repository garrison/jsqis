// depends: jsqis-core.js

jQuery.extend(window.jsqis, (function ($) {

    // we use the cielab color space so each hue has the same perceived intensity.
    function cielchToRGB (l, c, h) {
        // l and c go from 0 to 100
        // h is an angle in radians

        // based on http://www.easyrgb.com/index.php?X=MATH

        // convert to XYZ
        var y = (l + 16) / 116;
        var x = c * Math.cos(h) / 500 + y;
        var z = y - c * Math.sin(h) / 200;
        y = (y > 0.206893 ? y * y * y : (y - 16 / 116) / 7.787);
        x = (x > 0.206893 ? x * x * x : (x - 16 / 116) / 7.787) * 0.95047;
        z = (z > 0.206893 ? z * z * z : (z - 16 / 116) / 7.787) * 1.08883;

        // convert to RGB
        var r = x *  3.2406 + y * -1.5372 + z * -0.4986;
        var g = x * -0.9689 + y *  1.8758 + z *  0.0415;
        var b = x *  0.0557 + y * -0.2040 + z *  1.0570;
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

        var m = function (v) {
            // ensure it's in bounds and scale it to be between 0 and 255
            return 255 * Math.max(Math.min(1, v), 0);
        };
        return [m(r), m(g), m(b)];
    }

    // modulus that works with negative numbers.  see
    // http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
    function safeModulus (a, b) {
        return ((a % b) + b) % b;
    }

    // only an amplitude within the unit circle is guaranteed to fit
    // on the paper
    var AmplitudeView = function (initialAmplitude, scale) {
        if (!scale) {
            scale = 1;
        }

        this.elt = $("<span></span>");
        var paper = Raphael(this.elt[0], 74 * scale, 74 * scale);

        this.box = paper.rect(12 * scale, 12 * scale, 50 * scale, 50 * scale);
        this.arrow = paper.path("M" + (37 * scale) + "," + (62 * scale) + "v" + (-43 * scale) + "l" + (-3 * scale) + ",0l" + (3 * scale) + "," + (-6 * scale) + "l" + (3 * scale) + "," + (6 * scale) + "h" + (-3 * scale) + "z");
        this.obj = paper.set().push(this.box, this.arrow);

        this.obj.transform(this.calculateTransform(initialAmplitude));
        this.box.attr(AmplitudeView.calculateBoxColor(initialAmplitude));
        this.arrow.animate(AmplitudeView.calculateArrowColor(initialAmplitude));
    };
    AmplitudeView.prototype.calculateTransform = function (amplitude) {
        // returns Raphael "transform" string from amplitude
        var oldRotation = this.currentRotation || 0;
        // we want to rotate in the direction that gets us to our destination most directly
        this.currentRotation = oldRotation + safeModulus(Raphael.deg(amplitude.arg()) + 180 - oldRotation, 360) - 180;
        return "S" + amplitude.abs() + "R" + (-this.currentRotation);
    };
    AmplitudeView.calculateBoxColor = function (amplitude) {
        return {fill: "rgba(" + cielchToRGB(80, 35, amplitude.arg()).join(",") + ", .8)", stroke: "rgba(" + cielchToRGB(50, 25, amplitude.arg()).join(",") + ", .8)"};
    };
    AmplitudeView.calculateArrowColor = function (amplitude) {
        return {fill: "rgb(" + cielchToRGB(55, 25, amplitude.arg()).join(",") + ")", stroke: "rgb(" + cielchToRGB(35, 15, amplitude.arg()).join(",") + ")"};
    };
    AmplitudeView.prototype.update = function (amplitude) {
        // fixme: only do transform if something actually changed
        this.obj.animate({transform: this.calculateTransform(amplitude)}, 200, "back-out");
        this.box.animate(AmplitudeView.calculateBoxColor(amplitude), 200, "back-out");
        this.arrow.animate(AmplitudeView.calculateArrowColor(amplitude), 200, "back-out");
    };

    function zeroFillBinary (number, width) {
        // returns a number's binary representation.  zeroFillBinary(5, 4) == 0101
        number = number.toString(2);
        var pad_length = width - number.length;
        var pad = "";
        while (pad_length--) {
            pad += "0";
        }
        return pad + number;
    };

    var QuantumBitMachineView = function (parentElement, machine, scale) {
        this.machine = machine;
        this.amplitudeViewList = [];
        var tr, td, table = $('<table class="QuantumBitMachineView"></table>');
        for (var i = 0; i < machine.amplitudeList.length; ++i) {
            if (i % 8 == 0)
                tr = $("<tr></tr>").appendTo(table);
            td = $("<td></td>").appendTo(tr);
            var amplitudeView = new AmplitudeView(machine.amplitudeList[i], scale);
            this.amplitudeViewList.push(amplitudeView);
            amplitudeView.elt.appendTo(td);
            td.append("<br/>");
            $("<span></span>").text(zeroFillBinary(i, machine.nQubits)).appendTo(td);
        }
        table.appendTo(parentElement);
    };
    QuantumBitMachineView.prototype.update = function (machine) {
        if (machine) {
            this.machine = machine;
        }

        // fixme: assert this.machine.amplitudeList.length == this.amplitudeViewList.length;
        for (var i = 0; i < this.amplitudeViewList.length; ++i) {
            this.amplitudeViewList[i].update(this.machine.amplitudeList[i]);
        }
    };

    return {
        AmplitudeView: AmplitudeView,
        QuantumBitMachineView: QuantumBitMachineView
    };

})(jQuery));
