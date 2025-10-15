/**
 * Build metaURLs for a given metaId and layer.
 *
 * @param {String} metaId - Metadata ID.
 * @param {Object} options - Options for building the URL.
 * @param {Object} [options.layerInfo] - LayerInfo object (may contain showDocUrl).
 * @param {String} [options.metaDataCatalogueId] - ID of the catalogue service.
 * @param {Function} [options.restServiceById] - Function to resolve rest services by ID.
 * @returns {String[]} Array of metaURLs.
 */
export function buildMetaURLs (metaId, {layerInfo, metaDataCatalogueId, restServiceById}) {
    const metaURLs = [];
    let metaURL = "",
        service = null;

    if (!metaId) {
        return metaURLs;
    }

    if (layerInfo?.showDocUrl) {
        metaURL = layerInfo.showDocUrl + metaId;
    }
    else if (typeof restServiceById === "function" && metaDataCatalogueId) {
        service = restServiceById(metaDataCatalogueId);
        if (service) {
            metaURL = service.url + metaId;
        }
        else {
            console.warn("Rest Service with the ID " + metaDataCatalogueId + " is not configured in rest-services.json!");
        }
    }

    if (metaURL && !metaURLs.includes(metaURL)) {
        metaURLs.push(metaURL);
    }

    return metaURLs;
}
