import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import {getFeatureGET} from "@shared/js/api/wfs/getFeature";
import {WFS} from "ol/format.js";

/**
 * Gets the features of the additional geometries by the given layer id.
 * @param {Object[]} additionalGeometries - The additional geometries.
 * @param {String} additionalGeometries[].layerId - The id of the layer.
 * @returns {Object[]} The additional geometries.
 */
export async function getFeaturesOfAdditionalGeometries (additionalGeometries) {
    const result = [];

    if (!Array.isArray(additionalGeometries)) {
        return result;
    }

    for (let i = 0; i < additionalGeometries.length; i++) {
        const rawLayer = rawLayerList.getLayerWhere({id: additionalGeometries[i].layerId});
        let features = [],
            wfsReader = null;

        if (rawLayer === null) {
            continue;
        }
        wfsReader = new WFS({version: rawLayer.version});
        features = await getFeatureGET(rawLayer.url, {version: rawLayer.version, featureType: rawLayer.featureType});

        result[i] = JSON.parse(JSON.stringify(additionalGeometries[i]));
        result[i].features = wfsReader.readFeatures(features);
    }
    return result;
}
