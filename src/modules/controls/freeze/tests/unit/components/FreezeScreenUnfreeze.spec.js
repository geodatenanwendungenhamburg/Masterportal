import {config, mount} from "@vue/test-utils";
import {expect} from "chai";


import FreezeScreenUnfreeze from "@modules/controls/freeze/components/FreezeScreenUnfreeze.vue";

config.global.mocks.$t = key => key;

describe("src/modules/controls/freeze/components/FreezeScreenUnfreeze.vue", () => {

    beforeEach(() => {
        const app = document.createElement("div");

        app.id = "masterportal-container";
        if (document.body) {
            document.body.appendChild(app);
        }
    });

    it("renders the freeze-screen-unfreeze", () => {
        const wrapper = mount(FreezeScreenUnfreeze);

        expect(wrapper.find("#freeze-screen-unfreeze").exists()).to.be.true;
        expect(wrapper.findAll("p")).to.have.length(1);
    });

    it("should emit hideFreezeWin after click on p", async () => {
        const wrapper = mount(FreezeScreenUnfreeze);

        await wrapper.find("#freeze-screen-unfreeze > p").trigger("click");

        expect(wrapper.emitted("hideFreezeWin").length).to.equals(1);
    });
});
