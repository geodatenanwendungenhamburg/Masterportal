import {expect} from "chai";
import sinon from "sinon";

import actions from "@modules/measure/store/actionsMeasure.js";
import source from "@modules/measure/js/measureSource.js";
import makeDraw2d from "@modules/measure/js/measureDraw.js";
import makeDraw3d from "@modules/measure/js/measureDraw3d.js";

const {deleteFeatures, createDrawInteraction, removeDrawInteraction, urlParams} = actions;

describe("src/modules/measure/store/actionsMeasure", function () {
    let state, commit, dispatch, getters, rootGetters, clear;

    beforeEach(() => {
        state = {
            unlisteners: [sinon.spy()],
            interaction: {
                abortDrawing: sinon.spy()
            },
            selectedGeometry: "LineString"
        };
        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = {
            unlisteners: []
        };
        rootGetters = {
            "Maps/mode": "2D"
        };
        clear = sinon.spy();
        sinon.stub(source, "clear").callsFake(clear);
    });

    afterEach(sinon.restore);

    describe("deleteFeatures", function () {
        it("aborts drawing", function () {
            deleteFeatures({state, commit});

            expect(state.interaction.abortDrawing.calledOnce).to.be.true;
        });

        it("calls all unlisteners", function () {
            deleteFeatures({state, commit});

            expect(state.unlisteners[0].calledOnce).to.be.true;
        });

        it("clears the source", function () {
            deleteFeatures({state, commit});

            expect(clear.calledOnce).to.be.true;
        });

        it("resets the store", function () {
            deleteFeatures({state, commit, rootGetters});

            expect(commit.calledWith("setLines", {})).to.be.true;
            expect(commit.calledWith("setPolygons", {})).to.be.true;
            expect(commit.calledWith("setUnlisteners", [])).to.be.true;
        });

        it("handles null interaction gracefully", function () {
            state.interaction = null;

            expect(() => deleteFeatures({state, commit})).to.not.throw();
        });

        it("calls multiple unlisteners", function () {
            const unlistener1 = sinon.spy();
            const unlistener2 = sinon.spy();
            const unlistener3 = sinon.spy();

            state.unlisteners = [unlistener1, unlistener2, unlistener3];

            deleteFeatures({state, commit});

            expect(unlistener1.calledOnce).to.be.true;
            expect(unlistener2.calledOnce).to.be.true;
            expect(unlistener3.calledOnce).to.be.true;
        });

        it("handles empty unlisteners array", function () {
            state.unlisteners = [];

            expect(() => deleteFeatures({state, commit})).to.not.throw();
        });
    });

    describe("createDrawInteraction", function () {
        it.skip("calls removeDrawInteraction before creating new interaction", function () {
            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(dispatch.calledWith("removeDrawInteraction")).to.be.true;
        });

        it.skip("commits interaction to store", function () {
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(commit.calledWith("setInteraction", sinon.match.object)).to.be.true;
        });

        it.skip("creates 2D draw interaction in 2D mode", function () {
            const mockInteraction = {
                abortDrawing: sinon.spy(),
                interaction3d: false
            };

            sinon.stub(makeDraw2d, "default").returns(mockInteraction);
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(dispatch.calledWith("Maps/addInteraction", sinon.match.any, {root: true})).to.be.true;
            expect(commit.calledWith("setInteraction", sinon.match.object)).to.be.true;
        });

        it.skip("creates 3D draw interaction in 3D mode", function () {
            const mockInteraction = {
                abortDrawing: sinon.spy(),
                stopInteraction: sinon.spy(),
                interaction3d: true
            };

            sinon.stub(makeDraw3d, "default").returns(mockInteraction);
            rootGetters["Maps/mode"] = "3D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(dispatch.calledWith("deleteFeatures")).to.be.true;
            expect(commit.calledWith("setInteraction", sinon.match.object)).to.be.true;
        });

        it.skip("calls deleteFeatures when switching from 3D to 2D with existing unlisteners", function () {
            getters.unlisteners = [sinon.spy()];
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(dispatch.calledWith("deleteFeatures")).to.be.true;
        });

        it.skip("does not call deleteFeatures in 2D mode without unlisteners", function () {
            getters.unlisteners = [];
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(dispatch.calledWith("deleteFeatures")).to.be.false;
        });

        it.skip("passes correct parameters to makeDraw2d for LineString", function () {
            const makeDraw2dMock = sinon.stub().returns({
                abortDrawing: sinon.spy()
            });

            Object.getPrototypeOf(actions.createDrawInteraction).makeDraw2d = makeDraw2dMock;
            state.selectedGeometry = "LineString";
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(commit.calledWith("setInteraction", sinon.match.object)).to.be.true;
        });

        it.skip("passes correct parameters to makeDraw2d for Polygon", function () {
            state.selectedGeometry = "Polygon";
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(commit.calledWith("setInteraction", sinon.match.object)).to.be.true;
        });

        it.skip("adds 2D interaction to map", function () {
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(dispatch.calledWith("Maps/addInteraction", sinon.match.any, {root: true})).to.be.true;
        });

        it.skip("does not add 3D interaction to map", function () {
            rootGetters["Maps/mode"] = "3D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            const addInteractionCall = dispatch.getCalls().find(
                call => call.args[0] === "Maps/addInteraction"
            );

            expect(addInteractionCall).to.be.undefined;
        });

        it.skip("commits interaction to store", function () {
            rootGetters["Maps/mode"] = "2D";

            createDrawInteraction({state, dispatch, commit, getters, rootGetters});

            expect(commit.calledWith("setInteraction", sinon.match.object)).to.be.true;
        });
    });

    describe("removeDrawInteraction", function () {
        it("aborts drawing when interaction exists", function () {
            const mockInteraction = {
                abortDrawing: sinon.spy(),
                interaction3d: false
            };

            state.interaction = mockInteraction;

            removeDrawInteraction({state, dispatch, commit});

            expect(mockInteraction.abortDrawing.calledOnce).to.be.true;
        });

        it("removes 2D interaction from map", function () {
            const mockInteraction = {
                abortDrawing: sinon.spy(),
                interaction3d: false
            };

            state.interaction = mockInteraction;

            removeDrawInteraction({state, dispatch, commit});

            expect(dispatch.calledWith("Maps/removeInteraction", mockInteraction, {root: true})).to.be.true;
        });

        it("calls stopInteraction for 3D interaction", function () {
            const mockInteraction = {
                abortDrawing: sinon.spy(),
                stopInteraction: sinon.spy(),
                interaction3d: true
            };

            state.interaction = mockInteraction;

            removeDrawInteraction({state, dispatch, commit});

            expect(mockInteraction.stopInteraction.calledOnce).to.be.true;
        });

        it("does not remove 3D interaction from map", function () {
            const mockInteraction = {
                abortDrawing: sinon.spy(),
                stopInteraction: sinon.spy(),
                interaction3d: true
            };

            state.interaction = mockInteraction;

            removeDrawInteraction({state, dispatch, commit});

            const removeInteractionCall = dispatch.getCalls().find(
                call => call.args[0] === "Maps/removeInteraction"
            );

            expect(removeInteractionCall).to.be.undefined;
        });

        it("sets interaction to null after removal", function () {
            const mockInteraction = {
                abortDrawing: sinon.spy(),
                interaction3d: false
            };

            state.interaction = mockInteraction;

            removeDrawInteraction({state, dispatch, commit});

            expect(commit.calledWith("setInteraction", null)).to.be.true;
        });

        it("handles null interaction gracefully", function () {
            state.interaction = null;

            expect(() => removeDrawInteraction({state, dispatch, commit})).to.not.throw();
            expect(dispatch.called).to.be.false;
            expect(commit.called).to.be.false;
        });

        it("handles undefined interaction gracefully", function () {
            state.interaction = undefined;

            expect(() => removeDrawInteraction({state, dispatch, commit})).to.not.throw();
        });
    });

    describe("urlParams", function () {
        it("commits each parameter with upperFirst casing", function () {
            const params = {
                selectedGeometry: "Polygon",
                selectedLineStringUnit: "1",
                selectedPolygonUnit: "2"
            };

            urlParams({commit}, params);

            expect(commit.calledWith("setSelectedGeometry", "Polygon")).to.be.true;
            expect(commit.calledWith("setSelectedLineStringUnit", "1")).to.be.true;
            expect(commit.calledWith("setSelectedPolygonUnit", "2")).to.be.true;
        });

        it("handles single parameter", function () {
            const params = {
                selectedGeometry: "LineString"
            };

            urlParams({commit}, params);

            expect(commit.calledOnce).to.be.true;
            expect(commit.calledWith("setSelectedGeometry", "LineString")).to.be.true;
        });

        it("handles empty params object", function () {
            const params = {};

            urlParams({commit}, params);

            expect(commit.called).to.be.false;
        });

        it("converts camelCase to upperFirst for mutation names", function () {
            const params = {
                earthRadius: 6371000,
                measurementAccuracy: "decimeter"
            };

            urlParams({commit}, params);

            expect(commit.calledWith("setEarthRadius", 6371000)).to.be.true;
            expect(commit.calledWith("setMeasurementAccuracy", "decimeter")).to.be.true;
        });

        it("handles multiple parameters with different types", function () {
            const params = {
                selectedGeometry: "Polygon",
                earthRadius: 6378137,
                measurementAccuracy: "meter"
            };

            urlParams({commit}, params);

            expect(commit.callCount).to.equal(3);
        });

        it("calls commit for each key in params", function () {
            const params = {
                key1: "value1",
                key2: "value2",
                key3: "value3"
            };

            urlParams({commit}, params);

            expect(commit.callCount).to.equal(3);
        });
    });
});
