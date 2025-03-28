import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import FlatButton from "../../../components/FlatButton.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/shared/components/FlatButton.vue", () => {

    const factory = {
        getShallowMount: (props = {}) => {
            return shallowMount(FlatButton, {
                props: {
                    text: "The cool flat button",
                    ...props
                }
            });
        }
    };

    it("should render the component with the required/default props", () => {
        const wrapper = factory.getShallowMount();

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.text()).to.be.equal("The cool flat button");
        expect(wrapper.classes()).to.eql(["flat-button", "btn", "btn-secondary", "d-flex", "align-items-center", "mb-3"]);
        expect(wrapper.attributes("type")).to.equal("button");
        expect(wrapper.findComponent({name: "spinner-item-stub"}).exists()).to.be.false;
        expect(wrapper.find("i").exists()).to.be.false;
    });


    it("should render the component with an icon", () => {
        const wrapper = factory.getShallowMount({icon: "bi-list"}),
            iconWrapper = wrapper.find("i");

        expect(iconWrapper.exists()).to.be.true;
        expect(iconWrapper.classes()).to.eql(["bi-list"]);
        expect(iconWrapper.attributes("role")).to.equal("img");
    });

    it("should render the component without an icon if icon is passed but the spinner is set to true", () => {
        const wrapper = factory.getShallowMount({icon: "bi-list", spinnerTrigger: true}),
            iconWrapper = wrapper.find("i");

        expect(iconWrapper.exists()).to.be.false;
    });

    it("should render the spinner component if spinner is set to true", () => {
        const wrapper = factory.getShallowMount({spinnerTrigger: true}),
            spinnerWrapper = wrapper.findComponent({name: "spinner-item-stub"});

        expect(spinnerWrapper.exists()).to.be.false;
    });

    it("should call the passed interaction on click", async () => {
        const interactionSpy = sinon.spy(),
            wrapper = factory.getShallowMount({interaction: interactionSpy});

        await wrapper.trigger("click");

        expect(interactionSpy.calledOnce).to.be.true;
        sinon.restore;
    });
});
