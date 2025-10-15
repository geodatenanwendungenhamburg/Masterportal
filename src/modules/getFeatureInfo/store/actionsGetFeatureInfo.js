import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import {getWmsFeaturesByMimeType} from "@shared/js/utils/getWmsFeaturesByMimeType";
import {getVisibleWmsLayersAtResolution} from "../js/getLayers";
import store from "@appstore";
import layerCollection from "@core/layers/js/layerCollection";
import transformer from "@shared/js/utils/coordToPixel3D";
import changeCase from "@shared/js/utils/changeCase";
import get3DHighlightColor from "@shared/js/utils/get3DHighlightColor";
import applyTileStyle from "@shared/js/utils/applyTileStyle";
import remove3DFeatureHighlight from "@shared/js/utils/remove3DFeatureHighlight";

/**
 * The actions for the getFeatureInfo.
 * @module modules/getFeatureInfo/store/actionsGetFeatureInfo
 */
export default {
    /**
     * Highlights a 3D Tile when left-clicked.
     *
     * @param {Object} param - The parameters object.
     * @param {Object} param.getters - The getters from the Vuex store.
     * @param {Function} param.dispatch - The dispatch function from the Vuex store.
     * @param {Function} param.commit - The commit function from the Vuex store.
     * @returns {void}
     */
    highlight3DTile ({getters, dispatch, commit}) {
        commit("destroyGlobeEventHandler");

        const scene = mapCollection.getMap("3D").getCesiumScene(),
            highlightColor = get3DHighlightColor(getters.coloredHighlighting3D?.color, "RED"),
            globeEventHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        commit("setGlobeEventHandlerCheck", globeEventHandler);

        globeEventHandler.setInputAction(function onLeftClick (
            click
        ) {
            dispatch("Modules/SearchBar/removeHighlight3DTile", "", {root: true});
            dispatch("removeHighlightColor");
            const pickedFeature = scene.pick(click.position),
                featureId = pickedFeature?.getProperty("id");

            if (pickedFeature) {
                commit("setLastPickedFeatureId", featureId);
                applyTileStyle(featureId, highlightColor);
            }
            else {
                dispatch("removeHighlightColor");
            }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    /**
     * Resets the highlight color of all or a specific 3D tile.
     *
     * - If a specific feature is provided, only that feature's color is reset.
     * - If no feature is provided, all highlighted features are reset.
     *
     * @param {Object} context - The Vuex context object.
     * @returns {void}
     */
    removeHighlight3DTile ({dispatch, commit}) {
        dispatch("removeHighlightColor");

        commit("destroyGlobeEventHandler");
    },
    /**
     * Removes the highlight effect from the last picked 3D tile.
     *
     * @param {Object} param - The Vuex context object.
     * @param {Object} param.state - The current state from the Vuex store.
     * @param {Function} param.commit - The commit function from the Vuex store.
     * @returns {void}
     */
    removeHighlightColor ({state, commit}) {
        if (state.lastPickedFeatureId) {
            remove3DFeatureHighlight(state.lastPickedFeatureId);
            commit("setLastPickedFeatureId", null);
        }
    },

    /**
     * collects features for the gfi.
     * @param {Object} param store context
     * @param {Object} param.getters the getter
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @returns {void}
     */
    collectGfiFeatures ({getters, commit, dispatch, rootGetters}) {
        const clickCoordinate = rootGetters["Maps/clickCoordinate"],
            resolution = rootGetters["Maps/resolution"],
            projection = rootGetters["Maps/projection"],
            gfiFeaturesAtPixel = getters.gfiFeaturesAtPixel,
            gfiWmsLayerList = getVisibleWmsLayersAtResolution(resolution, rootGetters.visibleSubjectDataLayerConfigs.concat(rootGetters.visibleBaselayerConfigs)).filter(layer => {
                return layer.get("gfiAttributes") !== "ignore";
            });

        if (getters.menuExpandedBeforeGfi === null) {
            commit("setMenuExpandedBeforeGfi", rootGetters["Menu/expanded"](getters.menuSide));
        }

        Promise.all(gfiWmsLayerList.map(layer => {
            const gfiParams = {
                INFO_FORMAT: layer.get("infoFormat"),
                FEATURE_COUNT: layer.get("featureCount")
            };
            let url = layer.getSource().getFeatureInfoUrl(clickCoordinate, resolution, projection, gfiParams);

            // this part is needed if a Url contains a style which seems to mess up the getFeatureInfo call
            if (url.indexOf("STYLES") && url.indexOf("STYLES=&") === -1) {
                const newUrl = url.replace(/STYLES=.*?&/g, "STYLES=&");

                url = newUrl;
            }
            return getWmsFeaturesByMimeType(layer, url);
        }))
            .then(gfiFeatures => {
                const clickPixel = rootGetters["Maps/clickPixel"],
                    mode = rootGetters["Maps/mode"];
                let allGfiFeatures = gfiFeaturesAtPixel(clickPixel, clickCoordinate, mode).concat(...gfiFeatures);

                allGfiFeatures.sort((a, b) => {
                    const zIndexA = rootGetters.layerConfigById(a.getLayerId())?.zIndex || 0,
                        zIndexB = rootGetters.layerConfigById(b.getLayerId())?.zIndex || 0;

                    if (zIndexA < zIndexB) {
                        return -1;
                    }
                    else if (zIndexA > zIndexB) {
                        return 1;
                    }
                    return 0;
                });
                if (mode === "3D") {
                    allGfiFeatures = allGfiFeatures.reverse();
                }
                // only commit if features found
                if (allGfiFeatures.length > 0) {
                    commit("setGfiFeatures", allGfiFeatures);
                }
                else {
                    commit("setGfiFeatures", null);

                    const currentComponent = rootGetters["Menu/currentComponent"](getters.menuSide),
                        isGfiActive = currentComponent?.type === "getFeatureInfo";

                    if (!isGfiActive) {
                        return;
                    }

                    commit("Menu/switchToPreviousComponent", getters.menuSide, {root: true});

                    if (!getters.menuExpandedBeforeGfi) {
                        commit("Menu/setExpandedBySide", {expanded: false, side: getters.menuSide}, {root: true});
                    }

                    commit("setMenuExpandedBeforeGfi", null);
                }
            })
            .catch(error => {
                if (error.message.includes("The request is not allowed")) {
                    console.warn(error);
                }
                else {
                    dispatch("Alerting/addSingleAlert", i18next.t("common:modules.getFeatureInfo.errorMessage"), {root: true});
                }
            });
    },

    /**
     * Restores GFI from urlParams.
     * @param {Object} param store context
     * @param {Object} param.getters the getter
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} attributes of urlParams
     * @returns {void}
     */
    restoreFromUrlParams ({getters, dispatch, rootGetters}, attributes) {
        const componentName = changeCase.upperFirst(getters.type),
            clickCoordinates = attributes.clickCoordinates,
            mode = JSON.parse(rootGetters.urlParams.MAPS).mode;

        if (mode === "2D") {
            if (rootGetters.styleListLoaded) {
                dispatch("handleRestore2D", {attributes, componentName, clickCoordinates});
            }
            else {
                dispatch("waitAndRestore", {attributes, componentName, clickCoordinates, mode});
            }
        }
        else {
            dispatch("waitAndRestore", {attributes, componentName, clickCoordinates, mode});
        }
    },

    /**
     * Waits for 'styleListLoaded' and calls handleRestore2D if mode is 2D else waits for 'mapMode' change to 3D and calls handleRestore3D.
     * @param {Object} param store context
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload the payload
     * @param {Object} payload.attributes of urlParams
     * @param {String} payload.componentName name of this component
     * @param {Array} payload.clickCoordinates clicked coordinates of the feature
     * @param {Array} payload.mode mode of the map
     * @returns {void}
     */
    waitAndRestore ({dispatch}, {attributes, componentName, clickCoordinates, mode}) {
        if (mode === "2D") {
            store.watch((_, getters) => getters.styleListLoaded, value => {
                if (value) {
                    dispatch("handleRestore2D", {attributes, componentName, clickCoordinates});
                }
            });
        }
        else {
            store.watch((_, getters) => getters["Maps/mode"], mapMode => {
                if (mapMode === "3D") {
                    dispatch("handleRestore3D", {attributes, componentName, clickCoordinates});
                }
            });
        }

    },

    /**
     * Restores GFI from urlParams.
     * @param {Object} param store context
     * @param {Object} param.getters the getter
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} attributes of urlParams
     * @returns {void}
     */
    handleRestore3D ({dispatch, rootGetters}, {attributes, componentName, clickCoordinates}) {
        const visibleTerrainLayers = rootGetters.visibleLayerConfigs.filter(config => config.typ.toUpperCase() === "TERRAIN3D");

        // the feature can only be found in 'collectGfiFeatures' if terrain is visible
        if (visibleTerrainLayers.length > 0) {
            const clickPixel = transformer.coordToPixel3D(clickCoordinates),
                scene = mapCollection.getMap("3D").getCesiumScene();

            scene.globe.tileLoadProgressEvent.addEventListener(function () {
                if (scene.globe.tilesLoaded) {
                    dispatch("restoreGFI", {attributes, componentName, clickCoordinates, clickPixel});
                }
            });
        }
        else {
            console.warn("A terrain is not available, GFI cannot be restored!");
        }
    },

    /**
     * Waits for 'loadend' event of the map and waits for features loaded.
     * Calls restoreGFI.
     * @param {Object} param store context
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload the payload
     * @param {Object} payload.attributes of urlParams
     * @param {String} payload.componentName name of this component
     * @param {Array} payload.clickCoordinates clicked coordinates of the feature
     * @returns {void}
     */
    handleRestore2D ({dispatch}, {attributes, componentName, clickCoordinates}) {
        mapCollection.getMap("2D").once("loadend", function () {
            dispatch("restore2D", {attributes, componentName, clickCoordinates});
        });
    },

    /**
     * Waits for features loaded and calls restoreGFI.
     * @param {Object} param store context
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload the payload
     * @param {Object} payload.attributes of urlParams
     * @param {String} payload.componentName name of this component
     * @param {Array} payload.clickCoordinates clicked coordinates of the feature
     * @returns {void}
     */
    restore2D ({dispatch}, {attributes, componentName, clickCoordinates}) {
        const clickPixel = mapCollection.getMap("2D").getPixelFromCoordinate([clickCoordinates[0], clickCoordinates[1]]),
            layer = layerCollection.getLayerById(attributes.layerId),
            layerSource = layer.getLayerSource() instanceof Cluster ? layer.getLayerSource()?.getSource() : layer.getLayerSource();

        if (layerSource instanceof VectorSource) {
            if (layerSource.getFeatures().length > 0) {
                dispatch("restoreGFI", {attributes, componentName, clickCoordinates, clickPixel});
            }
            else {
                layerSource.once("featuresloadend", () => {
                    dispatch("restoreGFI", {attributes, componentName, clickCoordinates, clickPixel});
                });
            }
        }
        else {
            dispatch("restoreGFI", {attributes, componentName, clickCoordinates, clickPixel});
        }
    },

    /**
     * Shows the GFI for the given coordinates.
     * @param {Object} param store context
     * @param {Object} param.getters the getter
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} payload the payload
     * @param {Object} payload.attributes of urlParams
     * @param {String} payload.componentName componentName of this component
     * @param {Array} payload.clickCoordinates clicked coordinates of the feature
     * @param {Array} payload.clickPixels pixels of clicked coordinates of the feature
     * @returns {void}
     */
    restoreGFI ({getters, commit, dispatch}, {attributes, componentName, clickCoordinates, clickPixel}) {
        commit("Maps/setClickCoordinate", clickCoordinates, {root: true});
        commit("Maps/setClickPixel", clickPixel, {root: true});
        commit("setClickCoordinates", clickCoordinates);
        dispatch("Modules/GetFeatureInfo/collectGfiFeatures", null, {root: true});
        dispatch("Menu/activateCurrentComponent", {currentComponent: {type: getters.type}, componentName, side: getters.menuSide}, {root: true});
        dispatch("Menu/updateComponentState", {type: componentName, attributes}, {root: true});
    }
};
