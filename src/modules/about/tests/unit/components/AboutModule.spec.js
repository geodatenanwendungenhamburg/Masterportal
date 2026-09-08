import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import AboutComponent from "@modules/about/components/AboutModule.vue";
import {useAboutStore} from "@modules/about/store/aboutStore.js";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";
import sinon from "sinon";

describe("src/modules/about/components/AboutModule.vue", () => {
    let store,
        pinia,
        aboutStore,
        menuStore,
        contact;

    beforeEach(() => {
        contact = null;

        pinia = createPinia();
        setActivePinia(pinia);

        aboutStore = useAboutStore();
        menuStore = useMenuStore();
        menuStore.mainMenu.sections = [[{type: "contact"}, {type: "about"}]];
        menuStore.secondaryMenu.sections = [[{type: "section1"}, {type: "section2"}]];

        aboutStore.$patch({
            abstractText: "Test",
            contact,
            logo: "../../src/assets/img/Logo_Masterportal.svg",
            logoLink: "",
            logoText: "Masterportallogo",
            metaUrl: "",
            noMetadataLoaded: "",
            showAdditionalMetaData: true,
            title: "Titel",
            version: "3.0.0",
            versionLink: "",
            ustId: "DE12345",
            privacyStatementText: "Privacy Statement",
            privacyStatementUrl: "https://privacyStatementUrl",
            accessibilityText: "Accessibility Statement",
            accessibilityUrl: "https://accessibilityStatementUrl"
        });
        aboutStore.initializeAboutInfo = sinon.stub();
        aboutStore.currentMasterportalVersionNumber = sinon.stub();

        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Menu: {
                    namespaced: true,
                    getters: {
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
            }
        });
    });

    it("should have an existing title", () => {
        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find(".subtitle")).to.exist;
    });
    it("should have an abstract", async () => {
        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find(".abstract")).to.exist;
    });
    it("should have a logo and version", async () => {
        const wrapper = shallowMount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("div.logoAndVersion").exists()).to.be.true;
        expect(wrapper.find("div.logoAndVersion > a.logo").exists()).to.be.true;
        expect(wrapper.find("div.logoAndVersion > a.logo > img").exists()).to.be.true;
        expect(wrapper.find("div.logoAndVersion > span.version").exists()).to.be.true;
        expect(wrapper.find("div.logoAndVersion > span.version > a").exists()).to.be.true;
        expect(wrapper.find("div.logoAndVersion > span.version > a").text()).to.equals("common:modules.about.version3.0.0");
    });
    it("should do not have a logo and version, if version and logo are false", async () => {
        aboutStore.logo = false;
        aboutStore.version = false;

        const wrapper = shallowMount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("div.logoAndVersion").exists()).to.be.false;
    });
    it("should have an ustId", async () => {
        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("div.ustIdWrapper").exists()).to.be.true;
        expect(wrapper.find(".ustId").exists()).to.be.true;
        expect(wrapper.find(".ustId").text()).to.equals("DE12345");
    });
    it("should have a title", async () => {
        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("h5").exists()).to.be.true;
        expect(wrapper.find("h5").text()).to.equals("Titel");
    });
    it("should have a privacy statement section", async () => {
        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("div.privacyStatementWrapper").exists()).to.be.true;
        expect(wrapper.find(".privacyStatementText").exists()).to.be.true;
        expect(wrapper.find(".privacyStatementText").text()).to.equals("Privacy Statement");
        expect(wrapper.find("button.privacyStatementButton").exists()).to.be.true;
    });
    it("should have an accessibilty statement section", async () => {
        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("div.accessibilityStatementWrapper").exists()).to.be.true;
        expect(wrapper.find(".accessibilityText").exists()).to.be.true;
        expect(wrapper.find(".accessibilityText").text()).to.equals("Accessibility Statement");
        expect(wrapper.find("button.accessibilityStatementButton").exists()).to.be.true;
    });
    it("should have a contact button", async () => {
        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("button.openContactButton").exists()).to.be.true;
        expect(wrapper.find("button.openContactButton").text()).to.equals("common:modules.about.contactButton");
    });


    it("should not show undefined for missing address information", async () => {
        contact = {
            "name": "Behörde ABC",
            "email": "test@gv.hamburg.de"
        };

        aboutStore.contact = contact;

        const wrapper = mount(AboutComponent, {
            global: {
                plugins: [store, pinia]
            }
        });

        expect(wrapper.find("#imprint").html()).to.not.contains("undefined");
    });
});
