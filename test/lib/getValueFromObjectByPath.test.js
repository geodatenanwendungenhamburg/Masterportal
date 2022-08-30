import {getValueFromObjectByPath, getPathPartsFromPath} from "../../src/lib/getValueFromObjectByPath";

describe("src/utils/getValueFromObjectByPath.js", () => {
    describe("getPathPartsFromPath", () => {
        it("should walk through the given string, collecting all parts seperated by a dot", () => {
            const path = "first.second.third",
                expected = ["first", "second", "third"];

            expect(getPathPartsFromPath(path)).toEqual(expected);
        });
        it("should ignore escaped dots on the way, removing escape signs", () => {
            const path = "first.sec\\.ond.third",
                expected = ["first", "sec.ond", "third"];

            expect(getPathPartsFromPath(path)).toEqual(expected);
        });
        it("should be able to escape escape signs", () => {
            const path = "first.sec\\\\ond.third",
                expected = ["first", "sec\\ond", "third"];

            expect(getPathPartsFromPath(path)).toEqual(expected);
        });
    });
    describe("getValueFromObjectByPath", () => {
        it("should return undefined if anything but an object or array is given as first param", () => {
            expect(getValueFromObjectByPath(undefined, "")).toBe(undefined);
            expect(getValueFromObjectByPath(null, "")).toBe(undefined);
            expect(getValueFromObjectByPath("string", "")).toBe(undefined);
            expect(getValueFromObjectByPath(1234, "")).toBe(undefined);
            expect(getValueFromObjectByPath(true, "")).toBe(undefined);
            expect(getValueFromObjectByPath(false, "")).toBe(undefined);
        });
        it("should return undefined if anything but a string is given as second param", () => {
            expect(getValueFromObjectByPath({}, undefined)).toBe(undefined);
            expect(getValueFromObjectByPath({}, null)).toBe(undefined);
            expect(getValueFromObjectByPath({}, 1234)).toBe(undefined);
            expect(getValueFromObjectByPath({}, true)).toBe(undefined);
            expect(getValueFromObjectByPath({}, false)).toBe(undefined);
            expect(getValueFromObjectByPath({}, {})).toBe(undefined);
            expect(getValueFromObjectByPath({}, [])).toBe(undefined);
        });
        it("should return undefined if the given depthBarrier is reached during walkthrough", () => {
            expect(getValueFromObjectByPath({test: {test: 1}}, "@test.test", "@", ".", 1)).toBe(undefined);
        });
        it("should return undefined if the given path can't be followed through the given object", () => {
            expect(getValueFromObjectByPath({}, "@test")).toBe(undefined);
            expect(getValueFromObjectByPath({test: null}, "@test.test")).toBe(undefined);
        });
        it("should return the found value if the given path was successfully followed through the object", () => {
            expect(getValueFromObjectByPath({test: 1}, "@test")).toEqual(1);
            expect(getValueFromObjectByPath({test: {test: 1}}, "@test")).toEqual({test: 1});
            expect(getValueFromObjectByPath({test: {test: {test: 1}}}, "@test.test")).toEqual({test: 1});
        });
        it("should be able to handle a path without prefix when no prefix is given", () => {
            expect(getValueFromObjectByPath({test: 1}, "test", false)).toEqual(1);
        });
        it("should be able to handle a path with a complex prefix", () => {
            expect(getValueFromObjectByPath({test: 1}, "1234test", "1234")).toEqual(1);
        });
    });
});
