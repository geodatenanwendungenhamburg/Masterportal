import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import VectorSource from "ol/source/Vector.js";
import {RoutingWaypoint} from "@modules/routing/js/classes/routing-waypoint.js";
import TsrOutputComponent from "@modules/routing/components/TSR/TsrOutput.vue";
import RoutingDownloadComponent from "@modules/routing/components/RoutingDownload.vue";
import RoutingElevationProfileComponent from "@modules/routing/components/RoutingElevationProfile.vue";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/TSR/TsrOutput.vue", () => {
    let routingDirectionsWaypointSource,
        start,
        end,
        waypoint1,
        waypoint2,
        waypoints,
        elevation,
        store,
        wrapper;

    beforeEach(() => {
        routingDirectionsWaypointSource = new VectorSource();

        start = new RoutingWaypoint({index: 0, source: routingDirectionsWaypointSource});
        start.setCoordinates([8, 51]);
        start.setIndexDirectionsLineString(0);

        waypoint1 = new RoutingWaypoint({index: 1, source: routingDirectionsWaypointSource});
        waypoint1.setCoordinates([8, 50]);
        waypoint1.setIndexDirectionsLineString(1);

        waypoint2 = new RoutingWaypoint({index: 2, source: routingDirectionsWaypointSource});
        waypoint2.setCoordinates([9, 51]);
        waypoint2.setIndexDirectionsLineString(2);

        end = new RoutingWaypoint({index: 3, source: routingDirectionsWaypointSource});
        end.setCoordinates([9, 52]);
        end.setIndexDirectionsLineString(3);

        waypoints = [start, waypoint1, waypoint2, end];
        elevation = false;

        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing:
                        {
                            namespaced: true,
                            getters: {
                                tsrSettings: () => {
                                    return {
                                        elevation: elevation
                                    };
                                }
                            },
                            modules: {
                                TSR: {
                                    namespaced: true,
                                    getters: {
                                        waypoints: () => waypoints,
                                        settings: () => {
                                            return {
                                                speedProfile: "CAR"
                                            };
                                        },
                                        tsrDuration: sinon.stub(),
                                        tsrDistance: sinon.stub()
                                    },
                                    actions: {
                                        removeTSRWaypointsDrawInteraction: sinon.stub(),
                                        createTSRWaypointsDrawInteraction: sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("renders TSR", () => {
        wrapper = shallowMount(TsrOutputComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.find("#tsr-output").exists()).to.be.true;
    });

    it("renders 4 tsr output items", () => {
        wrapper = shallowMount(TsrOutputComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findAll(".tsr-output-item").length).to.equal(4);
    });

    it("renders start point first", () => {
        wrapper = shallowMount(TsrOutputComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findAll(".icon-with-number > i").at(0).classes()).contains("start-icon");
        expect(wrapper.findAll(".tsr-idx").at(0).text()).equals("common:modules.routing.startIndex");
        expect(wrapper.findAll(".tsr-output-item").at(0).html()).contains("8, 51");
    });

    it("renders render end point last", () => {
        wrapper = shallowMount(TsrOutputComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findAll(".icon-with-number > i").at(waypoints.length - 1).classes()).contains("end-icon");
        expect(wrapper.findAll(".tsr-idx").at(waypoints.length - 1).text()).equals("common:modules.routing.endIndex");
        expect(wrapper.findAll(".tsr-output-item").at(waypoints.length - 1).html()).contains("9, 52");
    });

    it("renders download button", () => {
        wrapper = shallowMount(TsrOutputComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(RoutingDownloadComponent).exists()).to.be.true;
    });

    it("renders elevation profile", () => {
        elevation = true;
        wrapper = shallowMount(TsrOutputComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(RoutingElevationProfileComponent).exists()).to.be.true;
    });

    it("doesn't render elevation profile", () => {
        wrapper = shallowMount(TsrOutputComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(RoutingElevationProfileComponent).exists()).to.be.false;
    });
});
