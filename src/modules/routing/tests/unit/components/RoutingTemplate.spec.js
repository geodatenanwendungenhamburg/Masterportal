import {createStore} from "vuex";
import {expect} from "chai";
import {config, shallowMount} from "@vue/test-utils";
import RoutingComponent from "@modules/routing/components/RoutingTemplate.vue";
import sinon from "sinon";
import mutations from "@modules/routing/store/mutationsRouting.js";
import actions from "@modules/routing/store/actionsRouting.js";

config.global.mocks.$t = key => key;


describe("src/modules/routing/components/RoutingTemplate.vue", () => {
    let activeRoutingToolOption,
        store,
        wrapper;

    beforeEach(() => {
        const map = {
            id: "ol",
            mode: "2D",
            addLayer: sinon.spy(),
            removeLayer: sinon.spy(),
            addInteraction: sinon.spy(),
            removeInteraction: sinon.spy(),
            updateSize: sinon.spy(),
            getInteractions: () => {
                return {
                    getArray: () => []
                };
            }
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");

        store = createStore({
            namespaced: true,
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addPointerMoveHandler: sinon.stub(),
                        removePointerMoveHandler: sinon.stub(),
                        removeInteraction: sinon.stub(),
                        addInteraction: sinon.stub(),
                        addLayer: sinon.stub(),
                        unregisterListener: sinon.stub(),
                        registerListener: sinon.stub()
                    },
                    state: {
                        mode: "2D"
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing:
                        {
                            namespaced: true,
                            modules: {
                                namespaced: true,
                                Directions: {
                                    namespaced: true,
                                    getters: {
                                        isLoadingDirections: () => sinon.stub()
                                    },
                                    actions: {
                                        closeDirections: sinon.stub()
                                    }
                                },
                                Isochrones: {
                                    namespaced: true,
                                    getters: {
                                        isLoadingIsochrones: () => sinon.stub()
                                    },
                                    actions: {
                                        closeIsochrones: sinon.stub()
                                    }
                                }
                            },
                            state: {
                                geosearch: {
                                    type: "BKG",
                                    serviceId: "1"
                                },
                                geosearchReverse: {
                                    serviceId: "1",
                                    type: "BKG"
                                },
                                isochronesSettings: {
                                    type: "ORS",
                                    serviceId: "1"
                                },
                                directionsSettings: {
                                    type: "ORS",
                                    serviceId: "1"
                                }
                            },
                            mutations,
                            actions,
                            getters: {
                                activeRoutingToolOption: () => activeRoutingToolOption,
                                filteredRoutingToolOptions: () => [
                                    {
                                        id: "DIRECTIONS",
                                        component: {
                                            name: "DirectionsItem"
                                        }
                                    },
                                    {
                                        id: "ISOCHRONES",
                                        component: {
                                            name: "IsochronesItem"
                                        }
                                    },
                                    {
                                        id: "TSR",
                                        component: {
                                            name: "TsrItem"
                                        }
                                    }
                                ]
                            }
                        }
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

    it("renders Routing", () => {
        wrapper = shallowMount(RoutingComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#routing").exists()).to.be.true;
    });

    it("renders directions", () => {
        activeRoutingToolOption = "DIRECTIONS";
        wrapper = shallowMount(RoutingComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("directions-item-stub").exists()).to.be.true;
    });

    it("renders isochrones", () => {
        activeRoutingToolOption = "ISOCHRONES";
        wrapper = shallowMount(RoutingComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("isochrones-item-stub").exists()).to.be.true;
    });

    it("renders tsr", () => {
        activeRoutingToolOption = "TSR";
        wrapper = shallowMount(RoutingComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("tsr-item-stub").exists()).to.be.true;
    });
});
