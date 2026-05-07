import sinon from "sinon";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";


describe("src/shared/components/IconButton.vue", () => {
    let interactionSpy;

    beforeEach(() => {
        interactionSpy = sinon.spy();
    });


    it("should render a button with only an icon and trigger the given interaction on click", () => {
        const iconString = "bi-list",
            wrapper = mount(IconButton, {
                propsData: {interaction: interactionSpy, icon: iconString, aria: "Bla bla"}
            }),
            button = wrapper.find("button"),
            icon = button.find("i");

        expect(button.exists()).to.be.true;
        expect(button.classes()).to.eql(["btn", "d-flex", "align-items-center", "justify-items-center", "mb-auto"]);
        expect(button.attributes("type")).to.equal("button");
        expect(icon.exists()).to.be.true;
        expect(icon.classes()).to.eql([iconString]);
        expect(icon.attributes("role")).to.equal("img");

        button.trigger("click");

        expect(interactionSpy.calledOnce).to.be.true;
    });
    it("should render a button with label", () => {
        const iconString = "bi-list",
            wrapper = mount(IconButton, {
                propsData: {interaction: interactionSpy, icon: iconString, aria: "Bla bla", label: "blabel"}
            }),
            btnLabel = wrapper.find(".btn-label");

        expect(btnLabel.exists()).to.be.true;
    });
    it("should render a button without label", () => {
        const iconString = "bi-list",
            wrapper = mount(IconButton, {
                propsData: {interaction: interactionSpy, icon: iconString, aria: "Bla bla"}
            }),
            btnLabel = wrapper.find(".btn-label");

        expect(btnLabel.exists()).to.be.false;
    });
    it("should render a button with correct label", () => {
        const iconString = "bi-list",
            wrapper = mount(IconButton, {
                propsData: {interaction: interactionSpy, icon: iconString, aria: "Bla bla", label: "der button label"}
            });

        expect(wrapper.find(".btn-label").text()).to.equal("der button label");
    });
    it("should emit click event when button is clicked", () => {
        const iconString = "bi-list",
            wrapper = mount(IconButton, {
                propsData: {interaction: interactionSpy, icon: iconString, aria: "Bla bla"}
            }),
            button = wrapper.find("button");

        button.trigger("click");

        expect(wrapper.emitted("click")).to.exist;
        expect(wrapper.emitted("click")).to.have.lengthOf(1);
    });
    it("should call both interaction prop and emit click event", () => {
        const iconString = "bi-list",
            wrapper = mount(IconButton, {
                propsData: {interaction: interactionSpy, icon: iconString, aria: "Bla bla"}
            }),
            button = wrapper.find("button");

        button.trigger("click");

        expect(interactionSpy.calledOnce).to.be.true;
        expect(wrapper.emitted("click")).to.have.lengthOf(1);
    });
});
