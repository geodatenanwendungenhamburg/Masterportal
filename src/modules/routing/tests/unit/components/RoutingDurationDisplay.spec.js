import {createStore} from "vuex";
import {expect} from "chai";
import {config, shallowMount} from "@vue/test-utils";
import RoutingDurationDisplayComponent from "@modules/routing/components/RoutingDurationDisplay.vue";
import mutations from "@modules/routing/store/mutationsRouting.js";
import actions from "@modules/routing/store/actionsRouting.js";
import getters from "@modules/routing/store/gettersRouting.js";
import mutationsDirections from "@modules/routing/store/directions/mutationsDirections.js";
import actionsDirections from "@modules/routing/store/directions/actionsDirections.js";
import gettersDirections from "@modules/routing/store/directions/gettersDirections.js";
import stateDirections from "@modules/routing/store/directions/stateDirections.js";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/RoutingDurationDisplay.vue", () => {
    let store,
        wrapper,
        props;

    beforeEach(() => {
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
                                    state: stateDirections,
                                    mutations: mutationsDirections,
                                    actions: actionsDirections,
                                    getters: gettersDirections
                                }
                            },
                            mutations,
                            actions,
                            getters
                        }
                    }
                }
            }
        });

        props = {
            duration: 1
        };
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders RoutingDurationDisplayComponent", () => {
        wrapper = shallowMount(RoutingDurationDisplayComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.find("span").exists()).to.be.true;
    });

    it("renders duration < 60 as '1 min'", () => {
        props.duration = 1;
        wrapper = shallowMount(RoutingDurationDisplayComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.find("span").text()).equal("< 1 min");
    });

    it("renders duration < 3600 as minutes", () => {
        props.duration = 3599;
        wrapper = shallowMount(RoutingDurationDisplayComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.find("span").text()).equal("59 min");
    });

    it("renders duration >= 3600 as hours", () => {
        props.duration = 3600;
        wrapper = shallowMount(RoutingDurationDisplayComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.find("span").text()).equal("1 h");
    });

    it("renders duration >= 3600 as hours with remaining minutes", () => {
        props.duration = 3660;
        wrapper = shallowMount(RoutingDurationDisplayComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.find(".minutesminushours").text()).equal("1 min");
    });
});
