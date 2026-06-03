import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import LayoutFrameComponent from "../../../components/LayoutFrame.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/layoutFrame/components/LayoutFrame.vue", () => {
    let wrapper;

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    /**
     * Mounts the LayoutFrame component with the given props.
     * @param {Object} [propsData={}] - Additional props to pass.
     * @returns {Object} The wrapper instance.
     */
    function mountComponent (propsData = {}) {
        return shallowMount(LayoutFrameComponent, {
            props: propsData,
            slots: {
                default: "<span>test content</span>"
            }
        });
    }

    describe("Component rendering", () => {
        it("should render the component with default props", () => {
            wrapper = mountComponent();

            expect(wrapper.find("div").exists()).to.be.true;
        });

        it("should render slot content", () => {
            wrapper = mountComponent();

            expect(wrapper.find("span").text()).to.equal("test content");
        });
    });

    describe("CSS custom properties", () => {
        it("should set border-color to transparent when no borderColor prop is given", () => {
            wrapper = mountComponent();

            expect(wrapper.attributes("style")).to.include("--border-color: transparent");
        });

        it("should set border-color from the borderColor prop", () => {
            wrapper = mountComponent({borderColor: "#D6E3FF"});

            expect(wrapper.attributes("style")).to.include("--border-color: #D6E3FF");
        });

        it("should set background-color to transparent when no fill prop is given", () => {
            wrapper = mountComponent();

            expect(wrapper.attributes("style")).to.include("--background-color: transparent");
        });

        it("should set background-color from the fill prop", () => {
            wrapper = mountComponent({fill: "#fff"});

            expect(wrapper.attributes("style")).to.include("--background-color: #fff");
        });

        it("should default triangle-position to 50%", () => {
            wrapper = mountComponent();

            expect(wrapper.attributes("style")).to.include("--triangle-position: 50%");
        });

        it("should set triangle-position from the trianglePosition prop", () => {
            wrapper = mountComponent({trianglePosition: 120});

            expect(wrapper.attributes("style")).to.include("--triangle-position: 120px");
        });

        it("should handle trianglePosition of 0 correctly", () => {
            wrapper = mountComponent({trianglePosition: 0});

            expect(wrapper.attributes("style")).to.include("--triangle-position: 0px");
        });
    });

    describe("Triangle class", () => {
        it("should not have has-triangle class by default", () => {
            wrapper = mountComponent();

            expect(wrapper.classes()).to.not.include("has-triangle");
        });

        it("should have has-triangle class when triangle prop is true", () => {
            wrapper = mountComponent({triangle: true});

            expect(wrapper.classes()).to.include("has-triangle");
        });

        it("should not have has-triangle class when triangle prop is false", () => {
            wrapper = mountComponent({triangle: false});

            expect(wrapper.classes()).to.not.include("has-triangle");
        });
    });
});
