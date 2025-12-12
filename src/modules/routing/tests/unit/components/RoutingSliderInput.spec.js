import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import RoutingSliderInputComponent from "@modules/routing/components/RoutingSliderInput.vue";
import mutations from "@modules/routing/store/mutationsRouting.js";
import actions from "@modules/routing/store/actionsRouting.js";
import getters from "@modules/routing/store/gettersRouting.js";
import state from "@modules/routing/store/stateRouting.js";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/RoutingSliderInput.vue", () => {
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
                            },
                            state: {...state},
                            mutations,
                            actions,
                            getters
                        }
                    },
                    Alerting: {
                        namespaced: true,
                        actions: {
                            addSingleAlert: sinon.stub()
                        }
                    }
                }
            }
        });

        props = {
            label: "test",
            value: 3,
            min: 1,
            max: 5,
            step: 1,
            unit: "min",
            disabled: false
        };
    });

    afterEach(() => {
        sinon.restore();
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders RoutingSliderInputComponent", () => {
        wrapper = shallowMount(RoutingSliderInputComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.find("#routing-slider-input-test").exists()).to.be.true;
    });
});
