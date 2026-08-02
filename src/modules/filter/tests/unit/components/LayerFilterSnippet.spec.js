import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import LayerFilterSnippet from "@modules/filter/components/LayerFilterSnippet.vue";
import SnippetDownload from "@modules/filter/components/SnippetDownload.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import SnippetCheckboxFilterInMapExtent from "@modules/filter/components/SnippetCheckboxFilterInMapExtent.vue";
import {expect} from "chai";
import MapHandler from "@modules/filter/utils/mapHandler.js";
import openlayerFunctions from "@modules/filter/utils/openlayerFunctions.js";
import sinon from "sinon";


describe("src/modules/filter/components/LayerFilterSnippet.vue", () => {
    let wrapper = null,
        store,
        mapHandler = null;

    beforeEach(() => {
        mapHandler = new MapHandler();
        mapHandler.getLayerModelByFilterId = sinon.stub().returns({
            get: (val) => {
                if (val === "isSelected") {
                    return false;
                }
                return "TEST";
            }
        });
        mapHandler.activateLayer = sinon.stub();

        store = createStore({
            namespaced: true,
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        scale: sinon.stub()
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        Filter: {
                            namespaced: true,
                            getters: {
                                clearAll: () => true,
                                deletedRuleFilterId: sinon.stub(),
                                deletedRuleSnippetId: sinon.stub(),
                                triggerAllTagsDeleted: sinon.stub(),
                                totalResults: sinon.stub(),
                                rulesOfFilters: () => [[{value: "rule2"}]],
                                onValueDeselect: sinon.stub(),
                                searchInMapExtentState: () => [],
                                filterOnMoveState: () => []
                            }
                        }
                    }
                }
            }
        });
        wrapper = shallowMount(LayerFilterSnippet, {
            global: {
                plugins: [store],
                components: {InputText}
            },
            propsData: {
                layerConfig: {
                    service: {
                        type: "something external"
                    }
                },
                mapHandler
            }
        });
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    describe("Lifecycle Hooks", () => {
        it("should call handleActiveStrategy if strategy is active", async () => {
            const spyHandleActiveStrategy = sinon.spy(wrapper.vm, "handleActiveStrategy");

            await wrapper.setProps({layerConfig: {strategy: "active"}});
            wrapper.vm.changeRule({
                snippetId: 0,
                startup: false,
                fixed: false,
                attrName: "test",
                operator: "EQ"
            });
            await wrapper.vm.$nextTick();
            expect(spyHandleActiveStrategy.calledOnce).to.be.true;
        });
        it("should get the computed value isClearAll true", async () => {
            expect(wrapper.vm.isClearAll).to.be.true;
        });
        it("should get the computed value isClearAll false", async () => {
            wrapper = shallowMount(LayerFilterSnippet, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    layerConfig: {
                        service: {
                            type: "something external"
                        },
                        clearAll: false
                    },
                    mapHandler
                }
            });
            expect(wrapper.vm.isClearAll).to.be.false;
        });
    });


    describe("Component DOM", () => {
        it("should not have a reset button", () => {
            expect(wrapper.findAllComponents({name: "FlatButton"}).length).to.be.equal(1);
        });
        it("should have a reset button", async () => {
            wrapper = shallowMount(LayerFilterSnippet, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    layerConfig: {
                        service: {
                            type: "something external"
                        },
                        strategy: "active",
                        filterId: 0
                    },
                    mapHandler,
                    filterRules: [{value: "rule2"}]
                }
            });

            await wrapper.setData({
                layerConfig: {
                    filterId: 0
                }
            });
            wrapper.setData({initialValue: [{snippetId: 0, initialPrechecked: "rule1"}]});
            await wrapper.vm.$nextTick();
            wrapper.setData({initialRules: [{value: "rule1", startup: true}]});
            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents({name: "FlatButton"}).length).to.be.equal(2);
        });
        it("should have a loading spinner", () => {
            wrapper = shallowMount(LayerFilterSnippet, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    layerConfig: {
                        service: {
                            type: "something external"
                        },
                        snippets: [
                            {"attrName": "snippet1"},
                            {"attrName": "snippet2"}
                        ]
                    },
                    mapHandler,
                    layerSelectorVisible: false
                }
            });

            expect(wrapper.findAllComponents({name: "SpinnerItem"}).length).to.be.equal(1);
        });
        it("should have not a loading spinner", async () => {
            wrapper = shallowMount(LayerFilterSnippet, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    layerConfig: {
                        service: {
                            type: "something external"
                        },
                        snippets: [
                            {"attrName": "snippet1"},
                            {"attrName": "snippet2"}
                        ]
                    },
                    mapHandler,
                    layerSelectorVisible: false
                }
            });

            wrapper.setData({snippets: [
                {"attrName": "snippet1"},
                {"attrName": "snippet2"}
            ]});
            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents({name: "SpinnerItem"}).length).to.be.equal(0);
        });
        it("should have not a loading spinner if there are children snippets", async () => {
            wrapper = shallowMount(LayerFilterSnippet, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    layerConfig: {
                        service: {
                            type: "something external"
                        },
                        snippets: [
                            {"attrName": "snippet1"},
                            {
                                "attrName": "snippet2",
                                "children": [
                                    {"attrName": "snippet3"},
                                    {"attrName": "snippet4"}
                                ]
                            }
                        ]
                    },
                    mapHandler,
                    layerSelectorVisible: false
                }
            });

            wrapper.setData({snippets: [
                {"attrName": "snippet1"},
                {"attrName": "snippet2"},
                {"attrName": "snippet3"},
                {"attrName": "snippet4"}
            ]});
            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents({name: "SpinnerItem"}).length).to.be.equal(0);
        });

        describe.skip("should render amount of filtered items", async () => {

            it("should render amount of filtered items", async () => {
                await wrapper.setData({
                    amountOfFilteredItems: 3,
                    showSpinner: false
                });
                await wrapper.vm.$nextTick();
                expect(wrapper.find(".filter-result").exists()).to.be.true;
                expect(wrapper.find(".filter-result").text()).contain("common:modules.filter.filterResult.unit");
            });

            it("should not render amount of filtered items if showHits is false", async () => {
                await wrapper.setData({
                    amountOfFilteredItems: 3,
                    layerConfig: {
                        showHits: false
                    }
                });
                await wrapper.vm.$nextTick();
                expect(wrapper.find(".filter-result").exists()).to.be.false;
            });
            it("should render a spinner", async () => {
                await wrapper.setData({
                    isLoading: true,
                    layerConfig: {
                        filterId: 1
                    }
                });
                expect(wrapper.find(".spinner-border").exists()).to.be.true;
            });
            it("should call 'activateLayer' if filter layer type is VectorTile and the layer is not yet loaded", () => {
                mapHandler.getLayerModelByFilterId = sinon.stub().returns({
                    get: (val) => {
                        if (val === "isSelected") {
                            return false;
                        }
                        return "VectorTile";
                    }
                });
                mapHandler.activateLayer = sinon.stub();
                wrapper = shallowMount(LayerFilterSnippet, {
                    propsData: {
                        layerConfig: {
                            service: {
                                type: "something external"
                            },
                            searchInMapExtent: true
                        },
                        mapHandler
                    }
                });
                expect(mapHandler.activateLayer.calledOnce).to.be.true;
            });
            it("should render amount of filtered items if showHits is true", async () => {
                await wrapper.setData({
                    amountOfFilteredItems: 3,
                    layerConfig: {
                        showHits: true
                    }
                });
                await wrapper.vm.$nextTick();
                expect(wrapper.find(".filter-result").exists()).to.be.true;
                expect(wrapper.find(".filter-result").text()).contain("common:modules.filter.filterResult.unit", "3");
            });
            it("should render amount of filtered items if showHits is undefined", async () => {
                await wrapper.setData({
                    amountOfFilteredItems: 3,
                    layerConfig: {
                        showHits: undefined
                    }
                });
                await wrapper.vm.$nextTick();
                expect(wrapper.find(".filter-result").exists()).to.be.true;
                expect(wrapper.find(".filter-result").text()).contain("common:modules.filter.filterResult.unit", "3");
            });
            describe("setSnippetValueByState", () => {
                const filterRules = [
                        {
                            snippetId: 0,
                            startup: false,
                            fixed: false,
                            attrName: "test",
                            operator: "EQ",
                            value: ["Altona"]
                        }
                    ],
                    snippets = [
                        {
                            operator: "EQ",
                            snippetId: 0,
                            title: "Bezirk",
                            type: "dropdown",
                            value: ["Altona"]
                        }],
                    precheckedSnippets = [{
                        operator: "EQ",
                        snippetId: 0,
                        title: "Bezirk",
                        type: "dropdown",
                        value: ["Altona"],
                        prechecked: ["Altona"]
                    }];

                it("should not set prechecked value if param is not an array", async () => {
                    await wrapper.setData({
                        snippets
                    });
                    wrapper.vm.setSnippetValueByState(undefined);
                    wrapper.vm.setSnippetValueByState(null);
                    wrapper.vm.setSnippetValueByState(123456);
                    wrapper.vm.setSnippetValueByState("string");
                    wrapper.vm.setSnippetValueByState(true);
                    wrapper.vm.setSnippetValueByState({});
                    expect(wrapper.vm.snippets).to.deep.equal(snippets);
                });
                it("should not set prechecked value if given structure is not a rule", async () => {
                    await wrapper.setData({
                        snippets
                    });
                    const isRuleStub = sinon.stub(wrapper.vm, "isRule").returns(false),
                        noRule = [
                            {
                                something: "something"
                            }
                        ];

                    wrapper.vm.setSnippetValueByState(noRule);
                    expect(wrapper.vm.snippets).to.deep.equal(snippets);
                    expect(isRuleStub.called).to.be.true;
                });
                it("should set prechecked value if correct filter rule is given", async () => {
                    await wrapper.setData({
                        snippets
                    });
                    wrapper.vm.setSnippetValueByState(filterRules);
                    expect(wrapper.vm.snippets).to.deep.equal(precheckedSnippets);
                });
            });
        });
    });

    describe("Methods", () => {
        describe("applyPassiveValuesToTags", () => {
            it("should return early if rules is not an array", () => {
                expect(wrapper.vm.applyPassiveValuesToTags(undefined)).to.be.undefined;
                expect(wrapper.vm.applyPassiveValuesToTags(null)).to.be.undefined;
                expect(wrapper.vm.applyPassiveValuesToTags(123)).to.be.undefined;
                expect(wrapper.vm.applyPassiveValuesToTags("string")).to.be.undefined;
                expect(wrapper.vm.applyPassiveValuesToTags({})).to.be.undefined;
            });

            it("should skip rule if it is not a valid rule", () => {
                const isRuleStub = sinon.stub(wrapper.vm, "isRule").returns(false),
                    rules = [{foo: "bar"}];

                wrapper.vm.applyPassiveValuesToTags(rules);
                expect(isRuleStub.calledOnce).to.be.true;
                expect(wrapper.emitted().updateRules).to.be.undefined;
            });

            it("should not emit updateRules if appliedPassiveValues has same length as value", () => {
                const rule = {
                    snippetId: 1,
                    value: ["a", "b"],
                    appliedPassiveValues: ["a", "b"]
                };

                sinon.stub(wrapper.vm, "isRule").returns(true);
                wrapper.vm.applyPassiveValuesToTags([rule]);
                expect(wrapper.emitted().updateRules).to.be.undefined;
            });

            it("should set appliedPassiveValues and emit updateRules if lengths differ", async () => {
                const rule = {
                    snippetId: 1,
                    value: ["a", "b"],
                    appliedPassiveValues: ["a"]
                };

                sinon.stub(wrapper.vm, "isRule").returns(true);
                await wrapper.setProps({
                    layerConfig: {
                        filterId: 42
                    }
                });

                wrapper.vm.applyPassiveValuesToTags([rule]);

                expect(rule.appliedPassiveValues).to.deep.equal(["a", "b"]);
                expect(wrapper.emitted().updateRules).to.be.an("array").with.lengthOf(1);
                expect(wrapper.emitted().updateRules[0][0]).to.deep.equal({
                    filterId: 42,
                    snippetId: 1,
                    rule
                });
            });

            it("should skip rule if appliedPassiveValues is not an array", () => {
                const rule = {
                    snippetId: 2,
                    value: ["a"],
                    appliedPassiveValues: null
                };

                sinon.stub(wrapper.vm, "isRule").returns(true);
                wrapper.vm.applyPassiveValuesToTags([rule]);

                expect(rule.appliedPassiveValues).to.be.null;
                expect(wrapper.emitted().updateRules).to.be.undefined;
            });
        });

        describe("hasThisSnippetTheExpectedType", () => {
            it("should return false if the given snippet has not the expected type", () => {
                expect(wrapper.vm.hasThisSnippetTheExpectedType(undefined)).to.be.false;
                expect(wrapper.vm.hasThisSnippetTheExpectedType(null)).to.be.false;
                expect(wrapper.vm.hasThisSnippetTheExpectedType(1234)).to.be.false;
                expect(wrapper.vm.hasThisSnippetTheExpectedType("string")).to.be.false;
                expect(wrapper.vm.hasThisSnippetTheExpectedType(true)).to.be.false;
                expect(wrapper.vm.hasThisSnippetTheExpectedType(false)).to.be.false;
                expect(wrapper.vm.hasThisSnippetTheExpectedType([])).to.be.false;
                expect(wrapper.vm.hasThisSnippetTheExpectedType({})).to.be.false;

                expect(wrapper.vm.hasThisSnippetTheExpectedType({type: "anything"}, "something")).to.be.false;
            });
            it("should return true if the given snippet has the expected type", () => {
                expect(wrapper.vm.hasThisSnippetTheExpectedType({type: "something"}, "something")).to.be.true;
            });
        });

        describe("setSearchInMapExtent", () => {
            it("should set the internal searchInMapExtent variable to the given value", () => {
                expect(wrapper.vm.searchInMapExtentState.length).to.equal(0);
                wrapper.vm.setSearchInMapExtent(true);
                expect(wrapper.vm.getSearchInMapExtent()).to.be.true;
            });
        });

        describe("renderCheckboxSearchInMapExtent", () => {
            it("Should render the checkbox component correctly", async () => {
                wrapper = shallowMount(LayerFilterSnippet, {
                    global: {
                        plugins: [store]
                    },
                    propsData: {
                        layerConfig: {
                            service: {
                                type: "something external"
                            },
                            filterId: 1,
                            searchInMapExtent: true
                        },
                        mapHandler
                    }
                });
                wrapper.setData({outOfZoom: false});
                await wrapper.vm.$nextTick();
                await wrapper.vm.$nextTick();
                expect(wrapper.findComponent(SnippetCheckboxFilterInMapExtent).exists()).to.be.true;
            });
        });

        describe("changeRule", () => {
            it("should emit the updateRules event", async () => {
                wrapper.vm.changeRule({
                    snippetId: 0,
                    startup: false,
                    fixed: false,
                    attrName: "test",
                    operator: "EQ"
                });
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted().updateRules).to.be.an("array").with.lengthOf(1);
            });
            it("should set appliedPassiveValues from oldRule if strategy is not active and new rule has fewer values", async () => {
                sinon.stub(wrapper.vm, "isStrategyActive").returns(false);
                sinon.stub(wrapper.vm, "isRule").returns(true);
                store = createStore({
                    namespaced: true,
                    modules: {
                        Maps: {
                            namespaced: true,
                            getters: {
                                scale: sinon.stub()
                            }
                        },
                        Modules: {
                            namespaced: true,
                            modules: {
                                Filter: {
                                    namespaced: true,
                                    getters: {
                                        clearAll: () => true,
                                        deletedRuleFilterId: sinon.stub(),
                                        deletedRuleSnippetId: sinon.stub(),
                                        triggerAllTagsDeleted: sinon.stub(),
                                        totalResults: sinon.stub(),
                                        rulesOfFilters: () => [
                                            [
                                                {
                                                    snippetId: 0,
                                                    value: ["a", "b"],
                                                    appliedPassiveValues: ["x", "y"]
                                                }
                                            ]
                                        ],
                                        onValueDeselect: sinon.stub(),
                                        searchInMapExtentState: () => [],
                                        filterOnMoveState: () => []
                                    }
                                }
                            }
                        }
                    }
                });
                wrapper = shallowMount(LayerFilterSnippet, {
                    global: {
                        plugins: [store],
                        components: {InputText}
                    },
                    propsData: {
                        layerConfig: {
                            service: {
                                type: "something external"
                            }
                        },
                        mapHandler
                    }
                });
                await wrapper.setProps({
                    layerConfig: {filterId: 0}
                });
                const rule = {snippetId: 0, value: ["a"]};

                wrapper.vm.changeRule(rule);

                expect(rule.appliedPassiveValues).to.deep.equal(["a", "b"]);
            });

            it("should call deleteRulesOfChildren and deleteRulesOfParallelSnippets", async () => {
                sinon.stub(wrapper.vm, "isStrategyActive").returns(true);
                sinon.stub(wrapper.vm, "isRule").returns(true);
                const spyChildren = sinon.stub(wrapper.vm, "deleteRulesOfChildren"),
                    spyParallel = sinon.stub(wrapper.vm, "deleteRulesOfParallelSnippets");

                sinon.stub(wrapper.vm, "getSnippetById").returns({snippetId: 0});
                wrapper.vm.changeRule({snippetId: 0, value: []});

                expect(spyChildren.calledOnce).to.be.true;
                expect(spyParallel.calledOnce).to.be.true;
            });

            it("should not cascade rule cleanup while applying deserialized state", async () => {
                sinon.stub(wrapper.vm, "isRule").returns(true);
                const spyChildren = sinon.stub(wrapper.vm, "deleteRulesOfChildren"),
                    spyParallel = sinon.stub(wrapper.vm, "deleteRulesOfParallelSnippets"),
                    spyHandle = sinon.stub(wrapper.vm, "handleActiveStrategy");

                await wrapper.setData({isApplyingDeserializedState: true});

                wrapper.vm.changeRule({snippetId: 0, value: [], startup: false}, true);
                await wrapper.vm.$nextTick();

                expect(spyChildren.called).to.be.false;
                expect(spyParallel.called).to.be.false;
                expect(spyHandle.called).to.be.false;
                expect(wrapper.emitted().updateRules).to.be.an("array").that.is.not.empty;
            });

            it("should not cascade rule cleanup for startup changes", async () => {
                sinon.stub(wrapper.vm, "isRule").returns(true);
                const spyChildren = sinon.stub(wrapper.vm, "deleteRulesOfChildren"),
                    spyParallel = sinon.stub(wrapper.vm, "deleteRulesOfParallelSnippets"),
                    spyHandle = sinon.stub(wrapper.vm, "handleActiveStrategy");

                wrapper.vm.changeRule({snippetId: 0, value: [], startup: true}, true);
                await wrapper.vm.$nextTick();

                expect(spyChildren.called).to.be.false;
                expect(spyParallel.called).to.be.false;
                expect(spyHandle.called).to.be.false;
                expect(wrapper.emitted().updateRules).to.be.an("array").that.is.not.empty;
            });

            it("should call handleActiveStrategy if ignoreStrategyCheck is true", async () => {
                sinon.stub(wrapper.vm, "isStrategyActive").returns(false);
                sinon.stub(wrapper.vm, "isRule").returns(true);
                const spyHandle = sinon.stub(wrapper.vm, "handleActiveStrategy");

                wrapper.vm.changeRule({snippetId: 0, value: []}, true);
                await wrapper.vm.$nextTick();

                expect(spyHandle.calledOnce).to.be.true;
            });

            it("should call handleActiveStrategy if strategy is active", async () => {
                sinon.stub(wrapper.vm, "isStrategyActive").returns(true);
                sinon.stub(wrapper.vm, "isRule").returns(true);
                sinon.stub(wrapper.vm, "isParentSnippet").returns(false);
                const spyHandle = sinon.stub(wrapper.vm, "handleActiveStrategy");

                wrapper.vm.changeRule({snippetId: 0, value: [], startup: false});
                await wrapper.vm.$nextTick();

                expect(spyHandle.calledOnce).to.be.true;
            });

            it("should call handleActiveStrategy if parent snippet returns true", async () => {
                sinon.stub(wrapper.vm, "isStrategyActive").returns(false);
                sinon.stub(wrapper.vm, "isRule").returns(true);
                sinon.stub(wrapper.vm, "isParentSnippet").returns(true);
                const spyHandle = sinon.stub(wrapper.vm, "handleActiveStrategy");

                wrapper.vm.changeRule({snippetId: 0, value: [], startup: false});
                await wrapper.vm.$nextTick();

                expect(spyHandle.calledOnce).to.be.true;
            });
        });

        describe("deleteRule", () => {
            it("should emit the update function", async () => {
                wrapper.vm.deleteRule(0);
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted().updateRules).to.be.an("array").with.lengthOf(1);
            });
            it("should set the prechecked to initialPrechecked value", async () => {
                const localWrapper = shallowMount(LayerFilterSnippet, {
                    global: {
                        plugins: [store]
                    },
                    propsData: {
                        layerConfig: {
                            service: {
                                type: "something external"
                            },
                            snippets: [{
                                operator: "EQ",
                                snippetId: 0,
                                title: "Bezirk",
                                type: "dropdown",
                                value: ["Altona"],
                                prechecked: ["Altona"]
                            }]
                        },
                        mapHandler
                    }
                });

                await localWrapper.vm.$nextTick();
                localWrapper.vm.snippets[0].initialPrechecked = localWrapper.vm.snippets[0].prechecked;
                localWrapper.vm.snippets[0].prechecked = undefined;
                localWrapper.vm.deleteRule(0);
                await localWrapper.vm.$nextTick();
                expect(localWrapper.vm.snippets[0].prechecked).to.deep.equal(["Altona"]);
                localWrapper.unmount();
            });
        });

        describe("deleteRulesOfParallelSnippets", () => {
            it("should not emit the update function", async () => {
                wrapper.vm.deleteRulesOfParallelSnippets(0);
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted().updateRules).to.be.undefined;

                wrapper.vm.deleteRulesOfParallelSnippets({});
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted().updateRules).to.be.undefined;

                wrapper.vm.deleteRulesOfParallelSnippets({parent: ""});
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted().updateRules).to.be.undefined;

                wrapper.vm.deleteRulesOfParallelSnippets({parent: {children: ""}});
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted().updateRules).to.be.undefined;
            });
            it("should emit the update function", async () => {
                const snippet = {
                    snippetId: 0,
                    adjustOnlyFromParent: true,
                    parent: {
                        children: [
                            {snippetId: 0},
                            {snippetId: 1}
                        ]
                    }
                };

                wrapper.vm.deleteRulesOfParallelSnippets(snippet);
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted().updateRules).to.be.an("array").with.lengthOf(1);
            });
        });

        describe("isOnlyAdjustFromParent", () => {
            it("should return false", async () => {
                wrapper.vm.snippets = [null];
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isOnlyAdjustFromParent(0)).to.be.false;

                wrapper.vm.snippets = [""];
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isOnlyAdjustFromParent(0)).to.be.false;

                wrapper.vm.snippets = [0];
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isOnlyAdjustFromParent(0)).to.be.false;

                wrapper.vm.snippets = [true];
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isOnlyAdjustFromParent(0)).to.be.false;

                wrapper.vm.snippets = [[]];
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isOnlyAdjustFromParent(0)).to.be.false;

                wrapper.vm.snippets = [{}];
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isOnlyAdjustFromParent(0)).to.be.false;
            });
            it("should return true", async () => {
                const snippets = [
                    {
                        snippetId: 0,
                        adjustOnlyFromParent: true
                    }
                ];

                wrapper.vm.snippets = snippets;
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isOnlyAdjustFromParent(0)).to.be.true;
            });
        });

        describe("getTitle", () => {
            it("should return true if title is true", () => {
                expect(wrapper.vm.getTitle(true), 1).to.be.true;
            });
            it("should return the title if title is set", () => {
                expect(wrapper.vm.getTitle({title: "title"}, 1)).to.be.equal("title");
            });
            it("should return true if title is not set", () => {
                sinon.stub(openlayerFunctions, "getLayerByLayerId").returns({
                    "id": "filterId",
                    "type": "layer",
                    "showInLayerTree": false,
                    "visibility": true
                });
                expect(wrapper.vm.getTitle({}, 1)).to.be.true;
            });
            it("should return the title if attribute is set in gfiAttributes", () => {
                sinon.stub(openlayerFunctions, "getLayerByLayerId").returns({
                    "id": "filterId",
                    "type": "layer",
                    "showInLayerTree": false,
                    "visibility": true,
                    "gfiAttributes": {
                        "attr": "Attribute Title"
                    }
                });
                expect(wrapper.vm.getTitle({attrName: "attr"}, 1)).to.be.equal("Attribute Title");
            });
            it("should return the title if attribute is set in gfiAttributes as object", () => {
                sinon.stub(openlayerFunctions, "getLayerByLayerId").returns({
                    "id": "filterId",
                    "type": "layer",
                    "showInLayerTree": false,
                    "visibility": true,
                    "gfiAttributes": {
                        "attr": {
                            "name": "Attribute Title"
                        }
                    }
                });
                expect(wrapper.vm.getTitle({attrName: "attr"}, 1)).to.be.equal("Attribute Title");
            });
        });

        describe("paging", () => {
            it("should show stop button if paging  was set", async () => {
                await wrapper.setData({
                    paging: {
                        page: 1,
                        total: 46
                    },
                    showStop: true
                });

                expect(wrapper.find(".btn-secondary").exists()).to.be.true;
            });
        });

        describe("SnippetDownload", () => {
            it("should render SnippetDownload component if download is true and filteredItems are given", async () => {
                await wrapper.setProps({
                    layerConfig: {
                        layerId: "layerId",
                        download: true
                    }
                });
                await wrapper.setData({
                    filteredItems: [
                        {
                            a: "a",
                            b: "b"
                        }
                    ]
                });
                await wrapper.vm.$nextTick();
                expect(wrapper.findComponent(SnippetDownload).exists()).to.be.true;
            });
        });

        describe("labelFilterButton", () => {
            it("should render correct name for label filter button", async () => {
                await wrapper.setData({
                    layerConfig: {
                        labelFilterButton: "common:modules.filter.filterButton"
                    }
                });
                await wrapper.vm.$nextTick();

                expect(wrapper.find("#runFilter").attributes("text")).to.equal("common:modules.filter.filterButton");
            });
        });

        describe("setSnippetValueByState", () => {
            const filterRules = [
                    {
                        snippetId: 0,
                        startup: false,
                        fixed: false,
                        attrName: "test",
                        operator: "EQ",
                        value: ["Altona"]
                    }
                ],
                snippets = [
                    {
                        operator: "EQ",
                        snippetId: 0,
                        title: "Bezirk",
                        type: "dropdown",
                        value: ["Altona"]
                    }],
                precheckedSnippets = [{
                    operator: "EQ",
                    snippetId: 0,
                    title: "Bezirk",
                    type: "dropdown",
                    value: ["Altona"],
                    prechecked: ["Altona"]
                }];

            it("should not set prechecked value if param is not an array", async () => {
                await wrapper.setData({
                    snippets
                });
                wrapper.vm.setSnippetValueByState(undefined);
                wrapper.vm.setSnippetValueByState(null);
                wrapper.vm.setSnippetValueByState(123456);
                wrapper.vm.setSnippetValueByState("string");
                wrapper.vm.setSnippetValueByState(true);
                wrapper.vm.setSnippetValueByState({});
                expect(wrapper.vm.snippets).to.deep.equal(snippets);
            });
            it("should not set prechecked value if given structure is not a rule", async () => {
                await wrapper.setData({
                    snippets
                });
                const isRuleStub = sinon.stub(wrapper.vm, "isRule").returns(false),
                    noRule = [
                        {
                            something: "something"
                        }
                    ];

                wrapper.vm.setSnippetValueByState(noRule);
                expect(wrapper.vm.snippets).to.deep.equal(snippets);
                expect(isRuleStub.called).to.be.true;
            });
            it("should set prechecked value if correct filter rule is given", async () => {
                await wrapper.setData({
                    snippets
                });
                wrapper.vm.setSnippetValueByState(filterRules);
                expect(wrapper.vm.snippets).to.deep.equal(precheckedSnippets);
            });

            describe("registerMapMoveListener", () => {
                it("should not call the function registerMapMoveListener", () => {
                    expect(wrapper.emitted()).to.not.have.property("registerMapMoveListener");
                });

                it("should trigger registerMapMoveListener event if filterOnMove is configured", async () => {
                    wrapper = shallowMount(LayerFilterSnippet, {
                        global: {
                            plugins: [store]
                        },
                        propsData: {
                            layerConfig: {
                                service: {
                                    type: "something external"
                                },
                                strategy: "active",
                                filterOnMove: true
                            },
                            mapHandler,
                            openMultipleAccordeons: false
                        }
                    });

                    await wrapper.vm.$nextTick();
                    expect(wrapper.emitted()).to.have.property("registerMapMoveListener");
                });
            });

            describe("checkZoomLevel", () => {
                it("should not call the function checkZoomLevel", async () => {
                    const checkZoomLevel = sinon.stub(wrapper.vm, "checkZoomLevel");

                    LayerFilterSnippet.methods.checkZoomLevel = checkZoomLevel;
                    wrapper = shallowMount(LayerFilterSnippet, {
                        global: {
                            plugins: [store]
                        },
                        propsData: {
                            global: {
                                plugins: [store]
                            },
                            layerConfig: {
                                service: {
                                    type: "something external"
                                }
                            },
                            mapHandler
                        }
                    });
                    await wrapper.vm.$nextTick();

                    expect(wrapper.vm.checkZoomLevel).to.be.a("function");
                    expect(checkZoomLevel.notCalled).to.be.true;
                });
                it("should call the function checkZoomLevel", async () => {
                    const checkZoomLevel = sinon.stub(wrapper.vm, "checkZoomLevel");

                    LayerFilterSnippet.methods.checkZoomLevel = checkZoomLevel;
                    wrapper = shallowMount(LayerFilterSnippet, {
                        global: {
                            plugins: [store]
                        },
                        propsData: {
                            layerConfig: {
                                service: {
                                    type: "something external"
                                },
                                minZoom: 15,
                                maxZoom: 18
                            },
                            mapHandler
                        }
                    });
                    await wrapper.vm.$nextTick();
                    expect(checkZoomLevel.called).to.be.true;
                });
            });

            describe("checkOutOfZoomLevel", () => {
                it("should set the variable outOfZoom false", () => {
                    expect(wrapper.vm.checkOutOfZoomLevel(undefined, undefined, undefined)).to.be.false;
                    expect(wrapper.vm.checkOutOfZoomLevel(undefined, undefined, 17)).to.be.false;
                    expect(wrapper.vm.checkOutOfZoomLevel(undefined, 18, 17)).to.be.false;
                    expect(wrapper.vm.checkOutOfZoomLevel(10, undefined, 17)).to.be.false;
                    expect(wrapper.vm.checkOutOfZoomLevel(10, 18, 17)).to.be.false;
                });
                it("should set the variable outOfZoom true", () => {
                    expect(wrapper.vm.checkOutOfZoomLevel(10, 16, 17)).to.be.true;
                    expect(wrapper.vm.checkOutOfZoomLevel(10, 18, 7)).to.be.true;
                    expect(wrapper.vm.checkOutOfZoomLevel(10, undefined, 7)).to.be.true;
                    expect(wrapper.vm.checkOutOfZoomLevel(undefined, 16, 17)).to.be.true;
                });
            });

            describe("deleteAllRules", () => {
                it("should emit the deleteAllRules function", async () => {
                    wrapper.vm.deleteAllRules();
                    await wrapper.vm.$nextTick();
                    expect(wrapper.emitted().deleteAllRules).to.be.an("array").with.lengthOf(1);
                });
                it("should call handleActiveStrategy if strategy is active", async () => {
                    const spyHandleActiveStrategy = sinon.spy(wrapper.vm, "handleActiveStrategy");

                    await wrapper.setProps({layerConfig: {strategy: "active"}});
                    wrapper.vm.deleteAllRules();
                    await wrapper.vm.$nextTick();
                    expect(spyHandleActiveStrategy.calledOnce).to.be.true;
                });
            });

            describe("hasChildSnippets", () => {
                it("should return false if anything but an array is given", () => {
                    expect(wrapper.vm.hasChildSnippets(undefined)).to.be.false;
                    expect(wrapper.vm.hasChildSnippets(null)).to.be.false;
                    expect(wrapper.vm.hasChildSnippets({})).to.be.false;
                    expect(wrapper.vm.hasChildSnippets(true)).to.be.false;
                    expect(wrapper.vm.hasChildSnippets(false)).to.be.false;
                    expect(wrapper.vm.hasChildSnippets(1234)).to.be.false;
                    expect(wrapper.vm.hasChildSnippets("1234")).to.be.false;
                });
                it("should return false if the given array has no snippets at all", () => {
                    expect(wrapper.vm.hasChildSnippets([])).to.be.false;
                    expect(wrapper.vm.hasChildSnippets(["foo", "bar"])).to.be.false;
                });
                it("should return true if the given array has child snippets", () => {
                    expect(wrapper.vm.hasChildSnippets([{children: "foo"}])).to.be.true;
                });
            });

            describe("updateSnippetUniqueValues", () => {
                it("should not call any listener if outOfZoom is true", async () => {
                    let foo = false;

                    wrapper.setData({
                        uniqueValuesOnMoveListeners: {
                            0: () => {
                                foo = true;
                            }
                        },
                        outOfZoom: true
                    });
                    wrapper.vm.updateSnippetUniqueValues();
                    await wrapper.vm.$nextTick();
                    expect(foo).to.be.false;
                });
                it("should call any listener if outOfZoom is false", async () => {
                    let foo = false;

                    wrapper.setData({
                        uniqueValuesOnMoveListeners: {
                            0: () => {
                                foo = true;
                            }
                        },
                        outOfZoom: false
                    });
                    wrapper.vm.updateSnippetUniqueValues();
                    await wrapper.vm.$nextTick();
                    expect(foo).to.be.true;
                });
            });

            describe("isInitialValue", () => {
                it("should return true if the parameter is not right", () => {
                    expect(wrapper.vm.isInitialValue(null, [""])).to.be.true;
                    expect(wrapper.vm.isInitialValue(0, [""])).to.be.true;
                    expect(wrapper.vm.isInitialValue(true, [""])).to.be.true;
                    expect(wrapper.vm.isInitialValue({}, [""])).to.be.true;
                    expect(wrapper.vm.isInitialValue([], [""])).to.be.true;
                    expect(wrapper.vm.isInitialValue("", [""])).to.be.true;
                    expect(wrapper.vm.isInitialValue(undefined, [""])).to.be.true;
                    expect(wrapper.vm.isInitialValue([""], 0)).to.be.true;
                    expect(wrapper.vm.isInitialValue([""], true)).to.be.true;
                    expect(wrapper.vm.isInitialValue([""], {})).to.be.true;
                    expect(wrapper.vm.isInitialValue([""], [])).to.be.true;
                    expect(wrapper.vm.isInitialValue([""], "")).to.be.true;
                    expect(wrapper.vm.isInitialValue([""], undefined)).to.be.true;
                });

                it("should return true if two value are the same, but the value of startup is false", () => {
                    const ruleA = [{value: "a", startup: false}],
                        ruleB = [{value: "a", startup: false}];

                    expect(wrapper.vm.isInitialValue(ruleA, ruleB)).to.be.true;
                });

                it("should return false if two value are different", () => {
                    const ruleA = [{value: "a", startup: true}],
                        ruleB = [{value: "b", startup: true}];

                    expect(wrapper.vm.isInitialValue(ruleA, ruleB)).to.be.false;
                });

                it("should return false if two value are different", () => {
                    const ruleA = [{value: "a", startup: true}],
                        ruleB = [{value: "b", startup: true}];

                    expect(wrapper.vm.isInitialValue(ruleA, ruleB)).to.be.false;
                });
            });
        });
    });
});
