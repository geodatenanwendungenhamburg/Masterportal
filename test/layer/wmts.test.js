import {get as getProjection} from "ol/proj";
import {getWidth} from "ol/extent";

import * as wmts from "../../src/layer/wmts";

describe("wmts.js", function () {
    describe("generateArrays", function () {
        it("should fill the arrays resolutions and matrixIds with numbers", function () {
            const size = getWidth(getProjection("EPSG:3857").getExtent()) / 256,
                resLength = 20,
                resolutions = new Array(resLength),
                matrixIds = new Array(resLength);

            wmts.generateArrays(resolutions, matrixIds, resLength, size);

            resolutions.forEach((element, index) => {
                expect(typeof element).toBe("number");
                expect(resolutions[index]).toBe(size / Math.pow(2, index));
            });
            matrixIds.forEach((id, index) => {
                expect(typeof id).toBe("number");
                expect(matrixIds[index]).toBe(index);
            });
        });
    });
});
