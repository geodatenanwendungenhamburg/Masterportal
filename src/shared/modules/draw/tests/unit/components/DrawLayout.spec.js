import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import DrawLayoutComponent from "@shared/modules/draw/components/DrawLayout.vue";


describe("src/shared/modules/draw/components/DrawLayout.vue", () => {
    let currentLayout,
        setCurrentLayoutSpy,
        wrapper;

    beforeEach(() => {
        currentLayout = {
            fillColor: [55, 126, 184],
            fillTransparency: 0,
            strokeColor: [0, 0, 0],
            strokeWidth: 1,
            squareMethod: "interactive",
            squareArea: 0,
            squareUnit: "m"
        };
        setCurrentLayoutSpy = sinon.spy();
    });


    describe("render", () => {
        it("renders the layout buttons for drawType - pen ", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: currentLayout,
                    selectedDrawType: "pen",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            expect(wrapper.find("#draw-layout-innerCircle-fillColor").exists()).to.be.false;
            expect(wrapper.find("#draw-layout-innerCircle-fillTransparency").exists()).to.be.true;
            expect(wrapper.find("#draw-layout-innerCircle-strokeColor").exists()).to.be.true;
            expect(wrapper.find("#draw-layout-innerCircle-strokeWidth").exists()).to.be.true;
        });

        it("renders the writeText inputs when selectedDrawType is 'writeText'", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: currentLayout,
                    selectedDrawType: "writeText",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            expect(wrapper.find("#writeText").exists()).to.be.true;
            expect(wrapper.find("#font-size-select").exists()).to.be.true;
            expect(wrapper.find("#font-select").exists()).to.be.true;
        });

        it("renders square settings when selectedDrawType is 'square'", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: {...currentLayout, squareMethod: "defined"},
                    selectedDrawType: "square",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            expect(wrapper.find("#draw-settings-square-interactive-square").exists()).to.be.true;
            expect(wrapper.find("#draw-square-settings-unit-square").exists()).to.be.true;
            expect(wrapper.find("#draw-square-settings-area-square").exists()).to.be.true;
        });

        it("hides square unit and area when squareMethod is interactive", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: {...currentLayout, squareMethod: "interactive"},
                    selectedDrawType: "square",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            expect(wrapper.find("#draw-square-settings-unit-square").exists()).to.be.false;
            expect(wrapper.find("#draw-square-settings-area-square").exists()).to.be.false;
        });

        it("renders the layout buttons for drawType - circle ", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: currentLayout,
                    selectedDrawType: "circle",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            expect(wrapper.find("#draw-layout-innerCircle-fillColor").exists()).to.be.true;
            expect(wrapper.find("#draw-layout-innerCircle-fillTransparency").exists()).to.be.true;
            expect(wrapper.find("#draw-layout-innerCircle-strokeColor").exists()).to.be.true;
            expect(wrapper.find("#draw-layout-innerCircle-strokeWidth").exists()).to.be.true;
        });

        it("renders the slider for strokeWidth of drawType - circle ", async () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: currentLayout,
                    selectedDrawType: "circle",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            await wrapper.vm.$nextTick();
            await wrapper.find("#draw-layout-innerCircle-strokeWidth").trigger("click");

            expect(wrapper.find("#draw-layout-innerCircle-strokeWidth").exists()).to.be.true;
            expect(wrapper.find("#slider-stroke-width-innerCircle").exists()).to.be.true;
        });

        it("renders the slider for fillTransparency of drawType - circle ", async () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: currentLayout,
                    selectedDrawType: "circle",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            await wrapper.vm.$nextTick();
            await wrapper.find("#draw-layout-innerCircle-fillTransparency").trigger("click");

            expect(wrapper.find("#draw-layout-innerCircle-fillTransparency").exists()).to.be.true;
            expect(wrapper.find("#slider-fill-transparency-innerCircle").exists()).to.be.true;
        });
    });

    describe("setActiveLayoutKey", () => {
        it("should set activeLayoutKey to fillColor", () => {
            const layoutKey = "fillColor";

            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: currentLayout,
                    selectedDrawType: "circle",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            wrapper.vm.setActiveLayoutKey(layoutKey);
            expect(wrapper.vm.activeLayoutKey).to.equals(layoutKey);
        });
    });

    describe("updateCurrentLayout", () => {
        it("should set current layout and emit event", () => {
            const layoutKey = "fillColor",
                value = "#ff00aa";

            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: currentLayout,
                    selectedDrawType: "circle",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            wrapper.vm.updateCurrentLayout(layoutKey, value);

            expect(setCurrentLayoutSpy.calledOnce).to.be.true;
            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({
                fillColor: [255, 0, 170]
            });
            expect(wrapper.emitted()["update-current-layout"]).to.exist;
            expect(wrapper.emitted()["update-current-layout"][0]).to.deep.equals([{
                fillColor: [255, 0, 170]
            }]);
        });

        it("should set text as string without conversion", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "writeText", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.updateCurrentLayout("text", "Hallo Welt");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({text: "Hallo Welt"});
        });

        it("should set font as string without conversion", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "writeText", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.updateCurrentLayout("font", "Times New Roman");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({font: "Times New Roman"});
        });

        it("should set fontSize as integer via parseInt", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "writeText", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.updateCurrentLayout("fontSize", "24");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({fontSize: 24});
        });

        it("should set squareMethod as string without conversion", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "square", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.updateCurrentLayout("squareMethod", "defined");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({squareMethod: "defined"});
        });

        it("should set squareUnit without converting squareArea", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "square", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.updateSquareUnit("km");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({squareUnit: "km"});
        });

        it("should parse squareArea as float", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "square", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.updateSquareArea("12.5");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({squareArea: 12.5});
        });

        it("should convert squareArea from km to square meters", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: {...currentLayout, squareUnit: "km"},
                    selectedDrawType: "square",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            wrapper.vm.updateSquareArea("6.5");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({squareArea: 6500000});
        });

        it("should reset squareArea to zero for invalid input", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout,
                    selectedDrawType: "square",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            wrapper.vm.updateSquareArea("");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({squareArea: 0});
        });

        it("should keep stored squareArea when switching from km to m", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: {...currentLayout, squareUnit: "km", squareArea: 6500000},
                    selectedDrawType: "square",
                    setCurrentLayout: setCurrentLayoutSpy
                }
            });

            wrapper.vm.updateSquareUnit("m");

            expect(setCurrentLayoutSpy.firstCall.args[0]).to.deep.equals({squareUnit: "m"});
        });
    });

    describe("hasExtrudedHeight", () => {
        it("should include extrudedHeight in mappingLayout if hasExtrudedHeight is true", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "polygon", setCurrentLayout: setCurrentLayoutSpy, hasExtrudedHeight: true}
            });

            expect(wrapper.vm.mappingLayout).to.have.property("extrudedHeight");
        });

        it("should not include extrudedHeight in mappingLayout if hasExtrudedHeight is false", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "polygon", setCurrentLayout: setCurrentLayoutSpy}
            });

            expect(wrapper.vm.mappingLayout).to.not.have.property("extrudedHeight");
        });

        it("should render extrudedHeight slider when activeLayoutKey is 'extrudedHeight' and hasExtrudedHeight is true", async () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {
                    currentLayout: {...currentLayout, extrudedHeight: 10},
                    selectedDrawType: "polygon",
                    setCurrentLayout: setCurrentLayoutSpy,
                    hasExtrudedHeight: true
                }
            });

            wrapper.vm.activeLayoutKey = "extrudedHeight";
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#slider-extruded-height-innerCircle").exists()).to.be.true;
        });
    });

    describe("selectedDrawType watcher", () => {
        it("should reset activeLayoutKey when selectedDrawType changes", async () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "circle", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.activeLayoutKey = "fillColor";
            await wrapper.setProps({selectedDrawType: "line"});

            expect(wrapper.vm.activeLayoutKey).to.equal("");
        });

        it("should call updateTrianglePosition if new selectedDrawType is in drawTypesMain", async () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "circle", setCurrentLayout: setCurrentLayoutSpy}
            });

            const updateTrianglePositionSpy = sinon.spy(wrapper.vm, "updateTrianglePosition");

            await wrapper.setProps({selectedDrawType: "pen"});

            expect(updateTrianglePositionSpy.calledOnce).to.be.true;
            expect(updateTrianglePositionSpy.firstCall.args[0]).to.equal("pen");
        });

        it("should not call updateTrianglePosition if new selectedDrawType is not in drawTypesMain", async () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "circle", setCurrentLayout: setCurrentLayoutSpy}
            });

            const updateTrianglePositionSpy = sinon.spy(wrapper.vm, "updateTrianglePosition");

            await wrapper.setProps({selectedDrawType: "line"});

            expect(updateTrianglePositionSpy.notCalled).to.be.true;
        });
    });

    describe("mappingLayoutBySelectedDrawType computed", () => {
        it("should delegate to filterMappingLayoutByDrawType", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "polygon", setCurrentLayout: setCurrentLayoutSpy}
            });

            const result = wrapper.vm.mappingLayoutBySelectedDrawType;

            expect(result).to.have.property("fillColor");
            expect(result).to.have.property("strokeColor");
            expect(result).to.have.property("strokeWidth");
            expect(result).to.have.property("fillTransparency");
        });

        it("should not include fillColor for 'line' draw type", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "line", setCurrentLayout: setCurrentLayoutSpy}
            });

            const result = wrapper.vm.mappingLayoutBySelectedDrawType;

            expect(result).to.not.have.property("fillColor");
        });
    });

    describe("updateTrianglePosition", () => {
        it("should update trianglePosition when DOM elements exist", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "pen", setCurrentLayout: setCurrentLayoutSpy}
            });

            const stub = sinon.stub(document, "getElementById");

            stub.withArgs("main-drawtypes-container").returns({
                getBoundingClientRect: () => ({x: 50})
            });
            stub.withArgs("draw-pen").returns({
                getBoundingClientRect: () => ({x: 100, width: 40})
            });

            wrapper.vm.updateTrianglePosition("pen");

            // (100 + 40/2) - 50 = 70
            expect(wrapper.vm.trianglePosition).to.equal(70);
        });

        it("should not update trianglePosition if DOM elements are not found", () => {
            wrapper = shallowMount(DrawLayoutComponent, {
                propsData: {currentLayout, selectedDrawType: "pen", setCurrentLayout: setCurrentLayoutSpy}
            });

            wrapper.vm.trianglePosition = 50;
            sinon.stub(document, "getElementById").returns(null);

            wrapper.vm.updateTrianglePosition("pen");

            expect(wrapper.vm.trianglePosition).to.equal(50);
        });
    });
});
