import {markRaw} from "vue";

/**
 * Checks whether the given entry represents a "deleteAll" operation.
 * A deleteAll entry is stored as a plain array of features.
 * @param {Object|ol/Feature[]} entry The undo/redo stack entry to check.
 * @returns {Boolean} True if the entry is an array (deleteAll mode).
 */
export function isDeleteAllMode (entry) {
    return Array.isArray(entry);
}

/**
 * Handles undo/redo for a single "draw" or "delete" entry by toggling
 * the feature's presence on the source and pushing the inverse operation
 * onto the target stack.
 * @param {Object} entry The stack entry with {feature, mode}.
 * @param {String} direction "undo" or "redo".
 * @param {ol/source/Vector} source The vector source to add/remove features from.
 * @param {Object[]} stack The target stack to push the inverse entry onto.
 * @returns {void}
 */
function handleDrawOrDelete (entry, direction, source, stack) {
    const shouldAdd = (entry.mode === "draw" && direction === "redo") ||
        (entry.mode === "delete" && direction === "undo");

    if (shouldAdd) {
        source.addFeature(entry.feature);
    }
    else {
        source.removeFeature(entry.feature);
    }
    stack.push({
        feature: markRaw(entry.feature),
        mode: entry.mode
    });
}

/**
 * Handles undo/redo for a "modify" entry by swapping the feature's geometry
 * between its original and modified states.
 * @param {Object} entry The stack entry with {feature, mode, originalGeometry, modifiedGeometry}.
 * @param {String} direction "undo" or "redo".
 * @param {ol/source/Vector} source The vector source to update the feature on.
 * @param {Object[]} stack The target stack to push the inverse entry onto.
 * @returns {void}
 */
function handleModify (entry, direction, source, stack) {
    if (direction === "undo") {
        source.removeFeature(entry.feature);
        entry.feature.setGeometry(entry.originalGeometry);
        source.addFeature(entry.feature);
        stack.push({
            feature: markRaw(entry.feature),
            mode: "modify",
            originalGeometry: markRaw(entry.originalGeometry),
            modifiedGeometry: markRaw(entry.modifiedGeometry)
        });
    }
    else {
        entry.feature.setGeometry(entry.modifiedGeometry);
        entry.feature.changed();
        stack.push({
            feature: markRaw(entry.feature),
            mode: "modify",
            originalGeometry: markRaw(entry.originalGeometry),
            modifiedGeometry: markRaw(entry.modifiedGeometry)
        });
    }
}

/**
 * Handles undo/redo for a "drawGroup" entry by adding or removing all
 * features in the group at once.
 * @param {Object} entry The stack entry with {features, mode}.
 * @param {String} direction "undo" or "redo".
 * @param {ol/source/Vector} source The vector source to add/remove features from.
 * @param {Object[]} stack The target stack to push the inverse entry onto.
 * @returns {void}
 */
function handleDrawGroup (entry, direction, source, stack) {
    const action = direction === "undo"
        ? (f) => source.removeFeature(f)
        : (f) => source.addFeature(f);

    entry.features.forEach(action);
    stack.push(entry);
}

/**
 * Processes the top entry of the features stack to perform an undo or redo operation.
 * Pops the last entry from `features`, applies the corresponding source mutation,
 * and pushes the inverse entry onto `stack`.
 * @param {Array} features The source stack to pop from (undo or redo features).
 * @param {Array} stack The target stack to push the inverse entry onto.
 * @param {String} direction "undo" or "redo".
 * @param {ol/source/Vector} source The OL vector source for feature manipulation.
 * @param {Function} deleteAllHandler Callback to handle deleteAll entries,
 *     invoked with (direction, features, source).
 * @returns {void}
 */
export default function undoRedoFeatures (features, stack, direction, source, deleteAllHandler) {
    if (features.length === 0) {
        return;
    }

    const entry = features[features.length - 1];

    if (isDeleteAllMode(entry)) {
        deleteAllHandler(direction, features, source);
        return;
    }

    features.pop();

    if (entry.mode === "draw" || entry.mode === "delete") {
        handleDrawOrDelete(entry, direction, source, stack);
    }
    else if (entry.mode === "modify") {
        handleModify(entry, direction, source, stack);
    }
    else if (entry.mode === "drawGroup") {
        handleDrawGroup(entry, direction, source, stack);
    }
}


