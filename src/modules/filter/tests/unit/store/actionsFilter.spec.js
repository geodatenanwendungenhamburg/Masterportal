import sinon from "sinon";
import {expect} from "chai";
import actions from "@modules/filter/store/actionsFilter.js";
import state from "@modules/filter/store/stateFilter.js";

const {
    updateRules,
    deleteAllRules,
    updateFilterHits,
    serializeState,
    setRulesArray,
    deserializeState,
    jumpToFilter
} = actions;

describe("tools/filter/store/actionsFilter", () => {
    describe("setRulesArray", () => {
        it("should set the rules array", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {
                    rulesOfFilters: []
                };

            setRulesArray({commit, dispatch, state}, payload);

            expect(commit.calledWith("setRulesOfFilters", {
                rulesOfFilters: payload.rulesOfFilters
            })).to.be.true;
        });
    });
    describe("updateRules", () => {
        it("update rules by given rule", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {
                    filterId: 0,
                    snippetId: 0,
                    rule: {}
                };

            updateRules({commit, dispatch, state}, payload);

            expect(commit.getCall(0).args).to.deep.equal(["addSpotForRule", {filterId: payload.filterId}]);
            expect(commit.getCall(1).args).to.deep.equal(["updateRules", {
                filterId: payload.filterId,
                rules: [{}]
            }]);
        });
    });
    describe("deleteAllRules", () => {
        it("deletes all rules by given filterId", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {
                    filterId: 0
                },
                localState = {
                    rulesOfFilters: [
                        [
                            {},
                            {}
                        ]
                    ]
                };

            deleteAllRules({commit, dispatch, state: localState}, payload);

            expect(commit.calledWith("updateRules", {
                filterId: payload.filterId,
                rules: [false, false]
            })).to.be.true;
        });
    });
    describe("updateFilterHits", () => {
        it("updates the hits for given filterId", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {
                    filterId: 0,
                    hits: 10
                };

            updateFilterHits({commit, dispatch, state}, payload);

            expect(commit.calledWith("updateFilterHits", {
                filterId: payload.filterId,
                hits: payload.hits
            })).to.be.true;
        });
    });
    describe("serializeState", () => {
        it("serialize the state", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                rulesOfFilters = state.rulesOfFilters,
                selectedAccordions = state.selectedAccordions,
                selectedGroups = state.selectedGroups,
                geometryFeature = {},
                geometrySelectorOptions = state.geometrySelectorOptions,
                result = {
                    rulesOfFilters,
                    selectedAccordions,
                    selectedGroups,
                    geometryFeature,
                    geometrySelectorOptions
                },
                serializiedString = JSON.stringify(result);

            serializeState({commit, dispatch, state});

            expect(commit.calledWith("setSerializedString", {
                serializiedString
            })).to.be.true;
        });
    });
    describe("deserializeState", () => {
        it("deserialize the state", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                rulesOfFilters = [],
                selectedAccordions = [],
                geometryFeature = {},
                additionalGeometries = [],
                geometrySelectorOptions = {
                    invertGeometry: true,
                    additionalGeometries
                },
                payload = {
                    rulesOfFilters,
                    selectedAccordions,
                    geometryFeature,
                    geometrySelectorOptions
                };

            await deserializeState({commit, dispatch, state}, payload);

            expect(dispatch.calledWith("setRulesArray", {rulesOfFilters})).to.be.true;
            expect(commit.calledWith("setSelectedAccordions", selectedAccordions)).to.be.true;
            expect(commit.calledWith("setSelectedGroups", [])).to.be.true;
            expect(dispatch.calledWith("setGeometryFilterByFeature", {jsonFeature: geometryFeature, invert: true})).to.be.true;
            expect(commit.calledWith("setGeometrySelectorOptions", geometrySelectorOptions)).to.be.true;
            expect(commit.calledWith("setAdditionalGeometries", {additionalGeometries})).to.be.true;
        });
    });
    describe("jumpToFilter", () => {
        it("sets the jumpToId property", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {filterId: 0};

            jumpToFilter({commit, dispatch, state}, payload);

            expect(commit.calledWith("setJumpToId", payload.filterId)).to.be.true;
        });
    });
});
