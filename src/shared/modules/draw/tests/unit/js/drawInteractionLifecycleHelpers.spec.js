import {expect} from "chai";
import sinon from "sinon";
import {
    clearDrawInteractionListenerKeys,
    clearMeasurementListenerState,
    clearPointerListenerAndOverlay
} from "@shared/modules/draw/js/drawInteractionLifecycleHelpers.js";

describe("src/shared/modules/draw/js/drawInteractionLifecycleHelpers.js", () => {
    afterEach(() => {
        sinon.restore();
        mapCollection.clear();
    });

    describe("clearDrawInteractionListenerKeys", () => {
        it("positive: clears both listener keys", () => {
            const drawStartKey = {listener: "start"},
                drawEndKey = {listener: "end"},
                result = clearDrawInteractionListenerKeys(drawStartKey, drawEndKey);

            expect(result).to.deep.equal({
                drawStartKey: null,
                drawEndKey: null
            });
        });

        it("negative: returns cleared state when keys are missing", () => {
            const result = clearDrawInteractionListenerKeys(null, undefined);

            expect(result).to.deep.equal({
                drawStartKey: null,
                drawEndKey: null
            });
        });
    });

    describe("clearMeasurementListenerState", () => {
        it("positive: unregisters geometry change listener and clears state", () => {
            const onGeometryChange = sinon.stub(),
                activeMeasurementGeometry = {
                    un: sinon.spy()
                },
                result = clearMeasurementListenerState(
                    activeMeasurementGeometry,
                    onGeometryChange
                );

            expect(activeMeasurementGeometry.un.calledOnceWithExactly("change", onGeometryChange)).to.be.true;
            expect(result).to.deep.equal({
                activeMeasurementGeometry: null,
                onGeometryChange: null
            });
        });

        it("negative: still clears state when both inputs are missing", () => {
            const result = clearMeasurementListenerState(
                null,
                null
            );

            expect(result).to.deep.equal({
                activeMeasurementGeometry: null,
                onGeometryChange: null
            });
        });
    });

    describe("clearPointerListenerAndOverlay", () => {
        it("positive: removes overlay from map and returns cleared state", () => {
            const removeOverlaySpy = sinon.spy(),
                tooltipOverlay = {id: "overlay"};

            mapCollection.addMap({
                id: "ol",
                mode: "2D",
                removeOverlay: removeOverlaySpy
            }, "2D");

            const result = clearPointerListenerAndOverlay({listener: "pointer"}, tooltipOverlay);

            expect(removeOverlaySpy.calledOnceWithExactly(tooltipOverlay)).to.be.true;
            expect(result).to.deep.equal({
                pointerMoveKey: null,
                tooltipOverlay: null
            });
        });

        it("negative: handles missing overlay and missing map instance", () => {
            const resultWithoutOverlay = clearPointerListenerAndOverlay(null, null),
                resultWithoutMap = clearPointerListenerAndOverlay(null, {id: "overlay"});

            expect(resultWithoutOverlay).to.deep.equal({
                pointerMoveKey: null,
                tooltipOverlay: null
            });
            expect(resultWithoutMap).to.deep.equal({
                pointerMoveKey: null,
                tooltipOverlay: null
            });
        });
    });
});
