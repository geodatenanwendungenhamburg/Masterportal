import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import MenuFolder from "@modules/menu/components/MenuFolder.vue";
import MenuContainerBodyRootItems from "@modules/menu/components/MenuContainerBodyRootItems.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";
import {expect} from "chai";


describe("src/modules/menu/MenuFolder.vue", () => {
    let pinia,
        menuStore,
        wrapper,
        currentFolderPath,
        side;

    beforeEach(() => {
        side = "mainMenu";
        currentFolderPath = [side, "sections", 0, 13];
        pinia = createPinia();
        setActivePinia(pinia);
        menuStore = useMenuStore();
        menuStore.mainMenu.navigation.currentComponent = {
            type: "folder",
            props: {
                name: "currentComponentName",
                path: currentFolderPath
            }
        };
        menuStore.secondaryMenu.navigation.currentComponent = {
            type: "folder",
            props: {
                name: "currentComponentName",
                path: currentFolderPath
            }
        };
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("renders MenuContainerBodyRootItems in mainMenu", () => {
        wrapper = shallowMount(MenuFolder, {global: {
            plugins: [pinia]
        }, props: {side}
        });

        expect(wrapper.findComponent(MenuContainerBodyRootItems).exists()).to.be.true;
        expect(wrapper.find("menu-container-body-root-items-stub").attributes("idappendix")).to.be.equals("mainMenu");
        expect(wrapper.find("menu-container-body-root-items-stub").attributes("path")).to.be.equals(currentFolderPath.join(",") + ",elements");
    });

    it("renders MenuContainerBodyRootItems in secondaryMenu", () => {
        side = "secondaryMenu";
        currentFolderPath = [side, "sections", 0, 13];

        menuStore.secondaryMenu.navigation.currentComponent.props.path =
            currentFolderPath;

        wrapper = shallowMount(MenuFolder, {
            global: {
                plugins: [pinia]
            }, props: {side}
        });

        expect(wrapper.findComponent(MenuContainerBodyRootItems).exists()).to.be.true;
        expect(wrapper.find("menu-container-body-root-items-stub").attributes("idappendix")).to.be.equals("secondaryMenu");
        expect(wrapper.find("menu-container-body-root-items-stub").attributes("path")).to.be.equals(currentFolderPath.join(",") + ",elements");
    });
});
