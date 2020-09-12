QUnit.module("assertion framework");
QUnit.test("assert passed", function (assert) {
    assert.equal(jsqis.assert(true), undefined, "Passed!");
});
QUnit.test("assert failed", function (assert) {
    assert.throws(function () {
        jsqis.assert(false);
    }, "Passed!");
});

QUnit.module("QuantumBitMachine options");
QUnit.test("default options", function (assert) {
    var machine = new jsqis.QuantumBitMachine(1);
    assert.strictEqual(machine.options.rescaleStrategy, "unity");
});
QUnit.test("override default options", function (assert) {
    var machine = new jsqis.QuantumBitMachine(1, {rescaleStrategy: "max"});
    assert.strictEqual(machine.options.rescaleStrategy, "max");
});
