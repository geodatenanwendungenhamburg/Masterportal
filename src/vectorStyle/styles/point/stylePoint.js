import StyleModel from "../style";
import {createIconPointStyle, createIconClusterStyle} from "./stylePointIcon";
import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";
import defaultStyle from "../../defaultStyle";

class PointStyleModel extends StyleModel {
    constructor () {
        super();
        this.attributes = {...defaultStyle.point};
    }

    initialize (feature, styles, isClustered, wfsImgPathFromConfig) {
        if (wfsImgPathFromConfig !== undefined) {
            this.imagePath = wfsImgPathFromConfig;
        }
        else {
            console.warn("wfsImgPath at Config.js is not defined");
        }
        this.setFeature(feature);
        this.setIsClustered(isClustered);
        this.overwriteStyling(styles);
    }

    /**
    * This function returns a style for each feature.
    * @returns {ol/style} - The created style.
    */
    getStyle () {
        const type = this.attributes.type.toLowerCase(),
            isClustered = this.isClustered,
            feature = this.feature;

        if (isClustered && feature.get("features")?.length > 1) {
            if (this.get("clusterType") === "circle") {
                return this.createCircleClusterStyle();
            }
            else if (this.get("clusterType") === "icon") {
                return createIconClusterStyle(this.attributes);
            }
        }

        if (type === "icon") {
            return createIconPointStyle(this.attributes);
        }
        else if (type === "circle") {
            return this.createCirclePointStyle();
        }
        else if (type === "nominal") {
            return this.createNominalPointStyle();
        }
        else if (type === "interval") {
            return this.createIntervalPointStyle();
        }

        return new Style();
    }

    // /**
    // * Creates circleClusterStyle.
    // * all clustered features get same circle.
    // * @returns {ol/style} - The created style.
    // */
    // createCircleClusterStyle () {
    //     const radius = parseFloat(this.get("clusterCircleRadius"), 10),
    //         fillcolor = this.returnColor(this.get("clusterCircleFillColor"), "rgb"),
    //         strokecolor = this.returnColor(this.get("clusterCircleStrokeColor"), "rgb"),
    //         strokewidth = parseFloat(this.get("clusterCircleStrokeWidth"), 10);

    //     return new Style({
    //         image: new CircleStyle({
    //             radius: radius,
    //             fill: new Fill({
    //                 color: fillcolor
    //             }),
    //             stroke: new Stroke({
    //                 color: strokecolor,
    //                 width: strokewidth
    //             })
    //         })
    //     });
    // }

    /**
    * Creates circlePointStyle.
    * all features get same circle.
    * @returns {ol/style} - The created style.
    */
    createCirclePointStyle () {
        const radius = parseFloat(this.attributes.circleRadius, 10),
            fillcolor = this.returnColor(this.attributes.circleFillColor, "rgb"),
            strokecolor = this.returnColor(this.attributes.circleStrokeColor, "rgb"),
            strokewidth = parseFloat(this.attributes.circleStrokeWidth, 10);

        return new Style({
            image: new CircleStyle({
                radius: radius,
                fill: new Fill({
                    color: fillcolor
                }),
                stroke: new Stroke({
                    color: strokecolor,
                    width: strokewidth
                })
            })
        });
    }

    // /**
    //  * create nominal scaled advanced style for pointFeatures
    //  * @return {ol.Style} style
    //  */
    // createNominalPointStyle () {
    //     const feature = this.get("feature"),
    //         workingFeature = Array.isArray(feature.get("features")) ? feature.get("features")[0] : feature,
    //         styleScalingShape = this.get("scalingShape").toUpperCase(),
    //         imageName = this.get("imageName"),
    //         imageNameDefault = this.attributes.imageName;

    //     let svgPath,
    //         style,
    //         imageStyle;

    //     if (styleScalingShape === "CIRCLESEGMENTS") {
    //         svgPath = this.createNominalCircleSegments(workingFeature);
    //         style = this.createSVGStyle(svgPath);
    //     }

    //     // create style from svg and image
    //     if (imageName !== imageNameDefault) {
    //         imageStyle = createIconPointStyle();
    //         style = [style, imageStyle];
    //     }

    //     return style;
    // }

    // /**
    //  * create interval scaled advanced style for pointFeatures
    //  * @return {ol.Style} style
    //  */
    // createIntervalPointStyle () {
    //     const feature = this.get("feature"),
    //         styleScalingShape = this.get("scalingShape").toUpperCase(),
    //         svgPath = styleScalingShape === "CIRCLE_BAR" ? this.createIntervalCircleBar(feature) : "";

