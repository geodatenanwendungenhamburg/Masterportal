import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import RoutingContextMenuComponent from "../../../components/RoutingContextMenu.vue";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/RoutingContextMenu.vue", () => {
    let store,
        wrapper,
        activeRoutingToolOption,
        coordinates1,
        coordinates2;

    /**
     * Create Wrapper for RoutingContextMenu component.
     * @returns {Object} wrapper
     */
    function createWrapper () {
        return shallowMount(RoutingContextMenuComponent, {global: {
            plugins: [store]
        }});
    }

    beforeEach(() => {

        mapCollection.clear();
        mapCollection.addMap({
            mode: "2D",
            mapMode: "2D",
            addOverlay: sinon.stub(),
            addInteraction: sinon.stub(),
            removeOverlay: sinon.stub(),
            removeInteraction: sinon.stub(),
            getViewport: () => ({
                addEventListener: () => sinon.stub()
            })
        }, "2D");
        coordinates1 = [10.002199616100814, 53.550403286559074];
        coordinates2 = [];
        activeRoutingToolOption = "DIRECTIONS";

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
                                        settings: () => {
                                            return {
                                                speedProfile: "CAR"
                                            };
                                        },
                                        waypoints: () => [
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                coordinates: coordinates1
                                            },
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                coordinates: coordinates2
                                            }
                                        ],
                                        directionsWaypointsLayer: () => sinon.stub(),
                                        directionsAvoidLayer: () => sinon.stub(),
                                        directionsAvoidPointLayer: () => sinon.stub()
                                    },
                                    actions: {}
                                },
                                TSR: {
                                    namespaced: true,
                                    getters: {
                                        settings: () => {
                                            return {
                                                speedProfile: "CAR"
                                            };
                                        },
                                        waypoints: () => [
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                coordinates: coordinates1
                                            },
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                coordinates: coordinates2
                                            }
                                        ],
                                        tsrWaypointsLayer: () => sinon.stub()
                                    },
                                    actions: {
                                    }
                                }
                            },
                            getters: {
                                activeRoutingToolOption: () => activeRoutingToolOption
                            }
                        }
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

    it("Directions: renders context menu", () => {
        wrapper = createWrapper();

        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
        expect(wrapper.find("#context-menu").exists()).to.be.true;
        expect(wrapper.find("#add-avoidpoint").exists()).to.be.true;
        expect(wrapper.find(".routing-close-context-menu").exists()).to.be.true;
    });

    it("Directions: does not render 'add-waypoint' button when < 2 waypoints are set", () => {
        wrapper = createWrapper();

        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
        expect(wrapper.find("#add-waypoint").exists()).to.be.false;
        expect(wrapper.find("#add-startpoint").exists()).to.be.true;
        expect(wrapper.find("#add-endpoint").exists()).to.be.true;
    });

    it("Directions: does render 'add-waypoint' button when >= 2 waypoints are set", () => {
        coordinates2 = [9.987255754140085, 53.55361907890652];

        wrapper = createWrapper();

        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
        expect(wrapper.find("#add-waypoint").exists()).to.be.true;
    });

    it("TSR: renders context menu", () => {
        activeRoutingToolOption = "TSR";

        wrapper = createWrapper();

        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
        expect(wrapper.find("#context-menu").exists()).to.be.true;
        expect(wrapper.find(".routing-close-context-menu").exists()).to.be.true;
    });

    it("TSR: does render 'add-waypoint' button when < 2 waypoints are set", () => {
        activeRoutingToolOption = "TSR";

        wrapper = createWrapper();

        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
        expect(wrapper.find("#add-waypoint").exists()).to.be.true;
        expect(wrapper.find("#add-startpoint").exists()).to.be.true;
        expect(wrapper.find("#add-endpoint").exists()).to.be.true;
    });

    it("TSR: does render 'add-waypoint' button when >= 2 waypoints are set", () => {
        activeRoutingToolOption = "TSR";
        coordinates2 = [9.987255754140085, 53.55361907890652];

        wrapper = createWrapper();

        expect(wrapper.findComponent(RoutingContextMenuComponent).exists()).to.be.true;
        expect(wrapper.find("#add-waypoint").exists()).to.be.true;
    });
});
