import {Circle as CircleStyle, Fill, Icon, Stroke, Style, Text} from "ol/style.js";

/**
 * Builds an OpenLayers Style from a drawState object stored on a feature's
 * masterportal_attributes. This is the single source of truth for reconstructing
 * styles from persisted draw state — used by the draw module, file import, and
 * feature style editing.
 *
 * @param {Object} drawState The drawState object from feature.get("masterportal_attributes").drawState.
 * @param {Object} drawState.drawType The draw type descriptor.
 * @param {String} drawState.drawType.geometry The OL geometry type ("Point", "LineString", "Polygon", "Circle", "Square").
 * @param {Number[]} [drawState.color] The fill color as RGBA array.
 * @param {Number[]} [drawState.colorContour] The stroke/contour color as RGBA array.
 * @param {Number} [drawState.strokeWidth=1] The stroke width in pixels.
 * @param {Number} [drawState.zIndex=0] The z-index for rendering order.
 * @param {Number} [drawState.pointSize=16] The point size (diameter) for simple points.
 * @param {String} [drawState.text] The text content (for writeText features).
 * @param {Number} [drawState.fontSize=16] The font size in pixels (for writeText features).
 * @param {String} [drawState.font="Arial"] The font family (for writeText features).
 * @param {String} [drawState.textAlign="left"] The text alignment (for writeText features).
 * @param {String} [drawState.textBaseline="bottom"] The text baseline (for writeText features).
 * @param {Object} [drawState.symbol] The symbol descriptor (for symbol/icon features).
 * @param {String} [drawState.symbol.value] The symbol identifier or URL path.
 * @param {Number} [drawState.symbol.scale=1] The icon scale factor.
 * @param {String} [drawState.imgPath] The base path for icon images.
 * @param {Number} [drawState.circleRadius] The circle radius (for circle features).
 * @param {Number} [drawState.circleOuterRadius] The outer circle radius (for double circle features).
 * @param {Number[]} [drawState.outerColorContour] The outer circle contour color as RGBA array.
 * @param {Number[]} [drawState.outerColorFill] The outer circle fill color as RGBA array.
 * @returns {ol/style/Style|null} The constructed OL style, or null if drawState is falsy.
 */
export default function buildStyleFromDrawState (drawState) {
    if (!drawState) {
        return null;
    }

    const geometry = drawState.drawType?.geometry,
        strokeWidth = drawState.strokeWidth ?? 1,
        zIndex = drawState.zIndex ?? 0;

    if (geometry === "Point") {
        return buildPointStyle(drawState);
    }
    if (geometry === "LineString" || geometry === "MultiLineString") {
        return buildLineStyle(drawState, strokeWidth, zIndex);
    }
    if (geometry === "Polygon" || geometry === "MultiPolygon") {
        return buildPolygonStyle(drawState, strokeWidth, zIndex);
    }
    if (geometry === "Circle") {
        return buildCircleStyle(drawState, strokeWidth, zIndex);
    }
    if (geometry === "Square") {
        return buildPolygonStyle(drawState, strokeWidth, zIndex);
    }

    return null;
}

/**
 * Applies styles derived from drawState to a feature.
 * Sets the feature's primary style and, for double-circle features,
 * updates the paired outer circle style.
 * @param {ol/Feature} feature The feature to style.
 * @param {Object} drawState The drawState object.
 * @returns {void}
 */
export function applyStyleFromDrawState (feature, drawState) {
    if (!feature || !drawState) {
        return;
    }

    const style = buildStyleFromDrawState(drawState);

    if (style) {
        feature.setStyle(style);
    }

    applyOuterCircleStyle(feature, drawState);
}

/**
 * Builds a style for the outer circle of a double circle feature.
 * @param {Object} drawState The drawState object.
 * @returns {ol/style/Style|null} The outer circle style, or null if not a double circle.
 */
export function buildOuterCircleStyle (drawState) {
    if (!drawState?.circleOuterRadius) {
        return null;
    }

    return new Style({
        stroke: new Stroke({
            color: drawState.outerColorContour || drawState.colorContour,
            width: drawState.strokeWidth ?? 1
        }),
        fill: new Fill({
            color: drawState.outerColorFill || [0, 0, 0, 0]
        }),
        zIndex: drawState.zIndex ?? 0
    });
}

/**
 * Applies the outer circle style to the paired outer circle feature.
 * Looks for the next feature in the source with a matching circleOuterRadius drawState.
 * @param {ol/Feature} innerFeature The inner circle feature.
 * @param {Object} drawState The inner circle drawState (used to find the outer).
 * @returns {void}
 */
