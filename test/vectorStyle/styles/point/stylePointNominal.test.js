import * as stylePointNominal from "../../../../src/vectorStyle/styles/point/stylePointNominal";

describe("stylePointNominal.js", () => {
    describe("fillScalingAttributes", function () {
        it("should return an object with empty = 0 for undefined input", function () {
            expect(typeof stylePointNominal.fillScalingAttributes(undefined, undefined)).toBe("object");
            expect(stylePointNominal.fillScalingAttributes(undefined, undefined)).toEqual({"empty": 0});
        });
        it("should return an object with empty = 0 for empty input", function () {
            expect(typeof stylePointNominal.fillScalingAttributes({})).toBe("object");
            expect(stylePointNominal.fillScalingAttributes({empty: 0})).toEqual({"empty": 0});
        });
        it("should return an object with empty = 1 for object with empty: 0 and false string input", function () {
            expect(typeof stylePointNominal.fillScalingAttributes({empty: 0}, "test")).toBe("object");
            expect(stylePointNominal.fillScalingAttributes({empty: 0}, "test")).toEqual({"empty": 1});
        });
        it("should return an object with empty = 0 for undefined input two", function () {
            const scalingAttributesAsObject = {
                    available: 0,
                    charging: 0,
                    outoforder: 0,
                    empty: 0
                },
                scalingAttribute = "available";

            expect(typeof stylePointNominal.fillScalingAttributes(scalingAttributesAsObject, scalingAttribute)).toBe("object");
            expect(stylePointNominal.fillScalingAttributes(scalingAttributesAsObject, scalingAttribute))
                .toEqual({"available": 2, "charging": 0, "outoforder": 0, "empty": 0});
        });
    });

    describe("getScalingAttributesAsObject", function () {
        it("should return an object with empty = 0 for undefined input", function () {
            expect(typeof stylePointNominal.getScalingAttributesAsObject(undefined)).toBe("object");
            expect(stylePointNominal.getScalingAttributesAsObject(undefined)).toEqual({"empty": 0});
        });
        it("should return an object with empty = 0 for empty input", function () {
            expect(typeof stylePointNominal.getScalingAttributesAsObject({})).toBe("object");
            expect(stylePointNominal.getScalingAttributesAsObject({})).toEqual({"empty": 0});
        });
        it("should return an object with available = 0 and empty = 0 for correct input", function () {
            expect(typeof stylePointNominal.getScalingAttributesAsObject({available: [0, 220, 0, 0]})).toBe("object");
            expect(stylePointNominal.getScalingAttributesAsObject({available: [0, 220, 0, 0]})).toEqual({available: 0, "empty": 0});
        });
    });

    describe("calculateCircleSegment", function () {
        it("should return a string that contains a circlesegment as svg-string for data of a semicircle input", function () {
            const startAngelDegree = 0,
                endAngelDegree = 180,
                circleRadius = 21,
                size = 58,
                gap = 10;

            expect(typeof stylePointNominal.calculateCircleSegment(startAngelDegree, endAngelDegree, circleRadius, size, gap)).toBe("string");
            expect(stylePointNominal.calculateCircleSegment(startAngelDegree, endAngelDegree, circleRadius, size, gap))
                .toEqual("M 49.920088659926655 27.16972940229918 A 21 21 0 0 0 8.079911340073345 27.16972940229918");

            expect(typeof stylePointNominal.calculateCircleSegment(0, 360, circleRadius, size, gap)).toBe("string");
            expect(stylePointNominal.calculateCircleSegment(0, 360, circleRadius, size, gap))
                .toEqual("M 50 29 A 21 21 0 0 0 8 28.999999999999996 A 21 21 0 0 0 50 29");
        });
    });

    describe("createNominalCircleSegments", function () {
        const attributes = {
                circleSegmentsRadius: 1,
                circleSegmentsStrokeWidth: 10,
                circleSegmentsBackgroundColor: [10, 200, 100, 0.5],
                scalingValueDefaultColor: [10, 200, 100, 0.5],
                circleSegmentsGap: 10,
                scalingValues: 1
            },
            feature = {
                get: () => {
                    return undefined;
                }};

        it("should be an svg by default values input", function () {
            expect(stylePointNominal.createNominalCircleSegments(feature, attributes))
                .toEqual("<svg width='32' height='32' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><circle cx='16' cy='16' r='1' stroke='#0ac864' stroke-width='10' fill='#0ac864' fill-opacity='0.5'/></svg>");
        });
    });
});