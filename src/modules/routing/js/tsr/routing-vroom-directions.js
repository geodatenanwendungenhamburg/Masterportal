import axios from "axios";
import state from "../../store/stateRouting.js";
import store from "@appstore/index.js";
import {RoutingTSRDirections} from "../classes/routing-directions-tsr.js";
import LineString from "ol/geom/LineString.js";
import {getLength} from "ol/sphere.js";

/**
 * Translates the preference in the corresponding value for the service
 * @param {String} preference set by the user
 * @param {String} speedProfile set by the user
 * @returns {String} translated service value
 */
function routingOrsPreference (preference, speedProfile) {
    const preferenceConfigs = store.getters["Modules/Routing/tsrSettings"]?.customPreferences;

    if (preferenceConfigs && preferenceConfigs[speedProfile]?.includes(preference)) {
        return preference.toLowerCase();
    }
    switch (preference) {
        case "RECOMMENDED": return "recommended";
        case "SHORTEST": return "shortest";
        default: throw new Error("Fehlende Preference Übersetzung");
    }
}

/**
 * Requests directions from ors service.
 * @param {Object} params parameter
 * @param {Array<{Number, Number}>} [params.coordinates] in wgs84 projection
 * @param {String} [params.language] to request the instructions in local language.
 * @param {Function} [params.transformCoordinatesToLocal] function to transform result coordinates to local projection.
 * @param {String} [params.speedProfile] to request the directions with
 * @param {String} [params.preference] to request the directions with
 * @param {Boolean} [params.instructions] if the instructions should be requested
 * @returns {RoutingTSRDirections} routingDirections
 */
async function fetchTSRDirections ({
    coordinates,
    speedProfile,
    transformCoordinatesToLocal}) {
    const url = store.getters.restServiceById(state.tsrSettings.serviceId).url,
        jobs = [],
        start = coordinates[0],
        end = coordinates[coordinates.length - 1],
        localCoordinates = [],
        elevation = state.tsrSettings.elevation;
    let feature = null,
        direction = null,
        response = null,
        responseOrs = null,
        vroomResponse = null,
        steps = null,
        coordinatesOrs = null,
        elevationProfile = null,
        currentDistance = null,

        tsrSpeedProfile = "";

    if (speedProfile === "CAR") {
        tsrSpeedProfile = "driving-car";
    }
    else if (speedProfile === "HGV") {
        tsrSpeedProfile = "driving-hgv";
    }
    else if (speedProfile === "CYCLING") {
        tsrSpeedProfile = "cycling-regular";
    }
    else if (speedProfile === "FOOT") {
        tsrSpeedProfile = "foot-walking";
    }

    for (let i = 1; i < coordinates.length - 1; i++) {
        const job = {
            id: i - 1,
            location: [coordinates[i][0], coordinates[i][1]]
        };

        jobs.push(job);
    }

    try {
        // send VROOM request
        response = await sendRequestVROOM(url, tsrSpeedProfile, start, end, jobs);

        // if elevation data should be considered, send ORS request
        if (elevation) {

            // get sorted locations
            coordinatesOrs = response.data.routes[0].steps.map((step) => step.location);

            // send ORS request
            responseOrs = await sendRequestORS(tsrSpeedProfile, coordinatesOrs);
        }
    }
    catch (e) {
        if (e.response.status === 404) {
            throw new Error(i18next.t("common:modules.routing.errors.noRouteFound"));
        }
        if (e.response.data.code === 3) {
            throw new Error(i18next.t("common:modules.routing.tsr.errors.unreachablePoint"));
        }
        throw new Error(i18next.t("common:modules.routing.errors.errorRouteFetch"));
    }

    vroomResponse = response.data;
    steps = vroomResponse.routes[0].steps;

    // geometry
    if (elevation) {
        feature = responseOrs.data.features[0];
    }
    else {
        const geojsonFeatureCollection = createGeoJSONFromVroomResponse(vroomResponse, false);

        feature = geojsonFeatureCollection.features[0];
    }

    for (const coords of feature.geometry.coordinates) {
        localCoordinates.push(await transformCoordinatesToLocal(coords));
    }

    if (elevation) {
        elevationProfile = {
            data: [],
            ascent: feature.properties.ascent,
            descent: feature.properties.descent
        };
        currentDistance = 0;
        localCoordinates.forEach((coord, i) => {

            // elevation profile of starting point (at distance 0 m)
            if (i === 0) {
                elevationProfile.data.push([currentDistance, coord[2]]);
            }
            // elevation for the remaining points
            else {
                const previousCoord = [localCoordinates[i - 1][0], localCoordinates[i - 1][1]],
                    currentCoord = [localCoordinates[i][0], localCoordinates[i][1]];

                // get distance between previous and current point
                currentDistance = currentDistance + getLength(new LineString([previousCoord, currentCoord]));
                elevationProfile.data.push([currentDistance, coord[2]]);
            }
        });
    }

    direction = new RoutingTSRDirections({
        lineString: localCoordinates,
        distance: elevation ? feature.properties.summary.distance : feature.properties.distance,
        duration: elevation ? feature.properties.summary.duration : feature.properties.duration,
        steps: steps,
        elevationProfile: elevationProfile
    });
    return direction;
}

