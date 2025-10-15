/**
 * Menu state definition.
 * @typedef {Object} MenuState
 * @property {String} currentMouseMapInteractionsComponent Component that has mouse map actions and is currently activated.
 * @property {String} defaultComponent Default Component that has mouse map actions and is currently activated.
 * @property {String} customMenuElementIcon the Icon used for custom menu elements.
 * @property {Number} currentSecondaryMenuWidth up-to-date width of the secondary menu during runtime.
 * @property {Number} currentMainMenuWidth up-to-date width of the main menu during runtime.
 * @property {Object} mainMenu the main menu settings.
 * @property {String[]} mainMenu.configPaths Path array of possible config locations. First one found will be used.
 * @property {Boolean} mainMenu.expanded Specifies whether the main menu is opened.
 * @property {Object[]} mainMenu.sections The main menu sections.
 * @property {Boolean} mainMenu.showDescription If true, description will be shown in the mainMenu.
 * @property {Object} mainMenu.title The main menu title.
 * @property {String} mainMenu.toggleButtonIcon The main menu toggle button icon.
 * @property {String} mainMenu.currentComponent The current Component shown in mainMenu Body Section.
 * @property {Object} secondaryMenu the secondary menu settings.
 * @property {String[]} secondaryMenu.configPaths Path array of possible config locations. First one found will be used.
 * @property {Boolean} secondaryMenu.expanded Specifies whether the secondary menu is opened.
 * @property {Object[]} secondaryMenu.sections The secondary menu sections.
 * @property {Boolean} secondaryMenu.showDescription If true, description will be shown in the secondaryMenu.
 * @property {Object} secondaryMenu.title The secondary menu title.
 * @property {String} secondaryMenu.toggleButtonIcon The secondary menu toggle button icon.
 * @property {String} secondaryMenu.currentComponent The current Component shown in secondaryMenu Body Section.
 */
export default {
    currentMouseMapInteractionsComponent: "getFeatureInfo",
    defaultComponent: "getFeatureInfo",
    customMenuElementIcon: "bi-asterisk",
    currentSecondaryMenuWidth: 0,
    currentMainMenuWidth: 0,
    mainMenu: {
        configPaths: ["portalConfig.mainMenu.sections"],
        expanded: false,
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
};
