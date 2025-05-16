import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";
import ToolDownloadBCF from "../../../../components/tools/ToolDownloadBCF.vue";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolDownloadBCF.vue", () => {
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
        wrapper = shallowMount(ToolDownloadBCF, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("div.ToolDownloadBCF").exists()).to.be.true;
    });
});
