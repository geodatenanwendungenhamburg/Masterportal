import idxProvider from "@shared/js/utils/idx.js";
import changeCase from "@shared/js/utils/changeCase.js";
import store from "@appstore/index.js";

export default {
    /**
     * Returns the current component for a menu side.
     * @param {MenuNavigationState} state Local state.
     * @param {string} side Menu Side.
     * @returns {Object} The current component.
     */
    currentComponent: state => side => {
        return state[side].navigation.currentComponent;
    },

    /** cؤم
     * @param {MenuNavigationState} state Local state.
     * @param {string} side Menu Side.
     * @returns {Object} Returns the Name of the currently visible Component.
     */
    currentComponentName: state => side => {
        const currentComponent = state[side]?.navigation.currentComponent;
        let name = {};

        switch (currentComponent.type) {
            case "root":
                name = i18next.t("common:modules.menu.name");
                break;
            default:
                name = currentComponent.props !== undefined && currentComponent.props.name
                    ? i18next.t(currentComponent.props.name)
                    : currentComponent.type;
                break;
        }

        return name;
    },

    /**
     * @param {MenuNavigationState} state Local state.
     * @param {string} side Menu Side
     * @returns {Object} Returns the currently visible Component.
     */
    currentFolderPath: state => side => {
        return state[side].navigation.currentComponent.props.path;
    },

    /**
     * @param {MenuNavigationState} state Local state.
     * @param {string} side Menu Side
     * @returns {Object} Returns the current Menu-width
     */
    currentMenuWidth: state => side => {
        return state[side].width;
    },
    deactivateModule: state => type => {
        if (store.getters[`Modules/${changeCase.upperFirst(type)}/hasMouseMapInteractions`]
            && changeCase.upperFirst(type) !== state.activeModuleMouseMapInteractions
        ) {
            return true;
        }

        return false;
    },

    /**
     * @param {Object} state Local state.
     * @returns {boolean} Whether the menu by side is opened.
     */
    expanded: state => side => {
        return state[side].expanded;
    },

    /**
     * @param {Object} state Local state.
     * @returns {boolean} Whether the mainMenu is opened.
     */
    mainExpanded: state => {
        return state.mainMenu.expanded;
    },

    /**
     * @param {Object} state Local state.
     * @returns {(Object|null)} Title of the mainMenu or null.
     */
    mainTitle: state => {
        return state.mainMenu.title;
    },

    /**
     * @param {Object} state Local state.
     * @returns {string} Icon used for button toggling the mainMenu.
     */
    mainToggleButtonIcon: state => {
        return state.mainMenu.toggleButtonIcon;
    },

    /**
     * Returns the Text to be chosen for backward menu navigation.
     * @param {MenuState} state Local state.
     * @param {string} side side of the menu.
     * @returns {boolean} Function returning false or the Text.
     */
    previousNavigationEntryText: state => side => {
        const previousEntry = state[side].navigation.history.length !== 0
            ? state[side].navigation.history.slice(-1)[0]
            : "";
        let previousEntryText = false;

        if (previousEntry !== "") {
            switch (previousEntry.type) {
                case "root": {
                    previousEntryText = i18next.t("common:modules.menu.name");
                    break;
                }
                default: {
                    previousEntryText = previousEntry.props !== undefined && previousEntry.props.name
                        ? i18next.t(previousEntry.props.name)
                        : previousEntry.type;
                    break;
                }
            }
        }

        return previousEntryText;
    },

    /**
     * Returns the navigation history according a side.
     * @param {MenuState} state Local state.
     * @param {string} side side of the menu.
     * @returns {boolean} Function returning false or the Text.
     */
    navigationHistory: state => side => {
        return state[side].navigation.history;
    },

    /**
     * @param {MenuState} state Local state.
     * @returns {boolean} Whether the secondaryMenu should be initially open.
     */
    secondaryExpanded: state => {
        return state.secondaryMenu.expanded;
    },

    /**
     * @param {MenuState} state Local state.
     * @returns {(Object|null)} Title of the secondaryMenu or null.
     */
    secondaryTitle: state => {
        return state.secondaryMenu.title;
    },

    /**
     * @param {MenuState} state Local state.
     * @returns {string} Icon used for button toggling the secondaryMenu.
     */
    secondaryToggleButtonIcon: state => {
        return state.secondaryMenu.toggleButtonIcon;
    },

    /**
     * @param {MenuState} state Local state.
     * @returns {(Object|null)} Function returning a section of the menu.
     */
    section: state => path => {
        if (path && state[path[0]]) {
            const section = idxProvider.idx(state, path);

            if (section === idxProvider.badPathSymbol) {
                console.error(`Menu.getters.section: ${idxProvider.badPathSymbol.description} ${path}.`);
                return null;
            }

            return section;
        }

        console.error(`Menu: The given menu ${path[0]} is not configured in the config.json.`);
        return null;
    },

    /**
     * @param {MenuState} state Local state.
     * @param {string} side Side of the menu.
     * @param {number} sectionIndex Index inside sections.
     * @returns {boolean} Whether the section has at least one item.
     */
    sectionHasItems: state => (side, sectionIndex) => {
        const section = state?.[side]?.sections?.[sectionIndex];

        if (Array.isArray(section)) {
            return section.length > 0;
        }

        if (section && Array.isArray(section.elements)) {
            return section.elements.length > 0;
        }

        return false;
    },

    /**
     * @param {Object} state Local state.
     * @param {string} side side of the menu.
     * @returns {boolean} Whether show description for modules in the menu by side.
     */
    showDescription: state => side => {
        return state[side].showDescription;
    },

    /**
     * @param {MenuState} state Local state.
     * @param {string} side side of the menu.
     * @returns {({title: string, idAppendix: string}|null)} The title for the requested menu side or null.
     */
    titleBySide: state => side => {
        if (side === "mainMenu" && state.mainMenu.title) {
            return {...state.mainMenu.title, idAppendix: side};
        }

        if (side === "secondaryMenu" && state.secondaryMenu.title) {
            return {...state.secondaryMenu.title, idAppendix: side};
        }

        return null;
    },

    /**
     * @param {MenuNavigationState} state Local state.
     * @param {string} side Menu Side.
     * @returns {boolean} Whether show Icon for the current component in the menu header by side
     */
    showHeaderIcon: state => side => {
        return state[side]?.showHeaderIcon;
    },
    urlParams () {
        const params = {
                main: {
                    currentComponent: this.mainMenu.currentComponent
                },
                secondary: {
                    currentComponent: this.secondaryMenu.currentComponent
                }
            },
            mainAttributes = this.getComponentAttributes(this.mainMenu.currentComponent),
            secondaryAttributes = this.getComponentAttributes(this.secondaryMenu.currentComponent);

        if (mainAttributes) {
            params.main.attributes = mainAttributes;
        }

        if (secondaryAttributes) {
            params.secondary.attributes = secondaryAttributes;
        }

        return params;
    },
    getComponentAttributes: () => currentComponent => {
        let moduleAttributes;

        if (currentComponent !== "root") {
            const moduleName = changeCase.upperFirst(currentComponent);

            moduleAttributes = store.getters[`Modules/${moduleName}/urlParams`];

            if (typeof moduleAttributes === "undefined") {
                moduleAttributes = store.state.Modules[moduleName];
            }
        }

        return moduleAttributes;
    },

    /**
     * @param {MenuState} state Local state.
     * @param {string} side side of the menu.
     * @returns {return} The requested menu side
     */
    menuBySide: state => side => {
        return state[side];
    },

    /**
     * @param {MenuState} state Local state.
     * @returns {boolean} Whether the secondary menu is enabled.
     */
    secondaryMenuEnabled: state => {
        const sections = state.secondaryMenu?.sections;

        return Array.isArray(sections) &&
            sections.some(section => {
                return (Array.isArray(section) && section.length > 0) ||
                    (section && Array.isArray(section.elements) && section.elements.length > 0);
            });
    },

    /**
     * Returns the padding for zooming to extent, depending on the menu state.
     * @param {MenuState} state Local state.
     * @returns {Array} The padding for zooming to extent.
     */
    zoomToExtentPadding: state => {
        const mainOffset = state.mainMenu.expanded ? state.currentMainMenuOffsetWidth : 0,
            secondaryOffset = state.secondaryMenu.expanded ? state.currentSecondaryMenuOffsetWidth : 0,
            extraPadding = 20;

        return [
            extraPadding,
            secondaryOffset + extraPadding,
            extraPadding,
            mainOffset + extraPadding
        ];
    },

    /**
     * Returns the sections by side.
     * @param {MenuState} state Local state.
     * @returns {Array} the sections by side
     */
    sectionsBySide: state => side => {
        return state[side].sections;
    }
};
