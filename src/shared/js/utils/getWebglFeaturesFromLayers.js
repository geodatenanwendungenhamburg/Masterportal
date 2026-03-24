import {createGfiFeature} from "@shared/js/utils/getWmsFeaturesByMimeType.js";

/**
 * Collect features from WebGL layers within a hitBox.
 * Handles both VectorTile and normal WebGL layers.
 *
 * @param {Object} map - OpenLayers map instance
 * @param {Array<Object>} layers - Array of OL layers to process
 * @param {Function} hitBoxFn - Function that returns the hitBox [minX, minY, maxX, maxY] for a layer
 * @returns {Array<Object>} - Array of GFI features
 */
export function getWebglFeaturesFromLayers (map, layers, hitBoxFn) {
    const featuresAtPixel = [];

    layers.forEach(layer => {
        if (typeof layer?.get !== "function") {
            return;
        }

        const hitBox = hitBoxFn(layer);

        if (!hitBox) {
            return;
        }

        if (layer?.get("typ") === "VectorTile" && layer?.get("renderer") === "webgl") {
            const topLeft = map.getPixelFromCoordinate([hitBox[0], hitBox[3]]);
            const bottomRight = map.getPixelFromCoordinate([hitBox[2], hitBox[1]]);
            const features = [];

            for (let x = topLeft[0]; x <= bottomRight[0]; x++) {
                for (let y = topLeft[1]; y <= bottomRight[1]; y++) {
                    map.forEachFeatureAtPixel([x, y], (feature, candidateLayer) => {
                        if (candidateLayer === layer && !features.includes(feature)) {
                            features.push(feature);
                        }
                    }, {layerFilter: l => l === layer});
                }
            }

            features.forEach(feature => {
                featuresAtPixel.push(createGfiFeature(layer, "", feature));
            });
        }
        else {
            const source = layer.getSource();

            if (!source) {
                return;
            }

            if (typeof source.forEachFeatureIntersectingExtent === "function") {
                source.forEachFeatureIntersectingExtent(hitBox, feature => {
                    featuresAtPixel.push(createGfiFeature(layer, "", feature));
                });
            }
            else if (typeof source.getFeatures === "function") {
                source.getFeatures().forEach(feature => {
                    const geometry = feature.getGeometry();

                    if (geometry && geometry.intersectsExtent(hitBox)) {
                        featuresAtPixel.push(createGfiFeature(layer, "", feature));
                    }
                });
            }
        }
    });
    return featuresAtPixel;
}
