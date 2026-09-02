import {expect} from "chai";
import sinon from "sinon";
import layerCollection from "@core/layers/js/layerCollection.js";
import {union, getDistance, getNearbyTitleText, getVectorFeaturesInCircle} from "@modules/orientation/utils/poiFeatureSearch.js";

describe("src/modules/orientation/utils/poiFeatureSearch.js", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("union", () => {
        it("merges two arrays removing duplicates found via equality function", () => {
            const result = union([1, 2, 3], [2, 3, 4], (a, b) => a === b);

            expect(result).to.deep.equal([1, 2, 3, 4]);
        });

        it("returns the untouched first array if the second array is empty", () => {
            const result = union([1, 2], [], (a, b) => a === b);

            expect(result).to.deep.equal([1, 2]);
        });
    });

    describe("getDistance", () => {
        it("returns the rounded distance between the feature and the center position", () => {
            const feature = {
                getGeometry: () => ({
                    getClosestPoint: () => [0, 0]
                })
            };

            expect(getDistance(feature, [3, 4])).to.equal(5);
        });

        it("returns 0 if the closest point equals the center position", () => {
            const feature = {
                getGeometry: () => ({
                    getClosestPoint: () => [10, 10]
                })
            };

            expect(getDistance(feature, [10, 10])).to.equal(0);
        });
    });

    describe("getNearbyTitleText", () => {
        it("returns the value of a single string attribute wrapped in an array", () => {
            const feature = {get: attr => attr === "name" ? "Museum" : undefined};

            expect(getNearbyTitleText(feature, "name")).to.deep.equal(["Museum"]);
        });

        it("returns all values found for an array of attribute keys", () => {
            const feature = {
                get: attr => {
                    if (attr === "name") {
                        return "Museum";
                    }
                    if (attr === "street") {
                        return "Hauptstraße";
                    }
                    return undefined;
                }
            };

            expect(getNearbyTitleText(feature, ["name", "street", "missing"])).to.deep.equal(["Museum", "Hauptstraße"]);
        });

        it("returns an empty array if the attribute key is neither string nor array", () => {
            const feature = {get: () => "irrelevant"};

            expect(getNearbyTitleText(feature, undefined)).to.deep.equal([]);
        });
    });

    describe("getVectorFeaturesInCircle", () => {
        /**
         * Creates a lightweight fake feature that satisfies getDistance's usage of getGeometry().getClosestPoint().
         * @param {String} id The feature id.
         * @param {Number[]} coordinate The coordinate returned as closest point.
         * @returns {Object} A fake ol/Feature-like object.
         */
        function makeFeature (id, coordinate) {
            return {
                getGeometry: () => ({getClosestPoint: () => coordinate}),
                getStyle: () => null,
                getId: () => id,
                get: attr => attr === "name" ? "POI name" : undefined
            };
        }

        it("returns features of visible WFS layers within the given distance with assigned metadata", () => {
            const nearFeature = makeFeature("near", [0, 5]),
                farFeature = makeFeature("far", [0, 5000]),
                fakeLayer = {
                    getLayerSource: () => ({
                        getFeaturesInExtent: () => [nearFeature, farFeature]
                    }),
                    get: key => ({styleId: "style1", name: "MyLayer", nearbyTitle: "name"}[key])
                };

            sinon.stub(layerCollection, "getLayerById").returns(fakeLayer);

            const result = getVectorFeaturesInCircle({
                layerConfigs: [{typ: "WFS", visibility: true, id: "1"}],
                distance: 100,
                centerPosition: [0, 0],
                onlyFilteredFeatures: false
            });

            expect(result).to.have.lengthOf(1);
            expect(result[0].getId()).to.equal("near");
            expect(result[0].styleId).to.equal("style1");
            expect(result[0].layerName).to.equal("MyLayer");
            expect(result[0].dist2Pos).to.equal(5);
        });

        it("returns an empty array if no layer config is a visible WFS layer", () => {
            const result = getVectorFeaturesInCircle({
                layerConfigs: [{typ: "WMS", visibility: true, id: "1"}, {typ: "WFS", visibility: false, id: "2"}],
                distance: 100,
                centerPosition: [0, 0],
                onlyFilteredFeatures: false
            });

            expect(result).to.deep.equal([]);
        });
    });
});
