module("assertion framework");
test("assert passed", function () {
    ok(jsqis.assert(true) === undefined, "Passed!");
});
test("assert failed", function () {
    throws(function () {
        jsqis.assert(false);
    }, "Passed!");
});

module("QuantumBitMachine options");
test("default options", function () {
    var machine = new jsqis.QuantumBitMachine(1);
    strictEqual(machine.options.rescaleStrategy, "unity");
});
test("override default options", function () {
    var machine = new jsqis.QuantumBitMachine(1, {rescaleStrategy: "max"});
    strictEqual(machine.options.rescaleStrategy, "max");
});
