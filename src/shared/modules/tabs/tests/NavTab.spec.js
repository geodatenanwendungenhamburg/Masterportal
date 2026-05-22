import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/tabs/components/NavTab.vue", () => {

    const factory = {
        getShallowMount: (props = {}) => {
            return shallowMount(NavTab, {
                props: {
                    id: "nav-tab-1",
                    label: "Test Tab",
                    active: true,
                    target: "#section-1",
                    ...props
                }
            });
        }
    };

    it("should not render an icon if the icon prop is not set", () => {
        const wrapper = factory.getShallowMount(),
            iconWrapper = wrapper.find("i");

        expect(iconWrapper.exists()).to.be.false;
    });

    it("should render an icon if the icon prop is set", () => {
        const wrapper = factory.getShallowMount({icon: "bi-geo-alt"}),
            iconWrapper = wrapper.find("i");

        expect(iconWrapper.exists()).to.be.true;
        expect(iconWrapper.classes()).to.include("bi-geo-alt");
        expect(iconWrapper.classes()).to.include("bi");
        expect(iconWrapper.classes()).to.include("me-2");
    });
});
