import {Map} from "ol";
import TileLayer from "ol/layer/Tile";
import map from "../src/maps/map.js";
import {createMap as create3DMap} from "../src/maps/olcs/olcsMap.js";
import rawLayerList from "../src/rawLayerList.js";
import crs from "../src/crs.js";
import setBackgroundImage from "../src/lib/setBackgroundImage.js";
import {createMapView} from "../src/maps/mapView";
import defaults from "../src/defaults";
import {load3DScript} from "../src/lib/load3DScript";

/*
 * This test is mocking a lot to check what functions are called with.
 * createMap logic is mostly calling other functions.
 */
jest.mock("ol");
jest.mock("../src/rawLayerList.js", () => {
    const originalModule = jest.requireActual("../src/rawLayerList.js");

    return {
        __esModule: true,
        ...originalModule,
        default: {
            getLayerWhere: ({id}) => ({
                exists: {
                    typ: "doesntExist"
                },
                works: {
                    typ: "WMS"
                }
            })[id],
            initializeLayerList: jest.fn()
        }
    };
});
jest.mock("../src/crs.js");
jest.mock("../src/lib/setBackgroundImage.js");
jest.mock("../src/maps/mapView.js");

describe("map.js", function () {
    describe("createMap", function () {
        it("calls all initialization functions", function () {
            const callback = jest.fn();

            map.createMap(defaults, "2D", {mapParams: {}, callback: callback});
            expect(rawLayerList.initializeLayerList).toHaveBeenCalledWith(defaults.layerConf, expect.any(Function));
            expect(crs.registerProjections).toHaveBeenCalledWith(defaults.namedProjections);
            expect(setBackgroundImage).toHaveBeenCalledWith(defaults);
        });

        it("creates a 2D MapView", function () {
            map.createMap(defaults);
            expect(createMapView).toHaveBeenCalledWith(defaults);
        });
        it("creates a MapView", function () {
            map.createMap(defaults, "2D");
            expect(createMapView).toHaveBeenCalledWith(defaults);
        });
        it("creates a 3D Map", function () {
            const config = {
                map2D: {
                    getView: () => {
                        return {
                            getProjection: () => {
                                return {getCode: () => "code"};
                            }
                        };
                    },
                    getViewport: () => {
                        return {
                            appendChild: jest.fn()
                        };
                    }
                },
                cesiumLib: "https://lib.virtualcitymap.de/v3.6.x/lib/Cesium/Cesium.js"
            };

            load3DScript(config.cesiumLib, function Loaded3DCallback () {
                const map3D = map.createMap(config, "3D");

                expect(create3DMap).toHaveBeenCalledWith(defaults);
                expect(map3D.mapMode).toBe("3D");
            });
        });

        it("creates and returns a Map object from openlayers with optional additional params", function () {
            const ret = map.createMap(defaults, "2D", {mapParams: {test: 1}});

            expect(Map.mock.calls[Map.mock.calls.length - 1][0].test).toBe(1);
            expect(ret).toBeInstanceOf(Map);
        });
    });

    // NOTE: loading map.js monkey patches Map.prototype.addLayer - testing result here
    describe("addLayer", function () {
        it("logs an error for unknown ids", function () {
            console.error = jest.fn();
            const consoleError = console.error,
                result = Map.prototype.addLayer("999999999999999");

            expect(console.error).toHaveBeenCalled();
            expect(result).toBeNull();
            console.error = consoleError;
        });

        it("logs an error for unknown types", function () {
            console.error = jest.fn();
            const consoleError = console.error,
                result = Map.prototype.addLayer("exists");

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith("Layer with id 'exists' has unknown type 'doesntExist'. No layer added to map.");
            console.error = consoleError;
        });

        it.only("creates existing layers that have a known builder", function () {
            const result = Map.prototype.addLayer("works");

            expect(result).toBeInstanceOf(TileLayer);
        });

        it("sets visibility and transparency", function () {
            const result1 = Map.prototype.addLayer("works"),
                result2 = Map.prototype.addLayer("works", {}),
                result3 = Map.prototype.addLayer("works", {visibility: false}),
                result4 = Map.prototype.addLayer("works", {transparency: 50}),
                result5 = Map.prototype.addLayer("works", {visibility: false, transparency: 20});

            expect(result1.getOpacity()).toBe(1);
            expect(result1.getVisible()).toBe(true);

            expect(result2.getOpacity()).toBe(1);
            expect(result2.getVisible()).toBe(true);

            expect(result3.getOpacity()).toBe(1);
            expect(result3.getVisible()).toBe(false);

            expect(result4.getOpacity()).toBe(0.5);
            expect(result4.getVisible()).toBe(true);

            expect(result5.getOpacity()).toBe(0.8);
            expect(result5.getVisible()).toBe(false);
        });
    });

    describe("setCameraParameter", function () {
        it("set the camera parameter from config", function () {
            const config = {
                map2D: {
                    getView: () => {
                        return {
                            getProjection: () => {
                                return {getCode: () => "code"};
                            }
                        };
                    },
                    getViewport: () => {
                        return {
                            appendChild: jest.fn()
                        };
                    }
                },
                cameraParameter: {
                    altitude: 272.3469798217454,
                    heading: -0.30858728378862876,
                    tilt: 0.9321791580603296
                },
                cesiumLib: "https://lib.virtualcitymap.de/v3.6.x/lib/Cesium/Cesium.js"
            };

            load3DScript(config.cesiumLib, function Loaded3DCallback () {
                const map3D = map.createMap(config, "3D");

                expect(map3D.mapMode).toBe("3D");
                expect(map3D.getCesiumScene().camera.getAltitude()).toBe(config.cameraParameter.altitude);
                expect(map3D.getCesiumScene().camera.getHeading()).toBe(config.cameraParameter.heading);
                expect(map3D.getCesiumScene().camera.getTilt()).toBe(config.cameraParameter.tilt);
            });
        });
        it("set the camera parameter from config under camera", function () {
            const config = {
                map2D: {
                    getView: () => {
                        return {
                            getProjection: () => {
                                return {getCode: () => "code"};
                            }
                        };
                    },
                    getViewport: () => {
                        return {
                            appendChild: jest.fn()
                        };
                    }
                },
                cameraParameter: {
                    camera: {
                        altitude: 272.3469798217454,
                        heading: -0.30858728378862876,
                        tilt: 0.9321791580603296
                    }
                },
                cesiumLib: "https://lib.virtualcitymap.de/v3.6.x/lib/Cesium/Cesium.js"
            };

            load3DScript(config.cesiumLib, function Loaded3DCallback () {
                const map3D = map.createMap(config, "3D");

                expect(map3D.mapMode).toBe("3D");
                expect(map3D.getCesiumScene().camera.getAltitude()).toBe(config.cameraParameter.altitude);
                expect(map3D.getCesiumScene().camera.getHeading()).toBe(config.cameraParameter.heading);
                expect(map3D.getCesiumScene().camera.getTilt()).toBe(config.cameraParameter.tilt);
            });
        });
        it("set the camera from viewpoint parameter", function () {
            const config = {
                map2D: {
                    getView: () => {
                        return {
                            getProjection: () => {
                                return {getCode: () => "code"};
                            }
                        };
                    },
                    getViewport: () => {
                        return {
                            appendChild: jest.fn()
                        };
                    }
                },
                viewpoint: [{"distance": 1660.0290142521517,
                    "cameraPosition": [
                        9.982163927085617,
                        53.532817572762475,
                        1180.9805498821436
                    ],
                    "groundPosition": [
                        9.983171185370468,
                        53.54328139366739,
                        -0.00449886760542777
                    ],
                    "heading": 3.281512334248587,
                    "pitch": -45.35612834848329,
                    "roll": 0.015054499334397243,
                    "animate": false,
                    "duration": 6.006336273348537
                }],
                cesiumLib: "https://lib.virtualcitymap.de/v3.6.x/lib/Cesium/Cesium.js"
            };

            load3DScript(config.cesiumLib, function Loaded3DCallback () {
                const map3D = map.createMap(config, "3D");

                expect(map3D.mapMode).toBe("3D");
                map.setCameraParameter(config.viewpoint, map3D, config.cesiumLib);

                // missing test, if the passed parameters are also in the 3D map
            });
        });
    });

    describe("prepareCamera", function () {
        it("test if prepareCamera returns the Cesium camera", function () {
            const config = {
                map2D: {
                    getView: () => {
                        return {
                            getProjection: () => {
                                return {getCode: () => "code"};
                            }
                        };
                    },
                    getViewport: () => {
                        return {
                            appendChild: jest.fn()
                        };
                    }
                },
                cameraParameter: {
                    altitude: 272.3469798217454,
                    heading: -0.30858728378862876,
                    tilt: 0.9321791580603296
                },
                cesiumLib: "https://lib.virtualcitymap.de/v3.6.x/lib/Cesium/Cesium.js"
            };

            load3DScript(config.cesiumLib, function Loaded3DCallback () {
                const map3D = map.createMap(config, "3D");

                expect(map3D.mapMode).toBe("3D");
                expect(map.prepareCamera(map3D.getCesiumScene(), {}, map3D, config, config.cesiumLib).toBeInstanceOf(map3D.getCesiumScene().camera));
            });
        });
    });

});
