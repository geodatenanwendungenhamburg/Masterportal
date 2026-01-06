import {nextTick} from "vue";
import changeCase from "@shared/js/utils/changeCase.js";
import {trackMatomo} from "@plugins/matomo";

export default {
    /**
     * Activates the current component in the menu by side.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} currentComponent The current component.
     * @param {String} type The type of the current component.
     * @param {String} side The menu side.
     * @returns {void}
     */
    activateCurrentComponent ({commit, dispatch, rootGetters}, {currentComponent, type, side}) {
        commit("setExpandedBySide", {expanded: true, side: side});
        dispatch("changeCurrentComponent", {
            type: currentComponent.type,
            side: side,
            props: {
                name: rootGetters[`Modules/${type}/name`]
            }
        });
    },

    /**
     * Change the currently shown component.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @param {String} type The current component type.
     * @param {String} side secondary or main Menu
     * @param {String} props The props of the current component.
     * @returns {void}
     */
    changeCurrentComponent ({commit, dispatch, state}, {type, side, props}) {
        const currentType = state[side].navigation.currentComponent.type,
            currentProps = state[side].navigation.currentComponent.props;

        if (currentType !== type || currentType === "folder" && type === "folder" || currentType === "layerSelection" && type === "layerSelection") {
            commit("setCurrentComponent", {type, side, props});
            dispatch("changeCurrentMouseMapInteractionsComponent", {type, side});
        }
        else if (props?.name !== currentProps?.name) {
            commit("setCurrentComponentProps", {side, props});
        }
        if (type !== "getFeatureInfo" && type !== "searchBar" && type !== "layerSelection") {
            trackMatomo("Menu", "Menuitem clicked", i18next.t(props.name));
        }
    },

    /**
     * Change the current component with mouse map interactions.
     * Note: Only one such component can be active at the same time.
     * If another one is switched on, the other one is closed and reset to "root";
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} param.state the state
     * @param {String} type The component type.
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    changeCurrentMouseMapInteractionsComponent ({commit, rootGetters, state}, {type, side}) {
        if (type !== state.currentMouseMapInteractionsComponent && rootGetters[`Modules/${changeCase.upperFirst(type)}/hasMouseMapInteractions`]) {
            const otherSide = side === "mainMenu" ? "secondaryMenu" : "mainMenu";

            if (state[otherSide].navigation.currentComponent.type === state.currentMouseMapInteractionsComponent) {
                commit("switchToRoot", otherSide);
            }

            commit("setCurrentMouseMapInteractionsComponent", type);
        }
    },

    /**
     * Action triggered when a menu element has been clicked.
     * Add an entry to the navigation and, when the element
     * was a Folder, focus the first child-element.
     * @param {Object} param store context
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {String} name Name of the element.
     * @param {Array} path Path leading up to the clicked menu element.
     * @param {String} side The menu side of the element.
     * @param {String} type type of the element.
     * @param {Object} properties properties of the element.
     * @returns {void}
     */
    clickedMenuElement ({dispatch, rootGetters}, {name, path, side, type, properties}) {
        if (type) {
            if (type === "customMenuElement") {
                if (properties.openURL !== undefined) {
                    window.open(properties.openURL);
                }
                if (properties.execute !== undefined) {
                    dispatch(properties.execute.action, properties.execute.payload, {root: true});
                }
                if (properties.htmlContent === undefined && properties.pathToContent === undefined) {
                    if (rootGetters.isMobile) {
                        dispatch("Menu/toggleMenu", side, {root: true});
                    }
                    return;
                }
            }
            if (type === "folder") {
                nextTick(() => {
                    dispatch("changeCurrentComponent", {type: type, side: side, props: {path: path, name: name}});
                });
            }
            else {
                const props = properties ? Object.assign(properties, {name: name}) : {name: name};

                dispatch("changeCurrentComponent", {type: type, side: side, props: props});
            }
        }
    },

    /**
     * Closes and resets Menucontainers.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} param.state the state
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    closeMenu ({commit, dispatch, getters, state}, side) {
        if (getters.currentComponent(side).type === state.currentMouseMapInteractionsComponent && getters.currentComponent(side).type !== state.defaultComponent) {
            dispatch("changeCurrentMouseMapInteractionsComponent", {type: state.defaultComponent, side});
        }

        commit("switchToRoot", side);
        dispatch("toggleMenu", side);
    },

    /**
     * Navigates back and removes last entry from the navigation and handles search navigation case.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} param.state the state
     * @param {Object} param.rootGetters the rootGetters
     * @param {String} side Side on which the navigation action occurred.
     * @returns {void}
     */
    navigateBack ({commit, dispatch, getters, state, rootGetters}, side) {
        const actionEvent = rootGetters["Modules/SearchBar/currentActionEvent"];

        nextTick(() => {
            if (getters.currentComponent(side).type === state.currentMouseMapInteractionsComponent && getters.currentComponent(side).type !== state.defaultComponent) {
                dispatch("changeCurrentMouseMapInteractionsComponent", {type: state.defaultComponent, side});
            }
            if (getters.currentComponent(side).type !== "layerInformation" && rootGetters["Modules/SearchBar/showAllResults"] === false || rootGetters["Modules/SearchBar/currentSide"] !== side) {
                commit("switchToPreviousComponent", side);
            }
            if (getters.currentComponent(side).type === "searchBar") {
                if (rootGetters["Modules/SearchBar/showAllResults"] === true && rootGetters["Modules/SearchBar/currentSide"] === side && actionEvent === "") {
                    dispatch("resetSearchbarNavigation", {side: side});
                }
                commit("Modules/SearchBar/setPlaceholder", rootGetters["Modules/SearchBar/globalPlaceholder"], {root: true});
            }
            if (getters.currentComponent(side).type === "layerSelection") {
                dispatch("navigateSearchbarInLayerSelection", {side: side});
            }
            if (actionEvent !== "" && rootGetters["Modules/SearchBar/currentSide"] === side) {
                dispatch("navigateSearchbarActionEventNotInLayerSelection", {side: side});
            }
            if (getters.currentComponent(side).type === "layerInformation") {
                commit("switchToPreviousComponent", side);
            }
        });
    },

    /**
     * Sets navigation history to root and adapts searchBar state.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {String} side Side on which the navigation action occurred.
     * @returns {void}
     */
    resetSearchbarNavigation ({commit}, {side}) {
        commit("Modules/SearchBar/setShowAllResults", false, {root: true});
        commit("Menu/setCurrentComponentPropsName", {side: side, name: "common:modules.searchBar.searchResultList"}, {root: true});
        commit("Menu/setNavigationHistoryBySide", {side: side, newHistory: [{type: "root", props: []}]}, {root: true});
    },

    /**
     * Sets state of searchBar if current action event is filled and searcgbar does not contain layerSelection.
     * Resets current action event.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.rootGetters the rootGetters
     * @param {String} side Side on which the navigation action occurred.
     * @returns {void}
     */
    navigateSearchbarActionEventNotInLayerSelection ({commit, dispatch, rootGetters}, {side}) {
        const actionEvent = rootGetters["Modules/SearchBar/currentActionEvent"];

        commit("Modules/SearchBar/setShowSearchResultsInTree", false, {root: true});
        if (actionEvent !== "showInTree" && actionEvent !== "showLayerInfo") {
            dispatch("resetSearchbarNavigation", {side: side});
        }
        else {
            commit("Modules/SearchBar/setShowAllResults", true, {root: true});
        }
        commit("Modules/SearchBar/setCurrentActionEvent", "", {root: true});
    },

    /**
     * Sets state of searchBar and navigates back in layerSelection depending on current navigation.
     * Switches to previous component.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {String} side Side on which the navigation action occurred.
     * @returns {void}
     */
    navigateSearchbarInLayerSelection ({commit, dispatch, getters}, {side}) {
        commit("Modules/SearchBar/setShowAllResults", false, {root: true});
        if (getters.navigationHistory(side)[1]?.type === "layerSelection" && getters.navigationHistory(side)[2]?.type === "layerSelection") {
            commit("Modules/SearchBar/setShowSearchResultsInTree", true, {root: true});
        }
        else {
            commit("Modules/SearchBar/setSearchResultsActive", false, {root: true});
            commit("Modules/SearchBar/setShowSearchResultsInTree", false, {root: true});
            dispatch("Modules/LayerSelection/navigateBack", null, {root: true});
        }
        commit("switchToPreviousComponent", side);
    },

    /**
     * Resets MenuContainers.
     * @param {Object} param store context
     * @param {Function} param.commit the commit
     * @param {Function} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} param.state the state
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    resetMenu ({commit, dispatch, getters, state, rootGetters}, side) {
        if (getters.currentComponent(side).type === state.currentMouseMapInteractionsComponent && getters.currentComponent(side).type !== state.defaultComponent) {
            dispatch("changeCurrentMouseMapInteractionsComponent", {type: state.defaultComponent, side});
        }

        if (getters.currentComponent(side).type === "layerInformation") {
            dispatch("Modules/LayerSelection/reset", null, {root: true});
        }

        if (getters.currentComponent(side).type === "getFeatureInfo" && rootGetters["Modules/GetFeatureInfo/menuExpandedBeforeGfi"] === false) {
            commit("setExpandedBySide", {expanded: false, side: side});
        }

        commit("switchToRoot", side);
    },

    /**
     * Toggles Menucontainers.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} param.state the state
     * @param {String} side secondary or main Menu
     * @returns {void}
     */
    toggleMenu ({commit, rootGetters, state}, side) {
        if (side === "mainMenu") {
            if (rootGetters.isMobile && state.secondaryMenu.expanded) {
                commit("setExpandedBySide", {expanded: false, side: "secondaryMenu"});
            }
            commit("setExpandedBySide", {expanded: !state.mainMenu.expanded, side});
        }
        else if (side === "secondaryMenu") {
            if (rootGetters.isMobile && state.mainMenu.expanded) {
                commit("setExpandedBySide", {expanded: false, side: "mainMenu"});
            }
            const footer = document.getElementById("module-portal-footer"),
                layerPills = document.getElementById("layer-pills");

            if (state.secondaryMenu.expanded) {
                if (layerPills) {
                    layerPills.style.display = "";
                }
                if (footer) {
                    footer.style.display = "";
                }
            }
            commit("setExpandedBySide", {expanded: !state.secondaryMenu.expanded, side});
        }
    },

    /**
    * Update the state attributes of the currentComponent.
     * @param {Object} param store context
     * @param {Object} param.dispatch the dispatch
     * @param {Object} params The params.
     * @param {String} type The type of the current component.
     * @param {Object} attributes The attributes.
     * @returns {void}
     */
    updateComponentState ({dispatch}, {type, attributes}) {
        if (this._actions[`Modules/${type}/urlParams`]) {
            if (typeof attributes === "object") {
                dispatch(`Modules/${type}/urlParams`, attributes, {root: true});
            }
            else {
                dispatch(`Modules/${type}/urlParams`, JSON.parse(attributes), {root: true});
            }
        }
        else {
            Object.assign(this.state.Modules[type], attributes);
        }
    },
    /**
     * Sets current MenuWidth
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {String} type secondary or main Menu
     * @param {String} attributes attributes object with width value
     * @returns {void}
     */
    setCurrentMenuWidth ({commit}, {type, attributes}) {
        if (attributes.width <= 95 && attributes.width >= 5) {
            const wString = attributes.width + "%";

            commit("setCurrentMenuWidth", {side: type, width: wString});
        }
        else {
            console.error(i18next.t("common:modules.menu.widthUrlParamError"));
        }
    }
};
