import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";

const drawLayerId = "importDrawLayer",
    drawLayerConfig = {
        id: drawLayerId,
        name: drawLayerId,
        typ: "VECTORBASE",
        type: "layer",
        visibility: true,
        showInLayerTree: true,
        isDynamic: true
    };

/**
 * The actions for the draw module.
 * @module modules/draw/store/actionsDraw
 */
export default {
    /**
     * Initializes the draw layer by reusing an existing one or creating a new VECTORBASE layer.
     * @param {Object} context Vuex action context.
     * @returns {Object|null} The existing or newly created layer wrapper, or null if creation failed.
     */
    initializeDrawLayer ({dispatch}) {
        let existingLayer = layerCollection.getLayerById(drawLayerId);

        if (!existingLayer) {
            existingLayer = layerFactory.createLayer({
                ...drawLayerConfig,
                alwaysOnTop: true
            }, "2D");

            if (existingLayer) {
                layerCollection.addLayer(existingLayer);

                dispatch("addLayerToLayerConfig", {
                    layerConfig: drawLayerConfig,
                    parentKey: treeSubjectsKey
                }, {root: true});
            }
        }

        return existingLayer || null;
    }
};
