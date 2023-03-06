import PointStyle from "../../../../src/vectorStyle/styles/point/stylePoint";
import {Circle as CircleStyle, Style} from "ol/style.js";

describe("stylePoint", () => {
    let feature,
        isClustered,
        style,
        stylePointClass;

    beforeEach(() => {
        feature = {
            geometryName: "geom",
            id: "DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2"
        };
        style = {
            type: "icon",
            clusterType: "icon",
            legendValue: "Krankenhaus",
            imageName: "krankenhaus.png"
        };
        isClustered = false;
        stylePointClass = new PointStyle(feature, style, isClustered);
    });

    describe("setSize", function () {
        it("defines setSize()", () => {
            expect(typeof stylePointClass.setSize).toBe("function");
        });
    });
    describe("getStyle", function () {
        it("returns an instance of openlayers style", () => {
            expect(stylePointClass.getStyle()).toBeInstanceOf(Style);
        });
        it("returns an instance of openlayers circleStyle", () => {
            isClustered = true;
            style = {
                type: "icon",
                clusterType: "circle",
                legendValue: "Krankenhaus",
                imageName: "krankenhaus.png"
            };

            expect(stylePointClass.getStyle()).toBeInstanceOf(Style);
            expect(stylePointClass.getStyle().getImage()).toBeInstanceOf(CircleStyle);
        });
    });

});
