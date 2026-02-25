import {expect} from "chai";
import {getWebglFeaturesFromLayers} from "@shared/js/utils/getWebglFeaturesFromLayers.js";
import VectorTileLayer from "ol/layer/VectorTile.js";

describe("getWebglFeaturesFromLayers", () => {

    const featureMock = {
        getId: () => 1
    };

    /**
     * Mock VectorTileLayer for unit tests.
     */
    class VectorTileLayerMock extends VectorTileLayer {}
    const vectorTileLayerMock = new VectorTileLayerMock();


    const normalLayerMock = {
        getSource: () => ({
            forEachFeatureIntersectingExtent: (extent, cb) => {
                cb(featureMock);
            }
        })
    };

    const mapMock = {
        getPixelFromCoordinate: () => [0, 0],
        forEachFeatureAtPixel: (pixel, cb) => cb(featureMock, vectorTileLayerMock)
    };

    /**
     * Returns a fixed hit box for unit testing.
     *
     * @returns {number[]} Array representing [minX, minY, maxX, maxY].
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
