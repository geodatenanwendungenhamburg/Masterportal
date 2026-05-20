import axios from "axios";
import crs from "@masterportal/masterportalapi/src/crs.js";
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
import parseGeoNetworkLink from "../../js/parseGeoNetworkLink.js";
import detectServiceType from "../../js/detectServiceType.js";

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
    addLayerFromCswRecord: async ({dispatch}, {fileIdentifier, recordTitle, cswUrl}) => {
        const WMS_PROTOCOLS = ["OGC:WMS", "WWW:LINK-1.0-http--ogc-wms", "OGC Web Map Service", "serviceType/ogc/wms"],
            WFS_PROTOCOLS = ["OGC:WFS", "WWW:LINK-1.0-http--ogc-wfs", "OGC Web Feature Service", "serviceType/ogc/wfs"];
        let responseXml;

        try {
            const response = await axios.get(cswUrl, {
                params: {
                    service: "CSW",
                    request: "GetRecordById",
                    version: "2.0.2",
                    outputschema: "http://www.isotc211.org/2005/gmd",
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

        const gmdNs = "http://www.isotc211.org/2005/gmd",
            gcoNs = "http://www.isotc211.org/2005/gco",
            onlineResources = responseXml.getElementsByTagNameNS(gmdNs, "CI_OnlineResource");

        // Extract the first bounding box from the GetRecordById response (WGS84).
        // Used to zoom to the layer extent when bbox loading strategy is applied.
        const bboxEl = responseXml.getElementsByTagNameNS(gmdNs, "EX_GeographicBoundingBox")[0],
            recordWest = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "westBoundLongitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
            recordSouth = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "southBoundLatitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
            recordEast = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "eastBoundLongitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
            recordNorth = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "northBoundLatitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null;

        let layerAdded = false;

        for (let i = 0; i < onlineResources.length; i++) {
            const resource = onlineResources[i],
                protocolEl = resource.getElementsByTagNameNS(gmdNs, "protocol")[0],
                protocolCharString = protocolEl?.getElementsByTagNameNS(gcoNs, "CharacterString")[0],
                protocolAnchor = protocolEl?.getElementsByTagNameNS("http://www.isotc211.org/2005/gmx", "Anchor")[0],
                protocol = protocolCharString?.textContent?.trim()
                    || (protocolAnchor?.getAttribute("xlink:href") + " " + (protocolAnchor?.textContent?.trim() || "")).trim()
                    || "",
                urlEl = resource.getElementsByTagNameNS(gmdNs, "linkage")[0]
                    ?.getElementsByTagNameNS(gmdNs, "URL")[0],
                url = urlEl?.textContent?.trim() || "",
                nameEl = resource.getElementsByTagNameNS(gmdNs, "name")[0]
                    ?.getElementsByTagNameNS(gcoNs, "CharacterString")[0],
                layerName = nameEl?.textContent?.trim() || "";

            if (!url) {
                continue;
            }

            let typ = null;

            if (WMS_PROTOCOLS.some(p => protocol.toUpperCase().includes(p.toUpperCase()))) {
                typ = "WMS";
            }
            else if (WFS_PROTOCOLS.some(p => protocol.toUpperCase().includes(p.toUpperCase()))) {
                typ = "WFS";
            }
            else if (!protocol) {
                const upperUrl = url.toUpperCase();

                if (upperUrl.includes("SERVICE=WMS") || upperUrl.includes("/WMS") || upperUrl.includes("_WMS") || upperUrl.includes("WMS_")) {
                    typ = "WMS";
                }
                else if (upperUrl.includes("SERVICE=WFS") || upperUrl.includes("/WFS") || upperUrl.includes("_WFS") || upperUrl.includes("WFS_")) {
                    typ = "WFS";
                }
            }

            if (typ) {
                const urlQuery = url.includes("?") ? url.split("?")[1] : "",
                    urlParams = new URLSearchParams(urlQuery),
                    urlLayerParam = urlParams.get("LAYERS") || urlParams.get("layers") || urlParams.get("Layers") || "",
                    baseUrl = url.split("?")[0],
                    // OGC standard params that must not be forwarded in the base URL —
                    // they are added by the OL source or the GetCapabilities call below.
                    OGC_QUERY_PARAMS = new Set([
                        "service", "request", "version", "layers", "styles", "format",
                        "transparent", "bbox", "width", "height", "crs", "srs",
                        "info_format", "query_layers", "i", "j", "x", "y",
                        "typename", "typenames", "outputformat", "srsname",
                        "maxfeatures", "count", "resulttype"
                    ]),
                    // Custom routing params required by the server (e.g. NodeId=1151).
                    customUrlParams = Object.fromEntries(
                        Array.from(urlParams.entries())
                            .filter(([k]) => !OGC_QUERY_PARAMS.has(k.toLowerCase()))
                    ),
                    hasCustomParams = Object.keys(customUrlParams).length > 0,
                    // Base URL that includes custom params but excludes OGC request params.
                    effectiveBaseUrl = hasCustomParams
                        ? `${baseUrl}?${new URLSearchParams(customUrlParams).toString()}`
                        : baseUrl;
                // CI_OnlineResource/name is sometimes a human-readable description
                // rather than a technical layer identifier. Reject it when it:
                //   - contains whitespace (e.g. "WMS GetCapabilities Anfrage, welche...")
                //   - contains parentheses (e.g. "(GetCapabilities)" — InGrid/metaver pattern)
                //   - matches a known OGC operation name
                const OGC_OPERATIONS = ["getcapabilities", "getmap", "getfeature", "gettile", "getlegendgraphic", "getfeatureinfo"],
                    technicalLayerName = layerName
                        && !layerName.includes(" ")
                        && !layerName.includes("(")
                        && !layerName.includes(")")
                        && !OGC_OPERATIONS.includes(layerName.toLowerCase())
                        ? layerName : "";
                let effectiveLayerName = technicalLayerName || urlLayerParam,
                    wfsVersion = "1.1.0",
                    wfsOutputFormat = "XML",
                    wfsFeatureNS = "";

                if (typ === "WMS" && !effectiveLayerName) {
                    try {
                        const capResponse = await axios.get(baseUrl, {
                            params: {...customUrlParams, SERVICE: "WMS", REQUEST: "GetCapabilities"}
                        });
                        const capXml = capResponse.request?.responseXML
                            || new DOMParser().parseFromString(capResponse.data, "application/xml");

                        effectiveLayerName = Array.from(capXml.getElementsByTagName("Layer"))
                            .map(el => {
                                const nameEl2 = el.children && Array.from(el.children).find(c => c.localName === "Name");

                                return nameEl2?.textContent?.trim() || "";
                            })
                            .filter(n => n.length > 0)
                            .join(",");
                    }
                    catch (capError) {
                        console.warn("addLayerFromCswRecord: WMS GetCapabilities failed, layers will be empty.", capError);
                    }
                }
                else if (typ === "WFS") {
                    // WFS: featureType must be set, fetch GetCapabilities to discover
                    // FeatureType names and version. deegree WFS 2.0 requires VERSION=2.0.0
                    // to return a populated FeatureTypeList.
                    for (const ver of ["2.0.0", "1.1.0", "1.0.0"]) {
                        try {
                            const capResponse = await axios.get(baseUrl, {
                                params: {...customUrlParams, SERVICE: "WFS", REQUEST: "GetCapabilities", VERSION: ver}
                            });
                            const capXml = capResponse.request?.responseXML
                                || new DOMParser().parseFromString(capResponse.data, "application/xml");

                            // Read declared version from root element attribute
                            const rootEl = capXml.documentElement;
                            const declaredVersion = rootEl?.getAttribute("version") || ver;

                            // Collect first FeatureType — name may carry a namespace prefix
                            // e.g. <Name xmlns:plu="http://...">plu:OfficialDocumentation</Name>
                            const firstFt = Array.from(capXml.getElementsByTagName("FeatureType"))
                                .find(ft => {
                                    const nameEl2 = Array.from(ft.children).find(c => c.localName === "Name");

                                    return nameEl2?.textContent?.trim().length > 0;
                                });

                            if (firstFt) {
                                const nameEl2 = Array.from(firstFt.children).find(c => c.localName === "Name");
                                const fullName = nameEl2.textContent.trim();

                                effectiveLayerName = fullName;
                                wfsVersion = declaredVersion;

                                // Resolve featureNS from the namespace prefix on the Name element.
                                // e.g. <Name xmlns:plu="http://inspire.ec.europa.eu/schemas/plu/4.0">plu:OfficialDocumentation</Name>
                                // → prefix="plu", featureNS="http://inspire.ec.europa.eu/schemas/plu/4.0"
                                const colonIdx = fullName.indexOf(":");

                                // Resolve featureNS from prefix; keep effectiveLayerName as-is (e.g. plu:OfficialDocumentation)
                                // so masterportalapi receives the full prefixed name it expects.
                                if (colonIdx !== -1) {
                                    const prefix = fullName.slice(0, colonIdx),
                                        resolvedNs = nameEl2.lookupNamespaceURI(prefix);

                                    wfsFeatureNS = resolvedNs || wfsFeatureNS;
                                }

                                // Detect the best supported output format
                                const formats = Array.from(capXml.getElementsByTagName("Format"))
                                    .map(f => f.textContent?.trim())
                                    .filter(Boolean);
                                const preferredFormats = [
                                    "application/gml+xml; version=3.2",
                                    "text/xml; subtype=gml/3.2.1",
                                    "text/xml; subtype=gml/3.1.1",
                                    "GML32",
                                    "GML3",
                                    "GML2",
                                    "XML"
                                ];

                                wfsOutputFormat = preferredFormats.find(f => formats.some(cf => cf.toLowerCase() === f.toLowerCase()))
                                    || formats[0]
                                    || wfsOutputFormat;
                                break;
                            }
                        }
                        catch (capError) {
                            // Try next version
                        }
                    }
                }

                const layerId = `csw-${fileIdentifier}-${i}`,
                    layerSource = {
                        id: layerId,
                        name: recordTitle || effectiveLayerName || fileIdentifier,
                        url: effectiveBaseUrl,
                        typ: typ,
                        metaID: fileIdentifier,
                        cswUrl: cswUrl,
                        gfiAttributes: "showAll"
                    };

                if (typ === "WMS") {
                    layerSource.layers = effectiveLayerName;
                }
                else if (typ === "WFS") {
                    layerSource.featureType = effectiveLayerName;
                    layerSource.version = wfsVersion;
                    layerSource.outputFormat = wfsOutputFormat;
                    if (wfsFeatureNS) {
                        layerSource.featureNS = wfsFeatureNS;
                    }

                    // Check feature count via resultType=hits to decide loading strategy.
                    // If the service returns more than WFS_LARGE_LAYER_THRESHOLD features,
                    // switch to bbox loading to avoid performance issues.
                    const WFS_LARGE_LAYER_THRESHOLD = 1000;

                    try {
                        const hitsResponse = await axios.get(baseUrl, {
                                params: {
                                    SERVICE: "WFS",
                                    REQUEST: "GetFeature",
                                    VERSION: wfsVersion,
                                    TYPENAME: effectiveLayerName || undefined,
                                    resultType: "hits"
                                }
                            }),
                            hitsDoc = hitsResponse.request?.responseXML
                                || new DOMParser().parseFromString(hitsResponse.data, "application/xml"),
                            fcEl = hitsDoc.documentElement,
                            hitsAttr = fcEl?.getAttribute("numberOfFeatures")
                                || fcEl?.getAttribute("numberMatched"),
                            featureCount = hitsAttr ? parseInt(hitsAttr, 10) : null;

                        if (featureCount !== null && featureCount > WFS_LARGE_LAYER_THRESHOLD) {
                            layerSource.loadingStrategy = "bbox";
                            dispatch("Alerting/addSingleAlert", {
                                category: "info",
                                content: i18next.t("common:modules.searchBar.csw.largeWfsLayer", {count: featureCount})
                            }, {root: true});

                            // Zoom in so the initial bbox request covers only a small area.
                            // Compute the center of the record's bounding box and zoom to level 7.
                            if (recordWest !== null && !isNaN(recordWest)) {
                                const mapProjection = mapCollection.getMap("2D")?.getView()?.getProjection()?.getCode(),
                                    centerLon = (recordWest + recordEast) / 2,
                                    centerLat = (recordSouth + recordNorth) / 2;
                                let center = [centerLon, centerLat];

                                if (mapProjection && mapProjection !== "EPSG:4326") {
                                    center = crs.transformToMapProjection(mapCollection.getMap("2D"), "EPSG:4326", center);
                                }
                                dispatch("Maps/zoomToCoordinates", {center, zoom: 7}, {root: true});
                            }
                        }
                        else {
                            layerSource.loadingStrategy = "all";
                        }
                    }
                    catch (hitsError) {
                        // hits request failed — proceed without strategy restriction
                        console.warn("addLayerFromCswRecord: WFS hits request failed.", hitsError);
                    }
                }

                dispatch("addLayerToTopicTree", {layerId, source: layerSource, showInLayerTree: true, visibility: true});
                layerAdded = true;
                break;
            }
        }

        if (!layerAdded) {
            dispatch("Alerting/addSingleAlert", {
                category: "info",
                content: i18next.t("common:modules.searchBar.csw.noLayerLink")
            }, {root: true});
        }
    },

    /**
     * Adds the first usable WMS or WFS layer from a GeoNetwork Elasticsearch record.
     * The `links` array contains only WMS/WFS entries, already filtered by the search
     * interface, so no additional catalog request is needed.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload The payload.
     * @param {Object[]} payload.links GeoNetwork ES link objects (WMS/WFS only).
     * @param {String} payload.fileIdentifier The record UUID.
     * @param {String} payload.geoNetworkApiUrl The GeoNetwork API base URL.
     * @param {String} [payload.recordTitle] Display title of the record.
     * @param {Object} [payload.bbox] Bounding box {west, south, east, north} in WGS84.
     * @returns {void}
     */
    addLayerFromGeoNetworkRecord: async ({dispatch}, {links, fileIdentifier, geoNetworkApiUrl, recordTitle, bbox}) => {
        const recordWest = bbox?.west ?? null,
            recordSouth = bbox?.south ?? null,
            recordEast = bbox?.east ?? null,
            recordNorth = bbox?.north ?? null;
        let layerAdded = false;

        for (let i = 0; i < links.length; i++) {
            const parsed = parseGeoNetworkLink(links[i]);

            if (!parsed) {
                continue;
            }

            const {protocol, url, layerName, urlLayerParam, baseUrl} = parsed,
                typ = detectServiceType(protocol, url),
                urlQuery = url.includes("?") ? url.split("?")[1] : "",
                urlParams = new URLSearchParams(urlQuery),
                OGC_QUERY_PARAMS = new Set([
                    "service", "request", "version", "layers", "styles", "format",
                    "transparent", "bbox", "width", "height", "crs", "srs",
                    "info_format", "query_layers", "i", "j", "x", "y",
                    "typename", "typenames", "outputformat", "srsname",
                    "maxfeatures", "count", "resulttype"
                ]),
                customUrlParams = Object.fromEntries(
                    Array.from(urlParams.entries())
                        .filter(([k]) => !OGC_QUERY_PARAMS.has(k.toLowerCase()))
                ),
                hasCustomParams = Object.keys(customUrlParams).length > 0,
                effectiveBaseUrl = hasCustomParams
                    ? `${baseUrl}?${new URLSearchParams(customUrlParams).toString()}`
                    : baseUrl;

            const OGC_OPERATIONS = ["getcapabilities", "getmap", "getfeature", "gettile", "getlegendgraphic", "getfeatureinfo"],
                technicalLayerName = layerName
                    && !layerName.includes(" ")
                    && !layerName.includes("(")
                    && !layerName.includes(")")
                    && !OGC_OPERATIONS.includes(layerName.toLowerCase())
                    ? layerName : "";
            let effectiveLayerName = technicalLayerName || urlLayerParam,
                wfsVersion = "1.1.0",
                wfsOutputFormat = "XML",
                wfsFeatureNS = "";

            if (typ === "WMS" && !effectiveLayerName) {
                try {
                    const capResponse = await axios.get(baseUrl, {
                        params: {...customUrlParams, SERVICE: "WMS", REQUEST: "GetCapabilities"}
                    });
                    const capXml = capResponse.request?.responseXML
                        || new DOMParser().parseFromString(capResponse.data, "application/xml");

                    effectiveLayerName = Array.from(capXml.getElementsByTagName("Layer"))
                        .map(el => {
                            const nameEl = el.children && Array.from(el.children).find(c => c.localName === "Name");

                            return nameEl?.textContent?.trim() || "";
                        })
                        .filter(n => n.length > 0)
                        .join(",");
                }
                catch (capError) {
                    console.warn("addLayerFromGeoNetworkRecord: WMS GetCapabilities failed, layers will be empty.", capError);
                }
            }
            else if (typ === "WFS") {
                for (const ver of ["2.0.0", "1.1.0", "1.0.0"]) {
                    try {
                        const capResponse = await axios.get(baseUrl, {
                            params: {...customUrlParams, SERVICE: "WFS", REQUEST: "GetCapabilities", VERSION: ver}
                        });
                        const capXml = capResponse.request?.responseXML
                            || new DOMParser().parseFromString(capResponse.data, "application/xml");

                        const rootEl = capXml.documentElement,
                            declaredVersion = rootEl?.getAttribute("version") || ver,
                            firstFt = Array.from(capXml.getElementsByTagName("FeatureType"))
                                .find(ft => {
                                    const nameEl = Array.from(ft.children).find(c => c.localName === "Name");

                                    return nameEl?.textContent?.trim().length > 0;
                                });

                        if (firstFt) {
                            const nameEl = Array.from(firstFt.children).find(c => c.localName === "Name"),
                                fullName = nameEl.textContent.trim(),
                                colonIdx = fullName.indexOf(":");

                            effectiveLayerName = fullName;
                            wfsVersion = declaredVersion;

                            if (colonIdx !== -1) {
                                const prefix = fullName.slice(0, colonIdx),
                                    resolvedNs = nameEl.lookupNamespaceURI(prefix);

                                wfsFeatureNS = resolvedNs || wfsFeatureNS;
                            }

                            const formats = Array.from(capXml.getElementsByTagName("Format"))
                                    .map(f => f.textContent?.trim())
                                    .filter(Boolean),
                                preferredFormats = [
                                    "application/gml+xml; version=3.2",
                                    "text/xml; subtype=gml/3.2.1",
                                    "text/xml; subtype=gml/3.1.1",
                                    "GML32",
                                    "GML3",
                                    "GML2",
                                    "XML"
                                ];

                            wfsOutputFormat = preferredFormats.find(f => formats.some(cf => cf.toLowerCase() === f.toLowerCase()))
                                || formats[0]
                                || wfsOutputFormat;
                            break;
                        }
                    }
                    catch (capError) {
                        // Try next version
                    }
                }
            }

            const layerId = `gnl-${fileIdentifier}-${i}`,
                layerSource = {
                    id: layerId,
                    name: recordTitle || effectiveLayerName || fileIdentifier,
                    url: effectiveBaseUrl,
                    typ: typ,
                    metaID: fileIdentifier,
                    geoNetworkApiUrl: geoNetworkApiUrl,
                    gfiAttributes: "showAll"
                };

            if (typ === "WMS") {
                layerSource.layers = effectiveLayerName;
            }
            else if (typ === "WFS") {
                layerSource.featureType = effectiveLayerName;
                layerSource.version = wfsVersion;
                layerSource.outputFormat = wfsOutputFormat;
                if (wfsFeatureNS) {
                    layerSource.featureNS = wfsFeatureNS;
                }

                const WFS_LARGE_LAYER_THRESHOLD = 1000;

                try {
                    const hitsResponse = await axios.get(baseUrl, {
                            params: {
                                SERVICE: "WFS",
                                REQUEST: "GetFeature",
                                VERSION: wfsVersion,
                                TYPENAME: effectiveLayerName || undefined,
                                resultType: "hits"
                            }
                        }),
                        hitsDoc = hitsResponse.request?.responseXML
                            || new DOMParser().parseFromString(hitsResponse.data, "application/xml"),
                        fcEl = hitsDoc.documentElement,
                        hitsAttr = fcEl?.getAttribute("numberOfFeatures")
                            || fcEl?.getAttribute("numberMatched"),
                        featureCount = hitsAttr ? parseInt(hitsAttr, 10) : null;

                    if (featureCount !== null && featureCount > WFS_LARGE_LAYER_THRESHOLD) {
                        layerSource.loadingStrategy = "bbox";
                        dispatch("Alerting/addSingleAlert", {
                            category: "info",
                            content: i18next.t("common:modules.searchBar.csw.largeWfsLayer", {count: featureCount})
                        }, {root: true});

                        if (recordWest !== null && !isNaN(recordWest)) {
                            const mapProjection = mapCollection.getMap("2D")?.getView()?.getProjection()?.getCode(),
                                centerLon = (recordWest + recordEast) / 2,
                                centerLat = (recordSouth + recordNorth) / 2;
                            let center = [centerLon, centerLat];

                            if (mapProjection && mapProjection !== "EPSG:4326") {
                                center = crs.transformToMapProjection(mapCollection.getMap("2D"), "EPSG:4326", center);
                            }
                            dispatch("Maps/zoomToCoordinates", {center, zoom: 7}, {root: true});
                        }
                    }
                    else {
                        layerSource.loadingStrategy = "all";
                    }
                }
                catch (hitsError) {
                    console.warn("addLayerFromGeoNetworkRecord: WFS hits request failed.", hitsError);
                }
            }

            dispatch("addLayerToTopicTree", {layerId, source: layerSource, showInLayerTree: true, visibility: true});
            layerAdded = true;
            break;
        }

        if (!layerAdded) {
            dispatch("Alerting/addSingleAlert", {
                category: "info",
                content: i18next.t("common:modules.searchBar.csw.noLayerLink")
            }, {root: true});
        }
    }
};
