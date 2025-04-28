import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import RightSidebar from "../../../../components/sidebar/RightSidebar.vue";

describe("src/modules/bimViewer/tests/unit/components/sidebar/RightSidebar.spec.js", () => {
    let wrapper;

    it("renders the base component", async () => {
        wrapper = shallowMount(RightSidebar);

        expect(wrapper.find("div.RightSidebar").exists()).to.be.true;
    });
});
