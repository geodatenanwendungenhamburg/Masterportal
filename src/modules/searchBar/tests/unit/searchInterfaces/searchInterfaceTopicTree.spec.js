import {expect} from "chai";
import sinon from "sinon";
import SearchInterface from "@modules/searchBar/searchInterfaces/searchInterface.js";
import SearchInterfaceTopicTree from "@modules/searchBar/searchInterfaces/searchInterfaceTopicTree.js";
import store from "@appstore/index.js";

describe("src/modules/searchBar/searchInterfaces/searchInterfaceTopicTree.js", () => {
    let SearchInterface1 = null,
        checkConfigSpy;

    before(() => {
        checkConfigSpy = sinon.spy(SearchInterface.prototype, "checkConfig");
        SearchInterface1 = new SearchInterfaceTopicTree();

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
        it("SearchInterfaceTopicTree should has the prototype SearchInterface", () => {
            expect(SearchInterface1).to.be.an.instanceof(SearchInterface);
            expect(checkConfigSpy.calledOnce).to.be.true;
            expect(checkConfigSpy.firstCall.args[1]).to.be.deep.equals(["activateLayerInTopicTree", "showInTree", "showLayerInfo"]);
        });
    });

    describe("createRegExp", () => {
        it("should create a regular expression from searchInput", () => {
            const searchInput = "Überschwemmungsgebiete (alkis)";

            expect(String(SearchInterface1.createRegExp(searchInput))).to.equals(String(/Überschwemmungsgebiete \(alkis\)/i));
        });
    });

    describe("searchInLayers", () => {
        describe("map mode 2D", () => {
            let layerConfigs;

            beforeEach(() => {
                store.getters = {
                    "Maps/mode": "2D"
                };
                layerConfigs = [
                    {
                        id: "1",
                        name: "Überschwemmungsgebiete",
                        typ: "WMS",
                        datasets: [{
                            md_name: "Überschwemmungsgebiete (alkis)"
                        }]
                    },
                    {
                        id: "2",
                        name: "Krankenhäuser Test",
                        typ: "WMS"
                    },
                    {
                        id: "3",
                        name: "Überschwemmungsgebiete 3D",
                        typ: "TILESET3D"
                    }
                ];
            });

            it("should search in layers and return found layers only 2D-layers", () => {
                const searchInput = "Überschwemmungsgebiete",
                    searchInputRegExp = SearchInterface1.createRegExp(searchInput);

                expect(SearchInterface1.searchInLayers(layerConfigs, searchInputRegExp)).to.deep.equals([
                    {
                        category: "modules.searchBar.type.topic",
                        events: {
                            onClick: {
                                activateLayerInTopicTree: {
                                    layerId: "1"
                                }
                            },
                            buttons: {
                                showInTree: {
                                    layerId: "1"
                                },
                                showLayerInfo: {
                                    layerId: "1"
                                }
                            }
                        },
                        icon: "bi-stack",
                        id: "1",
                        name: "Überschwemmungsgebiete",
                        toolTip: "Überschwemmungsgebiete (alkis)"
                    }
                ]);
            });

            it("should find a layer when the search input partially matches its name with internal spaces", () => {
                const searchInput = "Krankenhäuser T",
                    searchInputRegExp = SearchInterface1.createRegExp(searchInput);

                expect(SearchInterface1.searchInLayers(layerConfigs, searchInputRegExp)).to.deep.equals([
                    {
                        category: "modules.searchBar.type.topic",
                        events: {
                            onClick: {
                                activateLayerInTopicTree: {
                                    layerId: "2"
                                }
                            },
                            buttons: {
                                showInTree: {
                                    layerId: "2"
                                },
                                showLayerInfo: {
                                    layerId: "2"
                                }
                            }
                        },
                        icon: "bi-stack",
                        id: "2",
                        name: "Krankenhäuser Test",
                        toolTip: ""
                    }
                ]);
            });
        });

        describe("map mode 3D", () => {
            beforeEach(() => {
                store.getters = {
                    "Maps/mode": "3D"
                };
            });

            it("should search in layers and return found layers also 3D-layers", () => {
                const searchInput = "Überschwemmungsgebiete",
                    layerConfigs = [
                        {
                            id: "1",
                            name: "Überschwemmungsgebiete",
                            typ: "WMS",
                            datasets: [{
                                md_name: "Überschwemmungsgebiete (alkis)"

                            }]
                        },
                        {
                            id: "2",
                            name: "Krankenhäuser",
                            typ: "WMS"
                        },
                        {
                            id: "3",
                            name: "Überschwemmungsgebiete 3D",
                            typ: "TILESET3D"
                        }
                    ],
                    searchInputRegExp = SearchInterface1.createRegExp(searchInput);

                expect(SearchInterface1.searchInLayers(layerConfigs, searchInputRegExp)).to.deep.equals([
                    {
                        category: "modules.searchBar.type.topic",
                        events: {
                            onClick: {
                                activateLayerInTopicTree: {
                                    layerId: "1"
                                }
                            },
                            buttons: {
                                showInTree: {
                                    layerId: "1"
                                },
                                showLayerInfo: {
                                    layerId: "1"
                                }
                            }
                        },
                        icon: "bi-stack",
                        id: "1",
                        name: "Überschwemmungsgebiete",
                        toolTip: "Überschwemmungsgebiete (alkis)"
                    },
                    {
                        category: "modules.searchBar.type.topic",
                        events: {
                            onClick: {
                                activateLayerInTopicTree: {

                                    layerId: "3"
                                }
                            },
                            buttons: {
                                showInTree: {
                                    layerId: "3"
                                },
                                showLayerInfo: {
                                    layerId: "3"
                                }
                            }
                        },
                        icon: "bi-stack",
                        id: "3",
                        name: "Überschwemmungsgebiete 3D",
                        toolTip: ""
                    }
                ]);
            });
        });
        it("should show the path in the tooltip", () => {
            const SearchInterfaceToolTip = new SearchInterfaceTopicTree({toolTip: "path"}),
                searchInput = "Überschwemmungsgebiete",
                layerConfigs = [
                    {
                        id: "1",
                        name: "Überschwemmungsgebiete",
                        typ: "WMS",
                        datasets: [{
                            md_name: "Überschwemmungsgebiete (alkis)"
                        }]
                    },
                    {
                        id: "2",
                        name: "Krankenhäuser",
                        typ: "WMS"
                    },
                    {
                        id: "3",
                        name: "Überschwemmungsgebiete 3D",
                        typ: "TILESET3D"
                    }
                ],
                searchInputRegExp = SearchInterfaceToolTip.createRegExp(searchInput);

            sinon.stub(SearchInterfaceToolTip, "getPath").returns("Emissionen/Überschwemmungsgebiete");

            expect(SearchInterfaceToolTip.searchInLayers(layerConfigs, searchInputRegExp)).to.deep.equals([
                {
                    category: "modules.searchBar.type.topic",
                    events: {
                        onClick: {
                            activateLayerInTopicTree: {
                                layerId: "1"
                            }
                        },
                        buttons: {
                            showInTree: {
                                layerId: "1"
                            },
                            showLayerInfo: {
                                layerId: "1"
                            }
                        }
                    },
                    icon: "bi-stack",
                    id: "1",
                    name: "Überschwemmungsgebiete",
                    toolTip: "Emissionen/Überschwemmungsgebiete"
                }
            ]);
        });
    });

    describe("normalizeLayerResult", () => {
        it("should normalize layer result", () => {
            const layer = {
                    id: "1",
                    name: "Überschwemmungsgebiete",
                    typ: "WMS",
                    datasets: [{
                        md_name: "Überschwemmungsgebiete (alkis)"
                    }]
                },
                datasetsExist = true;

            expect(SearchInterface1.normalizeLayerResult(layer, datasetsExist)).to.deep.equals(
                {
                    category: "modules.searchBar.type.topic",
                    events: {
                        onClick: {
                            activateLayerInTopicTree: {
                                layerId: "1"
                            }
                        },
                        buttons: {
                            showInTree: {
                                layerId: "1"
                            },
                            showLayerInfo: {
                                layerId: "1"
                            }
                        }
                    },
                    icon: "bi-stack",
                    id: "1",
                    name: "Überschwemmungsgebiete",
                    toolTip: "Überschwemmungsgebiete (alkis)"
                }
            );
        });
    });

    describe("searchInFolders", () => {
        it("should search in folders and return found folders", () => {
            const searchInput = "Überschwemmungsgebiete",
                layerConfig = {
                    subjectlayer: {
                        elements: [
                            {
                                id: "100",
                                name: "Krankenhäuser",
                                typ: "WMS"
                            },
                            {
                                name: "folder first",
                                type: "folder",
                                id: "this ID is not awesome",
                                elements: [
                                    {
                                        name: "Überschwemmungsgebiete",
                                        type: "folder",
                                        id: "this ID is awesome",
                                        elements: [
                                            {
                                                id: "1",
                                                name: "Überschwemmungsgebiete",
                                                typ: "WMS",
                                                datasets: [{
                                                    md_name: "Überschwemmungsgebiete (alkis)"
                                                }]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    baselayer: {
                        elements: [
                            {
                                id: "500",
                                name: "Geobasisdaten",
                                typ: "WMS"
                            }
                        ]
                    }
                },
                searchInputRegExp = SearchInterface1.createRegExp(searchInput);

            expect(SearchInterface1.searchInFolders(layerConfig, searchInputRegExp)).to.deep.equals([
                {
                    category: "modules.searchBar.type.folder",
                    events: {
                        onClick: {
                        },
                        buttons: {}
                    },
                    icon: "bi-folder",
                    id: "this ID is awesome",
                    name: "Überschwemmungsgebiete",
                    toolTip: "Überschwemmungsgebiete"
                }
            ]);
        });
        it("should show the path in the folder tooltip", () => {
            const SearchInterfaceToolTip = new SearchInterfaceTopicTree({toolTip: "path"}),
                searchInput = "Überschwemmungsgebiete",
                layerConfigs = {
                    subjectlayer: {
                        elements: [
                            {
                                id: "100",
                                name: "Krankenhäuser",
                                typ: "WMS"
                            },
                            {
                                name: "folder first",
                                type: "folder",
                                id: "this ID is not awesome",
                                elements: [
                                    {
                                        name: "Überschwemmungsgebiete",
                                        type: "folder",
                                        id: "this ID is awesome",
                                        elements: [
                                            {
                                                id: "1",
                                                name: "Überschwemmungsgebiete",
                                                typ: "WMS",
                                                datasets: [{
                                                    md_name: "Überschwemmungsgebiete (alkis)"
                                                }]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                },
                searchInputRegExp = SearchInterfaceToolTip.createRegExp(searchInput);

            sinon.stub(SearchInterfaceToolTip, "getPath").returns("folder first/Überschwemmungsgebiete");

            expect(SearchInterfaceToolTip.searchInFolders(layerConfigs, searchInputRegExp)).to.deep.equals([
                {
                    category: "modules.searchBar.type.folder",
                    events: {
                        onClick: {
                        },
                        buttons: {}
                    },
                    icon: "bi-folder",
                    id: "this ID is awesome",
                    name: "Überschwemmungsgebiete",
                    toolTip: "folder first/Überschwemmungsgebiete"
                }
            ]);
        });
    });

    describe("searchInFolder", () => {
        it("should add recursive folder and subFolders to foundFolders", () => {
            const folder = {
                    name: "folder first",
                    type: "folder",
                    elements: [
                        {
                            name: "Überschwemmungsgebiete",
                            type: "folder",
                            elements: [
                                {
                                    id: "1",
                                    name: "Überschwemmungsgebiete",
                                    typ: "WMS",
                                    datasets: [{
                                        md_name: "Überschwemmungsgebiete (alkis)"
                                    }]
                                }
                            ]
                        }
                    ]
                },
                folders = [];

            SearchInterface1.searchInFolder(folder, folders);

            expect(folders).to.deep.equals([
                {
                    name: "Überschwemmungsgebiete",
                    type: "folder",
                    elements: [{
                        id: "1",
                        name: "Überschwemmungsgebiete",
                        typ: "WMS",
                        datasets: [{
                            md_name: "Überschwemmungsgebiete (alkis)"
                        }]
                    }]
                }
            ]);
        });
    });

    describe("normalizeFolderResult", () => {
        it("should normalize folder result", () => {
            const folder = {
                name: "Überschwemmungsgebiete",
                type: "folder",
                id: "best ID ever",
                elements: [{
                    id: "1",
                    name: "Überschwemmungsgebiete",
                    typ: "WMS",
                    datasets: [{
                        md_name: "Überschwemmungsgebiete (alkis)"
                    }]
                }]
            };

            expect(SearchInterface1.normalizeFolderResult(folder)).to.deep.equals(
                {
                    category: "modules.searchBar.type.folder",
                    events: {
                        onClick: {
                        },
                        buttons: {
                        }
                    },
                    icon: "bi-folder",
                    id: "best ID ever",
                    name: "Überschwemmungsgebiete",
                    toolTip: "Überschwemmungsgebiete"
                }
            );
        });
    });

    describe("createPossibleActions", () => {
        it("should create possible events from layer search result", () => {
            const searchResult = {
                id: "1",
                name: "Überschwemmungsgebiete",
                typ: "WMS",
                datasets: [{
                    md_name: "Überschwemmungsgebiete (alkis)"
                }]
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals(
                {
                    activateLayerInTopicTree: {
                        layerId: "1"
                    },
                    showInTree: {
                        layerId: "1"
                    },
                    showLayerInfo: {
                        layerId: "1"
                    }
                }
            );
        });

        it("should create possible events from folder search result", () => {
            const searchResult = {
                name: "Überschwemmungsgebiete",
                type: "folder",
                elements: [{
                    id: "1",
                    name: "Überschwemmungsgebiete",
                    typ: "WMS",
                    datasets: [{
                        md_name: "Überschwemmungsgebiete (alkis)"
                    }]
                }]
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals({});
        });
    });

    describe("searchInTreeWithEmptyFolder", () => {
        it("should run over empty folder and find following folder", () => {
            const searchInput = "Überschwemmungsgebiete",
                layerConfig = {
                    subjectlayer: {
                        elements: [
                            {
                                name: "empty Folder",
                                type: "folder"
                            },
                            {
                                name: "Überschwemmungsgebiete",
                                type: "folder",
                                id: "klara",
                                elements: [
                                    {
                                        id: "1",
                                        name: "Überschwemmungsgebiete",
                                        typ: "WMS",
                                        datasets: [{
                                            md_name: "Überschwemmungsgebiete (alkis)"
                                        }]
                                    }
                                ]
                            }
                        ]
                    },
                    baselayer: {
                        elements: [
                            {
                                id: "500",
                                name: "Geobasisdaten",
                                typ: "WMS"
                            }
                        ]
                    }
                },
                searchInputRegExp = SearchInterface1.createRegExp(searchInput);

            expect(SearchInterface1.searchInFolders(layerConfig, searchInputRegExp)).to.deep.equals([
                {
                    category: "modules.searchBar.type.folder",
                    events: {
                        onClick: {
                        },
                        buttons: {}
                    },
                    icon: "bi-folder",
                    id: "klara",
                    name: "Überschwemmungsgebiete",
                    toolTip: "Überschwemmungsgebiete"
                }
            ]);
        });
    });
    describe("getPath", () => {
        it("should return the path in the layertree of the given layer", () => {
            sinon.stub(SearchInterface1, "getNamesOfParentFolder").returns(["Überschwemmungsgebiete", "Emissionen"]);
            const layer = {
                id: "1",
                name: "Überschwemmungsgebiete",
                typ: "WMS",
                datasets: [{
                    md_name: "Überschwemmungsgebiete (alkis)"
                }]
            };

            expect(SearchInterface1.getPath(layer)).to.deep.equals("Emissionen/Überschwemmungsgebiete");
        });
    });
    describe("getNamesOfParentFolder", () => {
        it("should return the names of the parent folders", () => {
            const folders = [
                {
                    name: "folder first",
                    type: "folder",
                    id: "folder1",
                    elements: [
                        {
                            name: "folder second",
                            type: "folder",
                            id: "folder2",
                            parentId: "folder1",
                            elements: [
                                {
                                    id: "1",
                                    name: "Überschwemmungsgebiete",
                                    typ: "WMS",
                                    datasets: [{
                                        md_name: "Überschwemmungsgebiete (alkis)"
                                    }]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "folder second",
                    type: "folder",
                    id: "folder2",
                    parentId: "folder1",
                    elements: [
                        {
                            id: "1",
                            name: "Überschwemmungsgebiete",
                            typ: "WMS",
                            datasets: [{
                                md_name: "Überschwemmungsgebiete (alkis)"
                            }]
                        }
                    ]
                }
            ];

            store.getters = {
                folderById: (parentId) => {
                    return folders.find(folder => folder.id === parentId);
                }
            };

            expect(SearchInterface1.getNamesOfParentFolder("folder2", ["Überschwemmungsgebiete"])).to.deep.equals(["Überschwemmungsgebiete", "folder second", "folder first"]);
        });
    });
});
