import {expect} from "chai";
import {getWebglFeaturesFromLayers} from "@shared/js/utils/getWebglFeaturesFromLayers.js";

describe("getWebglFeaturesFromLayers", () => {
    const featureMock = {id: 1};

    const vectorTileLayerMock = {
        get: key => {
            if (key === "typ") {
                return "VectorTile";
            }
            if (key === "renderer") {
                return "webgl";
            }
            return undefined;
        }
    };

    const normalLayerMock = {
        get: key => {
            if (key === "typ") {
                return "Vector";
            }
            if (key === "renderer") {
                return "webgl";
            }
            return undefined;
        },
        getSource: () => ({
            forEachFeatureIntersectingExtent: (extent, cb) => cb(featureMock)
        })
    };

    const mapMock = {
        getPixelFromCoordinate: () => [0, 0],
        forEachFeatureAtPixel: (pixel, cb) => cb(featureMock, vectorTileLayerMock)
    };

    /**
     * Returns a fixed hitBox extent for testing purposes.
     * Format: [minX, minY, maxX, maxY]
     *
     * @returns {number[]} The test hitBox extent.
     */
    function hitBoxFn () {
        return [0, 0, 1, 1];
    }

    it("returns a GFI feature for VectorTile WebGL layer", () => {
        const result = getWebglFeaturesFromLayers(mapMock, [vectorTileLayerMock], hitBoxFn);

        expect(result).to.have.lengthOf(1);

        const gfi = result[0];

        expect(gfi).to.respondTo("getOlFeature");
        expect(gfi).to.respondTo("getLayerId");

        expect(gfi.getOlFeature()).to.equal(featureMock);
    });

    it("returns a GFI feature for normal WebGL layer", () => {
        const result = getWebglFeaturesFromLayers(mapMock, [normalLayerMock], hitBoxFn);

        expect(result).to.have.lengthOf(1);

        const gfi = result[0];

        expect(gfi.getOlFeature()).to.equal(featureMock);
    });

    it("skips layer if hitBoxFn returns null", () => {
        const result = getWebglFeaturesFromLayers(mapMock, [vectorTileLayerMock], () => null);

        expect(result).to.have.lengthOf(0);
    });

    it("processes multiple layers correctly", () => {
        const result = getWebglFeaturesFromLayers(
            mapMock,
            [vectorTileLayerMock, normalLayerMock],
            hitBoxFn
        );

        expect(result).to.have.lengthOf(2);
    });
});
