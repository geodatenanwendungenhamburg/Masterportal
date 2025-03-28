import {createStore} from "vuex";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import FullScreen from "../../../components/FullScreen.vue";

config.global.mocks.$t = key => key;

describe("src/modules/controls/fullScreen/components/FullScreen.vue", () => {
    let store,
        originalWindow,
        windowOpenSpy;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Controls: {
                    namespaced: true,
                    modules: {
                        FullScreen: {
                            namespaced: true,
                            getters: {
                                iconArrow: sinon.stub()
                            }
                        }
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        ShareView: {
                            namespaced: true,
                            getters: {
                                url: () => "shareViewURL"
                            }
                        }
                    }
                }
            }
        });
        originalWindow = global.window;

        windowOpenSpy = sinon.spy();
    });

    afterEach(() => {
        global.window = originalWindow;
    });


    it("renders the fullScreen button", () => {
        const wrapper = mount(FullScreen, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#full-screen-button").exists()).to.be.true;
        expect(wrapper.findAll("button")).to.have.length(1);
    });

    it("use shareView for fullscreen in frame", () => {
        global.window = {
            top: "https://outerpage/location",
            self: "https://masterportal/location",
            open: windowOpenSpy
        };

        const wrapper = mount(FullScreen, {
            global: {
                plugins: [store]
            }});

        wrapper.vm.toggleFullScreen();

        expect(windowOpenSpy.calledOnce).to.be.true;
        expect(windowOpenSpy.firstCall.args[0]).to.be.equals("shareViewURL");
        expect(windowOpenSpy.firstCall.args[1]).to.be.equals("_blank");
    });
});
