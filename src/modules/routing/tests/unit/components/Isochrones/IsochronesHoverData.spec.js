import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import IsochronesHoverDataComponent from "@modules/routing/components/Isochrones/IsochronesHoverData.vue";
import VectorLayer from "ol/layer/Vector.js";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/Isochrones/IsochronesHoverData.vue", () => {
    let isochronesAreaLayer,
        store,
        wrapper;

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
                addEventListener: () => sinon.stub(),
                removeEventListener: () => sinon.stub()
            }),
            getOverlayById: () => {
                return {};
            }
        }, "2D");

        isochronesAreaLayer = new VectorLayer();

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
                                isochronesSettings: () => {
                                    return {
                                        attributes: ["area", "total_pop"],
                                        areaUnit: "km"
                                    };
                                }
                            },
                            modules: {
                                Isochrones: {
                                    namespaced: true,
                                    getters: {
                                        isochronesAreaLayer: () => {
                                            return isochronesAreaLayer;
                                        }
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
        sinon.restore();
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders hover menu", async () => {
        wrapper = shallowMount(IsochronesHoverDataComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(IsochronesHoverDataComponent).exists()).to.be.true;
        expect(wrapper.find("#routing-hover-menu").exists()).to.be.true;
    });

});
