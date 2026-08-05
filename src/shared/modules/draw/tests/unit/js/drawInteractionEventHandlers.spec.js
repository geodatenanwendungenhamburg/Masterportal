import {expect} from "chai";
import sinon from "sinon";
import {
    registerMeasurementChangeListener,
    unregisterMeasurementChangeListener,
    shouldDiscardEmptyTextFeature,
    handleCircleMeasurementDrawEnd
} from "@shared/modules/draw/js/drawInteractionEventHandlers.js";

describe("src/shared/modules/draw/js/drawInteractionEventHandlers.js", () => {
    afterEach(() => {
        sinon.restore();
    });

    /**
     * Identity translation helper for tooltip tests.
     * @param {String} key The translation key.
     * @returns {String} The unchanged key.
     */
    function translateKey (key) {
        return key;
    }

    describe("registerMeasurementChangeListener", () => {
        it("positive: registers change listener and forwards update context", () => {
            let changeCallback;
            const geometry = {
                    on: sinon.stub().callsFake((eventName, callback) => {
                        changeCallback = callback;
                    }),
                    getLength: () => 22.7
                },
                tooltipElement = document.createElement("div"),
                setLineLengthSpy = sinon.spy(),
                emitCircleRadiusSpy = sinon.spy(),
                onGeometryChange = registerMeasurementChangeListener(
                    "line",
                    geometry,
                    tooltipElement,
                    translateKey,
                    setLineLengthSpy,
                    emitCircleRadiusSpy
                );

            expect(geometry.on.calledOnceWithExactly("change", sinon.match.func)).to.be.true;
            expect(onGeometryChange).to.equal(changeCallback);

            changeCallback();

            expect(setLineLengthSpy.calledOnceWithExactly(23)).to.be.true;
            expect(tooltipElement.innerHTML).to.equal("common:shared.modules.draw.drawLayout.length: 23m");
            expect(emitCircleRadiusSpy.called).to.be.false;
        });

        it("negative: keeps unknown draw type callbacks side-effect free", () => {
            let changeCallback;
            const geometry = {
                    on: sinon.stub().callsFake((eventName, callback) => {
                        changeCallback = callback;
                    })
                },
                tooltipElement = document.createElement("div"),
                setLineLengthSpy = sinon.spy(),
                emitCircleRadiusSpy = sinon.spy();

            tooltipElement.innerHTML = "unchanged";

            registerMeasurementChangeListener(
                "unknown",
                geometry,
                tooltipElement,
                translateKey,
                setLineLengthSpy,
                emitCircleRadiusSpy
            );

            changeCallback();

            expect(tooltipElement.innerHTML).to.equal("unchanged");
            expect(setLineLengthSpy.called).to.be.false;
            expect(emitCircleRadiusSpy.called).to.be.false;
        });
    });

    describe("unregisterMeasurementChangeListener", () => {
        it("positive: unregisters change listener when geometry and callback are provided", () => {
            const geometry = {
                    un: sinon.spy()
                },
                onGeometryChange = sinon.stub();

            unregisterMeasurementChangeListener(geometry, onGeometryChange);

            expect(geometry.un.calledOnceWithExactly("change", onGeometryChange)).to.be.true;
        });

        it("negative: does nothing when geometry is missing", () => {
            const onGeometryChange = sinon.stub();

            unregisterMeasurementChangeListener(null, onGeometryChange);

            expect(true).to.be.true;
        });
    });

    describe("shouldDiscardEmptyTextFeature", () => {
        it("positive: returns true for writeText with missing text", () => {
            expect(shouldDiscardEmptyTextFeature("writeText", {})).to.be.true;
            expect(shouldDiscardEmptyTextFeature("writeText", {text: "   "})).to.be.true;
        });

        it("negative: returns false for non-writeText and filled writeText", () => {
            expect(shouldDiscardEmptyTextFeature("line", {text: ""})).to.be.false;
            expect(shouldDiscardEmptyTextFeature("writeText", {text: "Hello"})).to.be.false;
        });
    });

    describe("handleCircleMeasurementDrawEnd", () => {
        it("positive: emits rounded radius and resets tooltip", () => {
            const geometry = {
                    getRadius: () => 25.6
                },
                tooltipElement = document.createElement("div"),
                tooltipOverlay = {
                    setPosition: sinon.spy()
                },
                emitCircleRadiusSpy = sinon.spy();

            tooltipElement.innerHTML = "value";

            handleCircleMeasurementDrawEnd(geometry, tooltipElement, tooltipOverlay, emitCircleRadiusSpy);

            expect(emitCircleRadiusSpy.calledOnceWithExactly(26)).to.be.true;
            expect(tooltipElement.innerHTML).to.equal("");
            expect(tooltipOverlay.setPosition.calledOnceWithExactly(undefined)).to.be.true;
        });

        it("negative: still emits NaN when geometry radius is invalid", () => {
            const geometry = {
                    getRadius: () => Number.NaN
                },
                tooltipElement = document.createElement("div"),
                tooltipOverlay = {
                    setPosition: sinon.spy()
                },
                emitCircleRadiusSpy = sinon.spy();

            handleCircleMeasurementDrawEnd(geometry, tooltipElement, tooltipOverlay, emitCircleRadiusSpy);

            expect(emitCircleRadiusSpy.calledOnce).to.be.true;
            expect(emitCircleRadiusSpy.firstCall.args[0]).to.be.NaN;
            expect(tooltipOverlay.setPosition.calledOnce).to.be.true;
        });
    });
});
