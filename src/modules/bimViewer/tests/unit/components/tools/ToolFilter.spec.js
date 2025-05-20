import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolFilter from "../../../../components/tools/ToolFilter.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolFilter.vue", () => {
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
                                ToolFilter: {
                                    namespaced: true,
                                    actions: {
                                        filterIfcMetaObjects: sinon.stub().resolves([]),
                                        resetHighlighting: sinon.stub(),
                                        setHighlighting: sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.stub()
                    }
                }
            }
        });

        wrapper = shallowMount(ToolFilter, {
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
        expect(wrapper.find("div.ToolFilter").exists()).to.be.true;
    });

    it("dispatches 'filterIfcMetaObjects', 'addSingleAlert' and 'setHighlighting' when filterSubmit is called with matching objects", async () => {
        const dispatchStub = sinon.stub(store, "dispatch").callsFake((action) => {
            if (action === "Modules/BimViewer/ToolFilter/filterIfcMetaObjects") {
                return Promise.resolve(["object1", "object2"]);
            }
            return Promise.resolve();
        });

        wrapper.setData({filterText: "test"});
        await wrapper.vm.filterSubmit();

        expect(dispatchStub.calledWith("Modules/BimViewer/ToolFilter/filterIfcMetaObjects", {filterText: "test"})).to.be.true;
        expect(dispatchStub.calledWith("Modules/BimViewer/ToolFilter/setHighlighting", {matchedObjects: ["object1", "object2"]})).to.be.true;
        expect(dispatchStub.calledWith("Alerting/addSingleAlert", sinon.match.object)).to.be.true;
    });

    it("dispatches 'resetHighlighting' when filterSubmit is called with an empty filterText", async () => {
        const resetHighlightingStub = sinon.stub(store, "dispatch");

        wrapper.setData({filterText: ""});
        await wrapper.vm.filterSubmit();

        expect(resetHighlightingStub.called).to.be.true;
    });

    it("dispatches 'resetHighlighting' when filterReset is called", async () => {
        const resetHighlightingStub = sinon.stub(store, "dispatch").withArgs("Modules/BimViewer/ToolFilter/resetHighlighting");

        wrapper.vm.filterReset();

        expect(resetHighlightingStub.called).to.be.true;
        expect(wrapper.vm.filterText).to.equal("");
    });

    it("renders the input field with the correct placeholder", () => {
        const input = wrapper.find("input");

        expect(input.attributes("placeholder")).to.equal("modules.bimViewer.tools.searchInputPlaceholder");
    });

    it("renders the reset button when filterText is not empty", async () => {
        wrapper.setData({filterText: "test"});

        await wrapper.vm.$nextTick();

        const resetButton = wrapper.find("button.btn-reset");

        expect(resetButton.exists()).to.be.true;
    });

    it("does not render the reset button when filterText is empty", async () => {
        wrapper.setData({filterText: ""});

        await wrapper.vm.$nextTick();

        const resetButton = wrapper.find("button.btn-reset");

        expect(resetButton.exists()).to.be.false;
    });

    it("renders the submit button with the correct title", () => {
        const submitButton = wrapper.find("button.btn-primary");

        expect(submitButton.attributes("title")).to.equal("modules.bimViewer.tools.searchButtonSubmit");
    });
});
