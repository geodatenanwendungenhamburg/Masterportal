/**
 * User type definition
 * @typedef {object} AddDipasThemeLayersState
 * @property {boolean} active if true, AddDipasThemeLayers will rendered
 * @property {string} id id of the AddDipasThemeLayers component
 * @property {string} name displayed as title (config-param)
 * @property {string} icon icon next to title (config-param)
 * @property {boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {boolean} resizableWindow if true, window is resizable (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {string} sceneConfigsUrl Url to load scene configs json, set in the portal's config.json
 * @property {boolean} useTools  Mode to display Tools set in the portal's config.json
 * @property {number} annotationRefreshInterval Interval to refresh annotation data  set in the portal's config.json
 * @property {string} wasmUrl URL to Wasm files. Must be accessible via web, set in the portal's config.json
 * @typedef {object} xeokitIfcViewer IfcViewer instance
 * @typedef {object} xeokitIfcLoader IfcLoader instance
 * @typedef {object} xeokitIfcAPI IfcAPI instance
 * @typedef {object} xeokitPluginNavCube NavCubePlugin instance
 * @typedef {object} xeokitPluginTreeView TreeViewPlugin instance
 * @typedef {object} xeokitPluginDistanceMeasurements DistanceMeasurementsPlugin instance
 * @typedef {object} xeokitPluginDistanceMeasurementsControl DistanceMeasurementsMouseControl instance
 * @typedef {object} xeokitPluginAnnotationLabelActive active AnnotationLabel instance
 * @typedef {object} xeokitPluginAnnotations Annotations loaded through json
 * @typedef {array} loadedIfcModels The loaded IFC model instances.
 * @typedef {array} sceneConfigs Contains multiple scene configs, includes models, camera and sao settings, aso.
 * @typedef {object} sceneConfigSelected The current selected sceneConfig.
 * @typedef {object} toggleRightSidebar Open/Close sidebar
 * @typedef {object} totalNumberOfModels Number of models inside the selected sceneConfig.
 * @typedef {object} currentlyLoadedModels Number of actually loaded models.
 * @typedef {number} annotationRefreshIntervalID ID of refresh interval for annotations.
 * @typedef {object} positionPointer Annotation set through URLParameter.
 */

const state = {
    type: "bimViewer",
    hasMouseMapInteractions: false,
    description: "common:modules.bimViewer.description",
    icon: "bi-houses",
    name: "common:modules.bimViewer.name",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],

    // Defaults for "bimViewer" addon state - Overwrite from the portal's config.json
    sceneConfigsUrl: "",
    useTools: true,
    annotationRefreshInterval: null,
    wasmUrl: "./wasm/",

    // Component state (xeokit object instances)
    xeokitIfcViewer: null,
    xeokitIfcLoader: null,
    xeokitIfcAPI: null,
    xeokitPluginNavCube: null,
    xeokitPluginTreeView: null,
    xeokitPluginDistanceMeasurements: null,
    xeokitPluginDistanceMeasurementsControl: null,
    xeokitPluginAnnotationLabelActive: null,
    xeokitPluginAnnotations: null,

    // Component state
    loadedIfcModels: [],
    sceneConfigs: [],
    sceneConfigSelected: {},
    toggleRightSidebar: false,
    totalNumberOfModels: 0,
    currentlyLoadedModels: 0,
    annotationRefreshIntervalID: null,
    positionPointer: null
};

export default state;
