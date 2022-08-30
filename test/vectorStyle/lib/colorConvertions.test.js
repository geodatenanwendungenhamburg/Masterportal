import {normalizeRgbColor, componentToHex, rgbToHex, hexToRgb} from "../../../src/vectorStyle/lib/colorConvertions";

describe("normalizeRgbColor", function () {
    it("should be extend the given array with length 3 by value 1", function () {
        expect(Array.isArray(normalizeRgbColor([255, 255, 255]))).toBe(true);
        expect(normalizeRgbColor([255, 255, 255])).toEqual([255, 255, 255, 1]);
    });
    it("should be extend the given array with length 2 by value 1, 1", function () {
        expect(Array.isArray(normalizeRgbColor([255, 255]))).toBe(true);
        expect(normalizeRgbColor([255, 255])).toEqual([255, 255, 1, 1]);
    });
    it("should be return the input value, which is an array with length 4", function () {
        expect(Array.isArray(normalizeRgbColor([0, 0, 0, 0]))).toBe(true);
        expect(normalizeRgbColor([0, 0, 0, 0])).toEqual([0, 0, 0, 0]);
    });
    it("should be return the input value, which is an array with length > 4", function () {
        expect(Array.isArray(normalizeRgbColor([1, 2, 3, 4, 5]))).toBe(true);
        expect(normalizeRgbColor([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4]);
    });
});

describe("componentToHex", function () {
    it("should return the parsed 16 digits value", function () {
        expect(componentToHex(2)).toEqual("02");
        expect(componentToHex(213)).toEqual("d5");
    });
});

describe("rgbToHex", function () {
    it("should return the parsed hex value", function () {
        expect(rgbToHex(2, 213, 33)).toEqual("#02d521");
    });
});

describe("hexToRgb", function () {
    it("should return the parsed rgb value", function () {
        expect(hexToRgb("#020521")).toEqual([2, 5, 21]);
    });
    it("should return null", function () {
        expect(hexToRgb("")).toEqual(null);
    });
});