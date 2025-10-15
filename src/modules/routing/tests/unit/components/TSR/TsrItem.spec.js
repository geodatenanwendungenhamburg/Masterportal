import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import TsrComponent from "@modules/routing/components/TSR/TsrItem.vue";
import TsrUploadComponent from "@modules/routing/components/TSR/TsrUpload.vue";
import RoutingCoordinateInputComponent from "@modules/routing/components/RoutingCoordinateInput.vue";
import RoutingContextMenuComponent from "../../../../components/RoutingContextMenu.vue";
import TsrOutputComponent from "@modules/routing/components/TSR/TsrOutput.vue";
import {RoutingTSRDirections} from "@modules/routing/js/classes/routing-directions-tsr";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/TSR/TsrItem.vue", () => {
    let mapInteractionMode,
        tsrDirections,
        store,
        wrapper,
        addStartEnd;

    beforeEach(() => {
        mapInteractionMode = "WAYPOINTS";
        tsrDirections = null;
        addStartEnd = 0;

        mapCollection.clear();
        mapCollection.addMap({
            mode: "2D",
            mapMode: "2D"
        }, "2D");

        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing:
                        {
                            namespaced: true,
                            modules: {
                                TSR: {
                                    namespaced: true,
                                    getters: {
                                        mapInteractionMode: () => mapInteractionMode,
                                        tsrDirections: () => tsrDirections,
                                        settings: () => {
                                            return {
                                                speedProfile: "CAR"
                                            };
                                        },
                                        waypoints: () => [
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                getCoordinates: () => sinon.stub()
                                            },
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                getCoordinates: () => sinon.stub()
                                            }
                                        ],
                                        addStartEnd: () => addStartEnd,
                                        getTSRSpeedProfiles: sinon.stub(),
                                        tsrRouteSource: sinon.stub(),
                                        isInputDisabled: sinon.stub()
                                    },
                                    mutations: {
                                        setMapInteractionMode: sinon.stub(),
                                        setTsrDirections: sinon.stub()
                                    },
                                    actions: {
                                        createInteractionFromMapInteractionMode: sinon.stub(),
                                        initTSR: sinon.stub(),
                                        isStartEndInput: sinon.stub(),
                                        closeTSR: sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    mode: "2D"
                }
            }
        });
        sinon.stub(TsrComponent.methods, "removeModalFromBody");
        sinon.stub(TsrComponent.methods, "appendModalToBody");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders TSR", () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.find("#routing-tsr").exists()).to.be.true;
    });

    it("renders TSR coordinate input (start- & endpoint)", () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.find("#routing-tsr-coordinate-input-form").exists()).to.be.true;
        expect(wrapper.findComponent(RoutingCoordinateInputComponent).exists()).to.be.true;

        expect(wrapper.find(".startpoint-input").exists()).to.be.true;
        expect(wrapper.find(".waypoint-input").exists()).to.be.false;
        expect(wrapper.find(".endpoint-input").exists()).to.be.true;
    });

    it("renders TSR coordinate input (start-, way- & endpoint)", () => {
        store.getters["Modules/Routing/TSR/waypoints"].push({index: sinon.stub(), getDisplayName: () => sinon.stub()});

        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.find("#routing-tsr-coordinate-input-form").exists()).to.be.true;
        expect(wrapper.findComponent(RoutingCoordinateInputComponent).exists()).to.be.true;

        expect(wrapper.find(".startpoint-input").exists()).to.be.true;
        expect(wrapper.find(".waypoint-input").exists()).to.be.true;
        expect(wrapper.find(".endpoint-input").exists()).to.be.true;
    });

    describe("checks if findTSR are called", () => {
        it("should not call on changeSpeedProfile", () => {
            wrapper = shallowMount(TsrComponent, {global: {
                plugins: [store]
            }});
            const findTSRSpy = sinon.spy();

            wrapper.vm.findTSR = findTSRSpy;
            wrapper.vm.changeSpeedProfile("CAR");
            expect(findTSRSpy.calledOnce).to.be.false;
        });

        it("should call findTSR after clicking calculate button", () => {
            wrapper = shallowMount(TsrComponent, {global: {
                plugins: [store]
            }});
            const findTSRSpy = sinon.spy();

            wrapper.vm.findTSR = findTSRSpy;
            wrapper.findAll(".btn-primary").at(0).trigger("click");
            expect(findTSRSpy.calledOnce).to.be.true;
        });
    });

    it("should reset all user settings", async () => {
        const removeWaypoint = sinon.spy(),
            setTsrDirections = sinon.spy();

        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        wrapper.vm.setTsrDirections = setTsrDirections;
        wrapper.vm.removeWaypoint = removeWaypoint;
        wrapper.vm.reset();

        expect(removeWaypoint.calledTwice).to.be.true;
        expect(setTsrDirections.calledOnce).to.be.true;
    });

    it("doesn't render tsr output", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(TsrOutputComponent).exists()).to.be.false;
    });

    it("renders tsr output", async () => {
        tsrDirections = new RoutingTSRDirections({
            distance: 12.34,
            duration: 61234,
            lineString: [[8.1, 51.1], [8.15, 51.15], [8.2, 51.2]],
            lineStringWaypointIndex: [0, 2]
        });

        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(TsrOutputComponent).exists()).to.be.true;
    });

    it("renders upload button", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.find("#button-up").exists()).to.be.true;
    });

    it("renders TsrUpload component", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(TsrUploadComponent).exists()).to.be.true;
    });

    it("renders context menu", () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
    });


    it("emits addStartEnd if input field for start point is clicked", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        wrapper.findComponent(RoutingCoordinateInputComponent).vm.$emit("add-start-end", 0);
        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingCoordinateInputComponent).emitted("add-start-end")[0][0]).to.equal(0);
    });

    it("emits addStartEnd if input field for endpoint is clicked", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        wrapper.findComponent(RoutingCoordinateInputComponent).vm.$emit("add-start-end", 2);
        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingCoordinateInputComponent).emitted("add-start-end")[0][0]).to.equal(2);
    });

    it("emits search-result-selected if search result is selected", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        wrapper.findComponent(RoutingCoordinateInputComponent).vm.$emit("search-result-selected", 0);

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingCoordinateInputComponent).emitted("search-result-selected")[0][0]).to.equal(0);
    });


    it("checks if csv header toggle is active", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        await wrapper.find("#csvHeaderSwitch").trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.find("#csvHeaderSwitch").exists()).to.be.true;
        expect(wrapper.find("#csvHeaderSwitch").element.checked).to.be.true;
    });

    it("checks csvs headers value inital state", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        const uploadComponent = wrapper.findComponent(TsrUploadComponent);

        expect(wrapper.vm.csvHeaders).to.be.false;
        expect(uploadComponent.props().csvHeaders).to.be.false;
    });

    it("should update csvHeaders child prop after changing in parent component", async () => {
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        const uploadComponent = wrapper.findComponent(TsrUploadComponent);

        await wrapper.setData({csvHeaders: true});
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.csvHeaders).to.be.true;
        expect(uploadComponent.props().csvHeaders).to.be.true;
    });
});
