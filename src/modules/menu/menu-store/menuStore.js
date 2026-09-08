import {defineStore} from "pinia";
import gettersMenu from "./gettersMenu.js";
import actionsMenu from "./actionsMenu.js";

export const useMenuStore = defineStore("menu", {
    state: () => ({
        currentMouseMapInteractionsComponent: "getFeatureInfo",
        defaultComponent: "getFeatureInfo",
        customMenuElementIcon: "bi-asterisk",
        currentSecondaryMenuWidth: 0,
        currentSecondaryMenuOffsetWidth: 0,
        currentMainMenuWidth: 0,
        currentMainMenuOffsetWidth: 0,
        mainMenu: {
            configPaths: ["portalConfig.mainMenu.sections"],
            expanded: false,
            expandedTop: "0%",
            width: "25%",
            currentComponent: "root",
            title: null,
            toggleButtonIcon: "bi-list",
            sections: [[]],
            showDescription: false,
            showHeaderIcon: false,
            navigation: {
                currentComponent: {
                    type: "root",
                    props: []
                },
                history: []
            }
        },
        secondaryMenu: {
            configPaths: ["portalConfig.secondaryMenu.sections"],
            expanded: false,
            expandedTop: "70%",
            width: "25%",
            currentComponent: "root",
            sections: [[]],
            showDescription: true,
            title: null,
            toggleButtonIcon: "bi-tools",
            showHeaderIcon: false,
            navigation: {
                currentComponent: {
                    type: "root",
                    props: []
                },
                history: []
            }
        }
    }),
    getters: {
        ...gettersMenu
    },

    actions: {
        ...actionsMenu
    }
});
