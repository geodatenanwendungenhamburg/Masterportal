import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import OrientationComponentChoice from "@modules/orientation/components/OrientationComponentChoice.vue";

describe("src/modules/orientation/components/OrientationComponentChoice.vue", () => {
    it("defaults to 'currentPosition' as selected mode", () => {
        const wrapper = shallowMount(OrientationComponentChoice);

        expect(wrapper.vm.selectedMode).to.equal("currentPosition");
    });

    it("provides radio options for both currentPosition and customPosition", () => {
        const wrapper = shallowMount(OrientationComponentChoice);

        expect(wrapper.vm.radioOptions).to.deep.equal([
            {label: "common:modules.orientation.currentPositionLabel", value: "currentPosition"},
            {label: "common:modules.orientation.customPositionLabel", value: "customPosition"}
        ]);
    });

    it("emits 'next' with the currently selected mode when handleNext is called", () => {
        const wrapper = shallowMount(OrientationComponentChoice);

        wrapper.vm.handleNext();

        expect(wrapper.emitted("next")).to.deep.equal([["currentPosition"]]);
    });

    it("emits the updated mode after selectedMode has changed", async () => {
        const wrapper = shallowMount(OrientationComponentChoice);

        wrapper.vm.selectedMode = "customPosition";
        await wrapper.vm.$nextTick();
        wrapper.vm.handleNext();

        expect(wrapper.emitted("next")).to.deep.equal([["customPosition"]]);
    });
});
