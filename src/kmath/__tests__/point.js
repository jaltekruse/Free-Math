var assert = require("assert");

var point = require("../point.js");

describe("kpoint", function() {
    it('point.compare should return positive if the first element is larger', function() {
        var result = point.compare([5, 2], [3, 4]);
        assert.strictEqual(result > 0, true);
    });

    it('point.compare should return negative if the first element is smaller', function() {
        var result = point.compare([2, 2], [4, 0]);
        assert.strictEqual(result < 0, true);
    });

    it('point.compare should return positive if the second element is larger', function() {
        var result = point.compare([5, 2], [5, 1]);
        assert.strictEqual(result > 0, true);
    });

    it('point.compare should return negative if the second element is smaller', function() {
        var result = point.compare([2, 2], [2, 4]);
        assert.strictEqual(result < 0, true);
    });

    it('point.compare should return positive if the third element is larger', function() {
        var result = point.compare([5, 3, -2], [5, 3, -4]);
        assert.strictEqual(result > 0, true);
    });

    it('point.compare should return negative if the third element is smaller', function() {
        var result = point.compare([2, -1, -4], [2, -1, -2]);
        assert.strictEqual(result < 0, true);
    });

    it('point.compare should return 0 if the vectors are equal', function() {
        var result = point.compare([2, 4, 3], [2, 4, 3]);
        assert.strictEqual(result, 0);
    });

    it('point.compare should return negative if v1 is shorter than v2', function() {
        var result = point.compare([2, 4], [2, 4, 3]);
        assert.strictEqual(result < 0, true);
    });

    it('point.compare should return positive if v1 is longer than v2', function() {
        var result = point.compare([2, 4, -2], [2, 2]);
        assert.strictEqual(result > 0, true);
    });
});
