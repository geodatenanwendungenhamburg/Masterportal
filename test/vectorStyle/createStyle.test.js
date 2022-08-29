import * as createStyle from "../../src/vectorStyle/createStyle";
import PointStyle from "../../src/vectorStyle/styles/point/stylePoint";
import LineStringStyle from "../../src/vectorStyle/styles/styleLine";
import PolygonStyle from "../../src/vectorStyle/styles/polygon/stylePolygon";
import {Style, Stroke, Fill} from "ol/style.js";
import {GeoJSON} from "ol/format.js";


const rules = [
        {
            conditions: {
                properties: {
                    id: "test1"
                }
            },
            style: {
                legendValue: "legendValueText",
                circleStrokeColor: [255, 0, 0, 1],
                type: "circle",
                lineStrokeColor: [100, 0, 0, 1],
                polygonStrokeColor: [100, 100, 0, 1]
            }
        },
        {
            conditions: {
                properties: {
                    value: [0, 100]
                }
            },
            style: {
                legendValue: "legendValueText",
                circleStrokeColor: [255, 0, 0, 1]
            }
        },
        {
            conditions: {
                properties: {
                    value: [0, 50, "@min", "@max"]
                }
            },
            style: {
                legendValue: "legendValueText",
                circleStrokeColor: [255, 0, 0, 1]
            }
        },
        {
            style: {
                legendValue: "legendValueText",
                circleStrokeColor: [255, 255, 255, 1]
            }
        }
    ],
    geojsonReader = new GeoJSON(),
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
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[10.082125662581083, 53.518872973925404], [11.01, 53.6], [11.5, 54.0]]
                },
                "properties": {
                    "id": "test1",
                    "value": 50,
                    "min": 10,
                    "max": 100
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "MultiPoint",
                    "coordinates": [[11.01, 53.6], [11.5, 54.0]]
                },
                "properties": {
                    "id": "test1",
                    "value": 50,
                    "min": 10,
                    "max": 100
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": [
                        [[10, 10], [20, 20], [10, 40]],
                        [[40, 40], [30, 30], [40, 20], [30, 10]]
                    ]
                },
                "properties": {
                    "id": "test1",
                    "value": 50,
                    "min": 10,
                    "max": 100
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [
                        [
                            [[30, 20], [45, 40], [10, 40], [30, 20]]
                        ],
                        [
                            [[15, 5], [40, 10], [10, 20], [5, 10], [15, 5]]
                        ]
                    ]
                },
                "properties": {
                    "id": "test1",
                    "value": 50,
                    "min": 10,
                    "max": 100
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "GeometryCollection",
                    "geometries": [
                        {
                            "type": "Point",
                            "coordinates": [100.0, 0.0]
                        },
                        {
                            "type": "LineString",
                            "coordinates": [
                                [101.0, 0.0], [102.0, 1.0]
                            ]
                        }
                    ]
                },
                "properties": {
                    "@test": "test",
                    "id": "test1",
                    "value": 50,
                    "min": 10,
                    "max": 100
                }
            }
        ]
    },
    rulesWithOneEntry = [
        {
            "conditions": {
                "sequence": [0, 0],
                "properties": {
                    "@Datastreams.0.Observations.0.result": [81, 101]}},
            "style": {
                "legendValue": "legendValueText",
                "lineStrokeColor": [37, 52, 148, 1],
                "lineStrokeDash": [20, 20, 5, 2000],
                "lineStrokeDashOffset": 20,
                "lineStrokeWidth": 5,
                "labelField": ""}}
    ];

let jsonObjects;


beforeAll(function () {
    jsonObjects = geojsonReader.readFeatures(jsonFeatures);
});

describe("getSimpleGeometryStyle", function () {
    it("should return ol point style", function () {
        expect(createStyle.getSimpleGeometryStyle("Point", jsonObjects[0], rules[0], false)).toBeInstanceOf(PointStyle);
        expect(typeof createStyle.getSimpleGeometryStyle("Point", jsonObjects[0], rules[0], false).getStyle().getImage().getStroke().getColor()).toBe("object");
        expect(createStyle.getSimpleGeometryStyle("Point", jsonObjects[0], rules[0], false).getStyle().getImage().getStroke().getColor()).toEqual([255, 0, 0, 1]);
    });
    it("should return ol linestring style", function () {
        expect(createStyle.getSimpleGeometryStyle("LineString", jsonObjects[0], rules[0], false)).toBeInstanceOf(LineStringStyle);
        expect(typeof createStyle.getSimpleGeometryStyle("LineString", jsonObjects[0], rules[0], false).getStyle().getStroke().getColor()).toBe("object");
        expect(createStyle.getSimpleGeometryStyle("LineString", jsonObjects[0], rules[0], false).getStyle().getStroke().getColor()).toEqual([100, 0, 0, 1]);
    });
    it("should return ol polygon style", function () {
        expect(createStyle.getSimpleGeometryStyle("Polygon", jsonObjects[0], rules[0], false)).toBeInstanceOf(PolygonStyle);
        expect(typeof createStyle.getSimpleGeometryStyle("Polygon", jsonObjects[0], rules[0], false).getStyle().getStroke().getColor()).toBe("object");
        expect(createStyle.getSimpleGeometryStyle("Polygon", jsonObjects[0], rules[0], false).getStyle().getStroke().getColor()).toEqual([100, 100, 0, 1]);
    });
    it("should return ol default style", function () {
        expect(createStyle.getSimpleGeometryStyle("not exist", jsonObjects[0], rules[0], false)).toBeInstanceOf(Style);
    });
});

