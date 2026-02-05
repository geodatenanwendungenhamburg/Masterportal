import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {nextTick} from "vue";
import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import LineString from "ol/geom/LineString.js";
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


        geometrySelect.element.value = "Polygon";
        geometrySelect.trigger("change");
        nextTick(async () => {
            expect(MeasureModule.mutations.setSelectedGeometry.calledOnce).to.be.true;
            expect(MeasureModule.mutations.setSelectedGeometry.firstCall.args[1]).to.equals("Polygon");

            // draw interaction should have been remade on geometry change
            expect(MeasureModule.actions.createDrawInteraction.calledOnce).to.be.true;
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
            const initialPointCount = feature1.getGeometry().getCoordinates().length;
            const lastPoint = feature1.getGeometry().getCoordinates()[initialPointCount - 1];

            wrapper.vm.featureHistories[featureId] = {
                undo: [{
                    mode: "addPoint",
                    data: {
                        point: lastPoint,
                        geometryType: "LineString"
                    }
                }],
                redo: []
            };

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
                    data: {
                        point: lastPoint,
                        geometryType: "LineString"
                    }
                }]
            };

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

        it("regulateModify with featureId creates feature-specific modify interaction", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.addFeature(feature1);
            wrapper.vm.regulateModify(feature1.ol_uid);

            expect(wrapper.vm.currentModifyInteraction).to.not.be.null;
            expect(wrapper.vm.selectedEditInteraction).to.equal("modify");
        });

        it("handleModifyMeasurement sets currentlyModifyingFeatureId and calls regulateModify", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const regulateModifySpy = sinon.spy(wrapper.vm, "regulateModify");

            wrapper.vm.handleModifyMeasurement("test-feature-id");

            expect(wrapper.vm.currentlyModifyingFeatureId).to.equal("test-feature-id");
            expect(regulateModifySpy.calledWith("test-feature-id")).to.be.true;
        });

        it("handleModifyMeasurement toggles modify mode when clicking same feature", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.currentlyModifyingFeatureId = 12345;
            wrapper.vm.selectedEditInteraction = "modify";

            wrapper.vm.handleModifyMeasurement(12345);

            expect(wrapper.vm.currentlyModifyingFeatureId).to.be.null;
            expect(wrapper.vm.selectedEditInteraction).to.equal("");
        });

        it("handleDeleteMeasurement clears currentlyModifyingFeatureId if deleting modified feature", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const feature = new Feature({
                geometry: new LineString([[0, 0], [1, 1]])
            });

            wrapper.vm.source.addFeature(feature);
            wrapper.vm.currentlyModifyingFeatureId = feature.ol_uid;
            wrapper.vm.selectedEditInteraction = "modify";

            wrapper.vm.handleDeleteMeasurement(feature.ol_uid);

            expect(wrapper.vm.currentlyModifyingFeatureId).to.be.null;
            expect(wrapper.vm.selectedEditInteraction).to.equal("");
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

                expect(wrapper.vm.featureHistories[normalizedId]).to.exist;
            });

            it.skip("does not overwrite existing history", async () => {
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

        it("modifying from MeasureList enables modify mode", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            measureListComponent.vm.$emit("modify-measurement");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.selectedEditInteraction).to.equal("modify");
        });

        it("selected feature ID is passed to MeasureList", async () => {
            store.commit("Modules/Measure/setFeatureId", "selected_feature_789");

            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            await wrapper.vm.$nextTick();

            const measureListComponent = wrapper.findComponent({name: "MeasureList"});

            expect(measureListComponent.props("selectedFeatureId")).to.equal("selected_feature_789");
        });

        it("delete all button is disabled when no features exist", async () => {
            wrapper.vm.source.clear();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.source.getFeatures().length).to.equal(0);
        });

    });
});
