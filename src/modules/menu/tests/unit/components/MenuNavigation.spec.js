import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {mount} from "@vue/test-utils";
import MenuNavigation from "@modules/menu/components/MenuNavigation.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";
import {expect} from "chai";
import sinon from "sinon";


describe("src/core/menu/navigation/components/MenuNavigation.vue", () => {
    let wrapper,
        store,
        pinia,
        menuStore,
        side;

    beforeEach(() => {
        side = "mainMenu";

        store = createStore({
            getters: {
                isMobile: () => false
            }
        });

        pinia = createPinia();
        setActivePinia(pinia);

        menuStore = useMenuStore();

        menuStore.mainMenu.navigation.history = [{
            type: "previousMainMenu",
            props: []
        }];

        menuStore.mainMenu.navigation.currentComponent = {
            type: "mainMenu",
            props: {}
        };

        menuStore.mainMenu.currentComponent = "mainMenu";

        menuStore.secondaryMenu.navigation.history = [{
            type: "previousSecondaryMenu",
            props: []
        }];

        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "secondaryMenu",
            props: {}
        };

        menuStore.secondaryMenu.currentComponent = "secondaryMenu";

        menuStore.secondaryMenu.sections = [[{
            type: "test"
        }]];
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("renders the navigation in the main menu side", () => {
        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia],
                mocks: {
                    $t: (key) => key
                }
            }, props: {side}});

        expect(wrapper.find("#mp-menu-navigation-mainMenu").exists()).to.be.true;
        expect(wrapper.find("#mp-navigation-mainMenu").exists()).to.be.true;
        expect(wrapper.find("#mp-menu-navigation-reset-button-mainMenu").exists()).to.be.true;
        expect(wrapper.find(".mp-menu-navigation-moduletitle").exists()).to.be.true;
        expect(wrapper.find(".mp-menu-navigation-moduletitle").text()).to.be.equals("common:modules.mainMenu.name");
    });

    it("renders the navigation in the secondary menu side", () => {
        side = "secondaryMenu";
        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia],
                mocks: {
                    $t: (key) => key
                }
            }, props: {side}
        });

        expect(wrapper.find("#mp-menu-navigation-secondaryMenu").exists()).to.be.true;
        expect(wrapper.find("#mp-navigation-secondaryMenu").exists()).to.be.true;
        expect(wrapper.find("#mp-menu-navigation-reset-button-secondaryMenu").exists()).to.be.true;
        expect(wrapper.find(".mp-menu-navigation-moduletitle").exists()).to.be.true;
        expect(wrapper.find(".mp-menu-navigation-moduletitle").text()).to.be.equals("common:modules.secondaryMenu.name");
    });

    it("doesn't render the navigation in the main menu side if no previousNav available", () => {
        menuStore.mainMenu.navigation.history = [];

        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}});

        expect(wrapper.find("#mp-menu-navigation-mainMenu").exists()).to.be.false;
        expect(wrapper.find("#mp-navigation-mainMenu").exists()).to.be.false;
        expect(wrapper.find(".mp-menu-navigation-moduletitle").exists()).to.be.false;
    });

    it("doesn't render the navigation in the secondary menu side if no previousNav available", () => {
        side = "secondaryMenu";
        menuStore.secondaryMenu.navigation.history = [];

        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}
        });

        expect(wrapper.find("#mp-menu-navigation-secondaryMenu").exists()).to.be.false;
        expect(wrapper.find("#mp-navigation-secondaryMenu").exists()).to.be.false;
        expect(wrapper.find(".mp-menu-navigation-moduletitle").exists()).to.be.false;
    });

    it("mainMenu: calls navigateBack if clicked on previousNavigation", async () => {
        const navigateBackSpy = sinon.stub(menuStore, "navigateBack");

        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}
        });
        const navigation = wrapper.find("#mp-navigation-mainMenu");

        await navigation.trigger("click");
        expect(navigateBackSpy.calledOnce).to.be.true;
        expect(navigateBackSpy.firstCall.args[0].side).to.be.equals("mainMenu");
    });

    it("secondaryMenu: calls navigateBack if clicked on previousNavigation", async () => {
        const navigateBackSpy = sinon.stub(menuStore, "navigateBack");

        side = "secondaryMenu";
        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}
        });
        const navigation = wrapper.find("#mp-navigation-secondaryMenu");

        await navigation.trigger("click");
        expect(navigateBackSpy.calledOnce).to.be.true;
        expect(navigateBackSpy.firstCall.args[0].side).to.be.equals("secondaryMenu");
    });

    it("hides '< Menu' link for GFI if secondary menu is disabled", () => {
        side = "secondaryMenu";
        menuStore.secondaryMenu.sections = [[]];
        menuStore.secondaryMenu.navigation.history = [{
            type: "root",
            props: []
        }];
        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "getFeatureInfo",
            props: []
        };
        menuStore.secondaryMenu.currentComponent = "getFeatureInfo";
        const menuName = menuStore.previousNavigationEntryText(side);

        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia],
                mocks: {
                    $t: key => key === "common:modules.menu.name"
                        ? menuName
                        : key
                }
            }, props: {side}
        });

        expect(wrapper.find("#mp-navigation-secondaryMenu").exists()).to.be.false;
    });

    it("shows close button for secondary GFI when secondary menu is disabled", () => {
        side = "secondaryMenu";

        menuStore.secondaryMenu.sections = [[]];

        menuStore.secondaryMenu.navigation.history = [{
            type: "root",
            props: []
        }];
        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "getFeatureInfo",
            props: []
        };
        menuStore.secondaryMenu.currentComponent = "getFeatureInfo";
        const menuName = menuStore.previousNavigationEntryText(side);

        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia],
                mocks: {
                    $t: key => key === "common:modules.menu.name"
                        ? menuName
                        : key
                }
            }, props: {side}
        });

        expect(wrapper.find("#mp-menu-navigation-reset-button-secondaryMenu").exists()).to.be.true;
    });

    it("renders the header icon in the main menu side", () => {
        menuStore.mainMenu.showHeaderIcon = true;
        menuStore.mainMenu.navigation.currentComponent = {type: "mainMenu", props: {icon: "bi-tools"}};
        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}
        });

        expect(wrapper.find("#mp-menu-navigation-mainMenu > .mp-menu-navigation-moduletitle > i").exists()).to.be.true;
    });

    it("renders the header icon in the secondary menu side", () => {
        side = "secondaryMenu";
        menuStore.secondaryMenu.showHeaderIcon = true;
        menuStore.secondaryMenu.navigation.currentComponent = {type: "secondaryMenu", props: {icon: "bi-tools"}};
        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}
        });

        expect(wrapper.find("#mp-menu-navigation-secondaryMenu > .mp-menu-navigation-moduletitle > i").exists()).to.be.true;
    });

    it("dont renders the header icon in the main menu side", () => {
        menuStore.mainMenu.showHeaderIcon = false;
        menuStore.mainMenu.navigation.currentComponent = {type: "mainMenu", props: {icon: "bi-tools"}};
        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}
        });

        expect(wrapper.find("#mp-menu-navigation-mainMenu > .mp-menu-navigation-moduletitle > i").exists()).to.be.false;
    });

    it("dont renders the header icon in the secondary menu side", () => {
        side = "secondaryMenu";
        menuStore.secondaryMenu.showHeaderIcon = false;
        menuStore.secondaryMenu.navigation.currentComponent = {type: "secondaryMenu", props: {icon: "bi-tools"}};
        wrapper = mount(MenuNavigation, {
            global: {
                plugins: [store, pinia]
            }, props: {side}
        });

        expect(wrapper.find("#mp-menu-navigation-secondaryMenu > .mp-menu-navigation-moduletitle > i").exists()).to.be.false;
    });
});
