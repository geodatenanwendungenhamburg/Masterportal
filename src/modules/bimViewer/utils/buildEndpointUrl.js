/**
 * Generates a URL. Generates the query string from a parameters object.
 * @param {String} url Base API endpoint URL.
 * @param {Object} parameters Query string parameters
 * @return {string} Full url to endpoint
 */
export function buildEndpointUrl (url, parameters = {}) {
    const endpointUrl = url;

    if (Object.keys(parameters).length) {
        const urlSeparator = endpointUrl.indexOf("?") === -1 ? "?" : "&";

        return `${endpointUrl}${urlSeparator}${new URLSearchParams(parameters).toString()}`;
    }

    // In order to debug the generated endpoint URL and query parameters, use this line.
    // console.log("%c" + JSON.stringify([`Endpoint: ${endpointUrl}`, parameters], null, 2), "color:green;font-size:xx-small;"); // dumpDebug

    return endpointUrl;
}
