import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolSceneReset from "../../../../components/tools/ToolSceneReset.vue";
import IconButton from "../../../../../../shared/modules/buttons/components/IconButton.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolSceneReset.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            modules: {
                                ToolSceneReset: {
                                    namespaced: true,
                                    actions: {
                                        resetScene: sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolSceneReset, {
            global: {
                plugins: [store],
                stubs: {
                    IconButton: IconButton
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        wrapper.unmount();
    });

    it("renders the component", async () => {
        expect(wrapper.exists()).to.be.true;

        await wrapper.vm.$nextTick();

        expect(wrapper.find("div.ToolSceneReset").exists()).to.be.true;
        expect(wrapper.find("button").exists()).to.be.true;
        expect(wrapper.find("i").exists()).to.be.true;
    });

    it("renders the button with the correct title", () => {
        const button = wrapper.find("button");

        expect(button.attributes("title")).to.equal("modules.bimViewer.tools.resetScene");
    });

    it("renders the correct icon", () => {
        const icon = wrapper.find("i");

        expect(icon.classes()).to.include("bi-house");
    });

    it("dispatches 'resetScene' action when the button is clicked", async () => {
        const dispatchStub = sinon.stub(store, "dispatch"),
            button = wrapper.find("button");

        await button.trigger("click");

        expect(dispatchStub.calledWith("Modules/BimViewer/ToolSceneReset/resetScene")).to.be.true;
    });
});

