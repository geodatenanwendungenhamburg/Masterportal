import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, mount} from "@vue/test-utils";
import RoutingElevationProfileData from "@modules/routing/components/RoutingElevationProfile.vue";
import VectorSource from "ol/source/Vector.js";
import {Chart} from "chart.js";

config.global.mocks.$t = key => key;

describe.skip("src/modules/routing/components/RoutingElevationProfileData.vue", () => {
    const routingDirections = {
            duration: 10,
            distance: 10,
            segments: [],
            elevationProfile: {
                data: [[0, 150], [10, 185], [17, 204]],
                ascent: 100,
                descent: 250
            }
        },

        tsrDirections = {
            duration: 15,
            distance: 20,
            segments: [],
            elevationProfile: {
                data: [[0, 200], [85, 350], [120, 305]],
                ascent: 75,
                descent: 50
            }
        },

        directionsElevationSource = new VectorSource(),
        tsrElevationSource = new VectorSource();

    let store,
        activeRoutingToolOption,
        wrapper;

    beforeEach(() => {

        sinon.stub(Chart.prototype, "render");

        activeRoutingToolOption = "DIRECTIONS";
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing: {
                            namespaced: true,
                            modules: {
                                Directions: {
                                    namespaced: true,
                                    getters: {
                                        routingDirections: () => routingDirections,
                                        directionsElevationSource: () => directionsElevationSource
                                    }
                                },
                                TSR: {
                                    namespaced: true,
                                    getters: {
                                        tsrDirections: () => tsrDirections,
                                        tsrElevationSource: () => tsrElevationSource
                                    }
                                }
                            },
                            getters: {
                                activeRoutingToolOption: () => activeRoutingToolOption,
                                directionsSettings: () => {
                                    return {
                                        styleElevationProfile: {
                                            profileColor: "#fe2c00",
                                            profileFillColor: "#fccac0",
                                            elevationPointLineColor: [0, 0, 0, 1.0],
                                            elevationPointFillColor: [125, 125, 125, 1.0]
                                        }
                                    };
                                },
                                tsrSettings: () => {
                                    return {
                                        styleElevationProfile: {
                                            profileColor: "#32a9e8",
                                            profileFillColor: "#8cc7e6",
                                            elevationPointLineColor: [0, 0, 0, 1.0],
                                            elevationPointFillColor: [125, 125, 125, 1.0]
                                        }
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
        sinon.restore();
    });

    it("should render the component", () => {
        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.findComponent(RoutingElevationProfileData).exists()).to.be.true;
    });

    it("computed directions should return routing directions", () => {
        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.directions).equals(routingDirections);
    });

    it("computed directions should return tsr directions", () => {
        activeRoutingToolOption = "TSR";
        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.directions).equals(tsrDirections);
    });

    it("computed layerSource should return directions layer source", () => {
        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.layerSource).equals(directionsElevationSource);
    });

    it("computed layerSource should return tsr layer source", () => {
        activeRoutingToolOption = "TSR";
        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.layerSource).equals(tsrElevationSource);
    });

    it("should extract directions data correctly", () => {
        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(wrapper.vm.distances).deep.to.equal([0, 10, 17]);
        expect(wrapper.vm.elevations).deep.to.equal([150, 185, 204]);
        expect(wrapper.vm.ascent).equals("100");
        expect(wrapper.vm.descent).equals("250");
    });

    it("should extract tsr data correctly", () => {
        activeRoutingToolOption = "TSR";
        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(wrapper.vm.distances).deep.to.equal([0, 85, 120]);
        expect(wrapper.vm.elevations).deep.to.equal([200, 350, 305]);
        expect(wrapper.vm.ascent).equals("75");
        expect(wrapper.vm.descent).equals("50");
    });

    it("should call draw chart (DIRECTIONS)", () => {
        const drawChart = sinon.spy(RoutingElevationProfileData.methods, "drawChart");

        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(drawChart.calledOnce).to.be.true;
        expect(wrapper.vm.chart.data.labels).to.deep.equal([0, 10, 17]);
        expect(wrapper.vm.chart.data.datasets).to.deep.equal([
            {
                data: [150, 185, 204],
                borderWidth: 2,
                borderColor: "#fe2c00",
                backgroundColor: "#fccac0",
                pointStyle: false,
                fill: true,
                cubicInterpolationMode: "monotone"
            }
        ]);
    });

    it("should call draw chart (TSR)", () => {
        activeRoutingToolOption = "TSR";
        const drawChart = sinon.spy(RoutingElevationProfileData.methods, "drawChart");

        wrapper = mount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(drawChart.calledOnce).to.be.true;
        expect(wrapper.vm.chart.data.labels).to.deep.equal([0, 85, 120]);
        expect(wrapper.vm.chart.data.datasets).to.deep.equal([
            {
                data: [200, 350, 305],
                borderWidth: 2,
                borderColor: "#32a9e8",
                backgroundColor: "#8cc7e6",
                pointStyle: false,
                fill: true,
                cubicInterpolationMode: "monotone"
            }
        ]);
    });
});
