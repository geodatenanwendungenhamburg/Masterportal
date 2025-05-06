import {expect} from "chai";
import {sortObjects, getNestedElement, sortByLayerSequence} from "../../sortObjects.js";

describe("src/shared/js/utils/sortObjects.js", () => {
    const objects = [
        {
            name: "1a",
            properties: {
                housenumber: {
                    _: 1
                },
                hausnumberextension: {
                    _: "a"
                }
            }
        },
        {
            name: "1",
            properties: {
                housenumber: {
                    _: 1
                }
            }
        },
        {
            name: "1b",
            properties: {
                housenumber: {
                    _: 1
                },
                hausnumberextension: {
                    _: "b"
                }
            }
        },
        {
            name: "2",
            properties: {
                housenumber: {
                    _: 2
                }
            }
        }
    ];

    describe("sortObjects", () => {
        it("should return an sorted array with objects sorted by house number extensions - ascending", () => {
            const cloneObjects = [...objects],
                nestedAttribute = "properties.hausnumberextension._";

            sortObjects(cloneObjects, nestedAttribute);
            expect(cloneObjects).to.be.an("array");
            expect(cloneObjects, nestedAttribute).to.have.deep.members([
                {
                    name: "1",
                    properties: {
                        housenumber: {
                            _: 1
                        }
                    }
                },
                {
                    name: "2",
                    properties: {
                        housenumber: {
                            _: 2
                        }
                    }
                },
                {
                    name: "1a",
                    properties: {
                        housenumber: {
                            _: 1
                        },
                        hausnumberextension: {
                            _: "a"
                        }
                    }
                },
                {
                    name: "1b",
                    properties: {
                        housenumber: {
                            _: 1
                        },
                        hausnumberextension: {
                            _: "b"
                        }
                    }
                }
            ]);
        });

        it("should return an sorted array with objects sorted by house number extensions - descending", () => {
            const cloneObjects = [...objects],
                nestedAttribute = "properties.hausnumberextension._";

            sortObjects(cloneObjects, nestedAttribute, "desc");
            expect(cloneObjects).to.be.an("array");
            expect(cloneObjects, nestedAttribute).to.have.deep.members([
                {
                    name: "1b",
                    properties: {
                        housenumber: {
                            _: 1
                        },
                        hausnumberextension: {
                            _: "b"
                        }
                    }
                },
                {
                    name: "1a",
                    properties: {
                        housenumber: {
                            _: 1
                        },
                        hausnumberextension: {
                            _: "a"
                        }
                    }
                },
                {
                    name: "2",
                    properties: {
                        housenumber: {
                            _: 2
                        }
                    }
                },
                {
                    name: "1",
                    properties: {
                        housenumber: {
                            _: 1
                        }
                    }
                }
            ]);
        });
    });
    describe("getNestedElement", () => {
        it("should return the nested element for the nested attribute", () => {
            const searchElement = {
                    name: "1b",
                    properties: {
                        housenumber: {
                            _: 1
                        },
                        hausnumberextension: {
                            _: "b"
                        }
                    }
                },
                nestedAttribute = "properties.hausnumberextension._";

            expect(getNestedElement(searchElement, nestedAttribute)).to.be.a("string");
            expect(getNestedElement(searchElement, nestedAttribute)).equals("b");
        });
        it("should return an empty string for the nested attribute, if the search element does not have this attribute ", () => {
            const searchElement = {
                    name: "1b",
                    properties: {
                        housenumber: {
                            _: 1
                        }
                    }
                },
                nestedAttribute = "properties.hausnumberextension._";

            expect(getNestedElement(searchElement, nestedAttribute)).to.be.a("string");
            expect(getNestedElement(searchElement, nestedAttribute)).equals("");
        });
    });
    describe("sortByLayerSequence", () => {
        const layers = [
            {
                name: "a",
                layerSequence: 2
            },
            {
                name: "b",
                layerSequence: 1
            },
            {
                name: "c"
            },
            {
                name: "d",
                layerSequence: 3
            },
            {
                name: "e"
            }
        ];

        it("should sort objects by layerSequence in ascending order", () => {
            const clonedLayers = [...layers];

            sortByLayerSequence(clonedLayers);
            expect(clonedLayers).to.be.an("array");
            expect(clonedLayers).to.have.deep.members([
                {name: "b", layerSequence: 1, zIndex: 4},
                {name: "a", layerSequence: 2, zIndex: 3},
                {name: "d", layerSequence: 3, zIndex: 2},
                {name: "c", zIndex: 1},
                {name: "e", zIndex: 0}
            ]);
        });
        it("should place objects without layerSequence at the end", () => {
            const clonedLayers = [...layers];

            sortByLayerSequence(clonedLayers);
            expect(clonedLayers).to.be.an("array");
            expect(clonedLayers[3].name).to.equal("c");
            expect(clonedLayers[4].name).to.equal("e");
        });
        it("should keep the relative order of objects with layerSequence", () => {
            const newLayers = [
                {name: "a", layerSequence: 2},
                {name: "b", layerSequence: 1},
                {name: "c", layerSequence: 2},
                {name: "d", layerSequence: 3}
            ];

            sortByLayerSequence(newLayers);
            expect(newLayers).to.be.an("array");
            expect(newLayers).to.have.deep.members([
                {name: "b", layerSequence: 1, zIndex: 3},
                {name: "a", layerSequence: 2, zIndex: 2},
                {name: "c", layerSequence: 2, zIndex: 1},
                {name: "d", layerSequence: 3, zIndex: 0}
            ]);
            expect(newLayers[1].name).to.equal("a");
        });
    });
});
