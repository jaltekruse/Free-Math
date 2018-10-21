var assert = require("assert");
var vector = require("../vector.js");

describe("kvector", function() {

    it('vector.add should add two 2D vectors', function() {
        var result = vector.add([1, 2], [3, 4]);
        assert.deepEqual(result, [4, 6]);
    });

    it('vector.add should add two 3D vectors', function() {
        var result = vector.add([1, 2, 3], [4, 5, 6]);
        assert.deepEqual(result, [5, 7, 9]);
    });

    it('vector.add should add three 2D vectors', function() {
        var result = vector.add([1, 2], [3, 4], [5, 6]);
        assert.deepEqual(result, [9, 12]);
    });

    it('vector.subtract should subtract two 2D vectors', function() {
        var result = vector.subtract([1, 2], [3, 4]);
        assert.deepEqual(result, [-2, -2]);
    });

    it('vector.subtract should subtract two 3D vectors', function() {
        var result = vector.subtract([1, 2, 3], [4, 5, 6]);
        assert.deepEqual(result, [-3, -3, -3]);
    });

    it('vector.dot should take the dot product of 2 2D vectors', function() {
        var result = vector.dot([1, 2], [3, 4]);
        assert.strictEqual(result, 3 + 8);
    });

    it('vector.dot should take the dot product of 2 3D vectors', function() {
        var result = vector.dot([1, 2, 3], [4, 5, 6]);
        assert.strictEqual(result, 4 + 10 + 18);
    });

    it('vector.scale should scale a 2D vector', function() {
        var result = vector.scale([4, 2], 0.5);
        assert.deepEqual(result, [2, 1]);
    });

    it('vector.scale should scale a 3D vector', function() {
        var result = vector.scale([1, 2, 3], 2);
        assert.deepEqual(result, [2, 4, 6]);
    });

    it('vector.length should take the length of a 2D vector', function() {
        var result = vector.length([3, 4]);
        assert.strictEqual(result, 5);
    });

    it('vector.length should take the length of a 3D vector', function() {
        var result = vector.length([4, 0, 3]);
        assert.strictEqual(result, 5);
    });

    it('vector.equal should return true on two equal 3D vectors', function() {
        var result = vector.equal([6, 3, 4], [6, 3, 4]);
        assert.strictEqual(result, true);
    });

    it('vector.equal should return false on two inequal 3D vectors', function() {
        var result = vector.equal([6, 3, 4], [6, 4, 4]);
        assert.strictEqual(result, false);
    });

    it('vector.equal should return false on a 2D and 3D vector', function() {
        var result = vector.equal([6, 4], [6, 4, 4]);
        assert.strictEqual(result, false);
    });

    it('vector.equal should return false on a 2D and 3D vector', function() {
        var result = vector.equal([6, 3, 4], [6, 3]);
        assert.strictEqual(result, false);
    });

    it('vector.equal should return false on a 2D and 3D vector with a trailing 0', function() {
        var result = vector.equal([6, 3, 0], [6, 3]);
        assert.strictEqual(result, false);
    });

    it("vector.collinear should return true on two collinear vectors of "
            + "the same magnitude but different direction", function() {
        var result = vector.collinear([3, 3], [-3, -3]);
        assert.strictEqual(result, true);
    });

    it("vector.collinear should return true on two collinear vectors of "
            + "different magnitudes", function() {
        var result = vector.collinear([2, 1], [6, 3]);
        assert.strictEqual(result, true);
    });

    it("vector.collinear should return false on non-collinear vectors",
            function() {
        var result = vector.collinear([1, 2], [-1, 2]);
        assert.strictEqual(result, false);
    });

    it("vector.negate of [-2, 2] is [2, -2]", function() {
        var result = vector.negate([-2, 2]);
        assert.deepEqual(result, [2, -2]);
    });

});
