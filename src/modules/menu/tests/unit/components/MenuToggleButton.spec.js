import {createPinia, setActivePinia} from "pinia";
import sinon from "sinon";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import MenuToggleButton from "@modules/menu/components/MenuToggleButton.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

describe("src/modules/menu/MenuToggleButton.vue", () => {
    let pinia,
        menuStore,
        side,
        wrapper;

    beforeEach(() => {
        side = "mainMenu";
        pinia = createPinia();
        setActivePinia(pinia);

        menuStore = useMenuStore();
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("should render the button including 'mainToggleButtonIcon' as the icon class for side 'main'", () => {
        wrapper = shallowMount(MenuToggleButton, {
            global: {
                plugins: [pinia]
            },
            props: {side}
        });
        const button = wrapper.find(`#${side}-toggle-button`),
            icon = button.find("i");

        expect(button.exists()).to.be.true;
        expect(button.classes()).to.eql(["btn", "btn-light", "bootstrap-icon", "shadow", "menu-toggle-button", "toggle-button-mainMenu"]);
        expect(button.attributes("type")).to.equal("button");
        expect(button.attributes("aria-label")).to.equal("common:modules.menu.ariaLabelOpen");
        expect(icon.exists()).to.be.true;
        expect(icon.classes()).to.eql(["bi-list"]);
    });
    it("should render the button including 'secondaryToggleButtonIcon' as the icon class for side 'secondaryMenu'", () => {
        side = "secondaryMenu";
        menuStore.secondaryMenu.sections = [[{type: "test"}]];
        wrapper = shallowMount(MenuToggleButton, {
            global: {
                plugins: [pinia]
            },
            props: {side}
        });
        const button = wrapper.find(`#${side}-toggle-button`),
            icon = button.find("i");

        expect(button.exists()).to.be.true;
        expect(button.classes()).to.eql(["btn", "btn-light", "bootstrap-icon", "shadow", "menu-toggle-button", "toggle-button-secondaryMenu"]);
        expect(button.attributes("type")).to.equal("button");
        expect(button.attributes("aria-label")).to.equal(
            "common:modules.menu.ariaLabelOpen"
        );
        expect(icon.exists()).to.be.true;
        expect(icon.classes()).to.eql(["bi-tools"]);
    });

    it("mainMenu: calls toggleMenu if clicked on button", async () => {
        const toggleMenuSpy = sinon.spy(menuStore, "toggleMenu");

        wrapper = shallowMount(MenuToggleButton, {
            global: {
                plugins: [pinia]
            }, props: {side}
        });
        const button = wrapper.find(`#${side}-toggle-button`);

        await button.trigger("click");
        expect(toggleMenuSpy.calledOnce).to.be.true;
        expect(toggleMenuSpy.firstCall.args[0]).to.equal("mainMenu");
    });

    it("secondaryMenu: calls toggleMenu if clicked on button", async () => {
        const toggleMenuSpy = sinon.spy(menuStore, "toggleMenu");

        side = "secondaryMenu";
        menuStore.secondaryMenu.sections = [[{type: "test"}]];
        wrapper = shallowMount(MenuToggleButton, {
            global: {
                plugins: [pinia]
            }, props: {side}
        });
        const button = wrapper.find(`#${side}-toggle-button`);

        expect(button.exists()).to.be.true;
        await button.trigger("click");
        expect(toggleMenuSpy.calledOnce).to.be.true;
        expect(toggleMenuSpy.firstCall.args[0]).to.equal("secondaryMenu");
    });
    describe("showButton", () => {
        it("should NOT render secondary button if disabled", () => {
            menuStore.secondaryMenu.sections = [[]];

            wrapper = shallowMount(MenuToggleButton, {
                global: {plugins: [pinia]},
                props: {side: "secondaryMenu"}
            });

            expect(wrapper.find("#secondaryMenu-toggle-button").exists()).to.be.false;
        });

        it("should render secondary button if enabled", () => {
            menuStore.secondaryMenu.sections = [[{type: "test"}]];

            wrapper = shallowMount(MenuToggleButton, {
                global: {plugins: [pinia]},
                props: {side: "secondaryMenu"}
            });

            expect(wrapper.find("#secondaryMenu-toggle-button").exists()).to.be.true;
        });
    });
});
