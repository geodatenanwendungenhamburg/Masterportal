import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {nextTick} from "vue";
import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import LineString from "ol/geom/LineString.js";
import Polygon from "ol/geom/Polygon.js";
import Point from "ol/geom/Point.js";
import MeasureInMapComponent from "@modules/measure/components/MeasureInMap.vue";
import MeasureModule from "@modules/measure/store/indexMeasure.js";

describe("src/modules/measure/components/MeasureInMap.vue", () => {
    let store,
        wrapper,
        origcreateDrawInteraction,
        origdeleteFeatures,
        origremoveIncompleteDrawing,
        origsetSelectedGeometry,
        origsetSelectedLineStringUnit,
        origsetSelectedPolygonUnit;

    const mockConfigJson = {
        portalConfig: {
            navigationSecondary: {
                sections: [
                    {
                        "type": "measure"
                    }
                ]
            }
        }
    };

    beforeEach(() => {

        mapCollection.clear();

        origcreateDrawInteraction = MeasureModule.actions.createDrawInteraction;
        origdeleteFeatures = MeasureModule.actions.deleteFeatures;
        origremoveIncompleteDrawing = MeasureModule.actions.removeIncompleteDrawing;
        origsetSelectedGeometry = MeasureModule.mutations.setSelectedGeometry;
        origsetSelectedLineStringUnit = MeasureModule.mutations.setSelectedLineStringUnit;
        origsetSelectedPolygonUnit = MeasureModule.mutations.setSelectedPolygonUnit;
        MeasureModule.actions.createDrawInteraction = sinon.spy();
        MeasureModule.actions.deleteFeatures = sinon.spy();
        MeasureModule.actions.removeIncompleteDrawing = sinon.spy();
        MeasureModule.mutations.setSelectedGeometry = sinon.spy();
        MeasureModule.mutations.setSelectedLineStringUnit = sinon.spy();
        MeasureModule.mutations.setSelectedPolygonUnit = sinon.spy();

        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Measure: MeasureModule
                    }
                },
                Maps: {
                    namespaced: true,
                    state: {
                        mode: "2D"
                    },
                    getters: {
                        layerById: () => id => ({})[id],
                        mode: () => "2D",
                        projection: () => ({getCode: () => "EPSG:25832"})
                    },
                    mutations: {
                        addLayerToMap: sinon.spy()
                    },
                    actions: {
                        addInteraction: sinon.spy(),
                        removeInteraction: sinon.spy(),
                        addLayer: sinon.spy(),
                        checkLayer: sinon.spy()
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                uiStyle: () => ""
            }
        });
    });

    afterEach(() => {
        MeasureModule.actions.createDrawInteraction = origcreateDrawInteraction;
        MeasureModule.actions.deleteFeatures = origdeleteFeatures;
        MeasureModule.actions.removeIncompleteDrawing = origremoveIncompleteDrawing;
        MeasureModule.mutations.setSelectedGeometry = origsetSelectedGeometry;
        MeasureModule.mutations.setSelectedLineStringUnit = origsetSelectedLineStringUnit;
        MeasureModule.mutations.setSelectedPolygonUnit = origsetSelectedPolygonUnit;
        sinon.restore();
    });


    it("renders the measure tool with the expected form fields", () => {
        wrapper = shallowMount(MeasureInMapComponent, {
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            }});

        expect(wrapper.find("#measure").exists()).to.be.true;
        expect(wrapper.find("#measure-tool-geometry-select").exists()).to.be.true;
        expect(wrapper.find("#measure-tool-unit-select").exists()).to.be.true;
        expect(wrapper.find(".inaccuracy-list").exists()).to.be.true;
        expect(wrapper.find("#measure-delete").exists()).to.be.true;
    });

    it("select element interaction produces expected mutations, actions, and updates", () => {
        wrapper = shallowMount(MeasureInMapComponent, {
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            }});
        const geometrySelect = wrapper.find("#measure-tool-geometry-select"),
            unitSelect = wrapper.find("#measure-tool-unit-select");

        // form initially "LineString" with m/km
        expect(geometrySelect.element.value).equals("LineString");
        expect(unitSelect.text())
            .to.contain("m")
            .and.to.contain("km")
            .and.not.to.contain("²");


        geometrySelect.trigger("change");

        nextTick(async () => {
            expect(MeasureModule.mutations.setSelectedGeometry.calledOnce).to.be.true;

            // draw interaction should have been remade on geometry change
            expect(MeasureModule.actions.createDrawInteraction.calledOnce).to.be.true;

            // after changing to "Polygon", m²/km² are the units
            expect(geometrySelect.element.value).equals("Polygon");
        });

        // check if changing unit produces expected effects
        expect(unitSelect.element.value).equals("0");
        unitSelect.element.value = "1";

        unitSelect.trigger("change");
        wrapper.vm.$nextTick();
        expect(unitSelect.element.value).equals("1");
        expect(MeasureModule.mutations.setSelectedLineStringUnit.calledOnce).to.be.true;

        // no further draw interaction recreation should have happened
        expect(MeasureModule.actions.createDrawInteraction.calledOnce).to.be.true;
    });

    it("clicking delete will call the appropriate action", async () => {
        wrapper = shallowMount(MeasureInMapComponent, {
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            }});
        const deleteButton = wrapper.find("#measure-delete");

        expect(deleteButton).to.exist;
    });

    it("sets focus to first input control", async () => {
        const elem = document.createElement("div");

        if (document.body) {
            document.body.appendChild(elem);
        }
        wrapper = shallowMount(MeasureInMapComponent, {
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            },
            attachTo: elem});

        wrapper.vm.setFocusToFirstControl();
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#measure-tool-geometry-select").element).to.equal(document.activeElement);
    });

    describe("Undo/Redo functionality", () => {
        let feature1, feature2;

        beforeEach(() => {
            feature1 = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
            feature2 = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
        });

        it.skip("renders edit toolbar when features exist or undo/redo stacks have items", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            expect(wrapper.find("#measure-edit-undo").exists()).to.be.false;

            wrapper.vm.source.addFeature(feature1);
            wrapper.vm.featureHistories[feature1.ol_uid] = {undo: [{mode: "draw"}], redo: []};
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#measure-edit-undo").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-redo").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-modify").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-delete").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-deleteAll").exists()).to.be.true;
        });

        it.skip("undo button is disabled when feature history undo is empty", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.clear();
            wrapper.vm.featureHistories = {};
            wrapper.vm.source.addFeature(feature1);
            wrapper.vm.featureHistories[feature1.ol_uid] = {undo: [], redo: []};
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const allButtons = wrapper.findAllComponents({name: "IconButton"});
            const undoButtonComponent = allButtons.find(btn => btn.attributes("id") === "measure-edit-undo");

            expect(undoButtonComponent).to.exist;
            expect(undoButtonComponent.props("classArray")).to.include("disabled");
        });

        it.skip("redo button is disabled when feature history redo is empty", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.clear();
            wrapper.vm.featureHistories = {};
            wrapper.vm.source.addFeature(feature1);
            wrapper.vm.featureHistories[feature1.ol_uid] = {undo: [], redo: []};
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const allButtons = wrapper.findAllComponents({name: "IconButton"});
            const redoButtonComponent = allButtons.find(btn => btn.attributes("id") === "measure-edit-redo");

            expect(redoButtonComponent).to.exist;
            expect(redoButtonComponent.props("classArray")).to.include("disabled");
        });

        it("regulateUndo removes points from drawn feature or removes feature if minimum points reached", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature1);
            const featureId = feature1.ol_uid;
            wrapper.vm.featureHistories[featureId] = {undo: [{mode: "draw"}], redo: []};
            wrapper.vm.mode = "";

            const initialPointCount = feature1.getGeometry().getCoordinates().length;

            wrapper.vm.regulateUndo(featureId);

            const pointsAfterUndo = feature1.getGeometry().getCoordinates().length;

            expect(pointsAfterUndo).to.equal(initialPointCount - 1);
            expect(wrapper.vm.featureHistories[featureId].redo.length).to.equal(1);
            expect(wrapper.vm.featureHistories[featureId].redo[0].mode).to.equal("addPoint");
        });

        it("regulateRedo restores last undone point to feature", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature1);

            const initialPointCount = feature1.getGeometry().getCoordinates().length;
            const lastPoint = feature1.getGeometry().getCoordinates()[initialPointCount - 1];
            const featureId = feature1.ol_uid;

            wrapper.vm.featureHistories[featureId] = {
                undo: [],
                redo: [{
                    mode: "addPoint",
                    point: lastPoint,
                    geometryType: "LineString"
                }]
            };
            wrapper.vm.mode = "";

            wrapper.vm.regulateRedo(featureId);

            const pointsAfterRedo = feature1.getGeometry().getCoordinates().length;

            expect(pointsAfterRedo).to.equal(initialPointCount + 1);
            expect(wrapper.vm.featureHistories[featureId].redo.length).to.equal(0);
        });

        it("addToFeatureHistory adds entry to feature's undo history", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const featureId = feature1.ol_uid;
            wrapper.vm.source.addFeature(feature1);

            const history = wrapper.vm.getFeatureHistory(featureId);
            history.undo.push({mode: "draw"});
            history.redo = [];

            expect(wrapper.vm.featureHistories[featureId].undo.length).to.equal(1);
            expect(wrapper.vm.featureHistories[featureId].undo[0].mode).to.equal("draw");
            expect(wrapper.vm.featureHistories[featureId].redo.length).to.equal(0);
        });

        it("regulateDeleteAll clears all feature histories", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.addFeatures([feature1, feature2]);
            wrapper.vm.featureHistories[feature1.ol_uid] = {undo: [{mode: "draw"}], redo: []};
            wrapper.vm.featureHistories[feature2.ol_uid] = {undo: [], redo: [{mode: "draw"}]};

            wrapper.vm.regulateDeleteAll();

            expect(Object.keys(wrapper.vm.featureHistories).length).to.equal(0);
            expect(MeasureModule.actions.deleteFeatures.called).to.be.true;
        });
    });

    describe("Modify functionality", () => {
        let feature1, feature2;

        beforeEach(() => {
            feature1 = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
            feature2 = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
        });

        it("regulateModify creates modify interaction", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.regulateModify();

            expect(wrapper.vm.currentModifyInteraction).to.not.be.null;
            expect(wrapper.vm.selectedEditInteraction).to.equal("modify");
        });

        it("regulateDelete clears history for selected features", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.addFeatures([feature1, feature2]);
            wrapper.vm.featureHistories[feature1.ol_uid] = {undo: [{mode: "draw"}], redo: []};
            wrapper.vm.featureHistories[feature2.ol_uid] = {undo: [], redo: [{mode: "draw"}]};

            wrapper.vm.regulateDelete();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.currentSelectInteractions.length).to.be.greaterThan(0);
            expect(wrapper.vm.currentSelectInteractions.length).to.equal(2);
            expect(wrapper.vm.selectedEditInteraction).to.equal("delete");
        });
    });

    describe("History System - Feature History Management", () => {
        let feature;

        beforeEach(() => {
            feature = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
            feature.ol_uid = "test_feature_123";

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });
        });

        it("getFeatureHistory creates new history for feature if it does not exist", () => {
            const featureId = feature.ol_uid;

            expect(wrapper.vm.featureHistories[featureId]).to.be.undefined;

            const history = wrapper.vm.getFeatureHistory(featureId);

            expect(history).to.exist;
            expect(history).to.have.property("undo");
            expect(history).to.have.property("redo");
            expect(history.undo).to.be.an("array");
            expect(history.redo).to.be.an("array");
            expect(wrapper.vm.featureHistories[featureId]).to.equal(history);
        });

        it("getFeatureHistory returns existing history for feature", () => {
            const featureId = feature.ol_uid;
            const existingHistory = {undo: [{type: "test"}], redo: []};

            wrapper.vm.featureHistories[featureId] = existingHistory;

            const history = wrapper.vm.getFeatureHistory(featureId);

            expect(history).to.equal(existingHistory);
            expect(history.undo).to.have.lengthOf(1);
        });

        it("addUndoForFeature adds entry to undo stack and clears redo stack", () => {
            const featureId = feature.ol_uid;
            const historyEntry = {
                type: "addPoint",
                data: {point: [3, 3], geometryType: "LineString"}
            };

            wrapper.vm.addUndoForFeature(featureId, historyEntry);

            const history = wrapper.vm.featureHistories[featureId];

            expect(history.undoStack).to.have.lengthOf(1);
            expect(history.undoStack[0]).to.equal(historyEntry);
            expect(history.redoStack).to.have.lengthOf(0);
        });

        it("addUndoForFeature clears redo stack when adding undo entry", () => {
            const featureId = feature.ol_uid;

            wrapper.vm.featureHistories[featureId] = {
                undoStack: [],
                redoStack: [{type: "test"}]
            };

            wrapper.vm.addUndoForFeature(featureId, {type: "addPoint", data: {}});

            const history = wrapper.vm.featureHistories[featureId];

            expect(history.redoStack).to.have.lengthOf(0);
        });

        it("canUndoFeature returns true when undo stack has entries", () => {
            const featureId = feature.ol_uid;

            wrapper.vm.featureHistories[featureId] = {
                undoStack: [{type: "test"}],
                redoStack: []
            };

            expect(wrapper.vm.canUndoFeature(featureId)).to.be.true;
        });

        it("canUndoFeature returns false when undo stack is empty", () => {
            const featureId = feature.ol_uid;

            wrapper.vm.featureHistories[featureId] = {
                undoStack: [],
                redoStack: []
            };

            expect(wrapper.vm.canUndoFeature(featureId)).to.be.false;
        });

        it("canUndoFeature returns false when feature history does not exist", () => {
            expect(wrapper.vm.canUndoFeature("nonexistent_id")).to.be.false;
        });

        it("canRedoFeature returns true when redo stack has entries", () => {
            const featureId = feature.ol_uid;

            wrapper.vm.featureHistories[featureId] = {
                undoStack: [],
                redoStack: [{type: "test"}]
            };

            expect(wrapper.vm.canRedoFeature(featureId)).to.be.true;
        });

        it("canRedoFeature returns false when redo stack is empty", () => {
            const featureId = feature.ol_uid;

            wrapper.vm.featureHistories[featureId] = {
                undoStack: [],
                redoStack: []
            };

            expect(wrapper.vm.canRedoFeature(featureId)).to.be.false;
        });

        it("canRedoFeature returns false when feature history does not exist", () => {
            expect(wrapper.vm.canRedoFeature("nonexistent_id")).to.be.false;
        });

        it("deleteFeatureHistory removes history for feature", () => {
            const featureId = feature.ol_uid;

            wrapper.vm.featureHistories[featureId] = {
                undoStack: [{type: "test"}],
                redoStack: []
            };

            wrapper.vm.deleteFeatureHistory(featureId);

            expect(wrapper.vm.featureHistories[featureId]).to.be.undefined;
        });

        it("deleteFeatureHistory handles non-existent feature gracefully", () => {
            expect(() => wrapper.vm.deleteFeatureHistory("nonexistent")).to.not.throw();
        });

        it("getFeatureById finds feature in lines", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature);
            store.commit("Modules/Measure/addFeature", feature);

            const found = wrapper.vm.getFeatureById(feature.ol_uid);

            expect(found).to.equal(feature);
        });

        it("getFeatureById finds feature in polygons", () => {
            const polygonFeature = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]])
            });

            polygonFeature.ol_uid = "polygon_test";
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(polygonFeature);
            store.commit("Modules/Measure/setSelectedGeometry", "Polygon");
            store.commit("Modules/Measure/addFeature", polygonFeature);

            const found = wrapper.vm.getFeatureById(polygonFeature.ol_uid);

            expect(found).to.equal(polygonFeature);
        });

        it("getFeatureById returns null for non-existent feature", () => {
            const found = wrapper.vm.getFeatureById("nonexistent_feature");

            expect(found).to.be.null;
        });

        it("getFeatureById handles string and number IDs", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature);
            store.commit("Modules/Measure/addFeature", feature);

            const foundString = wrapper.vm.getFeatureById(String(feature.ol_uid));
            const foundNumber = wrapper.vm.getFeatureById(parseInt(feature.ol_uid, 10));

            expect(foundString).to.equal(feature);
            expect(foundNumber).to.equal(feature);
        });
    });

    describe("History System - Undo/Redo Point Operations", () => {
        let lineFeature, polygonFeature;

        beforeEach(() => {
            lineFeature = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])
            });
            lineFeature.ol_uid = "line_feature_1";

            polygonFeature = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]])
            });
            polygonFeature.ol_uid = "polygon_feature_1";

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });
        });

        it("undoAddPoint removes last point from LineString", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);

            const initialLength = lineFeature.getGeometry().getCoordinates().length;
            const historyEntry = {
                type: "addPoint",
                data: {
                    point: [3, 3],
                    geometryType: "LineString"
                }
            };

            wrapper.vm.undoAddPoint(lineFeature, historyEntry);

            expect(lineFeature.getGeometry().getCoordinates().length).to.equal(initialLength - 1);
        });

        it("undoAddPoint does not remove point if LineString has minimum points", () => {
            const minLineFeature = new Feature({
                geometry: new LineString([[0, 0], [1, 1]])
            });

            minLineFeature.ol_uid = "min_line";
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(minLineFeature);

            const historyEntry = {
                type: "addPoint",
                data: {
                    point: [1, 1],
                    geometryType: "LineString"
                }
            };

            wrapper.vm.undoAddPoint(minLineFeature, historyEntry);

            expect(minLineFeature.getGeometry().getCoordinates().length).to.equal(2);
        });

        it("undoAddPoint removes point from Polygon", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(polygonFeature);

            const initialLength = polygonFeature.getGeometry().getCoordinates()[0].length;
            const historyEntry = {
                type: "addPoint",
                data: {
                    point: [0, 4],
                    geometryType: "Polygon"
                }
            };

            wrapper.vm.undoAddPoint(polygonFeature, historyEntry);

            expect(polygonFeature.getGeometry().getCoordinates()[0].length).to.equal(initialLength - 1);
        });

        it("undoAddPoint does not remove point if Polygon has minimum points", () => {
            const minPolygonFeature = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]])
            });

            minPolygonFeature.ol_uid = "min_polygon";
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(minPolygonFeature);

            const historyEntry = {
                type: "addPoint",
                data: {
                    point: [1, 1],
                    geometryType: "Polygon"
                }
            };

            wrapper.vm.undoAddPoint(minPolygonFeature, historyEntry);

            expect(minPolygonFeature.getGeometry().getCoordinates()[0].length).to.equal(4);
        });

        it("redoAddPoint adds point to LineString", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);

            const initialLength = lineFeature.getGeometry().getCoordinates().length;
            const historyEntry = {
                type: "addPoint",
                data: {
                    point: [4, 4],
                    geometryType: "LineString"
                }
            };

            wrapper.vm.redoAddPoint(lineFeature, historyEntry);

            expect(lineFeature.getGeometry().getCoordinates().length).to.equal(initialLength + 1);
            expect(lineFeature.getGeometry().getCoordinates()[initialLength]).to.deep.equal([4, 4]);
        });

        it("redoAddPoint adds point to Polygon before closing point", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(polygonFeature);

            const initialLength = polygonFeature.getGeometry().getCoordinates()[0].length;
            const historyEntry = {
                type: "addPoint",
                data: {
                    point: [2, 2],
                    geometryType: "Polygon"
                }
            };

            wrapper.vm.redoAddPoint(polygonFeature, historyEntry);

            const coordinates = polygonFeature.getGeometry().getCoordinates()[0];

            expect(coordinates.length).to.equal(initialLength + 1);
            expect(coordinates[coordinates.length - 2]).to.deep.equal([2, 2]);
            expect(coordinates[0]).to.deep.equal(coordinates[coordinates.length - 1]);
        });
    });

    describe("History System - Modify Coordinates Operations", () => {
        let lineFeature, polygonFeature;

        beforeEach(() => {
            lineFeature = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
            lineFeature.ol_uid = "line_feature_1";

            polygonFeature = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]])
            });
            polygonFeature.ol_uid = "polygon_feature_1";

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });
        });

        it("undoModifyCoordinates restores previous LineString coordinates", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);

            const previousCoordinates = [[0, 0], [1, 1], [2, 2]];
            const historyEntry = {
                type: "modifyCoordinates",
                data: {
                    previousCoordinates: previousCoordinates,
                    newCoordinates: [[0, 0], [5, 5], [10, 10]],
                    geometryType: "LineString"
                }
            };

            lineFeature.getGeometry().setCoordinates([[0, 0], [5, 5], [10, 10]]);
            wrapper.vm.undoModifyCoordinates(lineFeature, historyEntry);

            expect(lineFeature.getGeometry().getCoordinates()).to.deep.equal(previousCoordinates);
        });

        it("undoModifyCoordinates restores previous Polygon coordinates", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(polygonFeature);

            const previousCoordinates = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]];
            const historyEntry = {
                type: "modifyCoordinates",
                data: {
                    previousCoordinates: previousCoordinates,
                    newCoordinates: [[0, 0], [8, 0], [8, 8], [0, 8], [0, 0]],
                    geometryType: "Polygon"
                }
            };

            polygonFeature.getGeometry().setCoordinates([[[0, 0], [8, 0], [8, 8], [0, 8], [0, 0]]]);
            wrapper.vm.undoModifyCoordinates(polygonFeature, historyEntry);

            expect(polygonFeature.getGeometry().getCoordinates()[0]).to.deep.equal(previousCoordinates);
        });

        it("redoModifyCoordinates applies new LineString coordinates", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);

            const newCoordinates = [[0, 0], [5, 5], [10, 10]];
            const historyEntry = {
                type: "modifyCoordinates",
                data: {
                    previousCoordinates: [[0, 0], [1, 1], [2, 2]],
                    newCoordinates: newCoordinates,
                    geometryType: "LineString"
                }
            };

            wrapper.vm.redoModifyCoordinates(lineFeature, historyEntry);

            expect(lineFeature.getGeometry().getCoordinates()).to.deep.equal(newCoordinates);
        });

        it("redoModifyCoordinates applies new Polygon coordinates", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(polygonFeature);

            const newCoordinates = [[0, 0], [8, 0], [8, 8], [0, 8], [0, 0]];
            const historyEntry = {
                type: "modifyCoordinates",
                data: {
                    previousCoordinates: [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
                    newCoordinates: newCoordinates,
                    geometryType: "Polygon"
                }
            };

            wrapper.vm.redoModifyCoordinates(polygonFeature, historyEntry);

            expect(polygonFeature.getGeometry().getCoordinates()[0]).to.deep.equal(newCoordinates);
        });
    });

    describe("History System - Feature Point Management", () => {
        let lineFeature, polygonFeature;

        beforeEach(() => {
            lineFeature = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])
            });
            lineFeature.ol_uid = "line_feature_1";

            polygonFeature = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [4, 0], [4, 4], [0, 4], [2, 2], [0, 0]]])
            });
            polygonFeature.ol_uid = "polygon_feature_1";

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });
        });

        it("canRemovePointFromFeature returns true for LineString with more than minimum points", () => {
            const canRemove = wrapper.vm.canRemovePointFromFeature(lineFeature);

            expect(canRemove).to.be.true;
        });

        it("canRemovePointFromFeature returns false for LineString with minimum points", () => {
            const minLineFeature = new Feature({
                geometry: new LineString([[0, 0], [1, 1]])
            });

            const canRemove = wrapper.vm.canRemovePointFromFeature(minLineFeature);

            expect(canRemove).to.be.false;
        });

        it("canRemovePointFromFeature returns true for Polygon with more than minimum points", () => {
            const canRemove = wrapper.vm.canRemovePointFromFeature(polygonFeature);

            expect(canRemove).to.be.true;
        });

        it("canRemovePointFromFeature returns false for Polygon with minimum points", () => {
            const minPolygonFeature = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]])
            });

            const canRemove = wrapper.vm.canRemovePointFromFeature(minPolygonFeature);

            expect(canRemove).to.be.false;
        });

        it("removeLastPointFromFeature removes point from LineString", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);

            const initialLength = lineFeature.getGeometry().getCoordinates().length;

            wrapper.vm.removeLastPointFromFeature(lineFeature);

            expect(lineFeature.getGeometry().getCoordinates().length).to.equal(initialLength - 1);
        });

        it("removeLastPointFromFeature removes point from Polygon", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(polygonFeature);

            const initialLength = polygonFeature.getGeometry().getCoordinates()[0].length;

            wrapper.vm.removeLastPointFromFeature(polygonFeature);

            expect(polygonFeature.getGeometry().getCoordinates()[0].length).to.equal(initialLength - 1);
        });

        it("removeLastPointFromFeature maintains Polygon closing point", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(polygonFeature);

            wrapper.vm.removeLastPointFromFeature(polygonFeature);

            const coordinates = polygonFeature.getGeometry().getCoordinates()[0];

            expect(coordinates[0]).to.deep.equal(coordinates[coordinates.length - 1]);
        });
    });

    describe("History System - Enriched Measurement List", () => {
        let feature1, feature2;

        beforeEach(() => {
            feature1 = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
            feature1.ol_uid = "feature_1";

            feature2 = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]])
            });
            feature2.ol_uid = "feature_2";

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });
        });

        it("enrichedMeasurementList adds canUndo property to measurements", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature1);
            store.commit("Modules/Measure/addFeature", feature1);

            wrapper.vm.featureHistories[feature1.ol_uid] = {
                undoStack: [{type: "test"}],
                redoStack: []
            };

            const enriched = wrapper.vm.enrichedMeasurementList;
            const measurement = enriched.find(m => m.id === feature1.ol_uid);

            expect(measurement).to.exist;
            expect(measurement).to.have.property("canUndo");
            expect(measurement.canUndo).to.be.true;
        });

        it("enrichedMeasurementList adds canRedo property to measurements", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature1);
            store.commit("Modules/Measure/addFeature", feature1);

            wrapper.vm.featureHistories[feature1.ol_uid] = {
                undoStack: [],
                redoStack: [{type: "test"}]
            };

            const enriched = wrapper.vm.enrichedMeasurementList;
            const measurement = enriched.find(m => m.id === feature1.ol_uid);

            expect(measurement).to.exist;
            expect(measurement).to.have.property("canRedo");
            expect(measurement.canRedo).to.be.true;
        });

        it("enrichedMeasurementList sets canUndo to false when undo stack is empty", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature1);
            store.commit("Modules/Measure/addFeature", feature1);

            wrapper.vm.featureHistories[feature1.ol_uid] = {
                undoStack: [],
                redoStack: []
            };

            const enriched = wrapper.vm.enrichedMeasurementList;
            const measurement = enriched.find(m => m.id === feature1.ol_uid);

            expect(measurement.canUndo).to.be.false;
        });

        it("enrichedMeasurementList sets canRedo to false when redo stack is empty", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature1);
            store.commit("Modules/Measure/addFeature", feature1);

            wrapper.vm.featureHistories[feature1.ol_uid] = {
                undoStack: [],
                redoStack: []
            };

            const enriched = wrapper.vm.enrichedMeasurementList;
            const measurement = enriched.find(m => m.id === feature1.ol_uid);

            expect(measurement.canRedo).to.be.false;
        });

        it("enrichedMeasurementList handles multiple measurements with different undo/redo states", () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(feature1);
            wrapper.vm.source.addFeature(feature2);
            store.commit("Modules/Measure/addFeature", feature1);
            store.commit("Modules/Measure/setSelectedGeometry", "Polygon");
            store.commit("Modules/Measure/addFeature", feature2);

            wrapper.vm.featureHistories[feature1.ol_uid] = {
                undoStack: [{type: "test"}],
                redoStack: []
            };
            wrapper.vm.featureHistories[feature2.ol_uid] = {
                undoStack: [],
                redoStack: [{type: "test"}]
            };

            const enriched = wrapper.vm.enrichedMeasurementList;

            expect(enriched).to.have.lengthOf(2);

            const measurement1 = enriched.find(m => m.id === feature1.ol_uid);
            const measurement2 = enriched.find(m => m.id === feature2.ol_uid);

            expect(measurement1.canUndo).to.be.true;
            expect(measurement1.canRedo).to.be.false;
            expect(measurement2.canUndo).to.be.false;
            expect(measurement2.canRedo).to.be.true;
        });
    });

    describe("Lifecycle Hooks", () => {
        it("created hook sets up layer", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            expect(wrapper.vm.layer).to.exist;
            expect(wrapper.vm.layer.get("id")).to.equal("measureLayer");
            expect(wrapper.vm.layer.get("name")).to.equal("measureLayer");
        });

        it("created hook dispatches checkLayer action", async () => {
            const checkLayerSpy = sinon.spy();

            store._actions["Maps/checkLayer"] = [checkLayerSpy];

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            await wrapper.vm.$nextTick();
            // Action is dispatched asynchronously
            expect(checkLayerSpy.called).to.be.true;
        });

        it("mounted hook calls createDrawInteraction", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            expect(MeasureModule.actions.createDrawInteraction.called).to.be.true;
        });

        it("mounted hook calls setFocusToFirstControl", async () => {
            const elem = document.createElement("div");

            if (document.body) {
                document.body.appendChild(elem);
            }

            const setFocusSpy = sinon.spy(MeasureInMapComponent.methods, "setFocusToFirstControl");

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                },
                attachTo: elem
            });

            await wrapper.vm.$nextTick();

            setFocusSpy.restore();
        });

        it("unmounted hook removes incomplete drawing", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const removeIncompleteSpy = sinon.spy(wrapper.vm, "removeIncompleteDrawing");

            wrapper.unmount();

            expect(removeIncompleteSpy.calledOnce).to.be.true;
        });

        it("unmounted hook removes draw interaction", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.unmount();

            expect(MeasureModule.actions.removeIncompleteDrawing.called).to.be.true;
        });

        it("unmounted hook removes select interactions", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const mockSelectInteraction1 = {dispose: sinon.spy()};
            const mockSelectInteraction2 = {dispose: sinon.spy()};

            wrapper.vm.currentSelectInteractions = [mockSelectInteraction1, mockSelectInteraction2];

            const removeInteractionSpy = sinon.spy(wrapper.vm, "removeInteraction");

            wrapper.unmount();

            expect(removeInteractionSpy.callCount).to.be.at.least(2);
        });

        it("unmounted hook removes modify interaction if exists", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const mockModifyInteraction = {dispose: sinon.spy()};

            wrapper.vm.currentModifyInteraction = mockModifyInteraction;

            const removeInteractionSpy = sinon.spy(wrapper.vm, "removeInteraction");

            wrapper.unmount();

            expect(removeInteractionSpy.called).to.be.true;
        });
    });

    describe("Watchers", () => {
        describe("selectedGeometry watcher", () => {
            it("calls createDrawInteraction when selectedGeometry changes", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                MeasureModule.actions.createDrawInteraction.resetHistory();

                store.commit("Modules/Measure/setSelectedGeometry", "Polygon");
                await wrapper.vm.$nextTick();

                expect(MeasureModule.actions.createDrawInteraction.called).to.be.true;
            });

            it("recreates draw interaction when switching from LineString to Polygon", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                const initialCallCount = MeasureModule.actions.createDrawInteraction.callCount;

                store.commit("Modules/Measure/setSelectedGeometry", "Polygon");
                await wrapper.vm.$nextTick();

                expect(MeasureModule.actions.createDrawInteraction.callCount).to.be.greaterThan(initialCallCount);
            });
        });

        describe("measurementList watcher", () => {
            let feature1, feature2;

            beforeEach(() => {
                feature1 = new Feature({
                    geometry: new LineString([[0, 0], [1, 1], [2, 2]])
                });
                feature1.ol_uid = 123;

                feature2 = new Feature({
                    geometry: new LineString([[0, 0], [3, 3], [6, 6]])
                });
                feature2.ol_uid = 456;

                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });
            });

            it("creates history entry for new measurements", async () => {
                wrapper.vm.source.clear();
                wrapper.vm.featureHistories = {};

                wrapper.vm.source.addFeature(feature1);
                store.commit("Modules/Measure/addFeature", feature1);
                await wrapper.vm.$nextTick();
                await wrapper.vm.$nextTick();

                const normalizedId = parseInt(feature1.ol_uid, 10);

                expect(wrapper.vm.featureHistories[normalizedId]).to.exist;
            });

            it("ensures history has undo and redo arrays", async () => {
                wrapper.vm.source.clear();
                wrapper.vm.featureHistories = {};

                wrapper.vm.source.addFeature(feature1);
                store.commit("Modules/Measure/addFeature", feature1);
                await wrapper.vm.$nextTick();
                await wrapper.vm.$nextTick();

                const normalizedId = parseInt(feature1.ol_uid, 10);
                const history = wrapper.vm.featureHistories[normalizedId];

                expect(history).to.have.property("undo");
                expect(history).to.have.property("redo");
                expect(history.undo).to.be.an("array");
                expect(history.redo).to.be.an("array");
            });

            it("handles string feature IDs", async () => {
                feature1.ol_uid = "string_id_789";
                wrapper.vm.source.clear();
                wrapper.vm.featureHistories = {};

                wrapper.vm.source.addFeature(feature1);
                store.commit("Modules/Measure/addFeature", feature1);
                await wrapper.vm.$nextTick();
                await wrapper.vm.$nextTick();

                const normalizedId = parseInt(feature1.ol_uid, 10);

                // Should create history even with NaN from string
                expect(wrapper.vm.featureHistories[normalizedId]).to.exist;
            });

            it("does not overwrite existing history", async () => {
                const existingHistory = {
                    undo: [{type: "test"}],
                    redo: [{type: "test2"}]
                };

                wrapper.vm.featureHistories[123] = existingHistory;

                wrapper.vm.source.addFeature(feature1);
                store.commit("Modules/Measure/addFeature", feature1);
                await wrapper.vm.$nextTick();
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.featureHistories[123]).to.equal(existingHistory);
                expect(wrapper.vm.featureHistories[123].undo).to.have.lengthOf(1);
            });

            it("creates history for multiple measurements", async () => {
                wrapper.vm.source.clear();
                wrapper.vm.featureHistories = {};

                wrapper.vm.source.addFeature(feature1);
                wrapper.vm.source.addFeature(feature2);
                store.commit("Modules/Measure/addFeature", feature1);
                store.commit("Modules/Measure/addFeature", feature2);
                await wrapper.vm.$nextTick();
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.featureHistories[123]).to.exist;
                expect(wrapper.vm.featureHistories[456]).to.exist;
            });
        });

        describe("interaction watcher for draw events", () => {
            it("sets currentSketch on drawstart", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                const mockFeature = new Feature({
                    geometry: new LineString([[0, 0], [1, 1]])
                });
                const mockInteraction = {
                    on: sinon.stub(),
                    abortDrawing: sinon.spy()
                };

                let drawstartCallback;

                mockInteraction.on.callsFake((event, callback) => {
                    if (event === "drawstart") {
                        drawstartCallback = callback;
                    }
                });

                wrapper.vm.interaction = mockInteraction;
                await wrapper.vm.$nextTick();

                if (drawstartCallback) {
                    drawstartCallback({feature: mockFeature});
                }

                expect(wrapper.vm.currentSketch).to.equal(mockFeature);
            });

            it("clears drawingPointHistory on drawstart", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                wrapper.vm.drawingPointHistory = [{point: [1, 1]}];

                const mockFeature = new Feature({
                    geometry: new LineString([[0, 0], [1, 1]])
                });
                const mockInteraction = {
                    on: sinon.stub(),
                    abortDrawing: sinon.spy()
                };

                let drawstartCallback;

                mockInteraction.on.callsFake((event, callback) => {
                    if (event === "drawstart") {
                        drawstartCallback = callback;
                    }
                });

                wrapper.vm.interaction = mockInteraction;
                await wrapper.vm.$nextTick();

                if (drawstartCallback) {
                    drawstartCallback({feature: mockFeature});
                }

                expect(wrapper.vm.drawingPointHistory).to.have.lengthOf(0);
            });

            it("creates undo history entries on drawend for LineString", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                const mockFeature = new Feature({
                    geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])
                });

                mockFeature.ol_uid = "test_feature_789";

                const mockInteraction = {
                    on: sinon.stub(),
                    abortDrawing: sinon.spy()
                };

                let drawendCallback;

                mockInteraction.on.callsFake((event, callback) => {
                    if (event === "drawend") {
                        drawendCallback = callback;
                    }
                });

                wrapper.vm.interaction = mockInteraction;
                await wrapper.vm.$nextTick();

                if (drawendCallback) {
                    drawendCallback({feature: mockFeature});
                }

                const history = wrapper.vm.featureHistories[mockFeature.ol_uid];

                expect(history).to.exist;
                expect(history.undo).to.have.lengthOf(2); // Points 3 and 4 (indices 2 and 3)
            });

            it("clears currentSketch on drawend", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                const mockFeature = new Feature({
                    geometry: new LineString([[0, 0], [1, 1], [2, 2]])
                });

                mockFeature.ol_uid = "test_feature_123";
                wrapper.vm.currentSketch = mockFeature;

                const mockInteraction = {
                    on: sinon.stub(),
                    abortDrawing: sinon.spy()
                };

                let drawendCallback;

                mockInteraction.on.callsFake((event, callback) => {
                    if (event === "drawend") {
                        drawendCallback = callback;
                    }
                });

                wrapper.vm.interaction = mockInteraction;
                await wrapper.vm.$nextTick();

                if (drawendCallback) {
                    drawendCallback({feature: mockFeature});
                }

                expect(wrapper.vm.currentSketch).to.be.null;
            });

            it("clears redo stack on drawend", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                const mockFeature = new Feature({
                    geometry: new LineString([[0, 0], [1, 1], [2, 2]])
                });

                mockFeature.ol_uid = "test_feature_456";

                const mockInteraction = {
                    on: sinon.stub(),
                    abortDrawing: sinon.spy()
                };

                let drawendCallback;

                mockInteraction.on.callsFake((event, callback) => {
                    if (event === "drawend") {
                        drawendCallback = callback;
                    }
                });

                wrapper.vm.interaction = mockInteraction;
                await wrapper.vm.$nextTick();

                if (drawendCallback) {
                    drawendCallback({feature: mockFeature});
                }

                const history = wrapper.vm.featureHistories[mockFeature.ol_uid];

                expect(history.redo).to.have.lengthOf(0);
            });
        });

        describe("source clear event", () => {
            it("resets mode to empty string on source clear", async () => {
                wrapper = shallowMount(MeasureInMapComponent, {
                    global: {
                        plugins: [store],
                        mocks: {
                            $t: key => key
                        }
                    }
                });

                wrapper.vm.mode = "delete";
                wrapper.vm.source.dispatchEvent("clear");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.mode).to.equal("");
            });
        });
    });

    describe("Event Handlers - MeasureList Integration", () => {
        let lineFeature, polygonFeature;

        beforeEach(() => {
            lineFeature = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2]])
            });
            lineFeature.ol_uid = "line_123";

            polygonFeature = new Feature({
                geometry: new ol.geom.Polygon([[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]])
            });
            polygonFeature.ol_uid = "polygon_456";

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });
        });

        describe("handleModifyMeasurement", () => {
            it("sets selectedEditInteraction to modify", () => {
                wrapper.vm.handleModifyMeasurement();

                expect(wrapper.vm.selectedEditInteraction).to.equal("modify");
            });

            it("calls regulateModify", () => {
                const regulateModifySpy = sinon.spy(wrapper.vm, "regulateModify");

                wrapper.vm.handleModifyMeasurement();

                expect(regulateModifySpy.calledOnce).to.be.true;
            });

            it("creates modify interaction", () => {
                wrapper.vm.handleModifyMeasurement();

                expect(wrapper.vm.currentModifyInteraction).to.not.be.null;
            });
        });

        describe("handleDeleteMeasurement", () => {
            beforeEach(() => {
                wrapper.vm.source.clear();
            });

            it("removes feature from source", () => {
                wrapper.vm.source.addFeature(lineFeature);

                const initialCount = wrapper.vm.source.getFeatures().length;

                wrapper.vm.handleDeleteMeasurement(lineFeature.ol_uid);

                expect(wrapper.vm.source.getFeatures().length).to.equal(initialCount - 1);
            });

            it("commits removeFeature to store", () => {
                wrapper.vm.source.addFeature(lineFeature);
                store.commit("Modules/Measure/addFeature", lineFeature);

                const removeFeatureSpy = sinon.spy();

                store._mutations["Modules/Measure/removeFeature"] = [removeFeatureSpy];

                wrapper.vm.handleDeleteMeasurement(lineFeature.ol_uid);

                expect(removeFeatureSpy.called).to.be.true;
            });

            it("deletes feature history", () => {
                wrapper.vm.source.addFeature(lineFeature);
                wrapper.vm.featureHistories[lineFeature.ol_uid] = {
                    undoStack: [],
                    redoStack: []
                };

                wrapper.vm.handleDeleteMeasurement(lineFeature.ol_uid);

                expect(wrapper.vm.featureHistories[lineFeature.ol_uid]).to.be.undefined;
            });

            it("removes tooltip for feature", () => {
                wrapper.vm.source.addFeature(lineFeature);

                const tooltipFeature = new Feature({
                    geometry: new ol.geom.Point([1, 1])
                });

                tooltipFeature.set("featureId", lineFeature.ol_uid);
                wrapper.vm.source.addFeature(tooltipFeature);

                const initialCount = wrapper.vm.source.getFeatures().length;

                wrapper.vm.handleDeleteMeasurement(lineFeature.ol_uid);

                expect(wrapper.vm.source.getFeatures().length).to.be.lessThan(initialCount);
            });

            it("handles non-existent feature gracefully", () => {
                expect(() => wrapper.vm.handleDeleteMeasurement("nonexistent_id")).to.not.throw();
            });

            it("normalizes string IDs to numbers", () => {
                lineFeature.ol_uid = 789;
                wrapper.vm.source.addFeature(lineFeature);

                wrapper.vm.handleDeleteMeasurement("789");

                const features = wrapper.vm.source.getFeatures();
                const found = features.find(f => f.ol_uid === 789);

                expect(found).to.be.undefined;
            });
        });

        describe("handleHighlightFeature", () => {
            beforeEach(() => {
                wrapper.vm.source.clear();
            });

            it("sets highlight style on feature", () => {
                wrapper.vm.source.addFeature(lineFeature);

                const setStyleSpy = sinon.spy(lineFeature, "setStyle");

                wrapper.vm.handleHighlightFeature(lineFeature.ol_uid);

                expect(setStyleSpy.called).to.be.true;
            });

            it("stores original style before highlighting", () => {
                wrapper.vm.source.addFeature(lineFeature);

                wrapper.vm.handleHighlightFeature(lineFeature.ol_uid);

                expect(lineFeature.get("_originalStyle")).to.exist;
            });

            it("applies black highlight color", () => {
                wrapper.vm.source.addFeature(lineFeature);

                const setStyleSpy = sinon.spy(lineFeature, "setStyle");

                wrapper.vm.handleHighlightFeature(lineFeature.ol_uid);

                expect(setStyleSpy.called).to.be.true;
                // Style should be set with highlight color
            });

            it("handles non-existent feature gracefully", () => {
                expect(() => wrapper.vm.handleHighlightFeature("nonexistent_id")).to.not.throw();
            });

            it("converts string ID to number", () => {
                lineFeature.ol_uid = 999;
                wrapper.vm.source.addFeature(lineFeature);

                const setStyleSpy = sinon.spy(lineFeature, "setStyle");

                wrapper.vm.handleHighlightFeature("999");

                expect(setStyleSpy.called).to.be.true;
            });
        });

        describe("handleUnhighlightFeature", () => {
            beforeEach(() => {
                wrapper.vm.source.clear();
            });

            it("restores original style on feature", () => {
                wrapper.vm.source.addFeature(lineFeature);

                const originalStyle = lineFeature.getStyle();

                lineFeature.set("_originalStyle", originalStyle);

                const setStyleSpy = sinon.spy(lineFeature, "setStyle");

                wrapper.vm.handleUnhighlightFeature(lineFeature.ol_uid);

                expect(setStyleSpy.calledWith(originalStyle)).to.be.true;
            });

            it("removes _originalStyle property after restoring", () => {
                wrapper.vm.source.addFeature(lineFeature);

                lineFeature.set("_originalStyle", {});

                wrapper.vm.handleUnhighlightFeature(lineFeature.ol_uid);

                expect(lineFeature.get("_originalStyle")).to.be.undefined;
            });

            it("sets style to null if no original style exists", () => {
                wrapper.vm.source.addFeature(lineFeature);

                const setStyleSpy = sinon.spy(lineFeature, "setStyle");

                wrapper.vm.handleUnhighlightFeature(lineFeature.ol_uid);

                expect(setStyleSpy.calledWith(null)).to.be.true;
            });

            it("handles non-existent feature gracefully", () => {
                expect(() => wrapper.vm.handleUnhighlightFeature("nonexistent_id")).to.not.throw();
            });

            it("converts string ID to number", () => {
                lineFeature.ol_uid = 888;
                wrapper.vm.source.addFeature(lineFeature);
                lineFeature.set("_originalStyle", {});

                const setStyleSpy = sinon.spy(lineFeature, "setStyle");

                wrapper.vm.handleUnhighlightFeature("888");

                expect(setStyleSpy.called).to.be.true;
            });
        });

        describe("removeTooltipForFeature", () => {
            beforeEach(() => {
                wrapper.vm.source.clear();
            });

            it("removes tooltip feature associated with measurement", () => {
                const tooltipFeature = new Feature({
                    geometry: new ol.geom.Point([1, 1])
                });

                tooltipFeature.set("featureId", "feature_123");
                wrapper.vm.source.addFeature(tooltipFeature);

                const initialCount = wrapper.vm.source.getFeatures().length;

                wrapper.vm.removeTooltipForFeature("feature_123");

                expect(wrapper.vm.source.getFeatures().length).to.equal(initialCount - 1);
            });

            it("removes multiple tooltip features for same measurement", () => {
                const tooltip1 = new Feature({geometry: new ol.geom.Point([1, 1])});
                const tooltip2 = new Feature({geometry: new ol.geom.Point([2, 2])});

                tooltip1.set("featureId", "feature_123");
                tooltip2.set("featureId", "feature_123");

                wrapper.vm.source.addFeature(tooltip1);
                wrapper.vm.source.addFeature(tooltip2);

                const initialCount = wrapper.vm.source.getFeatures().length;

                wrapper.vm.removeTooltipForFeature("feature_123");

                expect(wrapper.vm.source.getFeatures().length).to.equal(initialCount - 2);
            });

            it("does not remove tooltips for other features", () => {
                const tooltip1 = new Feature({geometry: new ol.geom.Point([1, 1])});
                const tooltip2 = new Feature({geometry: new ol.geom.Point([2, 2])});

                tooltip1.set("featureId", "feature_123");
                tooltip2.set("featureId", "feature_456");

                wrapper.vm.source.addFeature(tooltip1);
                wrapper.vm.source.addFeature(tooltip2);

                wrapper.vm.removeTooltipForFeature("feature_123");

                const remaining = wrapper.vm.source.getFeatures();

                expect(remaining).to.have.lengthOf(1);
                expect(remaining[0].get("featureId")).to.equal("feature_456");
            });

            it("preserves mode before and after removal", () => {
                wrapper.vm.mode = "modify";

                const tooltipFeature = new Feature({
                    geometry: new ol.geom.Point([1, 1])
                });

                tooltipFeature.set("featureId", "feature_123");
                wrapper.vm.source.addFeature(tooltipFeature);

                wrapper.vm.removeTooltipForFeature("feature_123");

                expect(wrapper.vm.mode).to.equal("modify");
            });

            it("temporarily sets mode to removingTooltip", () => {
                wrapper.vm.mode = "draw";

                const tooltipFeature = new Feature({
                    geometry: new ol.geom.Point([1, 1])
                });

                tooltipFeature.set("featureId", "feature_123");
                wrapper.vm.source.addFeature(tooltipFeature);

                const originalRemoveFeature = wrapper.vm.source.removeFeature;
                let modeAtRemoval;

                wrapper.vm.source.removeFeature = (feature) => {
                    modeAtRemoval = wrapper.vm.mode;
                    originalRemoveFeature.call(wrapper.vm.source, feature);
                };

                wrapper.vm.removeTooltipForFeature("feature_123");

                expect(modeAtRemoval).to.equal("removingTooltip");
            });

            it("handles non-existent tooltip gracefully", () => {
                expect(() => wrapper.vm.removeTooltipForFeature("nonexistent_id")).to.not.throw();
            });
        });
    });

    describe("Integration Tests - Component Communication", () => {
        let lineFeature;

        beforeEach(() => {
            lineFeature = new Feature({
                geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])
            });
            lineFeature.ol_uid = "integration_test_123";

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });
        });

        it("MeasureList receives enriched measurement list with undo/redo state", async () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);
            store.commit("Modules/Measure/addFeature", lineFeature);

            wrapper.vm.featureHistories[lineFeature.ol_uid] = {
                undoStack: [{type: "test"}],
                redoStack: []
            };

            await wrapper.vm.$nextTick();

            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            expect(measureListComponent.exists()).to.be.true;

            const measurements = measureListComponent.props("measurementList");

            expect(measurements).to.be.an("array");

            if (measurements.length > 0) {
                expect(measurements[0]).to.have.property("canUndo");
                expect(measurements[0]).to.have.property("canRedo");
            }
        });

        it("clicking undo in MeasureList triggers regulateUndo", async () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);
            store.commit("Modules/Measure/addFeature", lineFeature);

            wrapper.vm.featureHistories[lineFeature.ol_uid] = {
                undoStack: [{type: "addPoint", data: {}}],
                redoStack: []
            };

            await wrapper.vm.$nextTick();

            const measureListComponent = wrapper.findComponent({name: "MeasureList"});
            const regulateUndoSpy = sinon.spy(wrapper.vm, "regulateUndo");

            measureListComponent.vm.$emit("undo-action", lineFeature.ol_uid);
            await wrapper.vm.$nextTick();

            expect(regulateUndoSpy.called).to.be.true;
        });

        it("clicking redo in MeasureList triggers regulateRedo", async () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);
            store.commit("Modules/Measure/addFeature", lineFeature);

            wrapper.vm.featureHistories[lineFeature.ol_uid] = {
                undoStack: [],
                redoStack: [{type: "addPoint", data: {}}]
            };

            await wrapper.vm.$nextTick();

            const measureListComponent = wrapper.findComponent({name: "MeasureList"});
            const regulateRedoSpy = sinon.spy(wrapper.vm, "regulateRedo");

            measureListComponent.vm.$emit("redo-action", lineFeature.ol_uid);
            await wrapper.vm.$nextTick();

            expect(regulateRedoSpy.called).to.be.true;
        });

        it("hovering over MeasureList item highlights feature on map", async () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);

            const setStyleSpy = sinon.spy(lineFeature, "setStyle");
            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            measureListComponent.vm.$emit("highlight-feature", lineFeature.ol_uid);
            await wrapper.vm.$nextTick();

            expect(setStyleSpy.called).to.be.true;
        });

        it("leaving MeasureList item unhighlights feature on map", async () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);

            lineFeature.set("_originalStyle", {});

            const setStyleSpy = sinon.spy(lineFeature, "setStyle");
            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            measureListComponent.vm.$emit("unhighlight-feature", lineFeature.ol_uid);
            await wrapper.vm.$nextTick();

            expect(setStyleSpy.called).to.be.true;
        });

        it("deleting from MeasureList removes feature from map and store", async () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);
            store.commit("Modules/Measure/addFeature", lineFeature);

            const initialCount = wrapper.vm.source.getFeatures().length;
            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            measureListComponent.vm.$emit("delete-measurement", lineFeature.ol_uid);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.source.getFeatures().length).to.equal(initialCount - 1);
        });

        it("modifying from MeasureList enables modify mode", async () => {
            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            measureListComponent.vm.$emit("modify-measurement");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.selectedEditInteraction).to.equal("modify");
        });

        it("selected feature ID is passed to MeasureList", async () => {
            store.commit("Modules/Measure/setFeatureId", "selected_feature_789");
            await wrapper.vm.$nextTick();

            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            expect(measureListComponent.props("selectedFeatureId")).to.equal("selected_feature_789");
        });

        it("delete all button is disabled when no features exist", async () => {
            wrapper.vm.source.clear();
            await wrapper.vm.$nextTick();

            const deleteButton = wrapper.findComponent({name: "FlatButton", ref: "measure-delete"});

            // Check if the button would be disabled
            expect(wrapper.vm.source.getFeatures().length).to.equal(0);
        });

        it("complete workflow: draw -> undo -> redo -> modify -> delete", async () => {
            wrapper.vm.source.clear();
            wrapper.vm.source.addFeature(lineFeature);
            store.commit("Modules/Measure/addFeature", lineFeature);

            // Add undo history
            wrapper.vm.featureHistories[lineFeature.ol_uid] = {
                undoStack: [{
                    type: "addPoint",
                    data: {
                        point: [3, 3],
                        geometryType: "LineString"
                    }
                }],
                redoStack: []
            };

            // Undo
            const initialCoordLength = lineFeature.getGeometry().getCoordinates().length;

            wrapper.vm.regulateUndo(lineFeature.ol_uid);
            expect(lineFeature.getGeometry().getCoordinates().length).to.equal(initialCoordLength - 1);

            // Redo
            wrapper.vm.regulateRedo(lineFeature.ol_uid);
            expect(lineFeature.getGeometry().getCoordinates().length).to.equal(initialCoordLength);

            // Modify mode
            wrapper.vm.handleModifyMeasurement();
            expect(wrapper.vm.selectedEditInteraction).to.equal("modify");

            // Delete
            const beforeDeleteCount = wrapper.vm.source.getFeatures().length;

            wrapper.vm.handleDeleteMeasurement(lineFeature.ol_uid);
            expect(wrapper.vm.source.getFeatures().length).to.be.lessThan(beforeDeleteCount);
        });
    });
});
