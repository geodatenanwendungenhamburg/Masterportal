import {convertColor} from "@shared/js/utils/convertColor.js";

/**
 * Static mapping of layout keys to their applicable draw types and icons.
 * Used by DrawLayout to determine which layout buttons are shown for a given draw type.
 * @type {Object<string, {drawTypes: string[], icon: string}>}
 */
export const mappingLayoutConfig = {
    fillColor: {
        drawTypes: ["box", "circle", "doubleCircle", "polygon", "rectangle", "writeText", "square"],
        icon: "bi-paint-bucket"
    },
    strokeColor: {
        drawTypes: ["box", "circle", "doubleCircle", "line", "pen", "polygon", "rectangle", "square"],
        icon: "bi-pencil-fill"
    },
    strokeWidth: {
        drawTypes: ["box", "circle", "doubleCircle", "line", "pen", "polygon", "rectangle", "square"],
        icon: "bi-border-width"
    },
    fillTransparency: {
        drawTypes: ["box", "circle", "doubleCircle", "polygon", "rectangle", "writeText", "pen", "line", "square"],
        icon: "bi-droplet-half"
    }
};

/**
 * Filters the mapping layout to only include entries whose drawTypes contain the given selectedDrawType.
 * @param {Object<string, {drawTypes: string[], icon: string}>} mappingLayout The full mapping layout object.
 * @param {String} selectedDrawType The currently selected draw type.
 * @returns {Object<string, {drawTypes: string[], icon: string}>} The filtered mapping layout.
 */
export function filterMappingLayoutByDrawType (mappingLayout, selectedDrawType) {
    const filtered = {};

    Object.keys(mappingLayout).forEach(layout => {
        if (mappingLayout[layout]?.drawTypes?.includes(selectedDrawType)) {
            filtered[layout] = mappingLayout[layout];
        }
    });

    return filtered;
}

/**
 * Normalizes a layout value based on its key.
 * Color values are converted to RGB arrays, text and font are kept as strings,
 * fontSize is parsed as integer, and all other values are parsed as floats.
 * @param {String} layoutKey The layout property key (e.g. "fillColor", "strokeWidth", "text").
 * @param {String|Number} value The raw value to normalize.
 * @returns {Number[]|String|Number} The normalized value appropriate for the layout key.
 */
export function normalizeLayoutValue (layoutKey, value) {
    if (layoutKey === "fillColor" || layoutKey === "strokeColor") {
        return convertColor(value, "rgb");
    }
    if (layoutKey === "text" || layoutKey === "font") {
        return value;
    }
    if (layoutKey === "fontSize") {
        return parseInt(value, 10);
    }
    return parseFloat(value);
}

/**
 * Calculates the horizontal center position of a button element relative to a container element.
 * Used to position a triangle indicator below the active draw type button.
 * @param {String} buttonId The DOM id of the button element.
 * @param {String} containerId The DOM id of the container element.
 * @returns {Number|null} The horizontal pixel offset of the button center relative to the container, or null if elements are not found.
 */
export function calculateTrianglePosition (buttonId, containerId) {
    const containerElement = document.getElementById(containerId),
        buttonElement = document.getElementById(buttonId);

    if (buttonElement && containerElement) {
        const buttonRect = buttonElement.getBoundingClientRect(),
            containerRect = containerElement.getBoundingClientRect();

        return buttonRect.x + buttonRect.width / 2 - containerRect.x;
    }
    return null;
}