    //     return this.createSVGStyle(svgPath);
    // }

    // /**
    //  * create Style for SVG
    //  * @param  {String} svgPath - contains the params to be draw
    //  * @see {@link https://community.cesium.com/t/cors-and-billboard-image/3920/2} crossOrigin: "anonymous", is necessary for the 3D mode.
    //  * @return {ol.Style} style
    //  */
    // createSVGStyle (svgPath) {
    //     const size = this.get("size");

    //     return new Style({
    //         image: new Icon({
    //             crossOrigin: "anonymous",
    //             src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgPath),
    //             imgSize: [size, size]
    //         })
    //     });
    // }

    /**
    * Returns input color to destinated color.
    * possible values for dest are "rgb" and "hex".
    * color has to come as hex (e.g. "#ffffff" || "#fff") or as array (e.g [255,255,255,0]) or as String ("[255,255,255,0]")
    * @param {Number[]|String} color The color to return.
    * @param {String} dest Destination color type.
    * @returns {String|Number[]} - The converted color.
    */
    returnColor (color, dest) {
        let src,
            newColor = color,
            pArray = [];

        if (Array.isArray(newColor)) {
            src = "rgb";
        }
        else if (typeof newColor === "string" && newColor.indexOf("#") === 0) {
            src = "hex";
        }
        else if (typeof newColor === "string" && newColor.indexOf("#") === -1) {
            src = "rgb";

            pArray = newColor.replace("[", "").replace("]", "").replace(/ /g, "").split(",");
            newColor = [
                pArray[0], pArray[1], pArray[2], pArray[3]
            ];
        }

        if (src === "hex" && dest === "rgb") {
            newColor = this.hexToRgb(newColor);
        }
        else if (src === "rgb" && dest === "hex") {
            newColor = this.rgbToHex(newColor[0], newColor[1], newColor[2]);
        }

        newColor = dest === "rgb" ? this.normalizeRgbColor(newColor) : newColor;

        return newColor;
    }
    /**
     * Converts rgb to hex.
     * @param {Number} r Red value.
     * @param {Number} g Green Value.
     * @param {Number} b Blue value.
     * @returns {String} - Hex color string.
     */
    rgbToHex (r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    /**
     * Converts number to hex string.
     * @param {Number} c Color value as number.
     * @returns {String} - Converted color number as hex string.
     */
    componentToHex (c) {
        const hex = c.toString(16);

        return hex.length === 1 ? "0" + hex : hex;
    }

    /**
     * Converts hex value to rgbarray.
     * @param {String} hex Color as hex string.
     * @returns {Number[]} - Color als rgb array.
     */
    hexToRgb (hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            hexReplace = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });
        let result;

        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
        result = result.exec(hexReplace);

