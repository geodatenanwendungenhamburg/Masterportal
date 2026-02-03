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
                        mode: () => "2D"
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

        it("renders edit toolbar when features exist or undo/redo stacks have items", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            expect(wrapper.find("#measure-edit-undo").exists()).to.be.false;

            wrapper.vm.undoFeatures.push({feature: feature1, mode: "draw"});
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#measure-edit-undo").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-redo").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-modify").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-delete").exists()).to.be.true;
            expect(wrapper.find("#measure-edit-deleteAll").exists()).to.be.true;
        });

        it("undo button is disabled when undoFeatures is empty", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.clear();
            wrapper.vm.undoFeatures = [];
            wrapper.vm.redoFeatures = [];
            wrapper.vm.source.addFeature(feature1);
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const allButtons = wrapper.findAllComponents({name: "IconButton"});
            const undoButtonComponent = allButtons.find(btn => btn.attributes("id") === "measure-edit-undo");

            expect(undoButtonComponent).to.exist;
            expect(undoButtonComponent.props("classArray")).to.include("disabled");
        });

        it("redo button is disabled when redoFeatures is empty", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.clear();
            wrapper.vm.undoFeatures = [];
            wrapper.vm.redoFeatures = [];
            wrapper.vm.source.addFeature(feature1);
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
            wrapper.vm.undoFeatures = [{feature: feature1, mode: "draw"}];
            wrapper.vm.mode = "";

            const initialPointCount = feature1.getGeometry().getCoordinates().length;

            wrapper.vm.regulateUndo();

            const pointsAfterUndo = feature1.getGeometry().getCoordinates().length;

            expect(pointsAfterUndo).to.equal(initialPointCount - 1);
            expect(wrapper.vm.redoFeatures.length).to.equal(1);
            expect(wrapper.vm.redoFeatures[0].mode).to.equal("addPoint");
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

            wrapper.vm.redoFeatures = [{
                feature: feature1,
                mode: "addPoint",
                point: lastPoint,
                geometryType: "LineString"
            }];
            wrapper.vm.mode = "";

            wrapper.vm.regulateRedo();

            const pointsAfterRedo = feature1.getGeometry().getCoordinates().length;

            expect(pointsAfterRedo).to.equal(initialPointCount + 1);
            expect(wrapper.vm.redoFeatures.length).to.equal(0);
        });

        it("shiftUndoRedoFeatures adds feature to undoFeatures on draw", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.shiftUndoRedoFeatures(feature1, "draw", "");

            expect(wrapper.vm.undoFeatures.length).to.equal(1);
            expect(wrapper.vm.undoFeatures[0].feature).to.deep.equal(feature1);
            expect(wrapper.vm.undoFeatures[0].mode).to.equal("draw");
            expect(wrapper.vm.redoFeatures.length).to.equal(0);
        });

        it("regulateDeleteAll clears both undo and redo stacks", () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.source.addFeatures([feature1, feature2]);
            wrapper.vm.undoFeatures = [{feature: feature1, mode: "draw"}];
            wrapper.vm.redoFeatures = [{feature: feature2, mode: "draw"}];

            wrapper.vm.regulateDeleteAll();

            expect(wrapper.vm.undoFeatures.length).to.equal(0);
            expect(wrapper.vm.redoFeatures.length).to.equal(0);
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

        it("regulateDelete clears both undo and redo stacks", async () => {
            wrapper = shallowMount(MeasureInMapComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            wrapper.vm.undoFeatures = [{feature: feature1, mode: "draw"}];
            wrapper.vm.redoFeatures = [{feature: feature2, mode: "draw"}];

            wrapper.vm.regulateDelete();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.undoFeatures.length).to.equal(0);
            expect(wrapper.vm.redoFeatures.length).to.equal(0);
            expect(wrapper.vm.currentSelectInteractions.length).to.equal(2);
            expect(wrapper.vm.selectedEditInteraction).to.equal("delete");
        });
    });
});
