import {createStore} from "vuex";
import {config, shallowMount, mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import LayerSelectionComponent from "@modules/layerSelection/components/LayerSelection.vue";
import LayerSelection from "@modules/layerSelection/store/indexLayerSelection";
import {treeSubjectsKey} from "@shared/js/utils/constants";

config.global.mocks.$t = key => key;

describe("src/modules/layerSelection/components/LayerSelection.vue", () => {
    let addLayerButtonSearchActive,
        categories,
        changeCategorySpy,
        lastFolderNames,
        layerBG_1,
        layerBG_2,
        layerBG_3,
        layer2D_1,
        layer2D_2,
        layer2D_3,
        layersBG,
        layersWithFolder,
        mapMode,
        searchInput,
        showAllResults,
        showInTree,
        store,
        subjectDataLayers,
        wrapper,
        treeType,
        externalSubjectdata,
        filterInLayerSelection = false;

    beforeEach(() => {
        lastFolderNames = [];
        searchInput = "Neuenfelder";
        mapMode = "2D";
        showAllResults = true;
        treeType = undefined;
        categories = [
            {
                "key": "kategorie_opendata",
                "name": "common:modules.layerTree.categoryOpendata",
                "active": true
            },
            {
                "key": "kategorie_inspire",
                "name": "common:modules.layerTree.categoryInspire"
            },
            {
                "key": "kategorie_organisation",
                "name": "common:modules.layerTree.categoryOrganisation"
            }
        ];
        changeCategorySpy = sinon.spy();
        layer2D_1 = {
            id: "1",
            name: "layer2D_1",
            typ: "WMS",
            type: "layer",
            visibility: true,
            showInLayerTree: true
        };
        layer2D_2 = {
            id: "2",
            name: "layer2D_2",
            typ: "WFS",
            type: "layer",
            visibility: false
        };
        layer2D_3 = {
            id: "2D_3",
            name: "layer2D_3",
            typ: "WFS",
            type: "layer",
            visibility: false
        };
        layerBG_1 = {
            id: "11",
            name: "layerBG_1",
            typ: "WMS",
            type: "layer",
            visibility: true
        };
        layerBG_2 = {
            id: "12",
            name: "layerBG_2",
            typ: "WFS",
            type: "layer",
            visibility: false
        };
        layerBG_3 = {
            id: "13",
            name: "layerBG_3",
            typ: "VectorTile",
            type: "layer",
            visibility: false
        };
        layersBG = [
            layerBG_1,
            layerBG_2
        ];
        layersWithFolder = [
            {
                name: "Titel Ebene 1",
                type: "folder",
                elements: [
                    {
                        name: "Titel Ebene 2",
                        type: "folder",
                        elements: [layer2D_1, layer2D_2,
                            {
                                name: "Titel Ebene 3",
                                type: "folder",
                                elements: [layer2D_3]
                            }]
                    }
                ]
            }];
        externalSubjectdata = {
            name: "external subject data",
            type: "folder",
            isExternal: true,
            elements: [
                {
                    name: "external subject data Ebene 2",
                    type: "folder",
                    elements: [layer2D_1, layer2D_2,
                        {
                            name: "external subject data Ebene 3",
                            type: "folder",
                            elements: [layer2D_3]
                        }]
                }
            ]
        };
        subjectDataLayers = layersWithFolder;
        addLayerButtonSearchActive = true;
        showInTree = false;
        LayerSelection.actions.navigateForward = sinon.spy();
        LayerSelection.actions.navigateBack = sinon.spy();
        LayerSelection.actions.changeVisibility = sinon.spy();
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        LayerSelection,
                        SearchBar: {
                            namespaced: true,
                            getters: {
                                searchInput: () => searchInput,
                                searchInterfaceInstances: () => [],
                                searchResults: () => [],
                                addLayerButtonSearchActive: () => addLayerButtonSearchActive,
                                showAllResults: () => showAllResults,
                                searchResultsActive: () => true,
                                currentSide: () => {
                                    return "mainMenu";
                                },
                                minCharacters: () => 3,
                                placeholder: () => "",
                                configPaths: () => "",
                                showSearchResultsInTree: () => showInTree,
                                type: () => "",
                                searchIsLoading: () => false
                            },
                            mutations: {
                                setSearchSuggestions: () => "",
                                setCurrentSide: () => ""
                            },
                            actions: {
                                checkLayerSelectionSearchConfig: () => "",
                                overwriteDefaultValues: () => "",
                                instantiateSearchInterfaces: () => ""
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        currentComponent: () => () => "root",
                        previousNavigationEntryText: () => () => "common:modules.layerSelection.addSubject"
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: () => mapMode
                    }
                }
            },
            getters: {
                layerConfig: () => ({"tree-subjects": {elements: layersWithFolder}}),
                invisibleBaselayerConfigs: sinon.stub(),
                activeOrFirstCategory: () => categories ? categories[0] : undefined,
                allCategories: () => categories,
                portalConfig: () => {
                    return {
                        tree: {
                            addLayerButton: {active: false},
                            categories: categories,
                            hideBackgroundsHeader: false,
                            backgroundsHeaderText: "custom backgrounds header text in test",
                            hideDatalayerHeader: false,
                            datalayerHeaderText: "custom datalayers text in test",
                            type: treeType
                        }
                    };
                },
                filterInLayerSelection: () => filterInLayerSelection
            },
            actions: {
                changeCategory: changeCategorySpy,
                initializeModule: () => ""
            }
        });
        LayerSelection.state.visible = true;

        store.commit("Modules/LayerSelection/setSubjectDataLayerConfs", subjectDataLayers);
        store.commit("Modules/LayerSelection/setBaselayerConfs", layersBG);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("do not render the LayerSelection if visible is false", () => {
        LayerSelection.state.visible = false;
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#layer-selection").exists()).to.be.false;
    });
    it("renders the LayerSelection without layers", () => {
        searchInput = "";
        store.commit("Modules/LayerSelection/setSubjectDataLayerConfs", []);
        store.commit("Modules/LayerSelection/setBaselayerConfs", []);
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#layer-selection").exists()).to.be.true;
        expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.be.equals(0);
        expect(wrapper.findAll("layer-check-box-stub").length).to.be.equals(0);
    });

    it("renders the LayerSelection with folder-buttons and checkboxes for background-layers", async () => {
        showAllResults = false;
        searchInput = "";
        store.commit("Modules/LayerSelection/setLastFolderNames", ["root"]);
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        store.commit("Modules/LayerSelection/setSubjectDataLayerConfs", subjectDataLayers);
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#layer-selection").exists()).to.be.true;
        expect(wrapper.findAll("layer-check-box-stub").length).to.be.equals(2);
        expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.be.equals(1);
    });

    it("checks for external subject data (from addWMS)", () => {
        showAllResults = false;
        LayerSelection.state.lastFolderNames = ["root"];
        subjectDataLayers.push(externalSubjectdata);

        store.commit("Modules/LayerSelection/setSubjectDataLayerConfs", subjectDataLayers);
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});
        expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.be.equals(2);
    });

    it("renders the LayerSelection without categories", () => {
        categories = undefined;
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#layer-selection").exists()).to.be.true;
        expect(wrapper.find("#select_category").exists()).to.be.false;
        expect(wrapper.findAll("option").length).to.be.equals(0);
    });

    it("renders the LayerSelection - check categories list", () => {
        showAllResults = false;
        LayerSelection.state.lastFolderNames = ["root"];
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#layer-selection").exists()).to.be.true;
        expect(wrapper.find("div.layer-selection-category-list").exists()).to.be.true;
        expect(wrapper.find("#layer-selection-category-btn").exists()).to.be.true;
        expect(wrapper.findAll("div.layer-selection-category-list div").length).to.be.equals(3);

        const listResult = wrapper.findAll("div.layer-selection-category-list div");

        expect(listResult.at(0).text()).to.be.equals("common:modules.layerTree.categoryOpendata");
        expect(listResult.at(1).text()).to.be.equals("common:modules.layerTree.categoryInspire");
        expect(listResult.at(2).text()).to.be.equals("common:modules.layerTree.categoryOrganisation");
    });


    it("checks for custom headlines for LayerSelection", () => {
        showAllResults = false;
        LayerSelection.state.lastFolderNames = ["root"];
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        const listResult = wrapper.findAll("h5");

        expect(listResult.length).to.be.equals(2);
        expect(listResult.at(0).text()).to.be.equals("custom backgrounds header text in test");
        expect(listResult.at(1).text()).to.be.equals("custom datalayers text in test");
    });

    it("checks for custom headlines with external subject data (from addWMS) for LayerSelection", () => {
        showAllResults = false;
        LayerSelection.state.lastFolderNames = ["root"];
        subjectDataLayers.push(externalSubjectdata);
        store.commit("Modules/LayerSelection/setSubjectDataLayerConfs", subjectDataLayers);
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        const listResult = wrapper.findAll("h5");

        expect(listResult.length).to.be.equals(3);
        expect(listResult.at(0).text()).to.be.equals("custom backgrounds header text in test");
        expect(listResult.at(1).text()).to.be.equals("custom datalayers text in test");
        expect(listResult.at(2).text()).to.be.equals("common:modules.layerSelection.externalSubjectLayer");
    });


    it("checks for default headlines for LayerSelection", () => {
        showAllResults = false;
        LayerSelection.state.lastFolderNames = ["root"];

        store.getters.portalConfig.tree.backgroundsHeaderText = null;
        store.getters.portalConfig.tree.datalayerHeaderText = "";

        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }
        });

        const listResult = wrapper.findAll("h5");

        expect(listResult.length).to.be.equals(2);
        expect(listResult.at(0).text()).to.be.equals("common:modules.layerSelection.backgrounds");
        expect(listResult.at(1).text()).to.be.equals("common:modules.layerSelection.datalayer");
    });


    it("checks for a disabled headline for backgrounds", () => {
        showAllResults = false;
        LayerSelection.state.lastFolderNames = ["root"];
        store.getters.portalConfig.tree.hideBackgroundsHeader = true;
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }
        });

        const listResult = wrapper.findAll("h5");

        expect(listResult.length).to.be.equals(1);
        // the other one of two h5 elem. exists:
        expect(listResult.at(0).text()).to.be.equals("custom datalayers text in test");
    });


    it("checks for a disabled headline for datalayer", () => {
        showAllResults = false;
        LayerSelection.state.lastFolderNames = ["root"];
        store.getters.portalConfig.tree.hideDatalayerHeader = true;
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }
        });

        const listResult = wrapper.findAll("h5");

        expect(listResult.length).to.be.equals(1);
        // the other one of two h5 elem. exists:
        expect(listResult.at(0).text()).to.be.equals("custom backgrounds header text in test");
    });


    it("renders the LayerSelection with all levels of folder-buttons without bg-layers ", async () => {
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#layer-selection").exists()).to.be.true;

        wrapper.vm.folderClicked(subjectDataLayers[0].elements);
        await wrapper.vm.$nextTick();

        expect(LayerSelection.actions.navigateForward.calledOnce).to.be.true;
    });

    it("navigateStepsBack shall call action navigateBack and provideSelectAllProps", async () => {
        const provideSelectAllPropsSpy = sinon.spy(LayerSelectionComponent.methods, "provideSelectAllProps");

        lastFolderNames = ["root", "Titel Ebene 1", "Titel Ebene 2"];
        store.commit("Modules/LayerSelection/setLastFolderNames", lastFolderNames);
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }
        });

        provideSelectAllPropsSpy.resetHistory();

        expect(wrapper.find("#layer-selection").exists()).to.be.true;

        wrapper.vm.navigateStepsBack(1);
        await wrapper.vm.$nextTick();

        await wrapper.vm.$nextTick();
        expect(LayerSelection.actions.navigateBack.calledOnce).to.be.true;
        expect(provideSelectAllPropsSpy.calledOnce).to.be.true;
    });


    it("renders the LayerSelection with breadcrumbs ", async () => {
        let breadCrumbsA = null,
            breadcrumbsNoLink = null;
        const navigateStepsBackSpy = sinon.spy(LayerSelectionComponent.methods, "navigateStepsBack");

        showAllResults = false;
        lastFolderNames = ["root", "Titel Ebene 1", "Titel Ebene 2"];
        store.commit("Modules/LayerSelection/setLastFolderNames", lastFolderNames);
        wrapper = shallowMount(LayerSelectionComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#layer-selection").exists()).to.be.true;

        breadCrumbsA = wrapper.findAll("a");
        expect(breadCrumbsA.length).to.be.equals(2);
        expect(breadCrumbsA.at(0).text()).to.be.equals("common:modules.layerSelection.datalayer");
        expect(breadCrumbsA.at(1).text()).to.be.equals("Titel Ebene 1");
        breadcrumbsNoLink = wrapper.findAll(".no-link");
        expect(breadcrumbsNoLink.length).to.be.equals(1);
        expect(breadcrumbsNoLink.at(0).text()).to.be.equals("Titel Ebene 2");
        breadCrumbsA.at(0).trigger("click");
        await wrapper.vm.$nextTick();
        expect(navigateStepsBackSpy.calledOnce).to.be.true;
        expect(navigateStepsBackSpy.firstCall.args[0]).to.equals(0);
    });

    describe("render SearchBar", () => {
        it("render the SearchBar, if showInTree = true and addLayerButtonSearchActive = false", () => {
            showInTree = true;
            addLayerButtonSearchActive = false;

            wrapper = mount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.find("#layer-selection").exists()).to.be.true;
            expect(wrapper.find("#search-bar").exists()).to.be.true;
            expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.be.equals(0);
            expect(wrapper.findAll("layer-check-box-stub").length).to.be.equals(0);
        });

        it("render the SearchBar, if showInTree = false and addLayerButtonSearchActive = true", () => {
            showInTree = false;
            addLayerButtonSearchActive = true;

            wrapper = mount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.find("#layer-selection").exists()).to.be.true;
            expect(wrapper.find("#search-bar").exists()).to.be.true;
            expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.be.equals(0);
            expect(wrapper.findAll("layer-check-box-stub").length).to.be.equals(0);
        });

        it("render the SearchBar, if showInTree = true and addLayerButtonSearchActive = true", () => {
            showInTree = true;
            addLayerButtonSearchActive = true;

            wrapper = mount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.find("#layer-selection").exists()).to.be.true;
            expect(wrapper.find("#search-bar").exists()).to.be.true;
            expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.be.equals(0);
            expect(wrapper.findAll("layer-check-box-stub").length).to.be.equals(0);
        });

        it("don't render the SearchBar, if showInTree = false and addLayerButtonSearchActive = false", () => {
            showInTree = false;
            addLayerButtonSearchActive = false;

            wrapper = mount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.find("#layer-selection").exists()).to.be.true;
            expect(wrapper.find("#search-bar").exists()).to.be.false;
            expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.be.equals(0);
            expect(wrapper.findAll("layer-check-box-stub").length).to.be.equals(0);
        });
    });

    describe("watchers", () => {
        it("layerConfig watcher should commit 'setSubjectDataLayerConfs' and call 'provideSelectAllProps' on change", async () => {
            const commitSpy = sinon.spy(store, "commit"),
                provideSelectAllPropsSpy = sinon.spy(LayerSelectionComponent.methods, "provideSelectAllProps"),
                newConfig = {
                    [treeSubjectsKey]: {
                        elements: [
                            {id: "folder-1", name: "Test Folder", type: "folder", elements: []}
                        ]
                    }
                },
                expectedPayload = [
                    {
                        id: "folder-1",
                        name: "Test Folder",
                        type: "folder",
                        elements: []
                    }
                ];

            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }
            });

            await wrapper.setData({rootFolderCount: 0});
            store.commit("Modules/LayerSelection/setLastFolderNames", ["root"]);
            commitSpy.resetHistory();
            provideSelectAllPropsSpy.resetHistory();
            wrapper.vm.$options.watch.layerConfig.handler.call(wrapper.vm, newConfig);
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.lastFolderNames).to.deep.equals(["root"]);
            expect(commitSpy.calledOnce).to.be.true;
            expect(commitSpy.calledWith("Modules/LayerSelection/setSubjectDataLayerConfs", expectedPayload)).to.be.true;
            expect(provideSelectAllPropsSpy.calledOnce).to.be.true;
        });
        it("should do nothing if the folder count does not change", async () => {
            const commitSpy = sinon.spy(store, "commit"),
                provideSelectAllPropsSpy = sinon.spy(LayerSelectionComponent.methods, "provideSelectAllProps"),
                newConfig = {
                    [treeSubjectsKey]: {
                        elements: [
                            {id: "folder-1", name: "Test Folder", type: "folder", elements: []},
                            {id: "layer-1", name: "Test Layer", type: "layer"}
                        ]
                    }
                };

            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }
            });

            await wrapper.setData({rootFolderCount: 1});
            commitSpy.resetHistory();
            provideSelectAllPropsSpy.resetHistory();
            wrapper.vm.$options.watch.layerConfig.handler.call(wrapper.vm, newConfig);
            await wrapper.vm.$nextTick();

            expect(commitSpy.calledOnce).to.be.false;
            expect(provideSelectAllPropsSpy.calledOnce).to.be.false;
        });
    });

    describe("methods", () => {
        it("test method sort without tree type", () => {
            let sorted = [];
            const toSort = subjectDataLayers[0].elements[0].elements;

            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            expect(toSort[0].type).not.to.be.equals("folder");
            sorted = wrapper.vm.sort(toSort);

            expect(sorted.length).to.be.equals(toSort.length);
            expect(sorted[0].type).to.be.equals("folder");
            expect(sorted[1].type).to.be.equals("layer");
            expect(sorted[1].name).to.be.equals("layer2D_1");
            expect(sorted[2].type).to.be.equals("layer");
            expect(sorted[2].name).to.be.equals("layer2D_2");
        });
        it("test method sort with tree type auto", () => {
            let sorted = [];
            const toSort = subjectDataLayers[0].elements[0].elements;

            treeType = "auto";

            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            expect(toSort[0].type).not.to.be.equals("folder");
            sorted = wrapper.vm.sort(toSort);

            expect(sorted.length).to.be.equals(toSort.length);
            expect(sorted[0].type).to.be.equals("folder");
            expect(sorted[1].type).to.be.equals("layer");
            expect(sorted[1].name).to.be.equals("layer2D_1");
            expect(sorted[2].type).to.be.equals("layer");
            expect(sorted[2].name).to.be.equals("layer2D_2");
        });

        it("test method categorySelected", () => {
            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.categorySelected(categories[1].key);

            expect(changeCategorySpy.calledOnce).to.be.true;
            expect(changeCategorySpy.firstCall.args[1]).to.deep.equals(categories[1]);
        });

        it("test method filterBaseLayer 3D", () => {
            mapMode = "3D";
            layersBG.push(layerBG_3);
            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            const filtered = wrapper.vm.filterBaseLayer();

            expect(filtered.length).to.be.equals(2);
            expect(filtered[0]).to.deep.equals(layerBG_1);
            expect(filtered[1]).to.deep.equals(layerBG_2);
        });

        it("test method filterBaseLayer 2D", () => {
            mapMode = "2D";
            layersBG.push(layerBG_3);
            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            const filtered = wrapper.vm.filterBaseLayer();

            expect(filtered.length).to.be.equals(3);
            expect(filtered[0]).to.deep.equals(layerBG_1);
            expect(filtered[1]).to.deep.equals(layerBG_2);
            expect(filtered[2]).to.deep.equals(layerBG_3);
        });

        it("test method filterSubjectDataLayer with external subject data", () => {
            mapMode = "2D";
            subjectDataLayers.push(externalSubjectdata);
            store.commit("Modules/LayerSelection/setSubjectDataLayerConfs", subjectDataLayers);
            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            const filtered = wrapper.vm.filterSubjectDataLayer();

            expect(filtered.length).to.be.equals(1);
            expect(filtered[0]).to.deep.equals(layersWithFolder[0]);
        });

        it("test method filterExternalSubjectDataLayer with external subject data", () => {
            mapMode = "2D";
            subjectDataLayers.push(externalSubjectdata);
            store.commit("Modules/LayerSelection/setSubjectDataLayerConfs", subjectDataLayers);
            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }});

            const filtered = wrapper.vm.filterExternalSubjectDataLayer();

            expect(filtered.length).to.be.equals(1);
            expect(filtered[0]).to.deep.equals(externalSubjectdata);
        });

        it("toggleShowAllCheckbox: should deactivate 'Show All' checkbox if parent folder has" +
            " 'deactivateShowAllCheckbox' set to true", async () => {
            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }
            });

            const mockLayer = {
                id: "100",
                name: "Test Layer",
                typ: "WMS",
                type: "layer",
                parentId: "folder1"
            };

            store.getters.folderById = sinon.stub().returns({deactivateShowAllCheckbox: true});

            wrapper.vm.toggleShowAllCheckbox(mockLayer);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.deactivateShowAllCheckbox).to.be.true;
        });

        it("toggleShowAllCheckbox: should not deactivate 'Show All' checkbox if parent folder does not have" +
            " 'deactivateShowAllCheckbox' set", async () => {
            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }
            });

            const mockLayer = {
                id: "101",
                name: "Test Layer 2",
                typ: "WMS",
                type: "layer",
                parentId: "folder2"
            };

            store.getters.folderById = sinon.stub().returns({deactivateShowAllCheckbox: false});

            wrapper.vm.toggleShowAllCheckbox(mockLayer);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.deactivateShowAllCheckbox).to.be.false;
        });
    });
    describe("filter functionality", () => {
        it("filters layers based on search input", async () => {
            searchInput = "2D";

            wrapper = await shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find("#layer-selection").exists()).to.be.true;
            expect(wrapper.vm.filteredLayerConfs.length).to.equal(1);
            expect(JSON.stringify(wrapper.vm.filteredLayerConfs).toLowerCase()).to.include("layer2d_1");
            expect(JSON.stringify(wrapper.vm.filteredLayerConfs).toLowerCase()).to.include("layer2d_2");
            expect(JSON.stringify(wrapper.vm.filteredLayerConfs).toLowerCase()).to.include("layer2d_3");
        });

        it("shows no layers if search input does not match any layer", async () => {
            searchInput = "nonExistingLayer";
            showAllResults = true;
            filterInLayerSelection = true;

            wrapper = shallowMount(LayerSelectionComponent, {
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find("#layer-selection").exists()).to.be.true;
            expect(wrapper.vm.filteredLayerConfs.length).to.equal(0);
            expect(wrapper.findAll("layer-selection-tree-node-stub").length).to.equal(0);
        });
    });
});
