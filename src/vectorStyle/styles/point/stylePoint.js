import StyleModel from "../style";
import {createIconPointStyle, createIconClusterStyle} from "./stylePointIcon";
import {createCirclePointStyle, createCircleClusterStyle} from "./stylePointCircle";
import {createNominalPointStyle} from "./stylePointNominal";
import {Style} from "ol/style.js";
import defaultStyle from "../../defaultStyle";

class PointStyleModel extends StyleModel {
    /**
     * @description Class to create ol.style.Style
     * @constructor
     * @class PointStyleModel
     * @extends StyleModel
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
            isClustered = this.isClustered,
            feature = this.feature;

        if (isClustered && feature.get("features")?.length > 1) {
            if (this.attributes.clusterType === "circle") {
                return createCircleClusterStyle(this.attributes);
            }
            else if (this.attributes.clusterType === "icon") {
                return createIconClusterStyle(this.attributes);
            }
        }

        if (type === "icon") {
            // TODO: Underscore klären
            // eslint-disable-next-line no-underscore-dangle
            return createIconPointStyle(this.attributes, this.feature.values_);
        }
        else if (type === "circle") {
            return createCirclePointStyle(this.attributes);
        }
        else if (type === "nominal") {
            return createNominalPointStyle(this.feature, this.attributes, defaultStyle.point.imageName);
        }
        else if (type === "interval") {
            return this.createIntervalPointStyle(this.feature, this.attributes);
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

export default PointStyleModel;
