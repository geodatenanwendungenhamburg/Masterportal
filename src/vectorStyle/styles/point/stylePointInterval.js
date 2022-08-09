/**
 * Calculate size for intervalscaled circle bar
 * @param  {number} stateValue - value from feature
 * @param  {number} circleBarScalingFactor - factor is multiplied by the stateValue
 * @param  {number} circleBarLineStroke - stroke from bar
 * @param  {number} circleBarRadius - radius from point
 * @return {number} size - size of the section to be drawn
 */
function calculateSizeIntervalCircleBar (stateValue, circleBarScalingFactor, circleBarLineStroke, circleBarRadius) {
    let size = circleBarRadius * 2;

    if (((stateValue * circleBarScalingFactor) + circleBarLineStroke) >= size) {
        size = size + (stateValue * circleBarScalingFactor) + circleBarLineStroke;
    }

    return size;
}

/**
 * Calculate the length for the bar
 * @param  {number} size - size of the section to be drawn
 * @param  {number} circleBarRadius - radius from point
 * @param  {number} stateValue - value from feature
 * @param  {number} circleBarScalingFactor - factor is multiplied by the stateValue
 * @return {number} barLength
 */
function calculateLengthIntervalCircleBar (size, circleBarRadius, stateValue, circleBarScalingFactor) {
    let barLength;

    if (stateValue >= 0) {
        barLength = (size / 2) - circleBarRadius - (stateValue * circleBarScalingFactor);
    }
    else if (stateValue < 0) {
        barLength = (size / 2) + circleBarRadius - (stateValue * circleBarScalingFactor);
    }
    else {
        barLength = 0;
    }

    return barLength;
}

/**
 * Create SVG for intervalscaled circle bars
 * @param  {number} size - size of the section to be drawn
 * @param  {number} barLength - length from bar
 * @param  {String} circleBarCircleFillColor - fill color from circle
 * @param  {String} circleBarCircleStrokeColor - stroke color from circle
 * @param  {number} circleBarCircleStrokeWidth - stroke width from circle
 * @param  {String} circleBarLineStrokeColor - stroke color from bar
 * @param  {number} circleBarLineStroke - stroke from bar
 * @param  {number} circleBarRadius - radius from point
 * @return {String} svg
 */
// TODO: Klärung wegen eslint
// eslint-disable-next-line max-params
function createSvgIntervalCircleBar (size, barLength, circleBarCircleFillColor, circleBarCircleStrokeColor, circleBarCircleStrokeWidth, circleBarLineStrokeColor, circleBarLineStroke, circleBarRadius) {
    let svg = "<svg width='" + size + "'" +
                " height='" + size + "'" +
                " xmlns='http://www.w3.org/2000/svg'" +
                " xmlns:xlink='http://www.w3.org/1999/xlink'>";

    // draw bar
    svg = svg + "<line x1='" + (size / 2) + "'" +
            " y1='" + (size / 2) + "'" +
            " x2='" + (size / 2) + "'" +
            " y2='" + barLength + "'" +
            " stroke='" + circleBarLineStrokeColor + "'" +
            " stroke-width='" + circleBarLineStroke + "' />";

    // draw circle
    svg = svg + "<circle cx='" + (size / 2) + "'" +
            " cy='" + (size / 2) + "'" +
            " r='" + circleBarRadius + "'" +
            " stroke='" + circleBarCircleStrokeColor + "'" +
            " stroke-width='" + circleBarCircleStrokeWidth + "'" +
            " fill='" + circleBarCircleFillColor + "' />";
    svg = svg + "</svg>";

    return svg;
}

/**
 * Create interval circle bar
 * @param  {ol.Feature} feature - contains features to draw
 * @return {String} svg
 */
function createIntervalCircleBar (feature) {
    const circleBarScalingFactor = parseFloat(this.get("circleBarScalingFactor")),
        circleBarRadius = parseFloat(this.get("circleBarRadius"), 10),
        circleBarLineStroke = parseFloat(this.get("circleBarLineStroke"), 10),
        circleBarCircleFillColor = this.returnColor(this.get("circleBarCircleFillColor"), "hex"),
        circleBarCircleStrokeColor = this.returnColor(this.get("circleBarCircleStrokeColor"), "hex"),
        circleBarCircleStrokeWidth = this.get("circleBarCircleStrokeWidth"),
        circleBarLineStrokeColor = this.returnColor(this.get("circleBarLineStrokeColor"), "hex"),
        featureProperties = feature.getProperties(),
        preparedField = this.prepareField(featureProperties, this.get("scalingAttribute")),
        scalingAttribute = preparedField === "undefined" ? undefined : preparedField,
        stateValue = scalingAttribute !== undefined && scalingAttribute.indexOf(" ") !== -1 ? scalingAttribute.split(" ")[0] : scalingAttribute,
        size = calculateSizeIntervalCircleBar(stateValue, circleBarScalingFactor, circleBarLineStroke, circleBarRadius),
        barLength = calculateLengthIntervalCircleBar(size, circleBarRadius, stateValue, circleBarScalingFactor);

    this.setSize(size);

    // create svg
    return createSvgIntervalCircleBar(size, barLength, circleBarCircleFillColor, circleBarCircleStrokeColor, circleBarCircleStrokeWidth, circleBarLineStrokeColor, circleBarLineStroke, circleBarRadius);
}

/**
 * create interval scaled advanced style for pointFeatures
 * @return {ol.Style} style
 */
export function createIntervalPointStyle () {
    const feature = this.get("feature"),
        styleScalingShape = this.get("scalingShape").toUpperCase(),
        svgPath = styleScalingShape === "CIRCLE_BAR" ? createIntervalCircleBar(feature) : "";

    return this.createSVGStyle(svgPath);
}