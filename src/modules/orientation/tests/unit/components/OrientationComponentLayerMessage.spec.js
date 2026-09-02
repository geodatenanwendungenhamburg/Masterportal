import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import OrientationComponentLayerMessage from "@modules/orientation/components/OrientationComponentLayerMessage.vue";

describe("src/modules/orientation/components/OrientationComponentLayerMessage.vue", () => {
    it("renders the layer selection hint text", () => {
        const wrapper = shallowMount(OrientationComponentLayerMessage);

        expect(wrapper.text()).to.include("VectorLayer");
    });

    it("does not render any interactive controls", () => {
        const wrapper = shallowMount(OrientationComponentLayerMessage);

        expect(wrapper.findAll("button")).to.have.lengthOf(0);
    });
});
