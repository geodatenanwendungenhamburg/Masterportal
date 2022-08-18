/**
 * Helper function to detect layer availability/usability.
 * @param {Object} layerSpecification services.json layer specification
 * @returns {Promise} resolves to status code of a layer-specific default request
 */
export default function ({url, typ}) {
    let statusCheckUrl;

    if (typ === "OAF") {
        statusCheckUrl = url;
    }
    else if (typ === "VectorTile") {
        statusCheckUrl = url.replaceAll(/\{[xyz]\}/ig, "0");
    }
    else {
        statusCheckUrl = `${url}?service=${typ}&request=GetCapabilities`;
    }

    return new Promise((resolve) => fetch(statusCheckUrl)
        .then(({status}) => resolve(status))
        // usually from CORS, treated as 404 here – more logs in console anyway
        .catch(() => resolve(404)));
}
