import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import {processDoubleCircleFeatures} from "../../../js/processDoubleCircleFeatures.js";

describe("src/shared/modules/exportItem/js/processDoubleCircleFeatures.js", () => {
    /**
     * Creates a mock feature with masterportal_attributes.
     * @param {Object} attrs - The masterportal_attributes to set.
     * @returns {module:ol/Feature} The created feature.
     */
    function createFeatureWithAttributes (attrs) {
        const feature = new Feature({geometry: new Point([0, 0])});

        feature.set("masterportal_attributes", attrs);
        return feature;
    }

    describe("processDoubleCircleFeatures", () => {
        it("should return the features array unchanged if no geo-circle features exist", () => {
            const features = [
                createFeatureWithAttributes({someAttr: "value"}),
                createFeatureWithAttributes({otherAttr: 42})
            ];

            const result = processDoubleCircleFeatures(features);

            expect(result).to.equal(features);
            expect(result).to.have.lengthOf(2);
        });

        it("should return features unchanged if there is only one geo-circle feature", () => {
            const features = [
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 100
                })
            ];

            const result = processDoubleCircleFeatures(features);

            expect(result).to.have.lengthOf(1);
            expect(result[0].get("masterportal_attributes").geoCircleRadius).to.equal(100);
        });

        it("should return features unchanged if two geo-circles have different centers", () => {
            const features = [
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 100
                }),
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "30,40",
                    geoCircleRadius: 200
                })
            ];

            const result = processDoubleCircleFeatures(features);

            expect(result[0].get("masterportal_attributes").geoCircleRadius).to.equal(100);
            expect(result[1].get("masterportal_attributes").geoCircleRadius).to.equal(200);
        });

        it("should return features unchanged if two geo-circles share a center but lack outerColorContour", () => {
            const features = [
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 200,
                    fromDrawTool: true,
                    drawState: {colorContour: [0, 0, 0], color: [255, 0, 0]}
                }),
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 100
                })
            ];

            const result = processDoubleCircleFeatures(features);

            expect(result[0].get("masterportal_attributes").geoCircleRadius).to.equal(200);
            expect(result[1].get("masterportal_attributes").geoCircleRadius).to.equal(100);
        });

        it("should split draw state into inner and outer for a valid double circle pair", () => {
            const features = [
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 200,
                    fromDrawTool: true,
                    drawState: {
                        colorContour: [0, 0, 0],
                        color: [255, 0, 0],
                        outerColorContour: [0, 255, 0],
                        outerColorFill: [0, 0, 255],
                        circleOuterRadius: 300,
                        circleRadius: 100
                    }
                }),
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 100
                })
            ];

            const result = processDoubleCircleFeatures(features);

            const outerAttrs = result[0].get("masterportal_attributes"),
                innerAttrs = result[1].get("masterportal_attributes");

            expect(outerAttrs.drawState.colorContour).to.deep.equal([0, 255, 0]);
            expect(outerAttrs.drawState.color).to.deep.equal([0, 0, 255]);
            expect(outerAttrs.drawState.circleRadius).to.equal(300);
            expect(outerAttrs.drawState).to.not.have.property("outerColorContour");
            expect(outerAttrs.drawState).to.not.have.property("outerColorFill");

            expect(innerAttrs.drawState).to.not.have.property("outerColorContour");
            expect(innerAttrs.drawState).to.not.have.property("outerColorFill");
        });

        it("should assign outer draw state to the feature with the larger radius", () => {
            const features = [
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 50
                }),
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 200,
                    fromDrawTool: true,
                    drawState: {
                        colorContour: [0, 0, 0],
                        color: [255, 0, 0],
                        outerColorContour: [0, 255, 0],
                        outerColorFill: [0, 0, 255],
                        circleOuterRadius: 300,
                        circleRadius: 100
                    }
                })
            ];

            const result = processDoubleCircleFeatures(features);

            const attrs0 = result[0].get("masterportal_attributes"),
                attrs1 = result[1].get("masterportal_attributes");

            // idx0 has smaller radius (50) -> inner
            expect(attrs0.geoCircleRadius).to.equal(50);
            expect(attrs0.drawState).to.not.have.property("outerColorContour");

            // idx1 has larger radius (200) -> outer
            expect(attrs1.geoCircleRadius).to.equal(200);
            expect(attrs1.drawState.colorContour).to.deep.equal([0, 255, 0]);
        });

        it("should handle an empty features array", () => {
            const result = processDoubleCircleFeatures([]);

            expect(result).to.be.an("array").that.is.empty;
        });

        it("should skip groups with more than two circles at the same center", () => {
            const features = [
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 100,
                    fromDrawTool: true,
                    drawState: {outerColorContour: [0, 255, 0]}
                }),
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 200
                }),
                createFeatureWithAttributes({
                    isGeoCircle: true,
                    geoCircleCenter: "10,20",
                    geoCircleRadius: 300
                })
            ];

            const result = processDoubleCircleFeatures(features);

            expect(result[0].get("masterportal_attributes").geoCircleRadius).to.equal(100);
            expect(result[1].get("masterportal_attributes").geoCircleRadius).to.equal(200);
            expect(result[2].get("masterportal_attributes").geoCircleRadius).to.equal(300);
        });
    });
});
