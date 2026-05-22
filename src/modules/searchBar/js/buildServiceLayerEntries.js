/**
 * Builds normalized layer entries used for folder insertion.
 * @param {String} serviceType Service type (e.g. WMS, WFS).
 * @param {Object[]} entries Source entries from capabilities.
 * @returns {Object[]} Layer entries with name and sourceProps.
 */
export default function buildServiceLayerEntries (serviceType, entries = []) {
    if (!Array.isArray(entries) || entries.length === 0) {
        return [];
    }

    if (serviceType === "WMS") {
        // entries: [{name, title}]
        return entries.map(layerEntry => ({
            name: layerEntry.title || layerEntry.name,
            sourceProps: {layers: layerEntry.name}
        }));
    }

    if (serviceType === "WFS") {
        // entries: [{name, title, featureNS?}]
        return entries.map(featureTypeEntry => {
            const sourceProps = {featureType: featureTypeEntry.name};

            if (featureTypeEntry.featureNS) {
                sourceProps.featureNS = featureTypeEntry.featureNS;
            }
            return {
                name: featureTypeEntry.title || featureTypeEntry.name,
                sourceProps
            };
        });
    }

    if (serviceType === "WMTS") {
        // entries: [{name, title, format?, tileMatrixSet?}]
        return entries.map(layerEntry => {
            const sourceProps = {layers: layerEntry.name};

            if (layerEntry.format) {
                sourceProps.format = layerEntry.format;
            }
            if (layerEntry.tileMatrixSet) {
                sourceProps.tileMatrixSet = layerEntry.tileMatrixSet;
            }

            return {
                name: layerEntry.title || layerEntry.name,
                sourceProps
            };
        });
    }

    if (serviceType === "OAF") {
        // entries: [{name, title}]
        return entries.map(layerEntry => ({
            name: layerEntry.title || layerEntry.name,
            sourceProps: {collection: layerEntry.name}
        }));
    }

    return entries;
}
