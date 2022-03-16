import VectorLayer from "ol/layer/Vector.js";
import {bbox} from "ol/loadingstrategy.js";
import {WFS} from "ol/format.js";

import {createVectorSource, createClusterVectorSource} from "./vector";
import {getVersion, onError, onLoad} from "../lib/wfsUtil";

/**
 * Layer specification as in services.json.
 * @typedef {Object} rawLayer
 * @property {string} id - id of the layer
 * @property {string} url - url to load features from
 * @property {string} featureType - type of features
 * @property {string} featureNS - the namespace URI used for features
 * @property {number} clusterDistance - pixel radius, within this radius, all features are "clustered" into one feature - if available, a cluster source is created.
 * @property {function} style - style function to style the layer if options.style is not set
 */

/**
 * Additional options used to create and load the layer source.
 * @typedef {Object} options
 * @property {module:ol.source.Vector~LoadingStrategy} loadingStrategy - the loading strategy to use, if not set 'bbox' is used
 * @property {string} version - version of WFS requests. If not set, '1.1.0' is used.
 * @property {function} onLoadingError - function called on loading error, gets parameter error
 * @property {function} beforeLoading - function called before loading
 * @property {function} afterLoading - function called after loading, gets parameter features
 * @property {function} featuresFilter - function called after loading to filter features, gets parameter features
 * @property {function} wfsFilter -  xml resource as wfs filter, the content of the filter file will be sent to the wfs server as POST request
 * @property {function} doNotLoadInitially - default false, if set to true the layer will be initialized without network call, an empty array of features is promoted - this is useful to add features later on (e.g. by filtering) to a full functional but initially empty layer
 * @property {function} clusterGeometryFunction -  used in cluster source. Returns the geometry of the cluster, gets parameter feature
 * @property {function} style - style function to style the layer
 * @property {object} loadingParams - added as params to url
 */

/**
  * @param {object} response of the request
  * @param {function} onErrorFn Calls options.onLoadingError and 'featuresloaderror' event will be fired by using failure callback.
  * @param {options} [options] additional options
  * @param {function} failure failure callback to ol.VectorLayer, fires 'featuresloaderror' event
  * @returns {function | object} Returns the 'onError' function if response is not ok, otherwise the response object.
  */
function handleErrors (response, onErrorFn, options, failure) {
    if (!response.ok) {
        return onErrorFn(`Request to wfs-filter failed. Response status is ${response.status}`, options, failure);
    }
    return response;
}

/**
 * Returns the parameters for the wfs filter request.
 * @param {object} payload to set as body
 * @returns {object} the parameters for the wfs filter request
 */
function getFilterRequestParams (payload) {
    return {
        method: "POST",
        headers: {
            "Content-Type": "text/xml"
        },
        body: payload
    };
}
/**
 * Loads the WFS.
 * Filters the features after load, if options.featuresFilter is given.
 * Adds the features to the source.
 * Errors are thrown through onErrorFn or if a network issue occurs.
 *
 * @param {string} url url to load features from
 * @param {object} params extra loading parameters
 * @param {ol.source.VectorSource} source the vector source
 * @param {object} errorAndSuccessFns functions to handle error and success
 * @param {function} errorAndSuccessFns.onErrorFn  Calls options.onLoadingError and 'featuresloaderror' event will be fired by using failure callback.
 * @param {function} errorAndSuccessFns.success  callback: 'featuresloadend' event will be fired
 * @param {function} errorAndSuccessFns.failure failure callback to ol.VectorLayer, fires 'featuresloaderror' event
 * @param {options} [options] optional additional options
 * @returns {void}
 */
function loadWFS (url, params, source, {onErrorFn, success, failure}, options) {
    fetch(url, params)
        .then((response) => handleErrors(response, onErrorFn, options, failure))
        .then((response) => response.text())
        .then(responseString => source.getFormat().readFeatures(responseString))
        .then(features => onLoad(source, features, onErrorFn, success, failure, options))
        .catch((error) => {
            console.error(error);
        });
}
/**
 * Loads the WFS filter. The content of the filter file will be sent to the wfs server as POST request.
 * Filters the features after load, if options.featuresFilter is given.
 * Adds the features to the source.
 * Errors are thrown through onErrorFn or if a network issue occurs.
 *
 * @param {string} filter xml resource as wfs filter
 * @param {string} url url to load features from
 * @param {ol.source.VectorSource} source the vector source
* @param {object} errorAndSuccessFns functions to handle error and success
 * @param {function} errorAndSuccessFns.onErrorFn  Calls options.onLoadingError and 'featuresloaderror' event will be fired by using failure callback.
 * @param {function} errorAndSuccessFns.success  callback: 'featuresloadend' event will be fired
 * @param {function} errorAndSuccessFns.failure failure callback to ol.VectorLayer, fires 'featuresloaderror' event
 * @param {options} [options] optional additional options
 * @returns {void}
 */