/**
 * Sends request to VROOM service and returns its response
 * @param {String} url of VROOM request
 * @param {String} tsrSpeedProfile selected speed profile
 * @param {Array} start coordinates of start point
 * @param {Array<Number>} end coordinates of end point
 * @param {Array<Object>} jobs jobs of tsr route
 * @returns {Object} VROOM resoponse
 */
async function sendRequestVROOM (url, tsrSpeedProfile, start, end, jobs) {
    const response = await axios.post(url,
        {
            "vehicles": [
                {
                    "id": 0,
                    "profile": tsrSpeedProfile,
                    "start": [start[0], start[1]],
                    "end": [end[0], end[1]]
                }
            ],
            "jobs": jobs,
            "options": {"g": true}
        },
        {
            "content-type": "application/json",
            "Accept": "application/json"
        }
    );

    return response;
}

/**
 * Sends request to ORS service and returns its response
 * @param {String} tsrSpeedProfile selected speed profile
 * @param {Array} coordinates of points
 * @returns {Object} ORS response
 */
async function sendRequestORS (tsrSpeedProfile, coordinates) {
    let serviceUrl = store.getters.restServiceById(state.directionsSettings.serviceId).url,
        response = null,
        url = "";

    const path = `v2/directions/${tsrSpeedProfile}/geojson`,
        postParams = {
            coordinates: coordinates,
            preference: "recommended",
            units: "m",
            elevation: true
        };

    if (serviceUrl.endsWith("/")) {
        serviceUrl += path;
    }
    else {
        serviceUrl = serviceUrl + "/" + path;
    }
    if (serviceUrl.startsWith("/")) {
        url = new URL(serviceUrl, window.location.origin);
    }
    else {
        url = new URL(serviceUrl);
    }

    response = await axios.post(url, postParams);

    return response;
}

/**
 * Decode an x,y or x,y,z encoded polyline
 * @param {*} encodedPolyline binary encoded polyline
 * @param {Boolean} includeElevation - true for x,y,z polyline
 * @returns {Array} of coordinates
 */
function decodePolyline (encodedPolyline, includeElevation) {
    // array that holds the points
    const points = [],
        len = encodedPolyline.length;
    let index = 0,
        lat = 0,
        lng = 0,
        ele = 0;

    while (index < len) {
        let b,
            shift = 0,
            result = 0;

        do {
            b = encodedPolyline.charAt(index++).charCodeAt(0) - 63; // finds ascii
            // and subtract it by 63
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        shift = 0;
        result = 0;
        do {
            b = encodedPolyline.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

        if (includeElevation) {
            shift = 0;
            result = 0;
            do {
                b = encodedPolyline.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            ele += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        }
        try {
            const location = [lat / 1E5, lng / 1E5];

            if (includeElevation) {
                location.push(ele / 100);
            }
            points.push(location);
        }
        catch (e) {
            this.addSingleAlert({
                category: "error",
                title: this.$t("common:modules.routing.errors.titleErrorRouteFetch"),
                content: e.message
            });
        }
    }
    return points;
}

/**
 * Construct a valid GeoJSON from a vroom response
 * @param {*} vroomResponse - the vroom response
 * @param {Boolean} includeElevation - true for x,y,z polyline
 * @returns {*} a valid GeoJSON as dictionary
 */
function createGeoJSONFromVroomResponse (vroomResponse, includeElevation) {
    // Check if routes are in the vroom response. Else return an empty array
    let routes = {},
        geojsonFeature = {};

    if ("routes" in vroomResponse) {
        routes = vroomResponse.routes;
        delete vroomResponse.routes;
    }
    else {
        return featureCollection;
    }
    // Create a GeoJSON feature collection to store the upcoming features
    const featureCollection = {
        "type": "FeatureCollection",
        "features": [],
        "metadata": vroomResponse
    };

    routes.forEach((route) => {
        const encodedPolylineCoordinates = route.geometry,
            decodedPolylineCoordinates = decodePolyline(encodedPolylineCoordinates, includeElevation);

        decodedPolylineCoordinates.forEach(function (coordinate) {
            coordinate.reverse();
        });

        // Create a geojson feature and store the coordinates and properties
        geojsonFeature = {
            "type": "Feature",
            "properties": route,
            "geometry": {
                "type": "LineString",
                "coordinates": decodedPolylineCoordinates
            }
        };

        featureCollection.features.push(geojsonFeature);
    }
    );
    return featureCollection;
}

export {fetchTSRDirections, routingOrsPreference};
