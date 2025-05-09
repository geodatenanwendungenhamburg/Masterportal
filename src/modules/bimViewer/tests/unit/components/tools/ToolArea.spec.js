import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolArea from "../../../../components/tools/ToolArea.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolArea.vue", () => {
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
        wrapper = shallowMount(ToolArea, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("div.ToolArea").exists()).to.be.true;
    });
});
