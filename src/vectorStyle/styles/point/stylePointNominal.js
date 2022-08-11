import {createIconPointStyle, createSVGStyle} from "./stylePointIcon";
import PointStyleModel from "./stylePoint";
import {returnColor} from "../../createStyle";

/**
 * Create SVG for nominalscaled circle segments
 * @param  {number} size - size of the section to be drawn
 * @param  {number} circleSegmentsRadius - radius from circlesegment
 * @param  {String} circleSegmentsBackgroundColor - backgroundcolor from circlesegment
 * @param  {number} circleSegmentsStrokeWidth - strokewidth from circlesegment
 * @param  {String} circleSegmentsFillOpacity - opacity from circlesegment
 * @return {String} svg
 */
function createSvgNominalCircleSegments (size, circleSegmentsRadius, circleSegmentsBackgroundColor, circleSegmentsStrokeWidth, circleSegmentsFillOpacity) {
    const halfSize = size / 2;
    let svg = "<svg width='" + size + "'" +
            " height='" + size + "'" +
            " xmlns='http://www.w3.org/2000/svg'" +
            " xmlns:xlink='http://www.w3.org/1999/xlink'>";

    svg = svg + "<circle cx='" + halfSize + "'" +
        " cy='" + halfSize + "'" +
        " r='" + circleSegmentsRadius + "'" +
        " stroke='" + circleSegmentsBackgroundColor + "'" +
        " stroke-width='" + circleSegmentsStrokeWidth + "'" +
        " fill='" + circleSegmentsBackgroundColor + "'" +
        " fill-opacity='" + circleSegmentsFillOpacity + "'/>";

    return svg;
}

/**
 * Fills the object with values
 * @param {object} scalingAttributesAsObject - object with possible attributes as keys and values = 0
 * @param {string} scalingAttribute - actual states from feature
 * @return {Object} scalingObject - contains the states
 */
function fillScalingAttributes (scalingAttributesAsObject, scalingAttribute) {
    const scalingObject = scalingAttributesAsObject === undefined || Object.keys(scalingAttributesAsObject).length === 0
        ? {empty: 0} : scalingAttributesAsObject;
    let states = scalingAttribute;

    if (states === undefined) {
        return scalingObject;
    }

    states = states.split(" | ");

    states.forEach(function (state) {
        if (Object.prototype.hasOwnProperty.call(scalingObject, state)) {
            scalingObject[state] = scalingObject[state] + 1;
        }
        else {
            scalingObject.empty = scalingObject.empty + 1;
        }
    });

    return scalingObject;
}

/**
 * Convert scalingAttributes to object
 * @param {object} scalingValues - contains attribute with color
 * @return {object} scalingAttribute with value 0
 */
function getScalingAttributesAsObject (scalingValues) {
    const obj = {};
    let key;

    if (scalingValues !== undefined) {
        for (key in scalingValues) {
            obj[key] = 0;
        }
    }

    obj.empty = 0;

    return obj;
}

/**
 * Create circle segments
 * @param  {number} startAngelDegree - start with circle segment
 * @param  {number} endAngelDegree - finish with circle segment
 * @param  {number} circleRadius - radius from circle
 * @param  {number} size - size of the window to be draw
 * @param  {number} gap - gap between segments
 * @return {String} all circle segments
 */
function calculateCircleSegment (startAngelDegree, endAngelDegree, circleRadius, size, gap) {
    const rad = Math.PI / 180,
        xy = size / 2,
        isCircle = startAngelDegree === 0 && endAngelDegree === 360,
        endAngelDegreeActual = isCircle ? endAngelDegree / 2 : endAngelDegree,
        gapActual = isCircle ? 0 : gap,
        // convert angle from degree to radiant
        startAngleRad = (startAngelDegree + (gapActual / 2)) * rad,
        endAngleRad = (endAngelDegreeActual - (gapActual / 2)) * rad,
        xStart = xy + (Math.cos(startAngleRad) * circleRadius),
        yStart = xy - (Math.sin(startAngleRad) * circleRadius),
        xEnd = xy + (Math.cos(endAngleRad) * circleRadius),
        yEnd = xy - (Math.sin(endAngleRad) * circleRadius);

    if (isCircle) {
        return [
            "M", xStart, yStart,
            "A", circleRadius, circleRadius, 0, 0, 0, xEnd, yEnd,
            "A", circleRadius, circleRadius, 0, 0, 0, xStart, yStart
        ].join(" ");
    }

    return [
        "M", xStart, yStart,
        "A", circleRadius, circleRadius, 0, 0, 0, xEnd, yEnd
    ].join(" ");
}

