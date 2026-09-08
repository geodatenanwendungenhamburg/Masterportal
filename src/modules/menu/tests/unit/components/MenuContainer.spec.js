import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import MenuContainer from "@modules/menu/components/MenuContainer.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";
import {expect} from "chai";
import sinon from "sinon";


describe("src/modules/menu/MenuContainer.vue", () => {
    let store,
        pinia,
        menuStore,
        mainExpanded,
        secondaryExpanded,
        uiStyle,
        isMobile,
        setActiveSpy,
        setHiddenSpy,
        wrapper;

    beforeEach(() => {
        mainExpanded = false;
        secondaryExpanded = false;
        uiStyle = "default";
        isMobile = false;
        setActiveSpy = sinon.spy();
        setHiddenSpy = sinon.spy();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LayerPills: {
                            namespaced: true,
                            getters: {
                                active: () => true,
                                hidden: () => false
                            },
                            mutations: {
                                setActive: setActiveSpy,
                                setHidden: setHiddenSpy
                            }
                        }
                    }
                }
            },
            getters: {
                menuFromConfig: () => () => "menuFromConfig",
                isMobile: () => isMobile,
                uiStyle: () => uiStyle
            }
        });

        pinia = createPinia();
        setActivePinia(pinia);

        menuStore = useMenuStore();

        menuStore.mainMenu.expanded = mainExpanded;
        menuStore.secondaryMenu.expanded = secondaryExpanded;

        menuStore.mainMenu.navigation.currentComponent = {
            type: "root",
            props: []
        };

        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "root",
            props: []
        };

        menuStore.mainMenu.title = null;
        menuStore.secondaryMenu.title = null;

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

    describe("mainMenu", () => {
        it("renders the mainMenu component not expanded", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "mainMenu"
                }
            });

            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
                secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.true;
            expect(secondaryMenuWrapper.exists()).to.be.false;
            expect(wrapper.find("#mp-header-mainMenu").exists()).to.be.true;
            expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
            expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-mainMenu").attributes().style).to.include("width: 0px");
        });

        it("renders the mainMenu component expanded", () => {
            menuStore.mainMenu.expanded = true;

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "mainMenu"
                }
            });

            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
                secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.true;
            expect(secondaryMenuWrapper.exists()).to.be.false;
            expect(wrapper.find("#mp-header-mainMenu").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-header-close-button-mainMenu").exists()).to.be.true;
            expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
            expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-mainMenu").attributes().style).not.to.include("width: 0px");
        });
    });

    describe("secondaryMenu", () => {
        it("renders the secondaryMenu component not expanded", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "secondaryMenu"
                }
            });

            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
                secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.false;
            expect(secondaryMenuWrapper.exists()).to.be.true;
            expect(wrapper.find("#mp-header-secondaryMenu").exists()).to.be.true;
            expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
            expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-secondaryMenu").attributes().style).to.include("width: 0px");
        });

        it("renders the secondaryMenu component expanded", () => {
            menuStore.secondaryMenu.expanded = true;

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "secondaryMenu"
                }
            });

            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
                secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.false;
            expect(secondaryMenuWrapper.exists()).to.be.true;
            expect(wrapper.find("#mp-header-secondaryMenu").exists()).to.be.true;
            expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
            expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-secondaryMenu").attributes().style).not.to.include("width: 0px");
        });
    });

    it("renders the mainMenu component with table style", () => {
        uiStyle = "TABLE";

        wrapper = shallowMount(MenuContainer, {
            global: {
                plugins: [store, pinia]
            },
            props: {
                side: "mainMenu"
            }
        });

        const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
            secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

        expect(mainMenuWrapper.exists()).to.be.true;
        expect(secondaryMenuWrapper.exists()).to.be.false;
        expect(wrapper.find("#mp-header-mainMenu").exists()).to.be.true;
        expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
        expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
        expect(wrapper.find("#mp-menu-mainMenu").classes()).to.contain("mp-menu-table");
    });

    it("renders the mainMenu component mobile", () => {
        isMobile = true;

        const collapseMenuesSpy = sinon.spy(MenuContainer.methods, "collapseMenues"),
            mergeMenuStateSpy = sinon.spy(MenuContainer.methods, "mergeMenuState");

        wrapper = shallowMount(MenuContainer, {
            global: {
                plugins: [store, pinia]
            },
            props: {
                side: "mainMenu"
            }
        });

        const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
            secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

        expect(mainMenuWrapper.exists()).to.be.true;
        expect(secondaryMenuWrapper.exists()).to.be.false;

        expect(mergeMenuStateSpy.calledOnce).to.be.true;
        expect(mergeMenuStateSpy.firstCall.args[0]).deep.equals({
            menu: "menuFromConfig",
            side: "mainMenu"
        });

        expect(collapseMenuesSpy.calledOnce).to.be.true;
    });

    it("shall call closeMenu if close button is clicked", async () => {
        const closeMenuSpy = sinon.stub(menuStore, "closeMenu");

        wrapper = shallowMount(MenuContainer, {
            global: {
                plugins: [store, pinia]
            },
            props: {
                side: "mainMenu"
            }
        });

        const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
            closeBtn = wrapper.find("#mp-menu-header-close-button-mainMenu");

        expect(mainMenuWrapper.exists()).to.be.true;
        expect(closeBtn.exists()).to.be.true;

        await closeBtn.trigger("click");

        expect(closeMenuSpy.calledOnce).to.be.true;
        expect(closeMenuSpy.firstCall.args[0]).to.equal("mainMenu");
    });

    describe("handlePosition", () => {
        it("computed property handlePosition in mainMenu", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "mainMenu"
                }
            });

            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu");

            expect(mainMenuWrapper.exists()).to.be.true;
            expect(wrapper.vm.handlePosition).equals("right");
        });

        it("computed property handlePosition in secondaryMenu", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "secondaryMenu"
                }
            });

            const secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(secondaryMenuWrapper.exists()).to.be.true;
            expect(wrapper.vm.handlePosition).equals("left");
        });
    });

    describe("watcher mainMenu and secondaryMenu", () => {
        it("watcher mainMenu", () => {
            const mergeMenuStateSpy = sinon.spy(
                MenuContainer.methods,
                "mergeMenuState"
            );

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "mainMenu"
                }
            });

            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu");

            expect(mainMenuWrapper.exists()).to.be.true;

            wrapper.vm.$options.watch.mainMenu.call(
                wrapper.vm,
                {id: "mainMenu"}
            );

            expect(mergeMenuStateSpy.calledTwice).to.be.true;

            expect(
                mergeMenuStateSpy.secondCall.args[0]
            ).deep.equals({
                menu: {id: "mainMenu"},
                side: "mainMenu"
            });
        });

        it("watcher secondaryMenu", () => {
            const mergeMenuStateSpy = sinon.spy(
                MenuContainer.methods,
                "mergeMenuState"
            );

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "secondaryMenu"
                }
            });

            const secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(secondaryMenuWrapper.exists()).to.be.true;

            wrapper.vm.$options.watch.secondaryMenu.call(
                wrapper.vm,
                {id: "secondaryMenu"}
            );

            expect(mergeMenuStateSpy.calledTwice).to.be.true;

            expect(
                mergeMenuStateSpy.secondCall.args[0]
            ).deep.equals({
                menu: {id: "secondaryMenu"},
                side: "secondaryMenu"
            });
        });
    });

    describe("onResize", () => {
        it("should trigger onResize when ResizeHandle emits resizing event", async () => {
            const onResizeSpy = sinon.spy(MenuContainer.methods, "onResize"),
                eventData = {
                    handleElement: {
                        offsetWidth: 300
                    }
                };

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "mainMenu"
                }
            });

            await wrapper
                .findComponent({name: "ResizeHandle"})
                .vm.$emit("resizing", eventData);

            expect(onResizeSpy.calledOnce).to.be.true;
            expect(onResizeSpy.firstCall.args[0]).to.deep.equal(eventData);
        });
    });

    describe("onTransitionEnd", () => {
        beforeEach(() => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "mainMenu"
                }
            });

            sinon.stub(wrapper.vm, "setCurrentSecondaryMenuWidth");
            sinon.stub(wrapper.vm, "setCurrentSecondaryMenuOffsetWidth");
            sinon.stub(wrapper.vm, "setCurrentMainMenuWidth");
            sinon.stub(wrapper.vm, "setCurrentMainMenuOffsetWidth");
        });

        it("should update secondary menu width data when secondary menu transition ends", () => {
            wrapper.vm.onTransitionEnd({
                propertyName: "width",
                target: {
                    id: "mp-menu-secondaryMenu",
                    offsetWidth: 300
                }
            });

            expect(wrapper.vm.setCurrentSecondaryMenuWidth.calledOnce).to.be.true;
            expect(wrapper.vm.setCurrentSecondaryMenuOffsetWidth.calledOnceWith(300)).to.be.true;
            expect(wrapper.vm.setCurrentMainMenuWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentMainMenuOffsetWidth.notCalled).to.be.true;
        });

        it("should update main menu width data when main menu transition ends", () => {
            wrapper.vm.onTransitionEnd({
                propertyName: "width",
                target: {
                    id: "mp-menu-mainMenu",
                    offsetWidth: 300
                }
            });

            expect(wrapper.vm.setCurrentMainMenuWidth.calledOnce).to.be.true;
            expect(wrapper.vm.setCurrentMainMenuOffsetWidth.calledOnceWith(300)).to.be.true;
            expect(wrapper.vm.setCurrentSecondaryMenuWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentSecondaryMenuOffsetWidth.notCalled).to.be.true;
        });

        it("should ignore width transitions from nested non-menu elements", () => {
            wrapper.vm.onTransitionEnd({
                propertyName: "width",
                target: {
                    id: "",
                    offsetWidth: 300
                }
            });

            expect(wrapper.vm.setCurrentSecondaryMenuWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentSecondaryMenuOffsetWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentMainMenuWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentMainMenuOffsetWidth.notCalled).to.be.true;
        });

        it("should ignore non-width transition events", () => {
            wrapper.vm.onTransitionEnd({
                propertyName: "top",
                target: {
                    id: "mp-menu-mainMenu",
                    offsetWidth: 300
                }
            });

            expect(wrapper.vm.setCurrentSecondaryMenuWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentSecondaryMenuOffsetWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentMainMenuWidth.notCalled).to.be.true;
            expect(wrapper.vm.setCurrentMainMenuOffsetWidth.notCalled).to.be.true;
        });
    });

    describe("hideElementsForBiggerMenu", () => {
        let layerPillsMock,
            footerMock;

        beforeEach(() => {
            layerPillsMock = {
                style: {
                    display: ""
                }
            };

            footerMock = {
                style: {
                    display: ""
                }
            };

            sinon.stub(document, "getElementById").callsFake(id => {
                if (id === "layer-pills") {
                    return layerPillsMock;
                }

                if (id === "module-portal-footer") {
                    return footerMock;
                }

                return null;
            });

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "secondaryMenu"
                }
            });
        });

        it("should hide footer when menuPercentWidth exceeds the breakpoint", () => {
            wrapper.vm.hideElementsForBiggerMenu(0.8);

            expect(footerMock.style.display).to.equal("none");
        });

        it("should show layerPills and footer when menuPercentWidth is below the breakpoint", () => {
            wrapper.vm.hideElementsForBiggerMenu(0.4);

            expect(layerPillsMock.style.display).to.equal("");
            expect(footerMock.style.display).to.equal("");
        });

        it("should use the correct breakpoint based on viewport width", () => {
            sinon.stub(document.documentElement, "clientWidth").value(1200);

            wrapper.vm.hideElementsForBiggerMenu(0.6);
            expect(footerMock.style.display).to.equal("");

            wrapper.vm.hideElementsForBiggerMenu(0.8);
            expect(footerMock.style.display).to.equal("none");
        });
    });

    describe("secondaryMenuEnabled", () => {
        it("should render secondaryMenu but hide it when disabled", () => {
            menuStore.secondaryMenu.sections = [[]];

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "secondaryMenu"
                }
            });

            const menu = wrapper.find("#mp-menu-secondaryMenu");

            expect(menu.exists()).to.be.true;
            expect(menu.classes()).to.include("hidden");
        });

        it("should render secondaryMenu if enabled", () => {
            menuStore.secondaryMenu.sections = [[{
                type: "test"
            }]];

            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store, pinia]
                },
                props: {
                    side: "secondaryMenu"
                }
            });

            const menu = wrapper.find("#mp-menu-secondaryMenu");

            expect(menu.exists()).to.be.true;
            expect(menu.classes()).not.to.include("hidden");
        });
    });
});
