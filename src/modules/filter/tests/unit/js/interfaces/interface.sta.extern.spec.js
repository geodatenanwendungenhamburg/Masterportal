import InterfaceStaExtern from "../../../../js/interfaces/interface.sta.extern.js";
import {expect} from "chai";

describe("src/modules/filter/interfaces/utils/interface.sta.extern.js", () => {
    let interfaceStaExtern = null;

    beforeEach(() => {
        interfaceStaExtern = new InterfaceStaExtern({
            getCurrentExtent: false
        });
    });

    describe("constructor", () => {
        it("should set expected variables in the instance", () => {
            const expected = {
                "@Datastreams.0.Observations.0.result": {
                    "http://defs.opengis.net/elda-common/ogc-def/resource?uri=http://www.opengis.net/def/ogc-om/OM_CountObservation": "number",
                    "http://defs.opengis.net/elda-common/ogc-def/resource?uri=http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation": "string"
                }
            };

            expect(interfaceStaExtern.allFetchedProperties).to.deep.equal({});
            expect(interfaceStaExtern.observationType).to.deep.equal({});
            expect(interfaceStaExtern.waitingListForFeatures).to.to.deep.equal({});
            expect(interfaceStaExtern.listOfResourceTypes).to.deep.equal(expected);
        });
    });
    describe("getAttrTypesByAllFetchedProperties", () => {
        it("should return an empty object if anything but an object is given", () => {
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties(null)).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties(undefined)).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties("string")).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties(1234)).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties(true)).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties(false)).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties([])).to.deep.equal({});
        });
        it("should return empty object if the values of the keys from given object are not an array", () => {
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: "bar"})).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: 123})).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: undefined})).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: false})).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: true})).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: null})).to.deep.equal({});
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: {}})).to.deep.equal({});
        });
        it("should return empty object if the values of the keys from given object are an array but is empty", () => {
            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties({foo: []})).to.deep.equal({});
        });
        it("should return an object with key value where value is the type of the key based on given namespace", () => {
            const attrName = "fow",
                listOfResourceTypes = {
                    "foo": {
                        "fow": "number"
                    }
                },
                obj = {
                    "foo": ["fow"]
                },
                expected = {
                    foo: "number"
                };

            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties(obj, attrName, listOfResourceTypes)).to.deep.equal(expected);
        });
        it("should return an object with key value pair where value is the type of the key", () => {
            const expected = {
                    foo: "string",
                    bar: "boolean",
                    buz: "number"
                },
                obj = {
                    foo: ["foo"],
                    bar: [true],
                    buz: [1234]
                };

            expect(interfaceStaExtern.getAttrTypesByAllFetchedProperties(obj, "", {})).to.deep.equal(expected);
        });
    });
    describe("getMinMaxFromUniqueValue", () => {
        it("should return an empty object if anything but an array is given", () => {
            expect(interfaceStaExtern.getMinMaxFromUniqueValue(undefined)).to.deep.equal({});
            expect(interfaceStaExtern.getMinMaxFromUniqueValue(null)).to.deep.equal({});
            expect(interfaceStaExtern.getMinMaxFromUniqueValue(true)).to.deep.equal({});
            expect(interfaceStaExtern.getMinMaxFromUniqueValue(false)).to.deep.equal({});
            expect(interfaceStaExtern.getMinMaxFromUniqueValue({})).to.deep.equal({});
            expect(interfaceStaExtern.getMinMaxFromUniqueValue("string")).to.deep.equal({});
        });
        it("should return the min if min is set", () => {
            const list = [
                    20,
                    9,
                    30,
                    1
                ],
                expected = {
                    min: 1
                };

            expect(interfaceStaExtern.getMinMaxFromUniqueValue(list, true, false)).to.deep.equal(expected);
        });
        it("should return the max if max is set", () => {
            const list = [
                    20,
                    9,
                    30,
                    1
                ],
                expected = {
                    max: 30
                };

            expect(interfaceStaExtern.getMinMaxFromUniqueValue(list, false, true)).to.deep.equal(expected);
        });
        it("should return the min and max if min and max are set", () => {
            const list = [
                    20,
                    9,
                    30,
                    1
                ],
                expected = {
                    min: 1,
                    max: 30
                };

            expect(interfaceStaExtern.getMinMaxFromUniqueValue(list, true, true)).to.deep.equal(expected);
        });
    });

    describe("buildSensorThingsUrl", () => {
        it("should return an url as string for a specific input", () => {
            const testUrl = "https://www.example.com:1234/foo/bar",
                testVersion = "1.1",
                testUrlParams = {
                    "baz": 1234,
                    "qux": "foobar"
                },
                expectedOutput = "https://www.example.com:1234/foo/bar/v1.1/Things?$baz=1234&$qux=foobar";

            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, testUrlParams)).to.equal(expectedOutput);
        });

        it("should return an url with datastreams as root", () => {
            const testUrl = "https://www.example.com:1234/foo/bar",
                testVersion = "1.1",
                testUrlParams = {
                    "filter": "fi",
                    "expand": "ex",
                    "root": "Datastreams"
                },
                expectedOutput = "https://www.example.com:1234/foo/bar/v1.1/Datastreams?$filter=fi&$expand=ex";

            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, testUrlParams)).to.equal(expectedOutput);
        });

        it("should return an url as string for a specific input including nested urlParams", () => {
            const testUrl = "https://www.example.com:1234/foo/bar",
                testVersion = "1.1",
                testUrlParams = {
                    "baz": 1234,
                    "qux": [
                        "subParamA",
                        "subParamB",
                        "subParamC"
                    ]
                },
                expectedOutput = "https://www.example.com:1234/foo/bar/v1.1/Things?$baz=1234&$qux=subParamA,subParamB,subParamC";

            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, testUrlParams)).to.equal(expectedOutput);
        });

        it("should return an url without query if no params as object are given", () => {
            const testUrl = "https://www.example.com:1234/foo/bar",
                testVersion = "1.1",
                expectedOutput = "https://www.example.com:1234/foo/bar/v1.1/Things?";

            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, false)).to.equal(expectedOutput);
            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, undefined)).to.equal(expectedOutput);
            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, null)).to.equal(expectedOutput);
            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, "baz")).to.equal(expectedOutput);
            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, 12345)).to.equal(expectedOutput);
            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, [])).to.equal(expectedOutput);
            expect(interfaceStaExtern.buildSensorThingsUrl(testUrl, testVersion, {})).to.equal(expectedOutput);
        });

        it("should eat any url possible without checking its target or syntax", () => {
            const testUrlParams = {
                "foo": "bar"
            };

            expect(interfaceStaExtern.buildSensorThingsUrl("", "1.1", testUrlParams)).to.equal("/v1.1/Things?$foo=bar");
            expect(interfaceStaExtern.buildSensorThingsUrl("http://", "1.1", testUrlParams)).to.equal("http:///v1.1/Things?$foo=bar");
            expect(interfaceStaExtern.buildSensorThingsUrl("wfs://baz", "1.1", testUrlParams)).to.equal("wfs://baz/v1.1/Things?$foo=bar");
            expect(interfaceStaExtern.buildSensorThingsUrl("foobar://baz////", "1.1", testUrlParams)).to.equal("foobar://baz/////v1.1/Things?$foo=bar");
        });

        it("should take any version as string unchecked", () => {
            expect(interfaceStaExtern.buildSensorThingsUrl("", "1.1", false)).to.equal("/v1.1/Things?");
            expect(interfaceStaExtern.buildSensorThingsUrl("", "foo", false)).to.equal("/vfoo/Things?");
            expect(interfaceStaExtern.buildSensorThingsUrl("", "foo.bar.baz", false)).to.equal("/vfoo.bar.baz/Things?");
        });

        it("should take any version as number fixed to one decimal number", () => {
            expect(interfaceStaExtern.buildSensorThingsUrl("", 0.5, false)).to.equal("/v0.5/Things?");
            expect(interfaceStaExtern.buildSensorThingsUrl("", 0.55, false)).to.equal("/v0.6/Things?");
            expect(interfaceStaExtern.buildSensorThingsUrl("", 0.00000001, false)).to.equal("/v0.0/Things?");
            expect(interfaceStaExtern.buildSensorThingsUrl("", 999999.9999999, false)).to.equal("/v1000000.0/Things?");
        });

        it("should stringify any given parameter for url and version - no matter what", () => {
            const testUrlParams = {
                "foo": "bar"
            };

            expect(interfaceStaExtern.buildSensorThingsUrl(undefined, undefined, testUrlParams)).to.equal("undefined/vundefined/Things?$foo=bar");
            expect(interfaceStaExtern.buildSensorThingsUrl(null, null, testUrlParams)).to.equal("null/vnull/Things?$foo=bar");
            expect(interfaceStaExtern.buildSensorThingsUrl([], [], testUrlParams)).to.equal("/v/Things?$foo=bar");
            expect(interfaceStaExtern.buildSensorThingsUrl({}, {}, testUrlParams)).to.equal("[object Object]/v[object Object]/Things?$foo=bar");
        });
    });
});