describe("getMultiGeometryStyle", function () {
    it("should return style array for multipoint", function () {
        expect(Array.isArray(createStyle.getMultiGeometryStyle("MultiPoint", jsonObjects[3], rules, false))).toBe(true);
        expect(createStyle.getMultiGeometryStyle("MultiPoint", jsonObjects[3], rules, false).length).toEqual(2);
    });
    it("should include ol point style", function () {
        expect(createStyle.getMultiGeometryStyle("MultiPoint", jsonObjects[3], rules, false)[0]).toBeInstanceOf(PointStyle);
        expect(typeof createStyle.getMultiGeometryStyle("MultiPoint", jsonObjects[3], rules, false)[0]).toBe("object");
        expect(Array.isArray(createStyle.getMultiGeometryStyle("MultiPoint", jsonObjects[3], rules, false)[0].getStyle().getImage().getStroke().getColor())).toBe(true);
        expect(createStyle.getMultiGeometryStyle("MultiPoint", jsonObjects[3], rules, false)[0].getStyle().getImage().getStroke().getColor()).toEqual([255, 0, 0, 1]);
    });
    it("should return style array for MultiLineString", function () {
        expect(Array.isArray(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rules, false))).toBe(true);
        expect(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rules, false).length).toEqual(2);
    });
    it("should include ol stroke style", function () {
        expect(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rules, false)[0]).toBeInstanceOf(LineStringStyle);
        expect(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rules, false)[0].getStyle().getStroke()).toBeInstanceOf(Stroke);
        expect(Array.isArray(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rules, false)[0].getStyle().getStroke().getColor())).toBe(true);
        expect(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rules, false)[0].getStyle().getStroke().getColor()).toEqual([100, 0, 0, 1]);
    });
    it("should return style array for MultiPolygon", function () {
        expect(Array.isArray(createStyle.getMultiGeometryStyle("MultiPolygon", jsonObjects[5], rules, false))).toBe(true);
        expect(createStyle.getMultiGeometryStyle("MultiPolygon", jsonObjects[5], rules, false).length).toEqual(2);
    });
    it("should include ol polygon style", function () {
        expect(createStyle.getMultiGeometryStyle("MultiPolygon", jsonObjects[5], rules, false)[0]).toBeInstanceOf(PolygonStyle);
        expect(createStyle.getMultiGeometryStyle("MultiPolygon", jsonObjects[5], rules, false)[0].getStyle().getStroke()).toBeInstanceOf(Stroke);
        expect(createStyle.getMultiGeometryStyle("MultiPolygon", jsonObjects[5], rules, false)[0].getStyle().getFill()).toBeInstanceOf(Fill);
        expect(Array.isArray(createStyle.getMultiGeometryStyle("MultiPolygon", jsonObjects[5], rules, false)[0].getStyle().getStroke().getColor())).toBe(true);
        expect(createStyle.getMultiGeometryStyle("MultiPolygon", jsonObjects[5], rules, false)[0].getStyle().getStroke().getColor()).toEqual([100, 100, 0, 1]);
    });
    it("should return style array for GeometryCollection", function () {
        expect(Array.isArray(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false))).toBe(true);
        expect(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false).length).toEqual(2);
    });
    it("should include ol line and point style", function () {
        expect(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false)[0]).toBeInstanceOf(PointStyle);
        expect(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false)[1]).toBeInstanceOf(LineStringStyle);
        expect(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false)[0].getStyle().getImage().getStroke()).toBeInstanceOf(Stroke);
        expect(Array.isArray(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false)[0].getStyle().getImage().getStroke().getColor())).toBe(true);
        expect(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false)[0].getStyle().getImage().getStroke().getColor()).toEqual([255, 0, 0, 1]);
        expect(createStyle.getMultiGeometryStyle("GeometryCollection", jsonObjects[6], rules, false)[1].getStyle().getStroke()).toBeInstanceOf(Stroke);
    });
    it("features with more geometries than rules (rules: 1, geometries: 2) should have style for all geometries - styleMultiGeomOnlyWithRule=false", function () {
        expect(Array.isArray(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rulesWithOneEntry, false))).toBe(true);
        expect(createStyle.getMultiGeometryStyle("MultiLineString", jsonObjects[4], rulesWithOneEntry, false).length).toEqual(2);
    });
});

describe("isMultiGeometry", function () {
    it("should return true with multi geometries", function () {
        expect(createStyle.isMultiGeometry("MultiPoint")).toBe(true);
        expect(createStyle.isMultiGeometry("MultiLineString")).toBe(true);
        expect(createStyle.isMultiGeometry("MultiPolygon")).toBe(true);
        expect(createStyle.isMultiGeometry("GeometryCollection")).toBe(true);
        expect(createStyle.isMultiGeometry("Point")).toBe(false);
    });
});

describe("getGeometryStyle", function () {
    it("should return ol style with correct settings", function () {
        expect(createStyle.getGeometryStyle(jsonObjects[0], rules, false)).toBeInstanceOf(PointStyle);
        expect(Array.isArray(createStyle.getGeometryStyle(jsonObjects[0], rules, false).getStyle().getImage().getStroke().getColor())).toBe(true);
        expect(createStyle.getGeometryStyle(jsonObjects[0], rules, false).getStyle().getImage().getStroke().getColor()).toEqual([255, 0, 0, 1]);
    });
    it("should return default style if no rule is found", function () {
        expect(Array.isArray(createStyle.getGeometryStyle(jsonObjects[0], [], false).getStyle().getImage().getFill().getColor())).toBe(true);
        expect(createStyle.getGeometryStyle(jsonObjects[0], [], false).getStyle().getImage().getFill().getColor()).toEqual([10, 200, 100, 0.5]);
    });
});