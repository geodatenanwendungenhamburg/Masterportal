/**
 * The state of the Copyright Informations
 * @module  modules/copyright/store/stateCopyrightConstraints
 * @typedef {Object} CopyrightConstraintsState
 * @property {String} id The id of the Copyright Constraints component.
 * @property {String} name Title displayed in the menu.
 * @property {String} icon Icon displayed next to the title.
 * @property {String} type Type of the module.
 * @property {String} cswUrl URL of the CSW interface for usage information.
 */
const state = {
    id: "copyrightConstraints",
    name: "common:modules.copyrightConstraints.name",
    icon: "bi-c-circle",
    type: "copyrightConstraints",
    cswUrl: "https://gdk.gdi-de.org/gdi-de/srv/ger/csw"
};

export default state;
