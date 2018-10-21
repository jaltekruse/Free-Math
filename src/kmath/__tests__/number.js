var assert = require("assert");

var number = require("../number.js");

describe("knumber", function() {
    it('two equal numbers should be equal', function() {
        var result = number.equal(1 / 3, 1 / 90 * 30);
        assert.strictEqual(result, true);
    });

    it('two different numbers should be equal', function() {
        var result = number.equal(1 / 3, 1.333333);
        assert.strictEqual(result, false);
    });

    it('Infinity should equal Infinity', function() {
        var result = number.equal(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY
        );
        assert.strictEqual(result, true);
    });

    it('+Infinity should not equal -Infinity', function() {
        var result = number.equal(
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        );
        assert.strictEqual(result, false);
    });

    it('sign(0) should be 0', function() {
        assert.strictEqual(number.sign(0), 0);
    });

    it('sign(-0.0) should be 0', function() {
        assert.strictEqual(number.sign(-0.0), 0);
    });

    it('sign(3.2) should be 1', function() {
        assert.strictEqual(number.sign(3.2), 1);
    });

    it('sign(-2.8) should be -1', function() {
        assert.strictEqual(number.sign(-2.8), -1);
    });

    it('isInteger(-2.8) should be false', function() {
        assert.strictEqual(number.isInteger(-2.8), false);
    });

    it('isInteger(-2) should be true', function() {
        assert.strictEqual(number.isInteger(-2), true);
    });

    it('toFraction(-2) should be -2/1', function() {
        assert.deepEqual(number.toFraction(-2), [-2, 1]);
    });

    it('toFraction(-2.5) should be -5/2', function() {
        assert.deepEqual(number.toFraction(-2.5), [-5, 2]);
    });

    it('toFraction(2/3) should be 2/3', function() {
        assert.deepEqual(number.toFraction(2/3), [2, 3]);
    });

    it('toFraction(283.33...) should be 850/3', function() {
        assert.deepEqual(number.toFraction(283 + 1/3), [850, 3]);
    });

    it('toFraction(0) should be 0/1', function() {
        assert.deepEqual(number.toFraction(0), [0, 1]);
    });

    it('toFraction(pi) should be pi/1', function() {
        assert.deepEqual(number.toFraction(Math.PI), [Math.PI, 1]);
    });

    it('toFraction(0.66) should be 33/50', function() {
        assert.deepEqual(number.toFraction(0.66), [33, 50]);
    });

    it('toFraction(0.66, 0.01) should be 2/3', function() {
        assert.deepEqual(number.toFraction(0.66, 0.01), [2, 3]);
    });
});
