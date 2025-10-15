import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import IsochronesLegendComponent from "@modules/routing/components/Isochrones/IsochronesLegend.vue";
import {RoutingIsochrones} from "@modules/routing/js/classes/routing-isochrones";
import {RoutingIsochronesArea} from "@modules/routing/js/classes/routing-isochrones-area";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/Isochrones/IsochronesLegend.vue", () => {

    /**
     * Creates wrapper for unit testing of this component
     * @returns {Object} wrapper
     */
    function createWrapper () {
        return shallowMount(IsochronesLegendComponent, {
            global: {
                plugins: [store]
            }
        });
    }

    let isochrones,
        isochroneArea1,
        isochroneArea2,
        areaUnit,
        attributes,
        store,
        wrapper;

    beforeEach(() => {
        isochrones = new RoutingIsochrones([
            13.654976,
            51.394561,
            14.610472,
            52.038351
        ]);

        isochroneArea1 = new RoutingIsochronesArea({
            coordinates: [
                [13.654976, 51.716036],
                [13.974829, 51.564453],
                [14.595649, 51.711114],
                [13.93262, 51.882296],
                [13.714232, 51.85033],
                [13.654976, 51.716036]
            ],
            groupIndex: 0,
            value: 1800,
            maximum: 1800,
            interval: 900,
            speedProfile: "CAR",
            optimization: "TIME",
            avoidSpeedProfileOptions: [],
            displayValue: 30,
            population: 100000,
            area: 250
        });

        isochroneArea2 = new RoutingIsochronesArea({
            coordinates: [
                [13.826935, 51.802841],
                [13.947338, 51.685157],
                [14.033771, 51.652093],
                [14.067815, 51.736324],
                [14.073216, 51.788426],
                [13.826935, 51.802841]
            ],
            groupIndex: 0,
            value: 1800,
            maximum: 1800,
            interval: 900,
            speedProfile: "CAR",
            optimization: "TIME",
            avoidSpeedProfileOptions: [],
            displayValue: 15,
            population: 35000,
            area: 100
        });

        isochrones.addArea(isochroneArea1);
        isochrones.addArea(isochroneArea2);

        attributes = ["area", "total_pop"];
        areaUnit = "km";

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing: {
                            namespaced: true,
                            modules: {
                                Isochrones: {
                                    namespaced: true,
                                    getters: {
                                        routingIsochrones: () => {
                                            return isochrones;
                                        }
                                    }
                                }
                            },
                            getters: {
                                isochronesSettings: () => {
                                    return {
                                        areaUnit: areaUnit,
                                        attributes: attributes
                                    };
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

    it("renders isochrones legend", () => {
        wrapper = createWrapper();
        expect(wrapper.find("#isochrones-legend-table").exists()).to.be.true;
    });

    it("shows all table headers", () => {
        wrapper = createWrapper();
        const headers = wrapper.findAll("thead tr th"),
            header1 = headers.at(0),
            header2 = headers.at(1),
            header3 = headers.at(2),
            header4 = headers.at(3);

        expect(header1.text()).equals("common:modules.routing.isochrones.legend.color");
        expect(header2.text()).equals("common:modules.routing.isochrones.legend.time [min]");
        expect(header3.text()).equals(`common:modules.routing.isochrones.legend.area [${areaUnit}²]`);
        expect(header4.text()).equals("common:modules.routing.isochrones.legend.population");
    });

    it("doesn't show population header", () => {
        attributes = ["area"];
        wrapper = createWrapper();

        const headers = wrapper.findAll("thead tr th"),
            header1 = headers.at(0),
            header2 = headers.at(1),
            header3 = headers.at(2),
            header4 = headers.at(3);

        expect(header1.text()).equals("common:modules.routing.isochrones.legend.color");
        expect(header2.text()).equals("common:modules.routing.isochrones.legend.time [min]");
        expect(header3.text()).equals(`common:modules.routing.isochrones.legend.area [${areaUnit}²]`);
        expect(header4).equals(undefined);
    });

    it("doesn't show area header", () => {
        attributes = ["total_pop"];
        wrapper = createWrapper();

        const headers = wrapper.findAll("thead tr th"),
            header1 = headers.at(0),
            header2 = headers.at(1),
            header3 = headers.at(2),
            header4 = headers.at(3);

        expect(header1.text()).equals("common:modules.routing.isochrones.legend.color");
        expect(header2.text()).equals("common:modules.routing.isochrones.legend.time [min]");
        expect(header3.text()).equals("common:modules.routing.isochrones.legend.population");
        expect(header4).equals(undefined);
    });

    it("shows correct result", () => {
        const toLocaleStringSpy = sinon.spy(Number.prototype, "toLocaleString"),
            getDisplayValueSpy = sinon.spy(RoutingIsochronesArea.prototype, "getDisplayValue");

        wrapper = createWrapper();

        expect(getDisplayValueSpy.firstCall.returnValue).equals(30);
        expect(toLocaleStringSpy.firstCall.thisValue).equals(250);
        expect(toLocaleStringSpy.secondCall.thisValue).equals(100000);

        expect(getDisplayValueSpy.secondCall.returnValue).equals(15);
        expect(toLocaleStringSpy.thirdCall.thisValue).equals(100);
        expect(toLocaleStringSpy.lastCall.thisValue).equals(35000);
    });
});
