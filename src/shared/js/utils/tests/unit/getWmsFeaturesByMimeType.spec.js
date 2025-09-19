import {expect} from "chai";
import {
    createGfiFeature,
    openFeaturesInNewWindow,
    getXmlFeatures,
    handleXmlResponse,
    getHtmlFeature,
    handleHTMLResponse,
    getJSONFeatures,
    handleJSONResponse,
    mergeFeatures
} from "@shared/js/utils/getWmsFeaturesByMimeType.js";

describe("src/shared/js/utils/getWmsFeaturesByMimeType.js", () => {
    const url = "url";
    let layer = null,
        aFeature = null;

    before(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
               return {
                getProjection: () => ({
                        getCode: () => "EPSG:25832"
                })
               }
            }
        };

        mapCollection.addMap(map, "2D");
    });


    beforeEach(() => {
        layer = {
            get: (key) => {
                if (key === "name") {
                    return "layerName";
                }
                else if (key === "gfiTheme") {
                    return "gfiTheme";
                }
                else if (key === "gfiAttributes") {
                    return "attributesToShow";
                }
                else if (key === "infoFormat") {
                    return "text/xml";
                }
                return null;
            }
        };
        aFeature = {
            getProperties: () => "featureProperties",
            getId: () => "id"
        };
    });


    describe("createGfiFeature", () => {
        it("should return an object with specific functions to get the given params", () => {
            const feature = createGfiFeature(layer, url, aFeature, null, "documentMock", "foo");

            expect(feature).to.be.an("object");

            expect(feature.getGfiUrl).to.be.a("function");
            expect(feature.getTitle).to.be.a("function");
            expect(feature.getTheme).to.be.a("function");
            expect(feature.getAttributesToShow).to.be.a("function");
            expect(feature.getProperties).to.be.a("function");
            expect(feature.getId).to.be.a("function");

            expect(feature.getGfiUrl()).to.equal("url");
            expect(feature.getTitle()).to.equal("layerName");
            expect(feature.getTheme()).to.equal("gfiTheme");
            expect(feature.getAttributesToShow()).to.equal("attributesToShow");
            expect(feature.getProperties()).to.equal("featureProperties");
            expect(feature.getId()).to.equal("id");
            expect(feature.getDocument()).to.equal("documentMock");
            expect(feature.getBBox()).to.equal("foo");
        });

        it("should use attribute value as title when gfiTitleAttribute is configured and attribute exists", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "layerName";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithAttr = {
                    getProperties: () => ({
                        stationName: "Hauptbahnhof",
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithAttr);

            expect(feature.getTitle()).to.equal("Hauptbahnhof");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is missing", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithoutAttr = {
                    getProperties: () => ({
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithoutAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is empty string", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithEmptyAttr = {
                    getProperties: () => ({
                        stationName: "",
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithEmptyAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is null", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithNullAttr = {
                    getProperties: () => ({
                        stationName: null,
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithNullAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is undefined", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithUndefinedAttr = {
                    getProperties: () => ({
                        stationName: undefined,
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithUndefinedAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should use layer name when gfiTitleAttribute is not configured", () => {
            const feature = createGfiFeature(layer, url, aFeature);

            expect(feature.getTitle()).to.equal("layerName");
        });

        it("should handle numeric attribute values as title", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "Building Layer";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "buildingNumber";
                        }
                        return null;
                    }
                },
                featureWithNumericAttr = {
                    getProperties: () => ({
                        buildingNumber: 42,
                        address: "Main Street"
                    }),
                    getId: () => "building-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithNumericAttr);

            expect(feature.getTitle()).to.equal(42);
        });

        it("should not treat zero as empty value when used as title attribute", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "Counter Layer";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "count";
                        }
                        return null;
                    }
                },
                featureWithZero = {
                    getProperties: () => ({
                        count: 0,
                        type: "sensor"
                    }),
                    getId: () => "sensor-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithZero);

            expect(feature.getTitle()).to.equal("Counter Layer");
        });
    });

    describe("openFeaturesInNewWindow", () => {
        it("should return false if any funny params are given", () => {
            let result = false;

            result = openFeaturesInNewWindow();
            expect(result).to.be.false;

            result = openFeaturesInNewWindow(1234);
            expect(result).to.be.false;

            result = openFeaturesInNewWindow("url", 1234);
            expect(result).to.be.false;

            result = openFeaturesInNewWindow("url", "gfiAsNewWindow");
            expect(result).to.be.false;

            result = openFeaturesInNewWindow("url", {}, 1234);
            expect(result).to.be.false;
        });
        it("should call the openWindow function if gfiAsNewWindow is an object", () => {
            let lastUrl = "";
            const result = openFeaturesInNewWindow("url", {}, (anUrl) => {
                lastUrl = anUrl;
            });

            expect(result).to.be.true;
            expect(lastUrl).to.equal("url");
        });
        it("should not call the openWindow function if gfiAsNewWindow is null", () => {
            let lastUrl = "";
            const result = openFeaturesInNewWindow("url", null, (anUrl) => {
                lastUrl = anUrl;
            });

            expect(result).to.be.false;
            expect(lastUrl).to.be.empty;
        });
        it("should call the openWindow function if gfiAsNewWindow is null but the url starts with 'http:'", () => {
            let lastUrl = "";
            const result = openFeaturesInNewWindow("http:url", {}, (anUrl) => {
                lastUrl = anUrl;
            });

            expect(result).to.be.true;
            expect(lastUrl).to.equal("http:url");
        });
        it("should call the openWindow function with the params from gfiAsNewWindow", () => {
            let lastUrl = "",
                lastName = "",
                lastSpecs = "";
            const result = openFeaturesInNewWindow("url", {
                name: "name",
                specs: "specs"
            }, (anUrl, name, specs) => {
                lastUrl = anUrl;
                lastName = name;
                lastSpecs = specs;
            });

            expect(result).to.be.true;
            expect(lastUrl).to.equal("url");
            expect(lastName).to.equal("name");
            expect(lastSpecs).to.equal("specs");
        });
    });

    describe("getXmlFeatures", () => {
        it("should call requestGfi and return an empty array, because url is no String", async () => {
            const result = await getXmlFeatures(layer, {url});

            expect(result).to.be.an("array").to.have.lengthOf(0);
        });
    });
    describe("handleXmlResponse", () => {
        it("should return a wms feature with the received properties", async () => {
            const result = await handleXmlResponse([aFeature], layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");

            expect(result[0].getGfiUrl).to.be.a("function");
            expect(result[0].getTitle).to.be.a("function");
            expect(result[0].getTheme).to.be.a("function");
            expect(result[0].getAttributesToShow).to.be.a("function");
            expect(result[0].getProperties).to.be.a("function");

            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("gfiTheme");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.equal("featureProperties");
        });
        it("should return an empty array if called with undefined", async () => {
            let result = await handleXmlResponse([undefined], layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(0);
            result = await handleXmlResponse([aFeature], undefined, url);
            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getProperties).to.be.undefined;
        });
    });
    describe("getHtmlFeature", () => {
        it("should call requestGfi and return an empty array, because url is no String", async () => {
            const result = await getHtmlFeature(layer, {url});

            expect(result).to.be.an("array").to.have.lengthOf(0);
        });

    });
    describe("handleHTMLResponse", () => {
        it("handles response with mimeType text/html, empty body and the given url", async () => {
            const documentMock = null,
                result = handleHTMLResponse(documentMock, layer, url);

            expect(result.length).to.equal(0);
        });
        it("handles response with mimeType text/html, filled body and the given url", async () => {
            const documentMock = {
                    getElementsByTagName: () => [
                        {
                            children: ["child1", "child2"]
                        }
                    ]
                },
                result = handleHTMLResponse(documentMock, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("gfiTheme");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
        });
    });
    describe("getJSONFeatures", () => {
        it("should call requestGfi and return an empty array, because url is no String", async () => {
            const result = await getJSONFeatures(layer, {url});

            expect(result).to.be.an("array").to.have.lengthOf(0);
        });

    });
    describe("handleJSONResponse", () => {
        it("handles response with mimeType application/json, empty body and the given url", async () => {
            const objectMock = null,
                result = handleJSONResponse(objectMock, layer, url);

            expect(result.length).to.equal(0);
        });
        it("handles response with mimeType application/json, filled body and the given url", async () => {
            const objectMock = {
                    features: [{
                        properties: {},
                        id: "1"
                    }]
                },
                result = handleJSONResponse(objectMock, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("gfiTheme");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
        });
        it("handles response with mimeType application/json, filled body with geometry and the given url", async () => {
            const objectMock = {
                    features: [
                        {
                            geometry: {
                                coordinates: [
                                    [
                                        [
                                            [386470, 5819395],
                                            [386470, 5819390],
                                            [386559, 5819397],
                                            [386558, 5819403],
                                            [386470, 5819395]
                                        ]
                                    ]
                                ],
                                type: "MultiPolygon"
                            },
                            id: "1",
                            properties: {},
                            type: "Feature"
                        }
                    ]
                },
                result = handleJSONResponse(objectMock, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getOlFeature()).to.be.an("object");
            expect(result[0].getOlFeature().getGeometry).to.be.an("function");
        });
    });
    describe("mergeFeatures", () => {
        it("creates a merged feature if gfiTheme is DataTable", async () => {
            const objectMock = {
                    features: [
                        {
                            properties: {},
                            id: "1"
                        },
                        {
                            properties: {},
                            id: "1"
                        }
                    ]
                },
                localLayer = {
                    gfiTheme: "DataTable",
                    get: (key) => {
                        if (key === "name") {
                            return "layerName";
                        }
                        else if (key === "gfiTheme") {
                            return "DataTable";
                        }
                        else if (key === "gfiAttributes") {
                            return "attributesToShow";
                        }
                        else if (key === "infoFormat") {
                            return "text/xml";
                        }
                        return null;
                    }
                };

            let result = handleJSONResponse(objectMock, localLayer, url);

            result = mergeFeatures(result, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("DataTable");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
        });
        it("creates a merged feature if gfiTheme is DataTable with bbox", async () => {
            const objectMock = {
                    features: [
                        {
                            properties: {},
                            id: "1"
                        }
                    ]
                },
                localLayer = {
                    gfiTheme: "DataTable",
                    get: (key) => {
                        if (key === "name") {
                            return "layerName";
                        }
                        else if (key === "gfiTheme") {
                            return "DataTable";
                        }
                        else if (key === "gfiAttributes") {
                            return "attributesToShow";
                        }
                        else if (key === "infoFormat") {
                            return "text/xml";
                        }
                        return null;
                    }
                },
                result = mergeFeatures(objectMock.features, localLayer, url, [1234, 1234]);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("DataTable");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
            expect(result[0].getBBox()).to.deep.equal([1234, 1234]);
        });
    });
});
