import sinon from "sinon";
import {expect} from "chai";
import {createLayerConfigsArray} from "../utils/functions.js";
import actions from "@modules/bufferAnalysis/store/actionsBufferAnalysis.js";
import stateBufferAnalysis from "@modules/bufferAnalysis/store/stateBufferAnalysis.js";
import {
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    LinearRing,
    Point,
    Polygon
} from "ol/geom.js";

describe("src/modules/bufferAnalysis/store/actionsBufferAnalysis.js", () => {
    let commit, dispatch, rootGetters, rootState, state;

    const defaultState = {...stateBufferAnalysis};

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            addLayer: sinon.spy(),
            removeLayer: sinon.spy()
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.stub().resolves(true);
        rootGetters = {
            "Maps/mode": "2D"
        };
        rootState = {
            Maps: {
                mode: "2D"
            },
            urlParams: {
                initvalues: [
                    "{\"applySelectedSourceLayer\":\"1711\"",
                    "\"applyBufferRadius\":\"1010\"",
                    "\"setResultType\":0",
                    "\"applySelectedTargetLayer\":\"2128\"}"
                ]
            }
        };
        state = Object.assign({}, defaultState);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("initJSTSParser", () => {
        it("initializes the JSTS parser by injecting open layer geometries ", () => {
            const inject = sinon.spy();

            actions.initJSTSParser({getters: {jstsParser: {inject: inject}}});
            expect(inject.calledOnce).to.be.true;

            expect(inject.args[0]).to.eql([Point, LineString, LinearRing, Polygon, MultiPoint, MultiLineString, MultiPolygon]);
        });
    });
    describe.skip("loadSelectOptions", () => {
        it("loads a number of layers as select options and commits them", async () => {
            const source = {getFeatures: ()=>[]},
                layers = createLayerConfigsArray(3),
                getters = {
                    "selectOptions": []
                };

            layers.forEach((layer, index) => {
                layers[index].get = key => key === "layerSource" ? source : null;
                layer.typ = "WFS";
            });

            rootGetters = {
                "allSubjectDataLayerConfigs": layers
            };

            await actions.loadSelectOptions({commit, dispatch, state, rootState: {}, getters, rootGetters});

            expect(commit.getCall(0).args).to.deep.equal(["addSelectOption", layers[0]]);
            expect(commit.getCall(1).args).to.deep.equal(["addSelectOption", layers[1]]);
            expect(commit.getCall(2).args).to.deep.equal(["addSelectOption", layers[2]]);
        });
    });
    describe.skip("applySelectedSourceLayer", () => {
        it("calls commit and dispatch each one time with correct parameters", async () => {
            state.bufferRadius = 1000;
            const layers = createLayerConfigsArray(2),
                layerConfig = {
                    layerConfigs: [{
                        id: layers[0].id,
                        layer: {
                            id: layers[0].id,
                            opacity: 1,
                            visibility: true
                        }
                    }]
                },
                layerConfigFalse = {
                    layerConfigs: [{
                        id: layers[1].id,
                        layer: {
                            id: layers[1].id,
                            visibility: false
                        }
                    }]
                };

            state.selectOptions = createLayerConfigsArray(2);
            await actions.applySelectedSourceLayer({commit, dispatch, state, rootState: {}, getters: state, rootGetters: {}}, layers[0]);

            expect(dispatch.getCall(0).args[0]).to.equal("replaceByIdInLayerConfig");
            expect(dispatch.getCall(0).args[1]).to.deep.equal(layerConfig);
            expect(dispatch.getCall(1).args[0]).to.equal("replaceByIdInLayerConfig");
            expect(dispatch.getCall(1).args[1]).to.deep.equal(layerConfigFalse);
            expect(commit.calledWith("setSelectedSourceLayer", layers[0])).to.be.true;
        });
    });
    describe.skip("applySelectedTargetLayer", () => {
        it("calls commit and dispatch each one time with correct parameters", async () => {
            state.bufferRadius = 1000;
            const layer = createLayerConfigsArray(1)[0],
                layerConfig = {
                    layerConfigs: [{
                        id: layer.id,
                        layer: {
                            id: layer.id,
                            visibility: true
                        }
                    }]
                };

            state.selectOptions = createLayerConfigsArray(3);

            await actions.applySelectedTargetLayer({commit, dispatch, state, rootState: {}, getters: state, rootGetters: {}}, layer);

            expect(commit.calledWith("setSelectedTargetLayer", layer)).to.be.true;
            expect(dispatch.getCall(0).args[0]).to.equal("replaceByIdInLayerConfig");
            expect(dispatch.getCall(0).args[1]).to.deep.equal(layerConfig);
            expect(dispatch.calledWith("checkIntersection")).to.be.true;
        });
    });
    describe("applySelectedTargetLayer", () => {
        it("throws an error if a layerId is not found", () => {
            expect(() => actions.applySelectedTargetLayer({commit, dispatch, getters: state}, "1234")).to.throw();
        });
    });
    describe("applyBufferRadius", () => {
        it("calls commit and dispatch each one time with correct parameters", () => {
            state.bufferRadius = 1000;
            actions.applyBufferRadius({commit, dispatch}, 1000);

            expect(commit.calledOnce).to.be.true;
            expect(commit.args[0][0]).to.equal("setBufferRadius");
            expect(commit.args[0][1]).to.equal(1000);
            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.args[0][0]).to.equal("removeGeneratedLayers");
            expect(dispatch.args[1][0]).to.equal("showBuffer");
        });
    });
    describe.skip("checkIntersection", () => {
        it("calls dispatch with correct parameters", async () => {
            state.selectedTargetLayer = {...createLayerConfigsArray(1)[0], get: sinon.stub().returns({setOpacity: () => ({})})};
            state.bufferLayer = {...createLayerConfigsArray(1)[0], getSource: ()=> ({getFeatures: ()=>({})})};

            await actions.checkIntersection({commit, dispatch, state, rootState: {}, getters: state, rootGetters: {}});

            expect(dispatch.calledWith("Maps/areLayerFeaturesLoaded", 0)).to.be.true;
        });
    });
    describe("showBuffer", () => {
        it("calls commit and addLayer once each", () => {
            state.selectedSourceLayer = {...createLayerConfigsArray(1)[0], get: ()=> ({getFeatures: ()=>[], setOpacity: () => ({})})};
            actions.showBuffer({commit, getters: state, dispatch, rootGetters});

            expect(commit.calledOnce).to.be.true;
            expect(dispatch.calledOnce).to.be.true;
        });
    });
    describe.skip("removeGeneratedLayers", () => {
        it("calls commit four times and removeLayer twice", async () => {
            state.resultLayer = createLayerConfigsArray(1)[0];
            state.bufferLayer = createLayerConfigsArray(1)[0];

            await actions.removeGeneratedLayers({commit, dispatch, state, rootState, getters: state, rootGetters: {}});

            expect(commit.getCall(0).args).to.deep.equal(["setResultLayer", {}]);
            expect(commit.getCall(1).args).to.deep.equal(["setBufferLayer", {}]);
            expect(commit.getCall(2).args).to.deep.equal(["setIntersections", []]);
            expect(commit.getCall(3).args).to.deep.equal(["setResultFeatures", []]);
        });
    });
    describe("resetModule", () => {
        it("calls dispatch three times", async () => {
            actions.resetModule({commit, getters: state, dispatch});

            expect(dispatch.callCount).to.equal(3);
        });
    });

    describe("applyValuesFromSavedUrlBuffer", () => {
        beforeEach(() => {
            state.selectOptions = createLayerConfigsArray(3);
        });

        it("applies values correctly from new MENU format", async () => {
            const rootStateNew = {
                urlParams: {
                    MENU: JSON.stringify({
                        main: {currentComponent: "root"},
                        secondary: {
                            currentComponent: "bufferAnalysis",
                            attributes: {
                                source: state.selectOptions[0].id,
                                target: state.selectOptions[1].id,
                                radius: "400",
                                result: 1
                            }
                        }
                    })
                }
            };

            await actions.applyValuesFromSavedUrlBuffer({rootState: rootStateNew, state, commit, dispatch});

            expect(dispatch.calledWith("applySelectedSourceLayer", state.selectOptions[0])).to.be.true;
            expect(dispatch.calledWith("applySelectedTargetLayer", state.selectOptions[1])).to.be.true;
            expect(commit.calledWith("setInputBufferRadius", 400)).to.be.true;
            expect(commit.calledWith("setResultType", 1)).to.be.true;
        });

        it("applies values correctly from legacy initvalues format", async () => {
            const legacyValues = {
                applySelectedSourceLayer: state.selectOptions[0].id,
                applyBufferRadius: 500,
                setResultType: 0,
                applySelectedTargetLayer: state.selectOptions[2].id
            };

            const rootStateLegacy = {
                urlParams: {
                    ISINITOPEN: "bufferAnalysis",
                    INITVALUES: JSON.stringify(legacyValues)
                }
            };

            await actions.applyValuesFromSavedUrlBuffer({rootState: rootStateLegacy, state, commit, dispatch});

            expect(dispatch.calledWith("applySelectedSourceLayer", state.selectOptions[0])).to.be.true;
            expect(dispatch.calledWith("applySelectedTargetLayer", state.selectOptions[2])).to.be.true;
            expect(commit.calledWith("setInputBufferRadius", 500)).to.be.true;
            expect(commit.calledWith("setResultType", 0)).to.be.true;
        });

        it("does nothing if URL params are missing", async () => {
            const emptyRootState = {urlParams: {}};

            await actions.applyValuesFromSavedUrlBuffer({rootState: emptyRootState, state, commit, dispatch});

            expect(dispatch.called).to.be.false;
            expect(commit.called).to.be.false;
        });
    });
});
