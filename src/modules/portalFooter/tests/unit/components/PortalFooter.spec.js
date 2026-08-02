import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import PortalFooterComponent from "@modules/portalFooter/components/PortalFooter.vue";
import {expect} from "chai";
import sinon from "sinon";


describe("src/modules/portalFooter/components/PortalFooter.vue", () => {
    let isMobile,
        uiStyle,
        store,
        hideImprint,
        urls;

    beforeEach(() => {
        urls = [{
            bezeichnung: "abc",
            url: "https://abc.de",
            alias: "Alphabet",
            alias_mobile: "ABC"
        }];
        isMobile = false;
        uiStyle = "default";
        hideImprint = false;
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        PortalFooter: {
                            namespaced: true,
                            getters: {
                                scaleLine: () => true,
                                seperator: () => true,
                                urls: () => urls,
                                type: () => sinon.stub(),
                                configPaths: () => sinon.stub()
                            }
                        },
                        About: {
                            namespaced: true,
                            getters: {
                                hideImprintInFooter: () => hideImprint
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        mainExpanded: () => true,
                        secondaryExpanded: () => true,
                        mainMenu: () => {
                            return {
                                sections: [
                                    [
                                        {
                                            type: "contact"
                                        },
                                        {
                                            type: "about"
                                        }
                                    ]
                                ]
                            };
                        },
                        secondaryMenu: () => {
                            return {
                                sections: [
                                    [
                                        {
                                            type: "section1"
                                        },
                                        {
                                            type: "section2"
                                        }
                                    ]
                                ]
                            };
                        }
                    }
                }
            },
            getters: {
                isMobile: () => isMobile,
                uiStyle: () => uiStyle
            },
            actions: {
                initializeModule: sinon.stub()
            }
        });
    });


    it("renders the footer", () => {
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".imprintLink").exists()).to.be.true;
    });

    it("renders the urls in footer", () => {
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("a.footerUrl").exists()).to.be.true;
        expect(wrapper.find("a.footerUrl").text()).to.equals("Alphabet");
        expect(wrapper.find("a.footerUrl").attributes().href).to.equals("https://abc.de");
    });

    it("renders the mobile urls in footer", () => {
        isMobile = true;

        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("a.footerUrl").exists()).to.be.true;
        expect(wrapper.find("a.footerUrl").text()).to.equals("ABC");
        expect(wrapper.find("a.footerUrl").attributes().href).to.equals("https://abc.de");
    });

    it("doesn’t render the mobile urls, if alias_mobile is not set", () => {
        isMobile = true;
        urls[0].alias_mobile = undefined;

        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("a.footerUrl").exists()).to.be.false;
    });

    it("renders scaleLine exist", () => {
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("scale-line-stub").exists()).to.be.true;
    });

    it("renders imprint link", () => {
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".imprintLink").exists()).to.be.true;
    });

    it("does not render imprint link if hideImprintInFooter is true", () => {
        hideImprint = true;
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {plugins: [store]}
        });

        expect(wrapper.find(".imprintLink").exists()).to.be.false;
    });
});
