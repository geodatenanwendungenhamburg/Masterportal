import {getRuleForIndex, getIndexedRule, getRulesForFeature} from "../../../src/vectorStyle/lib/getRuleForIndex";
import {GeoJSON} from "ol/format.js";

describe("getRuleForIndex", function () {

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

    it("should return rule with conditions but without sequence", function () {
        expect(typeof getRuleForIndex(rules, 0)).toBe("object");
        expect(getRuleForIndex(rules, 0)).toEqual(expect.objectContaining({style: {polygonStrokeColor: [100, 100, 0, 1]}}));
        expect(Array.isArray(getRuleForIndex(rules, 0).style.polygonStrokeColor)).toBe(true);
    });
    it("should return rule with conditions and sequence", function () {
        expect(typeof getRuleForIndex(rules, 1)).toBe("object");
        expect(getRuleForIndex(rules, 1)).toEqual(expect.objectContaining({style: {labelField: "name", polygonStrokeColor: [100, 0, 0, 1]}}));
        expect(Array.isArray(getRuleForIndex(rules, 1).style.polygonStrokeColor)).toBe(true);
    });
    it("should return fallback rule", function () {
        const newArray = [];

        newArray.push(rules[2]);
        expect(typeof getRuleForIndex(newArray, 0)).toBe("object");
        expect(getRuleForIndex(newArray, 0)).toEqual(expect.objectContaining({style: {polygonStrokeColor: [100, 100, 100, 1]}}));
        expect(Array.isArray(getRuleForIndex(newArray, 0).style.polygonStrokeColor)).toBe(true);
    });
    it("should return null if no rule can be used", function () {
        const newArray = [];

        newArray.push(rules[0]);
        expect(getRuleForIndex(newArray, 0)).toBe(null);
    });

    describe("getIndexedRule", function () {
        it("should return rule with fitting sequence", function () {
            expect(typeof getIndexedRule(rules, 1)).toBe("object");
            expect(getIndexedRule(rules, 1)).toEqual(expect.objectContaining({style: {labelField: "name", polygonStrokeColor: [100, 0, 0, 1]}}));
            expect(Array.isArray(getIndexedRule(rules, 1).style.polygonStrokeColor)).toBe(true);
        });
        it("should return undefined if no rule fits sequence", function () {
            expect(getIndexedRule(rules, 0)).toBe(undefined);
        });
    });

    describe("getRulesForFeature", function () {
        const styleObject = {rules: rules};

        it("should return correct list of rules for feature1", function () {
            expect(Array.isArray(getRulesForFeature(styleObject, jsonObjects[0]))).toBe(true);
            expect(getRulesForFeature(styleObject, jsonObjects[0]).length).toEqual(3);
        });
        it("should return correct list of rules for feature2", function () {
            expect(Array.isArray(getRulesForFeature(styleObject, jsonObjects[1]))).toBe(true);
            expect(getRulesForFeature(styleObject, jsonObjects[1]).length).toEqual(1);
        });
    });
});