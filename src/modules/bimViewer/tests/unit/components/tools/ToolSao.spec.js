import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolSao from "../../../../components/tools/ToolSao.vue";
import IconButton from "../../../../../../shared/modules/buttons/components/IconButton.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolSao.vue", () => {
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
                                ToolSao: {
                                    namespaced: true,
                                    state: () => ({
                                        saoStatus: null
                                    }),
                                    getters: {
                                        saoStatus: state => state.saoStatus
                                    },
                                    actions: {
                                        setSaoSettings: sinon.stub()
                                    },
                                    mutations: {
                                        setSaoStatus: (state, payload) => {
                                            state.saoStatus = payload;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolSao, {
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

    it("renders the component", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.find("div.ToolSao").exists()).to.be.true;
        expect(wrapper.find("button").exists()).to.be.true;
        expect(wrapper.find("i").exists()).to.be.true;
    });

    it("shows the correct aria-label when SAO is enabled", async () => {
        store.commit("Modules/BimViewer/ToolSao/setSaoStatus", true);
        await wrapper.vm.$nextTick();

        expect(wrapper.find("button").attributes("aria-label")).to.equal(
            "modules.bimViewer.tools.saoAriaLabelOn"
        );
    });

    it("shows the correct aria-label when SAO is disabled", async () => {
        store.commit("Modules/BimViewer/ToolSao/setSaoStatus", false);
        await wrapper.vm.$nextTick();

        expect(wrapper.find("button").attributes("aria-label")).to.equal(
            "modules.bimViewer.tools.saoAriaLabelOff"
        );
    });

    it("applies the correct button class when SAO is enabled", async () => {
        const button = wrapper.find("button");

        store.commit("Modules/BimViewer/ToolSao/setSaoStatus", true);
        await wrapper.vm.$nextTick();

        expect(button.classes()).to.include("bim-btn-highlight");
    });

    it("applies the correct button class when SAO is disabled", async () => {
        const button = wrapper.find("button");

        store.commit("Modules/BimViewer/ToolSao/setSaoStatus", false);
        await wrapper.vm.$nextTick();

        expect(button.classes()).to.not.include("bim-btn-highlight");
    });

    it("dispatches 'setSaoSettings' with correct payload when button is clicked", async () => {
        const dispatchStub = sinon.stub(store, "dispatch"),
            button = wrapper.find("button");

        store.commit("Modules/BimViewer/ToolSao/setSaoStatus", false);
        await wrapper.vm.$nextTick();
        await button.trigger("click");

        expect(dispatchStub.calledWith("Modules/BimViewer/ToolSao/setSaoSettings", {enabled: true})).to.be.true;
    });

    it("does not dispatch 'setSaoSettings' when button is disabled", async () => {
        const button = wrapper.find("button");

        store.getters["Modules/BimViewer/ToolSao/saoStatus"] = null; // Not supported
        await wrapper.vm.$nextTick();
        await button.trigger("click");

        expect(sinon.stub().called).to.be.false;
    });

    it("renders the correct icon when SAO is enabled", async () => {
        const icon = wrapper.find("i");

        store.commit("Modules/BimViewer/ToolSao/setSaoStatus", true);
        await wrapper.vm.$nextTick();

        expect(icon.classes()).to.include("bi-lightbulb");
    });

    it("renders the correct icon when SAO is disabled", async () => {
        const icon = wrapper.find("i");

        store.getters["Modules/BimViewer/ToolSao/saoStatus"] = false;
        await wrapper.vm.$nextTick();

        expect(icon.classes()).to.include("bi-lightbulb-off");
    });

    it("renders the correct icon when SAO is not supported", async () => {
        const icon = wrapper.find("i");

        store.getters["Modules/BimViewer/ToolSao/saoStatus"] = null;
        await wrapper.vm.$nextTick();

        expect(icon.classes()).to.include("bi-lightbulb-off");
    });
});
