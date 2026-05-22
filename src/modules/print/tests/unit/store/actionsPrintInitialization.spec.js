import {expect} from "chai";
import VectorLayer from "ol/layer/Vector.js";
import sinon from "sinon";
import store from "@appstore/index.js";

import actions from "@modules/print/store/actionsPrintInitialization.js";
import Canvas from "@modules/print/js/buildCanvas.js";

const {
    chooseCurrentLayout,
    parseMapfishCapabilities,
    parsePlotserviceCapabilities,
    getGfiForPrint,
    getAttributeInLayoutByName,
    togglePostrenderListener,
    setPrintLayers,
    updateCanvasLayer,
    createPrintMask,
    getOptimalScale,
    getOptimalResolution,
    drawMask,
    drawPrintPage,
    getPrintMapSize,
    getPrintMapScales,
    setDpiList,
    compute3dPrintMask,
    ensureDpiForPdfInList
} = actions;

describe("src/modules/print/store/actionsPrintInitialization.js", () => {
    let map = null,
        commit,
        dispatch,
        getters,
        rootGetters;

    beforeAll(() => {
        map = {
            id: "ol",
            mode: "2D",
            render: sinon.spy(),
            getLayers: sinon.spy()
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });
    beforeEach(() => {
        store.getters = {
            "Maps/getResolutionByScale": () => sinon.stub()
        };

        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = {
            visibleLayer: [],
            invisibleLayer: [],
            hintInfo: "",
            showInvisibleLayerInfo: true
        };
    });

    afterEach(() => {
        sinon.restore();
    });
    describe("chooseCurrentLayout", () => {
        it("should choose the current Layout", async () => {
            const payload = [
                    {
                        name: "A4 Hochformat"
                    },
                    {
                        name: "A4 Querformat"
                    },
                    {
                        name: "A3 Hochformat"
                    },
                    {
                        name: "A3 Querformat"
                    }
                ],
                state = {
                    currentLayoutName: "A3 Querformat",
                    currentLayout: {name: "A3 Querformat"}
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            chooseCurrentLayout({commit, dispatch, state}, payload);

            expect(commit.calledWith("setCurrentLayout", state.currentLayout)).to.be.true;
            expect(commit.calledWith("setCurrentLayoutName", state.currentLayout.name)).to.be.true;
        });
    });

    describe("parseMapfishCapabilities", function () {
        it("should parse the mapfish capabilities", async () => {
            const payload = {
                layouts: [
                    {
                        name: "A4 Hochformat"
                    },
                    {
                        name: "A4 Querformat"
                    },
                    {
                        name: "A3 Hochformat"
                    },
                    {
                        name: "A3 Querformat"
                    }
                ],
                formats: [
                    "jpg", "png", "pdf"
                ]
            };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            parseMapfishCapabilities({commit, dispatch, state: {}, rootGetters: {"Maps/scale": 0}}, payload);

            expect(commit.calledWith("setLayoutList", payload.layouts)).to.be.true;
        });
    });

    describe("parsePlotserviceCapabilities", function () {
        it("should parse the plotservice capabilities", async () => {
            const payload = {
                layouts: [
                    {
                        name: "A4 Hochformat",
                        geoDocument: "pdf_a4_hoch"
                    },
                    {
                        name: "A4 Querformat",
                        geoDocument: "pdf_a4_quer"
                    },
                    {
                        name: "A3 Hochformat",
                        geoDocument: "pdf_a3_hoch"
                    },
                    {
                        name: "A3 Querformat",
                        geoDocument: "pdf_a3_quer"
                    }
                ],
                formats: [
                    "jpg", "png", "pdf"
                ],
                scales: [{value: "500"}, {value: "1000"}],
                outputFormats: [{name: "jpg"}, {name: "png"}, {name: "pdf"}]
            };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            parsePlotserviceCapabilities({commit, dispatch, state: {}, rootGetters: {"Maps/scale": 0}}, payload);

            expect(commit.calledWith("setLayoutList", payload.layouts)).to.be.true;
        });
    });

    describe("getGfiForPrint", function () {
        it("should set empty gfi for print", async () => {

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getGfiForPrint({commit, dispatch, state: {}, rootGetters: {"Modules/GetFeatureInfo/currentFeature": null}}, null);

            expect(commit.calledWith("setGfiForPrint", [])).to.be.true;
        });
        it("should set gfi for print", async () => {
            const feature = {
                getTitle: () => "TestTitle",
                getMappedProperties: () => "TestProperties"
            };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getGfiForPrint({commit, dispatch, state: {}, rootGetters: {"Modules/GetFeatureInfo/currentFeature": feature, "Map/clickCoord": undefined}}, null);

            expect(commit.calledWith("setGfiForPrint", ["TestProperties", "TestTitle", undefined])).to.be.true;
        });
    });

    describe("getAttributeInLayoutByName", function () {
        it("should set nothing because gfi isn't available", async () => {
            const state = {
                currentLayout: {
                    attributes: [
                        {name: "title"},
                        {name: "map"},
                        {name: "scale"},
                        {name: "master"},
                        {name: "title"}
                    ]
                }
            };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getAttributeInLayoutByName({commit, dispatch, state}, "gfi");
        });
    });

    describe("togglePostrenderListener", function () {
        it("should toggle the post render listener and should register listener", async () => {
            const TileLayer = {},
                state = {
                    visibleLayerList: [
                        TileLayer,
                        VectorLayer,
                        VectorLayer,
                        VectorLayer,
                        VectorLayer
                    ],
                    eventListener: undefined,
                    layoutList: [{
                        name: "A4 Hochformat"
                    }]
                };

            Canvas.getCanvasLayer = sinon.spy(() => ({
                on: () => "postrender"
            }));

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            togglePostrenderListener({commit, dispatch, state, getters: {}}, undefined);

            expect(commit.calledWith("setVisibleLayer", state.visibleLayerList)).to.be.true;
            expect(commit.calledWith("setEventListener", "postrender")).to.be.true;
        });
    });

    describe("setPrintLayers", function () {
        it("one layer is invisible in print scale, shows hint", () => {
            const layer = {
                    getMaxResolution: () => 66.807,
                    getMinResolution: () => 10.132,
                    get: () => "name"
                },
                scale = 40000;

            getters.invisibleLayer.push(layer);

            setPrintLayers({dispatch, commit, getters}, scale);
            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.be.equals("setHintInfo");
            expect(commit.firstCall.args[1].length > 0).to.be.true;
            expect(commit.secondCall.args[0]).to.be.equals("setInvisibleLayer");
            expect(commit.secondCall.args[1].length).to.be.equals(1);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.be.equals("Alerting/addSingleAlert");
            expect(typeof dispatch.firstCall.args[1]).to.deep.equals("object");
        });
        it("one layer is invisible in print scale, shows no hint, because showInvisibleLayerInfo is false", () => {
            const layer = {
                    getMaxResolution: () => 66.807,
                    getMinResolution: () => 10.132,
                    get: () => "name"
                },
                scale = 40000;

            getters.invisibleLayer.push(layer);
            getters.showInvisibleLayerInfo = false;

            setPrintLayers({dispatch, commit, getters, rootGetters}, scale);
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.be.equals("setInvisibleLayer");
            expect(commit.firstCall.args[1].length).to.be.equals(1);
            expect(dispatch.notCalled).to.be.true;
        });
        it("no layer is invisible in print scale, shows no hint", () => {
            const layer = {
                    getMaxResolution: () => 66.807,
                    getMinResolution: () => 0.132,
                    get: () => "name"
                },
                scale = 40000;

            getters.visibleLayer.push(layer);

            setPrintLayers({dispatch, commit, getters, rootGetters}, scale);
            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.be.equals("setHintInfo");
            expect(commit.firstCall.args[1]).to.be.equals("");
            expect(commit.secondCall.args[0]).to.be.equals("setInvisibleLayer");
            expect(commit.secondCall.args[1].length).to.be.equals(0);
            expect(dispatch.notCalled).to.be.true;
        });
    });

    describe("updateCanvasLayer", function () {
        it("should update to draw the print page rectangle onto the canvas when the map changes", async () => {
            const TileLayer = {
                    getMaxResolution: () => 66.80725559074865,
                    getMinResolution: () => 0.13229159522920522,
                    setVisible: () => true
                },
                scale = 40000,
                state = {
                    visibleLayerList: [
                        TileLayer
                    ],
                    eventListener: {abc: 123},
                    layoutList: [
                        {
                            name: "A4 Hochformat"
                        },
                        {
                            name: "A4 Querformat"
                        },
                        {
                            name: "A3 Hochformat"
                        },
                        {
                            name: "A3 Querformat"
                        }
                    ]
                };

            Canvas.getCanvasLayer = sinon.spy(() => ({
                on: () => "postrender"
            }));

            updateCanvasLayer({commit, dispatch, state, getters: {}}, scale);

            expect(dispatch.calledWith("Maps/unregisterListener", {type: state.eventListener})).to.be.true;
            expect(dispatch.calledWith("chooseCurrentLayout", state.layoutList)).to.be.true;
            expect(commit.calledWith("setEventListener", "postrender")).to.be.true;
        });
        afterAll(function () {
            sinon.restore();
        });
    });

    describe("createPrintMask", function () {
        it("creates the print Mask", async () => {
            const evt = {
                    context: {
                        canvas: {},
                        direction: "ltr",
                        fillStyle: "#000000",
                        filter: "none",
                        font: "10px sans-serif",
                        globalAlpha: 1,
                        globalCompositeOperation: "source-over",
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: "low",
                        lineCap: "butt",
                        lineDashOffset: 0,
                        lineJoin: "miter",
                        lineWidth: 1,
                        miterLimit: 10,
                        shadowBlur: 0,
                        shadowColor: "rgba(0, 0, 0, 0)",
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        strokeStyle: "#000000",
                        textAlign: "start",
                        textBaseline: "alphabetic",
                        fill: () => {
                            return null;
                        }
                    },
                    frameState: {
                        size: [1348, 864],
                        pixelToCoordinateTransform: [10.583327618336, 0, 0, -10.583327618336, 1104618.7926526342, 7087941.480887591],
                        viewState: {
                            resolution: 15.874991427504629,
                            rotation: 0.5
                        }
                    }
                },
                state = {
                    layoutMapInfo: [772, 1044],
                    isScaleSelectedManually: false,
                    autoAdjustScale: true,
                    scaleList: [500, 1000, 2500, 5000, 10000, 20000, 40000, 60000, 100000],
                    optimalScale: 20000,
                    currentLayout: {
                        attributes: [
                            {
                                name: "map",
                                clientInfo: {
                                    dpiSuggestions: [72, 150, 300]
                                }
                            }
                        ]
                    }
                },
                canvasOptions = {
                    "mapSize": evt.frameState.size,
                    "resolution": evt.frameState.viewState.resolution,
                    "printMapSize": state.layoutMapInfo,
                    "scaleList": state.scaleList
                },
                drawMaskOpt = {
                    "frameState": evt.frameState,
                    "context": evt.context
                },
                canvasPrintOptions = {
                    "mapSize": evt.frameState.size,
                    "pixelToCoordinateTransform": evt.frameState.pixelToCoordinateTransform,
                    "resolution": evt.frameState.viewState.resolution,
                    "printMapSize": state.layoutMapInfo,
                    "rotation": 0.5,
                    "scale": 20000,
                    "context": evt.context
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            createPrintMask({commit, dispatch, state, getters: {}}, evt);

            expect(dispatch.calledWith("getPrintMapSize")).to.be.true;
            expect(dispatch.calledWith("getPrintMapScales")).to.be.true;
            expect(dispatch.calledWith("getOptimalScale", canvasOptions)).to.be.true;
            expect(dispatch.calledWith("drawMask", drawMaskOpt)).to.be.true;
            expect(dispatch.calledWith("drawPrintPage", canvasPrintOptions)).to.be.true;
            expect(dispatch.calledWith("setPrintLayers", state.optimalScale)).to.be.true;
        });
    });

    describe("getOptimalScale", function () {
        it("returns the optimal scale", async () => {
            const frameState = {
                    size: [1348, 864],
                    viewState: {
                        resolution: 15.874991427504629
                    }
                },
                state = {
                    layoutMapInfo: [772, 1044],
                    isScaleSelectedManually: false,
                    autoAdjustScale: true,
                    scaleList: [500, 1000, 2500, 5000, 10000, 20000, 40000, 60000, 100000],
                    optimalScale: 20000,
                    DOTS_PER_INCH: 72,
                    INCHES_PER_METER: 39.37
                },
                canvasOptions = {
                    "mapSize": frameState.size,
                    "resolution": frameState.viewState.resolution,
                    "printMapSize": state.layoutMapInfo,
                    "scaleList": state.scaleList
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getOptimalScale({commit, dispatch, state}, canvasOptions);

            expect(commit.calledWith("setOptimalScale", 20000)).to.be.true;
            expect(commit.calledWith("setCurrentScale", 20000)).to.be.true;
        });
    });

    describe("getOptimalResolution", function () {
        it("returns the optimal resolution", async () => {
            const resolution = {
                    scale: 10000,
                    mapSize: [951, 864],
                    printMapSize: [772, 1044]
                },
                state = {
                    DOTS_PER_INCH: 72,
                    INCHES_PER_METER: 39.37
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getOptimalResolution({commit, dispatch, state}, resolution);

            expect(commit.calledWith("setOptimalResolution", 4.262740006961495)).to.be.true;
        });
    });

    describe("drawMask", function () {
        it("should draw the print Mask", async () => {
            const evt = {
                    context: {
                        canvas: {},
                        direction: "ltr",
                        fillStyle: "#000000",
                        filter: "none",
                        font: "10px sans-serif",
                        globalAlpha: 1,
                        globalCompositeOperation: "source-over",
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: "low",
                        lineCap: "butt",
                        lineDashOffset: 0,
                        lineJoin: "miter",
                        lineWidth: 1,
                        miterLimit: 10,
                        shadowBlur: 0,
                        shadowColor: "rgba(0, 0, 0, 0)",
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        strokeStyle: "#000000",
                        textAlign: "start",
                        textBaseline: "alphabetic",
                        beginPath: () => {
                            return null;
                        },
                        moveTo: () => {
                            return null;
                        },
                        lineTo: () => {
                            return null;
                        },
                        closePath: () => {
                            return null;
                        },
                        save: () => {
                            return null;
                        },
                        restore: () => {
                            return null;
                        },
                        rotate: () => {
                            return null;
                        },
                        rect: () => {
                            return null;
                        },
                        translate: () => {
                            return null;
                        }
                    },
                    frameState: {
                        size: [1348, 864],
                        viewState: {
                            resolution: 15.874991427504629
                        }
                    }
                },
                drawMaskOpt = {
                    "frameState": evt.frameState,
                    "context": evt.context
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            drawMask({commit, dispatch, state: null, getters: {}}, drawMaskOpt);
        });
    });

    describe("drawPrintPage", function () {
        it("should draw the print page", async () => {
            const evt = {
                    context: {
                        canvas: {
                            width: 1348
                        },
                        direction: "ltr",
                        fillStyle: "#000000",
                        filter: "none",
                        font: "10px sans-serif",
                        globalAlpha: 1,
                        globalCompositeOperation: "source-over",
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: "low",
                        lineCap: "butt",
                        lineDashOffset: 0,
                        lineJoin: "miter",
                        lineWidth: 1,
                        miterLimit: 10,
                        shadowBlur: 0,
                        shadowColor: "rgba(0, 0, 0, 0)",
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        strokeStyle: "#000000",
                        textAlign: "start",
                        textBaseline: "alphabetic",
                        moveTo: () => {
                            return null;
                        },
                        lineTo: () => {
                            return null;
                        },
                        closePath: () => {
                            return null;
                        },
                        restore: () => {
                            return null;
                        },
                        rotate: () => {
                            return null;
                        },
                        save: () => {
                            return null;
                        },
                        translate: () => {
                            return null;
                        }
                    },
                    frameState: {
                        pixelToCoordinateTransform: [10.583327618336, 0, 0, -10.583327618336, 1104618.7926526342, 7087941.480887591],
                        size: [1348, 864],
                        viewState: {
                            resolution: 15.874991427504629
                        }
                    }
                },
                state = {
                    layoutMapInfo: [772, 1044],
                    isScaleSelectedManually: false,
                    autoAdjustScale: true,
                    scaleList: [500, 1000, 2500, 5000, 10000, 20000, 40000, 60000, 100000],
                    optimalScale: 20000,
                    DOTS_PER_INCH: 72,
                    INCHES_PER_METER: 39.37
                },
                canvasPrintOptions = {
                    "mapSize": evt.frameState.size,
                    "pixelToCoordinateTransform": evt.frameState.pixelToCoordinateTransform,
                    "resolution": evt.frameState.viewState.resolution,
                    "printMapSize": state.layoutMapInfo,
                    "scale": 20000,
                    "context": evt.context
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            drawPrintPage({commit, dispatch, state}, canvasPrintOptions);
        });
    });

    describe("getPrintMapSize", function () {
        it("should commit the printMapSize", async () => {
            const state = {
                mapAttribute: {
                    clientInfo: {
                        width: 772,
                        height: 1044
                    }
                }
            };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getPrintMapSize({commit, dispatch, state}, undefined);

            expect(dispatch.calledWith("getAttributeInLayoutByName", "map")).to.be.true;
            expect(commit.calledWith("setLayoutMapInfo", [772, 1044])).to.be.true;
        });
    });
    describe("getPrintMapScales", function () {
        it("should commit the scales", async () => {
            const state = {
                mapAttribute: {
                    clientInfo: {
                        scales: [
                            250000,
                            100000,
                            60000,
                            40000,
                            20000,
                            10000,
                            5000,
                            2500,
                            1000,
                            500
                        ]
                    }
                }
            };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getPrintMapScales({commit, dispatch, state}, undefined);

            expect(dispatch.calledWith("getAttributeInLayoutByName", "map")).to.be.true;
            expect(commit.calledWith("setScaleList", state.mapAttribute.clientInfo.scales)).to.be.true;
        });
    });
    describe("getPrintDpis", function () {
        it("should commit the dpis", async () => {
            const dpis = [72, 150, 300],
                state = {
                    currentLayout: {
                        attributes: [
                            {
                                name: "map",
                                clientInfo: {
                                    dpiSuggestions: dpis
                                }
                            }
                        ]
                    }
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            setDpiList({commit, dispatch, state}, undefined);

            expect(commit.calledWith("setDpiList", dpis)).to.be.true;
        });
    });
    describe("compute3dPrintMask", () => {
        it("should dispatch getPrintMapSize and getPrintMapScales", async () => {
            const state = {
                mapAttribute: {
                    clientInfo: {
                        width: 772,
                        height: 1044
                    }
                }
            };

            compute3dPrintMask({commit, dispatch, state}, undefined);

            expect(dispatch.calledWith("getPrintMapSize")).to.be.true;
            expect(dispatch.calledWith("getPrintMapScales")).to.be.true;
        });
    });
    describe("ensureDpiForPdfInList", () => {
        it("should not change dpiForPdf if in list", async () => {
            const state = {
                dpiList: [100, 200, 300],
                dpiForPdf: 200
            };

            ensureDpiForPdfInList({commit, dispatch, state}, undefined);
        });
        it("should set dpiForPdf to first item in list, if current dpiForPdf not in list", async () => {
            const state = {
                dpiList: [100, 300],
                dpiForPdf: 200
            };

            ensureDpiForPdfInList({commit, dispatch, state}, undefined);

            expect(commit.calledWith("setDpiForPdf", 100)).to.be.true;
        });
        it("should not change dpiForPdf if list is empty", async () => {
            const state = {
                dpiList: [],
                dpiForPdf: 200
            };

            ensureDpiForPdfInList({commit, dispatch, state}, undefined);
        });
    });
});
