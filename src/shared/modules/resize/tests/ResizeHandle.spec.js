import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import ResizeHandleComponent, {clampAndApplyHeight, clampAndApplyWidth, dimensionValidator} from "@shared/modules/resize/components/ResizeHandle.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/resize/components/ResizeHandle.vue", () => {
    describe("ResizeHandle component", () => {
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
            return shallowMount(ResizeHandleComponent, {
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
            it("should return 'nesw-resize' for 'bottomLeft' handle position", () => {
                wrapper = mountComponent({handlePosition: "bottomLeft"});
                expect(wrapper.vm.cursorClass).to.equal("nesw-resize");
            });

            it("should return 'ew-resize' for 'right' handle position", () => {
                wrapper = mountComponent({handlePosition: "right"});
                expect(wrapper.vm.cursorClass).to.equal("ew-resize");
            });

            it("should return 'ns-resize' for 'top' handle position", () => {
                wrapper = mountComponent({handlePosition: "top"});
                expect(wrapper.vm.cursorClass).to.equal("ns-resize");
            });

            it("should return 'nwse-resize' for 'topLeft' handle position", () => {
                wrapper = mountComponent({handlePosition: "topLeft"});
                expect(wrapper.vm.cursorClass).to.equal("nwse-resize");
            });
        });

        describe("resizeEventNames", () => {
            it("should return mouse event names by default", () => {
                wrapper = mountComponent();
                expect(wrapper.vm.resizeEventNames).to.deep.equal({move: "mousemove", end: "mouseup"});
            });

            it("should return touch event names when touchDevice is true", async () => {
                wrapper = mountComponent();
                await wrapper.setData({touchDevice: true});
                expect(wrapper.vm.resizeEventNames).to.deep.equal({move: "touchmove", end: "touchend"});
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
                wrapper.vm.onMouseDown({preventDefault: sinon.stub(), clientX: 100, clientY: 200});
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
                Object.defineProperty(wrapper.vm.handleElement, "offsetHeight", {value: 250, configurable: true});
                wrapper.vm.saveInitialDimensions();
                expect(wrapper.vm.initialDimensions.width).to.equal(400);
                expect(wrapper.vm.initialDimensions.height).to.equal(250);
            });

            it("should use minWidth/minHeight when the element is smaller than the minimum", () => {
                wrapper = mountComponent({minWidth: 0.3, minHeight: 0.2});
                wrapper.vm.saveInitialDimensions();
                expect(wrapper.vm.initialDimensions.width).to.equal(0.3);
                expect(wrapper.vm.initialDimensions.height).to.equal(0.2);
            });
        });

        describe("saveInitialPosition", () => {
            it("should save the element's offset position to initialPosition", () => {
                wrapper = mountComponent();
                Object.defineProperty(wrapper.vm.handleElement, "offsetLeft", {value: 60, configurable: true});
                Object.defineProperty(wrapper.vm.handleElement, "offsetTop", {value: 90, configurable: true});
                wrapper.vm.saveInitialPosition();
                expect(wrapper.vm.initialPosition.left).to.equal(60);
                expect(wrapper.vm.initialPosition.top).to.equal(90);
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

            it("should call clampAndApplyWidth for non-top/bottom handle positions", () => {
                wrapper = mountComponent({handlePosition: "right"});
                setMainMenuWidthSpy.resetHistory();
                wrapper.vm.initialDimensions.width = 300;
                wrapper.vm.setNewSize();
                expect(setMainMenuWidthSpy.calledWith(300)).to.be.true;
            });

            it("should call clampAndApplyHeight for 'top' handle position", () => {
                wrapper = mountComponent({handlePosition: "top"});
                wrapper.vm.initialDimensions.height = 500;
                wrapper.vm.setNewSize();
                expect(wrapper.vm.handleElement.style.height).to.equal("500px");
            });

            it("should call clampAndApplyHeight for 'bottom' handle position", () => {
                wrapper = mountComponent({handlePosition: "bottom"});
                wrapper.vm.initialDimensions.height = 400;
                wrapper.vm.setNewSize();
                expect(wrapper.vm.handleElement.style.height).to.equal("400px");
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
        });
    });

    describe("clampAndApplyHeight", () => {
        let self, containerElement, handleElement;

        beforeEach(() => {
            handleElement = {
                style: {
                    maxHeight: "200px",
                    height: ""
                }
            };
            containerElement = {
                offsetHeight: 1000
            };
            self = {
                minHeight: 0.1,
                maxHeight: 0.9,
                handleElement
            };

            sinon.stub(document, "getElementById").returns(containerElement);
        });

        it("should do nothing if the masterportal-container element is not found", () => {
            document.getElementById.returns(null);
            clampAndApplyHeight(self, 500);
            expect(self.handleElement.style.height).to.equal("");
        });

        it("should apply the calculatedHeight when it is within the min/max bounds", () => {
            clampAndApplyHeight(self, 500);
            expect(self.handleElement.style.height).to.equal("500px");
        });

        it("should clamp height to the minimum bound when calculatedHeight is below the minimum", () => {
            clampAndApplyHeight(self, 50);
            expect(self.handleElement.style.height).to.equal("100px");
        });

        it("should clamp height to the maximum bound when calculatedHeight exceeds the maximum", () => {
            clampAndApplyHeight(self, 950);
            expect(self.handleElement.style.height).to.equal("900px");
        });

        it("should apply exactly the minimum bound height when calculatedHeight equals the minimum", () => {
            clampAndApplyHeight(self, 100);
            expect(self.handleElement.style.height).to.equal("100px");
        });

        it("should apply exactly the maximum bound height when calculatedHeight equals the maximum", () => {
            clampAndApplyHeight(self, 900);
            expect(self.handleElement.style.height).to.equal("900px");
        });

        it("should clamp a negative calculatedHeight to the minimum bound", () => {
            clampAndApplyHeight(self, -50);
            expect(self.handleElement.style.height).to.equal("100px");
        });

        it("should clamp to zero when minHeight is 0 and calculatedHeight is negative", () => {
            self.minHeight = 0;
            clampAndApplyHeight(self, -100);
            expect(self.handleElement.style.height).to.equal("0px");
        });

        it("should reset maxHeight style to 'none' when it is not already 'none'", () => {
            self.handleElement.style.maxHeight = "500px";
            clampAndApplyHeight(self, 500);
            expect(self.handleElement.style.maxHeight).to.equal("none");
        });

        it("should leave maxHeight style as 'none' when it is already 'none'", () => {
            self.handleElement.style.maxHeight = "none";
            clampAndApplyHeight(self, 500);
            expect(self.handleElement.style.maxHeight).to.equal("none");
        });

        it("should round the resulting height up when the fractional part is >= 0.5", () => {
            clampAndApplyHeight(self, 500.7);
            expect(self.handleElement.style.height).to.equal("501px");
        });

        it("should round the resulting height down when the fractional part is < 0.5", () => {
            clampAndApplyHeight(self, 500.2);
            expect(self.handleElement.style.height).to.equal("500px");
        });

        it("should derive min/max bounds from the container's offsetHeight", () => {
            containerElement.offsetHeight = 2000;
            clampAndApplyHeight(self, 100);
            expect(self.handleElement.style.height).to.equal("200px");
        });
    });

    describe("clampAndApplyWidth", () => {
        let self, containerElement, otherMenuElement, handleElement;

        beforeEach(() => {
            handleElement = {
                style: {
                    maxWidth: "500px",
                    width: ""
                }
            };
            containerElement = {offsetWidth: 2000};
            otherMenuElement = {offsetWidth: 200};
            self = {
                side: "mainMenu",
                minWidth: 0.1,
                maxWidth: 0.9,
                handleElement,
                setMainMenuWidth: sinon.stub(),
                setSecondaryMenuWidth: sinon.stub()
            };

            sinon.stub(document, "getElementById").callsFake((id) => {
                if (id === "masterportal-container") {
                    return containerElement;
                }
                return otherMenuElement;
            });
        });

        it("should do nothing if the masterportal-container element is not found", () => {
            document.getElementById.callsFake((id) => {
                if (id === "masterportal-container") {
                    return null;
                }

                return otherMenuElement;
            });

            clampAndApplyWidth(self, 800);
            expect(self.handleElement.style.width).to.equal("");
        });

        it("should do nothing if the other menu element is not found", () => {
            document.getElementById.callsFake((id) => {
                if (id === "masterportal-container") {
                    return containerElement;
                }

                return null;
            });

            clampAndApplyWidth(self, 800);
            expect(self.handleElement.style.width).to.equal("");
        });

        it("should apply the calculatedWidth when it is within the min/max bounds", () => {
            clampAndApplyWidth(self, 800);
            expect(self.handleElement.style.width).to.equal("800px");
        });

        it("should clamp width to the minimum bound when calculatedWidth is below the minimum", () => {
            clampAndApplyWidth(self, 100);
            expect(self.handleElement.style.width).to.equal("200px");
        });

        it("should clamp width to the maximum bound when calculatedWidth exceeds the maximum", () => {
            clampAndApplyWidth(self, 1500);
            expect(self.handleElement.style.width).to.equal("1300px");
        });

        it("should apply exactly the minimum bound width when calculatedWidth equals the minimum", () => {
            clampAndApplyWidth(self, 200);
            expect(self.handleElement.style.width).to.equal("200px");
        });

        it("should apply exactly the maximum bound width when calculatedWidth equals the maximum", () => {
            clampAndApplyWidth(self, 1300);
            expect(self.handleElement.style.width).to.equal("1300px");
        });

        it("should call setMainMenuWidth with the new width when side is 'mainMenu'", () => {
            self.side = "mainMenu";
            clampAndApplyWidth(self, 800);
            expect(self.setMainMenuWidth.calledOnce).to.be.true;
            expect(self.setMainMenuWidth.calledWith(800)).to.be.true;
        });

        it("should call setSecondaryMenuWidth with the new width when side is 'secondaryMenu'", () => {
            self.side = "secondaryMenu";
            clampAndApplyWidth(self, 800);
            expect(self.setSecondaryMenuWidth.calledOnce).to.be.true;
            expect(self.setSecondaryMenuWidth.calledWith(800)).to.be.true;
        });

        it("should not call setMainMenuWidth when side is 'secondaryMenu'", () => {
            self.side = "secondaryMenu";
            clampAndApplyWidth(self, 800);
            expect(self.setMainMenuWidth.called).to.be.false;
        });

        it("should not call setSecondaryMenuWidth when side is 'mainMenu'", () => {
            self.side = "mainMenu";
            clampAndApplyWidth(self, 800);
            expect(self.setSecondaryMenuWidth.called).to.be.false;
        });

        it("should look up 'mp-menu-secondaryMenu' as the other menu when side is 'mainMenu'", () => {
            self.side = "mainMenu";
            clampAndApplyWidth(self, 800);
            expect(document.getElementById.calledWith("mp-menu-secondaryMenu")).to.be.true;
        });

        it("should look up 'mp-menu-mainMenu' as the other menu when side is 'secondaryMenu'", () => {
            self.side = "secondaryMenu";
            clampAndApplyWidth(self, 800);
            expect(document.getElementById.calledWith("mp-menu-mainMenu")).to.be.true;
        });

        it("should factor the other menu's width into the maximum bound", () => {
            otherMenuElement.offsetWidth = 500;
            clampAndApplyWidth(self, 1200);
            expect(self.handleElement.style.width).to.equal("1000px");
        });

        it("should reset maxWidth style to 'none' when it is not already 'none'", () => {
            self.handleElement.style.maxWidth = "600px";
            clampAndApplyWidth(self, 800);
            expect(self.handleElement.style.maxWidth).to.equal("none");
        });

        it("should leave maxWidth style as 'none' when it is already 'none'", () => {
            self.handleElement.style.maxWidth = "none";
            clampAndApplyWidth(self, 800);
            expect(self.handleElement.style.maxWidth).to.equal("none");
        });

        it("should round the resulting width up when the fractional part is >= 0.5", () => {
            clampAndApplyWidth(self, 800.7);
            expect(self.handleElement.style.width).to.equal("801px");
        });

        it("should round the resulting width down when the fractional part is < 0.5", () => {
            clampAndApplyWidth(self, 800.2);
            expect(self.handleElement.style.width).to.equal("800px");
        });

        it("should derive min/max bounds from the container's offsetWidth", () => {
            containerElement.offsetWidth = 4000;
            clampAndApplyWidth(self, 100);
            expect(self.handleElement.style.width).to.equal("400px");
        });
    });

    describe("dimensionValidator", () => {
        it("should return true for a value between 0 and 1", () => {
            expect(dimensionValidator(0)).to.be.true;
            expect(dimensionValidator(0.5)).to.be.true;
            expect(dimensionValidator(1)).to.be.true;
        });

        it("should return false for a value below 0 or above 1", () => {
            expect(dimensionValidator(-0.1)).to.be.false;
            expect(dimensionValidator(1.1)).to.be.false;
        });

        it("should return false for invalid values", () => {
            expect(dimensionValidator("0.5")).to.be.false;
            expect(dimensionValidator("hello")).to.be.false;
            expect(dimensionValidator(Infinity)).to.be.false;
            expect(dimensionValidator(NaN)).to.be.false;
            expect(dimensionValidator(null)).to.be.false;
            expect(dimensionValidator(undefined)).to.be.false;
            expect(dimensionValidator(true)).to.be.false;
            expect(dimensionValidator(false)).to.be.false;
            expect(dimensionValidator([])).to.be.false;
            expect(dimensionValidator({})).to.be.false;
        });
    });
});
