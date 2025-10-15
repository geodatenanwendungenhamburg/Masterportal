import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import DirectionsComponent from "@modules/routing/components/Directions/DirectionsItem.vue";
import DirectionsItemBatchProcessingComponent from "@modules/routing/components/Directions/DirectionsItemBatchProcessing.vue";
import RoutingBatchProcessingCheckboxComponent from "@modules/routing/components/RoutingBatchProcessingCheckbox.vue";
import RoutingDownloadComponent from "@modules/routing/components/RoutingDownload.vue";
import RoutingRestrictionsInputComponent from "@modules/routing/components/RoutingRestrictionsInput.vue";
import RoutingElevationProfileComponent from "@modules/routing/components/RoutingElevationProfile.vue";
import RoutingContextMenuComponent from "../../../../components/RoutingContextMenu.vue";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/Directions/DirectionsItem.vue", () => {
    let batchProcessingActive,
        batchProcessingEnabled,
        directionsAvoidSource,
        directionsAvoidPointSource,
        directionsWaypointsSourceSpy,
        mapInteractionMode,
        routingDirections,
        setMapInteractionModeSpy,
        activeSpeedProfile,
        elevation,
        store,
        wrapper;

    beforeEach(() => {
        batchProcessingActive = false;
        batchProcessingEnabled = false;
        mapInteractionMode = "WAYPOINTS";
        routingDirections = null;
        activeSpeedProfile = "CAR";
        elevation = false;
        directionsWaypointsSourceSpy = sinon.spy(() => ({
            getFeatures: sinon.stub().returns([])
        }));

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
                                Directions: {
                                    namespaced: true,
                                    getters: {
                                        directionsAvoidSource: () => directionsAvoidSource,
                                        directionsAvoidPointSource: () => directionsAvoidPointSource,
                                        directionsRouteSource: () => {
                                            return {
                                                getFeatures: () => []
                                            };
                                        },
                                        directionsWaypointsSource: directionsWaypointsSourceSpy,
                                        isInputDisabled: () => false,
                                        mapInteractionMode: () => mapInteractionMode,
                                        routingAvoidFeaturesOptions: () => [],
                                        routingDirections: () => routingDirections,
                                        settings: () => {
                                            return {
                                                speedProfile: activeSpeedProfile
                                            };
                                        },
                                        waypoints: () => [
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub()
                                            },
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub()
                                            }
                                        ],
                                        keepRoutes: (state) => {
                                            return state.keepRoutes;
                                        }
                                    },
                                    mutations: {
                                        setDirectionsAvoidSource: sinon.stub(),
                                        setDirectionsAvoidPointSource: sinon.stub(),
                                        setMapInteractionMode: sinon.stub(),
                                        setRoutingDirections: sinon.stub(),
                                        setRoutingAvoidFeaturesOptions: sinon.stub()
                                    },
                                    actions: {
                                        createInteractionFromMapInteractionMode: sinon.stub(),
                                        initDirections: sinon.stub(),
                                        removeDirectionsAvoidDrawInteraction: sinon.stub()
                                    }
                                }
                            },
                            getters: {
                                directionsSettings: () => {
                                    return {
                                        elevation: elevation,
                                        batchProcessing: {
                                            active: batchProcessingActive,
                                            enabled: batchProcessingEnabled
                                        }
                                    };
                                }
                            },
                            mutations: {
                                setDirectionsAvoidSource: sinon.stub(),
                                setDirectionsAvoidPointSource: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    mode: "2D",
                    actions: {
                        addLayer: sinon.stub(),
                        removeInteraction: sinon.stub(),
                        addInteraction: sinon.stub()
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.stub()
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders Directions", () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.find("#routing-directions").exists()).to.be.true;
    });

    it("renders DirectionsBatchProcessingCheckbox", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = true;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingBatchProcessingCheckboxComponent).exists()).to.be.true;
    });

    it("doesn't render DirectionsBatchProcessingCheckbox", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingBatchProcessingCheckboxComponent).exists()).to.be.false;
    });

    it("renders DirectionsBatchProcessing", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = true;
        batchProcessingActive = true;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(DirectionsItemBatchProcessingComponent).exists()).to.be.true;
    });

    it("doesn't render DirectionsBatchProcessing", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = true;
        batchProcessingActive = false;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(DirectionsItemBatchProcessingComponent).exists()).to.be.false;
    });

    it("renders RoutingCoordinateInput", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.find("#routing-directions-coordinate-input-form").exists()).to.be.true;
    });

    it("doesn't render RoutingCoordinateInput", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = true;
        batchProcessingActive = true;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});


        await wrapper.vm.$nextTick();
        expect(wrapper.find("#routing-directions-coordinate-input-form").exists()).to.be.false;
    });

    it("renders routing result", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        routingDirections = {
            duration: 10,
            distance: 10,
            segments: []
        };
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.find("#routing-directions-result-directions").exists()).to.be.true;
        expect(wrapper.findComponent(RoutingDownloadComponent).exists()).to.be.true;
    });

    it("doesn't render routing result", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        routingDirections = null;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.find("#routing-directions-result-directions").exists()).to.be.false;
        expect(wrapper.findComponent(RoutingDownloadComponent).exists()).to.be.false;
    });

    it("renders routing restrictions", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        activeSpeedProfile = "HGV";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingRestrictionsInputComponent).exists()).to.be.true;
    });

    it("doesn't render routing restrictions", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingRestrictionsInputComponent).exists()).to.be.false;
    });


    it("renders elevation profile", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        elevation = true;
        routingDirections = {
            duration: 10,
            distance: 10,
            segments: []
        };
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingElevationProfileComponent).exists()).to.be.true;
    });

    it("doesn't render elevation profile", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        batchProcessingEnabled = false;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingElevationProfileComponent).exists()).to.be.false;
    });

    it("renders context menu", async () => {
        batchProcessingEnabled = false;
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
    });


    describe("checks if findDirections are called", () => {
        it("should call on changeSpeedProfile", () => {
            sinon.stub(DirectionsComponent.methods, "appendModalToBody");
            wrapper = shallowMount(DirectionsComponent, {global: {
                plugins: [store]
            }});
            const findDirectionsSpy = sinon.spy();

            wrapper.vm.findDirections = findDirectionsSpy;
            wrapper.vm.changeSpeedProfile("CAR");
            expect(findDirectionsSpy.calledOnce).to.be.true;
        });

        it("should call on changePreference", () => {
            sinon.stub(DirectionsComponent.methods, "appendModalToBody");
            wrapper = shallowMount(DirectionsComponent, {global: {
                plugins: [store]
            }});
            const findDirectionsSpy = sinon.spy();

            wrapper.vm.findDirections = findDirectionsSpy;
            wrapper.vm.changePreference("SHORTEST");
            expect(findDirectionsSpy.calledOnce).to.be.true;
        });

        it("should call on onAddAvoidOption", () => {
            sinon.stub(DirectionsComponent.methods, "appendModalToBody");
            wrapper = shallowMount(DirectionsComponent, {global: {
                plugins: [store]
            }});
            const findDirectionsSpy = sinon.spy();

            wrapper.vm.findDirections = findDirectionsSpy;
            wrapper.vm.onAddAvoidOption("HIGHWAYS");
            expect(findDirectionsSpy.calledOnce).to.be.true;
        });

        it("should call on onRemoveAvoidOption", () => {
            sinon.stub(DirectionsComponent.methods, "appendModalToBody");
            wrapper = shallowMount(DirectionsComponent, {global: {
                plugins: [store]
            }});
            const findDirectionsSpy = sinon.spy();

            wrapper.vm.findDirections = findDirectionsSpy;
            wrapper.vm.onRemoveAvoidOption("HIGHWAYS");
            expect(findDirectionsSpy.calledOnce).to.be.true;
        });
    });

    it("should toggle mapInteractionMode AVOID_AREAS => WAYPOINTS", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "AVOID_AREAS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidAreasEdit();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("WAYPOINTS");
    });

    it("should toggle mapInteractionMode WAYPOINTS => AVOID_AREAS", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "WAYPOINTS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidAreasEdit();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("AVOID_AREAS");
    });


    it("should toggle mapInteractionMode DELETE_AVOID_AREAS => WAYPOINTS", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "DELETE_AVOID_AREAS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidAreasDelete();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("WAYPOINTS");
    });

    it("should toggle mapInteractionMode WAYPOINTS => DELETE_AVOID_AREAS", () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "WAYPOINTS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidAreasDelete();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("DELETE_AVOID_AREAS");
    });

    it("should toggle mapInteractionMode WAYPOINTS => AVOID_POINTS", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "WAYPOINTS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidPointsEdit();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("AVOID_POINTS");
    });

    it("should toggle mapInteractionMode AVOID_POINTS => WAYPOINTS", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "AVOID_POINTS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidPointsEdit();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("WAYPOINTS");
    });

    it("should toggle mapInteractionMode AVOID_POINTS => AVOID_AREAS", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "AVOID_POINTS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidAreasEdit();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("AVOID_AREAS");
    });

    it("should toggle mapInteractionMode AVOID_AREAS => AVOID_POINTS", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        mapInteractionMode = "AVOID_AREAS";
        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        setMapInteractionModeSpy = sinon.spy(wrapper.vm, "setMapInteractionMode");
        wrapper.vm.changeMapInteractionModeAvoidPointsEdit();

        expect(setMapInteractionModeSpy.calledOnce).to.be.true;
        expect(setMapInteractionModeSpy.firstCall.args[0]).to.equals("AVOID_POINTS");
    });

    it("should reset all user settings", async () => {
        sinon.stub(DirectionsComponent.methods, "appendModalToBody");
        const removeWaypoint = sinon.spy(),
            setRoutingDirections = sinon.spy(),
            clearDirectionsAvoidSource = sinon.spy(),
            clearDirectionsAvoidPointSource = sinon.spy();

        directionsAvoidSource = {
            clear: clearDirectionsAvoidSource
        };
        directionsAvoidPointSource = {
            clear: clearDirectionsAvoidPointSource
        };

        wrapper = shallowMount(DirectionsComponent, {global: {
            plugins: [store]
        }});

        wrapper.vm.setRoutingDirections = setRoutingDirections;
        wrapper.vm.removeWaypoint = removeWaypoint;
        wrapper.vm.reset();

        expect(removeWaypoint.calledTwice).to.be.true;
        expect(setRoutingDirections.calledOnce).to.be.true;
        expect(clearDirectionsAvoidSource.calledOnce).to.be.true;
        expect(clearDirectionsAvoidPointSource.calledOnce).to.be.true;
    });
});
