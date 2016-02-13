//standard mocha with built in assert
var assert = require('assert');
describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        });
    });
});


//with chai
var expect = require('chai').expect;

describe("Cow", function () {
    describe("constructor", function () {
        it("should have a default name", function () {
            var cow = new Cow();
            expect(cow.name).to.equal("Anon cow");
        });

        it("should set cow's name if provided", function () {
            var cow = new Cow("Kate");
            expect(cow.name).to.equal("Kate");
        });
    });

    describe("#greets", function () {
        it("should throw if no target is passed in", function () {
            expect(function () {
                (new Cow()).greets();
            }).to.throw(Error);
        });

        it("should greet passed target", function () {
            var greetings = (new Cow("Kate")).greets("Baby");
            expect(greetings).to.equal("Kate greets Baby");
        });
    });
});


function Cow(name) {
    this.name = name || "Anon cow";
}
exports.Cow = Cow;

Cow.prototype = {
    greets: function (target) {
        if (!target)
            throw new Error("missing target");
        return this.name + " greets " + target;
    }
};
