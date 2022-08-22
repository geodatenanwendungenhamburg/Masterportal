import PolygonStyle from "../../../../src/vectorStyle/styles/polygon/stylePolygon";
import {Style} from "ol/style.js";

describe("stylePolygon", () => {
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
        stylePolygonClass = new PolygonStyle(feature, style, isClustered);

    describe("getStyle", function () {
        it("returns an instance of openlayers style", () => {
            expect(stylePolygonClass.getStyle()).toBeInstanceOf(Style);
        });
    });
});
