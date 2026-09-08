import {nextTick} from "vue";
import changeCase from "@shared/js/utils/changeCase.js";
import {getPiniaModuleStore, isPiniaModule} from "../../modules-store/piniaModules.js";
import store from "@appstore/index.js";

/**
 * Switches the current component to root.
 * @param {Object} state The menu state.
 * @param {String} side secondary or main Menu.
 * @returns {void}
 */
function switchToRoot (state, side) {
    state[side].navigation.currentComponent = {props: [], type: "root"};
    state[side].navigation.history = [];
    state[side].currentComponent = "root";
}

/**
 * Switches to the previous component.
 * @param {Object} state The menu state.
 * @param {String} side secondary or main Menu.
 * @returns {void}
 */
function switchToPreviousComponent (state, side) {
    if (state[side].navigation.history.slice(-1)[0]?.type) {
        state[side].navigation.currentComponent = {
            type: state[side].navigation.history.slice(-1)[0].type,
            props: state[side].navigation.history.slice(-1)[0].props
        };
        state[side].currentComponent = state[side].navigation.history.slice(-1)[0].type;
    }

    state[side].navigation.history.pop();
}

/**
 * Sets the current component.
 * @param {Object} state The menu state.
 * @param {Object} param The parameters.
 * @param {String} param.type The component type.
 * @param {String} param.side secondary or main Menu.
 * @param {Object} param.props The component props.
 * @returns {void}
 */
function setCurrentComponent (state, {type, side, props}) {
    const history = state[side].navigation.history;

    history.push(state[side].navigation.currentComponent);

    if (history.length > 0) {
        let lastComponent = history[history.length - 1];

        if (lastComponent.type === "getFeatureInfo" && lastComponent.props?.name === "none") {
            history.pop();

            if (history.length > 1) {
                lastComponent = history[history.length - 1];

                if (lastComponent.type === type) {
                    history.pop();
                }
            }
        }
    }

    state[side].navigation.currentComponent = {type, props};
    state[side].currentComponent = type;
}

