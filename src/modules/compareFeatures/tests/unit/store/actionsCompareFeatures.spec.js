import sinon from "sinon";
import {expect} from "chai";
import actions from "@modules/compareFeatures/store/actionsCompareFeatures.js";

const {
    isFeatureOnCompareList,
    removeFeature,
    prepareFeatureListToShow
} = actions;

describe("src/modules/compareFeatures/store/actionsCompareFeatures.js", () => {
    let commit, dispatch;

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("isFeatureOnCompareList", () => {
        it("adds feature", () => {
            const state = {
                    gfiFeature: {featureId: "feature2", layerId: "1711", properties: {Name: "Beispielschule"}},
                    layerFeatures: {"1711": [{featureId: "feature1", layerId: "1711"}]},
                    numberOfFeaturesToShow: 3
                },
                getters = {
                    isFeatureSelected: sinon.stub()
                };

            getters.isFeatureSelected.returns(false);
            isFeatureOnCompareList({state, commit, dispatch, getters}, state.gfiFeature);

            expect(commit.firstCall.args[0]).to.equal("setListFull");
            expect(commit.firstCall.args[1]).to.equal(false);

            expect(commit.secondCall.args[0]).to.equal("addFeatureToLayer");
            expect(commit.secondCall.args[1]).to.deep.equal(state.gfiFeature);

            expect(commit.thirdCall.args[0]).to.equal("setCurrentFeatureName");
            expect(commit.thirdCall.args[1]).to.equal("Beispielschule");

            expect(commit.getCall(3).args[0]).to.equal("setSelectedLayerId");
            expect(commit.getCall(3).args[1]).to.equal("1711");

            expect(dispatch.callCount).to.equal(1);
            expect(dispatch.firstCall.args[0]).to.equal("prepareFeatureListToShow");
            expect(dispatch.firstCall.args[1]).to.deep.equal({featureId: "feature1", layerId: "1711"});
        });
        it("triggers alert and sets list full when feature limit is reached", () => {
            const state = {
                    numberOfFeaturesToShow: 1,
                    layerFeatures: {
                        "1711": [
                            {featureId: "feature1", layerId: "1711"}
                        ]
                    },
                    gfiFeature: {featureId: "feature2", layerId: "1711", properties: {Name: "Another Feature"}}

                },
                getters = {
                    isFeatureSelected: sinon.stub()
                };
            let alertPayload = {};

            getters.isFeatureSelected.returns(false);


            isFeatureOnCompareList({state, commit, dispatch, getters}, state.gfiFeature);

            sinon.assert.calledTwice(commit);
            expect(commit.firstCall.args[0]).to.equal("setListFull");
            expect(commit.firstCall.args[1]).to.equal(false);

            expect(commit.secondCall.args[0]).to.equal("setListFull");
            expect(commit.secondCall.args[1]).to.equal(true);

            sinon.assert.calledOnce(dispatch);
            expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");

            alertPayload = dispatch.firstCall.args[1];
            expect(alertPayload).to.deep.equal({
                category: "info",
                content: "modules.compareFeatures.feedback.limitReached"
            });
        });
    });

    describe("removeFeature", () => {
        it("removes the feature from the layer", () => {
            const state = {
                    gfiFeature: {layerId: "1711", featureId: "1234"},
                    preparedList: {"1711": [{featureId: "1234", layerId: "1711"}]}
                },
                idFeature = state.gfiFeature.featureId,
                idLayer = state.gfiFeature.layerId;

            removeFeature({state, commit}, {idFeature, idLayer});
            expect(commit.firstCall.args[0]).to.equal("removeFeatureFromLists");
            expect(commit.firstCall.args[1]).to.eql({
                features: [{featureId: "1234", layerId: "1711"}],
                featureId: "1234",
                selectedLayerId: "1711"
            });
        });
    });
    describe("prepareFeatureListToShow", () => {
        it("prepares the feature list", () => {
            const state = {
                list: [],
                gfiAttributes: {layerId: "1711", featureId: "Feature-1", properties: {name: "Krankenhaus-1", id: "Feature-1", Ort: "Hamburg"}},
                layerId: 1711,
                layerFeatures: {"1711": [{layerId: "1711", featureId: "Feature-1", properties: {name: "Krankenhaus-1", id: "Feature-1", Ort: "Hamburg"}}]},
                featureList: {"1711": [{layerId: "1711", featureId: "Feature-1", properties: {name: "Krankenhaus-1", id: "Feature-1", Ort: "Hamburg"}}]},
                preparedList: {}
            };

            prepareFeatureListToShow({state, commit}, state.gfiAttributes);
            expect(commit.firstCall.args[0]).to.equal("setHasFeatures");
            expect(commit.secondCall.args[0]).to.equal("setList");
        });
    });
});
