import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import {Icon, Style} from "ol/style.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";
import sinon from "sinon";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";

import createStyledFeatures from "@core/maps/js/zoomToCreateStyledFeatures";

describe("src/core/maps/js/zoomToCreateStyledFeatures.js", () => {
    const consoleSpy = sinon.spy(),
        styleObject = {
            styleId: "myStyle",
            rules: [{
                style: {
                    type: "circle",
                    circleFillColor: [255, 255, 0, 0.9],
                    circleRadius: 8,
                    circleStrokeColor: [0, 0, 0, 1],
                    circleStrokeWidth: 2
                }
            }]
        };

    beforeEach(() => {
        sinon.stub(createStyle, "createStyle");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should return an array of Features using a Point as its geometry and containing a style", () => {
        sinon.stub(styleList, "returnStyleObject").returns(styleObject);
        const features = [{
                getGeometry: () => ({
                    getExtent: () => [567001.606, 5934414.862, 567085.524, 5934496.754]
                })
            }],
            styledFeatures = createStyledFeatures(features, undefined, true);

        expect(styledFeatures.length).to.equal(1);
        expect(styledFeatures[0] instanceof Feature).to.be.true;
        expect(styledFeatures[0].getGeometry() instanceof Point).to.be.true;
    });

    it("should return an array of Features using a Point as its geometry and containing a style created by the requested styleModel", () => {
        sinon.stub(styleList, "returnStyleObject").returns(styleObject);
        const features = [{
                getGeometry: () => ({
                    getExtent: () => [567001.606, 5934414.862, 567085.524, 5934496.754]
                })
            }],
            styleId = "myStyle",
            styledFeatures = createStyledFeatures(features, styleId, true);

        expect(styledFeatures.length).to.equal(1);
        expect(styledFeatures[0] instanceof Feature).to.be.true;
        expect(styledFeatures[0].getGeometry() instanceof Point).to.be.true;
    });

    it("should return an array of Features using a Point as its geometry and containing a style with an Icon", () => {
        sinon.stub(console, "warn").callsFake(consoleSpy);
        // NOTE: This test should be removed in v3.0.0!
        const features = [{
                getGeometry: () => ({
                    getExtent: () => [567001.606, 5934414.862, 567085.524, 5934496.754]
                })
            }],
            styleId = "https://myStyle.com",
            styledFeatures = createStyledFeatures(features, styleId, true);

        expect(styledFeatures.length).to.equal(1);
        expect(styledFeatures[0] instanceof Feature).to.be.true;
        expect(styledFeatures[0].getGeometry() instanceof Point).to.be.true;
        expect(styledFeatures[0].getStyle() instanceof Style).to.be.true;
        expect(styledFeatures[0].getStyle().getImage() instanceof Icon).to.be.true;
        expect(styledFeatures[0].getStyle().getImage().getSrc()).to.equal(styleId);
    });

    it("should return an array of Features using a Polygon as its geometry and containing a style created by the requested styleModel", () => {
        sinon.stub(console, "warn").callsFake(consoleSpy);
        const features = [new Feature({
                geometry: new Polygon([[[565086.1948534324, 5934664.461947621], [565657.6945448224, 5934738.54524095], [565625.9445619675, 5934357.545446689], [565234.3614400891, 5934346.962119071], [565086.1948534324, 5934664.461947621]]])
            })],
            styleId = "myStyle",
            styledFeatures = createStyledFeatures(features, styleId, false);

        expect(styledFeatures.length).to.equal(1);
        expect(styledFeatures[0] instanceof Feature).to.be.true;
        expect(styledFeatures[0].getGeometry() instanceof Polygon).to.be.true;
        expect(styledFeatures[0].getStyle() instanceof Style).to.be.true;
    });

    it("should return an array of Features using a Point as its geometry for Point-Features and containing a style created by the requested styleModel", () => {
        sinon.stub(console, "warn").callsFake(consoleSpy);
        const features = [new Feature({
                geometry: new Polygon([[[565086.1948534324, 5934664.461947621], [565657.6945448224, 5934738.54524095], [565625.9445619675, 5934357.545446689], [565234.3614400891, 5934346.962119071], [565086.1948534324, 5934664.461947621]]])
            })],
            styleId = "myStyle",
            styledFeatures = createStyledFeatures(features, styleId, true);

        expect(styledFeatures.length).to.equal(1);
        expect(styledFeatures[0] instanceof Feature).to.be.true;
        expect(styledFeatures[0].getGeometry() instanceof Point).to.be.true;
        expect(styledFeatures[0].getStyle() instanceof Style).to.be.true;
    });
});