export default {
    /**
     * Activates the current component in the menu by side.
     * @param {Object} currentComponent The current component.
     * @param {String} type The type of the current component.
     * @param {String} side The menu side.
     * @returns {void}
     */
    activateCurrentComponent ({currentComponent, type, side}) {
        const lowerType = changeCase.lowerFirst(type),
            name = isPiniaModule(lowerType)
                ? getPiniaModuleStore(lowerType)().name
                : store.getters[`Modules/${type}/name`];

        this[side].expanded = true;
        this.changeCurrentComponent({
            type: currentComponent.type,
            side: side,
            props: {
                name
            }
        });
    },

    /**
     * Change the currently shown component.
     * @param {String} type The current component type.
     * @param {String} side secondary or main Menu
     * @param {String} props The props of the current component.
     * @returns {void}
     */
    changeCurrentComponent ({type, side, props}) {
        const currentType = this[side].navigation.currentComponent.type,
            currentProps = this[side].navigation.currentComponent.props;

        if (props?.closeOppositeMenu) {
            const oppositeSide = side === "mainMenu" ? "secondaryMenu" : "mainMenu";

            if (this[oppositeSide].expanded) {
                this[oppositeSide].expanded = false;
            }
        }

        if (currentType !== type || currentType === "folder" && type === "folder" || currentType === "layerSelection" && type === "layerSelection") {
            setCurrentComponent(this, {type, side, props});
            this.changeCurrentMouseMapInteractionsComponent({type, side});
        }
        else if (props?.name !== currentProps?.name) {
            this[side].navigation.currentComponent.props = props;
        }
    },
    /**
     * Switches to the previous component.
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    switchToPreviousComponent (side) {
        switchToPreviousComponent(this, side);
    },

    /**
     * Change the current component with mouse map interactions.
     * Note: Only one such component can be active at the same time.
     * If another one is switched on, the other one is closed and reset to "root";
     * @param {String} type The component type.
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    changeCurrentMouseMapInteractionsComponent ({type, side}) {
        if (type !== this.currentMouseMapInteractionsComponent && store.getters[`Modules/${changeCase.upperFirst(type)}/hasMouseMapInteractions`]) {
            const otherSide = side === "mainMenu" ? "secondaryMenu" : "mainMenu";

            if (this[otherSide].navigation.currentComponent.type === this.currentMouseMapInteractionsComponent) {
                switchToRoot(this, otherSide);
            }

            this.currentMouseMapInteractionsComponent = type;
        }
    },

    /**
     * Resets the component using mouse map interaction to the default one.
     * Note: Only one such component can be active at the same time.
     * If another one is switched on, the other one is closed and reset to "root";
     * @param {*} side secondary or main menu
     * @returns {void}
     */
    resetCurrentMouseMapInteractionsComponent (side) {
        if (this.defaultComponent !== this.currentMouseMapInteractionsComponent) {
            const otherSide = side === "mainMenu" ? "secondaryMenu" : "mainMenu";

            if (this[otherSide].navigation.currentComponent.type === this.currentMouseMapInteractionsComponent) {
                switchToRoot(this, otherSide);
            }

            this.currentMouseMapInteractionsComponent = this.defaultComponent;
        }
    },

    /**
     * Action triggered when a menu element has been clicked.
     * Add an entry to the navigation and, when the element
     * was a Folder, focus the first child-element.
     * @param {String} name Name of the element.
     * @param {Array} path Path leading up to the clicked menu element.
     * @param {String} side The menu side of the element.
     * @param {String} type type of the element.
     * @param {Object} properties properties of the element.
     * @returns {void}
     */
    clickedMenuElement ({name, path, side, type, properties}) {
        if (type) {
            if (type === "customMenuElement") {
                if (properties.openURL !== undefined) {
                    window.open(properties.openURL);
                }
                if (properties.execute !== undefined) {
                    store.dispatch(properties.execute.action, properties.execute.payload);
                }
                if (properties.htmlContent === undefined && properties.pathToContent === undefined) {
                    if (store.getters.isMobile) {
                        this.toggleMenu(side);
                    }
                    return;
                }
            }
            if (type === "folder") {
                nextTick(() => {
                    this.changeCurrentComponent({type: type, side: side, props: {path: path, name: name}});
                });
            }
            else {
                const props = properties ? Object.assign(properties, {name: name}) : {name: name};

                this.changeCurrentComponent({type: type, side: side, props: props});
            }
        }
    },

    /**
     * Closes and resets Menucontainers.
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    closeMenu (side) {
        if (this.currentComponent(side).type === this.currentMouseMapInteractionsComponent && this.currentComponent(side).type !== this.defaultComponent) {
            this.changeCurrentMouseMapInteractionsComponent({type: this.defaultComponent, side});
        }

        switchToRoot(this, side);
        this.toggleMenu(side);
    },

    /**
     * Navigates back and removes last entry from the navigation and handles search navigation case.
     * @param {Object} payload the payload
     * @param {String} payload.side Side on which the navigation action occurred.
     * @param {Boolean} [payload.doNotTrack] Additional flag for user tracking observing this action.
     * @returns {void}
     */
    navigateBack ({side}) {
        const actionEvent = store.getters["Modules/SearchBar/currentActionEvent"];

        nextTick(() => {
            if (this.currentComponent(side).type === this.currentMouseMapInteractionsComponent && this.currentComponent(side).type !== this.defaultComponent) {
                this.changeCurrentMouseMapInteractionsComponent({type: this.defaultComponent, side});
            }
            if (this.currentComponent(side).type !== "layerInformation" && store.getters["Modules/SearchBar/showAllResults"] === false || store.getters["Modules/SearchBar/currentSide"] !== side) {
                switchToPreviousComponent(this, side);
            }
            if (this.currentComponent(side).type === "searchBar") {
                if (store.getters["Modules/SearchBar/showAllResults"] === true && store.getters["Modules/SearchBar/currentSide"] === side && actionEvent === "") {
                    this.resetSearchbarNavigation({side: side});
                }
                store.commit("Modules/SearchBar/setPlaceholder", store.getters["Modules/SearchBar/globalPlaceholder"]);
            }
            if (this.currentComponent(side).type === "layerSelection") {
                this.navigateSearchbarInLayerSelection({side: side});
            }
            if (actionEvent !== "" && store.getters["Modules/SearchBar/currentSide"] === side) {
                this.navigateSearchbarActionEventNotInLayerSelection({side: side});
            }
            if (this.currentComponent(side).type === "layerInformation") {
                switchToPreviousComponent(this, side);
            }
        });
    },
    /**
     * Sets navigation history to root and adapts searchBar state.
     * @param {String} side Side on which the navigation action occurred.
     * @returns {void}
     */
    resetSearchbarNavigation ({side}) {
        store.commit("Modules/SearchBar/setShowAllResults", false);
        this[side].navigation.currentComponent.props.name = "common:modules.searchBar.searchResultList";
        this[side].navigation.history = [{type: "root", props: []}];
    },

    /**
         * Sets state of searchBar if current action event is filled and searcgbar does not contain layerSelection.
         * Resets current action event.
         * @param {String} side Side on which the navigation action occurred.
         * @returns {void}
         */
    navigateSearchbarActionEventNotInLayerSelection ({side}) {
        const actionEvent = store.getters["Modules/SearchBar/currentActionEvent"];

        store.commit("Modules/SearchBar/setShowSearchResultsInTree", false);
        if (actionEvent !== "showInTree" && actionEvent !== "showLayerInfo") {
            this.resetSearchbarNavigation({side: side});
        }
        else {
            store.commit("Modules/SearchBar/setShowAllResults", true);
        }
        store.commit("Modules/SearchBar/setCurrentActionEvent", "");
    },

    /**
         * Sets state of searchBar and navigates back in layerSelection depending on current navigation.
         * Switches to previous component.
         * @param {String} side Side on which the navigation action occurred.
         * @returns {void}
         */
    navigateSearchbarInLayerSelection ({side}) {
        store.commit("Modules/SearchBar/setShowAllResults", false);
        if (this.navigationHistory(side)[1]?.type === "layerSelection" && this.navigationHistory(side)[2]?.type === "layerSelection") {
            store.commit("Modules/SearchBar/setShowSearchResultsInTree", true);
        }
        else {
            store.commit("Modules/SearchBar/setSearchResultsActive", false);
            store.commit("Modules/SearchBar/setShowSearchResultsInTree", false);
            store.dispatch("Modules/LayerSelection/navigateBack", {doNotTrack: true});
        }
        switchToPreviousComponent(this, side);
    },

    /**
         * Resets MenuContainers.
         * @param {String} side secondary or main Menu
         * @returns {void}
         */
    resetMenu (side) {
        if (this.currentComponent(side).type === this.currentMouseMapInteractionsComponent && this.currentComponent(side).type !== this.defaultComponent) {
            this.changeCurrentMouseMapInteractionsComponent({type: this.defaultComponent, side});
        }

        if (this.currentComponent(side).type === "layerInformation") {
            store.dispatch("Modules/LayerSelection/reset", null);
        }

        if (this.currentComponent(side).type === "getFeatureInfo" && store.getters["Modules/GetFeatureInfo/menuExpandedBeforeGfi"] === false) {
            this[side].expanded = false;
        }

        switchToRoot(this, side);
    },
    /**
     * Toggles Menucontainers.
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    toggleMenu (side) {
        if (side === "mainMenu") {
            if (store.getters.isMobile && this.secondaryMenu.expanded) {
                this.secondaryMenu.expanded = false;
            }
            this.mainMenu.expanded = !this.mainMenu.expanded;
        }
        else if (side === "secondaryMenu") {
            if (store.getters.isMobile && this.mainMenu.expanded) {
                this.mainMenu.expanded = false;
            }
            const footer = document.getElementById("module-portal-footer"),
                layerPills = document.getElementById("layer-pills");

            if (this.secondaryMenu.expanded) {
                if (layerPills) {
                    layerPills.style.display = "";
                }
                if (footer) {
                    footer.style.display = "";
                }
            }
            this.secondaryMenu.expanded = !this.secondaryMenu.expanded;
        }
    },

    /**
     * Update the state attributes of the currentComponent.
     * @param {Object} params The params.
     * @param {String} type The type of the current component.
     * @param {Object} attributes The attributes.
     * @returns {void}
     */
    updateComponentState ({type, attributes}) {
        const lowerType = changeCase.lowerFirst(type),
            parsedAttributes = typeof attributes === "object"
                ? attributes
                : JSON.parse(attributes);

        if (isPiniaModule(lowerType)) {
            Object.assign(getPiniaModuleStore(lowerType)(), parsedAttributes);
        }
        else if (store._actions[`Modules/${type}/urlParams`]) {
            store.dispatch(`Modules/${type}/urlParams`, parsedAttributes);
        }
        else {
            Object.assign(store.state.Modules[type], parsedAttributes);
        }
    },
    /**
     * Sets current MenuWidth
     * @param {String} type secondary or main Menu
     * @param {String} attributes attributes object with width value
     * @returns {void}
     */
    setCurrentMenuWidth ({type, attributes}) {
        if (attributes.width <= 95 && attributes.width >= 5) {
            const wString = attributes.width + "%";

            this[type].width = wString;
        }
        else {
            console.error(i18next.t("common:modules.menu.widthUrlParamError"));
        }
    }
};
