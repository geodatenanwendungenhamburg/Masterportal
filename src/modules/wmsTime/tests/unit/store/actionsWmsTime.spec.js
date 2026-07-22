import sinon from "sinon";
import {expect} from "chai";

import actions, {isCoveredByOtherBaselayer} from "@modules/wmsTime/store/actionsWmsTime.js";
import initialState from "@modules/wmsTime/store/stateWmsTime.js";
import layerCollection from "@core/layers/js/layerCollection.js";

describe("src/modules/wmsTime/store/actionsWmsTime.js", () => {
    let commit, dispatch, getters, rootGetters, state, map, updateTimeSpy,
        originalInnerWidth;

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
        originalInnerWidth = window.innerWidth;
        Object.defineProperty(window, "innerWidth", {configurable: true, writable: true, value: 1000});
        getters = {
            currentTimeSliderObject: {keyboardMovement: 5},
            defaultDimensionName: "TIME",
            windowWidth: 900,
            minWidth: false,
            defaultValue: "2020"
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
        Object.defineProperty(window, "innerWidth", {configurable: true, writable: true, value: originalInnerWidth});
    });

    describe("toggleSwiper", () => {
        beforeEach(() => {
            commit = sinon.spy();
            dispatch = sinon.spy();
            state = {...initialState, layerSwiper: {active: false}};
        });

        it("should activate LayerSwiper consistently for base and second layer ids", async () => {
            for (const id of ["someId", "someId_secondLayer"]) {
                commit.resetHistory();
                updateTimeSpy.resetHistory();

                await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, id);

                expect(commit.calledWith("Modules/LayerSwiper/setActive", true, {root: true})).to.be.true;
                expect(commit.calledWith("Modules/LayerSwiper/setSourceLayerId", "someId", {root: true})).to.be.true;
                expect(commit.calledWith("Modules/LayerSwiper/setTargetLayerId", "someId_secondLayer", {root: true})).to.be.true;
                expect(updateTimeSpy.calledOnce).to.be.true;
                expect(updateTimeSpy.firstCall.args[0]).to.equals("someId_secondLayer");
                expect(updateTimeSpy.firstCall.args[1]).to.equals("TIME");
                expect(updateTimeSpy.firstCall.args[2]).to.equals("2020");
            }
        });

        it("should deactivate LayerSwiper if currently active", async () => {
            rootGetters["Modules/LayerSwiper/active"] = true;

            await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, "someId");

            expect(commit.calledWith("Modules/LayerSwiper/setActive", false, {root: true})).to.be.true;
            expect(dispatch.calledWith("replaceByIdInLayerConfig")).to.be.true;
        });

        it("should always remove second layer from tree for both deactivate entry ids", async () => {
            rootGetters["Modules/LayerSwiper/active"] = true;
            for (const id of ["someId", "someId_secondLayer"]) {
                dispatch.resetHistory();

                await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, id);

                const secondLayerUpdateCall = dispatch.getCalls().find(call => call.args[0] === "replaceByIdInLayerConfig"
                    && call.args[1]?.layerConfigs?.[0]?.id === "someId_secondLayer"
                );

                expect(secondLayerUpdateCall).to.exist;
                expect(secondLayerUpdateCall.args[1].layerConfigs[0].layer.showInLayerTree).to.be.false;
            }
        });

        it("should keep displayed slider time in sync when deactivating via second layer id", async () => {
            rootGetters["Modules/LayerSwiper/active"] = true;

            await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, "someId_secondLayer");

            expect(commit.calledWith("setTimeSliderDefaultValue", "2020")).to.be.true;
        });

        it("should take remaining base layer time when second layer is removed", async () => {
            rootGetters["Modules/LayerSwiper/active"] = true;
            layerCollection.getLayerById.callsFake(id => ({
                getLayerSource: () => ({getParams: () => ({TIME: id === "someId" ? "2019" : "2020"})}),
                attributes: {transparency: "30", zIndex: 3},
                getLayer: () => ({once: sinon.stub(), on: sinon.stub(), un: sinon.stub()}),
                updateTime: updateTimeSpy
            }));


            await actions.toggleSwiper({commit, state, getters, dispatch, rootGetters}, "someId_secondLayer");

            expect(commit.calledWith("setTimeSliderDefaultValue", "2019")).to.be.true;
        });

        it("should dispatch updateLayerConfigZIndex and assign correct zIndex when comparing time layers", async () => {
            rootGetters["Modules/LayerSwiper/active"] = false;
            rootGetters.allLayerConfigs = [
                {id: "layer1", zIndex: 2},
                {id: "layer2", zIndex: 5},
                {id: "layer3"},
                {id: "layer4", zIndex: "notANumber"}
            ];
            layerCollection.getLayerById.returns({
                attributes: {zIndex: 3},
                getLayerSource: () => ({getParams: () => ({TIME: "2020"})}),
                getLayer: () => ({once: sinon.stub(), on: sinon.stub(), un: sinon.stub()}),
                updateTime: updateTimeSpy
            });

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

describe("isCoveredByOtherBaselayer", () => {
    it("should return true when a visible baselayer with higher zIndex exists", () => {
        const layer = {id: "wmsLayer", baselayer: true, zIndex: 1};
        const visibleLayers = [layer, {id: "otherBg", baselayer: true, zIndex: 2}];

        expect(isCoveredByOtherBaselayer(layer, visibleLayers)).to.be.true;
    });

    it("should return false when no other baselayer with higher zIndex exists", () => {
        const layer = {id: "wmsLayer", baselayer: true, zIndex: 2};
        const visibleLayers = [layer, {id: "otherBg", baselayer: true, zIndex: 1}];

        expect(isCoveredByOtherBaselayer(layer, visibleLayers)).to.be.false;
    });

    it("should return false when layer is not a baselayer", () => {
        const layer = {id: "wmsLayer", baselayer: false, zIndex: 1};
        const visibleLayers = [layer, {id: "otherBg", baselayer: true, zIndex: 2}];

        expect(isCoveredByOtherBaselayer(layer, visibleLayers)).to.be.false;
    });
});
