
import api from "@masterportal/masterportalapi/src/maps/api.js";
import {unByKey as unlistenByKey} from "ol/Observable.js";
import {toRaw} from "vue";
import proj4 from "proj4";
import actionsMapsInteractionsZoom from "./actionsMapsInteractionsZoom.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
/**
 * Interactions with the Map, MapView and Scene (3D).
 */

const registeredActions = {};

export default {
    ...actionsMapsInteractionsZoom,

    /**
     * Adds an interaction to the map.
     * @param {Object} context store context
     * @param {module:ol/interaction/Interaction} interaction - Interaction to be added to map.
     * @returns {void}
     */
    addInteraction (context, interaction) {
        const map = mapCollection.getMap("2D");

        map.addInteraction(toRaw(interaction));
    },

    /**
     * Registered listener for certain events on the map.
     * @see https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload parameter object
     * @param {String} payload.type The event type or array of event types.
     * @param {Function} payload.listener The listener function.
     * @param {String | Function} payload.listenerType Type of the listener. Possible are: "function", "commit" and "dispatch".
     * @param {Boolean} payload.root listener is dispatched or commited with root:true, if listenerType is 'dispatch' or 'commit' and root is true
     * @param {String} payload.keyForBoundFunctions if listener is a function and has bound this, toString creates everyTime same String as key. Use keyForBoundFunctions to provide a unique key.
     * @returns {void}
     */
    registerListener ({commit, dispatch}, {type, listener, listenerType = "function", root = false, keyForBoundFunctions}) {
        const listenerKey = keyForBoundFunctions ? keyForBoundFunctions : String(listener);

        if (listenerKey === "function () { [native code] }") {
            console.warn("Wrong use of 'registerListener' at map for listenerType = 'function', which uses .bind(this): provide 'keyForBoundFunctions'!");
        }

        registeredActions[type] = registeredActions[type] || {};
        registeredActions[type][listenerType] = registeredActions[type][listenerType] || {};
        registeredActions[type][listenerType][listenerKey] = evt => {
            if (listenerType === "function") {
                listener(evt);
            }
            else if (listenerType === "dispatch") {
                dispatch(listener, evt, {root: root});
            }
            else if (listenerType === "commit") {
                commit(listener, evt, {root: root});
            }
        };

        mapCollection.getMap("2D").on(type, registeredActions[type][listenerType][listenerKey]);
    },


    /**
     * Removes an interaction from the map.
     * @param {Object} context store context
     * @param {module:ol/interaction/Interaction} interaction - Interaction to be removed from map.
     * @returns {void}
     */
    removeInteraction (context, interaction) {
        const map = mapCollection.getMap("2D");

        if (interaction && map.removeInteraction(interaction) === undefined) {
            const interactions = map.getInteractions().getArray(),
                index = interactions.findIndex((anInteraction) => {
                    return anInteraction.ol_uid === interaction.ol_uid;
                });

            if (index > -1) {
                map.getInteractions().removeAt(index);
            }
            else if (typeof interactions === Array) {
                console.warn("interaction cannot be removed from map:", interaction);
            }
        }
    },

    /**
     * Sets map view to initial properties.
     * @param {Object} param store context
     * @param {Object} param.state the state
     * @returns {void}
     */
    resetView ({state}) {
        const view = mapCollection.getMapView("2D");

        view.setCenter(state.initialCenter);
        view.setRotation(state.initialRotation);
        view.setZoom(state.initialZoom);
    },

    /**
     * Sets the camera parameter
     * @param {Object} param store context
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} cameraParams The camera params.
     * @param {Object} cameraParams.altitude The camera altitude param.
     * @param {Object} cameraParams.heading The camera heading param.
     * @param {Object} cameraParams.tilt The camera tilt param.
     * @returns {void}
     */
    setCamera ({rootGetters}, cameraParams) {
        const map3d = mapCollection.getMap("3D");

        if (map3d) {
            api.map.olcsMap.setCameraParameter(cameraParams, mapCollection.getMap("3D"), Cesium);
        }
        else {
            if (!rootGetters.map3dParameter) {
                rootGetters.map3dParameter = {};
            }
            rootGetters.map3dParameter.camera = cameraParams;
        }
    },
    /**
     * Smoothly flies the 3D camera to a specified viewpoint by transforming input coordinates
     * from EPSG:25832 (UTM Zone 32N) to EPSG:4326 (WGS84) and adjusting the camera's position
     * and orientation in the Cesium scene.
     *
     * This function uses the Cesium library to fly the camera smoothly to the transformed coordinates.
     *
     * @param {Object} context - The Vuex store context.
     * @param {Number} context.altitude - The altitude of the camera above the ground in meters.
     * @param {Number} context.heading - The heading (orientation) of the camera in degrees, where 0 is north, and positive values rotate clockwise.
     * @param {Number} context.tilt - The tilt of the camera in degrees, where 0 points the camera straight down (top-down view) and positive values tilt the camera outward.
     * @param {Array<Number>} context.center - The center coordinates [x, y] in EPSG:25832 (UTM Zone 32N projection).
     *
     * @throws {Error} Throws an error if the coordinate transformation or camera fly operation fails.
     *
     * @returns {void} This function does not return a value but updates the Cesium camera position.
     */
    flyTo3DCoordinates ({rootGetters}, {altitude, heading, tilt, center}) {
        const olCesium = mapCollection.getMap("3D"),
            scene = olCesium.scene_,
            camera = scene.camera;

        try {
            const [longitude, latitude] = proj4(rootGetters["Maps/projection"].getCode(), "EPSG:4326", [center[0], center[1]]);

            if (isNaN(longitude) || isNaN(latitude)) {
                console.warn("Transformation of coordinates failed:", center);
                return;
            }

            camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
                orientation: {
                    heading: Cesium.Math.toRadians(heading),
                    pitch: Cesium.Math.toRadians(tilt),
                    roll: 0.0
                },
                duration: 2.0
            });
        }
        catch (error) {
            console.error("Error transforming coordinates or flying to destination in 3D mode:", error);
        }
    },

    /**
     * Sets the center of the current view.
     * @param {Object} param store context
     * @param {Object} param.getters the getters
     * @param {Object} param.commit the commit
     * @param {Number[]} coords An array of numbers representing a xy-coordinate
     * @returns {void}
     */
    setCenter ({commit}, coords) {
        const view = mapCollection.getMapView("2D");
        let first2Coords = [coords[0], coords[1]];

        if (first2Coords.some(coord => typeof coord !== "number")) {
            first2Coords = first2Coords.map(singleCoord => parseInt(singleCoord, 10));
        }
        if (Array.isArray(first2Coords) && first2Coords.length === 2) {
            commit("setCenter", coords);
            view.setCenter(coords);
        }
        else {
            console.warn("Center was not set. Probably there is a data type error. The format of the coordinate must be an array with two numbers.");
        }
    },

    /**
     * Unsubscribes listener to certain events.
     * @param {Object} context store context
     * @param {Object} payload parameter object
     * @param {String} payload.type The event type or array of event types.
     * @param {Function} payload.listener The listener function.
     * @param {String | Function} payload.listenerType Type of the listener. Possible are: "function", "commit" and "dispatch".
     * @param {String} payload.keyForBoundFunctions if listener is a function and has bound this, toString creates everyTime same String as key. Use keyForBoundFunctions to provide a unique key.
     * @returns {void}
     */
    unregisterListener (context, {type, listener, listenerType = "function", keyForBoundFunctions}) {
        if (typeof type === "string") {
            const listenerKey = keyForBoundFunctions ? keyForBoundFunctions : String(listener);

            if (registeredActions[type] && registeredActions[type][listenerType] && registeredActions[type][listenerType][listenerKey]) {
                mapCollection.getMap("2D").un(type, registeredActions[type][listenerType][listenerKey]);
                registeredActions[type][listenerType][listenerKey] = null;
            }
        }
        else {
            unlistenByKey(type);
        }
    },

    /**
     * Activates the selected viewpoint by adjusting the map's view parameters and optionally adding layers to the map.
     * In 3D mode, also adjusts the camera parameters.
     *
     * This function ensures that the necessary layers are present on the map and then adjusts the view (in either 2D or 3D) accordingly.
     *
     * @param {Object} context - The Vuex context object.
     * @param {Object} context.dispatch - Dispatch method for Vuex actions.
     * @param {Object} context.getters - Vuex getters for accessing store state.
     * @param {Object} payload - The parameters for the viewpoint.
     * @param {Array<String>} payload.layerIds - An array of layer IDs to add to the map if not already present.
     * @param {Number} payload.altitude - The altitude of the camera/viewpoint in 3D mode.
     * @param {Number} payload.heading - The heading (orientation) of the camera in 3D mode.
     * @param {Number} payload.tilt - The tilt of the camera in 3D mode.
     * @param {Array<Number>} payload.center - The center coordinates [x, y] of the viewpoint.
     * @param {Number} payload.zoom - The zoom level of the map.
     *
     * @returns {void}
     */
    activateViewpoint ({dispatch, getters}, {layerIds, altitude, heading, tilt, center, zoom}) {
        if (Array.isArray(layerIds) && layerIds.length > 0) {
            layerIds.forEach(layerId => {
                dispatch("addLayerIfNotPresent", {layerId});
            });
        }

        if (!Array.isArray(center) || center.length !== 2 || isNaN(center[0]) || isNaN(center[1])) {
            console.warn("Invalid center coordinates provided:", center);
            return;
        }

        if (getters.mode === "2D") {
            dispatch("Maps/zoomToCoordinates", {center, zoom}, {root: true});
        }
        else if (getters.mode === "3D") {
            dispatch("flyTo3DCoordinates", {altitude, heading, tilt, center});
        }
    },

    /**
     * Ensures that the specified layer is present on the map.
     *
     * - If the layer is not yet added, it will be added with visibility: true settings.
     * - If the layer is already present but not visible, its visibility will be turned on.
     * - If the layer configuration cannot be found, a warning will be triggered.
     *
     * @param {Object} context - The Vuex context object.
     * @param {Function} context.dispatch - Dispatch method for Vuex actions.
     * @param {Function} context.getters - Vuex getters for accessing store state.
     * @param {Function} context.rootGetters - Vuex root getters for accessing root-level state.
     * @param {Object} payload - Parameters for ensuring layer presence.
     * @param {string} payload.layerId - The ID of the layer to check or add.
     *
     * @returns {void}
     */
    addLayerIfNotPresent ({dispatch, getters, rootGetters}, {layerId}) {
        const layer = getters.getLayerById(layerId),
            configJsonLayerConfig = rootGetters.layerConfigById(layerId),
            servicesJsonLayerConfig = rawLayerList.getLayerWhere({id: layerId});

        if (!configJsonLayerConfig && !servicesJsonLayerConfig) {
            const alertingFailedToFindLayerConfig = {
                category: "warning",
                content: i18next.t("common:core.layers.errorHandling.wrongLayerId", {layerId})
            };

            dispatch("Alerting/addSingleAlert", alertingFailedToFindLayerConfig, {root: true});
            return;
        }
        if (!layer) {
            if (configJsonLayerConfig) {
                dispatch("addOrReplaceLayer", {layerId}, {root: true});
            }
            else if (servicesJsonLayerConfig) {
                dispatch("addLayerToLayerConfig", {
                    layerConfig:
                    {...servicesJsonLayerConfig, ...{
                        showInLayerTree: true,
                        visibility: true
                    }},
                    parentKey: treeSubjectsKey
                }, {root: true});
            }
        }
        else if (!configJsonLayerConfig.visibility) {
            dispatch("replaceByIdInLayerConfig", {
                layerId: layerId,
                layer: {
                    showInLayerTree: true,
                    visibility: true
                }
            }, {root: true});
        }
    }
};
