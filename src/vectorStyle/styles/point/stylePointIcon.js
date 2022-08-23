import {Style, Icon} from "ol/style.js";
import {prepareValue, isObjectPath} from "../../../lib/attributeMapper";
import PointStyle from "./stylePoint";

/**
* Returns the rotation value and its corresponding value according to style.json.
* @param {Object} rotation - The rotation object from the style.json
* @param {Object} featureValues - The values object from the feature
* @returns {number} - The rotation value in degrees or radiants.
*/
export function getRotationValue (rotation, featureValues) {
    if (typeof rotation === "object") {
        const {value, isDegree} = rotation;

        if (isObjectPath(value) && featureValues !== undefined) {
            const rotationValueFromService = parseInt(prepareValue(featureValues, value), 10);

            return isDegree ? rotationValueFromService * Math.PI / 180 : rotationValueFromService;
        }
        return isDegree ? parseInt(value, 10) * Math.PI / 180 : parseInt(value, 10);
    }
    return 0;
}

/**
* Creates pointStyle as icon.
* all features get same image.
* @see {@link https://community.cesium.com/t/cors-and-billboard-image/3920/2} crossOrigin: "anonymous", is necessary for the 3D mode.
* @param {Object} attributes - The attributes from the icon
* @param {Object} featureValues - The values object from the feature
* @param {Boolean} isClustered - true if features are clustered
* @returns {ol/style} - The created style.
*/
export function createIconStyle (attributes, featureValues, isClustered) {
    const height = isClustered ? attributes.clusterImageHeight : attributes.imageHeight,
        imageName = isClustered ? attributes.clusterImageName : attributes.imageName,
        imageOffsetX = isClustered ? attributes.clusterImageOffsetY : attributes.imageOffsetX,
        imageOffsetY = isClustered ? attributes.clusterImageOffsetX : attributes.imageOffsetY,
        scale = isClustered ? attributes.clusterImageScale : attributes.imageScale,
        src = imageName.indexOf("/") === -1 ? attributes.imagePath + imageName : imageName,
        width = isClustered ? attributes.clusterImageWidth : attributes.imageWidth,
        iconOptions = {
            crossOrigin: "anonymous",
            src,
            width,
            height,
            scale,
            anchor: [parseFloat(imageOffsetX), parseFloat(imageOffsetY)],
            imgSize: src.indexOf(".svg") > -1 ? [width, height] : ""
        };

    if (!isClustered) {
        iconOptions.anchorXUnits = attributes.imageOffsetXUnit;
        iconOptions.anchorYUnits = attributes.imageOffsetYUnit;
        iconOptions.rotation = getRotationValue(attributes.rotation, featureValues);
    }

    return new Style({
        image: new Icon(iconOptions)
    });
}

/**
 * create Style for SVG
 * @param  {String} svgPath - contains the params to be draw
 * @see {@link https://community.cesium.com/t/cors-and-billboard-image/3920/2} crossOrigin: "anonymous", is necessary for the 3D mode.
 * @return {ol.Style} style
 */
export function createSVGStyle (svgPath) {
    const size = PointStyle.prototype.getSize();

    return new Style({
        image: new Icon({
            crossOrigin: "anonymous",
            src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgPath),
            imgSize: [size, size]
        })
    });
}
