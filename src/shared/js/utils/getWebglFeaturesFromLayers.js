import {createGfiFeature} from "@shared/js/utils/getWmsFeaturesByMimeType.js";
import VectorTileLayer from "ol/layer/VectorTile.js";

/**
 * Convert extent to pixel box
 * @param {Object} map - OpenLayers map instance
 * @param {Array<number>} extent - [minX, minY, maxX, maxY]
 * @returns {Object} An object with `topLeft` and `bottomRight` pixel coordinates, each as [x, y].
 */
export function extentToPixelBox (map, extent) {
    const topLeft = map.getPixelFromCoordinate([extent[0], extent[3]]);
    const bottomRight = map.getPixelFromCoordinate([extent[2], extent[1]]);

    return {topLeft, bottomRight};
}

/**
 * Collect features from a WebGL layer within a pixel box using a sampling grid.
 * @param {Object} map - OpenLayers map instance.
 * @param {Object} layer - The layer to search features in.
 * @param {Object} pixelBox - The pixel bounding box {topLeft: [x, y], bottomRight: [x, y]}.
 * @param {Number} [step=6] - Pixel sampling distance to skip pixels for performance.
 * @returns {Array<ol/Feature>} Array of OpenLayers features found within the pixel box.
 */
export function collectFeaturesFromPixelBox (map, layer, pixelBox, step = 6) {
    const {topLeft, bottomRight} = pixelBox;
    const features = new Set();

    for (let x = topLeft[0]; x <= bottomRight[0]; x += step) {
        for (let y = topLeft[1]; y <= bottomRight[1]; y += step) {

            map.forEachFeatureAtPixel(
                [x, y],
                (feature, candidateLayer) => {
                    if (candidateLayer === layer) {
                        features.add(feature);
                    }
                },
                {layerFilter: l => l === layer}
            );
        }
    }

    return Array.from(features);
}

/**
 * Wrap OpenLayers features into GFI features.
 * @param {Object} layer - The layer the features belong to.
 * @param {Array<ol/Feature>} features - Array of OpenLayers features.
 * @returns {Array<Object>} Array of GFI feature objects.
 */
export function wrapGfiFeatures (layer, features) {
    return features.map(feature => createGfiFeature(layer, "", feature));
}

/**
 * Collect features from WebGL layers within a hitBox.
 * Handles both VectorTile and normal WebGL layers.
 *
 * @param {Object} map - OpenLayers map instance.
 * @param {Array<Object>} layers - Array of OL layers to process.
 * @param {Function} hitBoxFn - Function that returns the hitBox [minX, minY, maxX, maxY] for a layer.
 * @returns {Array<Object>} Array of GFI feature objects collected from all layers.
 */
export function getWebglFeaturesFromLayers (map, layers, hitBoxFn) {
    const featuresAtPixel = [];

    layers.forEach(layer => {
        const hitBox = hitBoxFn(layer);

        if (!hitBox) {
            return;
        }

        if (layer instanceof VectorTileLayer) {

            const pixelBox = extentToPixelBox(map, hitBox);
            const features = collectFeaturesFromPixelBox(map, layer, pixelBox);

            featuresAtPixel.push(...wrapGfiFeatures(layer, features));
        }

        else {
            layer.getSource()?.forEachFeatureIntersectingExtent(hitBox, feature => {
                featuresAtPixel.push(createGfiFeature(layer, "", feature));
            });
        }
    });

    return featuresAtPixel;
}
