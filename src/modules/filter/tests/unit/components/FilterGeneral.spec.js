import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import FilterGeneral from "@modules/filter/components/FilterGeneral.vue";
import FilterStore from "@modules/filter/store/indexFilter.js";
import sinon from "sinon";
import openlayerFunctions from "@modules/filter/utils/openlayerFunctions.js";
import layerCollection from "@core/layers/js/layerCollection.js";

config.global.mocks.$t = key => key;

describe("src/modules/filter/components/FilterGeneral.vue", () => {
    const layers = [
            {
                title: "layerOne",
                layerId: "1234"
            },
            {
                title: "layerTwo",
                layerId: "4321"
            },
            {
                title: "layerThree",
                layerId: "5678"
            }
        ],
        groups = [{layers, title: "groupOne"}, {layers, title: "groupTwo"}],
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Filter: FilterStore
                    }
                }
            },
            getters: {
                urlParams: () => {
                    return {};
                }
            }
        });

    beforeEach(() => {
        store.commit("Modules/Filter/setLayers", layers);
        store.commit("Modules/Filter/setLayerGroups", groups);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            expect(wrapper.find("#filter").exists()).to.be.true;
        });

        it("should render url link if configured", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.vm.setLinkText("Linktext");
            await wrapper.vm.$nextTick();
            expect(wrapper.findAll("a").filter(w => w.attributes("href")?.includes("&FILTER="))).to.have.lengthOf(1);
        });

        it("should not render url link if not configured", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.vm.setLinkText("");
            await wrapper.vm.$nextTick();
            expect(wrapper.findAll(".link-text")).to.have.lengthOf(0);

        });

        it("should not render questionLink button by default", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            expect(wrapper.findComponent("[icon='bi bi-question-circle']").exists()).to.be.false;
        });

        it("should render questionLink button if configured", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.vm.setQuestionLink("about:blank");
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent("[icon='bi bi-question-circle']").exists()).to.be.true;
        });

        it("should not render result element if no filter active", () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            expect(wrapper.findAll(".result")).to.have.lengthOf(0);
            expect(wrapper.findComponent({name: "SnippetTag"}).exists()).to.be.false;
        });

        it("should render result element if no filter active", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.setData({isFilterActive: true});
            await wrapper.vm.$nextTick();

            expect(wrapper.findAll(".result")).to.have.lengthOf(1);
        });

        it("should not render geometry filter accordion componenet", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            expect(wrapper.findComponent({name: "AccordionItem", id: "geometry-filter-accordion"}).exists()).to.be.false;
        });

        it("should render geometry filter accordion componenet", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }}),
                geometrySelectorOptions = {
                    "visible": true,
                    "circleSides": 256,
                    "defaultBuffer": 20,
                    "geometries": [
                        "Polygon",
                        "Rectangle",
                        "Circle",
                        "LineString"
                    ],
                    "invertGeometry": true,
                    "fillColor": "rgba(0, 0, 0, 0.33)",
                    "strokeColor": "rgba(0, 0, 0, 1)",
                    "strokeWidth": 1,
                    "selectedGeometry": 0,
                    "additionalGeometries": [{
                        "layerId": "1692",
                        "attrNameForTitle": "bezirk_name"
                    }]
                };


            store.commit("Modules/Filter/setGeometrySelectorOptions", geometrySelectorOptions);
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "AccordionItem", id: "geometry-filter-accordion"}).exists()).to.be.true;
        });
        it("should render currently active filters div if showCurrentlyActiveFilters is true and a filter is active", async () => {
            store.commit("Modules/Filter/setShowCurrentlyActiveFilters", true);
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            await wrapper.setData({isFilterActive: true});
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".d-block").exists()).to.be.true;
        });

        it("should not render currently active filters div if showCurrentlyActiveFilters is true but no filter is active", async () => {
            store.commit("Modules/Filter/setShowCurrentlyActiveFilters", true);
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            await wrapper.setData({isFilterActive: false});
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".d-block").exists()).to.be.false;
        });

        it("should not render currently active filters div if showCurrentlyActiveFilters is false", async () => {
            store.commit("Modules/Filter/setShowCurrentlyActiveFilters", false);
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            await wrapper.setData({isFilterActive: true});
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".d-block").exists()).to.be.false;
        });
    });

    describe("Methods", () => {
        describe("checkActiveFilter ", () => {
            it("should set isFilterActive to be false", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.checkActiveFilter(null);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;

                wrapper.vm.checkActiveFilter(0);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;

                wrapper.vm.checkActiveFilter(false);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;

                wrapper.vm.checkActiveFilter("");
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;

                wrapper.vm.checkActiveFilter(undefined);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;

                wrapper.vm.checkActiveFilter({});
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;

                wrapper.vm.checkActiveFilter([]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;
            });

            it("should set isFilterActive to be false if rules have only null elements.", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.checkActiveFilter([null, null, null]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;
            });

            it("should set isFilterActive to be true if rules have an object rule only false.", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.checkActiveFilter([[false]]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;
            });

            it("should set isFilterActive to be true if rules have an object rule with fixed value.", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.checkActiveFilter([[{fixed: true}]]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.false;
            });

            it("should set isFilterActive to be true if rules have a right object rule.", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.checkActiveFilter([[{rule: "rule"}]]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.isFilterActive).to.be.true;
            });
        });
        describe("generateLayerRules  ", () => {
            it("should generate an empty array as layer rules if the filter is not active", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                        plugins: [store]
                    }}),
                    rules = [[{snippetId: 0}]];

                wrapper.setData({isFilterActive: false});
                await wrapper.vm.$nextTick();
                wrapper.vm.generateLayerRules(rules);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.layerRules).to.be.deep.equal([]);
            });

            it("should generate an empty array as layer rules if there are only false or null as rule.", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.setData({isFilterActive: true});
                await wrapper.vm.$nextTick();

                wrapper.vm.generateLayerRules([[null]]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.layerRules).to.be.deep.equal([]);

                wrapper.vm.generateLayerRules([[false]]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.layerRules).to.be.deep.equal([]);
            });

            it("should generate an empty array as layer rules if there are fixed value in rule", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.setData({isFilterActive: true});
                await wrapper.vm.$nextTick();

                wrapper.vm.generateLayerRules([[{snippetId: 0, fixed: true}]]);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.layerRules).to.be.deep.equal([]);
            });

            it("should generate a rule", async () => {
                const wrapper = shallowMount(FilterGeneral,
                        {
                            global: {
                                plugins: [store]
                            }
                        }),
                    expected = [
                        {
                            filterId: 0,
                            layerTitle: "layerOne",
                            rule: [{snippetId: 0}]
                        }
                    ],
                    tmpLayerConfigs = store.state.Modules.Filter.layerConfigs;

                sinon.stub(wrapper.vm, "isRule").returns(true);
                store.commit("Modules/Filter/setLayerConfigs", {
                    layers: [{filterId: 0, title: "layerOne"}]
                });

                await wrapper.setData({
                    isFilterActive: true,
                    flattenPreparedLayerGroups: []
                });

                await wrapper.vm.$nextTick();

                wrapper.vm.generateLayerRules([[{snippetId: 0}]]);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.layerRules).to.deep.equal(expected);
                store.commit("Modules/Filter/setLayerConfigs", tmpLayerConfigs);
            });

            it("should skip rules that are not valid according to isRule", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {plugins: [store]}});

                wrapper.setData({isFilterActive: true});
                await wrapper.vm.$nextTick();

                sinon.stub(wrapper.vm, "isRule").returns(false);

                wrapper.vm.generateLayerRules([[{snippetId: 0}]]);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.layerRules).to.deep.equal([]);
                sinon.restore();
            });

            it("should skip rules with empty appliedPassiveValues", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {plugins: [store]}});

                wrapper.setData({isFilterActive: true});
                await wrapper.vm.$nextTick();

                sinon.stub(wrapper.vm, "isRule").returns(true);

                wrapper.vm.generateLayerRules([[{snippetId: 0, appliedPassiveValues: []}]]);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.layerRules).to.deep.equal([]);
                sinon.restore();
            });
        });
        describe("getTagClass ", () => {
            it("should return empty string if the index is smaller than 2", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                expect(wrapper.vm.getTagClass(0)).to.equal("");
                expect(wrapper.vm.getTagClass(1)).to.equal("");
            });
            it("should return empty string if the index is bigger than 2 and it is shown", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                expect(wrapper.vm.getTagClass(2, true)).to.equal("");
            });
            it("should return 'd-none' if the index is bigger than 2 and it is not shown", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                expect(wrapper.vm.getTagClass(2, false)).to.equal("d-none");
            });
        });
        describe("updateSelectedGroups", () => {
            it("should remove given index from selectedGroups if found in array", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.setSelectedGroups([0, 1]);
                await wrapper.vm.$nextTick();
                wrapper.vm.updateSelectedGroups(0);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.selectedGroups).to.deep.equal([1]);
            });
            it("should add given index to selectedGroups if not found in array", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.setSelectedGroups([0]);
                await wrapper.vm.$nextTick();
                wrapper.vm.updateSelectedGroups(1);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.selectedGroups).to.deep.equal([0, 1]);
            });
        });
        describe("updateSelectedAccordions", () => {
            it("should add filterIds to selectedAccordion if multiLayerSelector is false", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                        plugins: [store]
                    }}),
                    expected = [
                        {
                            filterId: 0,
                            layerId: "1234"
                        }
                    ];

                wrapper.vm.setMultiLayerSelector(false);
                await wrapper.vm.$nextTick();
                wrapper.vm.updateSelectedAccordions(0);
                expect(wrapper.vm.selectedAccordions).to.deep.equal(expected);
            });
            it("should remove filterIds from selectedAccordion if multiLayerSelector is false", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});

                wrapper.vm.updateSelectedAccordions(0);
                expect(wrapper.vm.selectedAccordions).to.deep.equal([]);
            });
            it("should not change the rule when adding and removing the filterId of selectedAccordion", async () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                        plugins: [store]
                    }}),
                    rule = [[
                        {
                            snippetId: 0,
                            startup: false,
                            fixed: false,
                            attrName: "test",
                            operator: "EQ",
                            value: ["Altona"]
                        }
                    ]];

                wrapper.vm.setMultiLayerSelector(true);
                await wrapper.vm.$nextTick();
                wrapper.vm.setRulesOfFilters({
                    rulesOfFilters: rule
                });
                wrapper.vm.updateSelectedAccordions(0);
                expect(wrapper.vm.rulesOfFilters).to.deep.equal(rule);
                wrapper.vm.updateSelectedAccordions(0);
                expect(wrapper.vm.rulesOfFilters).to.deep.equal(rule);
            });
        });
        describe("toggleFilterSelectionOfCollapseButtonGroup", () => {
            it("should remove the filterId if it is already selected", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {plugins: [store]}}),
                    selectedFilterIds = ["filter1", "filter2"],
                    result = wrapper.vm.toggleFilterSelectionOfCollapseButtonGroup(
                        "filter1",
                        [],
                        selectedFilterIds
                    );

                expect(result).to.deep.equal(["filter2"]);
            });

            it("should add the filterId if it is not selected and no other from the same group exists", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {plugins: [store]}}),
                    collapseButtonGroups = [
                        {
                            layers: [{filterId: "filter1"}, {filterId: "filter2"}]
                        }
                    ],
                    selectedFilterIds = [],
                    result = wrapper.vm.toggleFilterSelectionOfCollapseButtonGroup(
                        "filter1",
                        collapseButtonGroups,
                        selectedFilterIds
                    );

                expect(result).to.deep.equal(["filter1"]);
            });

            it("should remove other filterIds from the same group before adding the new one", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {plugins: [store]}}),
                    collapseButtonGroups = [
                        {
                            layers: [{filterId: "filter1"}, {filterId: "filter2"}]
                        }
                    ],
                    selectedFilterIds = ["filter2", "filter3"],
                    result = wrapper.vm.toggleFilterSelectionOfCollapseButtonGroup(
                        "filter1",
                        collapseButtonGroups,
                        selectedFilterIds
                    );

                expect(result).to.deep.equal(["filter3", "filter1"]);
            });

            it("should not remove filterIds from other groups", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {plugins: [store]}}),
                    collapseButtonGroups = [
                        {
                            layers: [{filterId: "filter1"}, {filterId: "filter2"}]
                        },
                        {
                            layers: [{filterId: "filter3"}, {filterId: "filter4"}]
                        }
                    ],
                    selectedFilterIds = ["filter2", "filter3"],
                    result = wrapper.vm.toggleFilterSelectionOfCollapseButtonGroup(
                        "filter1",
                        collapseButtonGroups,
                        selectedFilterIds
                    );

                expect(result).to.deep.equal(["filter3", "filter1"]);
            });

            it("should handle case where filterId does not belong to any group", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {plugins: [store]}}),
                    collapseButtonGroups = [
                        {
                            layers: [{filterId: "filter1"}, {filterId: "filter2"}]
                        }
                    ],
                    selectedFilterIds = [],
                    result = wrapper.vm.toggleFilterSelectionOfCollapseButtonGroup(
                        "unknownFilter",
                        collapseButtonGroups,
                        selectedFilterIds
                    );

                expect(result).to.deep.equal(["unknownFilter"]);
            });
        });
        describe("handleStateForAlreadyActiveLayers", () => {
            it("should not do anything if if first param is not an object", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                    plugins: [store]
                }});
                let param = null;

                param = undefined;
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.be.undefined;
                param = null;
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.be.null;
                param = "foo";
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.be.equal("foo");
                param = 1234;
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.be.equal(1234);
                param = [];
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.be.an("array").and.to.be.empty;
                param = undefined;
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.be.undefined;
            });
            it("should not do anything if given param has no rulesOfFilters or selectedAccordions property", () => {
                const param = {foo: "bar"},
                    wrapper = shallowMount(FilterGeneral, {global: {
                        plugins: [store]
                    }});

                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.deep.equal({foo: "bar"});
            });
            it("should not remove rules of the given param if the matching layer is not activated", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                        plugins: [store]
                    }}),
                    param = {
                        rulesOfFilters: [["foo", "bar", "buz"]],
                        selectedAccordions: [
                            {
                                layerId: 0,
                                filterId: 0
                            },
                            {
                                layerId: 1,
                                filterId: 1
                            }
                        ]
                    };

                openlayerFunctions.getLayerByLayerId = (layerId) => {
                    if (layerId === 1) {
                        return null;
                    }
                    return {
                        visibility: false,
                        typ: "foo"
                    };
                };
                sinon.stub(layerCollection, "getLayerById").returns(
                    {
                        layer: {
                            getSource: () => {
                                return {
                                    once: (eventname, handler) => {
                                        handler();
                                    },
                                    getFeatures: () => {
                                        return [];
                                    }
                                };
                            }
                        }
                    }
                );
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.deep.equal({rulesOfFilters: [["foo", "bar", "buz"]], selectedAccordions: [{layerId: 0, filterId: 0}, {layerId: 1, filterId: 1}]});
            });
            it("should remove rules of the given param if the matching layer is already activated", () => {
                const wrapper = shallowMount(FilterGeneral, {global: {
                        plugins: [store]
                    }}),
                    param = {
                        rulesOfFilters: [["foo"], ["bar"], ["buz"]],
                        selectedAccordions: [
                            {
                                layerId: 0,
                                filterId: 0
                            },
                            {
                                layerId: 1,
                                filterId: 1
                            }
                        ]
                    };

                openlayerFunctions.getLayerByLayerId = (layerId) => {
                    if (layerId === 1) {
                        return null;
                    }
                    return {
                        visibility: true,
                        typ: "foo"
                    };
                };
                sinon.stub(layerCollection, "getLayerById").returns(
                    {
                        layer: {
                            getSource: () => {
                                return {
                                    once: (eventname, handler) => {
                                        handler();
                                    },
                                    getFeatures: () => {
                                        return [];
                                    }
                                };
                            }
                        }
                    }
                );
                wrapper.vm.handleStateForAlreadyActiveLayers(param);
                expect(param).to.deep.equal({rulesOfFilters: [null, ["bar"], ["buz"]], selectedAccordions: [{layerId: 1, filterId: 1}]});
            });
        });
    });
});
