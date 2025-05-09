import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import LeftSidebar from "../../../../components/sidebar/LeftSidebar.vue";
import {expect} from "chai";
import {nextTick} from "vue";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/components/sidebar/LeftSidebar.vue", () => {
    let store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            getters: {
                                loadedModels: () => []
                            },
                            state: {}
                        }
                    }
                }
            }
        });
    });

    it("renders the base component", () => {
        const wrapper = shallowMount(LeftSidebar, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("div.LeftSidebar").exists()).to.be.true;
    });

    it("renders four tabs and ensures the first tab is active", async () => {
        const
            wrapper = shallowMount(LeftSidebar, {
                global: {
                    plugins: [store]
                }
            }),
            tabs = wrapper.findAll("nav-tab-stub");

        expect(tabs.length).to.equal(4);

        // Check tab ids

        expect(tabs[0].attributes("id")).to.equal("tab-models");
        expect(tabs[1].attributes("id")).to.equal("tab-containment");
        expect(tabs[2].attributes("id")).to.equal("tab-storeys");
        expect(tabs[3].attributes("id")).to.equal("tab-types");

        // Check tab status and selected content area, if tab is changed

        wrapper.vm.activeTab = "models";

        await nextTick();

        expect(wrapper.find("div#tab-content-models").exists()).to.be.true;
        expect(tabs[0].attributes("active")).to.equal("true");
        expect(tabs[1].attributes("active")).to.equal("false");
        expect(tabs[2].attributes("active")).to.equal("false");
        expect(tabs[3].attributes("active")).to.equal("false");

        wrapper.vm.activeTab = "containment";

        await nextTick();

        expect(wrapper.find("div#tab-content-containment").exists()).to.be.true;
        expect(tabs[0].attributes("active")).to.equal("false");
        expect(tabs[1].attributes("active")).to.equal("true");
        expect(tabs[2].attributes("active")).to.equal("false");
        expect(tabs[3].attributes("active")).to.equal("false");

        wrapper.vm.activeTab = "storeys";

        await nextTick();

        expect(wrapper.find("div#tab-content-storeys").exists()).to.be.true;
        expect(tabs[0].attributes("active")).to.equal("false");
        expect(tabs[1].attributes("active")).to.equal("false");
        expect(tabs[2].attributes("active")).to.equal("true");
        expect(tabs[3].attributes("active")).to.equal("false");

        wrapper.vm.activeTab = "types";

        await nextTick();

        expect(wrapper.find("div#tab-content-types").exists()).to.be.true;
        expect(tabs[0].attributes("active")).to.equal("false");
        expect(tabs[1].attributes("active")).to.equal("false");
        expect(tabs[2].attributes("active")).to.equal("false");
        expect(tabs[3].attributes("active")).to.equal("true");
    });
});
