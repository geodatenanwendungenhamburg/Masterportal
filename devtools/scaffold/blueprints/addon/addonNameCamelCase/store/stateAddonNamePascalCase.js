/**
 * Masterportal state
 * @typedef {Object} MapState
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the component
 * @property {String} id - id of component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 * @property {Boolean} standAlonePortal - flag if tool is used in a standalone portal, then titles are removed via CSS (config-param)

 * Addon state
 * @property {Boolean} showLoadingSpinner - Show loading spinner or not
 */

const state = {
    // Masterportal state
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "addonNameCamelCase",
    id: "addonNameCamelCase",
    name: "additional:modules.addonNameCamelCase.name",
    description: "additional:modules.addonNameCamelCase.description",
    icon: "bi-question-square",
    isVisibleInMenu: true,
    deactivateGFI: true,
    standAlonePortal: false,

    // Addon state
    showLoadingSpinner: false
};

export default state;


