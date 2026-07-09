import {defineStore} from "pinia";

/**
 * @module modules/copyright/store/copyrightConstraintsStore
 * @typedef {Object} CopyrightConstraintsState
 * @property {String} id The id of the Copyright Constraints component.
 * @property {String} name Title displayed in the menu.
 * @property {String} icon Icon displayed next to the title.
 * @property {String} type Type of the module.
 * @property {String} cswUrl URL of the CSW interface for usage information.
 * @property {Boolean} useLayerCswUrl Flag to use the CSW interface of the layer if activated.
 */

/**
 * Pinia store for the Copyright Constraints module.
 *
 * @returns {CopyrightConstraintsState} The Copyright Constraints store.
 */
export const useCopyrightConstraintsStore = defineStore("copyrightConstraints", {
    state: () => ({
        id: "copyrightConstraints",
        name: "common:modules.copyrightConstraints.name",
        icon: "bi-c-circle",
        type: "copyrightConstraints",
        cswUrl: "https://gdk.gdi-de.org/gdi-de/srv/ger/csw",
        useLayerCswUrl: false
    })
});
