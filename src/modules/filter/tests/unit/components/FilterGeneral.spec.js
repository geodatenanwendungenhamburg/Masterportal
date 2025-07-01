import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import FilterGeneral from "@modules/filter/components/FilterGeneral.vue";
import FilterStore from "@modules/filter/store/indexFilter";
import sinon from "sinon";
import openlayerFunctions from "@modules/filter/utils/openlayerFunctions";
import layerCollection from "@core/layers/js/layerCollection.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

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

        it("should render two accordions if two layer groups are present and layerSelectorVisible is true", () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            expect(wrapper.findAll(".accordion-collapse")).to.have.lengthOf(2);
        });

        it("should render no accordions if layer groups are present and layerSelectorVisible is false", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.vm.setLayerSelectorVisible(false);
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".accordion-collapse").exists()).to.be.false;
            wrapper.vm.setLayerSelectorVisible(true);
        });

        it("should render and open one accordion if its selected", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.vm.setSelectedGroups([0]);
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".show").exists()).to.be.true;
            expect(wrapper.findAll(".show")).to.have.lengthOf(1);
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

        it("should render an icon button if initialStartupReset is true", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.vm.setLayerSelectorVisible(false);
            wrapper.vm.hasUnfixedRules = () => true;
            wrapper.vm.layerConfigs.layers[0].initialStartupReset = true;
            await wrapper.vm.$forceUpdate();

            expect(wrapper.findComponent(IconButton).exists()).to.be.true;
            wrapper.vm.layerConfigs.layers[0].initialStartupReset = false;
            wrapper.vm.setLayerSelectorVisible(true);
        });

        it("should not render an icon button if initialStartupReset is false", async () => {
            const wrapper = shallowMount(FilterGeneral, {global: {
                plugins: [store]
            }});

            wrapper.vm.setLayerSelectorVisible(false);
            wrapper.vm.hasUnfixedRules = () => true;
            await wrapper.vm.$nextTick();
            expect(wrapper.findComponent(IconButton).exists()).to.be.false;
            wrapper.vm.setLayerSelectorVisible(true);
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
