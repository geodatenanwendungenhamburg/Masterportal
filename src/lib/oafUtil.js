/**
 * Parsing the params object in to string for url
 * @param {Object} params the paramters in object
 * @returns {String} The url parameters in string format
 */
function getParamsUrl (params) {
    if (!params || typeof params !== "object" || params.constructor !== Object || !Object.keys(params).length) {
        return "";
    }

    let paramsUrl = "";

    Object.entries(params).forEach(([key, value]) => {
        paramsUrl += "&" + key + "=" + value;
    });

    return paramsUrl;
}

export {
    getParamsUrl
};
