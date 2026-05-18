import axios from "axios";
import markerHelper from "../../js/marker.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";
import WKTUtil from "@shared/js/utils/getWKTGeom.js";
import wmsGFIUtil from "@shared/js/utils/getWmsFeaturesByMimeType.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import mapMarker from "@core/maps/js/mapMarker.js";
import calculateScreenPosition from "../../js/calculateScreenPosition.js";
import addInitialTilesLoadedListener from "../../js/addInitialTilesLoadedListener.js";
import find3DPickedFeatureProvider from "@shared/js/utils/find3DPickedFeature.js";
import get3DHighlightColor from "@shared/js/utils/get3DHighlightColor.js";
import applyTileStyle from "@shared/js/utils/applyTileStyle.js";
import remove3DFeatureHighlight from "@shared/js/utils/remove3DFeatureHighlight.js";
import {convertColor} from "@shared/js/utils/convertColor.js";
import parseCswOnlineResource from "../../js/parseCswOnlineResource.js";
import resolveCswServiceConfig from "../../js/resolveCswServiceConfig.js";
import {addServiceLayersToExternalFolder} from "../../js/externalServiceFolder.js";
import {createWfsLoadingStrategyService} from "../../js/wfsLoadingStrategy.js";

/**
 * Finds an existing external service folder by name or creates a new one.
 * @param {Object} rootGetters Vuex rootGetters
 * @param {Function} dispatch Vuex dispatch
 * @param {String} serviceName Folder name
 * @returns {Promise<String|null>} Folder id or null if creation failed
 */
async function getOrCreateExternalServiceFolderId (rootGetters, dispatch, serviceName) {
    const existingFolder = rootGetters.allFolders
        .find(folder => folder.type === "folder" && folder.isExternal === true && folder.name === serviceName);

    if (existingFolder?.id) {
        return existingFolder.id;
    }

    const folderId = uniqueId("folder-");
    const folderConfig = {
        id: folderId,
        type: "folder",
        isExternal: true,
        name: serviceName,
        elements: []
    };
    const added = await dispatch("addLayerToLayerConfig", {
        layerConfig: folderConfig,
        parentKey: treeSubjectsKey
    }, {root: true});

    return added ? folderId : rootGetters.allFolders
        .find(folder => folder.type === "folder" && folder.isExternal === true && folder.name === serviceName)?.id || null;
}

/**
 * Returns hostname for service URL if available.
 * @param {String} baseUrl Service URL
 * @returns {String} Hostname or original URL
 */
function getHostnameOrUrl (baseUrl) {
    try {
        return new URL(baseUrl).hostname;
    }
    catch (error) {
        return baseUrl;
    }
}

/**
 * Adds discovered service layers to an external service folder.
 * @param {Object} param Parameters
 * @param {Object} param.rootGetters Vuex root getters
 * @param {Function} param.dispatch Vuex dispatch
 * @param {String} param.serviceType Layer service type, e.g. WMS or WFS
 * @param {String} param.serviceTitle Service title used as folder name
 * @param {Object[]} param.layerEntries Layer entries with name and sourceProps
 * @param {String} param.baseUrl Service base URL
 * @param {String} param.fileIdentifier CSW file identifier
 * @param {String} param.cswUrl CSW endpoint URL
 * @param {Number} param.resourceIndex Resource index
 * @param {Object} [param.additionalLayerProps={}] Extra layer props added to each entry
 * @returns {Promise<Boolean>} True if folder exists and layers were processed
 */
