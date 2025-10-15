import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import CompareMaps from "@modules/compareMaps/components/CompareMaps.vue";
import {expect} from "chai";
import sinon from "sinon";
import mapCollection from "@core/maps/js/mapCollection";
import mutations from "@modules/compareMaps/store/mutationsCompareMaps";

config.global.mocks.$t = key => key;

describe("src/modules/compareMaps/components/CompareMaps.vue", () => {
    let store, rootCommitSpy, rootDispatchSpy, wrapper, map;

    beforeEach(() => {
        map = {
            id: "ol",
            mode: "2D",
            removeLayer: sinon.spy(),
            on: sinon.stub(),
            once: sinon.stub()
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");
        rootCommitSpy = sinon.spy();
        rootDispatchSpy = sinon.spy();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        CompareMaps: {
                            namespaced: true,
                            mutations: {
                                ...mutations
                            },
                            actions: {
                                activateSwiper: sinon.stub(),
                                deactivateSwiper: sinon.stub()
                            },
                            getters: {
                                layerNames: () => [{name: "Layer 1", id: "layer1"}, {name: "Layer 2", id: "layer2"}],
                                initialBaseLayer: () => ({name: "Base Layer", id: "baseLayer"}),
                                selectedLayer1Id: () => "layer1",
                                selectedLayer2Id: () => "layer2"
                            }
                        },
                        LayerSwiper: {
                            namespaced: true,
                            actions: {
                                updateMap: sinon.spy()
                            },
                            mutations: {
                                setActive: sinon.spy(),
                                setSourceLayerId: sinon.spy(),
                                setTargetLayerId: sinon.spy(),
                                setSplitDirection: sinon.spy(),
                                setLayerSwiperValueY: sinon.spy(),
                                setLayerSwiperValueX: sinon.spy()
                            }
                        },
                        LayerSelection: {
                            namespaced: true,
                            actions: {
                                changeVisibility: sinon.spy()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: () => "2D"
                    }
                }
            },
            getters: {
                visibleLayerConfigs: () => [
                    {id: "layer1", name: "Layer 1", typ: "WMS", visibility: true},
                    {id: "layer2", name: "Layer 2", typ: "WFS", visibility: true}
                ]
            }
        });

        store.commit = rootCommitSpy;
        store.dispatch = rootDispatchSpy;
    });

    afterEach(() => {
        mapCollection.clear();
        sinon.restore();
    });

    it("renders the CompareMaps component", () => {
        wrapper = shallowMount(CompareMaps, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#compare-maps").exists()).to.be.true;
    });

    it("sets tool active", async () => {
        wrapper = shallowMount(CompareMaps, {
            global: {
                plugins: [store]
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.splitDirection).to.equal("vertical");
    });

    it("resets the layer selection", async () => {
        wrapper = shallowMount(CompareMaps, {
            global: {
                plugins: [store]
            }
        });

        await wrapper.vm.resetSelection();

        expect(wrapper.vm.selectedLayer1).to.be.null;
        expect(wrapper.vm.selectedLayer2).to.be.null;

        expect(rootDispatchSpy.calledWith("Modules/CompareMaps/deactivateSwiper")).to.be.true;
        expect(rootCommitSpy.calledWith("Modules/CompareMaps/setSelectedLayer1Id", "", undefined)).to.be.true;
        expect(rootCommitSpy.calledWith("Modules/CompareMaps/setSelectedLayer2Id", "", undefined)).to.be.true;
    });

    it("render labels for vertical split", async () => {
        wrapper = shallowMount(CompareMaps, {
            global: {
                plugins: [store]
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.find("#module-compareMaps-select-layer1").element.labels[0].textContent).to.equal("common:modules.compareMaps.leftLayer");
        expect(wrapper.find("#module-compareMaps-select-layer2").element.labels[0].textContent).to.equal("common:modules.compareMaps.rightLayer");
    });

    it("render labels for horizontal split", async () => {
        wrapper = shallowMount(CompareMaps, {
            global: {
                plugins: [store]
            }
        });

        wrapper.vm.splitDirection = "horizontal";
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#module-compareMaps-select-layer1").element.labels[0].textContent).to.equal("common:modules.compareMaps.upperLayer");
        expect(wrapper.find("#module-compareMaps-select-layer2").element.labels[0].textContent).to.equal("common:modules.compareMaps.lowerLayer");
    });
});
