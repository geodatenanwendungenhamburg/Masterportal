import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolMeasurements from "../../../../components/tools/ToolMeasurements.vue";
import IconButton from "../../../../../../shared/modules/buttons/components/IconButton.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolMeasurements.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            actions: {
                                "ToolMeasurements/toggle": sinon.stub(),
                                "ToolMeasurements/clear": sinon.stub(),
                                "ToolObjectInfo/reset": sinon.stub()
                            },
                            state: {}
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolMeasurements, {
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
        expect(wrapper.find("div.ToolMeasurements").exists()).to.be.true;
    });

    it("toggles toolDistanceMeasurementsActive when setActive is called", async () => {
        const toggleStub = sinon.stub(store, "dispatch");

        wrapper.vm.setActive(true);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.toolDistanceMeasurementsActive).to.be.true;
        expect(toggleStub.calledWith("Modules/BimViewer/ToolMeasurements/toggle")).to.be.true;

        wrapper.vm.setActive(false);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.toolDistanceMeasurementsActive).to.be.false;
        expect(toggleStub.calledWith("Modules/BimViewer/ToolMeasurements/toggle")).to.be.true;

        toggleStub.restore();
    });

    it("calls reset action when setActive is called with true", async () => {
        const resetStub = sinon.stub(store, "dispatch").withArgs("Modules/BimViewer/ToolObjectInfo/reset");

        wrapper.vm.setActive(true);
        await wrapper.vm.$nextTick();

        expect(resetStub.calledWith("Modules/BimViewer/ToolObjectInfo/reset")).to.be.true;
    });

    it("does not call reset action when setActive is called with false", async () => {
        const resetSpy = sinon.spy(store.dispatch);

        wrapper.vm.setActive(false);

        expect(resetSpy.calledWith("Modules/BimViewer/ToolObjectInfo/reset")).to.be.false;
    });

    it("calls clear action when clear is called", async () => {
        const clearSpy = sinon.stub(store, "dispatch").withArgs("Modules/BimViewer/ToolMeasurements/clear");

        wrapper.vm.clear();

        expect(clearSpy.calledWith("Modules/BimViewer/ToolMeasurements/clear")).to.be.true;
    });

    it("renders the toggle button with the correct class when toolDistanceMeasurementsActive is true", async () => {
        wrapper.vm.toolDistanceMeasurementsActive = true;
        await wrapper.vm.$nextTick();

        const toggleButton = wrapper.find("button.btn-primary");

        expect(toggleButton.classes()).to.include("bim-btn-highlight");
    });

    it("renders the toggle button with the correct class when toolDistanceMeasurementsActive is false", async () => {
        wrapper.vm.toolDistanceMeasurementsActive = false;
        await wrapper.vm.$nextTick();
        const toggleButton = wrapper.find("button.btn-primary");

        expect(toggleButton.classes()).to.not.include("bim-btn-highlight");
    });

    it("renders the reset button when toolDistanceMeasurementsActive is true", async () => {
        wrapper.vm.toolDistanceMeasurementsActive = true;
        await wrapper.vm.$nextTick();
        const resetButton = wrapper.find("button.resetButton");

        expect(resetButton.exists()).to.be.true;
    });

    it("does not render the reset button when toolDistanceMeasurementsActive is false", async () => {
        wrapper.vm.toolDistanceMeasurementsActive = false;
        await wrapper.vm.$nextTick();
        const resetButton = wrapper.find("button.resetButton");

        expect(resetButton.exists()).to.be.false;
    });

    it("throws an error if setActive is called without a boolean value", () => {
        expect(() => wrapper.vm.setActive(null)).to.throw();
        expect(() => wrapper.vm.setActive(undefined)).to.throw();
        expect(() => wrapper.vm.setActive("string")).to.throw();
    });

    it("does not throw an error if clear is called without any parameters", () => {
        expect(() => wrapper.vm.clear()).to.not.throw();
    });
});
