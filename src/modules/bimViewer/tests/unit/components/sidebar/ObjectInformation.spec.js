import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ObjectInformation from "../../../../components/sidebar/ObjectInformation.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/sidebar/ObjectInformation.spec.js", () => {
    let
        store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            getters: {},
                            mutations: {},
                            actions: {},
                            state: {}
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders the base component", async () => {
        wrapper = shallowMount(ObjectInformation, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("div.ObjectInformation").exists()).to.be.true;
    });
});
