import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import {pointerMove} from "ol/events/condition.js";
import {Select} from "ol/interaction.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import DrawEditComponent from "@shared/modules/draw/components/DrawEdit.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/draw/components/DrawEdit.vue", () => {
    let addInteractionSpy,
        createModifyInteractionSpy,
        createSelectInteractionSpy,
        layer,
        removeInteractionSpy,
        removeSelectedFeatureSpy,
        store,
        wrapper;

    beforeEach(() => {
        addInteractionSpy = sinon.spy();
        createModifyInteractionSpy = sinon.spy(modifyInteraction, "createModifyInteraction");
        createSelectInteractionSpy = sinon.spy(selectInteraction, "createSelectInteraction");
        layer = new VectorLayer({source: new VectorSource()});
        removeSelectedFeatureSpy = sinon.spy(selectInteraction, "removeSelectedFeature");
        removeInteractionSpy = sinon.spy();

        mapCollection.clear();
        mapCollection.addMap({
            id: "ol",
            mode: "2D",
            on: sinon.spy(),
            un: sinon.spy(),
            forEachFeatureAtPixel: sinon.spy()
        }, "2D");


        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addInteraction: addInteractionSpy,
                        removeInteraction: removeInteractionSpy
                    },
                    getters: {
                        projection: () => "EPSG:4326"
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        Draw: {
                            namespaced: true,
                            mutations: {
                                setButtonsDisabled: sinon.stub()
                            }
                        }
                    }
                }
            }
        });
    });

    it("renders the drawEdits, if undoFeatures or redoFeatures length > 0", async () => {
        wrapper = shallowMount(DrawEditComponent, {
            propsData: {layer},
            global: {plugins: [store]}
        });

        expect(wrapper.find("#draw-edit-deleteAll").exists()).to.be.true;
        expect(wrapper.find("#draw-edit-deleteAll").attributes().aria).to.equals("common:shared.modules.draw.drawEdit.deleteAll");

        expect(wrapper.find("#draw-edit-delete").exists()).to.be.true;
        expect(wrapper.find("#draw-edit-delete").attributes().aria).to.equals("common:shared.modules.draw.drawEdit.delete");

        expect(wrapper.find("#draw-edit-undo").exists()).to.be.true;
        expect(wrapper.find("#draw-edit-undo").attributes().aria).to.equals("common:shared.modules.draw.drawEdit.undo");

        expect(wrapper.find("#draw-edit-redo").exists()).to.be.true;
        expect(wrapper.find("#draw-edit-redo").attributes().aria).to.equals("common:shared.modules.draw.drawEdit.redo");
    });

    describe("regulateDelete", () => {
        it("should create select interactions for deleting features", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.regulateDelete();

            expect(createSelectInteractionSpy.calledTwice).to.be.true;
            expect(createSelectInteractionSpy.firstCall.args[0]).to.deep.equals(layer);
            expect(createSelectInteractionSpy.secondCall.args[0]).to.deep.equals(layer);
            expect(createSelectInteractionSpy.secondCall.args[1]).to.deep.equals(pointerMove);

            expect(removeSelectedFeatureSpy.calledOnce).to.be.true;
            expect(removeSelectedFeatureSpy.firstCall.args[1]).to.deep.equals(wrapper.vm.source);

            expect(addInteractionSpy.calledTwice).to.be.true;
        });
    });

    describe("createSelectInteractions", () => {
        it("should create two select interactions", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            const currentSelectInteractions = wrapper.vm.createSelectInteractions(layer);

            expect(currentSelectInteractions.length).to.equals(2);
            expect(currentSelectInteractions[0] instanceof Select).to.be.true;
            expect(currentSelectInteractions[1] instanceof Select).to.be.true;
        });
    });

    describe("regulateDeleteAll", () => {
        it("should clear vector source and push features to undo stack", async () => {
            const feature = new Feature();

            layer.getSource().addFeature(feature);

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.regulateDeleteAll();

            expect(wrapper.vm.mode).to.equals("deleteAll");
            expect(wrapper.vm.source.getFeatures()).to.deep.equals([]);
            expect(wrapper.vm.nonReactiveUndoFeatures.length).to.equal(1);
        });
    });

    describe("regulateModify", () => {
        it("should create modify interaction and set showFrame to true", async () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.regulateModify();

            expect(createModifyInteractionSpy.calledOnce).to.be.true;
            expect(createModifyInteractionSpy.firstCall.args[0]).to.deep.equals(wrapper.vm.source);

            expect(removeInteractionSpy.calledOnce).to.be.true;
            expect(removeInteractionSpy.firstCall.args[1]).to.be.null;

            expect(addInteractionSpy.calledOnce).to.be.true;
            expect(wrapper.vm.currentModifyInteraction).to.not.be.null;
            expect(wrapper.vm.showFrame).to.be.true;
        });
    });

    describe("regulateUndo and regulateRedo", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });
        });

        it("should set redoing to true during undo and back to false", () => {
            wrapper.vm.regulateUndo();
            expect(wrapper.vm.redoing).to.be.false;
        });

        it("should set redoing to true during redo and back to false", () => {
            wrapper.vm.regulateRedo();
            expect(wrapper.vm.redoing).to.be.false;
        });

        it("should undo a drawn feature", () => {
            const feature = new Feature();

            layer.getSource().addFeature(feature);
            wrapper.vm.nonReactiveUndoFeatures.push({feature, mode: "draw"});
            wrapper.vm.syncUndoRedoCounts();

            wrapper.vm.regulateUndo();

            expect(wrapper.vm.source.getFeatures().length).to.equal(0);
            expect(wrapper.vm.nonReactiveRedoFeatures.length).to.equal(1);
        });

        it("should redo a drawn feature", () => {
            const feature = new Feature();

            wrapper.vm.nonReactiveRedoFeatures.push({feature, mode: "draw"});
            wrapper.vm.syncUndoRedoCounts();

            wrapper.vm.regulateRedo();

            expect(wrapper.vm.source.getFeatures().length).to.equal(1);
            expect(wrapper.vm.nonReactiveUndoFeatures.length).to.equal(1);
        });
    });

    describe("undoRedoDeleteAll", () => {
        let feature1,
            feature2;

        beforeEach(() => {
            feature1 = new Feature();
            feature2 = new Feature();
        });

        it("should add all features to vector source on undo", () => {
            const features = [[feature1, feature2]];

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.undoRedoDeleteAll("undo", features, wrapper.vm.source);

            expect(wrapper.vm.source.getFeatures().length).to.equals(2);
            expect(wrapper.vm.nonReactiveRedoFeatures.length).to.equals(1);
            expect(wrapper.vm.mode).to.equals("");
        });

        it("should remove all features from vector source on redo", async () => {
            const features = [[feature1, feature2]];

            layer.getSource().addFeatures([feature1, feature2]);

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.undoRedoDeleteAll("redo", features, wrapper.vm.source);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.source.getFeatures().length).to.equals(0);
            expect(wrapper.vm.nonReactiveUndoFeatures.length).to.equals(1);
            expect(wrapper.vm.mode).to.equals("");
        });
    });

    describe("features computed", () => {
        it("should return features from the layer source", () => {
            const feature1 = new Feature(),
                feature2 = new Feature();

            layer.getSource().addFeatures([feature1, feature2]);

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            expect(wrapper.vm.features.length).to.equals(2);
            expect(wrapper.vm.features[0]).to.deep.equals(feature1);
            expect(wrapper.vm.features[1]).to.deep.equals(feature2);
        });

        it("should return an empty array if layer is null", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer: null},
                global: {plugins: [store]}
            });

            expect(wrapper.vm.features).to.deep.equals([]);
        });
    });

    describe("regulateEditAttributes", () => {
        it("should call setSelectedInteraction with 'editAttributes' and set showFrame to true", () => {
            const setSelectedInteraction = sinon.spy();

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer, setSelectedInteraction},
                global: {plugins: [store]}
            });

            wrapper.vm.regulateEditAttributes();

            expect(setSelectedInteraction.calledOnce).to.be.true;
            expect(setSelectedInteraction.firstCall.args[0]).to.equals("editAttributes");
            expect(wrapper.vm.showFrame).to.be.true;
        });
    });

    describe("regulateDownload", () => {
        it("should call setSelectedInteraction with 'download' and set showFrame to true", () => {
            const setSelectedInteraction = sinon.spy();

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer, setSelectedInteraction},
                global: {plugins: [store]}
            });

            wrapper.vm.regulateDownload();

            expect(setSelectedInteraction.calledOnce).to.be.true;
            expect(setSelectedInteraction.firstCall.args[0]).to.equals("download");
            expect(wrapper.vm.showFrame).to.be.true;
        });
    });

    describe("toggleDrawLayerVisibility", () => {
        it("should toggle layer visibility from true to false", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            expect(layer.getVisible()).to.be.true;
            wrapper.vm.toggleDrawLayerVisibility();

            expect(layer.getVisible()).to.be.false;
            expect(wrapper.vm.drawLayerVisible).to.be.false;
        });

        it("should toggle layer visibility from false to true", () => {
            layer.setVisible(false);

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.drawLayerVisible = false;
            wrapper.vm.toggleDrawLayerVisibility();

            expect(layer.getVisible()).to.be.true;
            expect(wrapper.vm.drawLayerVisible).to.be.true;
        });

        it("should toggle hide icon between bi-eye and bi-eye-slash", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            expect(wrapper.vm.localDrawIcons.hide).to.equal("bi-eye");
            wrapper.vm.toggleDrawLayerVisibility();
            expect(wrapper.vm.localDrawIcons.hide).to.equal("bi-eye-slash");
            wrapper.vm.toggleDrawLayerVisibility();
            expect(wrapper.vm.localDrawIcons.hide).to.equal("bi-eye");
        });
    });

    describe("selectedInteraction watcher", () => {
        it("should set showFrame to false if selectedInteraction is not in drawEdits", async () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer, selectedInteraction: "delete"},
                global: {plugins: [store]}
            });

            await wrapper.setData({showFrame: true});
            await wrapper.setProps({selectedInteraction: "draw"});

            expect(wrapper.vm.showFrame).to.be.false;
        });

        it("should clear currentSelectInteractions if selectedInteraction is not 'delete' or 'modify'", async () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer, selectedInteraction: "delete"},
                global: {plugins: [store]}
            });

            wrapper.vm.currentSelectInteractions = [{fake: true}];
            await wrapper.setProps({selectedInteraction: "draw"});

            expect(wrapper.vm.currentSelectInteractions).to.deep.equals([]);
        });

        it("should set currentModifyInteraction to null if selectedInteraction is not 'modify'", async () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer, selectedInteraction: "modify"},
                global: {plugins: [store]}
            });

            wrapper.vm.currentModifyInteraction = {fake: true, dispose: sinon.stub()};
            await wrapper.setProps({selectedInteraction: "draw"});

            expect(wrapper.vm.currentModifyInteraction).to.be.null;
        });
    });

    describe("applyTextEdit", () => {
        it("should do nothing if selectedTextFeature is null", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            expect(() => wrapper.vm.applyTextEdit()).to.not.throw();
        });

        it("should set text style and attributes on the selected feature", () => {
            const feature = new Feature();

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.selectedTextFeature = feature;
            wrapper.vm.editText = "Hallo";
            wrapper.vm.editFontSize = 20;
            wrapper.vm.editFont = "Arial";
            wrapper.vm.editFillColor = "#ff0000";
            wrapper.vm.editFillTransparency = 0;

            wrapper.vm.applyTextEdit();

            expect(feature.get("textContent")).to.equal("Hallo");
            expect(feature.get("textFontSize")).to.equal(20);
            expect(feature.get("textFont")).to.equal("Arial");
        });

        it("should calculate alpha correctly from editFillTransparency", () => {
            const feature = new Feature();

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.selectedTextFeature = feature;
            wrapper.vm.editFillColor = "#000000";
            wrapper.vm.editFillTransparency = 50;

            wrapper.vm.applyTextEdit();

            const colorArray = feature.get("textFillColor");

            expect(colorArray[3]).to.equal(0.5);
        });
    });

    describe("registerSourceListeners", () => {
        it("should track added features in undo stack", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.registerSourceListeners();

            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {fromDrawTool: true});
            layer.getSource().addFeature(feature);

            expect(wrapper.vm.undoCount).to.be.greaterThan(0);
        });

        it("should track removed features in undo stack", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            layer.getSource().addFeature(feature);

            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.registerSourceListeners();
            layer.getSource().removeFeature(feature);

            expect(wrapper.vm.undoCount).to.be.greaterThan(0);
        });

        it("should not track features when redoing is true", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.registerSourceListeners();
            wrapper.vm.redoing = true;

            const feature = new Feature({geometry: new Point([0, 0])});

            layer.getSource().addFeature(feature);

            expect(wrapper.vm.undoCount).to.equal(0);
        });
    });

    describe("syncUndoRedoCounts", () => {
        it("should update reactive counts from non-reactive stacks", () => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });

            wrapper.vm.nonReactiveUndoFeatures.push({feature: {}, mode: "draw"});
            wrapper.vm.nonReactiveUndoFeatures.push({feature: {}, mode: "draw"});
            wrapper.vm.nonReactiveRedoFeatures.push({feature: {}, mode: "draw"});

            wrapper.vm.syncUndoRedoCounts();

            expect(wrapper.vm.undoCount).to.equal(2);
            expect(wrapper.vm.redoCount).to.equal(1);
        });
    });

    describe("isDeleteAllMode", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawEditComponent, {
                propsData: {layer},
                global: {plugins: [store]}
            });
        });

        it("should return true if entry is an array", () => {
            expect(wrapper.vm.isDeleteAllMode(["feature1", "feature2"])).to.be.true;
        });

        it("should return false if entry is not an array", () => {
            expect(wrapper.vm.isDeleteAllMode("feature1")).to.be.false;
        });
    });
});
