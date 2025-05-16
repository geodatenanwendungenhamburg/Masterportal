import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolCameraReset from "../../../../components/tools/ToolCameraReset.vue";
import IconButton from "../../../../../../shared/modules/buttons/components/IconButton.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolCameraReset.vue", () => {
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
                                ToolCameraReset: {
                                    namespaced: true,
                                    actions: {
                                        reset: sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolCameraReset, {
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

        expect(wrapper.find("div.ToolCameraReset").exists()).to.be.true;
        expect(wrapper.find("button").exists()).to.be.true;
        expect(wrapper.find("i").exists()).to.be.true;
    });

    it("renders the button with the correct title", () => {
        const button = wrapper.find("button");

        expect(button.attributes("title")).to.equal("modules.bimViewer.tools.resetCamera");
    });

    it("renders the correct icon", () => {
        const icon = wrapper.find("i");

        expect(icon.classes()).to.include("bi-house");
    });

    it("dispatches 'reset' action when the button is clicked", async () => {
        const dispatchStub = sinon.stub(store, "dispatch"),
            button = wrapper.find("button");

        await button.trigger("click");

        expect(dispatchStub.calledWith("Modules/BimViewer/ToolCameraReset/reset")).to.be.true;
    });
});

