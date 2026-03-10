import {RoutingWaypoint} from "../../js/classes/routing-waypoint.js";
import {fetchRoutingOrsDirections} from "../../js/directions/routing-ors-directions.js";
import Feature from "ol/Feature.js";
import LineString from "ol/geom/LineString.js";
import Circle from "ol/geom/Circle.js";
import Point from "ol/geom/Point.js";
import {toRaw} from "vue";
import {fromCircle} from "ol/geom/Polygon.js";

/**
 * The actions for the routing directions.
 * @module modules/routing/store/directions/actions
 */
export default {
    /**
     * Finds the route for the current waypoints.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async findDirections ({state, getters, commit, dispatch, rootState}) {
        if (getters.directionsCoordinates.length < 2) {
            return;
        }
        const {waypoints, directionsRouteSource, routingAvoidFeaturesOptions, settings, directionsAvoidSource} = state,
            map = await mapCollection.getMap(rootState.Maps.mode),
            wgs84Coords = await dispatch("getDirectionsCoordinatesWgs84"),
            lineStringFeature = await dispatch("getRouteFeature");

        if (!getters.allHGVRestrictionsValid && state.settings.speedProfile === "HGV") {
            directionsRouteSource.getFeatures().forEach(feature => feature.getGeometry().setCoordinates([]));
            commit("setRoutingDirections", null);
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                title: i18next.t("common:modules.routing.errors.titleErrorRouteFetch"),
                content: i18next.t("common:modules.routing.errors.hgvRestrictionOutOfRange")
            }, {root: true});

            return;
        }

        commit("setIsLoadingDirections", true);
        await dispatch("resetRoutingDirectionsResults");

        try {
            const result = await dispatch("fetchDirections", {wgs84Coords: wgs84Coords, instructions: true});

            if (JSON.stringify(wgs84Coords) !== JSON.stringify(await dispatch("getDirectionsCoordinatesWgs84"))) {
                return;
            }

            lineStringFeature
                .getGeometry()
                .setCoordinates(result.getLineString());

            lineStringFeature.set("avoidFeaturesOptions", JSON.parse(JSON.stringify(routingAvoidFeaturesOptions)));
            lineStringFeature.set("speedProfile", JSON.parse(JSON.stringify(settings.speedProfile)));
            lineStringFeature.set("preference", JSON.parse(JSON.stringify(settings.preference)));
            lineStringFeature.set("hasAvoidPolygons", directionsAvoidSource.getFeatures().length > 0);

            waypoints.forEach((waypoint, index) => {
                waypoint.setIndexDirectionsLineString(
                    result.getLineStringWaypointIndex()[index]
                );
            });
            map.getView().fit(directionsRouteSource.getExtent());
            commit("setRoutingDirections", result);
        }
        catch (err) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                title: i18next.t("common:modules.alerting.categories.info"),
                content: err.message
            }, {root: true});
        }
        commit("setIsLoadingDirections", false);
    },

    /**
     * Resets the routing direction results
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async resetRoutingDirectionsResults ({dispatch, commit}) {
        const lineStringFeature = await dispatch("getRouteFeature");

        commit("setRoutingDirections", null);
        lineStringFeature
            .getGeometry()
            .setCoordinates([]);
    },

    /**
     * Fetches the directions with the configured external service.
     * Needs to be extended if new services should be configurable.
     * @param {Object} context actions context object.
     * @param {Object} parameter with wgs84Coords as input and instructions for the external service
     * @param {Array<{Number, Number}>} [parameter.wgs84Coords] coordinates in wgs84 projection
     * @param {Boolean} [parameter.instructions] should request with instructions
     * @returns {RoutingDirections} routingDirections
     */
    async fetchDirections ({state, getters, dispatch, rootState}, {wgs84Coords, instructions}) {

        const directionSettings = await rootState.Modules.Routing.directionsSettings,
            {selectedAvoidSpeedProfileOptions} = getters,
            avoidPolygons = await dispatch("getAvoidPolygonsWgs84"),
            avoidBorders = selectedAvoidSpeedProfileOptions.find(o => o.id === "BORDERS");

        if (directionSettings.type === "ORS") {
            return fetchRoutingOrsDirections({
                coordinates: wgs84Coords,
                language: i18next.language,
                transformCoordinatesToLocal: coordinates => dispatch(
                    "Modules/Routing/transformCoordinatesWgs84ToLocalProjection",
                    coordinates,
                    {root: true}
                ),
                speedProfile: state.settings.speedProfile,
                avoidSpeedProfileOptions: selectedAvoidSpeedProfileOptions.filter(o => o.id !== "BORDERS"),
                preference: state.settings.preference,
                avoidPolygons: avoidPolygons,
                instructions: instructions,
                elevation: state.settings.elevation,
                avoidBorders: avoidBorders
            });
        }
        throw new Error("fetchDirections Type is not configured correctly.");
    },

    /**
     * Returns the feature to display the route on
     * @param {Object} context actions context object.
     * @returns {module:ol/Feature} routing Feature
     */
    getRouteFeature ({state}) {
        const {directionsRouteSource} = state;

        return directionsRouteSource.getFeatures().find(feature => !feature.get("isHighlight"));
    },

    /**
     * Returns the feature to display the highlight on
     * @param {Object} context actions context object.
     * @returns {module:ol/Feature} highlight Feature
     */
    getHighlightFeature ({state}) {
        const {directionsRouteSource} = state;

        return directionsRouteSource.getFeatures().find(feature => feature.get("isHighlight"));
    },

    /**
     * Resets the highlighting
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async unHighlightRoute ({dispatch}) {
        const highlightFeature = await dispatch("getHighlightFeature");

        highlightFeature.getGeometry().setCoordinates([]);
    },

    /**
     * Highlights part of the route.
     * @param {Object} context actions context object.
     * @param {Object} params with the starting and ending index
     * @param {Number} [params.fromWaypointIndex] at which waypoint to start the highlight
     * @param {Number} [params.toWaypointIndex] at which waypoint to end the highlight
     * @param {Array<{Number, Number}>} [params.coordsIndex] alternative to select the coordinate index directly
     * @returns {void}
     */
    async highlightRoute ({dispatch, state}, {fromWaypointIndex, toWaypointIndex, coordsIndex}) {
        const {waypoints} = state,
            routeFeature = await dispatch("getRouteFeature"),
            highlightFeature = await dispatch("getHighlightFeature"),
            lineIndex = coordsIndex ? coordsIndex.slice(0) : [
                waypoints[fromWaypointIndex].getIndexDirectionsLineString(),
                waypoints[toWaypointIndex].getIndexDirectionsLineString()
            ];

        highlightFeature.getGeometry().setCoordinates(
            routeFeature.getGeometry().getCoordinates().slice(...lineIndex)
        );
    },

    /**
     * Zooms to part of the route
     * @param {Object} context actions context object.
     * @param {Object} params with the starting and ending index
     * @param {Number} [params.fromWaypointIndex] at which waypoint to start the zoom
     * @param {Number} [params.toWaypointIndex] at which waypoint to end the zoom
     * @param {Array<{Number, Number}>} [params.coordsIndex] alternative to select the coordinate index directly
     * @returns {void}
     */
    async zoomToRoute ({dispatch, state, rootState}, {fromWaypointIndex, toWaypointIndex, coordsIndex}) {
        const {waypoints} = state,
            map = mapCollection.getMap(rootState.Maps.mode),
            routeFeature = await dispatch("getRouteFeature"),
            lineIndex = coordsIndex ? coordsIndex.slice(0) : [
                waypoints[fromWaypointIndex].getIndexDirectionsLineString(),
                waypoints[toWaypointIndex].getIndexDirectionsLineString()
            ],
            linestringFeature = new Feature({
                geometry: new LineString(routeFeature.getGeometry().getCoordinates().slice(...lineIndex))
            });

        map.getView().fit(linestringFeature.getGeometry().getExtent());
    },

    /**
     * Retrieves the waypoint coordinates in wgs84 projection
     * @param {Object} context actions context object.
     * @returns {Array<{Number, Number}>} wgs84 coordinates
     */
    async getDirectionsCoordinatesWgs84 ({dispatch, getters}) {
        const coordinates = [],
            directionsCoordinates = getters.waypoints
                .map(waypoint => waypoint.getCoordinates())
                .filter(coords => coords.length === 2);

        for (const coords of directionsCoordinates) {
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
     * Retrieves the polygons to avoid in the wgs84 projection as a MultiPolygon
     * @param {Object} context actions context object.
     * @returns {Object} MultiPolygon in wgs84
     */
    async getAvoidPolygonsWgs84 ({state, dispatch}) {
        const {directionsAvoidSource, directionsAvoidPointSource} = state,
            sourceFeatures = directionsAvoidSource.getFeatures(),
            avoidPointSourceFeatures = directionsAvoidPointSource.getFeatures(),
            polygonFeature = {type: "MultiPolygon", coordinates: []};

        // get coordinates of avoid areas
        for (const sourceFeature of sourceFeatures) {
            polygonFeature.coordinates.push(await dispatch("getAvoidCoordinates", sourceFeature.getGeometry()));
        }
        // get coordinates of avoid points
        for (const sourceFeature of avoidPointSourceFeatures) {
            // if there is no avoid point radius specified, use a radius of
            // 5 m to construct polygon
            if (sourceFeature.getGeometry().getRadius() === 0) {
                sourceFeature.getGeometry().setRadius(5);
            }
            const polygonFromCircle = fromCircle(sourceFeature.getGeometry(), 36);

            polygonFeature.coordinates.push(await dispatch("getAvoidCoordinates", polygonFromCircle));
        }
        return polygonFeature;
    },

    /**
     * Extract coordinates of avoid areas/polygons and transform to local coordinates
     * @param {Object} context actions context object.
     * @param {Array} sourceFeatureGeometry geometry of feature
     * @returns {Object} wgsPolygon
     */
    async getAvoidCoordinates ({dispatch}, sourceFeatureGeometry) {
        const sourceCoordinates = sourceFeatureGeometry.getCoordinates(),
            wgsPolygon = [];

        for (const coordinates of sourceCoordinates) {
            const wgsCoordinates = [];

            for (const coordinate of coordinates) {
                wgsCoordinates.push(
                    await dispatch(
                        "Modules/Routing/transformCoordinatesLocalToWgs84Projection",
                        coordinate,
                        {root: true}
                    )
                );
            }
            wgsPolygon.push(wgsCoordinates);
        }
        return wgsPolygon;
    },

    /**
     * Called when Routing.vue is created to initialize the map layers, map interactions and waypoints.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async initDirections ({state, dispatch, commit, rootState}) {
        const {
                directionsWaypointsLayer,
                directionsRouteLayer,
                directionsAvoidLayer,
                directionsAvoidPointLayer,
                directionsElevationLayer,
                directionsWaypointsDrawInteraction,
                directionsAvoidDrawInteraction,
                directionsAvoidPointDrawInteraction,
                directionsAvoidSelectInteraction,
                directionsAvoidPointSelectInteraction,
                mapListenerAdded
            } = state,
            map = await mapCollection.getMap(rootState.Maps.mode),
            allLayers = map.getLayers().getArray();

        /**
         * Checks if a layer with the specified ID has already been added to the map.
         *
         * @param {string} layerId - The ID of the layer to check.
         * @returns {boolean} - Returns true if the layer is already added, false otherwise.
         */
        function isLayerAdded (layerId) {
            return allLayers.some(layer => layer.get("id") === layerId);
        }

        dispatch("initWaypoints");

        if (!mapListenerAdded) {
            directionsWaypointsDrawInteraction.on("drawend", event => dispatch("onDirectionsWaypointsDrawEnd", event));
            directionsAvoidDrawInteraction.on("drawend", event => dispatch("onDirectionsAvoidDrawEnd", event));
            directionsAvoidPointDrawInteraction.on("drawend", event => dispatch("onDirectionsAvoidPointDrawEnd", event));
            directionsAvoidSelectInteraction.on("select", event => dispatch("onDirectionsAvoidSelect", event));
            directionsAvoidPointSelectInteraction.on("select", event => dispatch("onDirectionsAvoidPointSelect", event));


            dispatch("createDirectionsWaypointsModifyInteractionListener");
            dispatch("createDirectionsAvoidModifyInteractionListener");
            dispatch("createDirectionsAvoidPointTranslateInteractionListener");
            dispatch("createDirectionsRouteModifyInteractionListener");
            commit("setMapListenerAdded", true);
        }

        if (!isLayerAdded(directionsRouteLayer.get("id"))) {
            dispatch("Maps/addLayer", toRaw(directionsRouteLayer), {root: true});
        }

        if (!isLayerAdded(directionsWaypointsLayer.get("id"))) {
            dispatch("Maps/addLayer", toRaw(directionsWaypointsLayer), {root: true});
        }

        if (!isLayerAdded(directionsAvoidLayer.get("id"))) {
            dispatch("Maps/addLayer", toRaw(directionsAvoidLayer), {root: true});
        }
        if (!isLayerAdded(directionsAvoidPointLayer.get("id"))) {
            dispatch("Maps/addLayer", toRaw(directionsAvoidPointLayer), {root: true});
        }
        if (!isLayerAdded(directionsElevationLayer.get("id"))) {
            dispatch("Maps/addLayer", toRaw(directionsElevationLayer), {root: true});
        }

        dispatch("createInteractionFromMapInteractionMode");
    },

    /**
     * Resets all waypoints, deletes external waypoints, removes coordinates from features,
     * sets directions to null and clear avoid source.
     * @param {Object} context the vuex context
     * @param {Object} context.getters the getters
     * @param {Object} context.commit the commit
     * @param {Object} context.dispatch the dispatch
     * @returns {void}
     */
    reset ({getters, commit, dispatch}) {
        const {waypoints, directionsRouteSource, directionsAvoidSource, directionsAvoidPointSource} = getters;

        if (waypoints.length > 0) {
            for (let i = waypoints.length - 1; i >= 0; i--) {
                dispatch("removeWaypoint", {index: waypoints[i].index});
                if (waypoints[i] && waypoints[i].fromExtern === true) {
                    waypoints.splice(i, 1);
                }
            }
            directionsRouteSource.getFeatures().forEach(feature => feature.getGeometry().setCoordinates([]));
            commit("setRoutingDirections", null);
            directionsAvoidSource.clear();
            directionsAvoidPointSource.clear();
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
            dispatch("createDirectionsWaypointsDrawInteraction");
        }
        else if (mapInteractionMode === "AVOID_AREAS") {
            dispatch("createDirectionsAvoidDrawInteraction");
        }
        else if (mapInteractionMode === "DELETE_AVOID_AREAS") {
            dispatch("createDirectionsAvoidSelectInteraction");
        }
        else if (mapInteractionMode === "AVOID_POINTS") {
            dispatch("createDirectionsAvoidPointDrawInteraction");
        }
    },

    /**
     * Called when the directions tab is being closed to reset the map layer and interaction
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async closeDirections ({state, dispatch}) {
        const {directionsWaypointsLayer, directionsRouteLayer, directionsAvoidLayer, directionsAvoidPointLayer, directionsElevationLayer} = state,
            map = await mapCollection.getMap("2D");

        if (!state.keepRoutes) {
            map.removeLayer(toRaw(directionsRouteLayer));
        }
        map.removeLayer(toRaw(directionsWaypointsLayer));
        map.removeLayer(toRaw(directionsAvoidLayer));
        map.removeLayer(toRaw(directionsAvoidPointLayer));
        map.removeLayer(toRaw(directionsElevationLayer));

        dispatch("removeMapInteractions");
    },

    /**
     * Creates event listener to be called when the waypoints are dragged/modified
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsWaypointsModifyInteractionListener ({state, dispatch}) {
        const {directionsWaypointsModifyInteraction} = state;

        let changedFeature;

        directionsWaypointsModifyInteraction.on("modifystart", event => {
            event.features.getArray().forEach(feature => {
                feature.getGeometry().once("change", () => {
                    changedFeature = feature;
                });
            });
        });

        directionsWaypointsModifyInteraction.on("modifyend", async () => {
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
                );

            waypoint.setDisplayName(
                geoSearchResult ? geoSearchResult.getDisplayName() : waypoint.getCoordinates()
            );
            dispatch("findDirections");
        });
    },

    /**
     * Creates event listener to be called when the avoid polygons are modified
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsAvoidModifyInteractionListener ({state, dispatch}) {
        const {directionsAvoidModifyInteraction} = state;

        directionsAvoidModifyInteraction.on("modifyend", async () => {

            dispatch("findDirections");
        });
    },
    /**
     * Creates event listener to be called when the avoid points are modified
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsAvoidPointTranslateInteractionListener ({state, dispatch}) {
        const {directionsAvoidPointTranslateInteraction} = state;

        directionsAvoidPointTranslateInteraction.on("translateend", async () => {
            dispatch("findDirections");
        });
    },

    /**
     * Tries to find the waypoint index between the given lineStringIndex.
     * Used to determine where to insert the new waypoint when the route is dragged in the map.
     * @param {Object} context actions context object.
     * @param {Object} params with lineStringIndex as number to search
     * @param {Number} [params.lineStringIndex] at which index in the linestring to search for waypoints
     * @returns {Number | null} the waypoint index or null if nothing was found
     */
    findWaypointBetweenLineStringIndex ({state}, {lineStringIndex}) {
        const {waypoints} = state;

        for (let i = 0; i < waypoints.length; i++) {
            const waypoint = waypoints[i],
                nextWaypoint = waypoints[i + 1];

            if (
                !nextWaypoint ||
                waypoint.getIndexDirectionsLineString() === null ||
                nextWaypoint.getIndexDirectionsLineString() === null
            ) {
                break;
            }
            if (
                lineStringIndex >= waypoint.getIndexDirectionsLineString() &&
                lineStringIndex < nextWaypoint.getIndexDirectionsLineString()
            ) {
                return i;
            }
        }
        return null;
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
     * Creates event listener to be called when the user drags the route feature to create a new waypoint.
     * Requests new Directions afterwards.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsRouteModifyInteractionListener ({
        state,
        dispatch,
        commit
    }) {
        const {directionsRouteModifyInteraction} = state;

        directionsRouteModifyInteraction.on("modifyend", async event => {
            const {routingDirections} = state,
                newCoordinates = event.features
                    .getArray()[0]
                    .getGeometry()
                    .getCoordinates(),
                oldLineString = routingDirections.getLineString();

            // set isAwaitingRouteModifyEnd into waiting mode
            commit("setIsAwaitingRouteModifyEnd", true);

            for (let i = 0; i < oldLineString.length; i++) {
                if (
                    oldLineString[i][0] === newCoordinates[i][0] &&
                    oldLineString[i][1] === newCoordinates[i][1]
                ) {
                    continue;
                }
                const newCoordinate = newCoordinates[i].splice(0, 2),
                    nextIndex = await dispatch(
                        "findWaypointBetweenLineStringIndex",
                        {
                            lineStringIndex: i
                        }
                    ),
                    wgs84Coordinates = await dispatch(
                        "Modules/Routing/transformCoordinatesLocalToWgs84Projection",
                        newCoordinate,
                        {root: true}
                    ),
                    geoSearchResult = await dispatch(
                        "Modules/Routing/fetchTextByCoordinates",
                        {
                            coordinates: wgs84Coordinates
                        },
                        {root: true}
                    ),
                    newFeature = new Feature({
                        geometry: new Point(newCoordinate)
                    });

                await dispatch("addWaypoint", {
                    index: nextIndex + 1,
                    feature: newFeature,
                    displayName: geoSearchResult ? geoSearchResult.getDisplayName() : null
                });
                // for some reason the new feature has to be added to source manually
                state.directionsWaypointsSource.addFeature(newFeature);
                break;
            }
            // end waiting mode of isAwaitingRouteModifyEnd
            commit("setIsAwaitingRouteModifyEnd", false);

            dispatch("findDirections");
        });
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
    addWaypoint ({state}, {index, feature, displayName, coordinates, fromExtern}) {
        let waypointIndex = index,
            waypoint;

        if (typeof index !== "number") {
            waypointIndex = state.waypoints.length;
        }
        if (feature) {
            // If feature is set the call comes from the map and we try to find a
            // waypoint without coordinates first before adding it
            const waypointWithoutCoordinates = state.waypoints.find(
                waypt => waypt.getCoordinates().length === 0
            );

            if (waypointWithoutCoordinates && state.addStartEndPoint === -1) {
                waypointWithoutCoordinates.setCoordinates(feature.getGeometry().getCoordinates().splice(0, 2));
                if (displayName) {
                    waypointWithoutCoordinates.setDisplayName(displayName);
                }
                // Drawend is called before feature is added to directionsWaypointsSource
                // We delete the drawn feature and only copy the coordinates
                state.directionsWaypointsSource.removeFeature(feature);

                return waypointWithoutCoordinates;
            }
        }
        // set point with input field selected
        if (feature && state.addStartEndPoint >= 0) {

            state.waypoints[state.addStartEndPoint].setCoordinates(feature.getGeometry().getCoordinates());
            state.waypoints[state.addStartEndPoint].setDisplayName(displayName);
            state.directionsWaypointsSource?.removeFeature(feature);
        }
        // if there is no input field selected, set new endpoint
        else if (state.addStartEndPoint === -1) {
            waypoint = new RoutingWaypoint({
                index: waypointIndex,
                feature,
                displayName,
                source: state.directionsWaypointsSource
            });
        }
        // reset addStartEndPoint to -1 so the next call is an endpoint or fills an empty field
        state.addStartEndPoint = -1;

        if (waypoint) {
            if (fromExtern) {
                waypoint.fromExtern = true;
            }
            if (coordinates) {
                waypoint.setCoordinates(coordinates);
            }

            state.waypoints.splice(waypointIndex, 0, waypoint);
        }
        // Fix index on waypoints after new waypoint
        for (let i = waypointIndex + 1; i < state.waypoints.length; i++) {
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
    removeWaypoint ({state, dispatch, commit}, {index, reload = false}) {
        const {waypoints, directionsWaypointsSource, directionsRouteSource} = state;

        if (waypoints.length === 2) {
            waypoints[index].reset();
            directionsRouteSource.getFeatures().forEach(feature => feature.getGeometry().setCoordinates([]));
            commit("setRoutingDirections", null);
            return;
        }
        if (waypoints[index].addedToSource) {
            directionsWaypointsSource.removeFeature(waypoints[index].getFeature());
        }
        for (let i = index; i < waypoints.length; i++) {
            waypoints[i].setIndex(waypoints[i].getIndex() - 1);
        }
        waypoints.splice(index, 1);
        if (reload) {
            dispatch("findDirections");
        }
    },
    /**
     * Moves the waypoint at the given index down
     * @param {Object} context actions context object.
     * @param {Number} index for the waypoint to be moved down
     * @returns {void}
     */
    moveWaypointDown ({state, dispatch}, index) {
        const {waypoints} = state,
            newIndex = index + 1,
            waypoint = waypoints[index],
            waypointUnder = waypoints[newIndex];

        if (index < 0 || newIndex >= waypoints.length) {
            return;
        }

        waypoints.splice(index, 2, waypoints[newIndex], waypoints[index]);
        waypoint.setIndex(newIndex);
        waypointUnder.setIndex(index);
        dispatch("findDirections");
    },
    /**
     * Moves the waypoint at the given index up
     * @param {Object} context actions context object.
     * @param {Number} index for the waypoint to be moved up
     * @returns {void}
     */
    moveWaypointUp ({state, dispatch}, index) {
        const {waypoints} = state,
            newIndex = index - 1,
            waypoint = waypoints[index],
            waypointUnder = waypoints[newIndex];

        if (index < 0 || newIndex === waypoints.length) {
            return;
        }

        waypoints.splice(newIndex, 2, waypoints[index], waypoints[newIndex]);
        waypoint.setIndex(newIndex);
        waypointUnder.setIndex(index);
        dispatch("findDirections");
    },

    /**
     * Initializes the waypoint array with the minimum waypoints (2) for start and end.
     *
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
    async onDirectionsWaypointsDrawEnd ({dispatch}, event) {
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
        dispatch("findDirections");
    },

    /**
     * Executed when User adds a new polygon to avoid on the Map
     * @param {Object} context actions context object.
     * @param {Object} event OL OnDrawEvent.
     * @returns {void}
     */
    async onDirectionsAvoidDrawEnd ({dispatch}) {
        // OpenLayers calls drawend before the feature is added to the source so we wait one iteration
        dispatch("findDirections");
    },
    /**
     * Executed when User adds a new point to avoid on the Map
     * @param {Object} context actions context object.
     * @param {Object} event OL OnDrawEvent.
     * @returns {void}
     */
    onDirectionsAvoidPointDrawEnd ({state, dispatch}, event) {
        // set new circle geometry
        event.feature.setGeometry(new Circle(event.feature.getGeometry().getCoordinates()));
        // set radius from state
        event.feature.getGeometry().setRadius(state.settings.avoidRadius > 0 ? state.settings.avoidRadius * 1000 : 5);
        dispatch("findDirections");
    },
    /**
     * Displays imported avoid areas on the map.
     * @param {Array} feature Feature-Objekt of a imported avoid area.
     * @returns {void}
     */
    displayImportedAvoidAreas ({dispatch, state}, feature) {
        state.directionsAvoidSource.addFeature(feature);
        dispatch("findDirections");
    },
    /**
     * Executed when User adds a new polygon to avoid on the Map
     * @param {Object} context actions context object.
     * @param {Object} event OL OnSelectEvent.
     * @returns {void}
     */
    onDirectionsAvoidSelect ({state, dispatch}, event) {
        const {directionsAvoidSource} = state;

        for (const feature of event.selected) {
            directionsAvoidSource.removeFeature(feature);
        }
        dispatch("findDirections");
    },
    /**
    * Executed when User removes avoid point
    * @param {Object} context actions context object.
    * @param {Object} event OL OnSelectEvent.
    * @returns {void}
    */
    onDirectionsAvoidPointSelect ({state, dispatch}, event) {
        const {directionsAvoidPointSource} = state;

        for (const feature of event.selected) {
            directionsAvoidPointSource.removeFeature(feature);
        }
        dispatch("findDirections");
    },

    /**
     * Creates a new draw interaction depending on state to either draw
     * lines or polygons. The method will first remove any prior draw
     * interaction created by this module.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsWaypointsDrawInteraction ({state, dispatch}) {
        dispatch("removeMapInteractions");
        const {
            directionsWaypointsModifyInteraction,
            directionsWaypointsSnapInteraction,
            directionsWaypointsDrawInteraction,
            directionsRouteModifyInteraction,
            directionsRouteSnapInteraction
        } = state;

        dispatch("Maps/addInteraction", directionsRouteModifyInteraction, {root: true});
        dispatch("Maps/addInteraction", directionsRouteSnapInteraction, {root: true});

        dispatch("Maps/addInteraction", directionsWaypointsDrawInteraction, {root: true});
        dispatch("Maps/addInteraction", directionsWaypointsModifyInteraction, {root: true});
        dispatch("Maps/addInteraction", directionsWaypointsSnapInteraction, {root: true});
    },
    /**
     * Removes the draw interaction. This includes aborting any current
     * unfinished drawing, removing the interaction from the map, and
     * removing the interaction from the store.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    removeDirectionsWaypointsDrawInteraction ({state, dispatch}) {
        const {
            directionsWaypointsDrawInteraction,
            directionsWaypointsModifyInteraction,
            directionsWaypointsSnapInteraction,
            directionsRouteModifyInteraction,
            directionsRouteSnapInteraction
        } = state;

        directionsWaypointsDrawInteraction.abortDrawing();

        dispatch("Maps/removeInteraction", directionsRouteModifyInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsRouteSnapInteraction, {root: true});

        dispatch("Maps/removeInteraction", directionsWaypointsDrawInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsWaypointsModifyInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsWaypointsSnapInteraction, {root: true});
    },

    /**
     * Creates a new draw interaction for polygons to avoid.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsAvoidDrawInteraction ({state, dispatch}) {
        dispatch("removeMapInteractions");
        const {
            directionsAvoidModifyInteraction,
            directionsAvoidSnapInteraction,
            directionsAvoidDrawInteraction
        } = state;

        dispatch("Maps/addInteraction", directionsAvoidDrawInteraction, {root: true});
        dispatch("Maps/addInteraction", directionsAvoidModifyInteraction, {root: true});
        dispatch("Maps/addInteraction", directionsAvoidSnapInteraction, {root: true});
    },
    /**
     * Creates a new draw interaction for points with radius to avoid.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsAvoidPointDrawInteraction ({state, dispatch}) {
        dispatch("removeMapInteractions");
        const {
            directionsAvoidPointTranslateInteraction,
            directionsAvoidPointDrawInteraction
        } = state;

        dispatch("Maps/addInteraction", directionsAvoidPointDrawInteraction, {root: true});
        dispatch("Maps/addInteraction", directionsAvoidPointTranslateInteraction, {root: true});
    },
    /**
     * Removes the draw interaction for polygons to avoid.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    removeDirectionsAvoidDrawInteraction ({state, dispatch}) {
        const {
            directionsAvoidModifyInteraction,
            directionsAvoidPointTranslateInteraction,
            directionsAvoidSnapInteraction,
            directionsAvoidDrawInteraction,
            directionsAvoidPointDrawInteraction

        } = state;

        directionsAvoidDrawInteraction.abortDrawing();
        directionsAvoidPointDrawInteraction;

        dispatch("Maps/removeInteraction", directionsAvoidModifyInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsAvoidPointTranslateInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsAvoidSnapInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsAvoidDrawInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsAvoidPointDrawInteraction, {root: true});

    },

    /**
     * Creates a new select interaction to delete avoid areas.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    createDirectionsAvoidSelectInteraction ({state, dispatch}) {
        dispatch("removeMapInteractions");
        const {directionsAvoidSelectInteraction, directionsAvoidPointSelectInteraction} = state;

        dispatch("Maps/addInteraction", directionsAvoidSelectInteraction, {root: true});
        dispatch("Maps/addInteraction", directionsAvoidPointSelectInteraction, {root: true});

    },
    /**
     * Removes the select interaction for deletion of avoid areas.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    removeDirectionsAvoidSelectInteraction ({state, dispatch}) {
        const {directionsAvoidSelectInteraction, directionsAvoidPointSelectInteraction} = state;

        dispatch("Maps/removeInteraction", directionsAvoidSelectInteraction, {root: true});
        dispatch("Maps/removeInteraction", directionsAvoidPointSelectInteraction, {root: true});

    },
    /**
     * Removes the directions interactions.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    removeMapInteractions ({dispatch}) {
        dispatch("removeDirectionsWaypointsDrawInteraction");
        dispatch("removeDirectionsAvoidDrawInteraction");
        dispatch("removeDirectionsAvoidSelectInteraction");
    },
    /**
     * Remove layer with avoid areas to map.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    removeAvoidLayer ({state, rootState}) {
        const {directionsAvoidLayer, directionsAvoidPointLayer} = state,
            map = mapCollection.getMap(rootState.Maps.mode);

        map.removeLayer(toRaw(directionsAvoidLayer));
        map.removeLayer(toRaw(directionsAvoidPointLayer));
    },

    /**
     * Add layer with avoid areas from map.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    addAvoidLayer ({state, rootState}) {
        const {directionsAvoidLayer, directionsAvoidPointLayer} = state,
            map = mapCollection.getMap(rootState.Maps.mode);

        if (!map.getLayers().getArray().includes(toRaw(directionsAvoidLayer))) {
            map.addLayer(toRaw(directionsAvoidLayer));
            map.addLayer(toRaw(directionsAvoidPointLayer));
        }
    }
};