        return result ? [parseFloat(result[1], 16), parseFloat(result[2], 16), parseFloat(result[3], 16)] : null;
    }

    /**
     * Makes sure that one rgb color always consists of four values
     * @param {array} newColor Color in rgb
     * @return {array} normColor
     */
    normalizeRgbColor (newColor) {
        const defaultArray = [1, 1, 1, 1];

        return newColor.concat(defaultArray).slice(0, 4);
    }

    // /**
    //  * Create a svg with colored circle segments by nominal scaling
    //  * @param  {ol.Feature} feature - feature to be draw
    //  * @return {String} svg with colored circle segments
    //  */
    // createNominalCircleSegments (feature) {
    //     const circleSegmentsRadius = parseFloat(this.get("circleSegmentsRadius"), 10),
    //         circleSegmentsStrokeWidth = parseFloat(this.get("circleSegmentsStrokeWidth"), 10),
    //         circleSegBCArray = this.get("circleSegmentsBackgroundColor"),
    //         circleSegmentsFillOpacity = Array.isArray(circleSegBCArray) && circleSegBCArray[circleSegBCArray.length - 1],
    //         circleSegmentsBackgroundColor = this.returnColor(this.get("circleSegmentsBackgroundColor"), "hex"),
    //         scalingValueDefaultColor = this.returnColor(this.get("scalingValueDefaultColor"), "hex"),
    //         scalingValues = this.get("scalingValues"),
    //         scalingAttributesAsObject = this.getScalingAttributesAsObject(scalingValues),
    //         scalingAttribute = feature.get(this.get("scalingAttribute")),
    //         scalingObject = this.fillScalingAttributes(scalingAttributesAsObject, scalingAttribute),
    //         totalSegments = Object.values(scalingObject).reduce(function (memo, num) {
    //             return memo + num;
    //         }, 0),
    //         degreeSegment = totalSegments >= 0 ? 360 / totalSegments : 360,
    //         gap = parseFloat(this.get("circleSegmentsGap"), 10);
    //     let size = 10,
    //         startAngelDegree = 0,
    //         endAngelDegree = degreeSegment,
    //         svg,
    //         d,
    //         strokeColor,
    //         i,
    //         key,
    //         value;

    //     // calculate size
    //     if (((circleSegmentsRadius + circleSegmentsStrokeWidth) * 2) >= size) {
    //         size = size + ((circleSegmentsRadius + circleSegmentsStrokeWidth) * 2);
    //     }

    //     // is required for the display in the Internet Explorer,
    //     // because in addition to the SVG and the size must be specified
    //     this.setSize(size);

    //     svg = this.createSvgNominalCircleSegments(size, circleSegmentsRadius, circleSegmentsBackgroundColor, circleSegmentsStrokeWidth, circleSegmentsFillOpacity);

    //     for (key in scalingObject) {
    //         value = scalingObject[key];
    //         if (scalingValues !== undefined && (key !== "empty")) {
    //             strokeColor = this.returnColor(scalingValues[key], "hex");
    //         }
    //         else {
    //             strokeColor = scalingValueDefaultColor;
    //         }

    //         // create segments
    //         for (i = 0; i < value; i++) {

    //             d = this.calculateCircleSegment(startAngelDegree, endAngelDegree, circleSegmentsRadius, size, gap);

    //             svg = this.extendsSvgNominalCircleSegments(svg, circleSegmentsStrokeWidth, strokeColor, d);

    //             // set degree for next circular segment
    //             startAngelDegree = startAngelDegree + degreeSegment;
    //             endAngelDegree = endAngelDegree + degreeSegment;
    //         }
    //     }

    //     svg = svg + "</svg>";

    //     return svg;
    // }

    // /**
    //  * Fills the object with values
    //  * @param {object} scalingAttributesAsObject - object with possible attributes as keys and values = 0
    //  * @param {string} scalingAttribute - actual states from feature
    //  * @return {Object} scalingObject - contains the states
    //  */
    // fillScalingAttributes (scalingAttributesAsObject, scalingAttribute) {
    //     const scalingObject = scalingAttributesAsObject === undefined || Object.keys(scalingAttributesAsObject).length === 0
    //         ? {empty: 0} : scalingAttributesAsObject;
    //     let states = scalingAttribute;

    //     if (states === undefined) {
    //         return scalingObject;
    //     }

    //     states = states.split(" | ");

    //     states.forEach(function (state) {
    //         if (Object.prototype.hasOwnProperty.call(scalingObject, state)) {
    //             scalingObject[state] = scalingObject[state] + 1;
    //         }
    //         else {
    //             scalingObject.empty = scalingObject.empty + 1;
    //         }
    //     });

    //     return scalingObject;
    // }

    // /**
    //  * Convert scalingAttributes to object
    //  * @param {object} scalingValues - contains attribute with color
    //  * @return {object} scalingAttribute with value 0
    //  */
    // getScalingAttributesAsObject (scalingValues) {
    //     const obj = {};
    //     let key;

    //     if (scalingValues !== undefined) {
    //         for (key in scalingValues) {
    //             obj[key] = 0;
    //         }
    //     }

    //     obj.empty = 0;

    //     return obj;
    // }

    // /**
    //  * Create SVG for nominalscaled circle segments
    //  * @param  {number} size - size of the section to be drawn
    //  * @param  {number} circleSegmentsRadius - radius from circlesegment
    //  * @param  {String} circleSegmentsBackgroundColor - backgroundcolor from circlesegment
    //  * @param  {number} circleSegmentsStrokeWidth - strokewidth from circlesegment
    //  * @param  {String} circleSegmentsFillOpacity - opacity from circlesegment
    //  * @return {String} svg
    //  */
    // createSvgNominalCircleSegments (size, circleSegmentsRadius, circleSegmentsBackgroundColor, circleSegmentsStrokeWidth, circleSegmentsFillOpacity) {
    //     const halfSize = size / 2;
    //     let svg = "<svg width='" + size + "'" +
    //             " height='" + size + "'" +
    //             " xmlns='http://www.w3.org/2000/svg'" +
    //             " xmlns:xlink='http://www.w3.org/1999/xlink'>";

    //     svg = svg + "<circle cx='" + halfSize + "'" +
    //         " cy='" + halfSize + "'" +
    //         " r='" + circleSegmentsRadius + "'" +
    //         " stroke='" + circleSegmentsBackgroundColor + "'" +
    //         " stroke-width='" + circleSegmentsStrokeWidth + "'" +
    //         " fill='" + circleSegmentsBackgroundColor + "'" +
    //         " fill-opacity='" + circleSegmentsFillOpacity + "'/>";

    //     return svg;
    // }

    // /**
    //  * Extends the SVG with given tags
    //  * @param  {String} svg - String with svg tags
    //  * @param  {number} circleSegmentsStrokeWidth strokewidth from circlesegment
    //  * @param  {String} strokeColor - strokecolor from circlesegment
    //  * @param  {String} d - circle segment
    //  * @return {String} extended svg
    //  */
    // extendsSvgNominalCircleSegments (svg, circleSegmentsStrokeWidth, strokeColor, d) {
    //     return svg + "<path" +
    //         " fill='none'" +
    //         " stroke-width='" + circleSegmentsStrokeWidth + "'" +
    //         " stroke='" + strokeColor + "'" +
    //         " d='" + d + "'/>";
    // }

    // /**
    //  * Create circle segments
    //  * @param  {number} startAngelDegree - start with circle segment
    //  * @param  {number} endAngelDegree - finish with circle segment
    //  * @param  {number} circleRadius - radius from circle
    //  * @param  {number} size - size of the window to be draw
    //  * @param  {number} gap - gap between segments
    //  * @return {String} all circle segments
    //  */
    // calculateCircleSegment (startAngelDegree, endAngelDegree, circleRadius, size, gap) {
    //     const rad = Math.PI / 180,
    //         xy = size / 2,
    //         isCircle = startAngelDegree === 0 && endAngelDegree === 360,
    //         endAngelDegreeActual = isCircle ? endAngelDegree / 2 : endAngelDegree,
    //         gapActual = isCircle ? 0 : gap,
    //         // convert angle from degree to radiant
    //         startAngleRad = (startAngelDegree + (gapActual / 2)) * rad,
    //         endAngleRad = (endAngelDegreeActual - (gapActual / 2)) * rad,
    //         xStart = xy + (Math.cos(startAngleRad) * circleRadius),
    //         yStart = xy - (Math.sin(startAngleRad) * circleRadius),
    //         xEnd = xy + (Math.cos(endAngleRad) * circleRadius),
    //         yEnd = xy - (Math.sin(endAngleRad) * circleRadius);

    //     if (isCircle) {
    //         return [
    //             "M", xStart, yStart,
    //             "A", circleRadius, circleRadius, 0, 0, 0, xEnd, yEnd,
    //             "A", circleRadius, circleRadius, 0, 0, 0, xStart, yStart
    //         ].join(" ");
    //     }

    //     return [
    //         "M", xStart, yStart,
    //         "A", circleRadius, circleRadius, 0, 0, 0, xEnd, yEnd
    //     ].join(" ");
    // }

    // /**
    //  * Create interval circle bar
    //  * @param  {ol.Feature} feature - contains features to draw
    //  * @return {String} svg
    //  */
    // createIntervalCircleBar (feature) {
    //     const circleBarScalingFactor = parseFloat(this.get("circleBarScalingFactor")),
    //         circleBarRadius = parseFloat(this.get("circleBarRadius"), 10),
    //         circleBarLineStroke = parseFloat(this.get("circleBarLineStroke"), 10),
    //         circleBarCircleFillColor = this.returnColor(this.get("circleBarCircleFillColor"), "hex"),
    //         circleBarCircleStrokeColor = this.returnColor(this.get("circleBarCircleStrokeColor"), "hex"),
    //         circleBarCircleStrokeWidth = this.get("circleBarCircleStrokeWidth"),
    //         circleBarLineStrokeColor = this.returnColor(this.get("circleBarLineStrokeColor"), "hex"),
    //         featureProperties = feature.getProperties(),
    //         preparedField = this.prepareField(featureProperties, this.get("scalingAttribute")),
    //         scalingAttribute = preparedField === "undefined" ? undefined : preparedField,
    //         stateValue = scalingAttribute !== undefined && scalingAttribute.indexOf(" ") !== -1 ? scalingAttribute.split(" ")[0] : scalingAttribute,
    //         size = this.calculateSizeIntervalCircleBar(stateValue, circleBarScalingFactor, circleBarLineStroke, circleBarRadius),
    //         barLength = this.calculateLengthIntervalCircleBar(size, circleBarRadius, stateValue, circleBarScalingFactor);

    //     this.setSize(size);

    //     // create svg
    //     return this.createSvgIntervalCircleBar(size, barLength, circleBarCircleFillColor, circleBarCircleStrokeColor, circleBarCircleStrokeWidth, circleBarLineStrokeColor, circleBarLineStroke, circleBarRadius);
    // }

    // /**
    //  * Calculate size for intervalscaled circle bar
    //  * @param  {number} stateValue - value from feature
    //  * @param  {number} circleBarScalingFactor - factor is multiplied by the stateValue
    //  * @param  {number} circleBarLineStroke - stroke from bar
    //  * @param  {number} circleBarRadius - radius from point
    //  * @return {number} size - size of the section to be drawn
    //  */
    // calculateSizeIntervalCircleBar (stateValue, circleBarScalingFactor, circleBarLineStroke, circleBarRadius) {
    //     let size = circleBarRadius * 2;

    //     if (((stateValue * circleBarScalingFactor) + circleBarLineStroke) >= size) {
    //         size = size + (stateValue * circleBarScalingFactor) + circleBarLineStroke;
    //     }

    //     return size;
    // }

    // /**
    //  * Calculate the length for the bar
    //  * @param  {number} size - size of the section to be drawn
    //  * @param  {number} circleBarRadius - radius from point
    //  * @param  {number} stateValue - value from feature
    //  * @param  {number} circleBarScalingFactor - factor is multiplied by the stateValue
    //  * @return {number} barLength
    //  */
    // calculateLengthIntervalCircleBar (size, circleBarRadius, stateValue, circleBarScalingFactor) {
    //     let barLength;

    //     if (stateValue >= 0) {
    //         barLength = (size / 2) - circleBarRadius - (stateValue * circleBarScalingFactor);
    //     }
    //     else if (stateValue < 0) {
    //         barLength = (size / 2) + circleBarRadius - (stateValue * circleBarScalingFactor);
    //     }
    //     else {
    //         barLength = 0;
    //     }

    //     return barLength;
    // }

    // /**
    //  * Create SVG for intervalscaled circle bars
    //  * @param  {number} size - size of the section to be drawn
    //  * @param  {number} barLength - length from bar
    //  * @param  {String} circleBarCircleFillColor - fill color from circle
    //  * @param  {String} circleBarCircleStrokeColor - stroke color from circle
    //  * @param  {number} circleBarCircleStrokeWidth - stroke width from circle
    //  * @param  {String} circleBarLineStrokeColor - stroke color from bar
    //  * @param  {number} circleBarLineStroke - stroke from bar
    //  * @param  {number} circleBarRadius - radius from point
    //  * @return {String} svg
    //  */
    // createSvgIntervalCircleBar (size, barLength, circleBarCircleFillColor, circleBarCircleStrokeColor, circleBarCircleStrokeWidth, circleBarLineStrokeColor, circleBarLineStroke, circleBarRadius) {
    //     let svg = "<svg width='" + size + "'" +
    //             " height='" + size + "'" +
    //             " xmlns='http://www.w3.org/2000/svg'" +
    //             " xmlns:xlink='http://www.w3.org/1999/xlink'>";

    //     // draw bar
    //     svg = svg + "<line x1='" + (size / 2) + "'" +
    //         " y1='" + (size / 2) + "'" +
    //         " x2='" + (size / 2) + "'" +
    //         " y2='" + barLength + "'" +
    //         " stroke='" + circleBarLineStrokeColor + "'" +
    //         " stroke-width='" + circleBarLineStroke + "' />";

    //     // draw circle
    //     svg = svg + "<circle cx='" + (size / 2) + "'" +
    //         " cy='" + (size / 2) + "'" +
    //         " r='" + circleBarRadius + "'" +
    //         " stroke='" + circleBarCircleStrokeColor + "'" +
    //         " stroke-width='" + circleBarCircleStrokeWidth + "'" +
    //         " fill='" + circleBarCircleFillColor + "' />";
    //     svg = svg + "</svg>";

    //     return svg;
    // }

    // /**
    //  * Setter for circleSegmentsBackgroundColor
    //  * @param {Number[]} value Color
    //  * @returns {void}
    //  */
    // setCircleSegmentsBackgroundColor (value) {
    //     this.set("circleSegmentsBackgroundColor", value);
    // }

    // /**
    //  * Setter for size.
    //  * @param {*} size Size
    //  * @returns {void}
    //  */
    // setSize (size) {
    //     this.set("size", size);
    // }

    // /**
    //  * Setter for imagePath.
    //  * @param {String} value Image path.
    //  * @returns {void}
    //  */
    // setImagePath (value) {
    //     this.set("imagePath", value);
    // }
}

export default PointStyleModel;
