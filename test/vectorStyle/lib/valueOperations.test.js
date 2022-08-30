import {getValueWithoutComma, getReferenceValue, compareValues, checkProperty, checkProperties} from "../../../src/vectorStyle/lib/valueOperations";
import {GeoJSON} from "ol/format.js";


const geojsonReader = new GeoJSON(),
    jsonFeatures = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [10.082125662581083, 53.518872973925404]
                },
                "properties": {
                    "id": "test1",
                    "name": "myName",
                    "value": 50,
                    "min": 10,
                    "max": 100,
                    "myObj": {
                        "myCascade": 10,
                        "myArray": [
                            {
                                "myValue": 20
                            }
                        ]
                    }
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[10.082125662581083, 53.518872973925404], [11.01, 53.6]]
                },
                "properties": {
                    "id": "test2",
                    "value": 50,
                    "min": 10,
                    "max": 100
                }
            }
        ]
    },
    rules = [
        {
            "conditions": {
                "properties": {
                    "id": "test1"
                },
                "sequence": [1, 1]
            },
            "style": {
                "polygonStrokeColor": [100, 0, 0, 1],
                "labelField": "name"
            }
        },
        {
            "conditions": {
                "properties": {
                    "id": "test1"
                }
            },
            "style": {
                "polygonStrokeColor": [100, 100, 0, 1]
            }
        },
        {
            "style": {
                "polygonStrokeColor": [100, 100, 100, 1]
            }
        }
    ];

let jsonObjects;


beforeAll(function () {
    jsonObjects = geojsonReader.readFeatures(jsonFeatures);
});


describe("getValueWithoutComma", function () {
    it("should return original value", function () {
        expect(getValueWithoutComma("22")).toEqual("22");
        expect(getValueWithoutComma("test")).toEqual("test");
    });
    it("should return the value without comma", function () {
        expect(getValueWithoutComma("22,6")).toEqual(22.6);
        expect(getValueWithoutComma("22,667")).toEqual(22.667);
    });
});

describe("getReferenceValue", function () {
    it("should return plain reference value", function () {
        expect(getReferenceValue(jsonObjects[0].getProperties(), "test1")).toEqual("test1");
    });
    it("should return reference value in object path", function () {
        expect(getReferenceValue(jsonObjects[0].getProperties(), "@id")).toEqual("test1");
    });
    it("should return array of reference values", function () {
        expect(Array.isArray(getReferenceValue(jsonObjects[0].getProperties(), [0, 50]))).toBe(true);
        expect(getReferenceValue(jsonObjects[0].getProperties(), [0, 50])).toEqual([0, 50]);
    });
    it("should return array of reference values in object path", function () {
        expect(Array.isArray(getReferenceValue(jsonObjects[0].getProperties(), ["@min", "@max"]))).toBe(true);
        expect(getReferenceValue(jsonObjects[0].getProperties(), ["@min", "@max"])).toEqual([10, 100]);
    });
});

describe("compareValues", function () {
    it("should return true if values are the same", function () {
        expect(compareValues("test", "test")).toBe(true);
    });
    it("should return true if boolean values are same", function () {
        expect(compareValues(true, true)).toBe(true);
    });
    it("should return false if boolean values are different", function () {
        expect(compareValues(true, false)).toBe(false);
    });
    it("should return true if values are the same but of different type", function () {
        expect(compareValues("20", 20)).toBe(true);
        expect(compareValues("20.0", 20)).toBe(true);
    });
    it("should return false if values cannot be parsed to same type", function () {
        expect(compareValues("abc", 20)).toBe(false);
    });
    it("should return false if reference value is an invalid array", function () {
        expect(compareValues(1, [0])).toBe(false);
        expect(compareValues(1, [0, 1, 2])).toBe(false);
        expect(compareValues(1, [0, 1, 2, 4, 5])).toBe(false);
        expect(compareValues(1, ["0", 1])).toBe(false);
        expect(compareValues(1, ["0", 1, 2, 3])).toBe(false);
    });
    it("should return false if feature value cannot be parsed to float and reference value is an array", function () {
        expect(compareValues("abc", [0, 1, 2, 3])).toBe(false);
    });
    it("should return true if feature value is in range of reference values", function () {
        expect(compareValues(20, [20, 25])).toBe(true);
        expect(compareValues(21, [20, 25])).toBe(true);
    });
    it("should return false if feature value is not in range of reference values", function () {
        expect(compareValues(19, [20, 25])).toBe(false);
        expect(compareValues(25, [20, 25])).toBe(false);
    });
    it("should return true if feature value is in range of reference values defined by range", function () {
        expect(compareValues(15, [0, 50, 10, 100])).toBe(true);
    });
    it("should return false if feature value is not in range of reference values defined by range", function () {
        expect(compareValues(9, [0, 50, 10, 100])).toBe(false);
    });
});

describe("checkProperty", function () {
    it("should return true for fitting property", function () {
        expect(checkProperty(jsonObjects[0].getProperties(), "id", "test1")).toBe(true);
    });
    it("should return false for non-fitting property", function () {
        expect(checkProperty(jsonObjects[0].getProperties(), "id", "invalidId")).toBe(false);
    });
    it("should return false for invalid key / value", function () {
        expect(checkProperty(jsonObjects[0].getProperties(), null, "test1")).toBe(false);
        expect(checkProperty(jsonObjects[0].getProperties(), "id", null)).toBe(false);
        expect(checkProperty(jsonObjects[0].getProperties(), "id", [0])).toBe(false);
        expect(checkProperty(jsonObjects[0].getProperties(), "id", [0, 1, 2])).toBe(false);
    });
    it("should return true for a clustered feature", function () {
        const clusterFeatureProperties = {
            features: [jsonObjects[0]],
            geometry: jsonObjects[0].getGeometry()
        };

        expect(checkProperty(clusterFeatureProperties, "id", "test1")).toBe(true);
    });
});

describe("checkProperties", function () {
    it("should return true for rule that fits all properties even with sequences", function () {
        expect(checkProperties(jsonObjects[0], rules[0])).toBe(true);
    });
    it("should return true for rule that fits all properties without sequences", function () {
        expect(checkProperties(jsonObjects[0], rules[1])).toBe(true);
    });
    it("should return true for rule that has no properties", function () {
        expect(checkProperties(jsonObjects[0], rules[2])).toBe(true);
    });
    it("should return false for rule that has not fitting properties", function () {
        expect(checkProperties(jsonObjects[1], rules[1])).toBe(false);
    });
});