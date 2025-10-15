import Overlay from "ol/Overlay.js";
/**
 * User type definition
 * @typedef {Object} MouseHoverStates
 * @property {String[]} configPaths Path array of possible config locations. First one found will be used
 * @property {Object} overlay =new Overlay({}) mouseHover overlay (tooltip) - paramaters get set during initialization.
 * @property {Number} numFeaturesToShow The number of features that will be shown in the popup.
 * @property {String} infoText The text that will be shown in the popup.
 * @property {String} fontFamily The font that will be used in the popup.
 * @property {String} titleFontFamily The font that will be used for the title in the popup.
 * @property {String} fontStyle The font style that will be used in the popup.
 * @property {String} titleFontStyle The font style that will be used for the title in the popup.
 * @property {String} fontWeight The font weight that will be used in the popup.
 * @property {String} titleFontWeight The font weight that will be used for the title in the popup.
 * @property {Number} fontSize The font size that will be used in the popup.
 * @property {Number} titleFontSize The font size that will be used for the title in the popup.
 * @property {String} fontColor The color of the font that will be used in the popup.
 * @property {String} titleFontColor The color of the title font that will be used in the popup.
 * @property {Number} infoBorderRadius The border radius of the popup.
 * @property {Number} lineHeight The line height that will be used in the popup.
 * @property {Array} layersFromConfig Array with layers from the config.
 * @property {Array} layersFromConfig Array with layers from the config.
 * @property {Array} mouseHoverLayers Array with layers from the config that have mouseHoverInfos.
 * @property {Array} mouseHoverInfos Array of the attributes each layer and its features should display.
 * @property {Array} infoBox Array with the Infos from the currently hovered feature/s.
 * @property {Array} hoverPosition Array with coordinates of the currently hovered feature/s.
 * @property {Boolean} pleaseZoom True if more features are being hovered than the configured max in numFeaturesToShow.
 * @property {Boolean} highlightOnHover True if it highlights on hover.
 * @property {Object} highlightVectorRulesPolygon Rules for highlighting polygon features.
 * @property {Object} highlightVectorRulesPointLine Rules for highlighting point and line features.
 * @property {String} type The type of the mouseHover component.
 */
export default {
    configPaths: ["portalConfig.map.mouseHover"],
    overlay: new Overlay({
        id: "mousehover-overlay",
        element: document.createElement("DIV"),
        offset: [1, -2],
        positioning: "bottom-left"
    }),
    numFeaturesToShow: 2,
    infoText: "common:modules.mouseHover.infoText",
    fontFamily: "common:modules.mouseHover.fontFamily",
    titleFontFamily: "common:modules.mouseHover.titleFontFamily",
    fontStyle: "common:modules.mouseHover.fontStyle",
    titleFontStyle: "common:modules.mouseHover.titleFontStyle",
    fontWeight: "common:modules.mouseHover.fontWeight",
    titleFontWeight: "common:modules.mouseHover.titleFontWeight",
    fontSize: "common:modules.mouseHover.fontSize",
    titleFontSize: "common:modules.mouseHover.titleFontSize",
    fontColor: "common:modules.mouseHover.fontColor",
    titleFontColor: "common:modules.mouseHover.titleFontColor",
    infoBorderRadius: "common:modules.mouseHover.infoBorderRadius",
    lineHeight: "common:modules.mouseHover.lineHeight",
    layersFromConfig: [],
    mouseHoverLayers: [],
    mouseHoverInfos: [],
    infoBox: null,
    hoverPosition: null,
    pleaseZoom: false,
    highlightOnHover: false,
    highlightVectorRulesPolygon: {
        "fill": {
            "color": [255, 255, 255, 0.5]
        },
        "stroke": {
            "width": 4,
            "color": [255, 0, 0, 0.9]
        }
    },
    highlightVectorRulesPointLine: {
        "stroke": {
            "width": 2,
            "color": [255, 0, 255, 0.9]
        },
        "image": {
            "scale": 2
        }
    },
    type: "mouseHover"
};
