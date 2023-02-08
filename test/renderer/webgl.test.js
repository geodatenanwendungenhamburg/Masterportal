import VectorSource from "ol/source/Vector.js";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import * as webgl from "../../src/renderer/webgl";
import WebGLPointsLayer from "ol/layer/WebGLPoints";
import Layer from "ol/layer/Layer";
import {packColor} from "ol/renderer/webgl/shaders";
import * as styleList from "../../src/vectorStyle/styleList";


// jest.mock("../../src/vectorStyle/styleList.js", () => {
//     const original = jest.requireActual("../../src/vectorStyle/styleList.js");

//     original.returnStyleObject = jest.fn(() => styleObject);
//     return original;
// });

describe("webgl.js", () => {
    let layerParams, rawLayer, styleRule, styleObject;

    beforeEach(() => {
        layerParams = {
            name: "webglTestLayer",
            id: "123",
            typ: "WFS",
            renderer: "webgl",
            styleId: "123"
        };
        rawLayer = {
            url: "https://url.de",
            name: "wfsSourceLayer",
            id: "123",
            typ: "WFS",
            version: "2.0.0",
            featureNS: "http://www.deegree.org/app",
            featureType: "krankenhaeuser_hh",
            outputFormat: "XML"
        };
        styleRule = {style: {
            polygonFillColor: [255, 0, 0, 0.5],
            polygonStrokeColor: [0, 255, 0, 0.5],
            polygonStrokeWidth: 2,
            circleFillColor: [0, 0, 255, 0.5],
            circleRadius: 6
        }};
        styleObject = {
            rules: [styleRule]
        };

        jest.spyOn(styleList, "returnStyleObject").mockImplementation(() => styleObject);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("createLayer", () => {
        const source = new VectorSource();

        it("should return a WebGLPointsLayer", () => {
            layerParams.isPointLayer = true;
            const webglLayer = webgl.createLayer({...rawLayer, ...layerParams, source});

            expect(webglLayer).toBeInstanceOf(WebGLPointsLayer);
            expect(webglLayer.get("isPointLayer")).toBeTruthy();
        });
        it("should return a custom Layer", () => {
            layerParams.isPointLayer = false;
            const webglLayer = webgl.createLayer({...rawLayer, ...layerParams, source});

            expect(webglLayer).toBeInstanceOf(Layer);
            expect(webglLayer).not.toBeInstanceOf(WebGLPointsLayer);
            expect(webglLayer.get("isPointLayer")).toBeFalsy();
        });
    });
    describe("private format and style functions", () => {
        const
            feature = new Feature({
                geometry: new Polygon([
                    [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]]
                ], "XYZ"),
                apple: "42",
                pear: "true",
                pumpkin: "false"
            });
        let $feature;

        describe("formatFeatureGeometry", () => {
            it("should remove any Z components from the geometry", () => {
                $feature = feature.clone();
                webgl.formatFeatureGeometry($feature);
                /* eslint-disable-next-line max-nested-callbacks */
                expect($feature.getGeometry().getCoordinates()[0].every(coord => coord.length === 2)).toBeTruthy();
            });
        });
        describe("formatFeatureData", () => {
            it("should not format excluded formats 'number' and 'boolean", () => {
                $feature = feature.clone();
                webgl.formatFeatureData($feature, ["number", "boolean"]);
                expect(typeof $feature.get("apple")).toEqual("string");
                expect(typeof $feature.get("pear")).toEqual("string");
                expect(typeof $feature.get("pumpkin")).toEqual("string");
            });
            it("should format numbers and booleans", () => {
                $feature = feature.clone();
                webgl.formatFeatureData($feature, []);
                expect(typeof $feature.get("apple")).toEqual("number");
                expect(typeof $feature.get("pear")).toEqual("boolean");
                expect(typeof $feature.get("pumpkin")).toEqual("boolean");
            });
        });
        describe("formatFeatureStyles", () => {
            it("bind the styling rule from the styleObject to each feature", () => {
                $feature = feature.clone();
                webgl.formatFeatureStyles($feature, styleObject);
                expect($feature.styleRule).toEqual(styleRule);
            });
        });
        describe("getRenderFunctions", () => {
            it("should read the style from styleRule and pack them to single float", () => {
                const renderFunctions = webgl.getRenderFunctions();

                $feature = feature.clone();
                webgl.formatFeatureStyles($feature, styleObject);
                expect(renderFunctions.fill.attributes.color($feature)).toEqual(packColor(styleRule.style.polygonFillColor));
                expect(renderFunctions.fill.attributes.opacity($feature)).toEqual(styleRule.style.polygonFillColor[3]);
                expect(renderFunctions.stroke.attributes.color($feature)).toEqual(packColor(styleRule.style.polygonStrokeColor));
                expect(renderFunctions.stroke.attributes.width($feature)).toEqual(styleRule.style.polygonStrokeWidth);
                expect(renderFunctions.stroke.attributes.opacity($feature)).toEqual(styleRule.style.polygonStrokeColor[3]);
                expect(renderFunctions.point.attributes.color($feature)).toEqual(packColor(styleRule.style.circleFillColor));
                expect(renderFunctions.point.attributes.size($feature)).toEqual(styleRule.style.circleRadius);
                expect(renderFunctions.point.attributes.opacity($feature)).toEqual(styleRule.style.circleFillColor[3]);
            });
            it("should return default values if no style rule is found", () => {
                const renderFunctions = webgl.getRenderFunctions();

                $feature = feature.clone();
                expect(feature.styleRule).toBeUndefined();
                expect(typeof renderFunctions.fill.attributes.color($feature)).toEqual("number");
                expect(typeof renderFunctions.fill.attributes.opacity($feature)).toEqual("number");
                expect(typeof renderFunctions.stroke.attributes.color($feature)).toEqual("number");
                expect(typeof renderFunctions.stroke.attributes.width($feature)).toEqual("number");
                expect(typeof renderFunctions.stroke.attributes.opacity($feature)).toEqual("number");
                expect(typeof renderFunctions.point.attributes.color($feature)).toEqual("number");
                expect(typeof renderFunctions.point.attributes.size($feature)).toEqual("number");
                expect(typeof renderFunctions.point.attributes.opacity($feature)).toEqual("number");
            });
        });
    });
});