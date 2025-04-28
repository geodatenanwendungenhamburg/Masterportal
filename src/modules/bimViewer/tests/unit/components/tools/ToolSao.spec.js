import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolSao from "../../../../components/tools/ToolSao.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolSao.vue", () => {
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
        wrapper = shallowMount(ToolSao, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("div.ToolSao").exists()).to.be.true;
    });
});
