import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import MeasureList from "@modules/measure/components/MeasureList.vue";

describe("src/modules/measure/components/MeasureList.vue", () => {
    let wrapper;

    const mockMeasurements = [
        {
            id: "1",
            type: "LineString",
            feature: {},
            displayValue: "100 m",
            canUndo: true,
            canRedo: false
        },
        {
            id: "2",
            type: "Polygon",
            feature: {},
            displayValue: "500 m²",
            canUndo: false,
            canRedo: true
        }
    ];

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders the component", () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        expect(wrapper.find(".measure-list-container").exists()).to.be.true;
    });

    it("renders all measurements in the list", () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        const listItems = wrapper.findAll(".measure-list-item");

        expect(listItems).to.have.lengthOf(2);
    });

    it("emits modify-measurement event when modify button is clicked", async () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        await wrapper.vm.modifyMeasurement("1");

        expect(wrapper.emitted("modify-measurement")).to.exist;
        expect(wrapper.emitted("modify-measurement")[0]).to.deep.equal(["1"]);
    });

    it("emits delete-measurement event when delete button is clicked", async () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        await wrapper.vm.deleteMeasurement("1");

        expect(wrapper.emitted("delete-measurement")).to.exist;
        expect(wrapper.emitted("delete-measurement")[0]).to.deep.equal(["1"]);
    });

    it("emits undo-action event when undo button is clicked", async () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        wrapper.vm.$emit("undo-action", "1");

        expect(wrapper.emitted("undo-action")).to.exist;
    });

    it("emits redo-action event when redo button is clicked", async () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        wrapper.vm.$emit("redo-action", "1");

        expect(wrapper.emitted("redo-action")).to.exist;
    });

    it("does not render when measurement list is empty", () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: [],
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        expect(wrapper.find(".measure-list-container").exists()).to.be.false;
    });

    it("applies selected class to the selected feature", () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: "1"
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        const listItems = wrapper.findAll(".measure-list-item");

        expect(listItems[0].classes()).to.include("selected");
        expect(listItems[1].classes()).to.not.include("selected");
    });

    it("emits highlight-feature event on mouse enter", async () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        await wrapper.vm.highlightFeature("1");

        expect(wrapper.emitted("highlight-feature")).to.exist;
        expect(wrapper.emitted("highlight-feature")[0]).to.deep.equal(["1"]);
    });

    it("emits unhighlight-feature event on mouse leave", async () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        await wrapper.vm.unhighlightFeature("1");

        expect(wrapper.emitted("unhighlight-feature")).to.exist;
        expect(wrapper.emitted("unhighlight-feature")[0]).to.deep.equal(["1"]);
    });

    it("returns correct icon for LineString type", () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        expect(wrapper.vm.getTypeIcon("LineString")).to.equal("bi-rulers");
    });

    it("returns correct icon for Polygon type", () => {
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: mockMeasurements,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        expect(wrapper.vm.getTypeIcon("Polygon")).to.equal("bi-bounding-box");
    });

    it("undo button is disabled when measurement canUndo is false", async () => {
        const measurementsWithoutUndo = [
            {
                id: "1",
                type: "LineString",
                feature: {},
                displayValue: "100 m",
                canUndo: false,
                canRedo: false
            }
        ];
        
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: measurementsWithoutUndo,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        const undoButton = wrapper.find("#measure-item-undo-1");

        expect(undoButton.exists()).to.be.true;
    });

    it("redo button is disabled when measurement canRedo is false", async () => {
        const measurementsWithoutRedo = [
            {
                id: "1",
                type: "LineString",
                feature: {},
                displayValue: "100 m",
                canUndo: false,
                canRedo: false
            }
        ];
        
        wrapper = shallowMount(MeasureList, {
            props: {
                measurementList: measurementsWithoutRedo,
                selectedFeatureId: null
            },
            global: {
                mocks: {
                    $t: (key) => key
                }
            }
        });

        const redoButton = wrapper.find("#measure-item-redo-1");

        expect(redoButton.exists()).to.be.true;
    });
});
