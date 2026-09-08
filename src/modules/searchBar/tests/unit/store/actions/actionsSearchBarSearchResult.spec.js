import sinon from "sinon";
import {expect} from "chai";
import axios from "axios";
import {createPinia, setActivePinia} from "pinia";
import {useLayerInformationStore} from "@modules/layerInformation/store/layerInformationStore.js";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import WKTUtil from "@shared/js/utils/getWKTGeom.js";
import wmsGFIUtil from "@shared/js/utils/getWmsFeaturesByMimeType.js";
import actions from "@modules/searchBar/store/actions/actionsSearchBarSearchResult.js";
import {buildAdditionalLayerProps, buildAlertPayload, fetchCswRecordXml} from "@modules/searchBar/store/actions/addLayerFromCswRecordHelper.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import mapMarker from "@core/maps/js/mapMarker.js";
import markerHelper from "@modules/searchBar/js/marker.js";
import find3DPickedFeatureProvider from "@shared/js/utils/find3DPickedFeature.js";

describe("src/modules/searchBar/store/actions/actionsSearchBarSearchResult.spec.js", () => {
    let dispatch,
        commit,
        getters,
        zoomLevel,
        map,
        layerInformationStore,
        menuStore,
        startLayerInformationSpy,
        changeCurrentComponentSpy;

    beforeEach(() => {
        zoomLevel = 5;

        dispatch = sinon.spy();
        commit = sinon.spy();
        getters = {
            zoomLevel: zoomLevel
        };
        map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getZoomForResolution: () => 5,
                    getResolutionForExtent: () => 5
                };
            },
            getSize: () => {
                return {
                    getArray: () => []
                };
            }
        };
        mapCollection.clear();
        mapCollection.addMap(map, "2D");
        sinon.stub(mapMarker, "getMapmarkerLayerById").returns({getSource: () => {
            return {getExtent: sinon.stub()};
        }});
        sinon.stub(markerHelper, "extentIsValid").returns(true);
        sinon.stub(console, "warn").callsFake(sinon.spy());
        sinon.stub(console, "error").callsFake(sinon.spy());
        setActivePinia(createPinia());

        menuStore = useMenuStore();
        changeCurrentComponentSpy = sinon.stub(menuStore, "changeCurrentComponent");

        layerInformationStore = useLayerInformationStore();
        startLayerInformationSpy = sinon.spy();
        layerInformationStore.startLayerInformation = startLayerInformationSpy;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("activateLayerInTopicTree", () => {
        it("should activate a layer in topic tree", () => {
            const layerId = "123",
                rootGetters = {
                    layerConfigById: sinon.stub().returns({
                        id: layerId,
                        zIndex: 1,
                        showInLayerTree: true
                    })
                };

            actions.activateLayerInTopicTree({dispatch, rootGetters}, {layerId});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("replaceByIdInLayerConfig");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({
                layerConfigs: [{
                    id: layerId,
                    layer: {
                        id: layerId,
                        visibility: true,
                        showInLayerTree: true,
                        zIndex: 1
                    }
                }]
            });
        });

        it("should activate a layer in topic tree and set zIndex", () => {
            const layerId = "123",
                rootGetters = {
                    layerConfigById: sinon.stub().returns({
                        id: layerId,
                        zIndex: 1,
                        showInLayerTree: false
                    }),
                    determineZIndex: () => 2
                };

            actions.activateLayerInTopicTree({dispatch, rootGetters}, {layerId});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("replaceByIdInLayerConfig");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({
                layerConfigs: [{
                    id: layerId,
                    layer: {
                        id: layerId,
                        visibility: true,
                        showInLayerTree: true,
                        zIndex: 2
                    }
                }]
            });
        });

        it("should add and activate a layer in topic tree", () => {
            const layerId = "123",
                source = {
                    id: layerId,
                    visibility: true,
                    showInLayerTree: true,
                    zIndex: 1
                },
                rootGetters = {
                    layerConfigById: sinon.stub().returns(undefined)
                };

            actions.activateLayerInTopicTree({dispatch, rootGetters}, {layerId, source});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("addLayerToTopicTree");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({
                layerId: layerId,
                source: {
                    id: layerId,
                    visibility: true,
                    showInLayerTree: true,
                    zIndex: 1
                }
            }
            );
        });

    });

    describe("addLayerToTopicTree", () => {
        it("should add a layer to topic tree", () => {
            const layerId = "123",
                source = {
                    id: layerId,
                    abc: "abc",
                    datasets: []
                },
                added = true,
                rootGetters = {
                    layerConfigById: sinon.stub().returns(false)
                };

            dispatch = sinon.stub().resolves(added);
            actions.addLayerToTopicTree({dispatch, rootGetters}, {layerId, source});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("addLayerToLayerConfig");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({
                layerConfig: {
                    id: layerId,
                    abc: "abc",
                    datasets: [],
                    showInLayerTree: true,
                    type: "layer",
                    visibility: true
                },
                parentKey: "subjectlayer"
            });
        });

        it("should activate layer in topic tree", () => {
            const layerId = "123",
                source = {
                    id: layerId,
                    abc: "abc",
                    datasets: []
                },
                added = true,
                rootGetters = {
                    layerConfigById: sinon.stub().returns(true)
                };

            dispatch = sinon.stub().resolves(added);
            actions.addLayerToTopicTree({dispatch, rootGetters}, {layerId, source});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("activateLayerInTopicTree");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({
                layerId,
                source
            });
        });
    });

    describe("removeLayerFromTopicTree", () => {
        it("should remove a layer from topic tree", () => {
            const layerId = "123",
                rootGetters = {
                    layerConfigById: sinon.stub().returns(true)
                };

            actions.removeLayerFromTopicTree({dispatch, rootGetters}, {layerId});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("replaceByIdInLayerConfig");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({
                layerConfigs: [{
                    id: layerId,
                    layer: {
                        id: layerId,
                        visibility: false,
                        showInLayerTree: false
                    }
                }]
            });
        });

        it("should do nothing", () => {
            const layerId = "123",
                rootGetters = {
                    layerConfigById: sinon.stub().returns(false)
                };

            actions.removeLayerFromTopicTree({dispatch, rootGetters}, {layerId});

            expect(dispatch.notCalled).to.be.true;
        });
    });

    describe("showInTree", () => {

        it("should call showLayer for a layer", async () => {
            const layerId = "123";

            dispatch = sinon.stub().resolves({id: layerId});
            await actions.showInTree({commit, dispatch}, {layerId});

            expect(dispatch.callCount).to.be.equals(2);
            expect(dispatch.firstCall.args[0]).to.equals("retrieveLayerConfig");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({layerId, source: undefined});

            expect(changeCurrentComponentSpy.calledOnce).to.be.true;
            expect(changeCurrentComponentSpy.firstCall.args[0]).to.be.deep.equals({
                type: "layerSelection",
                side: "mainMenu",
                props: {name: "common:modules.layerSelection.name"}
            });

            expect(dispatch.secondCall.args[0]).to.equals("Modules/LayerSelection/showLayer");
            expect(dispatch.secondCall.args[1]).to.be.deep.equals({
                layerId: "123"
            });

            expect(commit.callCount).to.be.equals(1);
            expect(commit.firstCall.args[0]).to.equals("setShowSearchResultsInTree");
            expect(commit.firstCall.args[1]).to.be.equals(true);
        });

        it("should call showLayer for a folder", async () => {
            const layerId = "folder-1";

            dispatch = sinon.stub().resolves({id: layerId,
                elements: [
                    {
                        id: "123"
                    }
                ]});
            await actions.showInTree({commit, dispatch}, {layerId});

            expect(dispatch.callCount).to.be.equals(2);
            expect(dispatch.firstCall.args[0]).to.equals("retrieveLayerConfig");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({layerId, source: undefined});

            expect(changeCurrentComponentSpy.calledOnce).to.be.true;
            expect(changeCurrentComponentSpy.firstCall.args[0]).to.be.deep.equals({
                type: "layerSelection",
                side: "mainMenu",
                props: {name: "common:modules.layerSelection.name"}
            });

            expect(dispatch.secondCall.args[0]).to.equals("Modules/LayerSelection/showLayer");
            expect(dispatch.secondCall.args[1]).to.be.deep.equals({
                layerId: "123"
            });
            expect(commit.callCount).to.be.equals(2);
            expect(commit.firstCall.args[0]).to.equals("setShowSearchResultsInTree");
            expect(commit.firstCall.args[1]).to.be.equals(true);
            expect(commit.secondCall.args[0]).to.equals("Modules/LayerSelection/setHighlightLayerId");
            expect(commit.secondCall.args[1]).to.be.deep.equals(null);
        });

        it("should warn and show alert if layerConfig does not exist", async () => {
            const layerId = "123";

            dispatch = sinon.stub().resolves(undefined);
            await actions.showInTree({commit, dispatch}, {layerId});

            expect(dispatch.callCount).to.equal(2);
            expect(dispatch.firstCall.args[0]).to.equals("retrieveLayerConfig");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({layerId, source: undefined});

            expect(changeCurrentComponentSpy.calledOnce).to.be.true;
            expect(changeCurrentComponentSpy.firstCall.args[0]).to.be.deep.equals({
                type: "layerSelection",
                side: "mainMenu",
                props: {name: "common:modules.layerSelection.name"}
            });

            expect(dispatch.secondCall.args[0]).to.equals("Alerting/addSingleAlert");
            expect(dispatch.secondCall.args[1]).to.be.deep.equals({
                category: "info",
                content: i18next.t("common:modules.searchBar.layerResultNotShown")
            });
            expect(commit.callCount).to.be.equals(1);
            expect(commit.firstCall.args[0]).to.equals("setShowSearchResultsInTree");
            expect(commit.firstCall.args[1]).to.be.equals(true);
        });

    });

    it("should call startLayerInformation - layer in layerConfig", async () => {
        const layerId = "123",
            config = {
                layerId
            },
            source = {
                id: "sourceId"
            };

        dispatch = sinon.stub().resolves(config);
        await actions.showLayerInfo({dispatch, commit}, {layerId, source});

        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equals("retrieveLayerConfig");
        expect(dispatch.firstCall.args[1]).to.be.deep.equals({layerId, source});

        expect(startLayerInformationSpy.calledOnce).to.be.true;
        expect(startLayerInformationSpy.firstCall.args[0]).to.be.deep.equals(config);

        expect(commit.calledOnce).to.be.true;
        expect(commit.firstCall.args[0]).to.equals("Modules/LayerSelection/setLayerInfoVisible");
        expect(commit.firstCall.args[1]).to.be.true;
    });

    describe("retrieveLayerConfig", () => {
        it("layer contained in getters, no source", () => {
            const layerId = "123",
                rootGetters = {
                    layerConfigById: sinon.stub().returns({id: layerId})
                },
                getLayerWhereSpy = sinon.stub(rawLayerList, "getLayerWhere").returns("whatever"),
                result = actions.retrieveLayerConfig({dispatch, rootGetters}, {layerId});

            expect(dispatch.notCalled).to.be.true;
            expect(getLayerWhereSpy.notCalled).to.be.true;
            expect(result).to.be.deep.equals({id: layerId});
        });

        it("layer not contained in getters", () => {
            const layerId = "123",
                rootGetters = {
                    layerConfigById: sinon.stub().returns(null)
                },
                config = {id: layerId, name: "name"},
                getLayerWhereSpy = sinon.stub(rawLayerList, "getLayerWhere").returns(config),
                result = actions.retrieveLayerConfig({dispatch, rootGetters}, {layerId});

            expect(dispatch.notCalled).to.be.true;
            expect(getLayerWhereSpy.calledOnce).to.be.true;
            expect(getLayerWhereSpy.firstCall.args[0]).to.be.deep.equals({id: layerId});
            expect(result).to.be.deep.equals(config);
        });

        it("layer not contained in getters and in rawLayerList", () => {
            let counter = 0;
            const layerId = "123",
                source = {
                    id: "sourceId"
                },
                config = {id: layerId, name: "name"},
                rootGetters = {
                    layerConfigById: sinon.stub().callsFake(
                        () => {
                            if (counter === 0) {
                                counter++;
                                return undefined;
                            }
                            return config;
                        }
                    )
                },
                getLayerWhereSpy = sinon.stub(rawLayerList, "getLayerWhere").returns(null),
                result = actions.retrieveLayerConfig({dispatch, rootGetters}, {layerId, source});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("addLayerToTopicTree");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals({layerId, source: source, showInLayerTree: false, visibility: false});
            expect(getLayerWhereSpy.calledOnce).to.be.true;
            expect(getLayerWhereSpy.firstCall.args[0]).to.be.deep.equals({id: layerId});
            expect(result).to.be.deep.equals(config);
        });

        it("folder contained in getters", () => {
            const layerId = "folder-1",
                folder = {
                    id: layerId,
                    name: "I am a folder"
                },
                rootGetters = {
                    layerConfigById: sinon.stub().returns(null),
                    folderById: sinon.stub().returns(folder)
                },
                getLayerWhereSpy = sinon.stub(rawLayerList, "getLayerWhere").returns(null),
                result = actions.retrieveLayerConfig({dispatch, rootGetters}, {layerId});

            expect(dispatch.notCalled).to.be.true;
            expect(getLayerWhereSpy.notCalled).to.be.true;
            expect(result).to.be.deep.equals(folder);
        });
    });

    describe("highlightFeature", () => {
        it("highlightFeature shall dispatch 'placingPolygonMarker'", () => {
            const hit = {
                    geometryType: "MULTIPOLYGON",
                    coordinate: [
                        ["570374.959", "5936460.361", "570369.316", "5936458.5", "570364.706", "5936473.242", "570370.393", "5936474.993", "570374.959", "5936460.361"],
                        ["556622.043", "5935346.022", "556605.381", "5935347.509", "556583.860", "5935349.429", "556562.872", "5935351.302", "556562.855", "5935344.371", "556604.117", "5935340.974", "556622.043", "5935339.707", "556622.043", "5935346.022"]
                    ],
                    id: "im Verfahren331",
                    name: "HafenCity12-Hamburg-Altstadt48",
                    type: "im Verfahren"
                },
                type = {getType: () => "MultiPolygon"},
                feature = {
                    id: "feature",
                    getGeometry: () => type
                },
                stubGetWKTGeom = sinon.stub(WKTUtil, "getWKTGeom").returns(feature);

            actions.highlightFeature({getters, dispatch}, {hit});
            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("Maps/placingPolygonMarker");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals(feature.getGeometry());
            expect(dispatch.secondCall.args[0]).to.equals("Maps/zoomToExtent");
            expect(stubGetWKTGeom.calledOnce).to.be.true;
            expect(stubGetWKTGeom.firstCall.args[0]).to.be.deep.equals(hit);
        });
    });

    describe("openGetFeatureInfo", () => {
        it("openGetFeatureInfo shall commit 'setGfiFeatures'", () => {
            const feature = {
                    id: "feature"
                },
                layer = {
                    id: "layer"
                },
                gfiFeature = {
                    getId: () => feature.id,
                    getLayerId: () => layer.id
                },
                stubCreateGfiFeature = sinon.stub(wmsGFIUtil, "createGfiFeature").returns(gfiFeature);

            actions.openGetFeatureInfo({commit}, {feature, layer});
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("Modules/GetFeatureInfo/setGfiFeatures");
            expect(commit.firstCall.args[1]).to.be.deep.equals([gfiFeature]);
            expect(stubCreateGfiFeature.calledOnce).to.be.true;
            expect(stubCreateGfiFeature.firstCall.args[0]).to.be.deep.equals(layer);
            expect(stubCreateGfiFeature.firstCall.args[1]).to.be.equals("");
            expect(stubCreateGfiFeature.firstCall.args[2]).to.be.deep.equals(feature);
        });
    });

    describe("setMarker", () => {
        it("sets the MapMarker with coordinates", () => {
            const coordinates = [1234, 65432],
                payload = [1234, 65432];

            actions.setMarker({dispatch}, {coordinates});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("Maps/placingPointMarker");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals(payload);
        });

        it("highlights multipolygon feature with style from styleList", () => {
            const coordinates = [1234, 65432],
                payload = [1234, 65432],
                feature = {
                    id: "featureId",
                    getGeometry: () => ({
                        getType: () => "MultiPolygon",
                        intersectsCoordinate: () => true,
                        getCoordinates: () => coordinates
                    })
                },
                layer = {
                    get: () => "styleId"
                },
                state = {
                    lastPickedFeatureId: "previousFeatureId"
                },
                rootGetters = {
                    "Modules/GetFeatureInfo/highlightVectorRules": null
                },
                highlightObject = {
                    type: "highlightMultiPolygon",
                    feature,
                    styleId: "styleId",
                    highlightStyle: {
                        fill: {
                            color: "rgba(215, 102, 41, 0.9)"
                        },
                        stroke: {
                            color: "rgba(215, 101, 41, 0.9)",
                            width: 1
                        }
                    }
                };

            sinon.stub(styleList, "returnStyleObject").returns({
                rules: [{
                    style: {
                        polygonFillColor: [215, 102, 41, 0.9],
                        polygonStrokeColor: [215, 101, 41, 0.9],
                        polygonStrokeWidth: [1]
                    }
                }]
            });

            actions.setMarker({dispatch, state, rootGetters}, {coordinates, feature, layer});

            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/highlightFeature");
            expect(dispatch.firstCall.args[1]).to.deep.equal(highlightObject);
            expect(dispatch.secondCall.args[0]).to.equal("Maps/placingPointMarker");
            expect(dispatch.secondCall.args[1]).to.deep.equal(payload);
        });

        it("highlights multipolygon feature with style from GetFeatureInfo", () => {
            const coordinates = [1234, 65432],
                payload = [1234, 65432],
                feature = {
                    id: "featureId",
                    getGeometry: () => ({
                        getType: () => "MultiPolygon",
                        intersectsCoordinate: () => true,
                        getCoordinates: () => coordinates
                    })
                },
                layer = {
                    get: () => "styleId"
                },
                state = {
                    lastPickedFeatureId: "previousFeatureId"
                },
                rootGetters = {
                    "Modules/GetFeatureInfo/highlightVectorRules": {
                        fill: {
                            color: "#abcdef"
                        },
                        stroke: {
                            color: "#123456",
                            width: 1
                        }
                    }
                },
                highlightObject = {
                    type: "highlightMultiPolygon",
                    feature,
                    styleId: "styleId",
                    highlightStyle: {
                        fill: {
                            color: [171, 205, 239, 1]
                        },
                        stroke: {
                            color: [18, 52, 86, 1],
                            width: 1
                        }
                    }
                };

            sinon.stub(styleList, "returnStyleObject").returns(null);

            actions.setMarker({dispatch, rootGetters, state}, {coordinates, feature, layer});

            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/highlightFeature");
            expect(dispatch.firstCall.args[1]).to.deep.equal(highlightObject);
            expect(dispatch.secondCall.args[0]).to.equal("Maps/placingPointMarker");
            expect(dispatch.secondCall.args[1]).to.deep.equal(payload);
        });
    });

    describe("zoomToResult", () => {
        it("zoomToResult with point coordinates ", () => {
            const coordinates = [1234, 65432],
                payload = {
                    center: coordinates,
                    zoom: getters.zoomLevel
                };

            actions.zoomToResult({dispatch, getters}, {coordinates});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("Maps/zoomToCoordinates");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals(payload);
        });
        it("zoomToResult with extent coordinates ", () => {
            const coordinates = [5.866342, 47.270111, 15.041896, 55.058338],
                zoom = 5,
                payload = {
                    extent: coordinates,
                    options: {maxZoom: zoom}
                };


            actions.zoomToResult({dispatch, getters}, {coordinates, options: {maxZoom: zoom}});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("Maps/zoomToExtent");
            expect(dispatch.firstCall.args[1]).to.be.deep.equals(payload);
        });
    });
    describe("highlight3DTileByCoordinates", () => {
        let mockState, mockDispatch, mockCommit, mockGetters;

        beforeEach(() => {
            mockState = {cameraMoveEndListener: null};

            mockDispatch = sinon.spy();
            mockCommit = sinon.spy();

            mockGetters = {
                coloredHighlighting3D: {
                    color: [255, 0, 0, 255]
                },
                "Maps/mode": "3D"
            };
        });

        it("should not perform any action if the mode is not 3D", async function () {
            mockGetters["Maps/mode"] = "2D";

            await actions.highlight3DTileByCoordinates(
                {state: mockState, dispatch: mockDispatch, commit: mockCommit, rootGetters: mockGetters},
                {coordinates: [12.345, 67.890]}
            );

            expect(mockDispatch.notCalled).to.be.true;
            expect(mockCommit.notCalled).to.be.true;
        });

        describe("when in 3D mode", () => {
            let mockScene, mockCartesian, map3d;

            beforeEach(() => {
                mockCartesian = {x: 1, y: 2, z: 3};
                mockScene = {
                    camera: {position: {}},
                    drillPick: sinon.stub().returns([])
                };
                map3d = {
                    id: "1",
                    mode: "3D",
                    getCesiumScene: () => mockScene
                };
                mapCollection.addMap(map3d, "3D");
                global.Cesium = {
                    Cartesian3: {
                        fromDegrees: sinon.stub().returns(mockCartesian)
                    },
                    Ellipsoid: {
                        WGS84: {
                            cartesianToCartographic: sinon.stub().returns({height: 500})
                        }
                    }
                };
            });

            afterEach(() => {
                global.Cesium = null;
            });

            it("should dispatch Maps/setCamera with the correct camera position", () => {
                const coordinates = [10.0, 53.5];

                actions.highlight3DTileByCoordinates(
                    {rootGetters: mockGetters, dispatch: mockDispatch},
                    {coordinates}
                );

                expect(mockDispatch.calledWith("Maps/setCamera", {
                    cameraPosition: [10.0, 53.5, 640],
                    heading: 0,
                    pitch: -90,
                    roll: 0
                }, {root: true})).to.be.true;
            });

            it("should dispatch detectAndHighlight3DTile with the scene and cartesian", () => {
                const coordinates = [10.0, 53.5];

                actions.highlight3DTileByCoordinates(
                    {rootGetters: mockGetters, dispatch: mockDispatch},
                    {coordinates}
                );

                const detectCall = mockDispatch.getCalls().find(c => c.args[0] === "detectAndHighlight3DTile");

                expect(detectCall).to.not.be.undefined;
                expect(detectCall.args[1]).to.deep.equal({scene: mockScene, cartesian: mockCartesian});
            });
        });
    });

    describe("detectAndHighlight3DTile", () => {
        let mockScene, mockState, mockDispatch, mockCommit, mockCartesian;

        beforeEach(() => {
            mockCartesian = {x: 1, y: 2, z: 3};
            mockScene = {
                drillPick: sinon.stub().returns([])
            };
            mockState = {lastPickedFeatureId: null};
            mockDispatch = sinon.spy();
            mockCommit = sinon.spy();
            global.Cesium = {
                SceneTransforms: {
                    worldToWindowCoordinates: sinon.stub().returns({x: 100, y: 200})
                }
            };
        });

        afterEach(() => {
            global.Cesium = null;
        });

        it("returns early without dispatching if screenPosition cannot be computed", async () => {
            global.Cesium.SceneTransforms.worldToWindowCoordinates = sinon.stub().returns(null);

            await actions.detectAndHighlight3DTile(
                {state: mockState, dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );

            expect(mockDispatch.notCalled).to.be.true;
            expect(mockCommit.notCalled).to.be.true;
        });

        it("warns when screenPosition cannot be computed", async () => {
            global.Cesium.SceneTransforms.worldToWindowCoordinates = sinon.stub().returns(null);

            await actions.detectAndHighlight3DTile(
                {state: mockState, dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );

            expect(console.warn.calledTwice).to.be.true;
            expect(console.warn.firstCall.args[0]).to.equals("Unable to project the position into screen space.");
            expect(console.warn.secondCall.args[0]).to.equals("Unable to project the position into screen space.");
        });

        it("commits and highlights immediately when drillPick finds a feature with _batchId", async () => {
            const mockFeature = {
                _batchId: 42,
                getProperty: sinon.stub().returns("feat-1")
            };

            mockScene.drillPick = sinon.stub().returns([mockFeature]);

            await actions.detectAndHighlight3DTile(
                {state: mockState, dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );

            expect(mockCommit.calledWith("setLastPickedFeatureId", "feat-1")).to.be.true;
            expect(mockDispatch.calledWith("highlightPickedFeature", {pickedFeature: mockFeature})).to.be.true;
        });

        it("dispatches handleLayerLoading if no feature with _batchId is found by drillPick", async () => {
            const featureWithoutBatchId = {getProperty: sinon.stub()};

            mockScene.drillPick = sinon.stub().returns([featureWithoutBatchId]);

            await actions.detectAndHighlight3DTile(
                {state: mockState, dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );

            expect(mockDispatch.calledWith("handleLayerLoading", {scene: mockScene, cartesian: mockCartesian})).to.be.true;
        });

        it("re-highlights the previously picked feature when lastPickedFeatureId resolves", async () => {
            const mockFeature = {_batchId: 1, getProperty: sinon.stub()};

            mockState = {lastPickedFeatureId: "feat-prev"};
            sinon.stub(find3DPickedFeatureProvider, "find3DPickedFeature").resolves(mockFeature);

            await actions.detectAndHighlight3DTile(
                {state: mockState, dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );

            expect(mockDispatch.calledWith("highlightPickedFeature", {pickedFeature: mockFeature})).to.be.true;
            expect(mockScene.drillPick.notCalled).to.be.true;
        });

        it("falls through to drillPick if find3DPickedFeature returns null for lastPickedFeatureId", async () => {
            mockState = {lastPickedFeatureId: "feat-prev"};
            sinon.stub(find3DPickedFeatureProvider, "find3DPickedFeature").resolves(null);

            await actions.detectAndHighlight3DTile(
                {state: mockState, dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );

            expect(mockScene.drillPick.calledOnce).to.be.true;
        });
    });

    describe("handleLayerLoading", () => {
        let mockScene, mockDispatch, mockCommit, mockCartesian, clock, postRenderCallback, removeListenerSpy;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            mockCartesian = {x: 1, y: 2, z: 3};
            postRenderCallback = null;
            removeListenerSpy = sinon.spy();
            mockScene = {
                drillPick: sinon.stub().returns([]),
                postRender: {
                    addEventListener: sinon.stub().callsFake((cb) => {
                        postRenderCallback = cb;
                        return removeListenerSpy;
                    })
                }
            };
            mockDispatch = sinon.spy();
            mockCommit = sinon.spy();
            global.Cesium = {
                SceneTransforms: {
                    worldToWindowCoordinates: sinon.stub().returns({x: 100, y: 200})
                }
            };
        });

        afterEach(() => {
            clock.restore();
            global.Cesium = null;
        });

        it("commits and highlights the first feature with _batchId found by drillPick", () => {
            const mockFeature = {
                _batchId: 5,
                getProperty: sinon.stub().returns("feat-42")
            };

            mockScene.drillPick = sinon.stub().returns([mockFeature]);

            actions.handleLayerLoading(
                {dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );
            postRenderCallback();

            expect(mockCommit.calledWith("setLastPickedFeatureId", "feat-42")).to.be.true;
            expect(mockDispatch.calledWith("highlightPickedFeature", {pickedFeature: mockFeature})).to.be.true;
        });

        it("does not dispatch anything before the first frame fires", () => {
            const mockFeature = {_batchId: 1, getProperty: sinon.stub().returns("feat-1")};

            mockScene.drillPick = sinon.stub().returns([mockFeature]);

            actions.handleLayerLoading(
                {dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );

            expect(mockDispatch.notCalled).to.be.true;
            expect(mockCommit.notCalled).to.be.true;
        });

        it("dispatches removeHighlight3DTile after 15 s if no feature is found", () => {
            actions.handleLayerLoading(
                {dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );
            clock.tick(15001);
            postRenderCallback();

            expect(mockDispatch.calledWith("removeHighlight3DTile")).to.be.true;
            expect(mockCommit.notCalled).to.be.true;
        });

        it("skips drillPick when calculateScreenPosition returns null", () => {
            global.Cesium.SceneTransforms.worldToWindowCoordinates = sinon.stub().returns(null);

            actions.handleLayerLoading(
                {dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );
            postRenderCallback();

            expect(mockScene.drillPick.notCalled).to.be.true;
        });

        it("warns when calculateScreenPosition returns null", () => {
            global.Cesium.SceneTransforms.worldToWindowCoordinates = sinon.stub().returns(null);

            actions.handleLayerLoading(
                {dispatch: mockDispatch, commit: mockCommit},
                {scene: mockScene, cartesian: mockCartesian}
            );
            postRenderCallback();

            expect(console.warn.calledOnce).to.be.true;
            expect(console.warn.firstCall.args[0]).to.equals("Unable to project the position into screen space.");
        });
    });

    describe("addLayerFromCswRecord", () => {
        const fileIdentifier = "test-uuid-123",
            cswUrl = "https://example.com/csw",
            recordTitle = "Test Layer Title",
            gmdNs = "http://www.isotc211.org/2005/gmd",
            gcoNs = "http://www.isotc211.org/2005/gco";

        let axiosStub;

        beforeEach(() => {
            axiosStub = sinon.stub(axios, "get");
        });

        afterEach(() => {
            sinon.restore();
        });

        it("should fetch and parse a CSW record XML payload", async () => {
            const responseXml = new DOMParser().parseFromString("<root/>", "application/xml");

            axiosStub.resolves({request: {responseXML: responseXml}, data: "<root/>"});

            expect(await fetchCswRecordXml(cswUrl, fileIdentifier)).to.equal(responseXml);
        });

        it("should parse response data with DOMParser when responseXML is missing", async () => {
            axiosStub.resolves({request: {}, data: "<root><child>ok</child></root>"});

            const xml = await fetchCswRecordXml(cswUrl, fileIdentifier);

            expect(xml.getElementsByTagName("child")[0].textContent).to.equal("ok");
        });

        it("should build WMTS-specific additional layer props", () => {
            expect(buildAdditionalLayerProps({
                typ: "WMTS",
                baseUrl: "https://example.com/wmts",
                wmtsCapabilitiesUrl: "",
                wmtsFormat: "image/png",
                wmtsTileMatrixSet: "EPSG_25832"
            })).to.deep.equal({
                optionsFromCapabilities: true,
                capabilitiesUrl: "https://example.com/wmts?SERVICE=WMTS&REQUEST=GetCapabilities",
                format: "image/png",
                tileMatrixSet: "EPSG_25832"
            });
        });

        it("should build OAF-specific additional layer props", () => {
            expect(buildAdditionalLayerProps({typ: "OAF"})).to.deep.equal({
                bbox: false,
                crs: false,
                loadingStrategy: "all"
            });
        });

        it("should build an info alert payload when no layer was added", () => {
            const payload = buildAlertPayload({layerAdded: false, unavailableServiceUrls: new Set()});

            expect(payload.category).to.equal("info");
            expect(payload.once).to.equal(true);
            expect(payload.initial).to.equal(false);
        });

        it("should add WMS layer to external folder when OGC:WMS protocol is found", async () => {
            const wmsXml = `<?xml version="1.0"?>
<csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
  <gmd:MD_Metadata xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
    <gmd:distributionInfo>
      <gmd:MD_Distribution>
        <gmd:transferOptions>
          <gmd:MD_DigitalTransferOptions>
            <gmd:onLine>
              <gmd:CI_OnlineResource>
                <gmd:linkage><gmd:URL>https://wms.example.com/service</gmd:URL></gmd:linkage>
                <gmd:protocol><gco:CharacterString>OGC:WMS</gco:CharacterString></gmd:protocol>
                <gmd:name><gco:CharacterString>layer_name</gco:CharacterString></gmd:name>
              </gmd:CI_OnlineResource>
            </gmd:onLine>
          </gmd:MD_DigitalTransferOptions>
        </gmd:transferOptions>
      </gmd:MD_Distribution>
    </gmd:distributionInfo>
  </gmd:MD_Metadata>
</csw:GetRecordByIdResponse>`,
                domDoc = new DOMParser().parseFromString(wmsXml, "application/xml");

            axiosStub.resolves({request: {responseXML: domDoc}, data: wmsXml});

            dispatch = sinon.stub().resolves(true);
            await actions.addLayerFromCswRecord({dispatch, rootGetters: {allFolders: []}}, {fileIdentifier, cswUrl});

            const addCall = dispatch.getCalls().find(c => c.args[0] === "addLayerToLayerConfig" && c.args[1]?.layerConfig?.type === "layer");

            expect(addCall).to.exist;
            expect(addCall.args[1].layerConfig.typ).to.equal("WMS");
            expect(addCall.args[1].layerConfig.url).to.equal("https://wms.example.com/service");
            expect(addCall.args[1].layerConfig.metaID).to.equal(fileIdentifier);
            expect(addCall.args[1].layerConfig.showInLayerTree).to.be.true;
            expect(addCall.args[1].layerConfig.visibility).to.be.true;
        });

        it("should add WFS layer to external folder when OGC:WFS protocol is found", async () => {
            const wfsXml = `<?xml version="1.0"?>
<csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
  <gmd:MD_Metadata xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
    <gmd:distributionInfo>
      <gmd:MD_Distribution>
        <gmd:transferOptions>
          <gmd:MD_DigitalTransferOptions>
            <gmd:onLine>
              <gmd:CI_OnlineResource>
                <gmd:linkage><gmd:URL>https://wfs.example.com/service</gmd:URL></gmd:linkage>
                <gmd:protocol><gco:CharacterString>OGC:WFS</gco:CharacterString></gmd:protocol>
                <gmd:name><gco:CharacterString>featureType</gco:CharacterString></gmd:name>
              </gmd:CI_OnlineResource>
            </gmd:onLine>
          </gmd:MD_DigitalTransferOptions>
        </gmd:transferOptions>
      </gmd:MD_Distribution>
    </gmd:distributionInfo>
  </gmd:MD_Metadata>
</csw:GetRecordByIdResponse>`,
                domDoc = new DOMParser().parseFromString(wfsXml, "application/xml");

            axiosStub.resolves({request: {responseXML: domDoc}, data: wfsXml});

            dispatch = sinon.stub().resolves(true);
            await actions.addLayerFromCswRecord({dispatch, rootGetters: {allFolders: []}}, {fileIdentifier, cswUrl});

            const addCall = dispatch.getCalls().find(c => c.args[0] === "addLayerToLayerConfig" && c.args[1]?.layerConfig?.type === "layer");

            expect(addCall).to.exist;
            expect(addCall.args[1].layerConfig.typ).to.equal("WFS");
            expect(addCall.args[1].layerConfig.showInLayerTree).to.be.true;
            expect(addCall.args[1].layerConfig.visibility).to.be.true;
        });

        it("should skip WMS resource without layer name and dispatch info alert", async () => {
            const noNameXml = `<?xml version="1.0"?>
<csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
  <gmd:MD_Metadata xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
    <gmd:distributionInfo>
      <gmd:MD_Distribution>
        <gmd:transferOptions>
          <gmd:MD_DigitalTransferOptions>
            <gmd:onLine>
              <gmd:CI_OnlineResource>
                <gmd:linkage><gmd:URL>https://wms.example.com/service</gmd:URL></gmd:linkage>
                <gmd:protocol><gco:CharacterString>OGC:WMS</gco:CharacterString></gmd:protocol>
              </gmd:CI_OnlineResource>
            </gmd:onLine>
          </gmd:MD_DigitalTransferOptions>
        </gmd:transferOptions>
      </gmd:MD_Distribution>
    </gmd:distributionInfo>
  </gmd:MD_Metadata>
</csw:GetRecordByIdResponse>`,
                domDoc = new DOMParser().parseFromString(noNameXml, "application/xml");

            axiosStub.resolves({request: {responseXML: domDoc}, data: noNameXml});

            dispatch = sinon.stub().resolves(true);
            await actions.addLayerFromCswRecord({dispatch, rootGetters: {allFolders: []}}, {fileIdentifier, cswUrl});

            const layerCall = dispatch.getCalls().find(c => c.args[0] === "addLayerToLayerConfig" && c.args[1]?.layerConfig?.type === "layer");
            const alertCall = dispatch.getCalls().find(c => c.args[0] === "Alerting/addSingleAlert");

            expect(layerCall).to.not.exist;
            expect(alertCall).to.exist;
            expect(alertCall.args[1].category).to.equal("info");
        });

        it("should dispatch info alert when no WMS or WFS link is found", async () => {
            const noLinkXml = `<?xml version="1.0"?>
<csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
  <gmd:MD_Metadata xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
  </gmd:MD_Metadata>
</csw:GetRecordByIdResponse>`,
                domDoc = new DOMParser().parseFromString(noLinkXml, "application/xml");

            axiosStub.resolves({request: {responseXML: domDoc}, data: noLinkXml});

            await actions.addLayerFromCswRecord({dispatch}, {fileIdentifier, recordTitle, cswUrl});

            const alertCall = dispatch.getCalls().find(c => c.args[0] === "Alerting/addSingleAlert");

            expect(alertCall).to.exist;
            expect(alertCall.args[1].category).to.equal("info");
        });

        it("should warn and dispatch error alert when axios request fails", async () => {
            axiosStub.rejects(new Error("Network Error"));

            await actions.addLayerFromCswRecord({dispatch}, {fileIdentifier, recordTitle, cswUrl});

            expect(console.warn.calledOnce).to.be.true;
            expect(console.warn.firstCall.args[0]).to.include("addLayerFromCswRecord");

            const alertCall = dispatch.getCalls().find(c => c.args[0] === "Alerting/addSingleAlert");

            expect(alertCall).to.exist;
            expect(alertCall.args[1].category).to.equal("error");
        });
    });
});
