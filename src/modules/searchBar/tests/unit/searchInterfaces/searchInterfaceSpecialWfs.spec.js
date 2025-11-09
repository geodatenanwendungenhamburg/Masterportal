import {expect} from "chai";
import sinon from "sinon";
import {Polygon, Point, MultiLineString, MultiPolygon} from "ol/geom.js";
import SearchInterface from "@modules/searchBar/searchInterfaces/searchInterface.js";
import SearchInterfaceSpecialWfs from "@modules/searchBar/searchInterfaces/searchInterfaceSpecialWfs.js";
import mapCollection from "@core/maps/js/mapCollection.js";
import crs from "@masterportal/masterportalapi/src/crs.js";

describe("src/modules/searchBar/searchInterfaces/searchInterfaceSpecialWfs.js", () => {
    let SearchInterface1 = null,
        checkConfigSpy;
    const searchResults = [
        {
            coordinates: [["565931.982", "5935196.323", "565869.067", "5935016.323"]],
            geometryType: "MultiPolygon",
            icon: "bi-house-fill",
            identifier: "Rotherbaum37",
            type: "common:modules.searchBar.specialWFS.ongoing"
        }];

    before(() => {
        checkConfigSpy = sinon.spy(SearchInterface.prototype, "checkConfig");
        SearchInterface1 = new SearchInterfaceSpecialWfs();

        i18next.init({
            lng: "cimode",
            debug: false
        });

        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    afterEach(() => {
        SearchInterface1.clearSearchResults();
        sinon.restore();
    });

    describe("prototype", () => {
        it("SearchInterfaceSpecialWfs should has the prototype SearchInterface", () => {
            expect(SearchInterface1).to.be.an.instanceof(SearchInterface);
            expect(checkConfigSpy.calledOnce).to.be.true;
            expect(checkConfigSpy.firstCall.args[1]).to.be.deep.equals(["highlightFeature", "setMarker", "zoomToResult"]);
        });
    });

    describe("normalizeResults", () => {
        it.skip("should normalize a search result", () => {
            const normalizeResults = SearchInterface1.normalizeResults(searchResults)[0];

            expect(normalizeResults.category).to.equal("modules.searchBar.specialWFS.ongoing");
            expect(normalizeResults.icon).to.equal("bi-house-fill");
            expect(normalizeResults.id).to.equal("SpecialWFS1");
            expect(normalizeResults.name).to.equal("Rotherbaum37");
            expect(normalizeResults.toolTip).to.equal("Rotherbaum37");
            expect(normalizeResults.events).to.deep.equals({
                onClick: {
                    highlightFeature: {
                        hit: {
                            coordinate: [["565931.982", "5935196.323", "565869.067", "5935016.323"]],
                            geometryType: "MultiPolygon"
                        }
                    },
                    setMarker: {
                        coordinates: ["565931.982", "5935196.323", "565869.067", "5935016.323"],
                        geometryType: "MultiPolygon"
                    },
                    zoomToResult: {
                        coordinates: ["565931.982", "5935196.323", "565869.067", "5935016.323"]
                    }
                },
                onHover: {
                    highlightFeature: {
                        hit: {
                            coordinate: [["565931.982", "5935196.323", "565869.067", "5935016.323"]],
                            geometryType: "MultiPolygon"
                        }
                    },
                    setMarker: {
                        coordinates: ["565931.982", "5935196.323", "565869.067", "5935016.323"],
                        geometryType: "MultiPolygon"
                    }
                }
            });
        });
    });

    describe("WFSXML", () => {
        it("should build the correct request with PropertyName elements", () => {
            const definitions = [
                {
                    "url": "https://geodienste.hamburg.de/HH_WFS_Bebauungsplaene",
                    "typeName": "app:hh_hh_festgestellt",
                    "propertyNames": [
                        "app:geltendes_planrecht"
                    ],
                    "geometryName": "app:geom",
                    "name": "common:modules.searchBar.specialWFS.terminated",
                    "namespaces": "xmlns:app='http://www.deegree.org/app'"
                }
            ];

            expect(SearchInterface1.getWFS110Xml(definitions[0], "abc")).to.equals(
                "<wfs:GetFeature service='WFS' xmlns:wfs='http://www.opengis.net/wfs' xmlns:ogc='http://www.opengis.net/ogc' xmlns:gml='http://www.opengis.net/gml' xmlns:app='http://www.deegree.org/app' traverseXlinkDepth='*' version='1.1.0'>" +
                "<wfs:Query typeName='app:hh_hh_festgestellt'>" +
                "<wfs:PropertyName>app:geltendes_planrecht</wfs:PropertyName>" +
                "<wfs:PropertyName>app:geom</wfs:PropertyName>" +
                "<wfs:maxFeatures>20</wfs:maxFeatures>" +
                "<ogc:Filter>" +
                "<ogc:PropertyIsLike matchCase='false' wildCard='*' singleChar='#' escapeChar='!'><ogc:PropertyName>app:geltendes_planrecht</ogc:PropertyName><ogc:Literal>*abc*</ogc:Literal></ogc:PropertyIsLike>" +
                "</ogc:Filter></wfs:Query></wfs:GetFeature>"
            );
        });
    });

    describe("getInteriorAndExteriorPolygonMembers", () => {
        it("should return correct coordinateArray for polygon with interior and exterior", () => {
            const polygonMembers = "<gml:Polygon xmlns:gml='http://www.opengis.net/gml' srsName='EPSG:25832'>" +
                    "<gml:exterior>" +
                        "<gml:LinearRing srsName='EPSG:25832'>" +
                            "<gml:posList>633653.190 5647452.770 633528.150 5647303.820 633517.510 5647293.520 633502.960 5647282.230 633653.190 5647452.770</gml:posList>" +
                        "</gml:LinearRing>" +
                    "</gml:exterior>" +
                    "<gml:interior>" +
                        "<gml:LinearRing srsName='EPSG:25832'>" +
                            "<gml:posList>633806.963 5646359.816 633826.122 5646366.259 633836.733 5646369.832 633852.427 5646375.113 633806.963 5646359.816</gml:posList>" +
                        "</gml:LinearRing>" +
                    "</gml:interior>" +
                    "<gml:interior>" +
                        "<gml:LinearRing srsName='EPSG:25832'>" +
                            "<gml:posList>634037.745 5646804.502 634082.117 5646797.795 634109.727 5646798.550 634104.507 5646805.330 634100.089 5646811.410 634037.745 5646804.502</gml:posList>" +
                        "</gml:LinearRing>" +
                    "</gml:interior>" +
                "</gml:Polygon>",
                parser = new DOMParser(),
                xmlData = parser.parseFromString(polygonMembers, "application/xml");

            expect(SearchInterface1.getInteriorAndExteriorPolygonMembers(xmlData.getElementsByTagNameNS("*", "Polygon"))).to.deep.equals(
                [
                    [
                        ["633653.190", "5647452.770", "633528.150", "5647303.820", "633517.510", "5647293.520", "633502.960", "5647282.230", "633653.190", "5647452.770"],
                        ["633806.963", "5646359.816", "633826.122", "5646366.259", "633836.733", "5646369.832", "633852.427", "5646375.113", "633806.963", "5646359.816"],
                        ["634037.745", "5646804.502", "634082.117", "5646797.795", "634109.727", "5646798.550", "634104.507", "5646805.330", "634100.089", "5646811.410", "634037.745", "5646804.502"]
                    ]
                ]
            );
        });
        it("should return correct coordinateArray for multipolygon with interior and exterior", () => {
            const polygonMembers = "<gml:MultiPolygon xmlns:gml='http://www.opengis.net/gml' srsName='EPSG:25832'>" +
                    "<gml:polygonMember>" +
                        "<gml:Polygon srsName='EPSG:25832'>" +
                            "<gml:exterior>" +
                                "<gml:LinearRing srsName='EPSG:25832'>" +
                                    "<gml:posList>616556.662 5640251.335 616556.662 5640251.335 616556.256 5640251.662 616556.662 5640251.335</gml:posList>" +
                                "</gml:LinearRing>" +
                            "</gml:exterior>" +
                        "</gml:Polygon>" +
                    "</gml:polygonMember>" +
                    "<gml:polygonMember>" +
                        "<gml:Polygon srsName='EPSG:25832'>" +
                            "<gml:exterior>" +
                                "<gml:LinearRing srsName='EPSG:25832'>" +
                                    "<gml:posList>616501.461 5640403.126 616444.650 5640308.210 616479.019 5640292.544 616482.912 5640298.671 616501.461 5640403.126</gml:posList>" +
                                "</gml:LinearRing>" +
                            "</gml:exterior>" +
                        "</gml:Polygon>" +
                    "</gml:polygonMember>" +
                    "<gml:polygonMember>" +
                        "<gml:Polygon srsName='EPSG:25832'>" +
                            "<gml:exterior>" +
                                "<gml:LinearRing srsName='EPSG:25832'>" +
                                    "<gml:posList>616626.114 5640175.171 616699.340 5640034.420 616708.300 5639859.060 616626.114 5640175.171</gml:posList>" +
                                "</gml:LinearRing>" +
                            "</gml:exterior>" +
                            "<gml:interior>" +
                                "<gml:LinearRing srsName='EPSG:25832'>" +
                                    "<gml:posList>619219.121 5643040.941 619387.503 5643128.571 619418.598 5643144.862 619219.121 5643040.941</gml:posList>" +
                                "</gml:LinearRing>" +
                            "</gml:interior>" +
                            "<gml:interior>" +
                                "<gml:LinearRing srsName='EPSG:25832'>" +
                                    "<gml:posList>618171.149 5642161.063 618177.133 5642139.270 618167.636 5642136.583 618150.931 5642130.018 618142.673 5642128.056 618171.149 5642161.063</gml:posList>" +
                                "</gml:LinearRing>" +
                            "</gml:interior>" +
                        "</gml:Polygon>" +
                    "</gml:polygonMember>" +
                "</gml:MultiPolygon>",
                parser = new DOMParser(),
                xmlData = parser.parseFromString(polygonMembers, "application/xml");

            expect(SearchInterface1.getInteriorAndExteriorPolygonMembers(xmlData.getElementsByTagNameNS("*", "Polygon"))).to.deep.equals(
                [
                    ["616556.662", "5640251.335", "616556.662", "5640251.335", "616556.256", "5640251.662", "616556.662", "5640251.335"],
                    ["616501.461", "5640403.126", "616444.650", "5640308.210", "616479.019", "5640292.544", "616482.912", "5640298.671", "616501.461", "5640403.126"],
                    [
                        ["616626.114", "5640175.171", "616699.340", "5640034.420", "616708.300", "5639859.060", "616626.114", "5640175.171"],
                        ["619219.121", "5643040.941", "619387.503", "5643128.571", "619418.598", "5643144.862", "619219.121", "5643040.941"],
                        ["618171.149", "5642161.063", "618177.133", "5642139.270", "618167.636", "5642136.583", "618150.931", "5642130.018", "618142.673", "5642128.056", "618171.149", "5642161.063"]
                    ]
                ]
            );
        });
    });

    describe("fillHitList", () => {
        it("should parse WFS response and fill hit list with polygon geometry", () => {
            const xml = "<wfs:FeatureCollection xmlns:wfs='http://www.opengis.net/wfs' xmlns:app='http://www.deegree.org/app' xmlns:gml='http://www.opengis.net/gml'>" +
                    "<gml:featureMember>" +
                        "<app:test_feature>" +
                            "<app:name>Test Feature 1</app:name>" +
                            "<app:geom>" +
                                "<gml:Polygon srsName='EPSG:25832'>" +
                                    "<gml:exterior>" +
                                        "<gml:LinearRing>" +
                                            "<gml:posList>100 200 110 210 120 200 100 200</gml:posList>" +
                                        "</gml:LinearRing>" +
                                    "</gml:exterior>" +
                                "</gml:Polygon>" +
                            "</app:geom>" +
                        "</app:test_feature>" +
                    "</gml:featureMember>" +
                "</wfs:FeatureCollection>",
                result = {hits: []},
                requestConfig = {
                    name: "Test Feature Type",
                    typeName: "app:test_feature",
                    propertyNames: ["app:name"],
                    geometryName: "app:geom",
                    icon: "bi-test-icon"
                };

            const filledResult = SearchInterface1.fillHitList(xml, result, requestConfig);

            expect(filledResult.hits).to.have.lengthOf(1);
            expect(filledResult.hits[0].identifier).to.equal("Test Feature 1");
            expect(filledResult.hits[0].type).to.equal("Test Feature Type");
            expect(filledResult.hits[0].geometryType).to.equal("Polygon");
            expect(filledResult.hits[0].icon).to.equal("bi-test-icon");
            expect(filledResult.hits[0].geometry).to.be.an.instanceof(Polygon);
            expect(filledResult.hits[0].coordinates).to.be.undefined;
        });

        it("should parse WFS response and fill hit list with multipolygon geometry", () => {
            const xml = "<wfs:FeatureCollection xmlns:wfs='http://www.opengis.net/wfs' xmlns:app='http://www.deegree.org/app' xmlns:gml='http://www.opengis.net/gml'>" +
                    "<gml:featureMember>" +
                        "<app:test_feature>" +
                            "<app:name>MultiPolygon Feature</app:name>" +
                            "<app:geom>" +
                                "<gml:MultiPolygon srsName='EPSG:25832'>" +
                                    "<gml:polygonMember>" +
                                        "<gml:Polygon>" +
                                            "<gml:exterior>" +
                                                "<gml:LinearRing>" +
                                                    "<gml:posList>100 200 110 210 120 200 100 200</gml:posList>" +
                                                "</gml:LinearRing>" +
                                            "</gml:exterior>" +
                                        "</gml:Polygon>" +
                                    "</gml:polygonMember>" +
                                "</gml:MultiPolygon>" +
                            "</app:geom>" +
                        "</app:test_feature>" +
                    "</gml:featureMember>" +
                "</wfs:FeatureCollection>",
                result = {hits: []},
                requestConfig = {
                    name: "Test Feature Type",
                    typeName: "app:test_feature",
                    propertyNames: ["app:name"],
                    geometryName: "app:geom",
                    icon: "bi-test-icon"
                };

            const filledResult = SearchInterface1.fillHitList(xml, result, requestConfig);

            expect(filledResult.hits).to.have.lengthOf(1);
            expect(filledResult.hits[0].identifier).to.equal("MultiPolygon Feature");
            expect(filledResult.hits[0].geometryType).to.equal("MultiPolygon");
            expect(filledResult.hits[0].coordinates).to.deep.equal([["100", "200", "110", "210", "120", "200", "100", "200"]]);
        });

        it("should parse WFS response with polygon containing interior rings", () => {
            const xml = "<wfs:FeatureCollection xmlns:wfs='http://www.opengis.net/wfs' xmlns:app='http://www.deegree.org/app' xmlns:gml='http://www.opengis.net/gml'>" +
                    "<gml:featureMember>" +
                        "<app:test_feature>" +
                            "<app:name>Polygon with Hole</app:name>" +
                            "<app:geom>" +
                                "<gml:Polygon srsName='EPSG:25832'>" +
                                    "<gml:exterior>" +
                                        "<gml:LinearRing>" +
                                            "<gml:posList>100 200 200 200 200 100 100 100 100 200</gml:posList>" +
                                        "</gml:LinearRing>" +
                                    "</gml:exterior>" +
                                    "<gml:interior>" +
                                        "<gml:LinearRing>" +
                                            "<gml:posList>120 180 180 180 180 120 120 120 120 180</gml:posList>" +
                                        "</gml:LinearRing>" +
                                    "</gml:interior>" +
                                "</gml:Polygon>" +
                            "</app:geom>" +
                        "</app:test_feature>" +
                    "</gml:featureMember>" +
                "</wfs:FeatureCollection>",
                result = {hits: []},
                requestConfig = {
                    name: "Test Feature Type",
                    typeName: "app:test_feature",
                    propertyNames: ["app:name"],
                    geometryName: "app:geom",
                    icon: "bi-test-icon"
                };

            const filledResult = SearchInterface1.fillHitList(xml, result, requestConfig);

            expect(filledResult.hits).to.have.lengthOf(1);
            expect(filledResult.hits[0].identifier).to.equal("Polygon with Hole");
            expect(filledResult.hits[0].geometryType).to.equal("Polygon");
            expect(filledResult.hits[0].interior).to.be.true;
            expect(filledResult.hits[0].coordinates).to.have.lengthOf(1);
            expect(filledResult.hits[0].coordinates[0]).to.have.lengthOf(2);
        });

        it("should use default icon when not specified in requestConfig", () => {
            const xml = "<wfs:FeatureCollection xmlns:wfs='http://www.opengis.net/wfs' xmlns:app='http://www.deegree.org/app' xmlns:gml='http://www.opengis.net/gml'>" +
                    "<gml:featureMember>" +
                        "<app:test_feature>" +
                            "<app:name>Test</app:name>" +
                            "<app:geom>" +
                                "<gml:Polygon srsName='EPSG:25832'>" +
                                    "<gml:exterior>" +
                                        "<gml:LinearRing>" +
                                            "<gml:posList>100 200 110 210 120 200 100 200</gml:posList>" +
                                        "</gml:LinearRing>" +
                                    "</gml:exterior>" +
                                "</gml:Polygon>" +
                            "</app:geom>" +
                        "</app:test_feature>" +
                    "</gml:featureMember>" +
                "</wfs:FeatureCollection>",
                result = {hits: []},
                requestConfig = {
                    name: "Test Feature Type",
                    typeName: "app:test_feature",
                    propertyNames: ["app:name"],
                    geometryName: "app:geom"
                };

            const filledResult = SearchInterface1.fillHitList(xml, result, requestConfig);

            expect(filledResult.hits[0].icon).to.equal("bi-house");
        });
    });

    describe("transformPointGeometryIfNeeded", () => {
        it("should transform Point geometry when coordinates are in WGS84 range", () => {
            const transformStub = sinon.stub(crs, "transformToMapProjection").returns([1168500, 7073500]),
                geometry = new Point([10.5, 53.5]),
                map = mapCollection.getMap("2D"),
                geometryType = "Point";

            SearchInterface1.transformPointGeometryIfNeeded(geometry, geometryType, map);

            const coords = geometry.getCoordinates();

            expect(transformStub.calledOnce).to.be.true;
            expect(transformStub.firstCall.args[2]).to.deep.equal([53.5, 10.5]);
            expect(coords[0]).to.equal(1168500);
            expect(coords[1]).to.equal(7073500);

            transformStub.restore();
        });

        it("should not transform Point geometry when coordinates are outside WGS84 range", () => {
            const originalCoords = [565931.982, 5935196.323],
                geometry = new Point([...originalCoords]),
                map = mapCollection.getMap("2D"),
                geometryType = "Point";

            SearchInterface1.transformPointGeometryIfNeeded(geometry, geometryType, map);

            const coords = geometry.getCoordinates();

            expect(coords[0]).to.equal(originalCoords[0]);
            expect(coords[1]).to.equal(originalCoords[1]);
        });

        it("should not transform non-Point geometries", () => {
            const originalCoords = [[10, 20], [30, 40], [50, 60]],
                geometry = new MultiLineString([[...originalCoords]]),
                map = mapCollection.getMap("2D"),
                geometryType = "MultiLineString";

            SearchInterface1.transformPointGeometryIfNeeded(geometry, geometryType, map);

            const coords = geometry.getCoordinates();

            expect(coords[0]).to.deep.equal(originalCoords);
        });

        it("should handle null or undefined geometry gracefully", () => {
            const map = mapCollection.getMap("2D"),
                geometryType = "Point";

            expect(() => SearchInterface1.transformPointGeometryIfNeeded(null, geometryType, map)).to.not.throw();
            expect(() => SearchInterface1.transformPointGeometryIfNeeded(undefined, geometryType, map)).to.not.throw();
        });

        it("should handle Point at coordinate origin (0,0)", () => {
            const transformStub = sinon.stub(crs, "transformToMapProjection").returns([1000, 2000]),
                geometry = new Point([0, 0]),
                map = mapCollection.getMap("2D"),
                geometryType = "Point";

            SearchInterface1.transformPointGeometryIfNeeded(geometry, geometryType, map);

            const coords = geometry.getCoordinates();

            expect(transformStub.calledOnce).to.be.true;
            expect(transformStub.firstCall.args[2]).to.deep.equal([0, 0]);
            expect(coords).to.deep.equal([1000, 2000]);

            transformStub.restore();
        });
    });

    describe("createPossibleActions", () => {
        it("should create possible events from search result for simple multipolygon", () => {

            expect(SearchInterface1.createPossibleActions(searchResults[0])).to.deep.equals(
                {
                    highlightFeature: {
                        hit: {
                            coordinate: [["565931.982", "5935196.323", "565869.067", "5935016.323"]],
                            geometryType: "MultiPolygon"
                        }
                    },
                    setMarker: {
                        coordinates: ["565931.982", "5935196.323", "565869.067", "5935016.323"],
                        geometryType: "MultiPolygon"
                    },
                    zoomToResult: {
                        coordinates: ["565931.982", "5935196.323", "565869.067", "5935016.323"]
                    }
                }
            );
        });
        it("should create possible events from search result for simple polygon", () => {
            const searchResult = {
                "type": "B-Plan",
                "identifier": "Test",
                "geometryType": "Polygon",
                "icon": "bi-house",
                geometry: new Polygon([[[10, 20, 0], [11, 11, 0], [15, 10, 0], [10, 10, 0]]])
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals(
                {
                    highlightFeature: {
                        hit: {
                            coordinate: [10, 20, 11, 11, 15, 10, 10, 10],
                            geometryType: "Polygon"
                        }
                    },
                    setMarker: {
                        coordinates: [10, 20, 11, 11, 15, 10, 10, 10],
                        geometryType: "Polygon"
                    },
                    zoomToResult: {
                        coordinates: [10, 20, 11, 11, 15, 10, 10, 10]
                    }
                }
            );
        });
        it("should create possible events from search result for point feature", () => {
            const searchResult = {
                "type": "B-Plan (Position)",
                "identifier": "2-097 - Bebauungsplan mit örtlichen Bauvorschriften \"Fuhrmannsgasse\"",
                "geometryType": "Point",
                "icon": "bi-house",
                geometry: new Point([10, 20, 0])
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals(
                {
                    highlightFeature: {
                        hit: {
                            coordinate: [10, 20],
                            geometryType: "Point"
                        }
                    },
                    setMarker: {
                        coordinates: [10, 20],
                        geometryType: "Point"
                    },
                    zoomToResult: {
                        coordinates: [10, 20]
                    }
                }
            );
        });
        it("should create possible events from search result for multi linestring", () => {
            const searchResult = {
                "type": "MultiLineString",
                "identifier": "Test",
                "geometryType": "MultiLineString",
                "icon": "bi-house",
                geometry: new MultiLineString([[
                    [10, 10, 0],
                    [20, 20, 0],
                    [30, 10, 0],
                    [40, 20, 0],
                    [50, 10, 0]
                ], [
                    [60, 10, 0],
                    [70, 20, 0],
                    [80, 10, 0]
                ]])
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals(
                {
                    highlightFeature: {
                        hit: {
                            coordinate: [[
                                10, 10,
                                20, 20,
                                30, 10,
                                40, 20,
                                50, 10
                            ], [
                                60, 10,
                                70, 20,
                                80, 10
                            ]],
                            geometryType: "MultiLineString"
                        }
                    },
                    setMarker: {
                        coordinates: [
                            10, 10,
                            20, 20,
                            30, 10,
                            40, 20,
                            50, 10
                        ],
                        geometryType: "MultiLineString"
                    },
                    zoomToResult: {
                        coordinates: [
                            10, 10,
                            20, 20,
                            30, 10,
                            40, 20,
                            50, 10
                        ]
                    }
                }
            );
        });
        it("should create possible events from search result for a multi polygon", () => {
            const searchResult = {
                "type": "B-Plan",
                "identifier": "Test",
                "geometryType": "MultiPolygon",
                "icon": "bi-house",
                geometry: new MultiPolygon([
                    [[[10, 10], [20, 1], [1, 1], [1, 30], [40, 10]]],
                    [[[2, 2], [2, 3], [3, 3], [3, 2], [2, 2]]]
                ])
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals(
                {
                    highlightFeature: {
                        hit: {
                            coordinate: [
                                [10, 10, 20, 1, 1, 1, 1, 30, 40, 10],
                                [2, 2, 2, 3, 3, 3, 3, 2, 2, 2]
                            ],
                            geometryType: "MultiPolygon"
                        }
                    },
                    setMarker: {
                        coordinates: [
                            10, 10, 20, 1, 1, 1, 1, 30, 40, 10
                        ],
                        geometryType: "MultiPolygon"
                    },
                    zoomToResult: {
                        coordinates: [
                            10, 10, 20, 1, 1, 1, 1, 30, 40, 10
                        ]
                    }
                }
            );
        });
    });
});
