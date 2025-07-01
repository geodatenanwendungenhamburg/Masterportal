import {expect} from "chai";
import sinon from "sinon";
import SearchInterface from "@modules/searchBar/searchInterfaces/searchInterface.js";
import SearchInterfaceGazetteer from "@modules/searchBar/searchInterfaces/searchInterfaceGazetteer.js";
import store from "@appstore/index.js";

afterEach(() => {
    sinon.restore();
});

describe("src/modules/searchBar/searchInterfaces/searchInterfaceGazetteer.js", () => {
    let SearchInterface1 = null,
        checkConfigSpy;

    before(() => {
        store.getters = {
            restServiceById: () => sinon.stub(),
            "Maps/projection": {getCode: () => "EPSG:4326"}
        };
        checkConfigSpy = sinon.spy(SearchInterface.prototype, "checkConfig");
        SearchInterface1 = new SearchInterfaceGazetteer();

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
        it("SearchInterfaceGazetteer should has the prototype SearchInterface", () => {
            expect(SearchInterface1).to.be.an.instanceof(SearchInterface);
            expect(checkConfigSpy.calledOnce).to.be.true;
            expect(checkConfigSpy.firstCall.args[1]).to.be.deep.equals(["setMarker", "zoomToResult", "startRouting", "highlight3DTileByCoordinates"]);
        });
    });

    describe("normalizeResults", () => {
        it("should normalize an search result", () => {
            const searchResults = [
                {
                    name: "Result Name1",
                    type: "street",
                    geometry: {
                        coordinates: [10, 20]
                    }
                }];

            expect(SearchInterface1.normalizeResults(searchResults)).to.deep.equals([
                {
                    events: {
                        onClick: {
                            setMarker: {
                                coordinates: [10, 20]
                            },
                            zoomToResult: {
                                coordinates: [10, 20]
                            }
                        },
                        onHover: {
                            setMarker: {
                                coordinates: [10, 20]
                            }
                        },
                        buttons: {
                            startRouting: {
                                coordinates: [10, 20],
                                name: searchResults[0].name
                            }
                        }
                    },
                    category: "modules.searchBar.type.street",
                    id: "ResultName1",
                    icon: "bi-signpost-split",
                    name: "Result Name1"
                }
            ]);
        });
        it("shouldn't add a second result with same id", () => {
            const searchResults = [
                {
                    name: "Result Name1",
                    type: "houseNumbersForStreet",
                    geometry: {
                        coordinates: [10, 20]
                    }
                },
                {
                    name: "Result Name1",
                    type: "addressUnaffixed",
                    geometry: {
                        coordinates: [10, 20]
                    }
                }];

            expect(SearchInterface1.normalizeResults(searchResults)).to.deep.equals([
                {
                    events: {
                        onClick: {
                            setMarker: {
                                coordinates: [10, 20]
                            },
                            zoomToResult: {
                                coordinates: [10, 20]
                            }
                        },
                        onHover: {
                            setMarker: {
                                coordinates: [10, 20]
                            }
                        },
                        buttons: {
                            startRouting: {
                                coordinates: [10, 20],
                                name: searchResults[0].name
                            }
                        }
                    },
                    category: "modules.searchBar.type.address",
                    id: "ResultName1",
                    icon: "bi-signpost-split",
                    name: "Result Name1"
                }
            ]);
        });
    });

    describe("getTranslationByType", () => {
        it("returns the translation for type = addressAffixed", () => {
            expect(SearchInterface1.getTranslationByType("addressAffixed")).to.equal("modules.searchBar.type.address");
        });
        it("returns the translation for type = addressUnaffixed", () => {
            expect(SearchInterface1.getTranslationByType("addressUnaffixed")).to.equal("modules.searchBar.type.address");
        });
        it("returns the translation for type = district", () => {
            expect(SearchInterface1.getTranslationByType("district")).to.equal("modules.searchBar.type.district");
        });
        it("returns the translation for type = houseNumbersForStreet", () => {
            expect(SearchInterface1.getTranslationByType("houseNumbersForStreet")).to.equal("modules.searchBar.type.address");
        });
        it("returns the translation for type = parcel", () => {
            expect(SearchInterface1.getTranslationByType("parcel")).to.equal("modules.searchBar.type.parcel");
        });
        it("returns the translation for type = street", () => {
            expect(SearchInterface1.getTranslationByType("street")).to.equal("modules.searchBar.type.street");
        });
    });

    describe("normalizeResultEvents", () => {
        it("should normalize result events", () => {
            const resultEvents = {
                    onClick: ["setMarker", "zoomToResult", "highlight3DTileByCoordinates"],
                    onHover: ["setMarker"],
                    buttons: ["startRouting"]
                },
                searchResult = {
                    name: "Result Name1",
                    type: "street",
                    geometry: {
                        coordinates: [10, 20]
                    }
                };

            expect(SearchInterface1.normalizeResultEvents(resultEvents, searchResult)).to.deep.equals(
                {
                    buttons: {
                        startRouting: {
                            coordinates: [10, 20],
                            name: searchResult.name
                        }
                    },
                    onClick: {
                        setMarker: {
                            coordinates: [10, 20]
                        },
                        zoomToResult: {
                            coordinates: [10, 20]
                        },
                        highlight3DTileByCoordinates: {
                            coordinates: [10, 20]
                        }
                    },
                    onHover: {
                        setMarker: {
                            coordinates: [10, 20]
                        }
                    }
                }
            );
        });
    });

    describe("createPossibleActions", () => {
        it("should create possible events from search result", () => {
            const searchResult = {
                name: "Result Name1",
                type: "street",
                geometry: {
                    coordinates: [10, 20]
                }
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals(
                {
                    highlight3DTileByCoordinates: {
                        coordinates: [10, 20]
                    },
                    setMarker: {
                        coordinates: [10, 20]
                    },
                    zoomToResult: {
                        coordinates: [10, 20]
                    },
                    startRouting: {
                        coordinates: [10, 20],
                        name: searchResult.name
                    }
                }
            );
        });
    });
});
