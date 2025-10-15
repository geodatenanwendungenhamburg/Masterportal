import {RoutingWaypoint} from "../../js/classes/routing-waypoint";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import {fetchTSRDirections} from "../../js/tsr/routing-vroom-directions.js";
import {toRaw} from "vue";

/**
 * The actions for the routing tsr.
 * @module modules/routing/store/tsr/actions
 */
export default {
    /**
     * Finds route for current waypoints.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async findTSR ({state, commit, dispatch, rootState}) {
        if (state.waypoints.length < 3) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.routing.tsr.errors.notEnoughPoints"),
                title: i18next.t("common:modules.routing.tsr.errors.errorCalculation")
            }, {root: true});
            console.warn(i18next.t("common:modules.routing.tsr.errors.notEnoughPoints"));
            return;
        }

        if (state.waypoints.filter((waypoint) => waypoint.coordinates.length === 0 && waypoint.index !== state.waypoints.length - 1).length > 0) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.routing.tsr.errors.emptyPoint"),
                title: i18next.t("common:modules.routing.tsr.errors.errorCalculation")
            }, {root: true});
            console.warn(i18next.t("common:modules.routing.tsr.errors.emptyPoint"));
            return;
        }

        const {tsrRouteSource, settings, tsrWaypointsLayer} = state,
            map = await mapCollection.getMap(rootState.Maps.mode),
            wgs84Coords = await dispatch("getTSRCoordinatesWgs84"),
            lineStringFeature = await dispatch("getRouteFeature");

        commit("setIsLoadingDirections", true);
        await dispatch("resetTSRResults");

        try {
            const result = await dispatch("fetchTSR", {wgs84Coords: wgs84Coords, instructions: true}),
                hours = Math.floor(result.duration / 3600);
            let minutes = Math.floor((result.duration / 60) % 60);

            if ((hours || minutes) === 0) {
                minutes = "01";
            }

            commit("setTsrDistance", (result.distance / 1000.0).toFixed(2) + " km");
            commit("setTsrDuration", hours + " h " + minutes + " min");

            if (JSON.stringify(wgs84Coords) !== JSON.stringify(await dispatch("getTSRCoordinatesWgs84"))) {
                return;
            }

            await dispatch("assignWaypointOrder", result);

            lineStringFeature
                .getGeometry()
                .setCoordinates(result.getLineString());

            lineStringFeature.set("speedProfile", JSON.parse(JSON.stringify(settings.speedProfile)));
            lineStringFeature.set("preference", JSON.parse(JSON.stringify(settings.preference)));

            map.getView().fit(tsrRouteSource.getExtent());

            commit("setTsrDirections", result);
            // tsr points layer has changed -> needs to update to display text on map correctly
            tsrWaypointsLayer.changed();
        }
        catch (err) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                title: i18next.t("common:modules.routing.errors.titleErrorRouteFetch"),
                content: err.message
            }, {root: true});
            console.warn(i18next.t("common:modules.routing.errors.titleErrorRouteFetch"));
        }
        commit("setIsLoadingDirections", false);
    },

    /**
     * Assign Waypoint order of vroom result to waypoints in map.
     * @param {Object} context actions context object.
     * @param {Object} result vroom result object.
     * @returns {void}
     */
    assignWaypointOrder ({dispatch, state}, result) {
        // only jobs need to be sorted since start and end are fix
        result.steps.forEach(async (step, idx) => {
            if (step.type === "job") {
                // transform coordinates from vroom to local projection for
                // comparison with waypoint coordinates
                const coordsLocal = await dispatch(
                    "Modules/Routing/transformCoordinatesWgs84ToLocalProjection",
                    step.location,
                    {root: true}
                );

                // for each vroom point, find waypoint in state with matching coordinates
                // and assign array position from vroom point as state.waypoint index attribute
                state.waypoints.find(
                    x =>x.coordinates[0].toFixed(2) === coordsLocal[0].toFixed(2) && x.coordinates[1].toFixed(2) === coordsLocal[1].toFixed(2)
                ).setIndex(idx);
            }
            // sort waypoints in ascending order by index attribut
            state.waypoints.sort((a, b) => a.index - b.index);
        });
    },

    /**
     * Resets the tsr results
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async resetTSRResults ({dispatch, commit}) {
        const lineStringFeature = await dispatch("getRouteFeature");

        commit("setTsrDirections", null);

        lineStringFeature
            .getGeometry()
            .setCoordinates([]);
    },

    /**
     * Fetches the tsr directions with the configured external service.
     * Needs to be extended if new services should be configurable.
     * @param {Object} context actions context object.
     * @param {Object} parameter with wgs84Coords as input and instructions for the external service
     * @param {Array<{Number, Number}>} [parameter.wgs84Coords] coordinates in wgs84 projection
     * @param {Boolean} [parameter.instructions] should request with instructions
     * @returns {tsrDirections} tsrDirections
     */
    async fetchTSR ({state, dispatch, rootState}, {wgs84Coords, instructions}) {

        const tsrSettings = await rootState.Modules.Routing.tsrSettings;

        if (tsrSettings.type === "TSR") {
            return fetchTSRDirections({
                coordinates: wgs84Coords,
                language: i18next.language,
                transformCoordinatesToLocal: coordinates => dispatch(
                    "Modules/Routing/transformCoordinatesWgs84ToLocalProjection",
                    coordinates,
                    {root: true}
                ),
                speedProfile: state.settings.speedProfile,
                preference: state.settings.preference,
                instructions: instructions
            });
        }
        throw new Error("fetchTSR Type is not configured correctly.");
    },

    /**
     * Returns the feature to display the route on
     * @param {Object} context actions context object.
     * @returns {module:ol/Feature} routing Feature
     */
    getRouteFeature ({state}) {
        const {tsrRouteSource} = state;

        return tsrRouteSource.getFeatures()[0];
    },

    /**
     * Retrieves the waypoint coordinates in wgs84 projection
     * @param {Object} context actions context object.
     * @returns {Array<{Number, Number}>} wgs84 coordinates
     */
    async getTSRCoordinatesWgs84 ({state, getters, dispatch}) {
        // if there is no last point, set coordinates from first point to initiate round trip
        if (!state.waypoints[state.waypoints.length - 1].getCoordinates()[0]) {
            state.waypoints[state.waypoints.length - 1].setCoordinates(state.waypoints[0]?.getCoordinates());
            state.waypoints[state.waypoints.length - 1].setDisplayName(i18next.t("common:modules.routing.tsr.tsrEndpoint"));
            // do not show last point in map
            state.tsrWaypointsSource?.removeFeature(state.waypoints[state.waypoints.length - 1].getFeature());
        }
        const coordinates = [],
            tsrCoordinates = getters.waypoints
                .map(waypoint => waypoint.getCoordinates())
                .filter(coords => coords.length === 2);

        for (const coords of tsrCoordinates) {
            coordinates.push(
                await dispatch(
                    "Modules/Routing/transformCoordinatesLocalToWgs84Projection",
                    coords,
                    {root: true}
                )
            );
        }
        return coordinates;
    },

    /**
     * Called when Routing.vue is created to initialize the map layers, map interactions and waypoints.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async initTSR ({state, dispatch, commit}) {
        const {
            tsrWaypointsLayer,
            tsrRouteLayer,
            tsrElevationLayer,
            tsrWaypointsDrawInteraction,
            mapListenerAdded
        } = state;

        dispatch("initWaypoints");

        if (!mapListenerAdded) {
            tsrWaypointsDrawInteraction.on("drawend", event => dispatch("onTSRWaypointsDrawEnd", event));
            dispatch("createTSRWaypointsModifyInteractionListener");
            commit("setMapListenerAdded", true);
        }

        dispatch("Maps/addLayer", toRaw(tsrRouteLayer), {root: true});
        dispatch("Maps/addLayer", toRaw(tsrWaypointsLayer), {root: true});
        dispatch("Maps/addLayer", toRaw(tsrElevationLayer), {root: true});
        dispatch("createInteractionFromMapInteractionMode");
    },

    /**
     * Resets all waypoints, deletes external waypoints, removes coordinates from features,
     * sets directions to null.
     * @param {Object} context the vuex context
     * @param {Object} context.getters the getters
     * @param {Object} context.commit the commit
     * @param {Object} context.dispatch the dispatch
     * @returns {void}
     */
    reset ({getters, commit, dispatch}) {
        const {waypoints, tsrRouteSource} = getters;

        if (waypoints.length > 0) {
            for (let i = waypoints.length - 1; i >= 0; i--) {
                dispatch("removeWaypoint", {index: waypoints[i].index});
                if (waypoints[i] && waypoints[i].fromExtern === true) {
                    waypoints.splice(i, 1);
                }
            }
            tsrRouteSource.getFeatures().forEach(feature => feature.getGeometry().setCoordinates([]));
            commit("setTsrDirections", null);
        }
    },

    /**
     * Creates the currently needed map interaction based on the user input
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createInteractionFromMapInteractionMode ({state, dispatch}) {
        const {mapInteractionMode} = state;

        if (mapInteractionMode === "WAYPOINTS") {
            dispatch("createTSRWaypointsDrawInteraction");
        }
    },

    /**
     * Called when the TSR tab is being closed to reset the map layer and interaction
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async closeTSR ({state, dispatch}) {
        const {tsrWaypointsLayer, tsrRouteLayer, tsrElevationLayer} = state,
            map = await mapCollection.getMap("2D");

        map.removeLayer(toRaw(tsrRouteLayer));
        map.removeLayer(toRaw(tsrWaypointsLayer));
        map.removeLayer(toRaw(tsrElevationLayer));

        dispatch("removeMapInteractions");
    },

    /**
     * Creates event listener to be called when the waypoints are dragged/modified
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createTSRWaypointsModifyInteractionListener ({state, dispatch}) {
        const {tsrWaypointsModifyInteraction} = state;
        let changedFeature;

        tsrWaypointsModifyInteraction.on("modifystart", event => {
            // check if first point is moved and if it is equal to last point
            // and remove last point if true (to make sure the last point is not kept when
            // calculating a new roundtrip)
            if (event.features.getArray()[0].getGeometry().getCoordinates().toString() === state.waypoints[0].getCoordinates().toString()
             && state.waypoints[0].getCoordinates().toString() === state.waypoints[state.waypoints.length - 1].getCoordinates().toString()
            ) {
                dispatch("removeWaypoint", {index: state.waypoints.length - 1});
            }
            event.features.getArray().forEach(feature => {
                feature.getGeometry().once("change", () => {
                    changedFeature = feature;
                });
            });
        });

        tsrWaypointsModifyInteraction.on("modifyend", async () => {
            const {waypoints} = state,
                waypoint = waypoints[changedFeature.get("routingId")],
                coordinates = await dispatch(
                    "Modules/Routing/transformCoordinatesLocalToWgs84Projection",
                    changedFeature.getGeometry().getCoordinates(),
                    {root: true}
                ),
                geoSearchResult = await dispatch(
                    "Modules/Routing/fetchTextByCoordinates",
                    {
                        coordinates
                    },
                    {root: true}
                ),

                fixedCoordinates = waypoint.getCoordinates();

            fixedCoordinates[0] = parseFloat(fixedCoordinates[0].toFixed(2));
            fixedCoordinates[1] = parseFloat(fixedCoordinates[1].toFixed(2));
            waypoint.setCoordinates(fixedCoordinates);
            waypoint.setDisplayName(
                geoSearchResult ? geoSearchResult.getDisplayName() : `${fixedCoordinates[0]}, ${fixedCoordinates[1]}`
            );
        });
    },

    /**
     * Define whether a startpoint, endpoint, or waypoint is to be added.
     * @param {Object} context actions context object.
     * @param {Number} position new value of addStartEndPoint
     * @returns {void}
     */
    isStartEndInput ({state}, position) {
        state.addStartEndPoint = position;
    },

    /**
     * Add feature from geocoding search result to Layer Source
     * @param {Object} context actions context object.
     * @param {Object} waypoint waypoint to be added
     * @returns {void}
     */
    addFeatToSource ({state}, waypoint) {
        if (!state.tsrWaypointsSource?.hasFeature(waypoint.getFeature())) {
            state.tsrWaypointsSource?.addFeature(waypoint.getFeature());
        }
    },

    /**
     * Adds a new waypoint to the array.
     * @param {Object} context actions context object.
     * @param {Object} payload payload object.
     * @param {Number} [payload.index] index for the waypoint to insert at
     * @param {ol.Feature} [payload.feature] optional feature to use in the waypoint or to extract coordinates from
     * @param {String} [payload.displayName] optional displayName for the waypoint
     * @returns {RoutingWaypoint} added waypoint
     */
    addWaypoint ({state, dispatch}, {index, feature, displayName, coordinates, fromExtern}) {
        let waypointIndex = index,
            waypoint,
            feat;

        const lastWaypointIdx = state.waypoints.length - 1;

        if (typeof index !== "number") {
            waypointIndex = state.waypoints.length;
        }
        if (feature || coordinates) {

            if (coordinates) {
                const fixedCoordinates = coordinates;

                fixedCoordinates[0] = parseFloat(fixedCoordinates[0].toFixed(2));
                fixedCoordinates[1] = parseFloat(fixedCoordinates[1].toFixed(2));

                feat = new Feature({
                    geometry: new Point(fixedCoordinates)
                });
            }
            else if (feature) {
                const fixedCoordinates = feature.getGeometry().getCoordinates().map((coord) => parseFloat(coord.toFixed(2)));

                feature.getGeometry().setCoordinates(fixedCoordinates);
                feat = feature;
            }

            // If feature is set the call comes from the map and we try to find a
            // waypoint without coordinates first before adding it
            // (waypoint is neither start nor end)
            const waypointWithoutCoordinates = state.waypoints.find(
                waypt => waypt.getCoordinates().length === 0
                && waypt.index > 0
                && waypt.index < lastWaypointIdx
            );

            // if waypoint without coordinates and waypoint is added
            if (waypointWithoutCoordinates && state.addStartEndPoint === 1) {
                const fixedCoordinates = feat.getGeometry().getCoordinates().map((coord) => parseFloat(coord.toFixed(2)));

                waypointWithoutCoordinates.setCoordinates(fixedCoordinates);
                if (displayName) {
                    waypointWithoutCoordinates.setDisplayName(displayName);
                }
                // Drawend is called before feature is added to tsrWaypointsSource
                // We delete the drawn Feature and only copy the Coordinates
                state.tsrWaypointsSource.removeFeature(feat);

                state.addStartEndPoint = 1;
                return waypointWithoutCoordinates;
            }
        }

        if (state.addStartEndPoint === 1) {
            waypoint = new RoutingWaypoint({
                index: waypointIndex,
                feature,
                displayName,
                source: state.tsrWaypointsSource
            });
        }
        if (state.addStartEndPoint === 0) {
            // if coordinates of first and last point are equal, remove last point to ensure
            // a new roundtrip can be calculated
            if (state.waypoints[0].getCoordinates().toString() === state.waypoints[lastWaypointIdx].getCoordinates().toString()) {
                dispatch("removeWaypoint", {index: lastWaypointIdx});
            }

            const fixedCoordinates = feature.getGeometry().getCoordinates().map((coord) => parseFloat(coord.toFixed(2)));

            state.waypoints[0].setCoordinates(fixedCoordinates);
            state.waypoints[0].setDisplayName(displayName);

            state.tsrWaypointsSource?.removeFeature(feature);
        }
        if (state.addStartEndPoint === 2) {
            // for some reason the endpoint has to be removed before adding
            // the new coordinates -> this leaves an empty point which can
            // be filled with the new coordinates
            dispatch("removeWaypoint", {index: lastWaypointIdx});

            const fixedCoordinates = feature.getGeometry().getCoordinates().map((coord) => parseFloat(coord.toFixed(2)));

            state.waypoints[lastWaypointIdx].setCoordinates(fixedCoordinates);
            state.waypoints[lastWaypointIdx].setDisplayName(displayName);

            state.tsrWaypointsSource?.removeFeature(feature);
        }
        // reset addStartEndPOint to 1 so the next call is a waypoint
        state.addStartEndPoint = 1;

        if (waypoint) {
            if (fromExtern) {
                waypoint.fromExtern = true;
            }
            if (coordinates) {
                const fixedCoordinates = coordinates.map((coord) => parseFloat(coord.toFixed(2)));

                waypoint.setCoordinates(fixedCoordinates);
            }
            // point is added at second last position to keep the last point
            state.waypoints.splice(state.waypoints.length - 1, 0, waypoint);
        }
        // Fix Index on Waypoints after new Waypoint
        for (let i = 0; i < state.waypoints.length; i++) {
            state.waypoints[i].setIndex(i);
        }
        return waypoint;
    },
    /**
     * Removes a waypoint at the given index and reloads the directions if reload = true
     * @param {Object} context actions context object.
     * @param {Object} params with a waypoint index and reload to control if the directions should be requested.
     * @param {Number} [params.index] index to remove the waypoint at
     * @param {Boolean} [params.reload = false] if the route should be reloaded
     * @returns {void}
     */
    removeWaypoint ({state, commit}, {index = false}) {
        const {waypoints, tsrWaypointsSource} = state;

        if (waypoints.length === 2) {
            commit("setTsrDirections", null);
            if (index === 0 && JSON.stringify(waypoints[0].getCoordinates()) === JSON.stringify(waypoints[waypoints.length - 1].getCoordinates())) {

                commit("setTsrDirections", null);
                // set new empty waypoints
                waypoints.forEach(function (waypoint, idx) {
                    waypoints[idx].reset();
                    waypoints[idx] = new RoutingWaypoint({
                        index: waypoint.index,
                        source: state.tsrWaypointsSource
                    });
                });
            }
            else {
                // set new empty waypoint (before adding the new point,
                // the extent of waypoints[index] still contains extent coordinates
                waypoints[index].reset();
                waypoints[index] = new RoutingWaypoint({
                    index: index,
                    source: state.tsrWaypointsSource
                });
            }
            return;
        }
        // remove first or last point
        if (index === 0 || index === waypoints.length - 1) {
            // array with indexes to remove
            const indexes = [index];

            // first and last point identical (roundtrip)
            if (index === 0 && JSON.stringify(waypoints[0].getCoordinates()) === JSON.stringify(waypoints[waypoints.length - 1].getCoordinates())) {
                indexes.push(waypoints.length - 1);
            }

            indexes.forEach(idx => {
                waypoints[idx].reset();
                waypoints[idx] = new RoutingWaypoint({
                    index: idx,
                    source: state.tsrWaypointsSource
                });
            });
        }

        // remove waypoint
        else {
            if (waypoints[index]?.addedToSource) {
                tsrWaypointsSource?.removeFeature(waypoints[index].getFeature());
            }
            for (let i = index; i < waypoints.length; i++) {
                waypoints[i].setIndex(waypoints[i].getIndex() - 1);
            }
            waypoints.splice(index, 1);
        }
        for (let i = 0; i < waypoints.length; i++) {
            waypoints[i].setIndex(i);
        }
    },

    /**
     * Initializes the waypoint array with the minimum waypoints (2) for start and end.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    initWaypoints ({dispatch, state}) {
        const externWayPoints = state.waypoints.filter(
                (waypoint) => waypoint.fromExtern === true
            ),
            length = externWayPoints.length > 0 ? externWayPoints.length : state.waypoints.length;

        for (let i = length; i < 2; i++) {
            dispatch("addWaypoint", {index: i});
        }
    },

    /**
     * Executed when user clicks on the map to add a waypoint
     * @param {Object} context actions context object.
     * @param {Object} event OL OnDrawEvent.
     * @returns {void}
     */
    async onTSRWaypointsDrawEnd ({dispatch}, event) {
        const coordinates = await dispatch(
                "Modules/Routing/transformCoordinatesLocalToWgs84Projection",
                event.feature.getGeometry().getCoordinates(),
                {root: true}
            ),
            geoSearchResult = await dispatch(
                "Modules/Routing/fetchTextByCoordinates",
                {
                    coordinates
                },
                {root: true}
            );

        await dispatch("addWaypoint", {
            feature: event.feature,
            displayName: geoSearchResult
                ? geoSearchResult.getDisplayName()
                : null
        });
    },

    /**
     * Creates a new draw interaction depending on state to either draw
     * lines or polygons. The method will first remove any prior draw
     * interaction created by this module.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createTSRWaypointsDrawInteraction ({state, dispatch}) {
        dispatch("removeMapInteractions");
        const {
            tsrWaypointsModifyInteraction,
            tsrWaypointsSnapInteraction,
            tsrWaypointsDrawInteraction
        } = state;

        dispatch("Maps/addInteraction", tsrWaypointsDrawInteraction, {root: true});
        dispatch("Maps/addInteraction", tsrWaypointsModifyInteraction, {root: true});
        dispatch("Maps/addInteraction", tsrWaypointsSnapInteraction, {root: true});
    },

    /**
     * Removes the draw interaction. This includes aborting any current
     * unfinished drawing, removing the interaction from the map, and
     * removing the interaction from the store.
     * @param {Object} context actions context object.
     * @param {Boolean} removeWaypointsModifyInteraction decides whether or not tsrWaypointsModifyInteraction should be removed
     * @returns {void}
     */
    removeTSRWaypointsDrawInteraction ({state, dispatch}) {
        const {
            tsrWaypointsDrawInteraction,
            tsrWaypointsModifyInteraction,
            tsrWaypointsSnapInteraction
        } = state;

        tsrWaypointsDrawInteraction.abortDrawing();

        dispatch("Maps/removeInteraction", tsrWaypointsDrawInteraction, {root: true});
        dispatch("Maps/removeInteraction", tsrWaypointsModifyInteraction, {root: true});
        dispatch("Maps/removeInteraction", tsrWaypointsSnapInteraction, {root: true});
    },

    /**
     * Removes the directions interactions.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    removeMapInteractions ({dispatch}) {
        dispatch("removeTSRWaypointsDrawInteraction");
    },

    /**
     * Zooms to extent of all uploaded waypoints
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async zoomAfterUpload ({state, rootState}) {
        const map = await mapCollection.getMap(rootState.Maps.mode);

        map.getView().fit(state.tsrWaypointsSource.getExtent());
    }
};
