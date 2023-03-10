import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector.js";
import Feature from "ol/Feature";
import {Style, Icon} from "ol/style.js";
import {geojson} from "../../../src";
import * as webgl from "../../../src/renderer/webgl.js";

const features = [new Feature(), new Feature()];

jest.mock("../../../src/renderer/webgl.js", () => {
    const original = jest.requireActual("../../../src/renderer/webgl.js");

    original.afterLoading = jest.fn();
    return original;
});

describe("geojson/index", function () {
    describe("createLayer", function () {
        it("creates an ol/layer/Vector", function () {
            const layer = geojson.createLayer({});

            expect(layer).toBeInstanceOf(VectorLayer);
        });

        it("uses default layer style, unless layerStyle is explicitly given", function () {
            function styleFunction () {
                return null;
            }
            const styledLayer = geojson.createLayer({id: "id", style: styleFunction});

            expect(styledLayer).toBeInstanceOf(VectorLayer);
            expect(styledLayer.get("id")).toEqual("id");
            expect(styledLayer.getSource()).toBeInstanceOf(VectorSource);
            expect(styledLayer.getStyleFunction()).toBeDefined();
            expect(styledLayer.getStyleFunction()).toEqual(styleFunction);
        });
    });
    describe("createLayer with additional params and options", function () {
        it("creates a VectorLayer with layerParams", function () {
            const layerParams = {
                    name: "name",
                    layers: "layer1, layer2"
                },
                layer = geojson.createLayer({id: "id"}, {layerParams});

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.get("id")).toEqual("id");
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
            expect(layer.get("name")).toEqual("name");
            expect(layer.get("layers")).toEqual("layer1, layer2");
        });
        it("creates a VectorLayer with style in options", function () {
            function styleFunction () {
                const icon = new Style({
                    image: new Icon({
                        src: "https://building.png",
                        scale: 0.5,
                        opacity: 1
                    })
                });

                return [icon];
            }
            const options = {
                    style: styleFunction
                },
                layerParams = {
                    name: "name",
                    layers: "layer1, layer2"
                },
                layer = geojson.createLayer({id: "id"}, {layerParams, options});

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.get("id")).toEqual("id");
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
            expect(layer.getStyleFunction()).toBeDefined();
            expect(layer.getStyleFunction()).toEqual(options.style);
            expect(layer.get("name")).toEqual("name");
            expect(layer.get("layers")).toEqual("layer1, layer2");
        });
        it("creates a WebGLLayer, with param renderer \"webgl\"", function () {
            const layer = geojson.createLayer({}, {layerParams: {renderer: "webgl"}});

            expect(layer.constructor.name).toEqual("LocalWebGLLayer");
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
        });
    });

    describe("createLayerSource", function () {
        it("sets format and url for remote geojson", function () {
            const source = geojson.createLayerSource({url: "example.com/geo.json"}, {loadingStrategy: {}});

            expect(source.getFormat()).toBeDefined();
            expect(source.getUrl()).toBeDefined();
        });
        it("creates a vectorSource with an additional listener, when renderer is \"webgl\"", () => {
            const
                rawLayer = {url: "example.com/geo.json"},
                source = geojson.createLayerSource({...rawLayer, renderer: "webgl"}, {});

            expect(source.getListeners("featuresloadend")).toHaveLength(2);
            source.getListeners("featuresloadend")[1]({features: []});
            expect(webgl.afterLoading).toHaveBeenCalled();
        });

    });

    describe("setFeatureStyle", function () {
        it("sets a given style to all given features", function () {
            function styleFunction () {
                return null;
            }

            geojson.setFeatureStyle(features, styleFunction);
            expect(features[0].getStyle()).toBe(styleFunction);
            expect(features[1].getStyle()).toBe(styleFunction);
        });
    });

    describe("hideAllFeatures", function () {
        it("sets all features' styles of a layer to the null constant function", function () {
            const layer = geojson.createLayer({id: "id"});

            layer.getSource().addFeatures(features);

            geojson.hideAllFeatures(layer);
            layer.getSource().getFeatures().forEach(feature => expect(feature.getStyle()()).toBeNull());
        });
    });
    describe("showAllFeatures", function () {
        it("sets all features' styles of a layer to undefined", function () {
            const layer = geojson.createLayer({id: "id"});

            layer.getSource().addFeatures(features);
            geojson.hideAllFeatures(layer);
            geojson.showAllFeatures(layer);
            layer.getSource().getFeatures().forEach(feature => expect(feature.getStyle()).toBeUndefined());
        });
    });
    describe("showFeaturesById", function () {
        it("sets features with id visible, and all others invisible; unknown ids are ignored", () => {
            const layer = geojson.createLayer({id: "id"});

            layer.getSource().addFeatures(features);

            geojson.showFeaturesById(layer, []);
            expect(features[0].getStyle()()).toBeNull();
            expect(features[1].getStyle()()).toBeNull();

            geojson.showFeaturesById(layer, ["2", "9"]);

            expect(features[0].getStyle()()).toBeNull();
            expect(features[1].getStyle()()).toBeNull();
        });
    });
});
