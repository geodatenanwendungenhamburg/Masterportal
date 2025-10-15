/**
 * WfsTransaction tool state definition.
 * @typedef {Object} WfsTransactionState
 * @type {Object}
 * @property {Boolean} type the type of the module.
 * @property {String} name Displayed as the title. (config-param)
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon Icon next to the title. (config-param)
 * @property {Boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map mode in which this module can be used.
 * @property {(ButtonConfig[]|Boolean)} update Whether it should be possible to update features of the WFS-T layers.
 * @property {(ButtonConfig[]|Boolean)} multiUpdate Whether it should be possible to update features of the group of WFS-T layers and its configuration.
 * @property {(ButtonConfig[]|Boolean)} delete Whether it should be possible to delete features of the WFS-T layers.
 * @property {String[]} layerIds Ids of the configured WFS-T layers.
 * @property {String} layerSelectLabel Label used for the layer select
 * @property {(ButtonConfig[]|Boolean)} lineButton Configuration of the different layers whether they should display the button to add lines.
 * @property {(ButtonConfig[]|Boolean)} pointButton Configuration of the different layers whether they should display the button to add points.
 * @property {(ButtonConfig[]|Boolean)} polygonButton Configuration of the different layers whether they should display the button to add polygons.
 * @property {(ButtonConfig[]|Boolean)} multiPolygonButton Configuration of the different layers whether they should display the button to add multiPolygons.
 * @property {Boolean} transactionProcessing Flag if a process like delete, update is currently active with axios post,get.
 * @property {Boolean} showConfirmModal Flag if the modal dialog should be shown.
 * @property {Boolean} toggleLayer Whether the already added features should be displayed while inserting new features.
 * @property {Number} currentLayerIndex Index of the currently selected layer.
 * @property {FeatureProperty[]} featureProperties Possible properties to be set on a feature for the current layer.
 * @property {featurePropertiesBatch[]} featurePropertiesBatch Feature properties for all selected Objects.
 * @property {Object} anyInputValue Values of inputs for multiupdate edit from user.
 * @property {TransactionLayer[]} layerInformation Information about the different WFS-T layers configured for the tool.
 * @property {("LineString"|"Point"|"Polygon"|"delete"|"updated"|"selectedUpdate"|null)} selectedInteraction Which selection is currently active, if any.
 * @property {Boolean} isFormDisabled if true then feature form inputs are invalid and form data cannot be saved to backend
 * @property {Boolean} buttonsDisabled Whether the interaction buttons should be disabled during feature-fetch.
 * @property {("singleUpdate"|"multiUpdate"|null)} selectedUpdate Which update is currently active, if any.
 * @property {Set} processedMultiPolygons Set of already processed Multipolygon Features
 */
const state = {
    // General configuration
    type: "wfst",
    name: "common:modules.wfst.name",
    description: "common:modules.wfst.description",
    icon: "bi-globe",
    hasMouseMapInteractions: true,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    // Module specific configuration
    update: false,
    multiUpdate: [],
    delete: false,
    layerIds: [],
    layerSelectLabel: "common:modules.wfst.layerSelectLabel",
    lineButton: [],
    pointButton: [],
    polygonButton: [],
    multipolygonButton: [],
    transactionProcessing: false,
    showConfirmModal: false,
    showVoidModal: false,
    voidModalCallback: {},
    toggleLayer: false,
    // Actual state
    currentLayerIndex: -1,
    featureProperties: [],
    featurePropertiesBatch: [],
    anyInputValue: {},
    layerInformation: [],
    selectedInteraction: null,
    isFormDisabled: false,
    active: false,
    buttonsDisabled: false,
    selectedUpdate: null,
    processedMultiPolygons: new Set(),
    isDrawMode: false,
    lastModifiedMultipolygon: null
};

export default state;
