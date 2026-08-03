import {pointerMove} from "ol/events/condition.js";
import {Fill, Style, Text} from "ol/style.js";
import {markRaw} from "vue";
import {convertColor} from "@shared/js/utils/convertColor.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import undoRedoFeatures, {isDeleteAllMode} from "./undoRedoFeatures.js";
import {getFeatureEditType} from "./editStyleInteractions.js";
import {createTooltipOverlay} from "./createTooltipOverlay.js";

/**
 * Creates a click handler that selects features on the map for style editing.
 * @param {module:ol/Map} map The OL map instance.
 * @param {ol/layer/Vector} layer The draw layer to match features against.
 * @param {Function|undefined} onFeatureSelected Callback for any feature selection.
 * @param {Function|undefined} onTextFeatureSelected Legacy callback for text features.
 * @returns {Function} The click handler to register on the map.
 */
function createFeatureClickHandler (map, layer, onFeatureSelected, onTextFeatureSelected) {
    return function (event) {
        let found = false;

        map.forEachFeatureAtPixel(event.pixel, (feature, featureLayer) => {
            if (featureLayer !== layer) {
                return false;
            }

            const editType = getFeatureEditType(feature);

            if (editType && onFeatureSelected) {
                onFeatureSelected(feature);
                found = true;
                return true;
            }
            else if (editType === "text" && onTextFeatureSelected) {
                const fillColor = feature.get("textFillColor") || [0, 0, 0, 1];

                onTextFeatureSelected({
                    feature,
                    text: feature.get("textContent") ?? "",
                    fontSize: feature.get("textFontSize") ?? 16,
                    font: feature.get("textFont") ?? "Arial",
                    fillColor: convertColor(fillColor.slice(0, 3), "hex"),
                    fillTransparency: Math.round((1 - (fillColor[3] ?? 1)) * 100)
                });
                found = true;
                return true;
            }
            return false;
        }, {hitTolerance: 10});

        if (!found) {
            if (onFeatureSelected) {
                onFeatureSelected(null);
            }
            else if (onTextFeatureSelected) {
                onTextFeatureSelected(null);
            }
        }
    };
}

/**
 * Updates the tooltip content and position based on the geometry of the feature being modified.
 * @param {ol/Feature} feature The feature being modified.
 * @param {HTMLDivElement} tooltipElement The tooltip HTML element.
 * @param {ol/Overlay} tooltipOverlay The tooltip overlay.
 * @returns {void}
 */
function updateModifyTooltip (feature, tooltipElement, tooltipOverlay) {
    const geometry = feature.getGeometry(),
        type = geometry.getType();

    if (type === "Circle") {
        const radius = Math.round(geometry.getRadius()),
            formattedRadius = radius.toLocaleString("de-DE"),
            center = geometry.getCenter();

        tooltipElement.innerHTML = `${i18next.t("common:modules.draw.drawSettings.radius")}: ${formattedRadius}m`;
        tooltipOverlay.setPosition(center);
    }
    else if (type === "Polygon" || type === "MultiPolygon") {
        const coords = geometry.getCoordinates()[0],
            area = Math.round(geometry.getArea()),
            formattedArea = area.toLocaleString("de-DE"),
            lastCoord = coords[coords.length - 1];

        tooltipElement.innerHTML = `${i18next.t("common:modules.draw.drawSettings.area")}: ${formattedArea}m²`;
        tooltipOverlay.setPosition(lastCoord);
    }
    else if (type === "LineString" || type === "MultiLineString") {
        const length = Math.round(geometry.getLength()),
            formattedLength = length.toLocaleString("de-DE"),
            coords = geometry.getCoordinates(),
            lastCoord = coords[coords.length - 1];

        tooltipElement.innerHTML = `${i18next.t("common:modules.draw.drawSettings.length")}: ${formattedLength}m`;
        tooltipOverlay.setPosition(lastCoord);
    }
    else {
        tooltipElement.style.display = "none";
    }
}

