import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/accordion/components/AccordionItem.vue", () => {

    const title = "My Title",
        iconString = "bi-list";

    it("should render an accordion", async () => {
        const wrapper = mount(AccordionItem, {
                props: {id: "id", title, icon: iconString}
            }),
            accordion = wrapper.find(".accordion");

        expect(accordion.exists()).to.be.true;
    });
    it("should render a title", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id", title, icon: iconString}
        });

        expect(wrapper.find(".accordion-button").text()).to.be.equal("My Title");
    });
    it("should render an icon", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id", title, icon: iconString}
        });

        expect(wrapper.find(".bi-list").exists()).to.be.true;
    });
    it("should be opened initially if isOpen is true", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id", title, icon: iconString, isOpen: true}
        });

        expect(wrapper.find(".show").exists()).to.be.true;
    });
    it("should be initially closed if isOpen is not set", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id", title, icon: iconString}
        });

        expect(wrapper.find(".show").exists()).to.be.false;
    });
    it("should render heading as div by default", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id-default-heading", title, icon: iconString}
        });

        const heading = wrapper.find("#flush-heading-id-default-heading");

        expect(heading.exists()).to.be.true;
        expect(heading.element.tagName).to.equal("DIV");
    });
    it("should apply ps-0 by default when colouredHeader and useIndentation are false", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id-padding-default", title, icon: iconString}
        });

        const button = wrapper.find(".accordion-button");

        expect(button.classes()).to.include("ps-0");
        expect(button.classes()).to.not.include("rounded");
    });
    it("should remove ps-0 when useIndentation is true", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id-padding-custom", title, icon: iconString, useIndentation: true}
        });

        const button = wrapper.find(".accordion-button");

        expect(button.classes()).to.not.include("rounded");
        expect(button.classes()).to.not.include("ps-0");
    });
    it("should apply rounded when colouredHeader is true", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id-padding-coloured", title, icon: iconString, colouredHeader: true}
        });

        const button = wrapper.find(".accordion-button");

        expect(button.classes()).to.include("rounded");
        expect(button.classes()).to.not.include("ps-0");
    });
    it("should apply rounded when colouredHeader is true even with useIndentation", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id-padding-coloured-indent", title, icon: iconString, colouredHeader: true, useIndentation: true}
        });

        const button = wrapper.find(".accordion-button");

        expect(button.classes()).to.include("rounded");
        expect(button.classes()).to.not.include("ps-0");
    });
    it("should use me-3 as default icon margin class", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id-icon-default-margin", title, icon: iconString}
        });

        const icon = wrapper.find(".bi-list");

        expect(icon.exists()).to.be.true;
        expect(icon.classes()).to.include("me-3");
    });
    it("should use configured iconMarginEnd class", async () => {
        const wrapper = mount(AccordionItem, {
            props: {id: "id-icon-custom-margin", title, icon: iconString, iconMarginEnd: "me-2"}
        });

        const icon = wrapper.find(".bi-list");

        expect(icon.exists()).to.be.true;
        expect(icon.classes()).to.include("me-2");
        expect(icon.classes()).to.not.include("me-3");
    });
    it("should render all heading levels (h1-h6)", async () => {
        const headingLevels = ["h1", "h2", "h3", "h4", "h5", "h6"];

        for (const level of headingLevels) {
            const wrapper = mount(AccordionItem, {
                props: {id: `id-heading-${level}`, title, icon: iconString, headingLevel: level}
            });

            const heading = wrapper.find(`#flush-heading-id-heading-${level}`);

            expect(heading.exists()).to.be.true;
            expect(heading.element.tagName).to.equal(level.toUpperCase());
        }
    });
    it("should warn for invalid headingLevel", async () => {
        const warnStub = sinon.stub(console, "warn");

        mount(AccordionItem, {
            props: {id: "id-invalid-heading", title, icon: iconString, headingLevel: "h7"}
        });

        expect(warnStub.called).to.be.true;
        warnStub.restore();
    });
});
