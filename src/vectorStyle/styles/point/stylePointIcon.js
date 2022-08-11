import {Style, Icon} from "ol/style.js";
import {prepareValue, isObjectPath} from "../../../lib/attributeMapper";
import PointStyleModel from "./stylePoint";

/**
* Returns the rotation value and its corresponding value according to style.json.
* @param {Object} rotation - The rotation object from the style.json
* @param {Object} featureValues - The values object from the feature
* @returns {number} - The rotation value in degrees or radiants.
*/
function getRotationValue (rotation, featureValues) {
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
* @returns {ol/style} - The created style.
*/
export function createIconPointStyle (attributes, featureValues) {
    const src = attributes.imagePath + attributes.imageName,
        isSVG = src.indexOf(".svg") > -1,
        width = attributes.imageWidth,
        height = attributes.imageHeight,
        scale = parseFloat(attributes.imageScale),
        offset = [parseFloat(attributes.imageOffsetX), parseFloat(attributes.imageOffsetY)],
        offsetXUnit = attributes.imageOffsetXUnit,
        offsetYUnit = attributes.imageOffsetYUnit,
        rotation = getRotationValue(attributes.rotation, featureValues);

    return new Style({
        image: new Icon({
            crossOrigin: "anonymous",
            src: src,
            width: width,
            height: height,
            scale: scale,
            anchor: offset,
            anchorXUnits: offsetXUnit,
            anchorYUnits: offsetYUnit,
            imgSize: isSVG ? [width, height] : "",
            rotation
        })
    });
}

/**
* Creates simpleClusterStyle.
* all clustered features get same image.
* @see {@link https://community.cesium.com/t/cors-and-billboard-image/3920/2} crossOrigin: "anonymous", is necessary for the 3D mode.
* @param {Object} attributes - The attributes from the icon
* @returns {ol/style} - The created style.
*/
export function createIconClusterStyle (attributes) {
    const src = attributes.imagePath + attributes.clusterImageName,
        isSVG = src.indexOf(".svg") > -1,
        width = attributes.clusterImageWidth,
        height = attributes.clusterImageHeight,
        scale = attributes.clusterImageScale,
        offset = [parseFloat(attributes.clusterImageOffsetX), parseFloat(attributes.clusterImageOffsetY)];

    return new Style({
        image: new Icon({
            crossOrigin: "anonymous",
            src: src,
            width: width,
            height: height,
            scale: scale,
            anchor: offset,
            imgSize: isSVG ? [width, height] : ""
        })
    });
}

/**
 * create Style for SVG
 * @param  {String} svgPath - contains the params to be draw
 * @see {@link https://community.cesium.com/t/cors-and-billboard-image/3920/2} crossOrigin: "anonymous", is necessary for the 3D mode.
 * @return {ol.Style} style
 */
export function createSVGStyle (svgPath) {
    const size = PointStyleModel.prototype.getSize();

    return new Style({
        image: new Icon({
            crossOrigin: "anonymous",
            src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgPath),
            imgSize: [size, size]
        })
    });
}
