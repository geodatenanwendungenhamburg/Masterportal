import StyleClass from "../style";
import {createIconStyle} from "./stylePointIcon";
import {createCircleStyle} from "./stylePointCircle";
import {createRegularShapeStyle} from "./stylePointRegularShape";
import {createIntervalPointStyle} from "./stylePointInterval";
import {createNominalPointStyle} from "./stylePointNominal";
import {Style} from "ol/style.js";
import defaultStyle from "../defaultStyles";

class PointStyle extends StyleClass {
    /**
     * @description Class to create ol.style.Style
     * @constructor
     * @class PointStyle
     * @extends StyleClass
     * @memberof VectorStyle.Style
     */
    constructor () {
        super();
        this.attributes = {...defaultStyle.point};
    }

    /**
     * This function initializes the Linestring Object by setting or overwriting some attributes.
     * @param {ol/feature} feature Feature to be styled.
     * @param {object} styles styling properties to overwrite defaults
     * @param {Boolean} isClustered Flag to show if feature is clustered.
     * @param {Boolean} wfsImgPathFromConfig image Path of the wfs.
     * @returns {void}
     */
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
        this.setStyle(this.getStyle());
    }

    /**
     * This function returns a style for each feature.
     * @returns {ol/style} - The created style.
     */
    getStyle () {
        const type = this.attributes.type.toLowerCase(),
            isClustered = this.isClustered;

        if (type === "icon") {
            return createIconStyle(this.attributes, this.feature, isClustered);
        }
        else if (type === "circle") {
            return createCircleStyle(this.attributes, isClustered);
        }
        else if (type === "nominal") {
            return isClustered ? createIconStyle(this.attributes, this.feature, isClustered) : createNominalPointStyle(this.attributes, this.feature, defaultStyle.point.imageName);
        }
        else if (type === "interval") {
            return createIntervalPointStyle(this.feature, this.attributes);
        }
        else if (type === "regularshape") {
            return createRegularShapeStyle(this.attributes);
        }

        return new Style();
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
     * @param {*} value Size
     * @returns {void}
     */
    setSize (value) {
        this.size = value;
    }

    /**
     * Getter for size.
     * @param {*} size Size
     * @returns {void}
     */
    getSize () {
        return this.size;
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

export default PointStyle;
