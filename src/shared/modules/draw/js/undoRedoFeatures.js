import {markRaw} from "vue";


/**
 * Checks if the feature was created by the edit function deleteAll.
 * @param {ol/feature|ol/feature[]} feature The undo or redo feature.
 * @returns {Boolean} The feature is an array of features or not.
 */
export function isDeleteAllMode (feature) {
    return Array.isArray(feature);
}

/**
 * Regulates the undo or redo features.
 * Due to the nonreactive Arrays needed for undo and redo of modifications,
 * the arrays get filled and emptied explicitly.
 * @param {ol/feature[]} features The undo or redo features.
 * @param {String} mode The undo or redo mode.
 * @returns {void}
 */
export default function undoRedoFeatures (features, stack, mode, source) {
    if (features.length > 0) {
        const feature = features[features.length - 1];

        if (isDeleteAllMode(feature)) {
            this.undoRedoDeleteAll(mode, features, source);
        }
        else if (feature.mode === "draw") {
            if (mode === "undo") {
                source.removeFeature(feature.feature);
                stack.push({
                    feature: markRaw(feature.feature),
                    mode: "draw"
                });
                features.pop();
            }
            else if (mode === "redo") {
                source.addFeature(feature.feature);
                stack.push({
                    feature: markRaw(feature.feature),
                    mode: "draw"
                });
                features.pop();
            }
        }
        else if (feature.mode === "delete") {
            if (mode === "undo") {
                source.addFeature(feature.feature);
                stack.push({
                    feature: markRaw(feature.feature),
                    mode: "delete"
                });
                features.pop();
            }
            else if (mode === "redo") {
                source.removeFeature(feature.feature);
                stack.push({
                    feature: markRaw(feature.feature),
                    mode: "delete"
                });
                features.pop();
            }
        }
        else if (feature.mode === "modify") {
            if (mode === "undo") {
                const savedGeom = feature.feature;

                source.removeFeature(feature.feature);

                feature.feature.setGeometry(feature.originalGeometry);
                source.addFeature(feature.feature);
                stack.push({
                    feature: markRaw(savedGeom),
                    mode: "modify",
                    originalGeometry: markRaw(feature.originalGeometry),
                    modifiedGeometry: markRaw(feature.modifiedGeometry)
                });
                features.pop();
            }
            else if (mode === "redo") {
                feature.feature.setGeometry(feature.modifiedGeometry);
                feature.feature.changed();
                stack.push(features.pop());
            }
        }
        else if (feature.mode === "drawGroup") {
            const action = mode === "undo" ? f => source.removeFeature(f) : f => source.addFeature(f);

            feature.features.forEach(action);
            stack.push(features.pop());
        }
    }
}


