import StyleModel from "../style";
import {createIconPointStyle, createIconClusterStyle} from "./stylePointIcon";
import {createCirclePointStyle, createCircleClusterStyle} from "./stylePointCircle";
import {createNominalPointStyle} from "./stylePointNominal";
import {Icon, Style} from "ol/style.js";
import defaultStyle from "../../defaultStyle";

class PointStyleModel extends StyleModel {
    constructor () {
        super();
        this.attributes = {...defaultStyle.point};
    }

    initialize (feature, styles, isClustered, wfsImgPathFromConfig) {
        if (wfsImgPathFromConfig !== undefined) {
            this.setImagePath(wfsImgPathFromConfig);
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
            if (this.attributes.clusterType === "circle") {
                return createCircleClusterStyle();
            }
            else if (this.attributes.clusterType === "icon") {
                return createIconClusterStyle(this.attributes);
            }
        }

        if (type === "icon") {
            return createIconPointStyle(this.attributes);
        }
        else if (type === "circle") {
            return createCirclePointStyle();
        }
        else if (type === "nominal") {
            return createNominalPointStyle();
        }
        else if (type === "interval") {
            return this.createIntervalPointStyle();
        }

        return new Style();
    }

    /**
     * create Style for SVG
     * @param  {String} svgPath - contains the params to be draw
     * @see {@link https://community.cesium.com/t/cors-and-billboard-image/3920/2} crossOrigin: "anonymous", is necessary for the 3D mode.
     * @return {ol.Style} style
     */
    createSVGStyle (svgPath) {
        const size = this.get("size");

        return new Style({
            image: new Icon({
                crossOrigin: "anonymous",
                src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgPath),
                imgSize: [size, size]
            })
        });
    }

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

    /**
     * Setter for circleSegmentsBackgroundColor
     * @param {Number[]} value Color
     * @returns {void}
     */
    setCircleSegmentsBackgroundColor (value) {
        this.attributes.circleSegmentsBackgroundColor = value;
    }

    /**
     * Setter for size.
     * @param {*} size Size
     * @returns {void}
     */
    setSize (size) {
        this.size = size;
    }

    /**
     * Setter for imagePath.
     * @param {String} value Image path.
     * @returns {void}
     */
    setImagePath (value) {
        this.attributes.imagePath = value;
    }
}

export default PointStyleModel;
