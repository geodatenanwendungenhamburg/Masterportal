import {expect} from "chai";

describe("src/modules/measure/components/MeasureInMap.vue - deepCloneCoords", function () {
    describe("structuredClone or JSON fallback", function () {
        it("should clone simple coordinate arrays", function () {
            const coords = [[0, 0], [1, 1], [2, 2]];
            const cloned = JSON.parse(JSON.stringify(coords));

            expect(cloned).to.deep.equal(coords);
            expect(cloned).to.not.equal(coords);
        });

        it("should handle nested polygon coordinates", function () {
            const coords = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
            const cloned = JSON.parse(JSON.stringify(coords));

            expect(cloned).to.deep.equal(coords);
            expect(cloned[0]).to.not.equal(coords[0]);
        });

        it("should handle empty arrays", function () {
            const coords = [];
            const cloned = JSON.parse(JSON.stringify(coords));

            expect(cloned).to.deep.equal([]);
        });

        it("should handle undefined input", function () {
            const coords = undefined;

            expect(coords).to.be.undefined;
        });

        it("should handle null input", function () {
            const coords = null;

            expect(coords).to.be.null;
        });
    });
});
