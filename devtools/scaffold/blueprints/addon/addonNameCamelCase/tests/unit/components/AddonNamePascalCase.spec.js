import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/AddonNamePascalCase.vue";

describe("addons/addonNameCamelCase/tests/unit/AddonNamePascalCase.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        AddonNamePascalCase: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should have showLoadingSpinner state set to false", () => {
        expect(store.state.Modules.AddonNamePascalCase.showLoadingSpinner).to.equal(false);
    });
});
