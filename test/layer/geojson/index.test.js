import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector.js";
import Feature from "ol/Feature";

import {geojson} from "../../../src";
import style from "../../../src/layer/geojson/style";

const point = {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [0, 0]
        }
    },
    collection = {
        type: "FeatureCollection",
        features: [point, point, point]
    },
    idCollection = {
        type: "FeatureCollection",
        features: collection.features.map((p, id) => Object.assign({id: String(id)}, p))
    };

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
    });

    describe("createLayerSource", function () {
        it("sets format and url for remote geojson", function () {
            const source = geojson.createLayerSource({url: "example.com/geo.json"}, {loadingStrategy: {}});

            expect(source.getFormat()).toBeDefined();
            expect(source.getUrl()).toBeDefined();
        });

    });

    describe("setFeatureStyle", function () {
        it("sets a given style to all given features", function () {
            function styleFunction () {
                return null;
            }
            const features = [new Feature(), new Feature()];

            geojson.setFeatureStyle(features, styleFunction);
            expect(features[0].getStyle()).toBe(styleFunction);
            expect(features[1].getStyle()).toBe(styleFunction);
        });
    });

    describe("hideAllFeatures", function () {
        it("sets all features' styles of a layer to the null constant function", function () {
            const layer = geojson.createLayer({features: collection});

            geojson.hideAllFeatures(layer);
            layer.getSource().getFeatures().forEach(feature => expect(feature.getStyle()()).toBeNull());
        });
    });

    describe("showAllFeatures", function () {
        it("sets all features' styles of a layer to undefined", function () {
            const layer = geojson.createLayer({features: collection});

            geojson.hideAllFeatures(layer);
            geojson.showAllFeatures(layer);
            layer.getSource().getFeatures().forEach(feature => expect(feature.getStyle()).toBeUndefined());
        });
    });

    describe("showFeaturesById", function () {
        it("sets features with id visible, and all others invisible; unknown ids are ignored", function () {
            const layer = geojson.createLayer({features: idCollection}),
                p1 = layer.getSource().getFeatures()[0];


            console.log(layer.getSource().getFeatures()[0]);

           /*  geojson.showFeaturesById(layer, ["-1", "0", "1"]);
            expect(p1.getStyle()).toBeUndefined();
            expect(p2.getStyle()).toBeUndefined();
            expect(p3.getStyle()()).toBeNull(); */

            geojson.showFeaturesById(layer, []);

            expect(p1.getStyle()()).toBeNull();
            expect(p2.getStyle()()).toBeNull();
            expect(p3.getStyle()()).toBeNull();

            geojson.showFeaturesById(layer, ["2", "9"]);

            expect(p1.getStyle()()).toBeNull();
            expect(p2.getStyle()()).toBeNull();
            expect(p3.getStyle()).toBeUndefined();
        });
    });
});
