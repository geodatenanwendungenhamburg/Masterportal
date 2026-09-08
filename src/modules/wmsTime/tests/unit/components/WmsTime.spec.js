import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import WmsTimeComponent from "@modules/wmsTime/components/WmsTime.vue";
import LayerSwiper from "@shared/modules/layerSwiper/components/LayerSwiper.vue";
import TimeSlider from "@modules/wmsTime/components/TimeSlider.vue";
import sinon from "sinon";
import {createPinia, setActivePinia} from "pinia";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

describe("src/modules/wmsTime/components/WmsTime.vue", () => {
    let store,
        pinia,
        timeSliderActive,
        winWidth,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        WmsTime: {
                            namespaced: true,
                            getters: {
                                timeRange: () => sinon.spy(),
                                minWidth: () => {
                                    return winWidth > 800;
                                },
                                timeSlider: () => {
                                    return {
                                        active: timeSliderActive,
                                        currentLayerId: "",
                                        objects: [],
                                        playbackDelay: 1,
                                        playing: false
                                    };
                                },
                                currentTimeSliderObject: () => {
                                    return {
                                        layerId: "sesamLayer"
                                    };
                                },
                                layerAppendix: () => {
                                    return "_oskarTonne";
                                }
                            },
                            actions: {
                                updateMap: sinon.spy(),
                                toggleSwiper: sinon.spy()
                            },
                            mutations: {
                                setWindowWidth: (number) => {
                                    winWidth = number;
                                },
                                setTimeSliderActive: (active) => {
                                    timeSliderActive = active;
                                },
                                setTimeSliderPlaying: sinon.stub()
                            }
                        },
                        LayerSwiper: {
                            namespaced: true,
                            state: {
                                active: false
                            },
                            getters: {
                                active: state => state.active
                            },
                            mutations: {
                                setActive: (state, active) => {
                                    state.active = active;
                                }
                            }
                        }
                    }
                }
            }
        });
        timeSliderActive = false;
        winWidth = 801;
        pinia = createPinia();
        setActivePinia(pinia);
        useMenuStore();
    });

    afterEach(() => {
        winWidth = 1024;
        timeSliderActive = false;
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("render one TimeSlider component if it is active and the layerSwiper is inactive", () => {
        timeSliderActive = true;
        wrapper = shallowMount(WmsTimeComponent, {
            global: {
                plugins: [store, pinia]
            }});

        expect(wrapper.findAllComponents(TimeSlider).length).to.equal(1);
        expect(wrapper.findComponent(LayerSwiper).exists()).to.be.false;
    });
    it("render two TimeSlider component and a LayerSwiper component if the timeSlider is active, the layerSwiper is active and the window has a minWidth of 800px", () => {
        timeSliderActive = true;
        store.commit("Modules/LayerSwiper/setActive", true);

        wrapper = shallowMount(WmsTimeComponent, {
            global: {
                plugins: [store, pinia]
            }
        });
        const timeSliderComponents = wrapper.findAllComponents(TimeSlider);

        expect(timeSliderComponents.length).to.equal(2);
        expect(timeSliderComponents.at(0).element.className).to.include("moveLeft");
        expect(timeSliderComponents.at(1).element.className).to.include("moveRight");
        expect(wrapper.findComponent(LayerSwiper).exists()).to.be.true;
    });
    it("should only render one TimeSlider component and no LayerSwiper component if the window size is smaller than the minWidth of 800px", () => {
        timeSliderActive = true;
        winWidth = 799;
        wrapper = shallowMount(WmsTimeComponent, {
            global: {
                plugins: [store, pinia]
            }});

        expect(wrapper.findAllComponents(TimeSlider).length).to.equal(1);
        expect(wrapper.findComponent(LayerSwiper).exists()).to.be.false;
    });
});
