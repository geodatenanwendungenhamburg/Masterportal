import {createStore} from "vuex";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";

import WfsSearchField from "@modules/wfsSearch/components/WfsSearchField.vue";
import WfsSearchModule from "@modules/wfsSearch/store/indexWfsSearch.js";

config.global.mocks.$t = key => key;

describe("src/modules/wfsSearch/components/WfsSearchField.vue", () => {
    let store;

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

    it("renders an input element with fitting label", () => {
        const wrapper = mount(WfsSearchField, {
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
        const wrapper = mount(WfsSearchField, {
                global: {
                    plugins: [store]
                },
                props: {
                    fieldId: "fieldId",
                    fieldName: "fieldName",
                    inputLabel: "inputLabel",
                    options: ["Option A", "Option B"]
                }
            }),
            options = wrapper.findAll("option");

        expect(wrapper.find("select").exists()).to.be.true;
        expect(wrapper.find("label").text()).to.equal("inputLabel");
        expect(wrapper.find("input").exists()).to.be.false;
        expect(options.at(0).text()).to.equal("common:modules.wfsSearch.optionsPlaceholder");
        expect(options.at(1).text()).to.equal("Option A");
        expect(options.at(2).text()).to.equal("Option B");
    });

    it("renders a label with string that contains '*'", () => {
        const wrapper = mount(WfsSearchField, {
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

    it("reset value if options changed", async () => {
        store.commit("Modules/WfsSearch/setResults", []);
        store.commit("Modules/WfsSearch/setInstances", [{currentInstance: {addedOptions: ["", "fln"]},
            literals: [
                {
                    clause: {
                        type: "and",
                        literals: [
                            {
                                field: {
                                    "id": "gmk",
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
                                    "id": "fln",
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

        const wrapper = mount(WfsSearchField, {
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
