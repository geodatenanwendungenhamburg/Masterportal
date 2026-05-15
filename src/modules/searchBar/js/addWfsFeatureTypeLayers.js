/**
 * Adds WFS feature types as separate layers.
 * First discovered feature type is visible by default; others stay inactive.
 * @param {Object} params function parameters
 * @param {Function} params.dispatch Vuex dispatch function
 * @param {String} params.fileIdentifier CSW file identifier
 * @param {String} params.recordTitle CSW record title
 * @param {String} params.cswUrl CSW endpoint URL
 * @param {Number} params.resourceIndex online resource index
 * @param {String} params.baseUrl WFS base URL
 * @param {Object[]} params.featureTypes detected feature types
 * @param {String} params.wfsVersion WFS version to set
 * @param {String} params.wfsOutputFormat WFS output format to set
 * @returns {Boolean} true if at least one layer was added
 */
export default function addWfsFeatureTypeLayers ({
    dispatch,
    fileIdentifier,
    recordTitle,
    cswUrl,
    resourceIndex,
    baseUrl,
    featureTypes,
    wfsVersion,
    wfsOutputFormat
}) {
    if (!featureTypes?.length) {
        return false;
    }

    for (const [index, featureTypeEntry] of featureTypes.entries()) {
        const layerId = `csw-${fileIdentifier}-${resourceIndex}-${featureTypeEntry.name}`,
            layerSource = {
                id: layerId,
                name: recordTitle ? `${recordTitle} - ${featureTypeEntry.name}` : featureTypeEntry.name,
                url: baseUrl,
                typ: "WFS",
                metaID: fileIdentifier,
                cswUrl: cswUrl,
                featureType: featureTypeEntry.name,
                version: wfsVersion,
                outputFormat: wfsOutputFormat
            };

        if (featureTypeEntry.featureNS) {
            layerSource.featureNS = featureTypeEntry.featureNS;
        }

        dispatch("addLayerToTopicTree", {
            layerId,
            source: layerSource,
            showInLayerTree: true,
            visibility: index === 0
        });
    }

    return true;
}