function loadWFSFilter (filter, url, source, {onErrorFn, success, failure}, options) {
    fetch(filter)
        .then((response) => handleErrors(response, onErrorFn, options, failure))
        .then((response) => response.text())
        .then((payload) => loadWFS(url, getFilterRequestParams(payload), source, {onErrorFn, success, failure}, options))
        .catch((error) => {
            console.error(error);
        });
}

/**
 * Creates the url for request wfs.
 * A distinction is made between the wfs versions.
 * @param {rawLayer} rawLayer layer specification as in services.json
 * @param {String} version version of wfs
 * @param {String} projection projection of wfs
 * @param {String} bboxParam bbox loading strategy
 * @returns {string} the url
 */
function createUrl (rawLayer, version, projection, bboxParam) {
    let url = `${rawLayer.url}?service=WFS&version=${version}&request=GetFeature&srsName=${projection.getCode()}${bboxParam}`;

    if (version === "1.0.0" || version === "1.1.0") {
        url = `${url}&typeName=${rawLayer.featureType}`;
    }
    else if (version === "2.0.0") {
        url = `${url}&typeNames=${rawLayer.featureType}`;
    }

    return url;
}

/**
 * Creates an ol/source element for the rawLayer by using a loader.
 * The 'featuresloadend' and 'featuresloaderror' events will be fired by using success and failure callbacks of the loader.
 * @param {rawLayer} rawLayer layer specification as in services.json
 * @param {options} [options] additional options
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html failure/success see}
 * @returns {(ol.source.VectorSource|ol.source.Cluster)} VectorSource or Cluster, depending on whether clusterDistance is set.
 */
export function createLayerSource (rawLayer, options = {}) {
    if (!options.loadingStrategy) {
        options.loadingStrategy = bbox;
    }

    const version = getVersion(rawLayer, options),
        format = new WFS({
            featureNS: rawLayer.featureNS,
            version: version
        });
    let source = null;

    function loader (extent, resolution, projection, success, failure) {
        if (options.doNotLoadInitially) {
            onLoad(source, [], onError, success, failure, options);
        }
        else if (options.wfsFilter) {
            loadWFSFilter(options.wfsFilter, rawLayer.url, source, {onErrorFn: onError, success, failure}, options);
        }
        else {
            const bboxParam = options.loadingStrategy === bbox ? `&bbox=${extent.join(",")},${projection.getCode()}` : "";
            let url = createUrl(rawLayer, version, projection, bboxParam);

            if (options.loadingParams) {
                for (const key in options.loadingParams) {
                    const option = Array.isArray(options.loadingParams[key]) ? options.loadingParams[key].join(",") : options.loadingParams[key];

                    if (option !== undefined && option !== null && option !== "") {
                        url += `&${key}=${option}`;
                    }
                }
            }
            loadWFS(url, {}, source, {onErrorFn: onError, success, failure}, options);
        }
    }
    format.featureType = rawLayer.featureType;
    source = createVectorSource(loader, options.loadingStrategy, format);

    if (options.beforeLoading) {
        source.once("featuresloadstart", () => options.beforeLoading());
    }

    if (rawLayer.clusterDistance) {
        return createClusterVectorSource(source, rawLayer.clusterDistance, options.clusterGeometryFunction);
    }
    return source;
}

/**
 * Creates complete ol/Layer from rawLayer containing all required children.
 * @param {rawLayer} rawLayer - layer specification as in services.json
 * @param {object} [optionalParams] - optional params
 * @param {object} [optionalParams.layerParams] - additional layer params
 * @param {options} [optionalParams.options] - additional options
 * @returns {ol.Layer} Layer that can be added to map.
 */
export function createLayer (rawLayer = {}, {layerParams = {}, options = {}} = {}) {
    const source = createLayerSource(rawLayer, options),
        layer = new VectorLayer(Object.assign({
            source,
            id: rawLayer.id
        }, layerParams));

    if (options.style) {
        layer.setStyle(options.style);
    }
    else if (rawLayer.style) {
        layer.setStyle(rawLayer.style);
    }
    return layer;
}
