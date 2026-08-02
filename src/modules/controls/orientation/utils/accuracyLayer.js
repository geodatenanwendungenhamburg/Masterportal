import {markRaw} from "vue";
import Feature from "ol/Feature.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import {Fill, Stroke, Style} from "ol/style.js";
import {getPrimaryColor} from "@shared/js/utils/colors.js";
import zIndexManager from "@core/layers/js/zIndexManager.js";

/**
 * Creates the feature used to render geolocation accuracy geometry.
 * @returns {ol/Feature} A raw OpenLayers feature instance.
 */
export function createAccuracyFeature () {
    return markRaw(new Feature());
}

/**
 * Initializes the accuracy layer once and attaches it to the map.
 * @param {Object} params Function parameters.
 * @param {ol/Feature} params.accuracyFeature Feature used to render accuracy geometry.
 * @param {ol/layer/Vector|null} params.accuracyLayer Existing accuracy layer if initialized.
 * @param {ol/Map} params.map OpenLayers map instance.
 * @returns {{accuracyLayer: ol/layer/Vector}} The existing or newly created accuracy layer.
 */
export function initAccuracyLayer ({accuracyFeature, accuracyLayer, map}) {
    if (accuracyLayer !== null) {
        return {accuracyLayer};
    }

    const accuracyFillColor = getPrimaryColor(0.15);
    const accuracyStrokeColor = getPrimaryColor(0.9);
    const accuracySource = markRaw(new VectorSource());
    const nextAccuracyLayer = markRaw(
        new VectorLayer({
            id: "orientation_accuracy_layer",
            source: accuracySource,
            style: new Style({
                fill: new Fill({
                    color: accuracyFillColor
                }),
                stroke: new Stroke({
                    color: accuracyStrokeColor,
                    width: 2
                })
            }),
            zIndex: zIndexManager.alwaysOnTop
        })
    );

    accuracySource.addFeature(accuracyFeature);
    map.addLayer(nextAccuracyLayer);

    return {accuracyLayer: nextAccuracyLayer};
}

/**
 * Updates the geometry shown in the accuracy feature.
 * @param {Object} params Function parameters.
 * @param {Boolean} params.showAccuracy Whether accuracy rendering is enabled.
 * @param {ol/Geolocation|null} params.geolocation OpenLayers geolocation instance.
 * @param {String} params.projectionCode Target map projection code.
 * @param {ol/Feature} params.accuracyFeature Feature receiving transformed accuracy geometry.
 * @returns {void}
 */
export function updateAccuracyGeometry ({
    showAccuracy,
    geolocation,
    projectionCode,
    accuracyFeature
}) {
    if (!showAccuracy || geolocation === null) {
        return;
    }

    const accuracyGeometry = geolocation.getAccuracyGeometry();

    if (!accuracyGeometry) {
        return;
    }

    accuracyFeature.setGeometry(
        accuracyGeometry.clone().transform("EPSG:4326", projectionCode)
    );
}

/**
 * Clears rendered accuracy geometry and removes the accuracy listener.
 * @param {Object} params Function parameters.
 * @param {ol/Geolocation|null} params.geolocation OpenLayers geolocation instance.
 * @param {ol/Feature} params.accuracyFeature Accuracy feature.
 * @param {Function} params.listener Listener to remove from geolocation accuracy changes.
 * @returns {void}
 */
export function clearAccuracyGeometry ({
    geolocation,
    accuracyFeature,
    listener
}) {
    if (geolocation) {
        geolocation.un("change:accuracyGeometry", listener);
    }
    accuracyFeature.setGeometry(null);
}

/**
 * Removes the accuracy layer from the map.
 * @param {Object} params Function parameters.
 * @param {ol/layer/Vector|null} params.accuracyLayer Accuracy layer instance.
 * @param {ol/Map} params.map OpenLayers map instance.
 * @returns {void}
 */
export function removeAccuracyLayer ({accuracyLayer, map}) {
    if (accuracyLayer === null) {
        return;
    }

    map.removeLayer(accuracyLayer);
}
