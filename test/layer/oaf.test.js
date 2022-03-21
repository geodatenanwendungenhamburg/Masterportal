import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Cluster from "ol/source/Cluster.js";
import {Style, Icon} from "ol/style.js";
import map from "../../src/maps/map.js";
import defaults from "../../src/defaults";
import {WFS} from "ol/format.js";
import GeoJSON from "ol/format/GeoJSON.js";
import * as oaf from "../../src/layer/oaf";
import {featureCollection} from "./resources/wfsFeatures";

jest.mock("../../src/rawLayerList.js", () => {
    const original = jest.requireActual("../../src/rawLayerList.js");

    original.initializeLayerList = jest.fn();
    return original;
});


describe("oaf.js", function () {
    describe("createLayer", function () {
        it("creates a VectorLayer without id and version", function () {
            const warn = jest.spyOn(console, "warn").mockImplementation(() => ""),
                layer = oaf.createLayer();

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
            expect(warn).toHaveBeenCalled();

            warn.mockReset();
        });
        it("creates a VectorLayer with source", function () {
            const attr = {
                    "id": "id",
                    "name": "Schulen",
                    "url": "https://url.de",
                    "featureNS": "http://www.deegree.org/app",
                    "featureType": "staatliche_schulen",
                    "version": "1.1.0",
                    "typ": "OAF",
                    "outputFormat": "json",
                    "limit": 10,
                    "offset": 0,
                    "bulk": false,
                    "bbox": "",
                    "bboxCrs": "",
                    "datetime": "",
                    "crs": ""
                },
                layer = oaf.createLayer(attr);

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.get("id")).toEqual("id");
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
        });
        it("creates a VectorLayer with style in rawLayer", function () {
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
            const layer = oaf.createLayer({id: "id", style: styleFunction, version: "1.1.0"});

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.get("id")).toEqual("id");
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
            expect(layer.getStyleFunction()).toBeDefined();
            expect(layer.getStyleFunction()).toEqual(styleFunction);

        });
    });
    describe("createLayer with additional params and options", function () {
        it("creates a VectorLayer with layerParams", function () {
            const layerParams = {
                    name: "name",
                    layers: "layer1, layer2"
                },
                layer = oaf.createLayer({id: "id", version: "1.1.0"}, {layerParams});

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
                layer = oaf.createLayer({id: "id", version: "2.0.0"}, {layerParams, options});

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.get("id")).toEqual("id");
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
            expect(layer.getStyleFunction()).toBeDefined();
            expect(layer.getStyleFunction()).toEqual(styleFunction);
            expect(layer.get("name")).toEqual("name");
            expect(layer.get("layers")).toEqual("layer1, layer2");
        });
    });
    describe("createLayerSource", function () {
        const consoleError = console.error;

        beforeEach(() => {
            if (global.fetch) {
                global.fetch.mockClear();
            }
        });
        // to reset show error on load in console
        afterEach(() => {
            console.error = consoleError;
        });
        it("creates a WFS VectorSource and beforeLoading, afterLoading and featuresFilter are called", function () {
            global.fetch = jest.fn().mockImplementationOnce(() => {
                return new Promise((resolve) => {
                    resolve({
                        ok: true,
                        status: 200,
                        text: () => {
                            return featureCollection;
                        }
                    });
                });
            });

            const map2D = map.createMap(defaults),
                rawLayer = {
                    id: "id",
                    name: "Schulen",
                    url: "https://url.de",
                    featureNS: "http://www.deegree.org/app",
                    featureType: "staatliche_schulen",
                    version: "1.1.0",
                    typ: "OAF",
                    outputFormat: "xml",
                    limit: 10,
                    offset: 0,
                    bulk: false,
                    bbox: "",
                    bboxCrs: "",
                    datetime: "",
                    crs: ""
                },
                beforeLoadingMock = jest.fn(),
                afterLoadingMock = jest.fn(),
                featuresFilterMock = jest.fn((features) => features),
                // jest.fn().mockReturnValueOnce(10),
                options = {
                    beforeLoading: beforeLoadingMock,
                    afterLoading: afterLoadingMock,
                    featuresFilter: featuresFilterMock
                },
                layer = oaf.createLayer(rawLayer, {options});

            layer.getSource().loadFeatures([-10000, -10000, 10000, 10000],
                1,
                map2D.getView().getProjection());

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.get("id")).toEqual("id");
            expect(layer.getSource()).toBeInstanceOf(VectorSource);
            expect(layer.getSource().getFormat()).toBeInstanceOf(WFS);
            // eslint-disable-next-line no-underscore-dangle
            expect(typeof layer.getSource().loader_).toEqual("function");
            expect(beforeLoadingMock.mock.calls.length).toBe(1);

            layer.getSource().on("featuresloadend", function () {
                expect(featuresFilterMock.mock.calls.length).toBe(1);
                expect(afterLoadingMock.mock.calls.length).toBe(1);
            });
        });
        it("creates a GeoJSON VectorSource", function () {
            global.fetch = jest.fn().mockImplementationOnce(() => {
                return new Promise((resolve) => {
                    resolve({
                        ok: true,
                        status: 200,
                        text: () => {
                            return {};
                        }
                    });
                });
            });
            console.error = jest.fn();

            const rawLayer = {
                    id: "id",
                    name: "Schulen",
                    url: "https://url.de",
                    featureNS: "http://www.deegree.org/app",
                    featureType: "staatliche_schulen",
                    version: "1.1.0",
                    typ: "OAF",
                    outputFormat: "json",
                    limit: 10,
                    offset: 0,
                    bulk: false,
                    bbox: "",
                    bboxCrs: "",
                    datetime: "",
                    crs: ""
                },
                layer = oaf.createLayer(rawLayer);

            expect(layer.getSource().getFormat()).toBeInstanceOf(GeoJSON);
        });
        it("creates a VectorSource and onLoadingError is called", function () {
            global.fetch = jest.fn().mockImplementationOnce(() => {
                return new Promise((resolve) => {
                    resolve({
                        ok: false,
                        status: 404,
                        text: () => {
                            return null;
                        }
                    });
                });
            });
            // to reset show error on load in console when testing 'onLoadingError'
            console.error = jest.fn();

            const rawLayer = {
                    id: "id",
                    name: "Schulen",
                    url: "https://url.de",
                    featureNS: "http://www.deegree.org/app",
                    featureType: "staatliche_schulen",
                    version: "1.1.0",
                    typ: "OAF",
                    outputFormat: "xml",
                    limit: 10,
                    offset: 0,
                    bulk: false,
                    bbox: "",
                    bboxCrs: "",
                    datetime: "",
                    crs: ""
                },
                onLoadingErrorMock = jest.fn(),
                options = {
                    onLoadingError: onLoadingErrorMock
                },
                layer = oaf.createLayer(rawLayer, {options});

            // eslint-disable-next-line no-underscore-dangle
            expect(typeof layer.getSource().loader_).toEqual("function");
            layer.getSource().on("featuresloaderror", function () {
                expect(onLoadingErrorMock.mock.calls.length).toBe(2);
            });
        });
        it("creates a clustered VectorSource and beforeLoading, afterLoading and featuresFilter are called", function () {
            global.fetch = jest.fn().mockImplementationOnce(() => {
                return new Promise((resolve) => {
                    resolve({
                        ok: true,
                        status: 200,
                        text: () => {
                            return featureCollection;
                        }
                    });
                });
            });
            console.error = jest.fn();

            const map2D = map.createMap(defaults),
                rawLayer = {
                    id: "id",
                    name: "Schulen",
                    url: "https://url.de",
                    featureNS: "http://www.deegree.org/app",
                    featureType: "staatliche_schulen",
                    clusterDistance: 40,
                    version: "1.1.0",
                    typ: "OAF",
                    outputFormat: "xml",
                    limit: 10,
                    offset: 0,
                    bulk: false,
                    bbox: "",
                    bboxCrs: "",
                    datetime: "",
                    crs: ""
                },
                beforeLoadingMock = jest.fn(),
                afterLoadingMock = jest.fn(),
                featuresFilterMock = jest.fn((features) => features),
                clusterGeometryFunctionMock = jest.fn(),
                options = {
                    beforeLoading: beforeLoadingMock,
                    afterLoading: afterLoadingMock,
                    featuresFilter: featuresFilterMock,
                    clusterGeometryFunction: clusterGeometryFunctionMock
                },
                layer = oaf.createLayer(rawLayer, {options});

            layer.getSource().loadFeatures([-10000, -10000, 10000, 10000],
                1,
                map2D.getView().getProjection());

            expect(layer.getSource()).toBeInstanceOf(Cluster);
            expect(layer.getSource().getDistance()).toEqual(40);
            expect(layer.getSource().getSource().getFormat()).toBeInstanceOf(WFS);
            // eslint-disable-next-line no-underscore-dangle
            expect(typeof layer.getSource().loader_).toEqual("function");
            expect(beforeLoadingMock.mock.calls.length).toBe(1);
            layer.getSource().on("featuresloadend", function () {
                expect(clusterGeometryFunctionMock.mock.calls.length).toBe(1);
                expect(featuresFilterMock.mock.calls.length).toBe(1);
                expect(afterLoadingMock.mock.calls.length).toBe(1);
            });
        });
    });
});

