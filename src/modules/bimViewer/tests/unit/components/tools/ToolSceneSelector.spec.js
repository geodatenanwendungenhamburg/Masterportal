import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolSceneSelector from "../../../../components/tools/ToolSceneSelector.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolSceneSelector.vue", () => {
    let store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            state: {
                                sceneConfigs: [
                                    {id: 1, name: "Scene 1"},
                                    {id: 2, name: "Scene 2"}
                                ]
                            },
                            getters: {
                                sceneConfigs: (state) => state.sceneConfigs
                            },
                            mutations: {
                                setSceneConfigs: (state, payload) => {
                                    state.sceneConfigs = payload;
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolSceneSelector, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        wrapper.unmount();
    });

    it("renders the component", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.find("select.ToolSceneSelector").exists()).to.be.true;
    });

    it("renders the correct number of options based on sceneConfigs", () => {
        const options = wrapper.findAll("option");

        expect(options.length).to.equal(2);

        expect(options[0].text()).to.equal("Scene 1");
        expect(options[1].text()).to.equal("Scene 2");
    });

    it("does not render the select element if there is only one sceneConfig", async () => {
        store.commit("Modules/BimViewer/setSceneConfigs", [{id: 1, name: "Scene 1"}]);
        await wrapper.vm.$nextTick();

        expect(wrapper.find("select.ToolSceneSelector").exists()).to.be.false;
    });
});
