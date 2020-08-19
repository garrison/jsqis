/*global math, jQuery, Raphael */

// depends: jsqis-core.js
//
// depends: jQuery
// depends: raphael

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
    var AmplitudeView = function (initialAmplitude, options) {
        this.options = $.extend({}, AmplitudeView.defaultOptions, options);

        this.elt = $('<span class="AmplitudeView"></span>');
        var scale = 3.2 * this.options.scale,
            paper = Raphael(this.elt[0], 26 * scale, 26 * scale);

        this.box = paper.rect(4 * scale, 4 * scale, 18 * scale, 18 * scale);
        this.arrow = paper.path("M" + (13 * scale) + "," + (5 * scale) +
                                "l" + (5 * scale) + "," + (5 * scale) +
                                "l" + (-4 * scale) + "," + (-1 * scale) +
                                "v" + (12 * scale) +
                                "h" + (-2 * scale) +
                                "v" + (-12 * scale) +
                                "l" + (-4 * scale) + "," + (1 * scale) +
                                "z");
        this.obj = paper.set().push(this.box, this.arrow);

        this.obj.transform(this.calculateTransform(initialAmplitude));
        this.box.attr(this.calculateBoxAttr(initialAmplitude));
        this.arrow.animate(this.calculateArrowAttr(initialAmplitude));
    };
    AmplitudeView.defaultOptions = {
        scale: 1,
        color: true,
        displayBox: true
    };
    AmplitudeView.prototype.calculateTransform = function (amplitude) {
        // returns Raphael "transform" string from amplitude
        var oldRotation = this.currentRotation || 0;
        // we want to rotate in the direction that gets us to our destination most directly
	//alert(amplitude);
        this.currentRotation = oldRotation + safeModulus(Raphael.deg(amplitude.arg()) + 180 - oldRotation, 360) - 180;
        return "S" + amplitude.abs() + "R" + (-this.currentRotation);
    };
    AmplitudeView.prototype.calculateBoxAttr = function (amplitude) {
        if (!this.options.displayBox) {
            return {fill: "rgba(0, 0, 0, 0)", stroke: "rgba(0, 0, 0, 0)"};
        }
        var arg = amplitude.arg(),
            color = this.options.color,
            scale = 3.2 * this.options.scale;
        return {
            fill: "rgba(" + cielchToRGB(80, color ? 35 : 0, arg).join(",") + ", .8)",
            stroke: "rgb(0, 0, 0)",
            "stroke-width": 2 * scale * amplitude.abs()
        };
    };
    AmplitudeView.prototype.calculateArrowAttr = function (amplitude) {
        return {
            fill: "rgb(0, 0, 0)",
            stroke: "rgb(0, 0, 0)"
        };
    };
    AmplitudeView.prototype.update = function (amplitude) {
        // fixme: only do transform if something actually changed
        this.obj.animate({transform: this.calculateTransform(amplitude)}, 200, "back-out");
        this.box.animate(this.calculateBoxAttr(amplitude), 200, "back-out");
        this.arrow.animate(this.calculateArrowAttr(amplitude), 200, "back-out");
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

    var QuantumBitMachineView = function (parentElement, machine, options) {
        this.machine = machine;
        this.amplitudeViewList = [];
        this.options = $.extend({}, QuantumBitMachineView.defaultOptions, options);
        var i, amplitudeViewOptions = {
            color: this.options.color,
            scale: this.options.scale,
            displayBox: this.options.displayBox
        }, tr, td, table = $('<table class="QuantumBitMachineView"></table>');
        table.addClass('nqubits-' + machine.nQubits);
        for (i = 0; i < machine.amplitudeList.length; ++i) {
            if (i % this.options.amplitudesPerRow == 0)
                tr = $("<tr></tr>").appendTo(table);
            td = $("<td></td>").appendTo(tr);
            var amplitudeView = new AmplitudeView(machine.amplitudeList[i], amplitudeViewOptions);
            this.amplitudeViewList.push(amplitudeView);
            amplitudeView.elt.appendTo(td);
            td.append("<br/>");
            $('<span></span>').text(zeroFillBinary(i, machine.nQubits)).appendTo(td);
        }
        table.appendTo(parentElement);
    };
    QuantumBitMachineView.defaultOptions = {
        amplitudesPerRow: 8,
        // these options, if provided, are passed to each AmplitudeView
        color: undefined,
        scale: undefined,
        displayBox: undefined
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

    var QuantumCircuitView = function (parentElement, nQubits, operations, options) {
        // fixme: make operations modifiable (or make it reference a
        // machine, and have an update() method that also calls the
        // machine)
        this.options = $.extend({}, QuantumCircuitView.defaultOptions, options);
        this.elt = $('<span class="QuantumCircuitView"></span>').appendTo(parentElement);
        var i, x, y,
            margin = 10 * this.options.scale,
            gridSize = this.options.scale * 64 + 2 * this.options.extraPadding,
            headerHeight = gridSize * 1.5,
            markerHeight = 10 * this.options.scale,
            markerOverflow = 6 * this.options.scale,
            paper = Raphael(this.elt[0], gridSize * nQubits + 1 + 2 * margin, headerHeight + gridSize * operations.length + 1 + 2 * margin + markerHeight / 2);

        // header
        paper.rect(margin, margin, nQubits * gridSize, headerHeight).attr({fill: "rgba(200, 200, 200, .6)", stroke: "none"});
        x = (nQubits * gridSize) / 2 + margin;
        y = gridSize / 2 + margin;
        paper.text(x, y, nQubits + " " + (nQubits == 1 ? "bit" : "bits")).attr({'font-size': 24 * this.options.scale});
        // horizontal lines
        x = nQubits * gridSize + margin;
        for (i = 0; i < operations.length + 1; ++i) {
            y = i * gridSize + headerHeight + margin;
            paper.path("M" + margin + "," + y + " L" + x + "," + y);
        }
        paper.path("M" + margin + "," + margin + " L" + x + "," + margin);
        // vertical lines
        y = operations.length * gridSize + headerHeight + margin;
        for (i = 0; i < nQubits + 1; ++i) {
            x = i * gridSize + margin;
            paper.path("M" + x + "," + ((i % nQubits == 0 ? 0 : headerHeight) + margin) + " L" + x + "," + y);
        }

        // display the relevant operation in each cell
        for (var j = 0; j < operations.length; ++j) {
            y = headerHeight + gridSize * (j + .5) + margin;
            var calculateX = function (i) {
                return gridSize * (nQubits - i - .5) + margin;
            };
            gateRenderer[operations[j][0].name](paper, this.options.scale, calculateX, y, operations[j], nQubits);
        }

        // create the marker
        if (this.options.showMarker) {
            this.marker = paper.rect(margin - markerOverflow, margin + headerHeight - markerHeight / 2, gridSize * nQubits + 2 * markerOverflow, markerHeight).attr({fill: '#ff0'});
        }
    };
    QuantumCircuitView.prototype.update = function (operationsComplete) {
        // fixme: gridSize is defined above
        var gridSize = this.options.scale * 64 + 2 * this.options.extraPadding;
        if (this.options.showMarker) {
            this.marker.animate({transform: 'T0,' + (operationsComplete * gridSize)}, 100);
        }
    };
    QuantumCircuitView.defaultOptions = {
        showMarker: true,
        scale: 1,
        extraPadding: 0
    };

    var gateRenderer = {
        X: function (paper, scale, calculateX, y, args) {
            paper.text(calculateX(args[1]), y, 'X').attr({'font-size': 32 * scale, 'fill': '#a00'});
        },
        Z: function (paper, scale, calculateX, y, args) {
            paper.text(calculateX(args[1]), y, 'Z').attr({'font-size': 32 * scale, 'fill': '#a00'});
        },
        T: function (paper, scale, calculateX, y, args) {
            paper.text(calculateX(args[1]), y, 'T').attr({'font-size': 32 * scale, 'fill': '#a00'});
        },
        H: function (paper, scale, calculateX, y, args) {
            paper.text(calculateX(args[1]), y, 'H').attr({'font-size': 32 * scale, 'fill': '#a00'});
        },
        CNOT: function (paper, scale, calculateX, y, args) {
            paper.circle(calculateX(args[1]), y, 6 * scale).attr({'fill': '#00a'});
            paper.text(calculateX(args[2]), y, 'X').attr({'font-size': 32 * scale, 'fill': '#a00'});
        },
        CCNOT: function (paper, scale, calculateX, y, args) {
            paper.circle(calculateX(args[1]), y, 6 * scale).attr({'fill': '#00a'});
            paper.circle(calculateX(args[2]), y, 6 * scale).attr({'fill': '#00a'});
            paper.text(calculateX(args[3]), y, 'X').attr({'font-size': 32 * scale, 'fill': '#a00'});
        },
        randomize: function (paper, scale, calculateX, y, args, nQubits) {
            for (var i = 0; i < nQubits; ++i) {
                paper.text(calculateX(i), y, '?').attr({'font-size': 32 * scale, 'fill': '#a00'});
            }
        },
        measure: function (paper, scale, calculateX, y, args) {
            for (var i = 2; i < args.length; ++i) {
                // icon from http://raphaeljs.com/icons/ (MIT license, Copyright 2008 Dmitry Baranovskiy)
                var measurement_icon = "M29.772,26.433l-7.126-7.126c0.96-1.583,1.523-3.435,1.524-5.421C24.169,8.093,19.478,3.401,13.688,3.399C7.897,3.401,3.204,8.093,3.204,13.885c0,5.789,4.693,10.481,10.484,10.481c1.987,0,3.839-0.563,5.422-1.523l7.128,7.127L29.772,26.433zM7.203,13.885c0.006-3.582,2.903-6.478,6.484-6.486c3.579,0.008,6.478,2.904,6.484,6.486c-0.007,3.58-2.905,6.476-6.484,6.484C10.106,20.361,7.209,17.465,7.203,13.885z";
                paper.path(measurement_icon).attr({fill: "#090", stroke: "none"}).transform("S" + scale + "T" + (calculateX(args[i]) - 16) + "," + (y - 16));
            }
        },
        // these operations should never be passed to a circuit diagram (they should be filtered out first)
        globalPhase: null,
        rescale: null
    };

    return {
        AmplitudeView: AmplitudeView,
        QuantumBitMachineView: QuantumBitMachineView,
        QuantumCircuitView: QuantumCircuitView,
        gateRenderer: gateRenderer
    };

})(jQuery));
