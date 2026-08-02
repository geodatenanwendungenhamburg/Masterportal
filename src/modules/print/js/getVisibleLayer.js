import {Group as LayerGroup} from "ol/layer.js";
import store from "@appstore/index.js";
import zIndexManager from "@core/layers/js/zIndexManager.js";
/**
 * Collects all visible ol layers, including layers of groups.
 * @param {Boolean} [printMapMarker=false] whether layer "markerPoint" should be filtered out
 * @returns {void}
 */
function getVisibleLayer (printMapMarker = false) {
    let visibleLayerList = getVisibleLayerList(printMapMarker);
    const groupedLayers = getGroupedLayers(visibleLayerList);

    if (groupedLayers.length > 0) {
        visibleLayerList = visibleLayerList.filter(layer => {
            return !(layer instanceof LayerGroup);
        });
        groupedLayers.forEach(groupedLayer => {
            const gLayerZIndex = typeof groupedLayer.getZIndex === "function" ? groupedLayer.getZIndex() : undefined;

            groupedLayer.getLayers().forEach(gLayer => {
                // layer opacity is only set for printing and later it is reverted
                gLayer.setOpacity(groupedLayer.getOpacity());
                if (gLayerZIndex !== undefined) {
                    gLayer.setZIndex(gLayerZIndex);
                }
                visibleLayerList.push(gLayer);
            });
        });
    }
    checkLayersInResolution(visibleLayerList);
}

/**
 * Gets grouped layers.
 * @param {Object} visibleLayerList The list of visible layers from the "2D" map.
 * @returns {Object} {groupedLayers} layers that are instances of `LayerGroup`
 */
function getGroupedLayers (visibleLayerList) {
    let groupedLayers = null;

    groupedLayers = visibleLayerList.filter(layer => {
        return layer instanceof LayerGroup;
    });

    return groupedLayers;
}

/**
 * Gets visible layer list.
 * @param {Boolean} [printMapMarker=false] whether layer "markerPoint" should be filtered out
 * @returns {Object} {visibleLayerList} The list of visible layers from the "2D" map.
 */
function getVisibleLayerList (printMapMarker = false) {
    const layers = mapCollection.getMap("2D").getLayers(),
        visibleLayerList = typeof layers?.getArray !== "function" ? [] : layers.getArray().filter(layer => {
            return layer.getVisible() === true &&
                (
                    layer.get("name") !== "markerPoint" || printMapMarker
                );
        });

    return visibleLayerList;
}

/**
 * Layer opacity is reverted after closing print map tab.
 * @param {Boolean} [printMapMarker=false] whether layer "markerPoint" should be filtered out
 * @returns {void}
 */
function revertLayerOpacity (printMapMarker = false) {
    const visibleLayerList = this.getVisibleLayerList(printMapMarker),
        groupedLayers = this.getGroupedLayers(visibleLayerList);

    if (groupedLayers.length > 0) {
        groupedLayers.forEach(groupedLayer => {
            groupedLayer.getLayers().forEach(gLayer => {
                gLayer.setOpacity(1);
            });
        });
    }
}

/**
 * checks whether the layers may be displayed or printed at the selected scale.
 * @param {array} visibleLayerList with visible layer
 * @returns {void}
 */
function checkLayersInResolution (visibleLayerList) {
    const resoByMaxScale = store.getters["Maps/getResolutionByScale"](store.getters["Modules/Print/currentScale"], "max"),
        resoByMinScale = store.getters["Maps/getResolutionByScale"](store.getters["Modules/Print/currentScale"], "min"),
        invisibleLayer = [],
        newVisibleLayer = [];
    let invisibleLayerNames = "";

    visibleLayerList.forEach(layer => {
        if (resoByMaxScale > layer.getMaxResolution() || resoByMinScale < layer.getMinResolution()) {
            const layerName = Array.isArray(layer.get("name")) ? layer.get("name")[0] : layer.get("name");

            invisibleLayer.push(layer);
            invisibleLayerNames += "- " + layerName + "<br>";
        }
        else {
            newVisibleLayer.push(layer);
        }
    });
    store.commit("Modules/Print/setInvisibleLayer", invisibleLayer);
    store.commit("Modules/Print/setInvisibleLayerNames", invisibleLayerNames);
    store.dispatch("Modules/Print/setVisibleLayerList", zIndexManager.sortVisibleLayerListByZindexBeforePrint(newVisibleLayer));
}

export default {getVisibleLayer, getGroupedLayers, getVisibleLayerList, revertLayerOpacity};
