import {expect} from "chai";
import sinon from "sinon";
import {
    updateMeasurementTooltip,
    getRoundedCircleRadius,
    resetCircleTooltip
} from "@shared/modules/draw/js/drawTooltipHelpers.js";

describe("src/shared/modules/draw/js/drawTooltipHelpers.js", () => {
    /**
     * Identity translation helper for tooltip tests.
     * @param {String} key The translation key.
     * @returns {String} The unchanged key.
     */
    function translateKey (key) {
        return key;
    }

    describe("updateMeasurementTooltip", () => {
        it("positive: updates circle tooltip and emits rounded radius", () => {
            const geometry = {
                    getRadius: () => 150.7
                },
                tooltipElement = document.createElement("div"),
                setLineLength = sinon.spy(),
                emitCircleRadius = sinon.spy();

            updateMeasurementTooltip("circle", geometry, tooltipElement, translateKey, setLineLength, emitCircleRadius);

            expect(tooltipElement.innerHTML).to.equal("common:shared.modules.draw.drawSettingsCircle.radii.radius: 151m");
            expect(emitCircleRadius.calledOnceWithExactly(151)).to.be.true;
            expect(setLineLength.called).to.be.false;
        });

        it("positive: updates line tooltip and stores rounded length", () => {
            const geometry = {
                    getLength: () => 234.6
                },
                tooltipElement = document.createElement("div"),
                setLineLength = sinon.spy(),
                emitCircleRadius = sinon.spy();

            updateMeasurementTooltip("line", geometry, tooltipElement, translateKey, setLineLength, emitCircleRadius);

            expect(tooltipElement.innerHTML).to.equal("common:shared.modules.draw.drawLayout.length: 235m");
            expect(setLineLength.calledOnceWithExactly(235)).to.be.true;
            expect(emitCircleRadius.called).to.be.false;
        });

        it("negative: does not modify tooltip for unknown draw type", () => {
            const tooltipElement = document.createElement("div"),
                setLineLength = sinon.spy(),
                emitCircleRadius = sinon.spy();

            tooltipElement.innerHTML = "unchanged";

            updateMeasurementTooltip("unknown", {}, tooltipElement, translateKey, setLineLength, emitCircleRadius);

            expect(tooltipElement.innerHTML).to.equal("unchanged");
            expect(setLineLength.called).to.be.false;
            expect(emitCircleRadius.called).to.be.false;
        });

        it("negative: polygon tooltip only contains area information", () => {
            const geometry = {
                    getCoordinates: () => [[[0, 0], [10, 0], [10, 20], [0, 20]]],
                    getArea: () => 200
                },
                tooltipElement = document.createElement("div");

            updateMeasurementTooltip("polygon", geometry, tooltipElement, translateKey, sinon.spy(), sinon.spy());

            expect(tooltipElement.innerHTML).to.equal("common:shared.modules.draw.drawLayout.area: 200m²");
            expect(tooltipElement.innerHTML.includes("width")).to.be.false;
            expect(tooltipElement.innerHTML.includes("height")).to.be.false;
        });
    });

    describe("getRoundedCircleRadius", () => {
        it("positive: returns rounded circle radius", () => {
            const result = getRoundedCircleRadius({
                getRadius: () => 99.5
            });

            expect(result).to.equal(100);
        });

        it("negative: returns NaN for invalid radius values", () => {
            const result = getRoundedCircleRadius({
                getRadius: () => Number.NaN
            });

            expect(result).to.be.NaN;
        });
    });

    describe("resetCircleTooltip", () => {
        it("positive: clears tooltip and resets overlay position", () => {
            const tooltipElement = document.createElement("div"),
                tooltipOverlay = {
                    setPosition: sinon.spy()
                };

            tooltipElement.innerHTML = "value";

            resetCircleTooltip(tooltipElement, tooltipOverlay);

            expect(tooltipElement.innerHTML).to.equal("");
            expect(tooltipOverlay.setPosition.calledOnceWithExactly(undefined)).to.be.true;
        });

        it("negative: keeps empty tooltip empty while still resetting overlay", () => {
            const tooltipElement = document.createElement("div"),
                tooltipOverlay = {
                    setPosition: sinon.spy()
                };

            tooltipElement.innerHTML = "";

            resetCircleTooltip(tooltipElement, tooltipOverlay);

            expect(tooltipElement.innerHTML).to.equal("");
            expect(tooltipOverlay.setPosition.calledOnce).to.be.true;
        });
    });
});
