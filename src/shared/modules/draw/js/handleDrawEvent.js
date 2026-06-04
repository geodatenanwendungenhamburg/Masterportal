import store from "@appstore/index.js";

/**
 * Draw type configuration mapping selectedDrawType to the corresponding
 * drawType object with id and geometry properties.
 * @type {Object<string, {id: string, geometry: string}>}
 */
const drawTypeConfig = {
    line: {id: "drawLine", geometry: "LineString"},
    pen: {id: "drawCurve", geometry: "LineString"},
    circle: {id: "drawCircle", geometry: "Circle"},
    doubleCircle: {id: "drawCircle", geometry: "Circle"},
    writeText: {id: "writeText", geometry: "Point"},
    point: {id: "drawSymbol", geometry: "Point"},
    box: {id: "drawArea", geometry: "Polygon"},
    polygon: {id: "drawArea", geometry: "Polygon"},
    square: {id: "drawSquare", geometry: "Square"}
};

/**
 * Computes color arrays for the drawn feature based on the current layout.
 * For line types, only the contour color is set (with fill transparency applied).
 * For all other types, contour, fill color, and opacity are returned.
 * @param {Object} layout The current layout from the draw state.
 * @param {number[]} layout.strokeColor RGB color array for the stroke.
 * @param {number[]} layout.fillColor RGB color array for the fill.
 * @param {number} layout.fillTransparency Fill transparency as a percentage (0–100).
 * @param {boolean} isLineType Whether the draw type is a line type ("line" or "pen").
 * @returns {Object} An object containing colorContour and optionally color and opacity.
 */
export function buildColors (layout, isLineType) {
    const fillTransparency = layout.fillTransparency / 100;

    if (isLineType) {
        return {
            colorContour: [...layout.strokeColor, 1 - fillTransparency]
        };
    }
    return {
        colorContour: [...layout.strokeColor, 1],
        color: [...layout.fillColor, 1 - fillTransparency],
        opacity: fillTransparency
    };
}

/**
 * Collects type-specific draw state properties that vary per selectedDrawType.
 * @param {string} selectedDrawType The currently selected draw type.
 * @param {Object} stateDrawCopy Deep copy of the draw store state.
 * @returns {Object} Additional draw state properties for the given type.
 */
export function getTypeSpecificProperties (selectedDrawType, stateDrawCopy) {
    switch (selectedDrawType) {
        case "line":
            return {lineLength: stateDrawCopy.currentLayout.lineLength};
        case "circle":
            return {circleRadius: stateDrawCopy.circleOptions.innerRadius};
        case "doubleCircle":
            return {
                circleRadius: stateDrawCopy.circleOptions.innerRadius,
                circleOuterRadius: stateDrawCopy.circleOptions.outerRadius,
                outerColorContour: [...stateDrawCopy.currentLayoutOuterCircle.strokeColor, 1],
                outerColorFill: [...stateDrawCopy.currentLayoutOuterCircle.fillColor, 1 - stateDrawCopy.currentLayoutOuterCircle.fillTransparency / 100]
            };
        case "writeText":
            return {
                font: stateDrawCopy.currentLayout.font,
                fontSize: stateDrawCopy.currentLayout.fontSize,
                text: stateDrawCopy.currentLayout.text
            };
        case "point":
            return {
                pointSize: 16,
                symbol: {value: "simple_point", scale: 1}
            };
        default: {
            const selectedSymbol = stateDrawCopy.selectedSymbol;

            if (selectedSymbol) {
                return {
                    pointSize: selectedSymbol.type === "simple_point" ? 16 : undefined,
                    symbol: {
                        value: selectedSymbol.value,
                        scale: selectedSymbol.scale || 1
                    }
                };
            }
            return {};
        }
    }
}

/**
 * Handles the drawend event of the draw interaction.
 * Reads the current draw state from the store and writes a complete
 * "masterportal_attributes" object onto the drawn feature, including
 * style configuration, geometry type mapping, and color settings.
 * @module shared/modules/draw/js/handleDrawEvent
 * @param {module:ol/interaction/Draw~DrawEvent} event The draw interaction event containing the drawn feature.
 * @returns {void}
 */
export default function handleDrawEvent (event) {
    const stateDrawCopy = JSON.parse(JSON.stringify(store.state.Modules.Draw)),
        {selectedDrawType, idCounter, currentLayout} = stateDrawCopy,
        isLineType = ["line", "pen"].includes(selectedDrawType),
        geometry = event.feature.getGeometry(),
        drawState = {
            drawType: drawTypeConfig[selectedDrawType] || {id: "drawSymbol", geometry: "Point"},
            imgPath: Config.wfsImgPath,
            zIndex: selectedDrawType === "doubleCircle" ? idCounter + 1 : idCounter,
            strokeWidth: currentLayout.strokeWidth,
            ...buildColors(currentLayout, isLineType),
            ...getTypeSpecificProperties(selectedDrawType, stateDrawCopy)
        },
        attributes = {
            ...event.feature.get("masterportal_attributes"),
            fromDrawTool: true,
            styleId: selectedDrawType === "doubleCircle" ? idCounter + 2 : idCounter + 1,
            drawState
        };

    if (geometry.getType() === "Polygon" && selectedDrawType === "square") {
        attributes.isSquare = true;
        attributes.squareCoords = geometry.getCoordinates()[0];
    }

    event.feature.set("masterportal_attributes", attributes, false);
}
