import {mount, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import ResizeHandle from "@shared/modules/resize/components/ResizeHandle.vue";

describe("src/shared/modules/resize/components/ResizeHandle.vue", () => {
    describe("ResizeHandle (tests using mounted)", () => {
        let wrapper,
            host,
            container,
            otherMenu,
            setMainMenuWidthSpy,
            setSecondaryMenuWidthSpy;

        /**
         * helper function to set the geometry of an element by defining its offsetWidth, offsetHeight, offsetLeft, and offsetTop properties
         */
        function setElementGeometry (element, {width = 300, height = 200, left = 10, top = 20} = {}) {
            Object.defineProperty(element, "offsetWidth", {configurable: true, value: width});
            Object.defineProperty(element, "offsetHeight", {configurable: true, value: height});
            Object.defineProperty(element, "offsetLeft", {configurable: true, value: left});
            Object.defineProperty(element, "offsetTop", {configurable: true, value: top});
        }

        /**
         * create a test store with spies for the mutations that the component commits to update menu widths
         */
        function createTestStore () {
            return createStore({
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            ResizeHandle: {
                                namespaced: true,
                                mutations: {
                                    setMainMenuWidth: setMainMenuWidthSpy,
                                    setSecondaryMenuWidth: setSecondaryMenuWidthSpy
                                }
                            }
                        }
                    }
                }
            });
        }

        /**
         * helper function to mount the component with default props and the test store, and reset the spies before each test
         */
        function mountComponent (props = {}) {
            const store = createTestStore();

            wrapper = mount(ResizeHandle, {
                global: {
                    plugins: [store]
                },
                props: {
                    side: "mainMenu",
                    ...props
                },
                attachTo: host
            });
            setMainMenuWidthSpy.resetHistory();
            setSecondaryMenuWidthSpy.resetHistory();
        }

        beforeEach(() => {
            setMainMenuWidthSpy = sinon.spy();
            setSecondaryMenuWidthSpy = sinon.spy();

            container = document.createElement("div");
            container.id = "masterportal-container";
            setElementGeometry(container, {width: 1000, height: 800});
            document.body.appendChild(container);

            host = document.createElement("div");
            host.className = "resizable-host";
            setElementGeometry(host, {width: 300, height: 200, left: 15, top: 25});
            document.body.appendChild(host);

            otherMenu = document.createElement("div");
            otherMenu.id = "mp-menu-secondaryMenu";
            setElementGeometry(otherMenu, {width: 0});
            document.body.appendChild(otherMenu);
        });

        afterEach(() => {
            if (wrapper) {
                wrapper.unmount();
                wrapper = null;
            }
            if (host?.parentNode) {
                host.parentNode.removeChild(host);
            }
            if (container?.parentNode) {
                container.parentNode.removeChild(container);
            }
            if (otherMenu?.parentNode) {
                otherMenu.parentNode.removeChild(otherMenu);
            }
            Object.defineProperty(document, "visibilityState", {configurable: true, value: "visible"});
        });

        it("onMouseDown ignores non-left mouse button", () => {
            mountComponent();
            const startResizingSpy = sinon.spy(wrapper.vm, "startResizing");

            wrapper.vm.onMouseDown({button: 2});

            expect(startResizingSpy.notCalled).to.be.true;
        });

        it("onMouseMove calculates delta and emits resizing", () => {
            mountComponent({handlePosition: "right"});

            wrapper.vm.initialCursorPosition = {x: 0, y: 0};
            wrapper.vm.initialDimensions.width = 100;

            wrapper.vm.onMouseMove({
                clientX: 23,
                clientY: 27,
                buttons: 1
            });

            expect(wrapper.vm.deltaCursorPosition.x).to.equal(23);
            expect(wrapper.vm.deltaCursorPosition.y).to.equal(27);
            expect(setMainMenuWidthSpy.calledOnce).to.be.true;
            expect(wrapper.emitted("resizing")).to.have.lengthOf(1);
            expect(wrapper.emitted("resizing")[0][0].deltaCursorPosition.x).to.equal(23);
            expect(wrapper.emitted("resizing")[0][0].deltaCursorPosition.y).to.equal(27);
        });

        it("onMouseMove emits 'leftScreen' event when cursor leaves window", () => {
            mountComponent();

            wrapper.vm.initialCursorPosition = {x: 0, y: 0};
            wrapper.vm.initialDimensions.width = 100;
            wrapper.vm.isResizing = true;

            wrapper.vm.onMouseMove({
                clientX: -10,
                clientY: 50,
                buttons: 1
            });

            expect(wrapper.emitted("leftScreen")).to.have.lengthOf(1);
            expect(wrapper.vm.isResizing).to.be.false;
        });

        it("onMouseMove stops resizing when mouse buttons are no longer pressed", () => {
            mountComponent();
            const onMouseUpSpy = sinon.spy(wrapper.vm, "onMouseUp");

            wrapper.vm.onMouseMove({
                clientX: 23,
                clientY: 27,
                buttons: 0
            });

            expect(onMouseUpSpy.calledOnce).to.be.true;
            expect(wrapper.emitted("resizing")).to.be.undefined;
        });

        it("setNewSize commits main menu width to vuex", () => {
            mountComponent({side: "mainMenu", handlePosition: "right", minWidth: 0, maxWidth: 1});
            wrapper.vm.initialDimensions.width = 300;
            wrapper.vm.deltaCursorPosition.x = 50;

            wrapper.vm.setNewSize();

            expect(setMainMenuWidthSpy.calledOnce).to.be.true;
            expect(setMainMenuWidthSpy.firstCall.args[1]).to.equal(350);
            expect(setSecondaryMenuWidthSpy.notCalled).to.be.true;
        });

        it("onVisibilityChange stops resizing when document becomes hidden", () => {
            mountComponent();
            const onMouseUpSpy = sinon.spy(wrapper.vm, "onMouseUp");

            wrapper.vm.isResizing = true;
            Object.defineProperty(document, "visibilityState", {configurable: true, value: "hidden"});

            wrapper.vm.onVisibilityChange();

            expect(onMouseUpSpy.calledOnce).to.be.true;
        });

        it("onWindowBlur stops resizing while resize is active", () => {
            mountComponent();
            const onMouseUpSpy = sinon.spy(wrapper.vm, "onMouseUp");

            wrapper.vm.isResizing = true;
            wrapper.vm.onWindowBlur();

            expect(onMouseUpSpy.calledOnce).to.be.true;
        });

        it("uses touchcancel as cancel event while resizing on touch devices", async () => {
            mountComponent();
            const addEventListenerSpy = sinon.spy(document, "addEventListener"),
                removeEventListenerSpy = sinon.spy(document, "removeEventListener");

            wrapper.vm.touchDevice = true;
            wrapper.vm.isResizing = true;
            await wrapper.vm.$nextTick();

            expect(addEventListenerSpy.calledWith("touchmove", wrapper.vm.boundOnMouseMove)).to.be.true;
            expect(addEventListenerSpy.calledWith("touchend", wrapper.vm.boundOnMouseUp)).to.be.true;
            expect(addEventListenerSpy.calledWith("touchcancel", wrapper.vm.boundOnMouseUp)).to.be.true;

            wrapper.vm.isResizing = false;
            await wrapper.vm.$nextTick();

            expect(removeEventListenerSpy.calledWith("touchmove", wrapper.vm.boundOnMouseMove)).to.be.true;
            expect(removeEventListenerSpy.calledWith("touchend", wrapper.vm.boundOnMouseUp)).to.be.true;
            expect(removeEventListenerSpy.calledWith("touchcancel", wrapper.vm.boundOnMouseUp)).to.be.true;
        });
    });

    describe("ResizeHandle (tests using shallow-mounted)", () => {
        let wrapper, setMainMenuWidthSpy, setSecondaryMenuWidthSpy;

        /**
         * Helper function
         * @returns {Object} Vuex-store with mocked modules
         */
        function createTestStore () {
            return createStore({
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            ResizeHandle: {
                                namespaced: true,
                                state: {mainMenuWidth: 0, secondaryMenuWidth: 0},
                                mutations: {
                                    setMainMenuWidth: (_, payload) => {
                                        setMainMenuWidthSpy(payload);
                                    },
                                    setSecondaryMenuWidth: (_, payload) => {
                                        setSecondaryMenuWidthSpy(payload);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        /**
         * Helper function
         * @returns {Object} Mounted component
         */
        function mountComponent (propsOverrides = {}) {
            return shallowMount(ResizeHandle, {
                global: {plugins: [createTestStore()]},
                props: {side: "mainMenu", ...propsOverrides}
            });
        }

        beforeEach(() => {
            setMainMenuWidthSpy = sinon.spy();
            setSecondaryMenuWidthSpy = sinon.spy();
        });

        afterEach(() => {
            sinon.restore(); // still needed in spite of vitest.setup

            if (wrapper) {
                wrapper.unmount();
                wrapper = null;
            }

            document.body.classList.remove("resize-handle-is-resizing");
            document.getElementById("resize-target")?.remove();
        });

        describe("template", () => {
            it("should render a button with id and class 'resize-handle'", () => {
                wrapper = mountComponent();
                const button = wrapper.find("button#resize-handle");

                expect(button.exists()).to.be.true;
                expect(button.classes()).to.include("resize-handle");
            });

            it("should apply 'resize-handle-type-{handlePosition}' and 'resize-handle-cursor-{cursorClass}' based on the handlePosition prop", () => {
                wrapper = mountComponent({handlePosition: "right"});
                expect(wrapper.find("button").classes()).to.include("resize-handle-type-right");
                expect(wrapper.find("button").classes()).to.include("resize-handle-cursor-ew-resize");
            });

            it("should apply 'resize-handle-is-resizing' class when isResizing is true", async () => {
                wrapper = mountComponent();
                await wrapper.setData({isResizing: true});
                expect(wrapper.find("button").classes()).to.include("resize-handle-is-resizing");
            });

            it("should not have 'resize-handle-is-resizing' class when isResizing is false", () => {
                wrapper = mountComponent();
                expect(wrapper.find("button").classes()).not.to.include("resize-handle-is-resizing");
            });
        });

        describe("cursorClass", () => {
            it("should return 'ew-resize' for 'right' handle position", () => {
                wrapper = mountComponent({handlePosition: "right"});
                expect(wrapper.vm.eventData.cursorClass).to.equal("ew-resize");
            });

            it("should return 'ew-resize' for 'left' handle position", () => {
                wrapper = mountComponent({handlePosition: "left"});
                expect(wrapper.vm.eventData.cursorClass).to.equal("ew-resize");
            });
        });

        describe("resizeEventNames", () => {
            it("should return mouse event names by default", () => {
                wrapper = mountComponent();
                expect(wrapper.vm.resizeEventNames).to.deep.equal({cancel: null, move: "mousemove", end: "mouseup"});
            });

            it("should return touch event names when touchDevice is true", async () => {
                wrapper = mountComponent();
                await wrapper.setData({touchDevice: true});
                expect(wrapper.vm.resizeEventNames).to.deep.equal({cancel: "touchcancel", move: "touchmove", end: "touchend"});
            });
        });

        describe("handleElement", () => {
            it("should return $el.parentNode by default", () => {
                wrapper = mountComponent();
                expect(wrapper.vm.handleElement).to.equal(wrapper.vm.$el.parentNode);
            });

            it("should return the DOM element matching targetElement when set", () => {
                const targetEl = document.createElement("div");

                targetEl.id = "resize-target";
                document.body.appendChild(targetEl);
                wrapper = mountComponent({targetElement: "#resize-target"});
                expect(wrapper.vm.handleElement).to.equal(targetEl);
            });
        });

        describe("isResizing watcher", () => {
            it("should emit 'startResizing' and add 'resize-handle-is-resizing' when isResizing becomes true", async () => {
                wrapper = mountComponent();
                await wrapper.setData({isResizing: true});
                expect(wrapper.emitted("startResizing")).to.have.length(1);
                expect(document.body.classList.contains("resize-handle-is-resizing")).to.be.true;
            });

            it("should emit 'endResizing' and remove 'resize-handle-is-resizing' when isResizing becomes false after being true", async () => {
                wrapper = mountComponent();
                await wrapper.setData({isResizing: true});
                await wrapper.setData({isResizing: false});
                expect(wrapper.emitted("endResizing")).to.have.length(1);
                expect(document.body.classList.contains("resize-handle-is-resizing")).to.be.false;
            });
        });

        describe("moveHandle", () => {
            it("should trigger clampAndApplyWidth when ArrowLeft is pressed", () => {
                wrapper = mountComponent();
                sinon.stub(document, "getElementById").callsFake((id) => {
                    if (id === "masterportal-container") {
                        return {offsetWidth: 2000};
                    }
                    return {offsetWidth: 100};
                });
                wrapper.vm.moveHandle("ArrowLeft");
                expect(setMainMenuWidthSpy.called).to.be.true;
            });

            it("should trigger clampAndApplyWidth when ArrowRight is pressed", () => {
                wrapper = mountComponent();
                sinon.stub(document, "getElementById").callsFake((id) => {
                    if (id === "masterportal-container") {
                        return {offsetWidth: 2000};
                    }
                    return {offsetWidth: 100};
                });
                wrapper.vm.moveHandle("ArrowRight");
                expect(setMainMenuWidthSpy.called).to.be.true;
            });

            it("should not trigger clampAndApplyWidth for non-arrow keys", () => {
                wrapper = mountComponent();
                sinon.stub(document, "getElementById").callsFake((id) => {
                    if (id === "masterportal-container") {
                        return {offsetWidth: 2000};
                    }
                    return {offsetWidth: 100};
                });
                wrapper.vm.moveHandle("Enter");
                expect(setMainMenuWidthSpy.called).to.be.false;
            });
        });

        describe("mouse and touch events", () => {
            it("should start resizing when touchStarted is false", () => {
                wrapper = mountComponent();
                wrapper.vm.onMouseDown({preventDefault: sinon.stub(), button: 0, clientX: 100, clientY: 200});
                expect(wrapper.vm.isResizing).to.be.true;
            });

            it("should not start resizing when touchStarted is true", async () => {
                wrapper = mountComponent();
                await wrapper.setData({touchStarted: true});
                wrapper.vm.onMouseDown({preventDefault: sinon.stub(), clientX: 100, clientY: 200});
                expect(wrapper.vm.isResizing).to.be.false;
            });

            it("should set isResizing to false", async () => {
                wrapper = mountComponent();
                await wrapper.setData({isResizing: true});
                wrapper.vm.onMouseUp();
                expect(wrapper.vm.isResizing).to.be.false;
            });

            it("should set touchDevice to true and start resizing", () => {
                wrapper = mountComponent();
                wrapper.vm.onTouchStart({
                    preventDefault: sinon.stub(),
                    touches: [{clientX: 50, clientY: 100}]
                });
                expect(wrapper.vm.touchDevice).to.be.true;
                expect(wrapper.vm.isResizing).to.be.true;
            });
        });

        describe("saveInitialCursorCoordinates", () => {
            it("should save mouse event coordinates to initialCursorPosition", () => {
                wrapper = mountComponent();
                wrapper.vm.saveInitialCursorCoordinates({clientX: 300, clientY: 150});
                expect(wrapper.vm.initialCursorPosition.x).to.equal(300);
                expect(wrapper.vm.initialCursorPosition.y).to.equal(150);
            });

            it("should save touch event coordinates to initialCursorPosition", () => {
                wrapper = mountComponent();
                wrapper.vm.saveInitialCursorCoordinates({touches: [{clientX: 100, clientY: 200}]});
                expect(wrapper.vm.initialCursorPosition.x).to.equal(100);
                expect(wrapper.vm.initialCursorPosition.y).to.equal(200);
            });
        });

        describe("saveInitialDimensions", () => {
            it("should save the element's current dimensions to initialDimensions", () => {
                wrapper = mountComponent();
                Object.defineProperty(wrapper.vm.handleElement, "offsetWidth", {value: 400, configurable: true});
                wrapper.vm.saveInitialDimensions();
                expect(wrapper.vm.initialDimensions.width).to.equal(400);
            });

            it("should use minWidth when the element is smaller than the minimum", () => {
                wrapper = mountComponent({minWidth: 0.3});
                wrapper.vm.saveInitialDimensions();
                expect(wrapper.vm.initialDimensions.width).to.equal(0.3);
            });
        });

        describe("setNewSize", () => {
            beforeEach(() => {
                sinon.stub(document, "getElementById").callsFake((id) => {
                    if (id === "masterportal-container") {
                        return {offsetWidth: 2000, offsetHeight: 1000};
                    }
                    return {offsetWidth: 100};
                });
            });
            it("should calculate width correctly for 'right' handle position (initial + 1 * deltaX)", () => {
                wrapper = mountComponent({handlePosition: "right"});
                setMainMenuWidthSpy.resetHistory();
                wrapper.vm.initialDimensions.width = 300;
                wrapper.vm.deltaCursorPosition.x = 50;
                wrapper.vm.setNewSize();
                expect(setMainMenuWidthSpy.calledWith(350)).to.be.true;
            });

            it("should calculate width correctly for 'left' handle position (initial + -1 * deltaX)", () => {
                wrapper = mountComponent({handlePosition: "left"});
                setMainMenuWidthSpy.resetHistory();
                wrapper.vm.initialDimensions.width = 300;
                wrapper.vm.deltaCursorPosition.x = 50;
                wrapper.vm.setNewSize();
                expect(setMainMenuWidthSpy.calledWith(250)).to.be.true;
            });
        });

        describe("setTouchStarted", () => {
            it("should set touchStarted to true", () => {
                wrapper = mountComponent();
                wrapper.vm.setTouchStarted();
                expect(wrapper.vm.touchStarted).to.be.true;
            });
        });

        describe("startResizing", () => {
            it("should set isResizing to true", () => {
                wrapper = mountComponent();
                wrapper.vm.startResizing({preventDefault: sinon.stub(), clientX: 100, clientY: 200});
                expect(wrapper.vm.isResizing).to.be.true;
            });

            it("should save the initial cursor coordinates", () => {
                wrapper = mountComponent();
                wrapper.vm.startResizing({preventDefault: sinon.stub(), clientX: 150, clientY: 250});
                expect(wrapper.vm.initialCursorPosition.x).to.equal(150);
                expect(wrapper.vm.initialCursorPosition.y).to.equal(250);
            });

            it("should call event.preventDefault", () => {
                wrapper = mountComponent();
                const mockEvent = {preventDefault: sinon.stub(), clientX: 0, clientY: 0};

                wrapper.vm.startResizing(mockEvent);
                expect(mockEvent.preventDefault.calledOnce).to.be.true;
            });

            it("should call saveInitialDimensions", () => {
                wrapper = mountComponent();
                const saveInitialDimensionsSpy = sinon.spy(wrapper.vm, "saveInitialDimensions");

                wrapper.vm.startResizing({preventDefault: sinon.stub(), clientX: 100, clientY: 200});

                expect(saveInitialDimensionsSpy.calledOnce).to.be.true;
            });
        });
    });
});
