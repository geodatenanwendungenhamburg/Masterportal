import {expect} from "chai";
import sinon from "sinon";
import {Polygon, Point, MultiLineString, MultiPolygon} from "ol/geom";
import SearchInterface from "../../../searchInterfaces/searchInterface.js";
import SearchInterfaceSpecialWfs from "../../../searchInterfaces/searchInterfaceSpecialWfs.js";

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
        it("should normalize a search result", () => {
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
        it("should build the correct request", () => {
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
