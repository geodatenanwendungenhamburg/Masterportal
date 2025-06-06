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
                                refreshLoadedModelExtraSettings: sinon.stub()
                            },
                            mutations: {
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
            commitStub = sinon.stub(wrapper.vm.$store, "commit"),
            tabs = [
                {type: "models", id: "#tab-models", action: "Modules/BimViewer/refreshLoadedModelExtraSettings"},
                {type: "containment", id: "#tab-containment", mutation: "Modules/BimViewer/updateXeokitPluginTreeViewHierarchyType"},
                {type: "storeys", id: "#tab-storeys", mutation: "Modules/BimViewer/updateXeokitPluginTreeViewHierarchyType"},
                {type: "types", id: "#tab-types", mutation: "Modules/BimViewer/updateXeokitPluginTreeViewHierarchyType"}
            ];

        for (const tab of tabs) {
            await wrapper.find(tab.id).trigger("click");

            if (tab.type === "models") {
                expect(dispatchStub.calledWith(tab.action)).to.be.true;
            }
            else {
                expect(commitStub.calledWith(tab.mutation, tab.type)).to.be.true;
            }

            expect(wrapper.vm.activeTab).to.equal(tab.type);

            dispatchStub.resetHistory();
            commitStub.resetHistory();
        }

        dispatchStub.restore();
        commitStub.restore();
    });

    it("does not throw if setActiveTab is called with undefined", () => {
        const setActiveTab = wrapper.vm.setActiveTab;

        expect(() => setActiveTab(undefined)).to.not.throw();
    });
});
