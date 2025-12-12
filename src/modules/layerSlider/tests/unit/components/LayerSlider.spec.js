import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import LayerSliderComponent from "@modules/layerSlider/components/LayerSlider.vue";
import LayerSlider from "@modules/layerSlider/store/indexLayerSlider.js";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";

config.global.mocks.$t = key => key;

describe("src/modules/layerSlider/components/LayerSlider.vue", () => {
    const layerSliderPlayerComponentMock = {
            template: "<span />"
        },
        layerSliderHandleComponentMock = {
            template: "<span />"
        };
    let store,
        wrapper;

    beforeEach(() => {
        LayerSlider.actions.checkIfAllLayersAvailable = sinon.stub().returns(true);
        LayerSlider.actions.addInformationToLayerIds = sinon.stub();
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LayerSlider
                    }
                }
            },
            actions: {
                replaceByIdInLayerConfig: sinon.stub()
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("renders the layerSlider", () => {
        wrapper = shallowMount(LayerSliderComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#module-layer-slider").exists()).to.be.true;
    });

    it("renders the layerSlider with LayerSliderPlayer and LayerSliderHandle", () => {
        wrapper = shallowMount(LayerSliderComponent, {
            global: {
                plugins: [store],
                components: {
                    "NavTab": NavTab
                }
            },
            components: {
                LayerSliderPlayer: layerSliderPlayerComponentMock,
                LayerSliderHandle: layerSliderHandleComponentMock
            }
        });

        expect(wrapper.findComponent(layerSliderPlayerComponentMock).exists()).to.be.true;
        expect(wrapper.findComponent(layerSliderHandleComponentMock).exists()).to.be.true;
    });

    it("should reset activeLayer from store and restore affected layers to pre-tool state in unmounted-hook", async () => {
        wrapper = shallowMount(LayerSliderComponent, {
            global: {
                plugins: [store]
            }
        });

        const sendModificationSpy = sinon.spy(wrapper.vm, "sendModification"),
            layerIds = [
                {
                    layerId: "123",
                    title: "Pommes",
                    index: 0,
                    visibility: false,
                    transparency: 0
                },
                {
                    layerId: "456",
                    title: "Ketchup",
                    index: 1,
                    visibility: true,
                    transparency: 1
                },
                {
                    layerId: "789",
                    title: "Mayonnaise",
                    index: 2,
                    visibility: false,
                    transparency: 2
                }
            ];

        store.commit("Modules/LayerSlider/setLayerIds", layerIds);

        wrapper.vm.$options.unmounted.call(wrapper.vm);
        await wrapper.vm.$nextTick();

        expect(store.state.Modules.LayerSlider.windowsInterval).to.equals(null);
        expect(sendModificationSpy.calledThrice).to.be.true;
        expect(sendModificationSpy.firstCall.args[0]).to.deep.equals(layerIds[0]);
        expect(sendModificationSpy.secondCall.args[0]).to.deep.equals(layerIds[1]);
        expect(sendModificationSpy.thirdCall.args[0]).to.deep.equals(layerIds[2]);
        expect(store.state.Modules.LayerSlider.activeLayer).to.deep.equals({
            layerId: "",
            index: -1
        });
    });
});
