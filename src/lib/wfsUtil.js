
/**
 * Checks the version of the wfs against allowed versions and returns the version.
 * If the version is not allowed, 1.1.0 is returned.
 * @param {rawLayer} rawLayer layer specification as in services.json
 * @param {options} [options] additional options
 * @returns {String} The allowed version.
 */
function getVersion (rawLayer, options) {
    const allowedVersions = ["1.0.0", "1.1.0", "2.0.0"];
    let version = options.version || rawLayer.version;

    if (!allowedVersions.includes(version)) {
        version = allowedVersions[1];
        console.warn(`The "${rawLayer.typ}" layer with the id: "${rawLayer.id}" is configured in version: ${version}.`
            + ` OpenLayers accepts "${rawLayer.typ}" only in the versions: ${allowedVersions},`
            + ` It tries to load the layer with the id: "${rawLayer.id}" in version ${allowedVersions[1]}!`);
    }

    return version;
}

/**
 * Logs and throws an Error.
 * @param {string} error error message
 * @param {object} [options] additional options
 * @param {function} [options.onLoadingError] additional option, called with param error
 * @param {function} failure failure callback to ol.VectorLayer, fires 'featuresloaderror' event
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html failure: see}
 * @returns {void}
 */
function onError (error, options = {}, failure) {
    if (options.onLoadingError) {
        options.onLoadingError(error);
    }
    failure(error);
    throw Error(error);
}

/**
 * Called after features are loaded. Calls options.featuresFilter, success-callback and options.afterLoading.
 * Features are added to source.
 * @param {ol.source.VectorSource} source the vector source
 * @param {Array.<module:ol/Feature~Feature>} features loaded features
 * @param {function} onErrorFn  Calls options.onLoadingError and 'featuresloaderror' event will be fired by using failure callback.
 * @param {function} success  callback: 'featuresloadend' event will be fired
 * @param {function} failure failure callback to ol.VectorLayer, fires 'featuresloaderror' event
 * @param {options} [options] additional options
 * @returns {void}
 */
function onLoad (source, features, onErrorFn, success, failure, options = {}) {
    let filteredFeatures = features;

    try {
        if (options.featuresFilter) {
            filteredFeatures = options.featuresFilter(features);
        }
        source.addFeatures(filteredFeatures);
        if (options.afterLoading) {
            options.afterLoading(filteredFeatures);
        }
        // success: see https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html
        success(filteredFeatures);
    }
    catch (error) {
        console.error(error);
        onErrorFn(error, options, failure);
    }
}

export {
    getVersion,
    onError,
    onLoad
};
