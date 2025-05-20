import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolObjectInfo from "../../../../components/tools/ToolObjectInfo.vue";
import IconButton from "../../../../../../shared/modules/buttons/components/IconButton.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolObjectInfo.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            state: () => ({
                                xeokitViewer: null
                            }),
                            getters: {
                                xeokitViewer: state => state.xeokitViewer
                            },
                            modules: {
                                ToolObjectInfo: {
                                    namespaced: true,
                                    state: () => ({
                                        modeObjectInfoActive: false,
                                        pickedObjectId: null
                                    }),
                                    getters: {
                                        modeObjectInfoActive: state => state.modeObjectInfoActive,
                                        pickedObjectId: state => state.pickedObjectId
                                    },
                                    actions: {
                                        initialize: sinon.stub(),
                                        reset: sinon.stub()
                                    },
                                    mutations: {
                                        setModeObjectInfoActive: (state, val) => {
                                            state.modeObjectInfoActive = val;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolObjectInfo, {
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

    it("renders the base component", () => {
        expect(wrapper.exists()).to.be.true;

        expect(wrapper.find("div.ToolObjectInfo").exists()).to.be.true;
    });

    it("toggles modeObjectInfoActive when setActive is called", async () => {
        const commitStub = sinon.stub(store, "commit"),
            dispatchStub = sinon.stub(store, "dispatch");

        await wrapper.vm.setActive();

        expect(commitStub.calledWith("Modules/BimViewer/ToolObjectInfo/setModeObjectInfoActive", true)).to.be.true;
        expect(dispatchStub.calledWith("Modules/BimViewer/ToolObjectInfo/reset")).to.be.true;

        commitStub.restore();
    });

    it("renders the button with correct classes based on modeObjectInfoActive state", async () => {
        store.commit("Modules/BimViewer/ToolObjectInfo/setModeObjectInfoActive", true);
        await wrapper.vm.$nextTick();
        let button = wrapper.find("button");

        expect(button.classes()).to.include("bim-btn-highlight");

        store.commit("Modules/BimViewer/ToolObjectInfo/setModeObjectInfoActive", false);
        await wrapper.vm.$nextTick();
        button = wrapper.find("button");

        expect(button.classes()).to.not.include("bim-btn-highlight");
    });

    it("does not call reset if modeObjectInfoActive is already false", async () => {
        const dispatchStub = sinon.stub(store, "dispatch").resolves();

        store.commit("Modules/BimViewer/ToolObjectInfo/setModeObjectInfoActive", false);
        await wrapper.vm.$nextTick();

        expect(dispatchStub.calledWith("Modules/BimViewer/ToolObjectInfo/reset")).to.be.false;

        dispatchStub.restore();
    });
});
