/**
 * The ScaleSwitcherTutorial State
 * @module  modules/scaleSwitcherTutorial/store/stateScaleSwitcherTutorial
 * @property {String} [description="common:modules.scaleSwitcherTutorial.description"] The description that should be shown in the button in the menu.
 * @property {Boolean} [hasMouseMapInteractions=false] If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} [icon="bi-arrows-angle-contract"] Icon next to title (config-param)
 * @property {String} [name="common:modules.scaleSwitcherTutorial.name"] Displayed as title (config-param)
 * @property {String[]} [supportedDevices=["Desktop", "Mobile", "Table"]] Devices on which the module is displayed.
 * @property {String[]} [supportedMapModes=["2D", "3D"]] Map mode in which this module can be used.
 * @property {String} [type= "scaleSwitcherTutorial"] The type of the module.
 *
 */
const state = {
    hasMouseMapInteractions: false,
    description: "common:modules.scaleSwitcherTutorial.description",
    icon: "bi-arrows-angle-contract",
    name: "common:modules.scaleSwitcherTutorial.name",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "scaleSwitcherTutorial"
};

export default state;
