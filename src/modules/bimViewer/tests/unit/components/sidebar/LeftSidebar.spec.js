import {config, mount} from "@vue/test-utils";
import {createStore} from "vuex";
import LeftSidebar from "../../../../components/sidebar/LeftSidebar.vue";
import sinon from "sinon";
import {expect} from "chai";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/sidebar/LeftSidebar.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            getters: {
                                loadedModels: () => []
                            },
                            actions: {
                                updateXeokitPluginTreeViewHierarchyType: sinon.stub()
                            }
                        }
                    }
                }
            }
        });

        wrapper = mount(LeftSidebar, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
        sinon.restore();
    });

    it("renders the base component", async () => {
        expect(wrapper.find("div.LeftSidebar").exists()).to.be.true;
    });

    it("calls setActiveTab and dispatches the correct action when any tab is clicked", async () => {
        const dispatchStub = sinon.stub(wrapper.vm.$store, "dispatch"),
            tabs = [
                {type: "models", id: "#tab-models", action: "Modules/BimViewer/resetLoadedModelExtraSettings"},
                {type: "containment", id: "#tab-containment", action: "Modules/BimViewer/updateXeokitPluginTreeViewHierarchyType"},
                {type: "storeys", id: "#tab-storeys", action: "Modules/BimViewer/updateXeokitPluginTreeViewHierarchyType"},
                {type: "types", id: "#tab-types", action: "Modules/BimViewer/updateXeokitPluginTreeViewHierarchyType"}
            ];

        for (const tab of tabs) {
            await wrapper.find(tab.id).trigger("click");

            if (tab.type === "models") {
                expect(dispatchStub.calledWith(tab.action)).to.be.true;
            }
            else {
                expect(dispatchStub.calledWith(tab.action, tab.type)).to.be.true;
            }

            expect(wrapper.vm.activeTab).to.equal(tab.type);

            dispatchStub.resetHistory();
        }

        dispatchStub.restore();
    });

    it("does not throw if setActiveTab is called with undefined", () => {
        const setActiveTab = wrapper.vm.setActiveTab;

        expect(() => setActiveTab(undefined)).to.not.throw();
    });
});
