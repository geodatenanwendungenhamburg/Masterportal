import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import MenuContainerBodyRootItems from "@modules/menu/components/MenuContainerBodyRootItems.vue";
import MenuContainerBodyRootItemElement from "@modules/menu/components/MenuContainerBodyRootItemElement.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";
import {expect} from "chai";

describe("src/modules/menu/MenuContainerBodyRootItems.vue", () => {
    let store,
        pinia,
        menuStore,
        sections,
        pathMainMenu,
        pathSecondaryMenu,
        wrapper;

    beforeEach(() => {
        sections = [
            {icon: "bi-test", name: "sampleSectionOne"},
            {icon: "bi-test", name: "sampleSectionTwo", description: "descriptionTwo"},
            {icon: "bi-test", name: "sampleSectionThree", description: "descriptionthree"}
        ];
        pathMainMenu = ["mainMenu", "sections", 0];
        pathSecondaryMenu = ["secondaryMenu", "sections", 0];
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    state: () => ({
                        TestModule: {
                            icon: "bi-state",
                            name: "stateName",
                            description: "stateDescription"
                        }
                    })
                }
            }
        });
        pinia = createPinia();
        setActivePinia(pinia);
        menuStore = useMenuStore();
        menuStore.customMenuElementIcon = "bi-customMenuElementIcon";
        menuStore.mainMenu.sections = [sections];
        menuStore.secondaryMenu.sections = [sections];
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("renders the component as main menu", () => {
        wrapper = shallowMount(MenuContainerBodyRootItems, {
            global: {
                plugins: [store, pinia]
            },
            props: {idAppendix: "mainMenu", path: pathMainMenu}
        });

        expect(wrapper.find("#mp-menu-body-items-mainMenu").exists()).to.be.true;
    });

    it("contains a list element and a MenuContainerBodyRootItemElements in the main menu for each configured section item", () => {
        wrapper = shallowMount(MenuContainerBodyRootItems, {
            global: {
                plugins: [store, pinia]
            },
            props: {idAppendix: "mainMenu", path: pathMainMenu}
        });


        expect(wrapper.findAllComponents(MenuContainerBodyRootItemElement).length).to.be.equal(sections.length);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-mainMenu")[0].attributes("name")).to.be.equal(sections[0].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-mainMenu")[0].attributes("icon")).to.be.equal(sections[0].icon);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-mainMenu")[0].attributes("description")).to.be.equal("");
        expect(wrapper.findAll("#mp-menu-body-items-element-0-mainMenu")[0].attributes("path")).to.be.equal(pathMainMenu.join(",") + ",0");

        expect(wrapper.findAll("#mp-menu-body-items-element-1-mainMenu")[0].attributes("name")).to.be.equal(sections[1].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-1-mainMenu")[0].attributes("icon")).to.be.equal(sections[1].icon);
        expect(wrapper.findAll("#mp-menu-body-items-element-1-mainMenu")[0].attributes("description")).to.be.equal(sections[1].description);
        expect(wrapper.findAll("#mp-menu-body-items-element-1-mainMenu")[0].attributes("path")).to.be.equal(pathMainMenu.join(",") + ",1");

        expect(wrapper.findAll("#mp-menu-body-items-element-2-mainMenu")[0].attributes("name")).to.be.equal(sections[2].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-2-mainMenu")[0].attributes("icon")).to.be.equal(sections[2].icon);
        expect(wrapper.findAll("#mp-menu-body-items-element-2-mainMenu")[0].attributes("description")).to.be.equal(sections[2].description);
        expect(wrapper.findAll("#mp-menu-body-items-element-2-mainMenu")[0].attributes("path")).to.be.equal(pathMainMenu.join(",") + ",2");
    });

    it("renders the component as secondary menu", () => {
        wrapper = shallowMount(MenuContainerBodyRootItems, {
            global: {
                plugins: [store, pinia]
            },
            props: {idAppendix: "secondaryMenu", path: pathSecondaryMenu}
        });

        expect(wrapper.find("#mp-menu-body-items-secondaryMenu").exists()).to.be.true;
    });

    it("contains a list element and a MenuContainerBodyRootItemElements in the secondary menu for each configured section item", () => {
        wrapper = shallowMount(MenuContainerBodyRootItems, {
            global: {
                plugins: [store, pinia]
            },
            props: {idAppendix: "secondaryMenu", path: pathSecondaryMenu}
        });

        expect(wrapper.findAllComponents(MenuContainerBodyRootItemElement).length).to.be.equal(sections.length);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("name")).to.be.equal(sections[0].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("icon")).to.be.equal(sections[0].icon);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("description")).to.be.equal("");
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("path")).to.be.equal(pathSecondaryMenu.join(",") + ",0");

        expect(wrapper.findAll("#mp-menu-body-items-element-1-secondaryMenu")[0].attributes("name")).to.be.equal(sections[1].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-1-secondaryMenu")[0].attributes("icon")).to.be.equal(sections[1].icon);
        expect(wrapper.findAll("#mp-menu-body-items-element-1-secondaryMenu")[0].attributes("description")).to.be.equal(sections[1].description);
        expect(wrapper.findAll("#mp-menu-body-items-element-1-secondaryMenu")[0].attributes("path")).to.be.equal(pathSecondaryMenu.join(",") + ",1");

        expect(wrapper.findAll("#mp-menu-body-items-element-2-secondaryMenu")[0].attributes("name")).to.be.equal(sections[2].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-2-secondaryMenu")[0].attributes("icon")).to.be.equal(sections[2].icon);
        expect(wrapper.findAll("#mp-menu-body-items-element-2-secondaryMenu")[0].attributes("description")).to.be.equal(sections[2].description);
        expect(wrapper.findAll("#mp-menu-body-items-element-2-secondaryMenu")[0].attributes("path")).to.be.equal(pathSecondaryMenu.join(",") + ",2");
    });

    it("section contains 'customMenuElement' without icon uses default icon from state", () => {
        sections = [{
            type: "customMenuElement",
            name: "Url öffnen",
            openURL: "https://geoinfo.hamburg.de/"
        }];
        menuStore.secondaryMenu.sections = [sections];
        wrapper = shallowMount(MenuContainerBodyRootItems, {
            global: {
                plugins: [store, pinia]
            },
            props: {idAppendix: "secondaryMenu", path: pathSecondaryMenu}
        });

        expect(wrapper.findAllComponents(MenuContainerBodyRootItemElement).length).to.be.equal(sections.length);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("name")).to.be.equal(sections[0].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("icon")).to.be.equal("bi-customMenuElementIcon");
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("description")).to.be.equal("");
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("path")).to.be.equal(pathSecondaryMenu.join(",") + ",0");
    });

    it("section contains 'customMenuElement' with icon", () => {
        sections = [{
            type: "customMenuElement",
            name: "Url öffnen",
            openURL: "https://geoinfo.hamburg.de/",
            icon: "bi-custom-icon"
        }];
        menuStore.secondaryMenu.sections = [sections];
        wrapper = shallowMount(MenuContainerBodyRootItems, {
            global: {plugins: [store, pinia]},
            props: {idAppendix: "secondaryMenu", path: pathSecondaryMenu}
        });

        expect(sections[0].icon).not.to.be.equals("bi-customMenuElementIcon");
        expect(wrapper.findAllComponents(MenuContainerBodyRootItemElement).length).to.be.equal(sections.length);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("name")).to.be.equal(sections[0].name);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("icon")).to.be.equal(sections[0].icon);
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("description")).to.be.equal("");
        expect(wrapper.findAll("#mp-menu-body-items-element-0-secondaryMenu")[0].attributes("path")).to.be.equal(pathSecondaryMenu.join(",") + ",0");
    });

    it("chooseProperties falls back to the module state's name when the item does not configure its own", () => {
        wrapper = shallowMount(MenuContainerBodyRootItems, {
            global: {
                plugins: [store, pinia]
            },
            props: {idAppendix: "mainMenu", path: pathMainMenu}
        });

        const properties = wrapper.vm.chooseProperties({type: "testModule"});

        expect(properties.name).to.equal("stateName");
    });
});
