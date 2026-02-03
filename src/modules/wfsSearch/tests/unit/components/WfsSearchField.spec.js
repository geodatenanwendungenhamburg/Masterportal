import {createStore} from "vuex";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";

import WfsSearchField from "@modules/wfsSearch/components/WfsSearchField.vue";
import WfsSearchModule from "@modules/wfsSearch/store/indexWfsSearch.js";

config.global.mocks.$t = key => key;

describe("src/modules/wfsSearch/components/WfsSearchField.vue", () => {
    let store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        WfsSearch: WfsSearchModule
                    }
                }
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
    });

    it("renders an input element with fitting label", () => {
        wrapper = mount(WfsSearchField, {
            global: {
                plugins: [store]
            },
            props: {
                fieldId: "fieldId",
                fieldName: "fieldName",
                inputLabel: "inputLabel"
            }
        });

        expect(wrapper.find("input").exists()).to.be.true;
        expect(wrapper.find("select").exists()).to.be.false;
        expect(wrapper.find("label").text()).to.equal("inputLabel");
    });

    it("renders a select element for the value when given options", () => {
        wrapper = mount(WfsSearchField, {
            global: {
                plugins: [store]
            },
            props: {
                fieldId: "fieldId",
                fieldName: "fieldName",
                inputLabel: "inputLabel",
                options: ["Option A", "Option B"]
            }
        });
        const options = wrapper.findAll("option");

        expect(wrapper.find("select").exists()).to.be.true;
        expect(wrapper.find("label").text()).to.equal("inputLabel");
        expect(wrapper.find("input").exists()).to.be.false;
        expect(options.at(0).text()).to.equal("common:modules.wfsSearch.optionsPlaceholder");
        expect(options.at(1).text()).to.equal("Option A");
        expect(options.at(2).text()).to.equal("Option B");
    });

    it("renders a label with string that contains '*'", () => {
        wrapper = mount(WfsSearchField, {
            global: {
                plugins: [store]
            },
            props: {
                fieldId: "fieldId",
                fieldName: "fieldName",
                inputLabel: "common:modules.wfsSearch.parcelNumber*"
            }
        });

        expect(wrapper.find("label").exists()).to.be.true;
        expect(wrapper.find("label").text()).to.equals("common:modules.wfsSearch.parcelNumber*");
    });

    describe("reset fields", () => {

        beforeEach(() => {
            store.commit("Modules/WfsSearch/setParsedSource", {
                Gemarkung1: {
                    id: "1",
                    fln: [
                        {
                            id: "11"
                        }]
                },
                Gemarkung2: {
                    id: "2",
                    fln: [
                        {
                            id: "22"
                        },
                        {
                            id: "11"
                        }
                    ]
                }
            });
        });

        it("reset value if options changed - options and fieldName are equals in 2. literal", async () => {
            store.commit("Modules/WfsSearch/setInstances", [{currentInstance: {addedOptions: ["", "fln"]},
                literals: [
                    {
                        clause: {
                            type: "and",
                            literals: [
                                {
                                    field: {
                                        "fieldName": "gmk",
                                        "inputLabel": "Gemarkung",
                                        "required": true,
                                        "options": "",
                                        "usesId": true,
                                        "queryType": "equal"
                                    }
                                },
                                {
                                    "field": {
                                        "fieldName": "fln",
                                        "inputLabel": "Flurnummer",
                                        "required": true,
                                        "options": "fln",
                                        "queryType": "equal"
                                    }
                                }
                            ]
                        }
                    }
                ]}]);

            wrapper = mount(WfsSearchField, {
                global: {
                    plugins: [store]
                },
                props: {
                    fieldId: "fieldId",
                    fieldName: "fln",
                    inputLabel: "common:modules.wfsSearch.parcelNumber*",
                    options: "fln",
                    parameterIndex: 0
                }
            });

            store.commit("Modules/WfsSearch/setSelectedOptions", {
                options: "",
                index: 0,
                value: "1"
            });

            await wrapper.vm.valueChanged("{\"value\":\"11\",\"index\":0}");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.value).to.equals("11");
            store.commit("Modules/WfsSearch/setSelectedOptions", {
                options: "",
                index: 1,
                value: "2"
            });
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.value).to.equals(undefined);
        });

        it("reset value if options are not same than fieldName in 2. literal", async () => {
            store.commit("Modules/WfsSearch/setInstances", [{currentInstance: {addedOptions: ["", "fln"]},
                literals: [
                    {
                        clause: {
                            type: "and",
                            literals: [
                                {
                                    field: {
                                        "fieldName": "gmk",
                                        "inputLabel": "Gemarkung",
                                        "required": true,
                                        "options": "",
                                        "usesId": true,
                                        "queryType": "equal"
                                    }
                                },
                                {
                                    "field": {
                                        "fieldName": "FLN",
                                        "inputLabel": "Flurnummer",
                                        "required": true,
                                        "options": "fln",
                                        "queryType": "equal"
                                    }
                                }
                            ]
                        }
                    }
                ]}]);

            wrapper = mount(WfsSearchField, {
                global: {
                    plugins: [store]
                },
                props: {
                    fieldId: "fieldId",
                    fieldName: "fln",
                    inputLabel: "common:modules.wfsSearch.parcelNumber*",
                    options: "fln",
                    parameterIndex: 0
                }
            });

            store.commit("Modules/WfsSearch/setSelectedOptions", {
                options: "",
                index: 0,
                value: "1"
            });

            await wrapper.vm.valueChanged("{\"value\":\"11\",\"index\":0}");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.value).to.equals("11");
            store.commit("Modules/WfsSearch/setSelectedOptions", {
                options: "",
                index: 1,
                value: "2"
            });
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.value).to.equals(undefined);
        });
    });
});
