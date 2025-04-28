import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import LeftSidebar from "../../../../components/sidebar/LeftSidebar.vue";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/sidebar/LeftSidebar.spec.js", () => {
    let wrapper;

    it("renders the base component", async () => {
        wrapper = shallowMount(LeftSidebar);

        expect(wrapper.find("div.LeftSidebar").exists()).to.be.true;
    });
});
