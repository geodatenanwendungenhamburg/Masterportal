import sinon from "sinon";
import {expect} from "chai";

import actions from "@modules/wmsTime/store/actionsWmsTime.js";
import initialState from "@modules/wmsTime/store/stateWmsTime.js";
import layerCollection from "@core/layers/js/layerCollection.js";

describe("src/modules/wmsTime/store/actionsWmsTime.js", () => {
    let commit, dispatch, getters, rootGetters, state, map, updateTimeSpy;

    beforeAll(() => {
        mapCollection.clear();
        map = {
            id: "ol",
            mode: "2D",
            removeLayer: sinon.spy()
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        updateTimeSpy = sinon.spy();
        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = {
            currentTimeSliderObject: {keyboardMovement: 5},
            defaultDimensionName: "TIME"
        };
        rootGetters = {
            "Modules/LayerSwiper/active": false,
            visibleLayerConfigs: [],
            layerConfigById: sinon.stub().returns({})
        };
        map.removeLayer = sinon.spy();
        sinon.stub(layerCollection, "getOlLayers").returns(
            [
                {name: "ersterLayer", values_: {id: "123"}, getSource: () => state.source, features: [{getAttributesToShow: () => "TestAttributes"}], geometryType: "Point"},
                {name: "zweiterLayer", values_: {id: "456"}, features: [{getAttributesToShow: () => "TestAttributes"}], geometryType: "Point"},
                {name: "dritterLayer", values_: {id: "789"}, features: [{getAttributesToShow: () => "TestAttributes"}], geometryType: "Point"}
            ]
        );
        sinon.stub(layerCollection, "getLayerById").returns({
            getLayerSource: () => ({
                getParams: () => {
                    return {TIME: "2020"};
                },
                updateParams: sinon.spy()
            }),
            getLayer: sinon.stub().returns({
                once: sinon.stub(),
                on: sinon.stub(),
                un: sinon.stub()
            }),
            attributes: {
                name: "bester Layer der Welt",
                id: "123",
                time: true,
                url: "www.abc.de",
                transparency: "30",
                level: "2",
                layers: "base",
                version: "1.3.0",
                parentId: "root",
                gfiAttributes: ["name", "time"],
                featureCount: 100
            },
            updateTime: updateTimeSpy
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("toggleSwiper", () => {
        beforeEach(() => {
            commit = sinon.spy();
            dispatch = sinon.spy();
            state = {...initialState, layerSwiper: {active: false}};
        });

        it("should activate LayerSwiper if currently inactive", async () => {
            await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, "someId");

            expect(commit.calledWith("Modules/LayerSwiper/setActive", true, {root: true})).to.be.true;
            expect(commit.calledWith("Modules/LayerSwiper/setTargetLayerId", null, {root: true})).to.be.true;
            expect(updateTimeSpy.calledOnce).to.be.true;
            expect(updateTimeSpy.firstCall.args[0]).to.equals("someId");
            expect(updateTimeSpy.firstCall.args[1]).to.equals("TIME");
            expect(updateTimeSpy.firstCall.args[2]).to.equals("2020");
        });

        it("should deactivate LayerSwiper if currently active", async () => {
            rootGetters["Modules/LayerSwiper/active"] = true;

            await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, "someId");

            expect(commit.calledWith("Modules/LayerSwiper/setActive", false, {root: true})).to.be.true;
            expect(dispatch.calledWith("replaceByIdInLayerConfig")).to.be.true;
        });

        it("should dispatch updateLayerConfigZIndex and assign correct zIndex when comparing time layers", async () => {
            rootGetters["Modules/LayerSwiper/active"] = true;
            rootGetters.allLayerConfigs = [
                {id: "layer1", zIndex: 2},
                {id: "layer2", zIndex: 5},
                {id: "layer3"},
                {id: "layer4", zIndex: "notANumber"}
            ];
            layerCollection.getLayerById.returns({attributes: {zIndex: 3}});

            await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, "someId");

            const updateZIndexCall = dispatch.getCalls().find(call => call.args[0] === "updateLayerConfigZIndex");

            expect(updateZIndexCall).to.exist;
            expect(updateZIndexCall.args[1].layerContainer).to.deep.equal([
                {id: "layer1", zIndex: 2},
                {id: "layer2", zIndex: 5}
            ]);
            expect(updateZIndexCall.args[1].maxZIndex).to.equal(3);
            expect(updateZIndexCall.args[2]).to.deep.equal({root: true});
        });
    });

    describe("windowWidthChanged", () => {
        beforeEach(() => {
            state.timeSlider.currentLayerId = "123";
        });

        it("should call the mutation to set the windowWidth", () => {
            actions.windowWidthChanged({commit, dispatch, state, getters, rootGetters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args).to.eql(["setWindowWidth"]);
        });
        it("should set the windowWidth and toggle the swiper if conditional is met", () => {
            rootGetters["Modules/LayerSwiper/active"] = true;

            actions.windowWidthChanged({commit, dispatch, state, getters, rootGetters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args).to.eql(["setWindowWidth"]);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args).to.eql(["toggleSwiper", "123_secondLayer"]);
        });
    });
});
