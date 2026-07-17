import markerHelper from "../../js/marker.js";
import {treeSubjectsKey, mainMenu, secondaryMenu} from "@shared/js/utils/constants.js";
import WKTUtil from "@shared/js/utils/getWKTGeom.js";
import wmsGFIUtil from "@shared/js/utils/getWmsFeaturesByMimeType.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import mapMarker from "@core/maps/js/mapMarker.js";
import calculateScreenPosition from "../../js/calculateScreenPosition.js";
import find3DPickedFeatureProvider from "@shared/js/utils/find3DPickedFeature.js";
import get3DHighlightColor from "@shared/js/utils/get3DHighlightColor.js";
import applyTileStyle from "@shared/js/utils/applyTileStyle.js";
import remove3DFeatureHighlight from "@shared/js/utils/remove3DFeatureHighlight.js";
import {convertColor} from "@shared/js/utils/convertColor.js";

/**
 * Contains actions that communicate with other components after an interaction, such as onClick or onHover, with a search result.
 * @module modules/searchBar/store/actions/actionsSearchBarSearchResult
 */
export default {
    /**
     * Activates a layer in the topic tree.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} payload The payload.
     * @param {String} payload.layerId The layer id.
     * @returns {void}
     */
    activateLayerInTopicTree: ({dispatch, rootGetters}, {layerId, source}) => {
        const layer = rootGetters.layerConfigById(layerId);

        if (layer) {
            let zIndex = layer.zIndex;

            if (!layer.showInLayerTree) {
                zIndex = rootGetters.determineZIndex(layerId);
            }
            dispatch("replaceByIdInLayerConfig", {
                layerConfigs: [{
                    id: layerId,
                    layer: {
                        id: layerId,
                        visibility: true,
                        showInLayerTree: true,
                        zIndex: zIndex
                    }
                }]
            }, {root: true});
        }
        else {
            dispatch("addLayerToTopicTree", {layerId, source});
        }
    },

    /**
     * Removes a layer from the topic tree.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} payload The payload.
     * @param {String} payload.layerId The layer id.
     * @returns {void}
     */
    removeLayerFromTopicTree: ({dispatch, rootGetters}, {layerId}) => {
        const layer = rootGetters.layerConfigById(layerId);

        if (layer) {
            dispatch("replaceByIdInLayerConfig", {
                layerConfigs: [{
                    id: layerId,
                    layer: {
                        id: layerId,
                        visibility: false,
                        showInLayerTree: false
                    }
                }]
            }, {root: true});
        }
    },

    /**
     * Add and activates a layer to the topic tree.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} payload The payload.
     * @param {String} payload.layerId The layer id.
     * @param {Object} payload.source The layer source.
     * @param {Object} [payload.showInLayerTree=true] showInLayerTree property of the layer to set.
     * @param {Object} [payload.visibility=true] visibility property of the layer to set.
     * @returns {void}
     */
    addLayerToTopicTree: ({dispatch, rootGetters}, {layerId, source, showInLayerTree = true, visibility = true}) => {
        if (!rootGetters.layerConfigById(layerId)) {
            dispatch("addLayerToLayerConfig", {
                layerConfig: {...source, ...{
                    id: layerId,
                    showInLayerTree: showInLayerTree,
                    type: "layer",
                    visibility: visibility
                }},
                parentKey: treeSubjectsKey
            }, {root: true}).then(added => {
                if (!added) {
                    dispatch("Alerting/addSingleAlert", {
                        category: "error",
                        content: i18next.t("common:modules.searchBar.layerResultNotShown")
                    }, {root: true});
                }
                window.trackMatomo?.("Layer", "Layer added via Search", rootGetters.layerConfigById(layerId).name + " (layerId: " + layerId + ")");
            });
        }
        else {
            dispatch("activateLayerInTopicTree", {layerId, source});
            window.trackMatomo?.("Layer", "Layer added via Search", rootGetters.layerConfigById(layerId).name + " (layerId: " + layerId + ")");
        }
    },

    /**
     * Highlight feature of the search result.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload The payload.
     * @param {Object} payload.hit The search result, must contain properties 'coordinate' as Array and 'geometryType'.
     * @returns {void}
     */
    highlightFeature: ({getters, dispatch}, {hit}) => {
        let feature,
            mapMarkerLayer;

        if (!Array.isArray(hit.coordinate[0])) {
            hit.geometryType = hit.geometryType.toUpperCase().replace("MULTI", "");
        }

        feature = WKTUtil.getWKTGeom(hit, hit.geometryType.toUpperCase());

        feature = feature?.getGeometry().getType() !== "MultiPolygon" ? feature : feature?.getGeometry();

        if (hit.geometryType === "Point" || hit.geometryType === "MultiPoint") {
            dispatch("Maps/placingPointMarker", feature, {root: true});
            mapMarkerLayer = mapMarker.getMapmarkerLayerById("marker_point_layer");
        }
        else {
            dispatch("Maps/placingPolygonMarker", feature, {root: true});
            mapMarkerLayer = mapMarker.getMapmarkerLayerById("marker_polygon_layer");
        }
        const extent = mapMarkerLayer.getSource().getExtent();

        if (markerHelper.extentIsValid(extent)) {
            dispatch("Maps/zoomToExtent", {extent: extent, options: {maxZoom: getters.zoomLevel}}, {root: true});
        }
    },

    /**
     * Opens the get feature info of the search result.
     * @param {Object} payload The payload.
     * @param {Object} payload.feature The feature to show the info for.
     * @param {Object} payload.layer The layer of the feature.
     * @returns {void}
     */
    openGetFeatureInfo: ({commit}, {feature, layer}) => {
        const gfiFeature = wmsGFIUtil.createGfiFeature(
            layer,
            "",
            feature
        );

        commit("Modules/GetFeatureInfo/setGfiFeatures", [gfiFeature], {root: true});
    },

    /**
     * Sets the marker to the feature of the search result.
     * Uses the style of GFI for highlighting multi-polygon if available.
     * @param {Object} context the vuex context
     * @param {Object} context.dispatch the dispatch
     * @param {Object} context.rootGetters the rootGetters
     * @param {Object} payload The payload.
     * @param {Array} payload.coordinates The coordinates to show marker at.
     * @param {Object} payload.feature The feature to set marker at.
     * @param {Object} payload.layer The dedicated layer.
     * @returns {void}
     */
    setMarker: ({dispatch, commit, state, rootGetters}, {coordinates, feature, geometryType, layer}) => {
        const numberCoordinates = coordinates?.map(coordinate => parseFloat(coordinate, 10)),
            geomType = feature ? feature?.getGeometry()?.getType() : geometryType;
        let coordinateForMarker = geomType === "GeometryCollection"
            ? markerHelper.getFirstPointCoordinates(feature, numberCoordinates)
            : numberCoordinates;

        if (layer && geomType === "MultiPolygon") {
            const highlightObject = {},
                highlightVectorRules = rootGetters["Modules/GetFeatureInfo/highlightVectorRules"],
                lastId = state.lastPickedFeatureId,
                prevFeature = rootGetters["Maps/highlightedFeatures"]?.find(f => f.getId?.() === lastId);

            if (prevFeature) {
                dispatch("Maps/removeHighlightFeature", prevFeature, {root: true});
            }

            let fill, stroke;

            if (highlightVectorRules && highlightVectorRules.fill && highlightVectorRules.stroke) {
                fill = {
                    color: convertColor(highlightVectorRules.fill.color)
                };
                stroke = {
                    color: convertColor(highlightVectorRules.stroke.color),
                    width: highlightVectorRules.stroke.width || 1
                };
            }
            else {
                const styleObject = styleList.returnStyleObject("defaultMapMarkerPolygon"),
                    style = styleObject.rules ? styleObject.rules[0].style : styleObject?.style;

                fill = {
                    color: `rgba(${style.polygonFillColor.join(", ")})`
                };
                stroke = {
                    color: `rgba(${style.polygonStrokeColor.join(", ")})`,
                    width: style.polygonStrokeWidth[0]
                };
            }

            highlightObject.highlightStyle = {fill, stroke};
            highlightObject.type = "highlightMultiPolygon";
            highlightObject.feature = feature;
            highlightObject.styleId = layer.get("styleId");
            dispatch("Maps/highlightFeature", highlightObject, {root: true});

            if (feature.getId?.()) {
                commit("setLastPickedFeatureId", feature.getId());
            }
        }
        if (feature && (geomType === "Polygon" || geomType === "MultiPolygon")) {
            const isPointInsidePolygon = markerHelper.checkIsCoordInsidePolygon(feature, coordinateForMarker);

            if (!isPointInsidePolygon) {
                coordinateForMarker = markerHelper.getRandomCoordinate(feature.getGeometry().getCoordinates());
            }
        }
        else if (!feature && (geomType === "Polygon" || geomType === "MultiPolygon" || geomType === "MultiLineString")) {
            const polygonFeature = WKTUtil.getWKTGeom([numberCoordinates], geometryType.toUpperCase());

            coordinateForMarker = polygonFeature.getGeometry().getFirstCoordinate();
        }
        dispatch("Maps/placingPointMarker", coordinateForMarker, {root: true});
    },

    /**
     * Open folders in layerSelection and shows layer or folder to select.
     * If layer is not contained, it is added.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {String} payload.layerId The layer id.
     * @param {String} payload.source The layer source from search result.
     * @returns {void}
     */
    showInTree: async ({commit, dispatch}, {layerId, source}) => {
        const layerConfig = await dispatch("retrieveLayerConfig", {layerId, source});

        commit("setShowSearchResultsInTree", true);
        dispatch("Menu/changeCurrentComponent", {type: "layerSelection", side: mainMenu, props: {name: "common:modules.layerSelection.name"}}, {root: true});
        if (layerId.includes("folder-")) {
            const folderChildId = layerConfig.elements[0]?.id;

            dispatch("Modules/LayerSelection/showLayer", {layerId: folderChildId}, {root: true});
            // unset the highlightLayerId in layerSelection, for not highlighting first child element of folder
            commit("Modules/LayerSelection/setHighlightLayerId", null, {root: true});
        }
        else if (layerConfig) {
            dispatch("Modules/LayerSelection/showLayer", {layerId}, {root: true});
        }
        else {
            console.warn("Cannot show layer with id ", layerId, ": is not contained in services.json");
            dispatch("Alerting/addSingleAlert", {
                category: "info",
                content: i18next.t("common:modules.searchBar.layerResultNotShown")
            }, {root: true});
        }

    },

    /**
     * Open the layer information.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload The payload.
     * @param {String} payload.layerId The layer id.
     * @param {String} payload.source The layer source from search result.
     * @returns {void}
     */
    showLayerInfo: async ({commit, dispatch}, {layerId, source}) => {
        const layerConfig = await dispatch("retrieveLayerConfig", {layerId, source});

        if (layerConfig) {
            dispatch("Modules/LayerInformation/startLayerInformation", layerConfig, {root: true});
            commit("Modules/LayerSelection/setLayerInfoVisible", true, {root: true});
        }
        else {
            console.warn("Cannot show info for layer with id ", layerId, ": is not contained in services.json");
            dispatch("Alerting/addSingleAlert", {
                category: "info",
                content: i18next.t("common:modules.searchBar.layerInfoNotShown")
            }, {root: true});
        }
    },

    /**
     * Returns the layerConfig for the given id.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} payload The payload.
     * @param {String} payload.layerId The layer id.
     * @param {String} payload.source The layer source from search result.
     * @returns {Object} the layerConfig
     */
    retrieveLayerConfig: ({dispatch, rootGetters}, {layerId, source}) => {
        let layerConfig = rootGetters.layerConfigById(layerId);

        if (!layerConfig && layerId.includes("folder-")) {
            layerConfig = rootGetters.folderById(layerId);
        }
        if (!layerConfig) {
            layerConfig = rawLayerList.getLayerWhere({id: layerId});
            if (source) {
                dispatch("addLayerToTopicTree", {layerId, source: source, showInLayerTree: false, visibility: false});
                layerConfig = rootGetters.layerConfigById(layerId);
            }
        }
        if (!layerConfig && source) {
            dispatch("addLayerToTopicTree", {layerId, source: source, showInLayerTree: false, visibility: false});
            layerConfig = rootGetters.layerConfigById(layerId);
        }
        return layerConfig;
    },

    /**
     * Starts the routing module and sets the routing start point to search result.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} payload The payload.
     * @param {Array} payload.coordinates The coordinates to start the route from.
     * @param {String} payload.name The name of the search result.
     * @returns {void}
     */
    startRouting: ({dispatch, rootGetters}, {coordinates, name}) => {
        const menuSide = secondaryMenu,
            menuExpanded = "Menu/expanded";

        dispatch("Menu/changeCurrentComponent", {type: "routing", side: menuSide, props: {name: i18next.t("common:modules.routing.name")}}, {root: true});
        if (!rootGetters[menuExpanded](menuSide)) {
            dispatch("Menu/toggleMenu", menuSide, {root: true});
        }
        dispatch("Modules/Routing/setFirstWayPoint", {displayName: name, coordinates}, {root: true});
    },

    /**
     * Zoom to the coordinates of the search result.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} payload The payload.
     * @param {Array} payload.coordinates The coordinates to zoom to.
     * @returns {void}
     */
    zoomToResult: ({dispatch, getters}, {coordinates}) => {
        const numberCoordinates = coordinates?.map(coordinate => parseFloat(coordinate, 10));

        if (numberCoordinates.length === 4) {
            const map = mapCollection.getMap("2D"),
                view = map.getView(),
                zoom = numberCoordinates ? view.getZoomForResolution(view.getResolutionForExtent(numberCoordinates, map.getSize())) : null;

            dispatch("Maps/zoomToExtent", {extent: numberCoordinates, options: {maxZoom: zoom}}, {root: true});
        }
        else {
            dispatch("Maps/zoomToCoordinates", {center: numberCoordinates, zoom: getters.zoomLevel}, {root: true});
        }

    },

    /**
     * Highlights a 3D tile feature at the given coordinates by changing its color.
     * Moves the camera to the specified coordinates and attempts to highlight a feature.
     *
     * @param {Object} context The Vuex context.
     * @param {Object} context.rootGetters The Vuex root getters.
     * @param {Function} context.dispatch The Vuex dispatch function.
     * @param {Object} payload The payload.
     * @param {Number[]} payload.coordinates The [longitude, latitude] of the feature to highlight.
     * @returns {void}
     */
    highlight3DTileByCoordinates ({rootGetters, dispatch}, {coordinates}) {
        if (rootGetters["Maps/mode"] !== "3D") {
            return;
        }

        const scene = mapCollection.getMap("3D").getCesiumScene(),
            [longitude, latitude] = coordinates,
            cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0),
            camera = scene.camera,
            cameraHeight = Cesium.Ellipsoid.WGS84.cartesianToCartographic(camera.position).height + 140;

        dispatch("Maps/setCamera", {
            cameraPosition: [longitude, latitude, cameraHeight],
            heading: 0,
            pitch: -90,
            roll: 0
        }, {root: true});

        dispatch("detectAndHighlight3DTile", {scene, cartesian});
    },

    /**
     * Detects and highlights a 3D tile feature at the given Cartesian coordinates.
     * If a previously highlighted feature exists, it attempts to highlight it again.
     * Otherwise, it performs a drill pick to find a new feature.
     *
     * @param {Object} context The Vuex context.
     * @param {Object} context.state The Vuex state.
     * @param {Function} context.dispatch The Vuex dispatch function.
     * @param {Function} context.commit The Vuex commit function.
     * @param {Object} payload The payload.
     * @param {Cesium.Scene} payload.scene The Cesium scene object.
     * @param {Cesium.Cartesian3} payload.cartesian The Cartesian coordinates of the feature.
     * @returns {Promise<void>}
     */
    async detectAndHighlight3DTile ({state, dispatch, commit}, {scene, cartesian}) {
        try {
            if (state.lastPickedFeatureId) {
                const pickedFeature = await find3DPickedFeatureProvider.find3DPickedFeature(scene, state.lastPickedFeatureId);

                if (pickedFeature) {
                    dispatch("highlightPickedFeature", {
                        pickedFeature
                    });

                    return;
                }
            }

            const screenPosition = calculateScreenPosition(scene, cartesian);

            if (!screenPosition) {
                console.warn("Unable to project the position into screen space.");
                return;
            }

            const pickedFeatures = scene.drillPick(screenPosition, undefined, 20, 20),
                pickedFeature = pickedFeatures.find(feature => typeof feature._batchId !== "undefined");

            if (pickedFeature) {
                commit("setLastPickedFeatureId", pickedFeature.getProperty("id"));

                dispatch("highlightPickedFeature", {pickedFeature});
            }
            else {
                dispatch("handleLayerLoading", {scene, cartesian});
            }
        }
        catch (error) {
            console.error("Error during camera move end:", error);
        }
    },

    /**
     * Listens to the Cesium postRender event and attempts to pick and highlight a 3D tile
     * feature at the given position on each rendered frame, throttled to once per 300 ms.
     * Stops after 15 s if no feature is found.
     *
     * @param {Object} context The Vuex context.
     * @param {Function} context.dispatch The Vuex dispatch function.
     * @param {Function} context.commit The Vuex commit function.
     * @param {Object} payload The payload.
     * @param {Cesium.Scene} payload.scene The Cesium scene object.
     * @param {Cesium.Cartesian3} payload.cartesian The world-space position of the feature.
     * @returns {void}
     */
    handleLayerLoading ({dispatch, commit}, {scene, cartesian}) {
        const startTime = Date.now(),
            maxWaitTime = 15000;
        let lastPickTime = startTime - 300;

        const removeListener = scene.postRender.addEventListener(() => {
            const now = Date.now();

            if (now - startTime > maxWaitTime) {
                removeListener();
                dispatch("removeHighlight3DTile");
                return;
            }

            if (now - lastPickTime < 300) {
                return;
            }
            lastPickTime = now;

            const screenPosition = calculateScreenPosition(scene, cartesian);

            if (!screenPosition) {
                return;
            }

            const pickedFeature = scene.drillPick(screenPosition, undefined, 20, 20)
                .find(f => typeof f._batchId !== "undefined");

            if (pickedFeature) {
                removeListener();
                commit("setLastPickedFeatureId", pickedFeature.getProperty("id"));
                dispatch("highlightPickedFeature", {pickedFeature});
            }
        });
    },

    /**
     * Applies a highlight effect to the given picked 3D tile feature.
     *
     * @param {Object} context The Vuex context.
     * @param {Object} context.getters The Vuex getters.
     * @param {Function} context.commit The Vuex commit function.
     * @param {Object} payload The payload.
     * @param {Object} payload.pickedFeature The picked Cesium 3D tile feature.
     * @returns {void}
     */
    highlightPickedFeature ({rootGetters, getters, commit, dispatch}, {pickedFeature}) {
        if (!pickedFeature || typeof pickedFeature.getProperty !== "function") {
            console.warn("Invalid picked feature:", pickedFeature);
            return;
        }

        const featureId = pickedFeature.getProperty("id"),
            gfiMenuSide = rootGetters["Modules/GetFeatureInfo/menuSide"],
            currentComponentType = rootGetters["Menu/currentComponent"](gfiMenuSide)?.type;

        if (!featureId) {
            console.warn("Picked feature has no ID:", pickedFeature);
            return;
        }

        dispatch("Modules/GetFeatureInfo/removeHighlightColor", "", {root: true});
        commit("Modules/GetFeatureInfo/setGfiFeatures", null, {root: true});

        if (currentComponentType === "getFeatureInfo") {
            commit("Menu/switchToPreviousComponent", gfiMenuSide, {root: true});
            if (gfiMenuSide === secondaryMenu && rootGetters["Menu/secondaryMenu"].currentComponent === "root") {
                dispatch("Menu/closeMenu", secondaryMenu, {root: true});
            }
        }

        applyTileStyle(featureId, get3DHighlightColor(getters.coloredHighlighting3D?.color, "YELLOW"));
        commit("setLastPickedFeatureId", featureId);
    },

    /**
     * Removes the highlight from the previously highlighted 3D tile feature.
     *
     * @param {Object} context The Vuex context.
     * @param {Function} context.commit The Vuex commit function.
     * @param {Object} context.state The Vuex state.
     * @returns {void}
     */
    removeHighlight3DTile ({commit, state}) {
        if (state.lastPickedFeatureId) {
            remove3DFeatureHighlight(state.lastPickedFeatureId);
            commit("setLastPickedFeatureId", null);
        }
    }
};
