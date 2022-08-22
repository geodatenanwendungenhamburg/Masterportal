import * as stylePointInterval from "../../../../src/vectorStyle/styles/point/stylePointInterval";

describe("stylePointInterval.js", () => {
    describe("calculateSizeIntervalCircleBar", function () {
        it("should be 10 at large circleBarRadius and small values input", function () {
            expect(typeof stylePointInterval.calculateSizeIntervalCircleBar(5, 1, 3, 5)).toBe("number");
            expect(stylePointInterval.calculateSizeIntervalCircleBar(5, 1, 3, 5)).toEqual(10);
        });
        it("should be 20 at large circleBarRadius and large values input", function () {
            expect(typeof stylePointInterval.calculateSizeIntervalCircleBar(5, 2, 10, 5)).toBe("number");
            expect(stylePointInterval.calculateSizeIntervalCircleBar(5, 2, 10, 5)).toEqual(30);
        });
        it("should be 10 at large circleBarRadius and stateValue is NaN input", function () {
            expect(typeof stylePointInterval.calculateSizeIntervalCircleBar(NaN, 2, 10, 5)).toBe("number");
            expect(stylePointInterval.calculateSizeIntervalCircleBar(NaN, 2, 10, 5)).toEqual(10);
        });
    });
    describe("calculateLengthIntervalCircleBar", function () {
        it("should be 1 for positive stateValue input", function () {
            expect(typeof stylePointInterval.calculateLengthIntervalCircleBar(10, 1, 3, 1)).toBe("number");
            expect(stylePointInterval.calculateLengthIntervalCircleBar(10, 1, 3, 1)).toEqual(1);
        });
        it("should be 12 fop negative stateValue input", function () {
            expect(typeof stylePointInterval.calculateLengthIntervalCircleBar(10, 2, -1, 5)).toBe("number");
            expect(stylePointInterval.calculateLengthIntervalCircleBar(10, 2, -1, 5)).toEqual(12);
        });
        it("should be 0 for stateValue is NaN input", function () {
            expect(typeof stylePointInterval.calculateLengthIntervalCircleBar(10, 2, NaN, 5)).toBe("number");
            expect(stylePointInterval.calculateLengthIntervalCircleBar(10, 2, NaN, 5)).toEqual(0);
        });
        it("should be 0 for stateValue is undefined input", function () {
            expect(typeof stylePointInterval.calculateLengthIntervalCircleBar(10, 2, undefined, 5)).toBe("number");
            expect(stylePointInterval.calculateLengthIntervalCircleBar(10, 2, undefined, 5)).toEqual(0);
        });
    });
    describe("createIntervalCircleBar", function () {
        const attributes = {
                circleBarScalingFactor: 1,
                circleBarRadius: 10,
                circleBarLineStroke: [10, 200, 100, 0.5],
                circleBarCircleFillColor: [10, 200, 100, 0.5],
                circleBarCircleStrokeColor: [10, 200, 100, 0.5],
                circleBarCircleStrokeWidth: 1,
                circleBarLineStrokeColor: [10, 200, 100, 0.5],
                scalingAttribute: ""
            },
            feature = {
                getProperties: () => {
                    return {id: 1, name: "test"};
                }};

        it("should be an svg by default values input", function () {
            expect(stylePointInterval.createIntervalCircleBar(feature, attributes))
                .toEqual("<svg width='20' height='20' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><line x1='10' y1='10' x2='10' y2='0' stroke='#0ac864' stroke-width='10' /><circle cx='10' cy='10' r='10' stroke='#0ac864' stroke-width='1' fill='#0ac864' /></svg>");
        });
    });
});