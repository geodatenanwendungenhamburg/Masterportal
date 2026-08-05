import {Circle, LineString} from "ol/geom.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import isObject from "@shared/js/utils/isObject.js";

/**
 * Computes union of two arrays using custom equality function.
 * @param {Array} arr1 First array.
 * @param {Array} arr2 Second array.
 * @param {Function} equalityFunc Compare function.
 * @returns {Array} Unique items from both arrays.
 */
export function union (arr1, arr2, equalityFunc) {
    const unionResult = arr1.concat(arr2);
    let i = 0,
        j = 0;

    for (i = 0; i < unionResult.length; i++) {
        for (j = i + 1; j < unionResult.length; j++) {
            if (equalityFunc(unionResult[i], unionResult[j])) {
                unionResult.splice(j, 1);
                j--;
            }
        }
    }

    return unionResult;
}

/**
 * Gets distance from feature to center position.
 * @param {ol/feature} feat Feature.
 * @param {Number[]} centerPosition Center position.
 * @returns {Number} Rounded distance.
 */
export function getDistance (feat, centerPosition) {
    const closestPoint = feat.getGeometry().getClosestPoint(centerPosition),
        line = new LineString([closestPoint, centerPosition]);

    return Math.round(line.getLength());
}

/**
 * Extracts nearby title values from feature.
 * @param {ol/Feature} feat Feature.
 * @param {(String|String[])} nearbyTitle Attribute key(s).
 * @returns {String[]} Extracted title values.
 */
export function getNearbyTitleText (feat, nearbyTitle) {
    if (typeof nearbyTitle === "string" && feat.get(nearbyTitle) !== undefined) {
        return [feat.get(nearbyTitle)];
    }

    if (Array.isArray(nearbyTitle)) {
        const nearbyTitleText = [];

        nearbyTitle.forEach(attr => {
            if (feat.get(attr) !== undefined) {
                nearbyTitleText.push(feat.get(attr));
            }
        });

        return nearbyTitleText;
    }

    return [];
}

/**
 * Gets nearby vector features in a radius around center position.
 * @param {Object} params Function parameters.
 * @param {Array} params.layerConfigs Layer configs to inspect.
 * @param {Number} params.distance Search range.
 * @param {Array} params.centerPosition Center position.
 * @param {Boolean} params.onlyFilteredFeatures Restrict to filtered features only.
 * @returns {ol/feature[]} Nearby features list.
 */
export function getVectorFeaturesInCircle ({layerConfigs, distance, centerPosition, onlyFilteredFeatures}) {
    const circle = new Circle(centerPosition, distance),
        circleExtent = circle.getExtent(),
        visibleWFSLayers = [];

    layerConfigs.forEach(layerConfig => {
        if (layerConfig.typ === "WFS" && layerConfig.visibility) {
            const layer = layerCollection.getLayerById(layerConfig.id);

            if (layer) {
                visibleWFSLayers.push(layer);
            }
        }
    });

    let featuresAll = [],
        features = [];

    visibleWFSLayers.forEach(layer => {
        let preparedFeatures,
            filteredFeatures = [];

        if (layer.getLayerSource()) {
            features = layer.getLayerSource().getFeaturesInExtent(circleExtent);
            filteredFeatures = features.filter(feat => {
                return (isObject(feat.getStyle()) && feat.getStyle().getImage() !== null) || (typeof feat.getStyle() === "function" && feat.getStyle()(feat) !== null);
            });

            if (onlyFilteredFeatures === true) {
                features = filteredFeatures;
            }

            preparedFeatures = features.filter((feat) => {
                const dist = getDistance(feat, centerPosition);

                return dist <= distance;
            });

            preparedFeatures.forEach(feat => {
                Object.assign(feat, {
                    styleId: layer.get("styleId"),
                    layerName: layer.get("name"),
                    nearbyTitleText: getNearbyTitleText(feat, layer.get("nearbyTitle")),
                    dist2Pos: getDistance(feat, centerPosition)
                });
            });

            featuresAll = union(preparedFeatures, featuresAll, function (obj1, obj2) {
                return obj1 === obj2;
            });
        }
    });

    return featuresAll;
}
