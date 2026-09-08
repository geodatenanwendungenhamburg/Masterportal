import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import MenuContainerBody from "@modules/menu/components/MenuContainerBody.vue";
import MenuNavigation from "@modules/menu/components/MenuNavigation.vue";
import MenuContainerBodyRoot from "@modules/menu/components/MenuContainerBodyRoot.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

describe("src/modules/menu/MenuContainerBody.vue", () => {
    let store,
        pinia,
        menuStore,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GetFeatureInfo: {
                            namespaced: true,
                            getters: {
                                menuSide: () => "secondaryMenu"
                            }
                        }
                    },
                    getters: {
                        componentMap: () => {
                            return {
                                type: "type",
                                component: "component"
                            };
                        }
                    }
                }
            },
            actions: {
                initializeModule: () => undefined
            }
        });

        pinia = createPinia();
        setActivePinia(pinia);
        menuStore = useMenuStore();
        menuStore.mainMenu.navigation.currentComponent = {
            type: "type"
        };
        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "type"
        };
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("renders the component in mainMenu and it contains the MenuNavigation and not GetFeatureInfo", () => {
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store, pinia]
            },
            props: {side: "mainMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuContainerBodyRoot).exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").exists()).to.be.false;
    });

    it("renders the component in secondaryMenu and it contains the MenuNavigation and not displayed GetFeatureInfo", () => {
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store, pinia]
            },
            props: {side: "secondaryMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-secondaryMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuContainerBodyRoot).exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").attributes("style")).to.be.equals("display: none;");
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("style")).to.be.equals("display: none;");
    });

    it("renders the component in mainMenu, currentComponent is root", () => {
        menuStore.mainMenu.navigation.currentComponent = {
            type: "root"
        };

        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store, pinia]
            },
            props: {side: "mainMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("side")).to.be.equals("mainMenu");
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("style")).to.be.undefined;
    });

    it("renders the component in mainMenu, currentComponent is not root or getFeatureInfo", () => {
        menuStore.mainMenu.navigation.currentComponent = {
            type: "component"
        };
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store, pinia],
                stubs: {"keep-alive": false}
            },
            props: {side: "mainMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.find("component").exists()).to.be.true;
    });

    it("renders the component in secondaryMenu, currentComponent is getFeatureInfo", () => {
        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "getFeatureInfo"
        };
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store, pinia]
            },
            props: {side: "secondaryMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-secondaryMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("side")).to.be.equals("secondaryMenu");
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("style")).to.be.equals("display: none;");
        expect(bodyWrapper.find("get-feature-info-stub").exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").attributes("style")).to.be.undefined;
    });

    it("computed property currentComponent", () => {
        menuStore.mainMenu.navigation.currentComponent = {
            type: "getFeatureInfo"
        };
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store, pinia]
            },
            props: {
                side: "mainMenu"
            }
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(wrapper.vm.currentComponent).to.be.equals("getFeatureInfo");
    });


});
