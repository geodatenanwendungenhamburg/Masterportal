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
        expect(wrapper.find(".ToolSceneSelector").exists()).to.be.true;
        expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.true;
    });

    it("renders the correct number of scenes in the dropdown when open", async () => {
        await wrapper.setData({dropdownVisible: true});
        await wrapper.vm.$nextTick();

        const items = wrapper.findAll("ul.custom-dropdown li");

        expect(items.length).to.equal(2);
        expect(items[0].find(".scene-link").text()).to.equal("Scene 1");
        expect(items[1].find(".scene-link").text()).to.equal("Scene 2");
    });
});
