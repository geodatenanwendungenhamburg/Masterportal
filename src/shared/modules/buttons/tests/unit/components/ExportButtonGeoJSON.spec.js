import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ExportButtonGeoJSON from "@shared/modules/buttons/components/ExportButtonGeoJSON.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/buttons/components/exportButtonGeoJSON.vue", () => {
    before(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });
    it("createFilename", () => {
        const wrapper = shallowMount(ExportButtonGeoJSON, {
            propsData: {}
        });

        expect(wrapper.vm.createFilename("prefix", "YYYY")).to.equal("prefix" + String(new Date().getFullYear()));
    });
    it("template", () => {
        const wrapper = shallowMount(ExportButtonGeoJSON, {
            propsData: {}
        });

        expect(wrapper.find("button").exists()).to.be.true;
    });
});
