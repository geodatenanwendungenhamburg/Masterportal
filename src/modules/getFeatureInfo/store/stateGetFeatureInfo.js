/**
 * The state for the getFeatureInfo.
 * @module modules/getFeatureInfo/store/stateGetFeatureInfo
 * @property {Boolean} [centerMapToClickPoint=false] specifies if the map should be centered when clicking on a feature.
 * @property {Array} [clickCoordinates=[]] coordinates of the clicked feature.
 * @property {Object} [coloredHighlighting3D={}] The Highlight Setting of 3D Tiles.
 * @property {String[]} [configPaths=["portalConfig.map.getFeatureInfo"]] Path array of possible config locations. First one found will be used
 * @property {Object} [currentFeature=null] The current feature that is displayed.
 * @property {Object[]} [gfiFeatures=[]] temporary array for features at click has to be moved to gfi module.
 * @property {Boolean} [hasMouseMapInteractions=true] If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {Boolean} [hideMapMarkerOnVectorHighlight=false] if true, mapmarker is hidden on vector highlighting.
 * @property {Object} [highlightVectorRules=null] The highlight vector rules.
 * @property {Boolean} [showPolygonMarkerForWMS=false] If true, a polygon marker is shown for WMS features.
 * @property {String} [icon="bi-info-circle-fill"] Icon next to title (config-param).
 * @property {String} [initialMenuSide="secondaryMenu"] Specifies in which menu the GFI should be rendered initially
 * @property {String} [menuSide="secondaryMenu"] Specifies in which the GFI should be rendered dependending on opened print module.
 * @property {String} [name="common:modules.getFeatureInfo.name"] Displayed as title (config-param).
 * @property {Object[]} [path=[]] Path for menu navigation
 * @property {Boolean} [showMarker=true] Specifies whether the map marker should be set on click.
 * @property {String} type=getFeatureInfo" The type of the gfi component.
 * @property {Boolean} [visible=false] True if the gfi is visible.
 * * @property {Object} [globeEventHandler=null] - The event handler for managing user interactions with the map (e.g., for highlighting 3D tiles).
 * This handler is created when user interaction with the map is needed (e.g., a left-click to highlight a feature).
 * @property {Object} [lastPickedFeatureId=null] The ID of the last feature that was picked or interacted with by the user.
 * @property {Boolean|null} [menuExpandedBeforeGfi=null] - Tracks whether the menu was expanded before opening GFI. Used to restore the menu state correctly when no GFI features are found.
*/
export default {
    centerMapToClickPoint: false,
    clickCoordinates: [],
    coloredHighlighting3D: {},
    configPaths: ["portalConfig.map.getFeatureInfo"],
    currentFeature: null,
    gfiFeatures: [],
    hasMouseMapInteractions: true,
    hideMapMarkerOnVectorHighlight: false,
    highlightVectorRules: null,
    showPolygonMarkerForWMS: false,
    icon: "bi-info-circle-fill",
    initialMenuSide: "secondaryMenu",
    menuSide: "secondaryMenu",
    name: "common:modules.getFeatureInfo.name",
    path: [],
    showMarker: true,
    type: "getFeatureInfo",
    visible: false,
    globeEventHandler: null,
    lastPickedFeatureId: null,
    menuExpandedBeforeGfi: null
};