/**
 * Creates two select interactions for deleting features.
 * The first interaction is executed with a singleClick and deletes a feature.
 * The second interaction highlights the feature on hover/pointermove.
 * @param {ol/layer/Vector} layer The vector layer for drawings.
 * @returns {ol/interaction/Select[]} The select interactions.
 */
export function createSelectInteractions (layer) {
    return [
        selectInteraction.createSelectInteraction(layer),
        selectInteraction.createSelectInteraction(layer, pointerMove)
    ];
}

/**
 * Sets up the delete interaction by creating select interactions and registering feature removal.
 * @param {Object} context The component context containing state and map actions.
 * @param {ol/interaction/Select[]} context.currentSelectInteractions Current select interactions to remove.
 * @param {ol/layer/Vector} context.layer The vector layer for drawings.
 * @param {ol/source/Vector} context.source The vector source.
 * @param {Function} context.addInteraction Action to add an interaction to the map.
 * @param {Function} context.removeInteraction Action to remove an interaction from the map.
 * @returns {ol/interaction/Select[]} The newly created select interactions.
 */
export function setupDeleteInteraction ({currentSelectInteractions, layer, source, addInteraction, removeInteraction}) {
    currentSelectInteractions.forEach(interaction => removeInteraction(interaction));

    const newSelectInteractions = createSelectInteractions(layer);

    selectInteraction.removeSelectedFeature(newSelectInteractions[0], source);
    newSelectInteractions.forEach(interaction => addInteraction(interaction));

    return newSelectInteractions;
}

/**
 * Sets up the modify interaction with undo/redo tracking and text feature editing.
 * @param {Object} context The component context containing state and map actions.
 * @param {ol/interaction/Modify|null} context.currentModifyInteraction The current modify interaction to remove.
 * @param {ol/source/Vector} context.source The vector source.
 * @param {ol/layer/Vector} context.layer The vector layer for drawings.
 * @param {Object[]} context.undoFeatures The undo stack.
 * @param {Object[]} context.redoFeatures The redo stack.
 * @param {Function} context.addInteraction Action to add an interaction to the map.
 * @param {Function} context.removeInteraction Action to remove an interaction from the map.
 * @param {Function} [context.onTextFeatureSelected] Callback when a text feature is selected (legacy).
 * @param {Function} [context.onFeatureSelected] Callback when any feature is selected for style editing.
 * @param {Function} context.onModifyEnd Callback after a modify operation ends.
 * @returns {Object} Object containing {modifyInteraction, featureClickHandler}.
 */
export function setupModifyInteraction ({currentModifyInteraction, source, layer, undoFeatures, redoFeatures, addInteraction, removeInteraction, onTextFeatureSelected, onFeatureSelected, onModifyEnd}) {
    removeInteraction(currentModifyInteraction);

    const map = mapCollection.getMap("2D"),
        {tooltipOverlay, tooltipElement} = createTooltipOverlay();
    let originalGeometry = null,
        modifyFeature = null,
        geometryChangeListener = null;

    map.addOverlay(tooltipOverlay);

    const featureClickHandler = createFeatureClickHandler(map, layer, onFeatureSelected, onTextFeatureSelected);

    map.on("singleclick", featureClickHandler);

    const newModifyInteraction = modifyInteraction.createModifyInteraction(source, {
        onModifyEnd: (event) => {
            event.features.forEach(feature => {
                undoFeatures.push({
                    feature: markRaw(feature),
                    mode: "modify",
                    originalGeometry: markRaw(originalGeometry),
                    modifiedGeometry: markRaw(feature.getGeometry().clone())
                });
            });
            redoFeatures.length = 0;
            tooltipElement.style.display = "none";
            tooltipOverlay.setPosition(undefined);
            if (geometryChangeListener) {
                modifyFeature?.getGeometry()?.un("change", geometryChangeListener);
                geometryChangeListener = null;
            }
            onModifyEnd();
        },
        onModifyStart: (event) => {
            event.features.forEach(feature => {
                originalGeometry = feature.getGeometry().clone();
                modifyFeature = feature;
                tooltipElement.style.display = "block";
                geometryChangeListener = () => {
                    updateModifyTooltip(feature, tooltipElement, tooltipOverlay);
                };
                feature.getGeometry().on("change", geometryChangeListener);
            });
        }
    });

    addInteraction(newModifyInteraction);
    newModifyInteraction.setActive(true);

    return {modifyInteraction: newModifyInteraction, featureClickHandler, tooltipOverlay};
}

