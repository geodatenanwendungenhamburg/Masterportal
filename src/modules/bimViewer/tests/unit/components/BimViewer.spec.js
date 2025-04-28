import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import BimViewer from "../../../components/BimViewer.vue";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/BimViewer.spec.js", () => {
    let
        store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            getters: {
                                name: sinon.stub()
                            },
                            mutations: {
                                applyTranslationKey: sinon.stub()
                            },
                            actions: {
                                loadSceneConfigs: sinon.stub(),
                                setScene: sinon.stub()
                            },
                            state: {}
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders the base component", async () => {
        wrapper = shallowMount(BimViewer, {
            global: {
                plugins: [store]
            }
        });

        const setSceneStub = sinon.stub();

        wrapper.vm.setScene = setSceneStub;

        await wrapper.vm.setScene(0);

        expect(setSceneStub.calledOnceWith(0)).to.be.true;

        expect(wrapper.find("#bim-viewer").exists()).to.be.true;
    });
});
