import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import DrawItemComponent from "@modules/draw_old/components/DrawItem.vue";
import Draw_old from "@modules/draw_old/store/indexDraw";
import {expect} from "chai";
import sinon from "sinon";
import app from "@modules/draw_old/js/main";
import * as constants from "@modules/draw_old/store/constantsDraw";

config.global.mocks.$t = key => key;
config.global.mocks.$i18n = {
    i18next: {
        exists: sinon.stub(),
        options: {
            isEnabled: () => sinon.stub(),
            getLanguages: () => sinon.stub()
        }
    }
};

describe("src/modules/draw/components/DrawItem.vue", () => {
    const actionsOrig = {...Draw_old.actions};
    let store,
        wrapper,
        componentData;


    beforeEach(() => {
        const map = {
            id: "ol",
            mode: "2D",
            getLayers: () => {
                return {
                    getArray: () => []
                };
            }
        };

        Draw_old.actions = Object.assign({}, actionsOrig, {startInteractions: sinon.stub()});
        app.config.globalProperties.$layer = {
            visible: true,
            getVisible: () => app.config.globalProperties.$layer.visible,
            setVisible: value => {
                app.config.globalProperties.$layer.visible = value;
            },
            getSource: () => {
                return {
                    getFeatures: () => []
                };
            }
        };

        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addLayer: sinon.stub(),
                        checkLayer: sinon.stub(),
                        addInteraction: sinon.stub()
                    },
                    getters: {
                        mode: () => "2D"
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        Draw_old
                    }
                }
            }
        });
        componentData = () => {
            return {
                mapElement: {style: {cursor: "pointer"}},
                constants: constants,
                drawing: true
            };
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });

    afterEach(() => {
        sinon.restore();
        Draw_old.actions = actionsOrig;
    });

    /**
     * Mounts the DrawItemComponent with specified draw type, geometry, and style settings for testing.
     *
     * @param {string} drawType - The draw type identifier ('drawArea', 'drawSquare', 'drawLine').
     * @param {string} geometry - The geometry type ('Area', 'Square', 'Line').
     * @param {Object} styleSettingsData - The style settings data to set for testing.
     * @returns {Object} - The mounted wrapper for the DrawItemComponent.
     */
    function mountComponent (drawType, geometry, styleSettingsData) {
        const mountedWrapper = wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});

        store.commit("Modules/Draw_old/setDrawType", {id: drawType, geometry: geometry});
        store.commit(`Modules/Draw_old/set${drawType[0].toUpperCase()}${drawType.slice(1)}Settings`, styleSettingsData);
        return mountedWrapper;
    }

    it("sets focus to first input control", async () => {
        const elem = document.createElement("div");

        if (document.body) {
            document.body.appendChild(elem);
        }

        wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData, attachTo: elem});
        wrapper.vm.setFocusToFirstControl();
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#tool-draw-drawType").element).to.equal(document.activeElement);
    });
    it("should render circle and circleUnit if drawType.id is drawCircle", async () => {
        wrapper = mountComponent("drawCircle", "Circle", {});
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#tool-draw-circleRadius").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-circleMethod").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-circleUnit").exists()).to.be.true;
    });

    it("should render area and areaUnit if drawType.id is drawArea", async () => {
        wrapper = mountComponent("drawArea", "Area", {});
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#tool-draw-area").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-areaUnit").exists()).to.be.true;
    });

    it("should render squareArea, squareSideLength and squareUnit if drawType.id is drawSquare", async () => {
        wrapper = mountComponent("drawSquare", "Square", {});
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#tool-draw-squareMethod").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-squareArea").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-squareSideLength").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-squareUnit").exists()).to.be.true;
    });

    it("should render lineLength and lineUnit if drawType.id is drawLine", async () => {
        wrapper = mountComponent("drawLine", "Line", {});
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#tool-draw-lineLength").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-lineUnit").exists()).to.be.true;
    });

    it("should render lineLength and lineUnit if drawType.id is drawLine", async () => {
        wrapper = mountComponent("drawLine", "Line", {});
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#tool-draw-lineLength").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-lineUnit").exists()).to.be.true;
        expect(wrapper.find("#tool-draw-opacityContour").exists()).to.be.true;
    });

    it("sets area in kilometers if unit is 'km'", () => {
        wrapper = mountComponent("drawArea", "Area", {unit: "km"});
        wrapper.vm.areaComputed = 6.8;
        expect(wrapper.vm.styleSettings.area).to.equal(6800);
    });

    it("sets line length in kilometers if unit is 'km'", () => {
        wrapper = mountComponent("drawLine", "Line", {unit: "km"});
        wrapper.vm.lineLengthComputed = 6.5;
        expect(wrapper.vm.styleSettings.length).to.equal(6500);
    });

    it("sets square area in kilometers if unit is 'km'", () => {
        wrapper = mountComponent("drawSquare", "Square", {unit: "km"});
        wrapper.vm.squareAreaComputed = 6.5;
        expect(wrapper.vm.styleSettings.squareArea).to.equal(6500);
    });

    it("should hide layer and disable controls", async () => {
        wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
        expect(wrapper.find("#tool-draw-drawLayerVisible").exists()).to.be.true;

        expect(wrapper.vm.drawLayerVisible).to.be.true;
        expect(wrapper.vm.getLayer().getVisible()).to.be.true;
        expect(wrapper.find("#tool-draw-drawType").element.disabled).to.be.false;
        expect(wrapper.find("#tool-draw-undoInteraction").element.disabled).to.be.false;
        expect(wrapper.find("#tool-draw-redoInteraction").element.disabled).to.be.false;
        expect(wrapper.find("#tool-draw-deleteInteraction").element.disabled).to.be.false;
        expect(wrapper.find("#tool-draw-deleteAllInteraction").element.disabled).to.be.false;

        wrapper.find("#tool-draw-drawLayerVisible").trigger("click").then(() => {
            expect(wrapper.vm.drawLayerVisible).to.be.false;
            expect(wrapper.vm.layer.getVisible()).to.be.false;
            expect(wrapper.find("#tool-draw-drawType").element.disabled).to.be.true;
            expect(wrapper.find("#tool-draw-drawInteraction").element.disabled).to.be.true;
            expect(wrapper.find("#tool-draw-undoInteraction").element.disabled).to.be.true;
            expect(wrapper.find("#tool-draw-redoInteraction").element.disabled).to.be.true;
            expect(wrapper.find("#tool-draw-editInteraction").element.disabled).to.be.true;
            expect(wrapper.find("#tool-draw-deleteInteraction").element.disabled).to.be.true;
            expect(wrapper.find("#tool-draw-deleteAllInteraction").element.disabled).to.be.true;
        });

    });

    describe("addSymbolsByLayerModels", () => {
        it("should do nothing if anything but an array is given", () => {
            const iconListLength = Draw_old.state.iconList.length;

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});

            wrapper.vm.addSymbolsByLayerModels(undefined);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);

            wrapper.vm.addSymbolsByLayerModels(null);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);

            wrapper.vm.addSymbolsByLayerModels(1234);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);

            wrapper.vm.addSymbolsByLayerModels("string");
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);

            wrapper.vm.addSymbolsByLayerModels(true);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);

            wrapper.vm.addSymbolsByLayerModels(false);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);

            wrapper.vm.addSymbolsByLayerModels({});
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should do nothing if layer models are no objects", () => {
            const iconListLength = Draw_old.state.iconList.length;

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels([undefined, null, 1234, "string", true, false, []]);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should do nothing if layer models have no get function", () => {
            const iconListLength = Draw_old.state.iconList.length;

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels([{}, {something: 1}]);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should do nothing if legend of layer models are no array", () => {
            const iconListLength = Draw_old.state.iconList.length,
                layerModels = [
                    {
                        get: () => false
                    }
                ];

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels(layerModels);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should do nothing if legend infos have no style object", () => {
            const iconListLength = Draw_old.state.iconList.length,
                layerModels = [
                    {
                        get: () => [undefined, null, 1234, "string", true, false, [], {}]
                    }
                ];

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels(layerModels);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should do nothing if legend infos have no imageScale that are numbers", () => {
            const iconListLength = Draw_old.state.iconList.length,
                layerModels = [
                    {
                        get: () => [
                            {
                                styleObject: {
                                    get: what => {
                                        if (what === "imageScale") {
                                            return false;
                                        }
                                        else if (what === "imagePath") {
                                            return "imagePath/";
                                        }
                                        else if (what === "imageName") {
                                            return "imageName";
                                        }
                                        return false;
                                    }
                                }
                            }
                        ]
                    }
                ];

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels(layerModels);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should do nothing if legend infos have no imagePath that are strings", () => {
            const iconListLength = Draw_old.state.iconList.length,
                layerModels = [
                    {
                        get: () => [
                            {
                                styleObject: {
                                    get: what => {
                                        if (what === "imageScale") {
                                            return 1;
                                        }
                                        else if (what === "imagePath") {
                                            return false;
                                        }
                                        else if (what === "imageName") {
                                            return "imageName";
                                        }
                                        return false;
                                    }
                                }
                            }
                        ]
                    }
                ];

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels(layerModels);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should do nothing if legend infos have no imageName that is a string and not empty", () => {
            const iconListLength = Draw_old.state.iconList.length,
                layerModels = [
                    {
                        get: () => [
                            {
                                styleObject: {
                                    get: what => {
                                        if (what === "imageScale") {
                                            return 1;
                                        }
                                        else if (what === "imagePath") {
                                            return "imagePath/";
                                        }
                                        else if (what === "imageName") {
                                            return "";
                                        }
                                        return false;
                                    }
                                }
                            }
                        ]
                    }
                ];

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels(layerModels);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
        it("should add the expected symbol", () => {
            const iconListLength = Draw_old.state.iconList.length,
                layerModels = [
                    {
                        get: () => [
                            {
                                styleObject: {
                                    get: what => {
                                        if (what === "imageScale") {
                                            return 1;
                                        }
                                        else if (what === "imagePath") {
                                            return "imagePath/";
                                        }
                                        else if (what === "imageName") {
                                            return "imageName";
                                        }
                                        return false;
                                    }
                                }
                            }
                        ]
                    }
                ];

            wrapper = shallowMount(DrawItemComponent, {global: {plugins: [store]}, data: componentData});
            wrapper.vm.addSymbolsByLayerModels(layerModels);
            expect(Draw_old.state.iconList.length).to.equal(iconListLength);
        });
    });
});
