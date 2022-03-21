import VectorLayer from "ol/layer/Vector.js";
import {bbox} from "ol/loadingstrategy.js";
import {WFS} from "ol/format.js";
import GeoJSON from "ol/format/GeoJSON.js";

import {createVectorSource, createClusterVectorSource} from "./vector";
import {getVersion, onError, onLoad} from "../lib/wfsUtil";
import {getParsedResponse, getOutputFormat, getParamsUrl} from "../lib/oafUtil";

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
 * @property {function} clusterGeometryFunction -  used in cluster source. Returns the geometry of the cluster, gets parameter feature
 * @property {function} style - style function to style the layer
 * @property {object} loadingParams - added as params to url
 */

/**
 * Returns the 'onError' function if response is not ok
 * @param {object} response of the request
 * @param {function} onErrorFn Calls options.onLoadingError and 'featuresloaderror' event will be fired by using failure callback.
 * @param {options} [options] additional options
 * @param {function} failure failure callback to ol.VectorLayer, fires 'featuresloaderror' event
 * @returns {void}
 */
function handleErrors (response, onErrorFn, options, failure) {
    if (!response.ok) {
        return onErrorFn(`Request to wfs-filter failed. Response status is ${response.statusText}`, options, failure);
    }
    return response;
}

/**
 * Loads the Layer Source (XML or Geojson).
 * Filters the features after load, if options.featuresFilter is given.
 * Adds the features to the source.
 * @param {string} url url to load features from
 * @param {object} params extra loading parameters
 * @param {ol.source.VectorSource} source the vector source
 * @param {String} outputFormat the output Format
 * @param {object} errorAndSuccessFns functions to handle error and success
 * @param {function} errorAndSuccessFns.onErrorFn  Calls options.onLoadingError and 'featuresloaderror' event will be fired by using failure callback.
 * @param {function} errorAndSuccessFns.success  callback: 'featuresloadend' event will be fired
 * @param {function} errorAndSuccessFns.failure failure callback to ol.VectorLayer, fires 'featuresloaderror' event
 * @param {options} [options] optional additional options
 * @returns {void}
 */
function loadSource (url, params, source, outputFormat, {onErrorFn, success, failure}, options) {
    fetch(url, params)
        .then((response) => handleErrors(response, onErrorFn, options, failure))
        .then((response) => response.text())
        .then(responseString => source.getFormat().readFeatures(getParsedResponse(responseString, outputFormat)))
        .then(features => onLoad(source, features, onErrorFn, success, failure, options))
        .catch((error) => {
            onErrorFn(error, options, failure);
        });
}

/**
 * Creates an ol/source element for the rawLayer by using a loader.
 * The 'featuresloadend' and 'featuresloaderror' events will be fired by using success and failure callbacks of the loader.
 * @param {rawLayer} rawLayer layer specification as in services.json
 * @param {options} [options] additional options
 * @param {String} url the parsed url
 * @param {String} outputFormat the output Format
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html failure/success see}
 * @returns {(ol.source.VectorSource|ol.source.Cluster)} VectorSource or Cluster, depending on whether clusterDistance is set.
 */
function getLayerSource (rawLayer, options, url, outputFormat) {
    const version = getVersion(rawLayer, options);
    let source = null,
        format = new GeoJSON();

    if (outputFormat === "xml") {
        format = new WFS({
            featureNS: rawLayer.featureNS,
            version: version
        });
        format.featureType = rawLayer.featureType;
    }

    function loader (extent, resolution, projection, success, failure) {
        loadSource(url, {}, source, outputFormat, {onErrorFn: onError, success, failure}, options);
    }
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
 * Creates the url for OAF request.
 * @param {rawLayer} rawLayer layer specification as in services.json
 * @returns {string} the url
 */
function createUrl (rawLayer) {
    let url = rawLayer.url,
        appendingString;
    const crsDefault = "",
        bulkDefault = true,
        jsonDefault = "json";

    url += typeof rawLayer.featureType === "string" ? "/collections/" + rawLayer.featureType + "/items?" : "";
    url += typeof rawLayer.limit === "number" ? "limit=" + rawLayer.limit + "&" : "";
    url += typeof rawLayer.offset === "number" ? "offset=" + rawLayer.offset + "&" : "";
    url += typeof rawLayer.bulk === "boolean" ? "bulk=" + rawLayer.bulk + "&" : "bulk=" + bulkDefault + "&";
    if (Array.isArray(rawLayer.bbox) && rawLayer.bbox.length === 4) {
        appendingString = "";

        rawLayer.bbox.forEach((bboxEntry, i) => {
            appendingString += i !== rawLayer.bbox.length - 1 ? bboxEntry + "," : bboxEntry;
        });
        url += "bbox=" + appendingString + "&";
    }
    url += typeof rawLayer.bboxCrs === "string" && rawLayer.bboxCrs !== "" ? "bbox-crs=" + encodeURIComponent(rawLayer.bboxCrs) + "&" : "";
    url += "crs=" + encodeURIComponent(typeof rawLayer.crs === "string" && rawLayer.crs !== "" ? rawLayer.crs : crsDefault) + "&";
    url += typeof rawLayer.datetime === "string" && rawLayer.datetime !== "" ? "datetime=" + rawLayer.datetime + "&" : "";
    url += typeof rawLayer.outputFormat === "string" ? "f=" + rawLayer.outputFormat : "f=" + jsonDefault;
    url += getParamsUrl(rawLayer.params);

    return url;
}

/**
 * Creates an ol/source element for the rawLayer by OAF (XML or Geojson)
 * @param {rawLayer} rawLayer layer specification as in services.json
 * @param {options} [options] additional options
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html failure/success see}
 * @returns {(ol.source.VectorSource|ol.source.Cluster)} VectorSource or Cluster, depending on whether clusterDistance is set.
 */
export function createLayerSource (rawLayer, options = {}) {
    if (!options.loadingStrategy) {
        options.loadingStrategy = bbox;
    }

    const outputFormat = getOutputFormat(rawLayer.outputFormat),
        url = createUrl(rawLayer),
        source = getLayerSource(rawLayer, options, url, outputFormat);

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
