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
        return entries.map(layerNameEntry => ({
            name: layerNameEntry,
            sourceProps: {layers: layerNameEntry}
        }));
    }

    if (serviceType === "WFS") {
        return entries.map(featureTypeEntry => {
            const sourceProps = {featureType: featureTypeEntry.name};

            if (featureTypeEntry.featureNS) {
                sourceProps.featureNS = featureTypeEntry.featureNS;
            }

            return {
                name: featureTypeEntry.name,
                sourceProps
            };
        });
    }

    return entries;
}