function applyOuterCircleStyle (innerFeature, drawState) {
    const outerStyle = buildOuterCircleStyle(drawState);

    if (!outerStyle) {
        return;
    }

    const source = innerFeature.get("_source");

    if (!source) {
        return;
    }

    const features = source.getFeatures(),
        innerIdx = features.indexOf(innerFeature);

    if (innerIdx >= 0 && innerIdx + 1 < features.length) {
        const outerCandidate = features[innerIdx + 1],
            outerAttrs = outerCandidate.get("masterportal_attributes");

        if (outerAttrs?.drawState?.circleOuterRadius) {
            outerCandidate.setStyle(outerStyle);
        }
    }
}

/**
 * Builds a Point style based on the drawState. Handles text features,
 * icon/symbol features, and simple point features.
 * @param {Object} drawState The drawState object.
 * @returns {ol/style/Style} The point style.
 */
function buildPointStyle (drawState) {
    if (drawState.text) {
        return buildTextStyle(drawState);
    }
    if (drawState.symbol?.value && drawState.symbol.value !== "simple_point") {
        return buildIconStyle(drawState);
    }
    return buildSimplePointStyle(drawState);
}

/**
 * Builds a text style for writeText features.
 * @param {Object} drawState The drawState object.
 * @returns {ol/style/Style} The text style.
 */
function buildTextStyle (drawState) {
    const fontSize = drawState.fontSize ?? 16,
        font = drawState.font || "Arial",
        fontString = `${fontSize}px ${font}`;

    return new Style({
        image: new CircleStyle({
            radius: 0
        }),
        text: new Text({
            text: drawState.text,
            font: fontString,
            fill: new Fill({
                color: drawState.color || [0, 0, 0, 1]
            }),
            textAlign: drawState.textAlign || "left",
            textBaseline: drawState.textBaseline || "bottom"
        }),
        zIndex: drawState.zIndex ?? 0
    });
}

/**
 * Builds an icon style for symbol features.
 * @param {Object} drawState The drawState object.
 * @returns {ol/style/Style} The icon style.
 */
function buildIconStyle (drawState) {
    const symbolValue = drawState.symbol.value,
        imgPath = drawState.imgPath || "",
        src = symbolValue.indexOf("/") > 0 ? symbolValue : imgPath + symbolValue;

    return new Style({
        image: new Icon({
            crossOrigin: "anonymous",
            src: src,
            scale: drawState.symbol.scale ?? 1,
            anchor: [0.5, 1]
        }),
        zIndex: drawState.zIndex ?? 0
    });
}

/**
 * Builds a simple point (circle marker) style.
 * @param {Object} drawState The drawState object.
 * @returns {ol/style/Style} The simple point style.
 */
function buildSimplePointStyle (drawState) {
    const pointSize = drawState.pointSize ?? 16,
        color = drawState.color || [0, 0, 0, 1],
        colorContour = drawState.colorContour || color,
        strokeWidth = drawState.strokeWidth ?? 1;

    return new Style({
        image: new CircleStyle({
            radius: pointSize / 2,
            fill: new Fill({color: color}),
            stroke: strokeWidth > 0 ? new Stroke({color: colorContour, width: strokeWidth}) : undefined
        }),
        zIndex: drawState.zIndex ?? 0
    });
}

/**
 * Builds a line style for LineString/MultiLineString features.
 * @param {Object} drawState The drawState object.
 * @param {Number} strokeWidth The stroke width.
 * @param {Number} zIndex The z-index.
 * @returns {ol/style/Style} The line style.
 */
function buildLineStyle (drawState, strokeWidth, zIndex) {
    return new Style({
        stroke: new Stroke({
            color: drawState.colorContour || [0, 0, 0, 1],
            width: strokeWidth
        }),
        zIndex: zIndex
    });
}

/**
 * Builds a polygon style for Polygon/MultiPolygon/Square features.
 * @param {Object} drawState The drawState object.
 * @param {Number} strokeWidth The stroke width.
 * @param {Number} zIndex The z-index.
 * @returns {ol/style/Style} The polygon style.
 */
function buildPolygonStyle (drawState, strokeWidth, zIndex) {
    return new Style({
        stroke: new Stroke({
            color: drawState.colorContour || [0, 0, 0, 1],
            width: strokeWidth
        }),
        fill: new Fill({
            color: drawState.color || [0, 0, 0, 0]
        }),
        zIndex: zIndex
    });
}

/**
 * Builds a circle geometry style.
 * @param {Object} drawState The drawState object.
 * @param {Number} strokeWidth The stroke width.
 * @param {Number} zIndex The z-index.
 * @returns {ol/style/Style} The circle style.
 */
function buildCircleStyle (drawState, strokeWidth, zIndex) {
    return new Style({
        stroke: new Stroke({
            color: drawState.colorContour || [0, 0, 0, 1],
            width: strokeWidth
        }),
        fill: new Fill({
            color: drawState.color || [0, 0, 0, 0]
        }),
        zIndex: zIndex
    });
}