async function addServiceLayersToExternalFolder ({
    rootGetters,
    dispatch,
    serviceType,
    serviceTitle,
    layerEntries,
    baseUrl,
    fileIdentifier,
    cswUrl,
    resourceIndex,
    additionalLayerProps = {}
}) {
    const folderName = serviceTitle || getHostnameOrUrl(baseUrl) || fileIdentifier,
        folderId = await getOrCreateExternalServiceFolderId(rootGetters, dispatch, folderName);

    if (!folderId || !Array.isArray(layerEntries) || layerEntries.length === 0) {
        return false;
    }

    for (const layerEntry of layerEntries) {
        const layerName = layerEntry?.name || "",
            layerId = `csw-${fileIdentifier}-${resourceIndex}-${layerName}`,
            layerConfig = {
                id: layerId,
                name: layerName || fileIdentifier,
                url: baseUrl,
                typ: serviceType,
                metaID: fileIdentifier,
                cswUrl,
                type: "layer",
                isExternal: true,
                parentId: folderId,
                showInLayerTree: false,
                visibility: false,
                ...additionalLayerProps,
                ...layerEntry?.sourceProps
            };

        if (serviceType === "WMS" && !layerConfig.layers) {
            layerConfig.layers = layerName;
        }
        if (serviceType === "WFS" && !layerConfig.featureType) {
            layerConfig.featureType = layerName;
        }

        await dispatch("addLayerToLayerConfig", {
            layerConfig,
            parentKey: folderId
        }, {root: true});
    }

    return true;
}

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
        dispatch("Menu/changeCurrentComponent", {type: "layerSelection", side: "mainMenu", props: {name: "common:modules.layerSelection.name"}}, {root: true});
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
        // For CSW records the source already carries typ + datasets needed by the
        // LayerInformation panel. Use it directly to avoid adding a URL-less layer
        // to the topic tree (which would crash the Cesium WMS synchronizer).
        const isCswSource = source?.typ && Array.isArray(source?.datasets) && source.datasets.length > 0,
            layerConfig = isCswSource
                ? source
                : await dispatch("retrieveLayerConfig", {layerId, source});

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
        const menuSide = "secondaryMenu",
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
            height = 0,
            cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
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

            const screenPosition = calculateScreenPosition(scene, cartesian),
                pickedFeatures = scene.drillPick(screenPosition);

            if (!screenPosition) {
                console.warn("Unable to project the position into screen space.");
                return;
            }

            let pickedFeature;

            if (pickedFeatures.length > 0) {
                pickedFeature = pickedFeatures.find(feature => typeof feature._batchId !== "undefined");
            }

            if (!screenPosition) {
                console.warn("Unable to project the position into screen space.");
                return;
            }

            if (pickedFeature) {
                commit("setLastPickedFeatureId", pickedFeature?.getProperty("id"));

                dispatch("highlightPickedFeature", {pickedFeature});
            }
            else {
                dispatch("handleLayerLoading", {scene, screenPosition});
            }
        }
        catch (error) {
            console.error("Error during camera move end:", error);
        }
    },

    /**
     * Waits for 3D tiles to fully load, then attempts to pick and highlight a feature.
     * If no feature is found initially, retries after a short delay.
     *
     * @param {Object} context The Vuex context.
     * @param {Function} context.dispatch The Vuex dispatch function.
     * @param {Function} context.commit The Vuex commit function.
     * @param {Object} payload The payload.
     * @param {Cesium.Scene} payload.scene The Cesium scene object.
     * @param {Cesium.Cartesian2} payload.screenPosition The screen-space position to pick from.
     * @returns {Promise<void>}
     */
    async handleLayerLoading ({dispatch, commit}, {scene, screenPosition}) {
        try {
            const {allLayersLoaded, cleanup} = await addInitialTilesLoadedListener(scene.camera);

            if (!allLayersLoaded) {
                throw new Error("Not all layers are loaded.");
            }

            let pickedFeatures = scene.drillPick(screenPosition),
                pickedFeature = pickedFeatures.find(feature => feature._batchId !== undefined);

            if (pickedFeature) {
                commit("setLastPickedFeatureId", pickedFeature?.getProperty("id"));
                dispatch("highlightPickedFeature", {pickedFeature});
            }
            else {
                setTimeout(() => {
                    pickedFeatures = scene.drillPick(screenPosition);
                    pickedFeature = pickedFeatures.find(feature => feature._batchId !== undefined);

                    if (pickedFeature) {
                        commit("setLastPickedFeatureId", pickedFeature?.getProperty("id"));
                        dispatch("highlightPickedFeature", {pickedFeature});
                    }
                    else {
                        dispatch("removeHighlight3DTile");
                    }
                }, 1000);
            }
            cleanup();
        }
        catch (error) {
            console.error("Error waiting for layer loading:", error);
        }
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
            GetFeatureInfoMenSide = rootGetters["Modules/GetFeatureInfo/menuSide"],
            currentComponentType = rootGetters["Menu/currentComponent"](GetFeatureInfoMenSide)?.type;

        if (!featureId) {
            console.warn("Picked feature has no ID:", pickedFeature);
            return;
        }

        dispatch("Modules/GetFeatureInfo/removeHighlightColor", "", {root: true});
        commit("Modules/GetFeatureInfo/setGfiFeatures", null, {root: true});

        if (currentComponentType === "getFeatureInfo") {
            commit("Menu/switchToPreviousComponent", rootGetters["Modules/GetFeatureInfo/menuSide"], {root: true});
            if (GetFeatureInfoMenSide === "secondaryMenu" && rootGetters["Menu/secondaryMenu"].currentComponent === "root") {
                dispatch("Menu/closeMenu", "secondaryMenu", {root: true});
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
    },

    /**
     * Fetches the full CSW metadata record for the given fileIdentifier and adds the
     * first detected WMS or WFS distribution link as a new layer to the topic tree.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload The payload.
     * @param {String} payload.fileIdentifier The CSW fileIdentifier (metadata UUID).
     * @param {String} payload.cswUrl The URL of the CSW endpoint.
     * @returns {void}
     */
    addLayerFromCswRecord: async ({dispatch, rootGetters}, {fileIdentifier, cswUrl}) => {
        let responseXml;
        const unavailableServiceUrls = new Set();
        const gmdNs = "http://www.isotc211.org/2005/gmd";
        const gcoNs = "http://www.isotc211.org/2005/gco";

        try {
            const response = await axios.get(cswUrl, {
                params: {
                    service: "CSW",
                    request: "GetRecordById",
                    version: "2.0.2",
                    outputschema: gmdNs,
                    elementsetname: "full",
                    id: fileIdentifier
                }
            });

            responseXml = response.request?.responseXML || new DOMParser().parseFromString(response.data, "application/xml");
        }
        catch (error) {
            console.warn("addLayerFromCswRecord: Failed to fetch CSW record.", error);
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.searchBar.csw.noLayerLink")
            }, {root: true});
            return;
        }

        const onlineResources = responseXml.getElementsByTagNameNS(gmdNs, "CI_OnlineResource");

        // Extract the first bounding box from the GetRecordById response (WGS84).
        // Used to zoom to the layer extent when bbox loading strategy is applied.
        const bboxEl = responseXml.getElementsByTagNameNS(gmdNs, "EX_GeographicBoundingBox")[0],
            recordWest = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "westBoundLongitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
            recordSouth = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "southBoundLatitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
            recordEast = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "eastBoundLongitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
            recordNorth = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "northBoundLatitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null;

        let layerAdded = false;

        for (let i = 0; i < onlineResources.length; i++) {
            const parsedResource = parseCswOnlineResource(onlineResources[i]);

            if (!parsedResource.url) {
                continue;
            }

            const {
                typ,
                baseUrl,
                effectiveLayerName,
                wfsVersion,
                wfsOutputFormat,
                wfsFeatureNS,
                serviceUnavailable,
                serviceTitle,
                discoveredLayerEntries
            } = await resolveCswServiceConfig(parsedResource);

            if (!typ) {
                continue;
            }

            if (serviceUnavailable) {
                unavailableServiceUrls.add(baseUrl);
            }

            let wfsAdditionalProps = {};

            if (typ === "WFS") {
                wfsAdditionalProps = {
                    version: wfsVersion,
                    outputFormat: wfsOutputFormat
                };
                const wfsLoadingStrategyService = createWfsLoadingStrategyService({
                    baseUrl,
                    wfsVersion,
                    responseXml,
                    gmdNs,
                    gcoNs,
                    mapCollection,
                    dispatch
                });

                if (effectiveLayerName) {
                    const featureCount = await wfsLoadingStrategyService.getWfsHits(effectiveLayerName);

                    if (featureCount !== null && featureCount > wfsLoadingStrategyService.WFS_LARGE_LAYER_THRESHOLD) {
                        wfsAdditionalProps.loadingStrategy = "bbox";
                        wfsLoadingStrategyService.alertLargeLayer({featureCount, layerName: effectiveLayerName});
                    }
                    else {
                        wfsAdditionalProps.loadingStrategy = "all";
                    }
                }
                else if (discoveredLayerEntries.length > 0) {
                    await wfsLoadingStrategyService.applyDiscoveredWfsLoadingStrategies(discoveredLayerEntries);
                }
                }
            }

            if (discoveredLayerEntries.length > 0 && await addServiceLayersToExternalFolder({
                rootGetters,
                dispatch,
                serviceType: typ,
                serviceTitle,
                layerEntries: discoveredLayerEntries,
                baseUrl,
                fileIdentifier,
                cswUrl,
                resourceIndex: i,
                additionalLayerProps: typ === "WFS" ? wfsAdditionalProps : {}
            })) {
                layerAdded = true;
                break;
            }

            if ((typ === "WMS" || typ === "WFS") && !effectiveLayerName) {
                continue;
            }

            const singleLayerSourceProps = typ === "WMS"
                ? {layers: effectiveLayerName}
                : {featureType: effectiveLayerName};

            if (typ === "WFS" && wfsFeatureNS) {
                singleLayerSourceProps.featureNS = wfsFeatureNS;
            }

            const singleLayerEntries = [{
                name: effectiveLayerName,
                sourceProps: singleLayerSourceProps
            }];
            const singleLayerAdded = await addServiceLayersToExternalFolder({
                rootGetters,
                dispatch,
                serviceType: typ,
                serviceTitle,
                layerEntries: singleLayerEntries,
                baseUrl,
                fileIdentifier,
                cswUrl,
                resourceIndex: i,
                additionalLayerProps: typ === "WFS" ? wfsAdditionalProps : {}
            });

            if (singleLayerAdded) {
                layerAdded = true;
                break;
            }

            if ((typ === "WMS" || typ === "WFS") && !effectiveLayerName) {
                continue;
            }

            const layerId = `csw-${fileIdentifier}-${i}`,
                layerSource = {
                    id: layerId,
                    name: recordTitle || effectiveLayerName || fileIdentifier,
                    url: baseUrl,
                    typ: typ,
                    metaID: fileIdentifier,
                    cswUrl: cswUrl
                };

            if (typ === "WFS" && wfsFeatureNS) {
                singleLayerSourceProps.featureNS = wfsFeatureNS;
            }

            const singleLayerEntries = [{
                    name: effectiveLayerName,
                    sourceProps: singleLayerSourceProps
                }],
                singleLayerAdded = await addServiceLayersToExternalFolder({
                    rootGetters,
                    dispatch,
                    serviceType: typ,
                    serviceTitle,
                    layerEntries: singleLayerEntries,
                    baseUrl,
                    fileIdentifier,
                    cswUrl,
                    resourceIndex: i,
                    additionalLayerProps: typ === "WFS"
                        ? {
                            version: wfsVersion,
                            outputFormat: wfsOutputFormat
                        }
                        : {}
                });

            if (singleLayerAdded) {
                layerAdded = true;
                break;
            }
        }

        const operationTimestamp = new Date(Date.now() - 1000).toISOString(),
            commonAlertProps = {
                once: true,
                initial: false,
                displayFrom: operationTimestamp
            };
        let alertPayload;

        if (layerAdded) {
            alertPayload = {
                category: "success",
                title: i18next.t("common:modules.searchBar.csw.layerAddedTitle"),
                content: i18next.t("common:modules.searchBar.csw.layerAdded"),
                multipleAlert: true,
                ...commonAlertProps
            };
        }
        else if (unavailableServiceUrls.size > 0) {
            const firstUnavailableServiceUrl = unavailableServiceUrls.values().next().value;

            alertPayload = {
                category: "info",
                content: i18next.t("common:modules.searchBar.csw.noServiceResponse", {serviceUrl: firstUnavailableServiceUrl}),
                ...commonAlertProps
            };
        }
        else {
            alertPayload = {
                category: "info",
                content: i18next.t("common:modules.searchBar.csw.noLayerLink"),
                ...commonAlertProps
            };
        }

        dispatch("Alerting/addSingleAlert", alertPayload, {root: true});
    }
};
