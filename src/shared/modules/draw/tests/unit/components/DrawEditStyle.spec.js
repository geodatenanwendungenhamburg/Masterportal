import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import sinon from "sinon";

import DrawEditStyleComponent from "@shared/modules/draw/components/DrawEditStyle.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/draw/components/DrawEditStyle.vue", () => {
    let wrapper;

    afterEach(() => {
        sinon.restore();
        if (wrapper) {
            wrapper.unmount();
        }
    });

    /**
     * Creates a feature with the given drawState stored in masterportal_attributes.
     * @param {Object} drawState The drawState to set on the feature.
     * @returns {ol/Feature} The created feature.
     */
    function createFeatureWithDrawState (drawState) {
        const feature = new Feature({geometry: new Point([0, 0])});

        feature.set("masterportal_attributes", {drawState});
        return feature;
    }

    /**
     * Mounts the DrawEditStyle component with the given props.
     * @param {Object} [props={}] The props to pass to the component.
     * @returns {Object} The mounted wrapper.
     */
    function mountComponent (props = {}) {
        wrapper = shallowMount(DrawEditStyleComponent, {
            props
        });
        return wrapper;
    }

    describe("without selected feature", () => {
        it("should show the choose-feature hint when no feature is selected", () => {
            mountComponent({selectedFeature: null});

            expect(wrapper.text()).to.include("common:shared.modules.draw.drawEdit.chooseFeature");
        });

        it("should not render style controls when no feature is selected", () => {
            mountComponent({selectedFeature: null});

            expect(wrapper.find(".draw-edit-style").exists()).to.be.false;
        });
    });

    describe("text feature", () => {
        it("should render text input for text features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "writeText", geometry: "Point"},
                text: "Hello",
                fontSize: 16,
                font: "Arial",
                color: [0, 0, 0, 1],
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-text").exists()).to.be.true;
            expect(wrapper.find("#draw-edit-style-font-size").exists()).to.be.true;
            expect(wrapper.find("#draw-edit-style-font").exists()).to.be.true;
        });

        it("should render fill color button for text features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "writeText", geometry: "Point"},
                text: "Hello",
                fontSize: 16,
                font: "Arial",
                color: [255, 0, 0, 1],
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-fill-color").exists()).to.be.true;
        });

        it("should not render stroke color button for text features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "writeText", geometry: "Point"},
                text: "Hello",
                color: [0, 0, 0, 1],
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-stroke-color").exists()).to.be.false;
        });
    });

    describe("line feature", () => {
        it("should render stroke color and stroke width buttons", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawLine", geometry: "LineString"},
                colorContour: [200, 0, 0, 1],
                strokeWidth: 3,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-stroke-color").exists()).to.be.true;
            expect(wrapper.find("#draw-edit-style-stroke-width").exists()).to.be.true;
        });

        it("should not render fill color button for line features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawLine", geometry: "LineString"},
                colorContour: [0, 0, 0, 1],
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-fill-color").exists()).to.be.false;
        });

        it("should render transparency button for line features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawLine", geometry: "LineString"},
                colorContour: [0, 0, 0, 0.5],
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-transparency").exists()).to.be.true;
        });
    });

    describe("polygon feature", () => {
        it("should render all style buttons for polygon features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawArea", geometry: "Polygon"},
                color: [0, 128, 255, 0.5],
                colorContour: [0, 0, 0, 1],
                strokeWidth: 2,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-fill-color").exists()).to.be.true;
            expect(wrapper.find("#draw-edit-style-stroke-color").exists()).to.be.true;
            expect(wrapper.find("#draw-edit-style-stroke-width").exists()).to.be.true;
            expect(wrapper.find("#draw-edit-style-transparency").exists()).to.be.true;
        });
    });

    describe("point feature", () => {
        it("should render point size slider for simple points", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawSymbol", geometry: "Point"},
                color: [55, 126, 184, 1],
                colorContour: [0, 0, 0, 1],
                pointSize: 16,
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-point-size").exists()).to.be.true;
        });

        it("should render fill and stroke color buttons for simple points", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawSymbol", geometry: "Point"},
                color: [55, 126, 184, 1],
                colorContour: [0, 0, 0, 1],
                pointSize: 16,
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-fill-color").exists()).to.be.true;
            expect(wrapper.find("#draw-edit-style-stroke-color").exists()).to.be.true;
        });
    });

    describe("icon feature", () => {
        it("should render icon scale slider for icon features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawSymbol", geometry: "Point"},
                symbol: {value: "https://example.com/icon.svg", scale: 1},
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-icon-scale").exists()).to.be.true;
        });

        it("should not render fill/stroke buttons for icon features", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawSymbol", geometry: "Point"},
                symbol: {value: "https://example.com/icon.svg", scale: 1},
                strokeWidth: 1,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit-style-fill-color").exists()).to.be.false;
            expect(wrapper.find("#draw-edit-style-stroke-color").exists()).to.be.false;
        });
    });

    describe("updateStyle", () => {
        it("should call applyStyleChange and update local state", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawArea", geometry: "Polygon"},
                color: [0, 128, 255, 0.5],
                colorContour: [0, 0, 0, 1],
                strokeWidth: 2,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            wrapper.vm.updateStyle("strokeWidth", 5);

            expect(wrapper.vm.editState.strokeWidth).to.equal(5);

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.strokeWidth).to.equal(5);
        });
    });

    describe("feature selection change", () => {
        it("should reset editState when feature changes to null", async () => {
            const feature = createFeatureWithDrawState({
                drawType: {id: "drawLine", geometry: "LineString"},
                colorContour: [0, 0, 0, 1],
                strokeWidth: 2,
                zIndex: 0
            });

            mountComponent({selectedFeature: feature});
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.editState).to.not.be.null;

            await wrapper.setProps({selectedFeature: null});

            expect(wrapper.vm.editState).to.be.null;
        });

        it("should update editState when feature changes to a different type", async () => {
            const lineFeature = createFeatureWithDrawState({
                    drawType: {id: "drawLine", geometry: "LineString"},
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 2,
                    zIndex: 0
                }),
                polygonFeature = createFeatureWithDrawState({
                    drawType: {id: "drawArea", geometry: "Polygon"},
                    color: [0, 128, 255, 0.5],
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 1,
                    zIndex: 0
                });

            mountComponent({selectedFeature: lineFeature});
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.editState.editType).to.equal("line");

            await wrapper.setProps({selectedFeature: polygonFeature});

            expect(wrapper.vm.editState.editType).to.equal("polygon");
        });
    });
});