/**
 * Extends the SVG with given tags
 * @param  {String} svg - String with svg tags
 * @param  {number} circleSegmentsStrokeWidth strokewidth from circlesegment
 * @param  {String} strokeColor - strokecolor from circlesegment
 * @param  {String} d - circle segment
 * @return {String} extended svg
 */
function extendsSvgNominalCircleSegments (svg, circleSegmentsStrokeWidth, strokeColor, d) {
    return svg + "<path" +
            " fill='none'" +
            " stroke-width='" + circleSegmentsStrokeWidth + "'" +
            " stroke='" + strokeColor + "'" +
            " d='" + d + "'/>";
}

/**
 * Create a svg with colored circle segments by nominal scaling
 * @param  {ol.Feature} feature - feature to be drawn
 * @param {Object} attributes - The attributes from the nominal circle segment
 * @return {String} svg with colored circle segments
 */
function createNominalCircleSegments (feature, attributes) {
    const circleSegmentsRadius = parseFloat(attributes.circleSegmentsRadius, 10),
        circleSegmentsStrokeWidth = parseFloat(attributes.circleSegmentsStrokeWidth, 10),
        circleSegBCArray = attributes.circleSegmentsBackgroundColor,
        circleSegmentsFillOpacity = Array.isArray(circleSegBCArray) && circleSegBCArray[circleSegBCArray.length - 1],
        circleSegmentsBackgroundColor = returnColor(attributes.circleSegmentsBackgroundColor, "hex"),
        scalingValueDefaultColor = returnColor(attributes.scalingValueDefaultColor, "hex"),
        scalingValues = attributes.scalingValues,
        scalingAttributesAsObject = getScalingAttributesAsObject(scalingValues),
        scalingAttribute = feature.get(attributes.scalingAttribute),
        scalingObject = fillScalingAttributes(scalingAttributesAsObject, scalingAttribute),
        totalSegments = Object.values(scalingObject).reduce(function (memo, num) {
            return memo + num;
        }, 0),
        degreeSegment = totalSegments >= 0 ? 360 / totalSegments : 360,
        gap = parseFloat(attributes.circleSegmentsGap, 10);
    let size = 10,
        startAngelDegree = 0,
        endAngelDegree = degreeSegment,
        svg,
        d,
        strokeColor,
        i,
        key,
        value;

    // calculate size
    if (((circleSegmentsRadius + circleSegmentsStrokeWidth) * 2) >= size) {
        size = size + ((circleSegmentsRadius + circleSegmentsStrokeWidth) * 2);
    }

    // is required for the display in the Internet Explorer,
    // because in addition to the SVG and the size must be specified
    PointStyleModel.prototype.setSize(size);

    svg = createSvgNominalCircleSegments(size, circleSegmentsRadius, circleSegmentsBackgroundColor, circleSegmentsStrokeWidth, circleSegmentsFillOpacity);

    for (key in scalingObject) {
        value = scalingObject[key];
        if (scalingValues !== undefined && (key !== "empty")) {
            strokeColor = returnColor(scalingValues[key], "hex");
        }
        else {
            strokeColor = scalingValueDefaultColor;
        }

        // create segments
        for (i = 0; i < value; i++) {

            d = calculateCircleSegment(startAngelDegree, endAngelDegree, circleSegmentsRadius, size, gap);

            svg = extendsSvgNominalCircleSegments(svg, circleSegmentsStrokeWidth, strokeColor, d);

            // set degree for next circular segment
            startAngelDegree = startAngelDegree + degreeSegment;
            endAngelDegree = endAngelDegree + degreeSegment;
        }
    }

    svg = svg + "</svg>";

    return svg;
}

/**
 * create nominal scaled advanced style for pointFeatures
 * @param {Object} feature - the feature to be drawn
 * @param {Object} attributes - The attributes from the nominal point
 * @param {Object} defaultImageName - The image name from the default style
 * @return {ol.Style} style
 */
export function createNominalPointStyle (feature, attributes, defaultImageName) {
    const workingFeature = Array.isArray(feature.get("features")) ? feature.get("features")[0] : feature,
        styleScalingShape = attributes.scalingShape.toUpperCase(),
        imageName = attributes.imageName;

    let svgPath,
        style,
        imageStyle;

    if (styleScalingShape === "CIRCLESEGMENTS") {
        svgPath = createNominalCircleSegments(workingFeature, attributes);
        style = createSVGStyle(svgPath, 5);
    }

    // create style from svg and image
    if (imageName !== defaultImageName) {
        imageStyle = createIconPointStyle(attributes);
        style = [style, imageStyle];
    }

    return style;
}
