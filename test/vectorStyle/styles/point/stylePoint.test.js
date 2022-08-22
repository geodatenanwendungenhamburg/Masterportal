import PointStyleModel from "../../../../src/vectorStyle/styles/point/stylePoint";
import {Style} from "ol/style.js";

describe("stylePoint", () => {
    const feature = {
            geometryName: "geom",
            id: "DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2"
        },
        style = {
            type: "icon",
            clusterType: "icon",
            legendValue: "Krankenhaus",
            imageName: "krankenhaus.png"
        },
        isClustered = false,
        stylePointClass = new PointStyleModel(feature, style, isClustered);

    describe("setSize", function () {
        it("defines setSize()", () => {
            expect(typeof stylePointClass.setSize).toBe("function");
        });
    });
    describe("getStyle", function () {
        it("returns an instance of openlayers style", () => {
            expect(stylePointClass.getStyle()).toBeInstanceOf(Style);
        });
    });
});
