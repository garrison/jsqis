// depends: jsqis-core.js
//
// depends: jQuery
// depends: raphael

jQuery.extend(window.jsqis, (function ($, Raphael) {

    var PhotonView = function (parentElement, machine, options) {
        this.options = $.extend({}, PhotonView.defaultOptions, options);
        var r1 = 50 * this.options.scale,
            r2 = 5 * this.options.scale;
        this.paper = Raphael(parentElement[0], 2 * r1, 2 * r1);
        this.paper.circle(r1, r1, r1 - r2).attr({fill: "r#aaa-#fff", stroke: "none"});
        this.circle = this.paper.circle(r1, r1, r2).attr({fill: "#00a", stroke: "#00e"});
        this.t = 0;
        this.r3 = r1 - r2;
        this.update(machine);
        this.render();
    };
    PhotonView.defaultOptions = {
        scale: 1
    };
    PhotonView.prototype.update = function (machine) {
        // fixme: assert machine.nQubits == 1
        this.amplitude1 = machine.amplitudeList[0].abs();
        this.amplitude2 = machine.amplitudeList[1].abs();
        this.phase1 = machine.amplitudeList[0].arg();
        this.phase2 = machine.amplitudeList[1].arg();
    };
    PhotonView.prototype.render = function () {
        var x = this.amplitude2 * Math.sin(this.t + this.phase2),
            y = this.amplitude1 * Math.sin(this.t + this.phase1);
        this.circle.transform("T" + (x * this.r3) + "," + (-y * this.r3));
    };
    PhotonView.prototype.toggleAnimation = function (status) {
        var self = this;
        if (status === undefined) {
            // if status is not given, switch it.
            status = (this.intervalID === undefined);
        }
        if (status && this.intervalID === undefined) {
            // start animation
            this.intervalID = window.setInterval(function () {
                self.t += .05;
                self.render();
            }, 10);
        } else if (!status && this.intervalID !== undefined) {
            // stop animation
            window.clearInterval(this.intervalID);
            this.intervalID = undefined;
        }
    };

    return {
        PhotonView: PhotonView
    };

})(jQuery, Raphael));
