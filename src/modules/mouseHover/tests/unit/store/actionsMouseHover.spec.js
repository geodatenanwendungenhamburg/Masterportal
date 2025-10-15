import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/mouseHover/store/actionsMouseHover";
import stateMouseHover from "@modules/mouseHover/store/stateMouseHover";
import Map from "ol/Map";


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
    afterEach(sinon.restore);

    describe("initialize", () => {
        it("initializes the mouseHover module", () => {
            actions.initialize({state, commit, dispatch});
            expect(mapCollection.getMap("2D").addOverlay.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("setMouseHoverLayers");
            expect(commit.firstCall.args[0]).to.equal("setMouseHoverInfos");
            expect(commit.args[1]).to.eql(["setNumFeaturesToShow", 2]);
            expect(commit.args[2]).to.eql(["setInfoText", "common:modules.mouseHover.infoText"]);
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
