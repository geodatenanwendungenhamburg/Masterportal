import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolSceneFit from "../../../../components/tools/ToolSceneFit.vue";
import IconButton from "../../../../../../shared/modules/buttons/components/IconButton.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolSceneFit.vue", () => {
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
                                ToolSceneFit: {
                                    namespaced: true,
                                    actions: {
                                        fit: sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolSceneFit, {
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

    it("renders the component with correct classes", () => {
        const button = wrapper.find("button"),
            icon = wrapper.find("i");

        expect(wrapper.exists()).to.be.true;

        expect(wrapper.find("div.ToolSceneFit").exists()).to.be.true;

        expect(button.attributes("title")).to.equal("modules.bimViewer.tools.fitScene");

        expect(icon.classes()).to.include("bi-aspect-ratio");
    });

    it("dispatches 'fit' action when the button is clicked", async () => {
        const dispatchStub = sinon.stub(store, "dispatch"),
            button = wrapper.find("button");

        await button.trigger("click");

        expect(dispatchStub.calledWith("Modules/BimViewer/ToolSceneFit/fit")).to.be.true;
    });
});
