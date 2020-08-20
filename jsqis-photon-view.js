import jQuery from "jquery";
const $ = jQuery;
const Raphael = require("raphael");

var PhotonView = function (parentElement, machine, options) {
    this.options = $.extend({}, PhotonView.defaultOptions, options);
    var r1 = 50 * this.options.scale,
        r2 = 5 * this.options.scale;
    this.elt = $('<span class="PhotonView"></span>').appendTo(parentElement);
    this.paper = Raphael(this.elt[0], 2 * r1, 2 * r1);
    this.paper.circle(r1, r1, r2 / 2).attr({fill: "#aaa", stroke: "none"});
    this.circle = this.paper.circle(r1, r1, r2).attr({fill: "#00a", stroke: "#00e"});
    this.r3 = r1 - r2;
    this.update(machine);
    this.offsetTime = 0;
    this.lastFrameTime = 0;
    this.animationInProgress = false;
    this.render(0);
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
PhotonView.prototype.render = function (t) {
    var x = this.amplitude2 * Math.sin(t + this.phase2),
        y = this.amplitude1 * Math.sin(t + this.phase1);
    this.circle.transform("T" + (x * this.r3) + "," + (-y * this.r3));
};
PhotonView.prototype.toggleAnimation = function (status) {
    var self = this;
    var animateFrame = function (time) {
        if (!self.animationInProgress) {
            self.offsetTime += time - self.lastFrameTime;
            self.animationInProgress = true;
        }
        self.lastFrameTime = time;
        self.render((time - self.offsetTime) / 200);
        self.intervalID = window.requestAnimationFrame(animateFrame);
    };
    if (status === undefined) {
        // if status is not given, toggle it.
        status = (this.intervalID === undefined);
    }
    if (status && this.intervalID === undefined) {
        // start animation
        this.intervalID = window.requestAnimationFrame(animateFrame);
    } else if (!status && this.intervalID !== undefined) {
        // stop animation
        window.cancelAnimationFrame(this.intervalID);
        this.intervalID = undefined;
        this.animationInProgress = false;
    }
};

export default PhotonView;
