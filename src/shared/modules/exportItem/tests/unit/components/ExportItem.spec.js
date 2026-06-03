import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";

import ExportItemComponent from "../../../components/ExportItem.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/exportItem/components/ExportItem.vue", () => {
    let store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        projectionCode: () => "EPSG:25832"
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        if (wrapper) {
            wrapper.unmount();
        }
    });

    /**
     * Mounts the ExportItem component with the given props.
     * @param {Object} [propsData={}] - Additional props to pass.
     * @returns {Object} The wrapper instance.
     */
    function mountComponent (propsData = {}) {
        return shallowMount(ExportItemComponent, {
            global: {
                plugins: [store]
            },
            props: {
                formats: ["KML", "GEOJSON", "GPX"],
                features: [],
                ...propsData
            }
        });
    }

    describe("Component rendering", () => {
        it("should render the component", () => {
            wrapper = mountComponent();

            expect(wrapper.find("#tool-draw-download").exists()).to.be.true;
        });

        it("should render the headline", () => {
            wrapper = mountComponent();

            expect(wrapper.find(".fw-bold").text()).to.equal("common:shared.modules.draw.download.headline");
        });

        it("should render format options", () => {
            wrapper = mountComponent({formats: ["KML", "GEOJSON"]});

            const options = wrapper.findAll("#tool-draw-download-format option");

            // +1 for the "please choose" option
            expect(options).to.have.lengthOf(3);
        });
    });

    describe("computed: hasUnsupportedPolygonsForGPX", () => {
        it("should return false if exportFormat is not GPX", () => {
            wrapper = mountComponent({
                features: [new Feature({geometry: new Polygon([[[0, 0], [1, 1], [2, 0], [0, 0]]])})]
            });

            wrapper.vm.exportFormat = "KML";

            expect(wrapper.vm.hasUnsupportedPolygonsForGPX).to.be.false;
        });

        it("should return true if exportFormat is GPX and a Polygon feature exists", () => {
            wrapper = mountComponent({
                features: [new Feature({geometry: new Polygon([[[0, 0], [1, 1], [2, 0], [0, 0]]])})]
            });

            wrapper.vm.exportFormat = "GPX";

            expect(wrapper.vm.hasUnsupportedPolygonsForGPX).to.be.true;
        });

        it("should return false if exportFormat is GPX but no polygon features exist", () => {
            wrapper = mountComponent({
                features: [new Feature({geometry: new Point([0, 0])})]
            });

            wrapper.vm.exportFormat = "GPX";

            expect(wrapper.vm.hasUnsupportedPolygonsForGPX).to.be.false;
        });
    });

    describe("computed: hasSymbolsForGPX", () => {
        it("should return false if exportFormat is not GPX", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {drawState: {drawType: {id: "drawSymbol"}}});
            wrapper = mountComponent({features: [feature]});
            wrapper.vm.exportFormat = "KML";

            expect(wrapper.vm.hasSymbolsForGPX).to.be.false;
        });

        it("should return true if exportFormat is GPX and a symbol feature exists", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {drawState: {drawType: {id: "drawSymbol"}}});
            wrapper = mountComponent({features: [feature]});
            wrapper.vm.exportFormat = "GPX";

            expect(wrapper.vm.hasSymbolsForGPX).to.be.true;
        });

        it("should return false if exportFormat is GPX but no symbol features exist", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {drawState: {drawType: {id: "drawLine"}}});
            wrapper = mountComponent({features: [feature]});
            wrapper.vm.exportFormat = "GPX";

            expect(wrapper.vm.hasSymbolsForGPX).to.be.false;
        });
    });

    describe("method: onFormatChange", () => {
        it("should set exportFormat from the event target value", () => {
            wrapper = mountComponent();

            wrapper.vm.onFormatChange({target: {value: "GPX"}});

            expect(wrapper.vm.exportFormat).to.equal("GPX");
        });

        it("should handle 'none' value", async () => {
            wrapper = mountComponent();

            wrapper.vm.onFormatChange({target: {value: "none"}});
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.exportFormat).to.equal("none");
            expect(wrapper.find("#downloadBtn").classes()).to.include("disabled");
        });
    });

    describe("method: startDownload", () => {
        it("should not call any handler if exportFormat is null", async () => {
            wrapper = mountComponent();
            const spy = sinon.spy(wrapper.vm, "triggerFileDownload");

            await wrapper.vm.startDownload();

            expect(spy.called).to.be.false;
        });

        it("should not call any handler if hasUnsupportedPolygonsForGPX is true", async () => {
            wrapper = mountComponent({
                features: [new Feature({geometry: new Polygon([[[0, 0], [1, 1], [2, 0], [0, 0]]])})]
            });
            wrapper.vm.exportFormat = "GPX";
            const spy = sinon.spy(wrapper.vm, "triggerFileDownload");

            await wrapper.vm.startDownload();

            expect(spy.called).to.be.false;
        });
    });

    describe("template: GPX warnings", () => {
        it("should show the unsupported polygon warning when hasUnsupportedPolygonsForGPX is true", async () => {
            wrapper = mountComponent({
                features: [new Feature({geometry: new Polygon([[[0, 0], [1, 1], [2, 0], [0, 0]]])})]
            });

            wrapper.vm.exportFormat = "GPX";
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".text-danger").exists()).to.be.true;
            expect(wrapper.find(".text-danger").text()).to.equal("common:shared.modules.draw.download.geometryTypeNotSupported");
        });

        it("should show the symbol warning when hasSymbolsForGPX is true and no polygon issue", async () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {drawState: {drawType: {id: "drawSymbol"}}});
            wrapper = mountComponent({features: [feature]});
            wrapper.vm.exportFormat = "GPX";
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".text-warning").exists()).to.be.true;
        });
    });

    describe("template: download button", () => {
        it("should have disabled class when fileName is empty", () => {
            wrapper = mountComponent();

            const btn = wrapper.find("#downloadBtn");

            expect(btn.classes()).to.include("disabled");
        });
    });
});
