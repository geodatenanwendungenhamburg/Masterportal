import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import {expect} from "chai";
import FilterStore from "@modules/filter/store/indexFilter.js";
import getIconListFromLegend from "@modules/filter/utils/getIconListFromLegend.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import openlayerFunctions from "@modules/filter/utils/openlayerFunctions.js";
import SnippetDropdown from "@modules/filter/components/SnippetDropdown.vue";
import sinon from "sinon";
import mapCollection from "@core/maps/js/mapCollection.js";

config.global.mocks.$t = key => key;

describe("src/modules/filter/components/SnippetDropdown.vue", () => {
    let wrapper, store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Filter: FilterStore
                    }
                }
            }
        });

        wrapper = shallowMount(SnippetDropdown, {
            global: {
                plugins: [store]
            }
        });
    });

    describe("constructor", () => {
        it("should have correct default values", () => {
            expect(wrapper.vm.api).to.be.null;
            expect(wrapper.vm.attrName).to.equal("");
            expect(wrapper.vm.addSelectAll).to.be.false;
            expect(wrapper.vm.adjustment).to.be.false;
            expect(wrapper.vm.adjustOnlyFromParent).to.be.false;
            expect(wrapper.vm.autoInit).to.be.true;
            expect(wrapper.vm.localeCompareParams).to.be.undefined;
            expect(wrapper.vm.delimiter).to.be.undefined;
            expect(wrapper.vm.disabled).to.be.false;
            expect(wrapper.vm.display).to.equal("default");
            expect(wrapper.vm.filterId).to.equal(0);
            expect(wrapper.vm.info).to.be.false;
            expect(wrapper.vm.isChild).to.be.false;
            expect(wrapper.vm.isParent).to.be.false;
            expect(wrapper.vm.title).to.be.true;
            expect(wrapper.vm.layerId).to.be.undefined;
            expect(wrapper.vm.multiselect).to.be.false;
            expect(wrapper.vm.operator).to.be.undefined;
            expect(wrapper.vm.optionsLimit).to.be.equal(20000);
            expect(wrapper.vm.placeholder).to.equal("");
            expect(wrapper.vm.prechecked).to.be.undefined;
            expect(wrapper.vm.renderIcons).to.be.undefined;
            expect(wrapper.vm.fixedRules).to.be.an("array").that.is.empty;
            expect(wrapper.vm.snippetId).to.equal(0);
            expect(wrapper.vm.value).to.be.undefined;
            expect(wrapper.vm.visible).to.be.true;
        });
        it("should render correctly with default values", () => {
            expect(wrapper.find(".filter-select-box-container").exists()).to.be.true;
        });
        it("should render hidden if visible is false", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    visible: false
                }
            });

            const el = wrapper.find(".snippetDropdownContainer");

            if (el.exists()) {
                expect(el.isVisible()).to.be.false;
            }
            else {
                expect(el.exists()).to.be.false;
            }
        });
        it("should render but also be disabled", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    disabled: true
                }
            });

            expect(wrapper.find(".filter-select-box-container").exists()).to.be.true;
            expect(wrapper.vm.disabled).to.be.true;
        });
        it("should render with a title if the title is a string", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    title: "foobar"
                }
            });

            expect(wrapper.find(".select-box-label").text()).to.be.equal("foobar");
        });
        it("should render without a title if title is a boolean and false", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    title: false
                }
            });

            expect(wrapper.find(".select-box-label").exists()).to.be.false;
        });
        it("should have an empty list if autoInit is false and the api may be set", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    api: {},
                    autoInit: false
                }
            });

            expect(wrapper.vm.dropdownValue).to.be.an("array").and.to.be.empty;
        });
        it("should not use the given operator if an invalid operator is given", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    operator: "operator"
                }
            });

            expect(wrapper.vm.securedOperator).to.not.be.equal("operator");
        });
        it("should only set the dropdown values based on the given values", async () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    value: ["Altona", "Eimsbüttel", "Bergedorf"],
                    dropdownValue: []
                }
            });
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.dropdownValue).to.deep.equal(["Altona", "Eimsbüttel", "Bergedorf"]);
        });
    });

    describe("emitCurrentRule", () => {
        it("should emit changeRule function with the expected values", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    snippetId: 1234,
                    visible: false,
                    attrName: "attrName",
                    operatorForAttrName: "AND",
                    operator: "EQ",
                    delimiter: "|"
                }
            });

            wrapper.vm.emitCurrentRule("value", "startup");
            expect(wrapper.emitted("changeRule")).to.be.an("array").and.to.have.lengthOf(1);
            expect(wrapper.emitted("changeRule")[0]).to.be.an("array").and.to.have.lengthOf(1);
            expect(wrapper.emitted("changeRule")[0][0]).to.deep.equal({
                snippetId: 1234,
                startup: "startup",
                fixed: true,
                attrName: "attrName",
                attrLabel: "attrName",
                operatorForAttrName: "AND",
                operator: "EQ",
                delimiter: "|",
                value: "value"
            });
        });
        it("should emit changeRule function with the expected values when values are objects", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    snippetId: 1234,
                    visible: false,
                    attrName: "attrName",
                    attrLabel: "attrName",
                    operatorForAttrName: "AND",
                    operator: "EQ",
                    delimiter: "|"
                }
            });

            wrapper.vm.emitCurrentRule([
                {
                    title: "value",
                    img: "img",
                    desc: "desc"
                }
            ], "startup");
            expect(wrapper.emitted("changeRule")).to.be.an("array").and.to.have.lengthOf(1);
            expect(wrapper.emitted("changeRule")[0]).to.be.an("array").and.to.have.lengthOf(1);
            expect(wrapper.emitted("changeRule")[0][0]).to.deep.equal({
                snippetId: 1234,
                startup: "startup",
                fixed: true,
                attrName: "attrName",
                attrLabel: "attrName",
                operatorForAttrName: "AND",
                operator: "EQ",
                delimiter: "|",
                value: ["value"]
            });
        });
    });

    describe("deleteCurrentRule", () => {
        it("should emit deleteRule function with its snippetId", () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    snippetId: 1234
                }
            });

            wrapper.vm.deleteCurrentRule();
            expect(wrapper.emitted("deleteRule")).to.be.an("array").and.to.have.lengthOf(1);
            expect(wrapper.emitted("deleteRule")[0]).to.be.an("array").and.to.have.lengthOf(1);
            expect(wrapper.emitted("deleteRule")[0][0]).to.equal(1234);
        });
    });

    describe("display list", () => {
        it("should render a list with radio", async () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    "type": "dropdown",
                    "attrName": "kapitelbezeichnung",
                    "display": "list",
                    "multiselect": false,
                    "value": ["yek", "do"]
                }
            });

            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            expect(wrapper.find(".snippetListContainer").exists()).to.be.true;
            expect(wrapper.find(".snippetListContainer .radio").exists()).to.be.true;
        });
        it("should render a list with checkbox", async () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    "type": "dropdown",
                    "attrName": "kapitelbezeichnung",
                    "display": "list",
                    "multiselect": true,
                    "value": ["yek", "do"]
                }
            });

            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            expect(wrapper.find(".snippetListContainer").exists()).to.be.true;
            expect(wrapper.find(".snippetListContainer .checkbox").exists()).to.be.true;
        });
        it("should set the current source to 'dropdown' if clicked on a entry", async () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    "type": "dropdown",
                    "attrName": "kapitelbezeichnung",
                    "display": "list",
                    "multiselect": true,
                    "value": ["yek", "do"]
                }
            });
            await wrapper.setData({source: "adjust"});
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            await wrapper.findAll(".checkbox").at(0).trigger("click");
            expect(wrapper.vm.source).to.be.equal("dropdown");
        });
        it("filters dropdown values correctly when typing while addSelectAll is true", async () => {
            wrapper = shallowMount(SnippetDropdown, {
                global: {
                    plugins: [store]
                },
                props: {
                    "multiselect": true,
                    "addSelectAll": true,
                    "value": ["Liquid", "Solid", "Solidus"]
                }
            });

            await wrapper.setData({source: "adjust"});
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            await wrapper.vm.getSearchedResult("Sol");

            const result = wrapper.vm.searchedResult;

            expect(result).to.be.an("array");
            expect(result[0]).to.have.property("list")
                .that.includes("Solid")
                .and.that.includes("Solidus")
                .and.that.not.includes("Liquid");
        });
    });

    describe("methods", () => {
        describe("initializeIcons", () => {
            let layer,
                typ,
                setVisibleSpy,
                onceSpy,
                returnLegendByStyleIdSpy,
                addLayerSpy,
                areLayerFeaturesLoadedSpy,
                layersOnMap,
                layerConfig;

            beforeEach(() => {
                mapCollection.clear();
                layersOnMap = [];
                const map = {
                    id: "ol",
                    mode: "2D",
                    getLayers: () => {
                        return {
                            getArray: () => layersOnMap
                        };
                    }
                };

                mapCollection.addMap(map, "2D");
                addLayerSpy = sinon.spy();
                areLayerFeaturesLoadedSpy = sinon.spy();

                store = createStore({
                    namespaced: true,
                    modules: {
                        Modules: {
                            namespaced: true,
                            modules: {
                                Filter: FilterStore
                            }
                        },
                        Maps: {
                            namespaced: true,
                            actions: {
                                addLayer: addLayerSpy,
                                areLayerFeaturesLoaded: areLayerFeaturesLoadedSpy
                            }
                        }
                    }
                });
                typ = "WFS";
                setVisibleSpy = sinon.spy();
                onceSpy = sinon.spy();
                layerConfig = {
                    typ: typ
                };
                layer = {
                    getLayer: () => {
                        return {
                            setVisible: setVisibleSpy,
                            getSource: () => {
                                return {
                                    once: onceSpy
                                };
                            }
                        };
                    },
                    get: (key) => {
                        if (key === "id") {
                            return "layerId";
                        }
                        if (key === "typ") {
                            return typ;
                        }
                        if (key === "styleId") {
                            return "styleId";
                        }
                        return null;
                    }
                };
                // sinon.stub(layerCollection, "getLayerById").returns(layer);
                sinon.stub(layerFactory, "createLayer").returns(layer);
                sinon.stub(openlayerFunctions, "getLayerByLayerId").returns(layerConfig);
                sinon.stub(getIconListFromLegend, "getStyleModel").returns({});
                returnLegendByStyleIdSpy = sinon.spy(createStyle, "returnLegendByStyleId");
            });
            afterEach(() => {
                sinon.restore();
            });
            it("initializeIcons with not visible WFS layer", async () => {
                sinon.stub(layerCollection, "getLayerById").returns(null);
                wrapper = shallowMount(SnippetDropdown,
                    {
                        global: {
                            plugins: [store]
                        },
                        props: {
                            renderIcons: "fromLegend"
                        }
                    });

                await wrapper.vm.$nextTick();
                expect(addLayerSpy.calledOnce).to.be.true;
                expect(setVisibleSpy.notCalled).to.be.true;
                expect(areLayerFeaturesLoadedSpy.calledOnce).to.be.true;
            });
            it("initializeIcons with not visible OAF layer", async () => {
                typ = "OAF";
                sinon.stub(layerCollection, "getLayerById").returns(null);
                wrapper = shallowMount(SnippetDropdown,
                    {
                        global: {
                            plugins: [store]
                        },
                        props: {
                            renderIcons: "fromLegend"
                        }
                    });

                await wrapper.vm.$nextTick();
                expect(addLayerSpy.calledOnce).to.be.true;
                expect(setVisibleSpy.notCalled).to.be.true;
                expect(areLayerFeaturesLoadedSpy.calledOnce).to.be.true;
            });
            it("initializeIcons with not visible GeoJSON layer", async () => {
                typ = "GeoJSON";
                sinon.stub(layerCollection, "getLayerById").returns(null);
                wrapper = shallowMount(SnippetDropdown,
                    {
                        global: {
                            plugins: [store]
                        },
                        props: {
                            renderIcons: "fromLegend"
                        }
                    });

                await wrapper.vm.$nextTick();
                expect(addLayerSpy.calledOnce).to.be.true;
                expect(setVisibleSpy.notCalled).to.be.true;
                expect(areLayerFeaturesLoadedSpy.calledOnce).to.be.true;
            });
            it("initializeIcons with visible WFS layer", async () => {
                layersOnMap.push(layer);
                sinon.stub(layerCollection, "getLayerById").returns(null);
                wrapper = shallowMount(SnippetDropdown,
                    {
                        global: {
                            plugins: [store]
                        },
                        props: {
                            renderIcons: "fromLegend",
                            layerId: "layerId"
                        }
                    });

                await wrapper.vm.$nextTick();
                expect(setVisibleSpy.calledOnce).to.be.true;
                expect(setVisibleSpy.firstCall.args[0]).to.be.true;
                expect(areLayerFeaturesLoadedSpy.calledOnce).to.be.true;
            });
            it("initializeIcons with not visible WMS-layer", async () => {
                sinon.stub(layerCollection, "getLayerById").returns(layer);
                typ = "WMS";
                wrapper = shallowMount(SnippetDropdown,
                    {
                        global: {
                            plugins: [store]
                        },
                        props: {
                            renderIcons: "fromLegend",
                            layerId: "layerId"
                        }
                    });
                await wrapper.vm.$nextTick();
                expect(setVisibleSpy.notCalled).to.be.true;

                expect(returnLegendByStyleIdSpy.calledOnce).to.be.true;
                expect(returnLegendByStyleIdSpy.firstCall.args[0]).to.be.equals("layerId");
            });
        });
        describe("getPrecheckedExistingInValue", () => {
            it("should return false if anything but an array is given as first parameter", () => {
                expect(wrapper.vm.getPrecheckedExistingInValue(undefined)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue(null)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue(1234)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue("string")).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue(true)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue(false)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue({})).to.be.false;
            });
            it("should return false if anything but an array is given as second parameter", () => {
                expect(wrapper.vm.getPrecheckedExistingInValue([], undefined)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue([], null)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue([], 1234)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue([], "string")).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue([], true)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue([], false)).to.be.false;
                expect(wrapper.vm.getPrecheckedExistingInValue([], {})).to.be.false;
            });
            it("should return entries of prechecked only if exists in dropdownValue", () => {
                const prechecked = ["yes", "no"],
                    dropdownValue = ["yes", "maybe"],
                    expected = ["yes"];

                expect(wrapper.vm.getPrecheckedExistingInValue(prechecked, dropdownValue)).to.deep.equal(expected);
            });
        });
        describe("getInitialDropdownSelected", () => {
            it("should return an empty array if dropdownValue is not an array", () => {
                expect(wrapper.vm.getInitialDropdownSelected("prechecked", undefined)).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected("prechecked", null)).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected("prechecked", 1234)).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected("prechecked", "string")).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected("prechecked", true)).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected("prechecked", false)).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected("prechecked", {})).to.be.an("array").that.is.empty;
            });
            it("should return prechecked if prechecked is an array", () => {
                expect(wrapper.vm.getInitialDropdownSelected(["prechecked"], ["prechecked"])).to.deep.equal(["prechecked"]);
            });
            it("should return dropdownValue if prechecked is 'all' and multiselect is set", () => {
                expect(wrapper.vm.getInitialDropdownSelected("all", ["prechecked"], true)).to.deep.equal(["prechecked"]);
            });
            it("should return an empty array if prechecked is 'all' and multiselect is not set", () => {
                expect(wrapper.vm.getInitialDropdownSelected("all", ["prechecked"], false)).to.be.an("array").that.is.empty;
            });
            it("should return an empty array if prechecked is neither 'all' nor an array", () => {
                expect(wrapper.vm.getInitialDropdownSelected(undefined, [])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected(null, [])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected(1234, [])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected("string", [])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected(true, [])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected(false, [])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getInitialDropdownSelected({}, [])).to.be.an("array").that.is.empty;
            });
        });

        describe("resetSnippet", () => {
            it("should reset the snippet", async () => {
                wrapper = shallowMount(SnippetDropdown, {
                    global: {
                        plugins: [store]
                    },
                    props: {
                        dropdownValue: ["Altona", "Eimsbüttel", "Bergedorf"]
                    },
                    data: () => {
                        return {dropdownSelected: ["Altona"]};
                    }
                });
                expect(wrapper.vm.dropdownSelected).to.deep.equal(["Altona"]);
                wrapper.vm.resetSnippet();
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.dropdownSelected).to.deep.equal([]);
            });
        });
    });
});
