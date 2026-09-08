import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import visibilityChecker from "@shared/js/utils/visibilityChecker.js";
import MenuContainerBodyRootItemElement from "@modules/menu/components/MenuContainerBodyRootItemElement.vue";
import LightButton from "@shared/modules/buttons/components/LightButton.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

describe("src/modules/menu/MenuContainerBodyRootItemElement.vue", () => {
    const
        mockConfigJson = {
            portalConfig: {
                tree: {
                }
            }
        };
    let store,
        pinia,
        menuStore,
        clickedMenuElementSpy,
        resetMenuSpy,
        mapMode,
        isModuleVisible,
        wrapper;

    beforeEach(() => {
        isModuleVisible = true;
        mapMode = "2D";

        sinon.stub(visibilityChecker, "isModuleVisible").callsFake(() => {
            return isModuleVisible;
        });
        store = createStore({
            namespaced: true,
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: () => mapMode
                    }
                }
            },
            getters: {
                visibleLayerConfigs: () => [
                    {id: "layer1", visibility: true},
                    {id: "layer2", visibility: false}
                ],
                deviceMode: () => "Desktop",
                portalConfig: () => mockConfigJson.portalConfig
            }
        });
        pinia = createPinia();
        setActivePinia(pinia);
        menuStore = useMenuStore();

        menuStore.mainMenu.currentComponent = "componentType";
        menuStore.mainMenu.navigation.currentComponent = {
            type: "componentType",
            props: {
                name: "testName"
            }
        };

        menuStore.secondaryMenu.currentComponent = "componentType";
        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "componentType",
            props: {
                name: "testName"
            }
        };
        clickedMenuElementSpy = sinon.stub(
            menuStore,
            "clickedMenuElement"
        );

        resetMenuSpy = sinon.stub(
            menuStore,
            "resetMenu"
        );
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("renders the component and it contains the LightButton", () => {
        wrapper = shallowMount(MenuContainerBodyRootItemElement, {
            global: {
                plugins: [store, pinia]
            },
            props: {
                icon: "bi-file-plus",
                name: "awesomeName",
                path: ["mainMenu"],
                properties: {}
            }
        });

        expect(wrapper.findComponent(LightButton).exists()).to.be.true;
    });

    it("calls clickedMenuElement in created if type is equals currentComponent", () => {
        const name = "awesomeName",
            type = "componentType",
            path = ["mainMenu", type];

        wrapper = shallowMount(MenuContainerBodyRootItemElement, {
            global: {
                plugins: [store, pinia]
            },
            props: {
                icon: "bi-file-plus",
                name: name,
                path: path,
                properties: {
                    type: type
                }}
        });

        expect(wrapper.findComponent(LightButton).exists()).to.be.true;
        expect(clickedMenuElementSpy.calledOnce).to.be.true;
        expect(clickedMenuElementSpy.firstCall.args[0]).to.be.deep.equals({
            name: name,
            path: path,
            side: path[0],
            type: type,
            properties: {type}
        });
    });

    it("calls not clickedMenuElement in created if type is not equals currentComponent", () => {
        const name = "awesomeName",
            type = "otherType",
            path = ["mainMenu", type];

        wrapper = shallowMount(MenuContainerBodyRootItemElement, {
            global: {
                plugins: [store, pinia]
            },
            props: {
                icon: "bi-file-plus",
                name: name,
                path: path,
                properties: {
                    type: type
                }}
        });

        expect(wrapper.findComponent(LightButton).exists()).to.be.true;
        expect(clickedMenuElementSpy.notCalled).to.be.true;
    });

    describe("methods", () => {
        it("checkIsVisible shall not close currentComponent if it shall be visible on mode change", () => {
            mapMode = "3D";
            isModuleVisible = true;

            const name = "awesomeName",
                type = "componentType",
                path = ["mainMenu", type];

            wrapper = shallowMount(MenuContainerBodyRootItemElement, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    icon: "bi-file-plus",
                    name: name,
                    path: path,
                    properties: {
                        type: type,
                        supportedMapModes: ["2D", "3D"],
                        supportedDevices: ["Desktop", "Mobile", "Table"]
                    }}
            });

            expect(wrapper.findComponent(LightButton).exists()).to.be.true;
            expect(resetMenuSpy.notCalled).to.be.true;
        });

        it("checkIsVisible shall close currentComponent if not shall be visible on mode change", () => {
            mapMode = "3D";
            isModuleVisible = false;

            const name = "awesomeName",
                type = "componentType",
                path = ["mainMenu", type];

            wrapper = shallowMount(MenuContainerBodyRootItemElement, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    icon: "bi-file-plus",
                    name: name,
                    path: path,
                    properties: {
                        type: type,
                        supportedMapModes: ["2D"],
                        supportedDevices: ["Desktop", "Mobile", "Table"]
                    }}
            });

            expect(wrapper.findComponent(LightButton).exists()).to.be.false;
            expect(visibilityChecker.isModuleVisible.calledOnce).to.be.true;
            expect(visibilityChecker.isModuleVisible.firstCall.args[0].supportedMapModes).to.deep.equal(["2D"]);
            expect(visibilityChecker.isModuleVisible.firstCall.args[0].mapMode).to.equal("3D");
        });
        it("checkIsVisible hides element when required layers are not visible", () => {
            wrapper = shallowMount(MenuContainerBodyRootItemElement, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    icon: "bi-file-plus",
                    name: "awesomeName",
                    path: ["mainMenu", "componentType"],
                    properties: {
                        type: "componentType",
                        showOnlyByLayersVisible: ["layer1", "layer2"]
                    }
                }
            });

            expect(wrapper.findComponent(LightButton).exists()).to.be.false;
        });

        it("checkIsVisible shows element if child elements have visible layers", () => {
            wrapper = shallowMount(MenuContainerBodyRootItemElement, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    icon: "bi-file-plus",
                    name: "awesomeName",
                    path: ["mainMenu", "componentType"],
                    properties: {
                        type: "componentType",
                        elements: [{
                            showOnlyByLayersVisible: ["layer1"] // A child element with a required layer
                        }]
                    }
                }
            });

            expect(wrapper.findComponent(LightButton).exists()).to.be.true;
        });
    });
});
