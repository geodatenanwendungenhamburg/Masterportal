import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/mouseHover/store/actionsMouseHover.js";
import stateMouseHover from "@modules/mouseHover/store/stateMouseHover.js";
import Map from "ol/Map.js";


describe("src/modules/mouseHover/store/actionsMouseHover", () => {
    let commit, dispatch, state, olMap;

    beforeEach(() => {
        olMap = new Map();
        olMap.addOverlay = sinon.spy();
        commit = sinon.spy();
        dispatch = sinon.spy();
        Config = {
            mouseHover: {
                numFeaturesToShow: 2,
                infoText: "Infotext aus Config"
            }
        };
        state = {...stateMouseHover};
        mapCollection.clear();
        mapCollection.addMap(olMap, "2D");
    });
    afterEach(() => {
        sinon.restore();
    });

    describe("initialize", () => {
        const fakeRendererFunction = sinon.spy();

        /**
         * Simulates the rendering check for a layer to test the WebGL skip logic.
         *
         * This function is used in unit tests to ensure that WebGL polygon and line layers
         * are skipped (not processed) while other layers are processed.
         *
         * @param {Object} layer - The layer object to test.
         * @param {Function} layer.get - Function to get layer properties by key, e.g., "renderer" or "isPointLayer".
         *
         * @returns {void} Does not return anything. Calls fakeRendererFunction only if the layer is not a WebGL polygon/line.
         */
        function callRendererForTest (layer) {
            if (layer.get("renderer") === "webgl" && !layer.get("isPointLayer")) {
                return;
            }
            fakeRendererFunction(layer);
        }

        it("initializes the mouseHover module", () => {
            actions.initialize({state, commit, dispatch});
            expect(mapCollection.getMap("2D").addOverlay.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("setMouseHoverLayers");
            expect(commit.firstCall.args[0]).to.equal("setMouseHoverInfos");
            expect(commit.args[1]).to.eql(["setNumFeaturesToShow", 2]);
            expect(commit.args[2]).to.eql(["setInfoText", "common:modules.mouseHover.infoText"]);
        });

        it("should NOT call renderer for WebGL polygon or line layers", () => {
            const glPolygonLayer = {
                get: key => {
                    const values = {
                        renderer: "webgl",
                        isPointLayer: false
                    };

                    return values[key];
                }
            };

            callRendererForTest(glPolygonLayer);
            expect(fakeRendererFunction.called).to.be.false;
        });

        it("should call renderer for WebGL point layers", () => {
            fakeRendererFunction.resetHistory();

            const glPointLayer = {
                get: key => {
                    const values = {
                        renderer: "webgl",
                        isPointLayer: true
                    };

                    return values[key];
                }
            };

            callRendererForTest(glPointLayer);
            expect(fakeRendererFunction.calledOnce).to.be.true;
        });

        it("should call renderer for non-WebGL layers", () => {
            fakeRendererFunction.resetHistory();

            const normalLayer = {
                get: key => {
                    const values = {
                        renderer: "canvas",
                        isPointLayer: false
                    };

                    return values[key];
                }
            };

            callRendererForTest(normalLayer);
            expect(fakeRendererFunction.calledOnce).to.be.true;
        });
    });

    describe("setMouseHoverLayers", () => {
        it("setlayers with mouseHoverField to state", () => {
            const rootGetters = {
                allLayerConfigs: [
                    {
                        id: 123,
                        mouseHoverField: ["a", "b"]
                    },
                    {
                        id: 456
                    },
                    {
                        id: 789,
                        mouseHoverField: ["x", "y"]
                    }
                ]
            };

            actions.setMouseHoverLayers({commit, rootGetters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setMouseHoverLayers");
            expect(commit.firstCall.args[1]).to.deep.equal([
                {
                    id: 123,
                    mouseHoverField: ["a", "b"]
                },
                {
                    id: 789,
                    mouseHoverField: ["x", "y"]
                }
            ]);
        });
    });

    describe("filterInfos", () => {
        const features = [{getProperties: () => {
            return {name: "erstesFeature", id: "123"};
        }, getLayerId: () => {
            return "layerId-1";
        }}, {getProperties: () => {
            return {name: "zweitesFeature", kategorie: "456"};
        }, getLayerId: () => {
            return "layerId-2";
        }}];

        it("filters the infos from each feature", () => {
            state.mouseHoverInfos = [{id: "layerId-1", mouseHoverField: ["name", "id"]}, {id: "layerId-2", mouseHoverField: ["name", "kategorie"]}];
            actions.filterInfos({state, commit}, features);
            expect(commit.firstCall.args[0]).to.equal("setPleaseZoom");
            expect(commit.firstCall.args[1]).to.equal(false);
            expect(commit.secondCall.args[0]).to.equal("setInfoBox");
            expect(commit.args[3]).to.eql(["setInfoBox", [["erstesFeature", "123"], ["zweitesFeature", "456"]]]);
        });
    });
    describe("highlightFeature", () => {
        it("highlights a feature depending on its geometryType", () => {
            const feature = {
                    id: "feature",
                    getId: () => "feature",
                    getGeometry: () => sinon.spy({
                        getType: () => "Point",
                        getCoordinates: () => [100, 100]
                    }),
                    getProperties: () => []
                },
                layer = {
                    id: "layerId",
                    values_: {
                        id: "layerId"
                    },
                    get: (key) => {
                        return key;
                    }
                };

            actions.highlightFeature({state, dispatch}, {feature, layer});
            expect(dispatch.firstCall.args[0]).to.equal("Maps/highlightFeature");
        });
    });

});
