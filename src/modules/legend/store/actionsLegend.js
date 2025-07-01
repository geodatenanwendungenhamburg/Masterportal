import layerCollection from "@core/layers/js/layerCollection.js";
import validator from "../js/validator.js";
import legendDraw from "../js/legendDraw.js";
import layerCollector from "../js/layerCollector.js";

const actions = {
    /**
     * Creates the legend for all visible layers.
     * @param {Object} param.dispatch the dispatch
     * @returns {void}
     */
    createLegend ({dispatch}) {
        const allLayers = layerCollector.getLayerHolder();

        allLayers.forEach(layerHolder => {
            const {layer, visibility} = layerHolder;

            dispatch("toggleLayerInLegend", {layer, visibility});
        });
    },

    /**
     * Adds the legend of one layer to the legends in the store
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} legendObj Legend object of one layer
     * @returns {void}
     */
    addLegend ({state, commit}, legendObj) {
        const legends = state.legends;

        if (!legends.find(layer => layer.name === legendObj.name)) {
            legends.push(legendObj);
            commit("setLegends", legends);
        }
    },

    /**
     * Sorts the Legend Entries by position descending
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @returns {void}
     */
    sortLegend ({state, commit}) {
        const sorted = state.legends.sort(function (a, b) {
            return b.position - a.position;
        });

        commit("setLegends", sorted);
    },

    /**
     * Removes a layer legend from the legends in the store by given id.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {String} id Id of layer.
     * @returns {void}
     */
    removeLegend ({state, commit}, id) {
        const legends = state.legends.filter((legendObj) => {
            return legendObj.id !== id;
        });

        commit("setLegends", legends);
    },

    /**
     * Generates or removed the layers legend object.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} layer and visibility of the layer
     * @returns {void}
     */
    async toggleLayerInLegend ({dispatch}, {layer, visibility}) {
        const layerId = layer.get("id"),
            layerTyp = layer.get("typ");

        if (visibility === false) {
            dispatch("removeLegend", layerId);
        }
        else {
            if (layerTyp === "GROUP") {
                dispatch("prepareLegendForGroupLayer", layer.getLayerSource());
            }
            else {
                dispatch("prepareLegend", await layer.createLegend());
            }
            dispatch("generateLegend", layer);
        }
    },

    /**
     * Generates the legend object and adds it to the legend array in the store.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} layer the layer
     * @returns {void}
     */
    generateLegend ({dispatch, getters}, layer) {
        const id = layer.get("id"),
            zIndex = typeof layer.getLayer().getZIndex === "function" ? layer.getLayer().getZIndex() : 0,
            legendObj = {
                id: id,
                name: layer.get("name"),
                legend: getters.preparedLegend,
                position: zIndex
            },
            isValidLegend = validator.isValidLegendObj(legendObj),
            isNotInLegend = isValidLegend && !getters.isLayerInLegend(id),
            isLegendChanged = isValidLegend && !isNotInLegend && getters.isLegendChanged(legendObj);

        if (isNotInLegend) {
            dispatch("addLegend", legendObj);
        }
        else if (isLegendChanged) {
            dispatch("removeLegend", id);
            dispatch("addLegend", legendObj);
        }
        dispatch("sortLegend");
    },

    /**
     * Creates the legend for the layer info.
     * @param {Object} param.dispatch the dispatch
     * @param {String} layerId Id of layer to create the layer info legend.
     * @returns {void}
     */
    async createLegendForLayerInfo ({dispatch}, layerId) {
        let layer = layerCollection.getLayerById(layerId);

        if (!layer) {
            await dispatch("changeLayerVisibility", {layerId, visibility: true});
            layer = layerCollection.getLayerById(layerId);
            await dispatch("generateLegendForLayerInfo", layer);
            dispatch("changeLayerVisibility", {layerId, visibility: false});
        }
        else {
            dispatch("generateLegendForLayerInfo", layer);
        }
    },

    /**
     * Changes the visibility of a layer.
     * @param {Object} param.dispatch the dispatch
     * @param {String} layerId Id of layer to create the layer info legend.
     * @param {Boolean} visibility Visibility of layer to create the layer info legend.
     * @returns {void}
     */
    async changeLayerVisibility ({dispatch}, {layerId, visibility}) {
        await dispatch("replaceByIdInLayerConfig", {
            layerConfigs: [{
                id: layerId,
                layer: {
                    loadingStrategy: "all",
                    visibility: visibility
                }
            }]
        }, {root: true});
    },

    /**
     * Generates legend for the layer info.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} layer the layer
     * @returns {void}
     */
    async generateLegendForLayerInfo ({commit, dispatch}, layer) {
        let legendObj = null;

        if (layer) {
            let preparedLegend = null;

            if (layer.get("typ") === "GROUP") {
                preparedLegend = dispatch("prepareLegendForGroupLayer", layer.getLayerSource());
            }
            else {
                preparedLegend = dispatch("prepareLegend", await layer.createLegend());
            }

            legendObj = {
                id: layer.get("id"),
                name: layer.get("name"),
                legend: await preparedLegend,
                position: typeof layer.getLayer().getZIndex === "function" ? layer.getLayer().getZIndex() : 0
            };
            if (validator.isValidLegendObj(legendObj)) {
                commit("setLayerInfoLegend", legendObj);
            }
        }
    },

    /**
     * Prepares the legend with the given legendInfos
     * @param {Object} param.commit the commit
     * @param {Array} legendInfos legend Infos of layer
     * @returns {void}
     */
    prepareLegend ({commit}, legendInfos) {
        let preparedLegend = [];

        if (Array.isArray(legendInfos) && legendInfos.every(value => typeof value === "string") && legendInfos.length > 0) {
            preparedLegend = legendInfos;
        }
        else if (Array.isArray(legendInfos)) {
            legendInfos.forEach(legendInfo => {
                const geometryType = legendInfo.geometryType,
                    name = legendInfo.label,
                    style = legendInfo.styleObject;
                let legendObj = {
                    name
                };

                if (geometryType) {
                    legendObj = legendDraw.prepare(geometryType, style, name);
                }
                /** Style WMS */
                else if (legendInfo?.name && legendInfo?.graphic) {
                    legendObj = legendInfo;
                }
                if (Array.isArray(legendObj)) {
                    legendObj.forEach(obj => {
                        preparedLegend.push(obj);
                    });
                }
                else {
                    preparedLegend.push(legendObj);
                }
            });
        }

        commit("setPreparedLegend", preparedLegend);

        return preparedLegend;
    },

    /**
     * Prepares the legend array for a group layer by iterating over its sub-layers
     * and generating a grouped structure of legends for each child.
     * Each sub-layer's legends are generated as an array, and the resulting structure
     * is an array of arrays, preserving the grouping of legends by sub-layer.
     *
     * @param {Object} param.commit - The Vuex commit function for state mutations.
     * @param {Object} param.dispatch - The Vuex dispatch function to trigger other actions.
     * @param {ol/Layer/Source[]} layerSource - Array of sub-layer sources in the group layer.
     * @returns {Array[]} - A grouped legend structure as an array of arrays, where each
     *                      sub-array contains the legends for a specific sub-layer.
     */
    async prepareLegendForGroupLayer ({commit, dispatch}, layerSource) {
        const groupedLegends = [];

        for (let i = 0; i < layerSource.length; i++) {
            const layer = layerSource[i],
                subLayerLegend = await dispatch("prepareLegend", await layer.createLegend());

            groupedLegends.push(subLayerLegend);
        }

        commit("setPreparedLegend", groupedLegends);
        return groupedLegends;
    }
};

export default actions;
