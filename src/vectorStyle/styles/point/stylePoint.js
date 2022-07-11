import StyleModel from "../style";
import {createIconPointStyle, createIconClusterStyle} from "./stylePointIcon";
import {createCirclePointStyle, createCircleClusterStyle} from "./stylePointCircle";
import {createNominalPointStyle} from "./stylePointNominal";
import {Style} from "ol/style.js";
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
                return createCircleClusterStyle(this.attributes);
            }
            else if (this.attributes.clusterType === "icon") {
                return createIconClusterStyle(this.attributes);
            }
        }

        if (type === "icon") {
            return createIconPointStyle(this.attributes);
        }
        else if (type === "circle") {
            return createCirclePointStyle(this.attributes);
        }
        else if (type === "nominal") {
            return createNominalPointStyle(this.feature, this.attributes, defaultStyle.point.imageName);
        }
        else if (type === "interval") {
            return this.createIntervalPointStyle(this.attributes);
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
     * @param {*} size Size
     * @returns {void}
     */
    setSize (size) {
        this.size = size;
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
