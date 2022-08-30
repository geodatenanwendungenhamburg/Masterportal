import thousandsSeparator from "../../src/lib/thousandsSeparator";

describe("src/utils/thousandsSeparator.js", () => {
    it("should return an empty string if the given param is not a number nor a string", () => {
        expect(typeof thousandsSeparator(undefined)).toBe("string");
        expect(thousandsSeparator(undefined)).toEqual("");
        expect(typeof thousandsSeparator(null)).toBe("string");
        expect(thousandsSeparator(null)).toEqual("");
        expect(typeof thousandsSeparator([])).toBe("string");
        expect(thousandsSeparator([])).toEqual("");
        expect(typeof thousandsSeparator({})).toBe("string");
        expect(thousandsSeparator({})).toEqual("");
        expect(typeof thousandsSeparator(false)).toBe("string");
        expect(thousandsSeparator(false)).toEqual("");
        expect(typeof thousandsSeparator(true)).toBe("string");
        expect(thousandsSeparator(true)).toEqual("");
    });
    it("should convert a number into a string", () => {
        expect(typeof thousandsSeparator(1)).toBe("string");
    });
    it("should convert a negative number into a string", () => {
        expect(typeof thousandsSeparator(-1)).toBe("string");
    });
    it("should return a string if a string was given", () => {
        expect(typeof thousandsSeparator("1")).toBe("string");
    });
    it("should add the given letter(s) as thousands separator", () => {
        expect(thousandsSeparator(1000, "delimAbs")).toEqual("1delimAbs000");
    });
    it("should add the given letter(s) as decimal point for positive value", () => {
        expect(thousandsSeparator(1000.1, "delimAbs", "delimDec")).toEqual("1delimAbs000delimDec1");
    });
    it("should create a number in german format by default for positive value", () => {
        expect(thousandsSeparator(1000.1)).toEqual("1.000,1");
    });
    it("should be able to add a higher number of thousands separators", () => {
        expect(thousandsSeparator(1123456789.123456)).toEqual("1.123.456.789,123456");
    });
    it("should be able to add a higher number of thousands separators if a string was given", () => {
        expect(thousandsSeparator("1123456789.123456")).toEqual("1.123.456.789,123456");
    });
    it("should add the given letter(s) as thousands seperator", () => {
        expect(thousandsSeparator(-1000, "delimAbs")).toEqual("-1delimAbs000");
    });
    it("should add the given letter(s) as decimal point for negative value", () => {
        expect(thousandsSeparator(-1000.1, "delimAbs", "delimDec")).toEqual("-1delimAbs000delimDec1");
    });
    it("should create a number in german format by default for negative value", () => {
        expect(thousandsSeparator(-1000.1)).toEqual("-1.000,1");
    });
    it("should be able to add a higher number of thousands seperators", () => {
        expect(thousandsSeparator(-1123456789.123456)).toEqual("-1.123.456.789,123456");
    });
    it("should be able to add a higher number of thousands seperators if a string was given", () => {
        expect(thousandsSeparator("-1123456789.123456")).toEqual("-1.123.456.789,123456");
    });
});

