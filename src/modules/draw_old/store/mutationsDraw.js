import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import initialState from "./stateDraw.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(initialState),

    /**
     * Set SquareSide.
     * @param {Object} state the state of draw-module
     * @param {String} payload the side of the square
     * @returns {void}
     */
    setSquareSide: (state, payload) => {
        state.drawSquareSettings.squareSide = payload;
    },
    /**
     * Set download string to the given data.
     * @param {Object} state the state of draw-module
     * @param {String} payload the data to set
     * @returns {void}
     */
    setDownloadDataString: (state, payload) => {
        state.download.dataString = payload;
    },
    /**
     * Toggles download enabled.
     * @param {Object} state the state of draw-module
     * @returns {void}
     */
    setDownloadEnabled: (state) => {
        state.download.enabled = !state.download.enabled;
    },
    /**
     * Sets the download features.
     * @param {Object} state the state of draw-module
     * @param {Object[]} payload the data to set
     * @returns {void}
     */
    setDownloadFeatures: (state, payload) => {
        state.download.features = payload;
    },
    /**
     * Sets the download file.
     * @param {Object} state the state of draw-module
     * @param {String} payload the data to set
     * @returns {void}
     */
    setDownloadFile: (state, payload) => {
        state.download.file = payload;
    },
    /**
     * Sets the download filename.
     * @param {Object} state the state of draw-module
     * @param {String} payload the data to set
     * @returns {void}
     */
    setDownloadFileName: (state, payload) => {
        state.download.fileName = payload;
    },
    /**
     * Sets the download file Url.
     * @param {Object} state the state of draw-module
     * @param {String} payload the data to set
     * @returns {void}
     */
    setDownloadFileUrl: (state, payload) => {
        state.download.fileUrl = payload;
    },
    /**
     * Sets the download file.
     * @param {Object} state the state of draw-module
     * @param {String} payload the data to set
     * @returns {void}
     */
    setDownloadFeaturesNotSupported: (state, payload) => {
        state.download.featuresNotSupported = payload;
    },
    /**
     * Sets the download selected Format.
     * @param {Object} state the state of draw-module
     * @param {String} payload the data to set
     * @returns {void}
     */
    setDownloadSelectedFormat: (state, payload) => {
        state.download.selectedFormat = payload;
    },
    /**
     * Adds a symbol to the iconList.
     * @param {Object} state the state of draw-module
     * @param {Object} payload the data to add
     * @returns {void}
     */
    addSymbol: (state, payload) => {
        state.iconList.push(payload);
    },
    /**
     * Sets the Symbol Settings.
     * @param {Object} state the state of draw-module
     * @param {Object} styleSettings the data to set
     * @returns {void}
     */
    setDrawSymbolSettings: (state, styleSettings) => {
        state.drawSymbolSettings.color = styleSettings.color;
        state.drawSymbolSettings.opacity = styleSettings.opacity;
    },

    /**
     * Sets the Area Settings.
     * @param {Object} state the state of draw-module
     * @param {Object} styleSettings the data to set
     * @returns {void}
     */
    setDrawAreaSettings: (state, styleSettings) => {
        state.drawAreaSettings.area = styleSettings.area;
        state.drawAreaSettings.color = styleSettings.color;
        state.drawAreaSettings.colorContour = styleSettings.colorContour;
        state.drawAreaSettings.opacity = styleSettings.opacity;
        state.drawAreaSettings.opacityContour = styleSettings.opacityContour;
        state.drawAreaSettings.strokeWidth = styleSettings.strokeWidth;
        state.drawAreaSettings.unit = styleSettings.unit;
    },
    /**
     * Sets the Circle Settings.
     * @param {Object} state the state of draw-module
     * @param {Object} styleSettings the data to set
     * @returns {void}
     */
    setDrawCircleSettings: (state, styleSettings) => {
        state.drawCircleSettings.circleMethod = styleSettings.circleMethod;
        state.drawCircleSettings.circleOuterRadius = styleSettings.circleOuterRadius;
        state.drawCircleSettings.circleRadius = styleSettings.circleRadius;
        state.drawCircleSettings.color = styleSettings.color;
        state.drawCircleSettings.colorContour = styleSettings.colorContour;
        state.drawCircleSettings.opacity = styleSettings.opacity;
        state.drawCircleSettings.opacityContour = styleSettings.opacityContour;
        state.drawCircleSettings.outerColorContour = styleSettings.outerColorContour;
        state.drawCircleSettings.strokeWidth = styleSettings.strokeWidth;
        state.drawCircleSettings.unit = styleSettings.unit;
    },
    /**
     * Sets the Curve Settings.
     * @param {Object} state the state of draw-module
     * @param {Object} styleSettings the data to set
     * @returns {void}
     */
    setDrawCurveSettings: (state, styleSettings) => {
        state.drawCurveSettings.color = styleSettings.color;
        state.drawCurveSettings.colorContour = styleSettings.colorContour;
        state.drawCurveSettings.opacity = styleSettings.opacity;
        state.drawCurveSettings.opacityContour = styleSettings.opacityContour;
        state.drawCurveSettings.strokeWidth = styleSettings.strokeWidth;
    },
    /**
     * Sets the Line Settings.
     * @param {Object} state the state of draw-module
     * @param {Object} styleSettings the data to set
     * @returns {void}
     */
    setDrawLineSettings: (state, styleSettings) => {
        state.drawLineSettings.color = styleSettings.color;
        state.drawLineSettings.colorContour = styleSettings.colorContour;
        state.drawLineSettings.length = styleSettings.length;
        state.drawLineSettings.opacity = styleSettings.opacity;
        state.drawLineSettings.opacityContour = styleSettings.opacityContour;
        state.drawLineSettings.strokeWidth = styleSettings.strokeWidth;
        state.drawLineSettings.unit = styleSettings.unit;
    },
    /**
     * Sets the Square Settings.
     * @param {Object} state the state of draw-module
     * @param {Object} styleSettings the data to set
     * @returns {void}
     */
    setDrawSquareSettings: (state, styleSettings) => {
        state.drawSquareSettings.color = styleSettings.color;
        state.drawSquareSettings.colorContour = styleSettings.colorContour;
        state.drawSquareSettings.opacity = styleSettings.opacity;
        state.drawSquareSettings.opacityContour = styleSettings.opacityContour;
        state.drawSquareSettings.squareArea = styleSettings.squareArea;
        state.drawSquareSettings.squareMethod = styleSettings.squareMethod;
        state.drawSquareSettings.squareSide = styleSettings.squareSide;
        state.drawSquareSettings.strokeWidth = styleSettings.strokeWidth;
        state.drawSquareSettings.unit = styleSettings.unit;
    },

    /**
    * Sets the Layer drawn with.
    * @param {Object} state the state of draw-module
    * @param {Object[]} keyList the data to set
    * @returns {void}
    */
    setAttributesKeyList: (state, keyList) => {
        state.attributesKeyList = keyList;
    }
};

export default mutations;
