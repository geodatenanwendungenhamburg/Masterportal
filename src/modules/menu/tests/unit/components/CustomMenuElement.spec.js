import {createPinia, setActivePinia} from "pinia";
import {mount} from "@vue/test-utils";
import axios from "axios";
import CustomMenuElement from "@modules/menu/components/CustomMenuElement.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";
import {expect} from "chai";
import sinon from "sinon";
import visibilityChecker from "@shared/js/utils/visibilityChecker.js";


describe("src/modules/menu/components/CustomMenuElement.vue", () => {
    let pinia,
        menuStore,
        wrapper,
        side,
        htmlContent,
        errorSpy,
        currentComponentProps,
        isModuleVisible;

    beforeEach(() => {
        side = "mainMenu";
        isModuleVisible = true;
        sinon.stub(visibilityChecker, "isModuleVisible").callsFake(() => {
            return isModuleVisible;
        });
        currentComponentProps = {
            htmlContent: undefined,
            pathToContent: undefined,
            mapMode: undefined,
            deviceMode: undefined
        };
        pinia = createPinia();
        setActivePinia(pinia);
        menuStore = useMenuStore();
        menuStore.mainMenu.navigation.currentComponent = {
            type: "customMenuElement",
            props: currentComponentProps
        };
        htmlContent = "<div><span>Hallo Welt</span></div>";
        errorSpy = sinon.spy();
        sinon.stub(console, "error").callsFake(errorSpy);
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("renders only a div if no htmlContent or pathToContent is given", () => {
        wrapper = mount(CustomMenuElement, {
            global: {
                plugins: [pinia]
            },
            props: {side}
        });

        expect(wrapper.find(".custom-menu-element").exists()).to.be.true;
        expect(wrapper.findAll("div").length).to.be.equals(1);
    });

    it("renders htmlContent", () => {
        currentComponentProps.htmlContent = "<div><span/></div>";
        wrapper = mount(CustomMenuElement, {
            global: {
                plugins: [pinia]
            },
            props: {side}
        });

        expect(wrapper.find(".custom-menu-element").exists()).to.be.true;
        expect(wrapper.findAll("div").length).to.be.equals(3);
        expect(wrapper.findAll("span").length).to.be.equals(1);
    });

    it("renders pathToContent", async () => {
        sinon.stub(axios, "get").resolves({status: 200, data: htmlContent});
        currentComponentProps.pathToContent = "aPath/path";
        wrapper = mount(CustomMenuElement, {
            global: {
                plugins: [pinia]
            },
            props: {side}
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".custom-menu-element").exists()).to.be.true;
        expect(wrapper.findAll("div").length).to.be.equals(3);
        expect(wrapper.findAll("span").length).to.be.equals(1);
        expect(wrapper.find("span").text()).to.be.equals("Hallo Welt");
    });

    it("logs error if pathToContent cannot be read", async () => {
        currentComponentProps.pathToContent = "aPath/path";
        sinon.stub(axios, "get").resolves({status: 404, data: null});
        wrapper = mount(CustomMenuElement,
            {
                global: {
                    plugins: [pinia]
                },
                props: {side}
            });
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".custom-menu-element").exists()).to.be.true;
        expect(errorSpy.calledOnce).to.be.true;
    });
    it("renders only a div if no htmlContent or pathToContent is given into secondary menu", () => {
        side = "secondaryMenu";
        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "customMenuElement",
            props: currentComponentProps
        };

        wrapper = mount(CustomMenuElement, {
            global: {
                plugins: [pinia]
            },
            props: {side}
        });

        expect(wrapper.find(".custom-menu-element").exists()).to.be.true;
        expect(wrapper.vm.side).to.be.equals(side);
    });

    it("does not render htmlContent when module is not visible", () => {
        isModuleVisible = false;

        wrapper = mount(CustomMenuElement, {
            global: {
                plugins: [pinia]
            },
            props: {side}
        });

        expect(wrapper.find(".custom-menu-element").exists()).to.be.false;
    });
});
