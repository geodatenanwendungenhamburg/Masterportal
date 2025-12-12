import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import MenuContainer from "@modules/menu/components/MenuContainer.vue";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/menu/MenuContainer.vue", () => {
    let store,
        currentMenuWidth,
        mainExpanded = false,
        secondaryExpanded = false,
        uiStyle = "default",
        mergeMenuStateSpy,
        mainMenu,
        secondaryMenu,
        defaultComponent,
        closeMenuSpy,
        collapseMenuesSpy,
        isMobile,
        setActiveSpy,
        setHiddenSpy,
        wrapper;

    beforeEach(() => {
        currentMenuWidth = sinon.stub();
        closeMenuSpy = sinon.spy();
        mergeMenuStateSpy = sinon.spy();
        collapseMenuesSpy = sinon.spy();
        isMobile = false;
        setActiveSpy = sinon.spy();
        setHiddenSpy = sinon.spy();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        MenuContainer,
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
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        defaultComponent: () => defaultComponent,
                        secondaryMenu: () => secondaryMenu,
                        mainMenu: () => mainMenu,
                        currentMenuWidth: () => currentMenuWidth,
                        mainExpanded: () => mainExpanded,
                        secondaryExpanded: () => secondaryExpanded,
                        titleBySide: () => () => true,
                        currentComponent: () => () => "root"
                    },
                    mutations: {
                        collapseMenues: collapseMenuesSpy,
                        mergeMenuState: mergeMenuStateSpy,
                        setCurrentMenuWidth: sinon.spy()
                    },
                    actions: {
                        closeMenu: closeMenuSpy,
                        toggleMenu: sinon.spy()
                    }
                }
            },
            getters: {
                menuFromConfig: () => () => "menuFromConfig",
                isMobile: () => isMobile,
                uiStyle: () => uiStyle
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    describe("mainMenu", () => {
        it("renders the mainMenu component not expanded", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "mainMenu"}
            });
            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
                secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");


            expect(mainMenuWrapper.exists()).to.be.true;
            expect(secondaryMenuWrapper.exists()).to.be.false;
            expect(wrapper.find("#mp-header-mainMenu").exists()).to.be.true;
            expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
            expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-mainMenu").attributes().style).to.include("width: 0px");
            expect(collapseMenuesSpy.notCalled).to.be.true;
        });

        it("renders the mainMenu component expanded", () => {
            mainExpanded = true;
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "mainMenu"}
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
            expect(collapseMenuesSpy.notCalled).to.be.true;
        });
    });

    describe("secondaryMenu", () => {
        it("renders the secondaryMenu component not expanded", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "secondaryMenu"}
            });
            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
                secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.false;
            expect(secondaryMenuWrapper.exists()).to.be.true;
            expect(wrapper.find("#mp-header-secondaryMenu").exists()).to.be.true;
            expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
            expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-secondaryMenu").attributes().style).to.include("width: 0px");
            expect(collapseMenuesSpy.notCalled).to.be.true;
        });

        it("renders the secondaryMenu component expanded", () => {
            secondaryExpanded = true;
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "secondaryMenu"}
            });
            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
                secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.false;
            expect(secondaryMenuWrapper.exists()).to.be.true;
            expect(wrapper.find("#mp-header-secondaryMenu").exists()).to.be.true;
            expect(wrapper.find("menu-container-body-stub").exists()).to.be.true;
            expect(wrapper.find("resize-handle-stub").exists()).to.be.true;
            expect(wrapper.find("#mp-menu-secondaryMenu").attributes().style).not.to.include("width: 0px");
            expect(collapseMenuesSpy.notCalled).to.be.true;
        });
    });

    it("renders the mainMenu component with table style", () => {
        uiStyle = "TABLE";
        wrapper = shallowMount(MenuContainer, {
            global: {
                plugins: [store]
            },
            propsData: {side: "mainMenu"}
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
        wrapper = shallowMount(MenuContainer, {
            global: {
                plugins: [store]
            },
            propsData: {side: "mainMenu"}
        });
        const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
            secondaryMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

        expect(mainMenuWrapper.exists()).to.be.true;
        expect(secondaryMenuWrapper.exists()).to.be.false;
        expect(mergeMenuStateSpy.calledOnce).to.be.true;
        expect(mergeMenuStateSpy.firstCall.args[1]).deep.equals({
            menu: "menuFromConfig",
            side: "mainMenu"
        });
        expect(collapseMenuesSpy.calledOnce).to.be.true;
    });

    it("shall call toggleMenu if close button is clicked", async () => {
        wrapper = shallowMount(MenuContainer, {
            global: {
                plugins: [store]
            },
            propsData: {side: "mainMenu"}
        });
        const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu"),
            closeBtn = wrapper.find("#mp-menu-header-close-button-mainMenu");

        expect(mainMenuWrapper.exists()).to.be.true;
        expect(closeBtn.exists()).to.be.true;
        await closeBtn.trigger("click");
        expect(closeMenuSpy.calledOnce).to.be.true;
        expect(closeMenuSpy.firstCall.args[1]).equals("mainMenu");
    });

    describe("handlePosition", () => {
        it("computed property handlePosition in mainMenu", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "mainMenu"}
            });
            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu");

            expect(mainMenuWrapper.exists()).to.be.true;
            expect(wrapper.vm.handlePosition).equals("right");
        });

        it("computed property handlePosition in secondaryMenu", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "secondaryMenu"}
            });
            const mainMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.true;
            expect(wrapper.vm.handlePosition).equals("left");
        });
    });

    describe("watcher mainMenu and secondaryMenu", () => {
        it("watcher mainMenu", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "mainMenu"}
            });
            const mainMenuWrapper = wrapper.find("#mp-menu-mainMenu");

            expect(mainMenuWrapper.exists()).to.be.true;
            wrapper.vm.$options.watch.mainMenu.call(wrapper.vm, {id: "mainMenu"});
            expect(mergeMenuStateSpy.calledTwice).to.be.true;
            expect(mergeMenuStateSpy.secondCall.args[1]).deep.equals({
                menu: {id: "mainMenu"},
                side: "mainMenu"
            });
        });

        it("watcher secondaryMenu", () => {
            wrapper = shallowMount(MenuContainer, {
                global: {
                    plugins: [store]
                },
                propsData: {side: "secondaryMenu"}
            });
            const mainMenuWrapper = wrapper.find("#mp-menu-secondaryMenu");

            expect(mainMenuWrapper.exists()).to.be.true;
            wrapper.vm.$options.watch.secondaryMenu.call(wrapper.vm, {id: "secondaryMenu"});
            expect(mergeMenuStateSpy.calledTwice).to.be.true;
            expect(mergeMenuStateSpy.secondCall.args[1]).deep.equals({
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
                    plugins: [store]
                },
                propsData: {side: "mainMenu"}
            });

            await wrapper.findComponent({name: "ResizeHandle"}).vm.$emit("resizing", eventData);
            expect(onResizeSpy.calledOnce).to.be.true;
            expect(onResizeSpy.firstCall.args[0]).to.deep.equal(eventData);

            onResizeSpy.restore();
        });
    });
    describe("hideElementsForBiggerMenu", () => {
        let layerPillsMock, footerMock;

        beforeEach(() => {
            layerPillsMock = {style: {display: ""}};
            footerMock = {style: {display: ""}};

            sinon.stub(document, "getElementById").callsFake((id) => {
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
                    plugins: [store]
                },
                propsData: {side: "secondaryMenu"}
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

});
