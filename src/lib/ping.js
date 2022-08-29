/**
 * Helper function to detect layer availability/usability. Depending on layer
 * type, the method to infer availability broadly varies.
 * @param {Object} layerSpecification services.json layer specification
 * @returns {Promise} resolves to status code of a layer-specific default
 * request as Number, or null if no request could be made, which should
 * indicate misconfiguration; defaults to 900 if the request itself failed for
 * arbitrary reasons (usually CORS-related)
 */
export default function ({url, typ, capabilitiesUrl, ...rest}) {
    const statusCheckUrls = [];

    if (capabilitiesUrl) {
        statusCheckUrls.push(capabilitiesUrl);
    }
    else if (typ === "OAF") {
        statusCheckUrls.push(url);
    }
    else if (typ === "Entities3D") {
        rest.entities
            .forEach(entity => entity.url ? statusCheckUrls.push(entity.url) : null);
    }
    else if (typ === "TileSet3D" || typ === "Terrain3D") {
        statusCheckUrls.push(url);
    }
    else if (typ === "GeoJSON") {
        if (!url && rest.features) {
            // may be a local layer without source url – that's equal to 200
            return Promise.resolve(200);
        }
        if (url) {
            statusCheckUrls.push(url);
        }
    }
    else if (typ === "VectorTile") {
        statusCheckUrls.push(url.replaceAll(/\{[xyz]\}/ig, "0"));
    }
    else if (typ === "WMTS") {
        const arbitraryTileRequests = (url ? [url] : rest.urls)
            .map(entry => entry
                .replace(/\{Style\}/ig, rest.style)
                .replace(/\{TileMatrixSet\}/ig, rest.tileMatrixSet)
                .replaceAll(/\{(TileMatrix|TileRow|TileCol)\}/ig, "0"));

        statusCheckUrls.push(...arbitraryTileRequests);
    }
    else if (url) {
        statusCheckUrls.push(`${url}?service=${typ}&request=GetCapabilities`);
    }

    if (!statusCheckUrls.length) {
        return Promise.resolve(null);
    }

    return Promise
        .allSettled(statusCheckUrls
            .map(statusCheckUrl => new Promise((resolve) => fetch(statusCheckUrl, {method: "HEAD"})
                .then(({status}) => resolve(status))
                // usually from CORS, treated as 900 here ("proprietary" status code)
                .catch(() => resolve(900)))))
        // return highest status code (will indicate erroneous behaviour)
        .then(codes => Math.max(...codes.map(({value}) => value)));
}
