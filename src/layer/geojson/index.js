import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";
import style, {setCustomStyles} from "./style";


import {createVectorSource, createClusterVectorSource} from "../vector";

// forward import to export
export {setCustomStyles};

/**
 * Creates the VectorSource for a GeoJSON layer. It will ensure each feature has the field id set to use with the other exported geojson functions.
 * @param {object} rawLayer - rawLayer as specified in services.json
 * @param {string} [rawLayer.url] - url to fetch geojson from; if no rawLayer.features given, this is required
 * @param {object} [rawLayer.features] - if features are transmitted via rawLayer, they will be used instead of requesting an URL
 * @param {object} options - options of the geojson layer
 * @returns {ol.source.Vector} created VectorSource
 */
export function createLayerSource ({url, features, clusterDistance}, options) {
    const format = new GeoJSON();
    let source = null;

    source = createVectorSource(url || features, options.loadingStrategy, format);

    if (typeof clusterDistance === "number") {
        source = createClusterVectorSource(source, clusterDistance, options.clusterGeometryFunction);
    }

    (typeof clusterDistance === "number" ? source.getSource() : source).once("featuresloadend", event => {
        if (typeof options.afterLoading === "function") {
            options.afterLoading(event?.features);
        }
    });

    return source;
}

/**
 * Creates a layer for GeoJSON.
 * @param {object} rawLayer - rawLayer as specified in services.json
 * @param {object} [layerParams={}] - extra params of the layer
 * @param {object} [options={}] - parameter object
 * @param {ol.Map} [options.map] - map the geojson is to be projected on
 * @param {ol.Style} [options.layerStyle] - optional style; if not given, default styling (modifiable by setCustomStyles) is used
 * @returns {ol.layer.Vector} Layer with id and source specified in rawLayer
 */
export function createLayer (rawLayer = {}, {layerParams = {}, options = {}} = {}) {
    const layer = new VectorLayer(Object.assign({
        id: rawLayer.id,
        source: createLayerSource(rawLayer, options)
    }, layerParams));

    if (options.style) {
        layer.setStyle(options.style);
    }
    else if (rawLayer.style) {
        layer.setStyle(rawLayer.style);
    }
    else {
        layer.setStyle(style);
    }
    return layer;
}

/**
 * GeoJSON layer with an URL will be reloaded. All other layers will be refreshed.
 * @param {ol.layer.Vector} layer - GeoJSON layer to update
 * @returns {undefined}
 */
export function updateSource (layer) {
    // openlayers named this "refresh", but it also means "reload" if an URL is set
    layer.getSource().refresh();
}

/**
 * Sets a style to all given features.
 * @param {ol.Feature[]} features - openlayers features to be styled
 * @param {ol.style.Style~StyleLike} featureStyle - style, array of styles, or style function
 * @returns {undefined}
 */
export function setFeatureStyle (features, featureStyle) {
    features.forEach(feature => feature.setStyle(featureStyle));
}

/**
 * @param {ol.Layer} layer - layer to hide all features of
 * @returns {undefined}
 */
export function hideAllFeatures (layer) {
    // () => null is the "do not display" function for openlayers (overriding VectorLayer styles)
    setFeatureStyle(layer.getSource().getFeatures(), () => null);
}

/**
 * @param {ol.Layer} layer - layer to show all features of
 * @returns {undefined}
 */
export function showAllFeatures (layer) {
    // if feature has undefined style, openlayers will check containing VectorLayer for styles
    setFeatureStyle(layer.getSource().getFeatures(), undefined);
}

/**
 * @param {ol.Layer} layer - layer to show some features of
 * @param {string[]} featureIdList - list of feature.id to show
 * @returns {undefined}
 */
export function showFeaturesById (layer, featureIdList) {
    const features = layer
        .getSource()
        .getFeatures()
        .filter(feature => featureIdList.indexOf(feature.getId()) >= 0);

    hideAllFeatures(layer);
    setFeatureStyle(features, undefined);
}
