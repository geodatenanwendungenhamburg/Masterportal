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

    describe("getPolygonFillHatch", () => {
        it("should generate a polygon fill pattern with the given parameters", () => {
            const params = {
                    pattern: "diagonal",
                    size: 30,
                    lineWidth: 10,
                    backgroundColor: [0, 0, 0, 1],
                    patternColor: [255, 255, 255, 1]
                },
                canvas = stylePolygonClass.getPolygonFillHatch(params);

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.width).toEqual(30);
            expect(canvas.height).toEqual(30);
        });
    });


    describe("getPolygonFillHatchLegendDataUrl", () => {
        it("should generate a legend data URL for the given style", () => {
            const HatchStyle = {
                    polygonFillHatch: {
                        pattern: "diagonal",
                        size: 30,
                        lineWidth: 10,
                        backgroundColor: [0, 0, 0, 1],
                        patternColor: [255, 255, 255, 1]
                    },
                    polygonStrokeColor: [0, 0, 0, 1],
                    polygonStrokeWidth: "2"
                },
                dataUrl = stylePolygonClass.getPolygonFillHatchLegendDataUrl(HatchStyle);

            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
        });
    });

});
