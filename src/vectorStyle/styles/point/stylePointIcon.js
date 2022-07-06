import {Style, Icon} from "ol/style.js";
import {prepareValue, isObjectPath} from "../../../lib/attributeMapper";

/**
* Returns the rotation value and its corresponding value according to style.json.
* @param {Object} rotation - The rotation object from the style.json
* @returns {number} - The rotation value in degrees or radiants.
*/
function getRotationValue (rotation) {
    if (typeof rotation === "object") {
        const {value, isDegree} = rotation;

        // TODO: no underscore klären
        // eslint-disable-next-line no-underscore-dangle
        if (isObjectPath(value) && this.attributes.values_ !== undefined) {
            // eslint-disable-next-line no-underscore-dangle
            const rotationValueFromService = parseInt(prepareValue(this.attributes.values_, value), 10);

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
* @returns {ol/style} - The created style.
*/
export function createIconPointStyle (attributes) {
    const src = attributes.imagePath + attributes.imageName,
        isSVG = src.indexOf(".svg > -1"),
        width = attributes.imageWidth,
        height = attributes.imageHeight,
        scale = parseFloat(attributes.imageScale),
        offset = [parseFloat(attributes.imageOffsetX), parseFloat(attributes.imageOffsetY)],
        offsetXUnit = attributes.imageOffsetXUnit,
        offsetYUnit = attributes.imageOffsetYUnit,
        rotation = getRotationValue(attributes.rotation);

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
