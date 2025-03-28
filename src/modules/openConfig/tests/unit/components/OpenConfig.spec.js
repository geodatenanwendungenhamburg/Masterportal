import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import OpenConfigComponent from "../../../components/OpenConfig.vue";
import FileUpload from "../../../../../shared/modules/inputs/components/FileUpload.vue";

config.global.mocks.$t = key => key;

describe("src/modules/openConfig/components/OpenConfig.vue", () => {
    let store,
        warn,
        wrapper;

    beforeEach(() => {
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        OpenConfig: {
                            namespaced: true,
                            getters: {
                                icon: () => sinon.stub()
                            }
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.stub()
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders the openConfig", () => {
        wrapper = shallowMount(OpenConfigComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#open-config").exists()).to.be.true;
        expect(wrapper.find("p").exists()).to.be.true;
        expect(wrapper.find("#open-config-input-button").exists()).to.be.true;
        expect(wrapper.findComponent(FileUpload).exists()).to.be.true;
    });
});
