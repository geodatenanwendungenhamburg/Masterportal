import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/compareMaps/store/actionsCompareMaps";
import layerCollection from "@core/layers/js/layerCollection";

describe("modules/compareMaps/store/actionsCompareMaps", () => {
    let commit, dispatch, state, rootGetters;

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
        state = {
            selectedLayer1Id: "layer1",
            selectedLayer2Id: "layer2"
        };
        rootGetters = {
            "Modules/WmsTime/layerAppendix": "_appendix"
        };
        const layer1 = {get: () => "layer1", getLayer: () => ({values_: {id: "layer1"}}), attributes: {id: "layer1"}},
            layer2 = {get: () => "layer2", getLayer: () => ({values_: {id: "layer2"}}), attributes: {id: "layer2"}};

        sinon.stub(layerCollection, "getLayers").returns([layer1, layer2]);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should activate LayerSwiper", () => {
        actions.activateSwiper({state, commit, rootGetters});

        expect(commit.calledWith("Modules/LayerSwiper/setActive", true, {root: true})).to.be.true;
        expect(commit.calledWith("Modules/LayerSwiper/setSourceLayerId", sinon.match.any, {root: true})).to.be.true;
        expect(commit.calledWith("Modules/LayerSwiper/setTargetLayerId", sinon.match.any, {root: true})).to.be.true;
    });

    it("should deactivate LayerSwiper", () => {
        actions.deactivateSwiper({state, commit, dispatch, rootGetters});

        expect(dispatch.calledWith("resetLayer", "layer1")).to.be.true;
        expect(dispatch.calledWith("resetLayer", "layer2")).to.be.true;
        expect(commit.calledWith("Modules/LayerSwiper/setActive", false, {root: true})).to.be.true;
        expect(commit.calledWith("Modules/LayerSwiper/setSourceLayerId", sinon.match.any, {root: true})).to.be.true;
        expect(commit.calledWith("Modules/LayerSwiper/setTargetLayerId", sinon.match.any, {root: true})).to.be.true;
    });
});
