import {Fill, Style, Text, Stroke} from "ol/style.js";
import {Point} from "ol/geom.js";
import {convertColor} from "@shared/js/utils/convertColor.js";
import {applyStyleFromDrawState} from "./buildStyleFromDrawState.js";

/**
 * Returns a style function that wraps the feature's original style and appends an asterisk (*)
 * as a marker, when a drawing has attributes.
 * @param {Function|Style|null} originalStyle The original OL feature style.
 * @returns {function} A style function returning original styles plus the attribute marker.
 */
export function createMarkerStyleFn (originalStyle) {
    const markerStyle = new Style({
        geometry (feature) {
            const extent = feature.getGeometry().getExtent();

            return new Point([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
        },
        text: new Text({
            font: "bold 32px sans-serif",
            fill: new Fill({color: "#93f105"}),
            stroke: new Stroke({width: 4, color: "#2752d9"}),
            text: "*",
            offsetY: 0
        }),
        zIndex: Infinity
    });

    return (feature, resolution) => {
        let baseStyles;

        if (typeof originalStyle === "function") {
            const s = originalStyle(feature, resolution);

            if (Array.isArray(s)) {
                baseStyles = s;
            }
            else if (s) {
                baseStyles = [s];
            }
            else {
                baseStyles = [];
            }
        }
        else if (originalStyle) {
            baseStyles = [originalStyle];
        }
        else {
            baseStyles = [];
        }
        return [...baseStyles, markerStyle];
    };
}

/**
 * Determines the editable feature type from a feature's stored attributes.
 * Checks both the new pattern (masterportal_attributes.drawState) and legacy
 * flat attributes for backward compatibility.
 * @param {ol/Feature} feature The feature to inspect.
 * @returns {String|null} One of "text", "icon", "point", "line", "polygon", "circle", or null if unknown.
 */
export function getFeatureEditType (feature) {
    if (!feature) {
        return null;
    }

    const drawState = feature.get("masterportal_attributes")?.drawState,
        legacyDrawType = feature.get("drawType");

    if (drawState) {
        const id = drawState.drawType?.id,
            geometry = drawState.drawType?.geometry;

        if (id === "writeText") {
            return "text";
        }
        if (geometry === "Point") {
            if (drawState.symbol?.value && drawState.symbol.value !== "simple_point") {
                return "icon";
            }
            return "point";
        }
        if (geometry === "LineString" || geometry === "MultiLineString") {
            return "line";
        }
        if (geometry === "Polygon" || geometry === "MultiPolygon" || geometry === "Square") {
            return "polygon";
        }
        if (geometry === "Circle") {
            return "circle";
        }
    }

    if (legacyDrawType === "writeText") {
        return "text";
    }

    return null;
}

/**
 * Extracts the current editable style values from a feature's drawState.
 * Returns a flat object with the values that can be bound to UI controls.
 * @param {ol/Feature} feature The feature to read state from.
 * @returns {Object|null} The editable state, or null if unavailable.
 */
export function extractEditableState (feature) {
    if (!feature) {
        return null;
    }

    const drawState = feature.get("masterportal_attributes")?.drawState;

    if (!drawState) {
        return extractLegacyTextState(feature);
    }

    const editType = getFeatureEditType(feature),
        base = {
            strokeWidth: drawState.strokeWidth ?? 1,
            zIndex: drawState.zIndex ?? 0
        };

    switch (editType) {
        case "text":
            return {
                ...base,
                editType,
                text: drawState.text || "",
                fontSize: drawState.fontSize ?? 16,
                font: drawState.font || "Arial",
                fillColor: convertColor((drawState.color || [0, 0, 0, 1]).slice(0, 3), "hex"),
                fillTransparency: Math.round((1 - (drawState.color?.[3] ?? 1)) * 100)
            };
        case "icon":
            return {
                ...base,
                editType,
                iconScale: drawState.symbol?.scale ?? 1
            };
        case "point":
            return {
                ...base,
                editType,
                fillColor: convertColor((drawState.color || [0, 0, 0, 1]).slice(0, 3), "hex"),
                fillTransparency: Math.round((1 - (drawState.color?.[3] ?? 1)) * 100),
                strokeColor: convertColor((drawState.colorContour || [0, 0, 0, 1]).slice(0, 3), "hex"),
                pointSize: drawState.pointSize ?? 16
            };
        case "line":
            return {
                ...base,
                editType,
                strokeColor: convertColor((drawState.colorContour || [0, 0, 0, 1]).slice(0, 3), "hex"),
                strokeTransparency: Math.round((1 - (drawState.colorContour?.[3] ?? 1)) * 100)
            };
        case "polygon":
        case "circle":
            return {
                ...base,
                editType,
                fillColor: convertColor((drawState.color || [0, 0, 0, 1]).slice(0, 3), "hex"),
                fillTransparency: Math.round((1 - (drawState.color?.[3] ?? 1)) * 100),
                strokeColor: convertColor((drawState.colorContour || [0, 0, 0, 1]).slice(0, 3), "hex")
            };
        default:
            return null;
    }
}

/**
 * Applies style changes to a feature by updating its drawState and rebuilding
 * the OL style from drawState.
 * @param {ol/Feature} feature The feature to update.
 * @param {Object} changes Key-value pairs of style properties to change.
 * @returns {void}
 */
export function applyStyleChange (feature, changes) {
    if (!feature) {
        return;
    }

    const attrs = feature.get("masterportal_attributes");

    if (!attrs?.drawState) {
        applyLegacyTextChange(feature, changes);
        return;
    }

    const drawState = {...attrs.drawState},
        editType = getFeatureEditType(feature);

    updateDrawState(drawState, editType, changes);

    const updatedAttrs = {
        ...attrs,
        drawState
    };

    feature.set("masterportal_attributes", updatedAttrs, true);

    applyStyleFromDrawState(feature, drawState);
}

/**
 * Updates the drawState object in-place with the provided changes, converting
 * UI-friendly values (hex colors, transparency percentages) to the internal format.
 * @param {Object} drawState The drawState object to update.
 * @param {String} editType The feature edit type.
 * @param {Object} changes The changes to apply.
 * @returns {void}
 */
function updateDrawState (drawState, editType, changes) {
    if (changes.strokeWidth !== undefined) {
        drawState.strokeWidth = changes.strokeWidth;
    }

    if (editType === "text") {
        updateTextDrawState(drawState, changes);
    }
    else if (editType === "icon") {
        if (changes.iconScale !== undefined && drawState.symbol) {
            drawState.symbol = {...drawState.symbol, scale: changes.iconScale};
        }
    }
    else if (editType === "point") {
        updatePointDrawState(drawState, changes);
    }
    else if (editType === "line") {
        updateLineDrawState(drawState, changes);
    }
    else if (editType === "polygon" || editType === "circle") {
        updatePolygonDrawState(drawState, changes);
    }
}

/**
 * Updates text-specific properties on a drawState.
 * @param {Object} drawState The drawState to update.
 * @param {Object} changes The changes to apply.
 * @returns {void}
 */
function updateTextDrawState (drawState, changes) {
    if (changes.text !== undefined) {
        drawState.text = changes.text;
    }
    if (changes.fontSize !== undefined) {
        drawState.fontSize = changes.fontSize;
    }
    if (changes.font !== undefined) {
        drawState.font = changes.font;
    }
    if (changes.fillColor !== undefined || changes.fillTransparency !== undefined) {
        const rgb = changes.fillColor !== undefined
                ? convertColor(changes.fillColor, "rgb")
                : (drawState.color || [0, 0, 0, 1]).slice(0, 3),
            alpha = changes.fillTransparency !== undefined
                ? 1 - changes.fillTransparency / 100
                : drawState.color?.[3] ?? 1;

        drawState.color = [...rgb, alpha];
    }
}

/**
 * Updates point-specific properties on a drawState.
 * @param {Object} drawState The drawState to update.
 * @param {Object} changes The changes to apply.
 * @returns {void}
 */
function updatePointDrawState (drawState, changes) {
    if (changes.pointSize !== undefined) {
        drawState.pointSize = changes.pointSize;
    }
    if (changes.fillColor !== undefined || changes.fillTransparency !== undefined) {
        const rgb = changes.fillColor !== undefined
                ? convertColor(changes.fillColor, "rgb")
                : (drawState.color || [0, 0, 0, 1]).slice(0, 3),
            alpha = changes.fillTransparency !== undefined
                ? 1 - changes.fillTransparency / 100
                : drawState.color?.[3] ?? 1;

        drawState.color = [...rgb, alpha];
    }
    if (changes.strokeColor !== undefined) {
        drawState.colorContour = [...convertColor(changes.strokeColor, "rgb"), 1];
    }
}

/**
 * Updates line-specific properties on a drawState.
 * @param {Object} drawState The drawState to update.
 * @param {Object} changes The changes to apply.
 * @returns {void}
 */
function updateLineDrawState (drawState, changes) {
    if (changes.strokeColor !== undefined || changes.strokeTransparency !== undefined) {
        const rgb = changes.strokeColor !== undefined
                ? convertColor(changes.strokeColor, "rgb")
                : (drawState.colorContour || [0, 0, 0, 1]).slice(0, 3),
            alpha = changes.strokeTransparency !== undefined
                ? 1 - changes.strokeTransparency / 100
                : drawState.colorContour?.[3] ?? 1;

        drawState.colorContour = [...rgb, alpha];
    }
}

/**
 * Updates polygon/circle-specific properties on a drawState.
 * @param {Object} drawState The drawState to update.
 * @param {Object} changes The changes to apply.
 * @returns {void}
 */
function updatePolygonDrawState (drawState, changes) {
    if (changes.fillColor !== undefined || changes.fillTransparency !== undefined) {
        const rgb = changes.fillColor !== undefined
                ? convertColor(changes.fillColor, "rgb")
                : (drawState.color || [0, 0, 0, 1]).slice(0, 3),
            alpha = changes.fillTransparency !== undefined
                ? 1 - changes.fillTransparency / 100
                : drawState.color?.[3] ?? 1;

        drawState.color = [...rgb, alpha];
    }
    if (changes.strokeColor !== undefined) {
        drawState.colorContour = [...convertColor(changes.strokeColor, "rgb"), 1];
    }
}

/**
 * Extracts editable state from a legacy text feature (flat properties).
 * @param {ol/Feature} feature The feature.
 * @returns {Object|null} The editable state or null.
 */
function extractLegacyTextState (feature) {
    if (feature.get("drawType") !== "writeText") {
        return null;
    }

    const fillColor = feature.get("textFillColor") || [0, 0, 0, 1];

    return {
        editType: "text",
        text: feature.get("textContent") ?? "",
        fontSize: feature.get("textFontSize") ?? 16,
        font: feature.get("textFont") ?? "Arial",
        fillColor: convertColor(fillColor.slice(0, 3), "hex"),
        fillTransparency: Math.round((1 - (fillColor[3] ?? 1)) * 100),
        strokeWidth: 1,
        zIndex: 0
    };
}

/**
 * Applies style changes to a legacy text feature (flat properties).
 * This is a fallback for features that don't have masterportal_attributes.drawState.
 * @param {ol/Feature} feature The feature.
 * @param {Object} changes The changes to apply.
 * @returns {void}
 */
function applyLegacyTextChange (feature, changes) {
    if (feature.get("drawType") !== "writeText") {
        return;
    }

    if (changes.text !== undefined) {
        feature.set("textContent", changes.text);
    }
    if (changes.fontSize !== undefined) {
        feature.set("textFontSize", changes.fontSize);
    }
    if (changes.font !== undefined) {
        feature.set("textFont", changes.font);
    }
    if (changes.fillColor !== undefined || changes.fillTransparency !== undefined) {
        const currentColor = feature.get("textFillColor") || [0, 0, 0, 1],
            rgb = changes.fillColor !== undefined
                ? convertColor(changes.fillColor, "rgb")
                : currentColor.slice(0, 3),
            alpha = changes.fillTransparency !== undefined
                ? 1 - changes.fillTransparency / 100
                : currentColor[3] ?? 1;

        feature.set("textFillColor", [...rgb, alpha]);
    }

    const currentText = feature.get("textContent") ?? "",
        fontSize = feature.get("textFontSize") ?? 16,
        font = feature.get("textFont") ?? "Arial",
        fillColor = feature.get("textFillColor") || [0, 0, 0, 1];

    feature.setStyle(new Style({
        text: new Text({
            text: currentText,
            font: `${fontSize}px ${font}`,
            fill: new Fill({color: fillColor})
        })
    }));
}
