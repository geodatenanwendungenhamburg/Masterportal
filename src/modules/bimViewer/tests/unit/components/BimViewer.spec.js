import {expect} from "chai";
import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import sinon from "sinon";
import BimViewer from "../../../components/BimViewer.vue";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/BimViewer.spec.js", () => {

    let wrapper, store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            getters: {
                                name: sinon.stub(),
                                useTools: () => true,
                                toggleRightSidebar: () => false,
                                currentlyLoadedModels: () => [],
                                totalNumberOfModels: () => 0
                            },
                            mutations: {
                                applyTranslationKey: sinon.stub(),
                                setBimViewerFullyLoaded: sinon.stub()
                            },
                            actions: {
                                loadSceneConfigs: sinon.stub(),
                                setScene: sinon.stub(),
                                initializeBimViewer: sinon.stub()
                            },
                            state: {}
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(BimViewer, {
            global: {
                plugins: [store]
            }
        });

        sinon.stub(wrapper.vm, "setScene");
    });

    afterEach(() => {
        sinon.restore();
        wrapper.unmount();
    });

    it("renders the base component", async () => {
        const setSceneStub = sinon.stub();

        wrapper.vm.setScene = setSceneStub;
        await wrapper.vm.setScene(0);

        expect(setSceneStub.calledOnceWith(0)).to.be.true;

        expect(wrapper.find("#bim-viewer").exists()).to.be.true;
    });

    it("sets the overflow-y style of #mp-menu-mainMenu based on the argument", () => {
        const domElement = document.createElement("div");

        domElement.id = "mp-menu-mainMenu";
        document.body.appendChild(domElement);
        wrapper.vm.setMasterportalMainMenuOverflowHidden(true);

        expect(domElement.style["overflow-y"]).to.equal("hidden");

        wrapper.vm.setMasterportalMainMenuOverflowHidden(false);

        expect(domElement.style["overflow-y"]).to.equal("scroll");

        document.body.removeChild(domElement);
    });

    it("calls setSidebarLeftVisibility and updates state", () => {
        wrapper.vm.setSidebarLeftVisibility(true);

        expect(wrapper.vm.sidebarLeftOpen).to.be.true;
    });

    it("should set max-width and max-height styles if the last canvas has no class name", () => {
        const canvas1 = document.createElement("canvas"),
            canvas2 = document.createElement("canvas");

        document.body.appendChild(canvas1);
        document.body.appendChild(canvas2);
        canvas2.className = "";

        wrapper.vm.setCanvasStyleToPreventOverflow();

        expect(canvas2.style.getPropertyValue("max-width")).to.equal("100vw");

        expect(canvas2.style.getPropertyPriority("max-width")).to.equal("important");

        expect(canvas2.style.getPropertyValue("max-height")).to.equal("100vh");

        expect(canvas2.style.getPropertyPriority("max-height")).to.equal("important");

        expect(canvas1.style.getPropertyValue("max-width")).to.equal("");
    });

    it("should NOT set styles if the last canvas has a class name", () => {
        const canvas2 = document.createElement("canvas");

        canvas2.className = "some-class";
        wrapper.vm.setCanvasStyleToPreventOverflow();

        expect(canvas2.style.getPropertyValue("max-width")).to.equal("");

        expect(canvas2.style.getPropertyValue("max-height")).to.equal("");
    });
});
