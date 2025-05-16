import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolArea from "../../../../components/tools/ToolArea.vue";
import IconButton from "../../../../../../shared/modules/buttons/components/IconButton.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolArea.vue", () => {
    let store, wrapper, mutations;

    beforeEach(() => {
        mutations = {
            setToggleRightSidebar: (state, value) => {
                state.toggleRightSidebar = value;
            }
        };

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            getters: {
                                toggleRightSidebar: state => state.toggleRightSidebar ?? false
                            },
                            mutations,
                            actions: {},
                            state: {
                                toggleRightSidebar: false
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ToolArea, {
            global: {
                plugins: [store],
                stubs: {
                    IconButton: IconButton
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        wrapper.unmount();
    });

    it("renders the base component", () => {
        expect(wrapper.find("div.ToolArea").exists()).to.be.true;
    });

    it("emits 'sceneSelected' event when onSceneSelected is called", () => {
        wrapper.vm.onSceneSelected(1);

        expect(wrapper.emitted().sceneSelected).to.exist;
        expect(wrapper.emitted().sceneSelected[0]).to.deep.equal([1]);
    });

    it("toggles sidebarLeftOpen and emits 'toggleSidebarLeft' event when toggleSidebarLeft is called", () => {
        wrapper.vm.toggleSidebarLeft();

        expect(wrapper.vm.sidebarLeftOpen).to.be.true;
        expect(wrapper.emitted().toggleSidebarLeft).to.exist;
        expect(wrapper.emitted().toggleSidebarLeft[0]).to.deep.equal([true]);

        wrapper.vm.toggleSidebarLeft();

        expect(wrapper.vm.sidebarLeftOpen).to.be.false;
        expect(wrapper.emitted().toggleSidebarLeft[1]).to.deep.equal([false]);
    });

    it("toggles sidebarRightOpen and emits 'toggleSidebarRight' event when toggleSidebarRight is called", () => {
        wrapper.vm.toggleSidebarRight();

        expect(store.state.Modules.BimViewer.toggleRightSidebar).to.be.true;
        expect(wrapper.emitted().toggleSidebarRight).to.exist;
        expect(wrapper.emitted().toggleSidebarRight[0]).to.deep.equal([true]);

        wrapper.vm.toggleSidebarRight();

        expect(store.state.Modules.BimViewer.toggleRightSidebar).to.be.false;
        expect(wrapper.emitted().toggleSidebarRight[1]).to.deep.equal([false]);
    });

    it("renders all child components", () => {
        expect(wrapper.findComponent({name: "ToolSceneSelector"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "ToolSceneFit"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "ToolCameraReset"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "ToolUpload"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "ToolObjectInfo"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "ToolSao"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "ToolMeasurements"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "ToolFilter"}).exists()).to.be.true;
    });
});