/**
 * Removes all features from the source and stores them in the undo stack.
 * @param {ol/source/Vector} source The vector source to clear.
 * @param {Object[]} undoFeatures The undo stack.
 * @returns {void}
 */
export function deleteAllFeatures (source, undoFeatures) {
    undoFeatures.push(source.getFeatures());
    source.clear();
}

/**
 * Performs an undo operation on the feature stacks.
 * @param {Object[]} undoFeatures The undo stack.
 * @param {Object[]} redoFeatures The redo stack.
 * @param {ol/source/Vector} source The vector source.
 * @param {Function} deleteAllHandler Handler for deleteAll undo/redo operations.
 * @returns {void}
 */
export function performUndo (undoFeatures, redoFeatures, source, deleteAllHandler) {
    undoRedoFeatures(undoFeatures, redoFeatures, "undo", source, deleteAllHandler);
}

/**
 * Performs a redo operation on the feature stacks.
 * @param {Object[]} redoFeatures The redo stack.
 * @param {Object[]} undoFeatures The undo stack.
 * @param {ol/source/Vector} source The vector source.
 * @param {Function} deleteAllHandler Handler for deleteAll undo/redo operations.
 * @returns {void}
 */
export function performRedo (redoFeatures, undoFeatures, source, deleteAllHandler) {
    undoRedoFeatures(redoFeatures, undoFeatures, "redo", source, deleteAllHandler);
}

/**
 * Handles the undo/redo of a deleteAll operation.
 * On undo, features are restored to the source. On redo, features are removed again.
 * @param {String} mode "undo" or "redo".
 * @param {Array} features The features stack containing the deleteAll entry.
 * @param {ol/source/Vector} source The vector source.
 * @param {Object[]} undoFeatures The undo stack (for redo push).
 * @param {Object[]} redoFeatures The redo stack (for undo push).
 * @returns {void}
 */
export function handleDeleteAll (mode, features, source, undoFeatures, redoFeatures) {
    const featureArray = features.pop();

    if (mode === "undo") {
        source.addFeatures(featureArray);
        redoFeatures.push(featureArray);
    }
    else if (mode === "redo") {
        featureArray.forEach(feat => source.removeFeature(feat));
        undoFeatures.push(featureArray);
    }
}

/**
 * Applies text edits to a feature by updating its style and attributes.
 * @param {Object} params The text edit parameters.
 * @param {ol/Feature} params.feature The feature to update.
 * @param {String} params.text The text content.
 * @param {Number} params.fontSize The font size in pixels.
 * @param {String} params.font The font family.
 * @param {String} params.fillColor The fill color as hex string.
 * @param {Number} params.fillTransparency The fill transparency as percentage (0-100).
 * @returns {void}
 */
export function applyTextEditToFeature ({feature, text, fontSize, font, fillColor, fillTransparency}) {
    if (!feature) {
        return;
    }

    const alpha = 1 - (fillTransparency / 100),
        colorArray = [...convertColor(fillColor, "rgb"), alpha],
        newStyle = new Style({
            text: new Text({
                text: text,
                font: `${fontSize}px ${font}`,
                fill: new Fill({color: colorArray})
            })
        });

    feature.set("textFillColor", colorArray);
    feature.set("textContent", text);
    feature.set("textFontSize", fontSize);
    feature.set("textFont", font);
    feature.setStyle(newStyle);
}

/**
 * Toggles the visibility of the draw layer.
 * @param {ol/layer/Vector} layer The draw layer.
 * @returns {Boolean} The new visibility state.
 */
export function toggleLayerVisibility (layer) {
    if (!layer) {
        return true;
    }

    const isVisible = layer.getVisible();

    layer.setVisible(!isVisible);
    return !isVisible;
}

export {isDeleteAllMode};
