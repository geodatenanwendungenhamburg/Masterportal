import crs from "@masterportal/masterportalapi/src/crs.js";

import store from "@appstore/index.js";
import highlightFeaturesByAttribute from "./highlightFeaturesByAttribute.js";
import processUrlParams from "@shared/js/utils/processUrlParams.js";

/**
 * Here the urlParams for the maps are processed.
 *
 * Examples:
 * - https://localhost:9001/portal/master/?featureviaurl=[{"layerId":"42","features":[{"coordinates":[10,53.5],"label":"TestPunkt"}]}]
 * - https://localhost:9001/portal/master/?highlightfeature=1711,DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2
 * - https://localhost:9001/portal/master/?highlightFeaturesByAttribute=123&wfsId=8712&attributeName=bezirk&attributeValue=Altona&attributeQuery=IsLike
 * - https://localhost:9001/portal/master/?MAPS={"center":[571278.4429867676,5938534.397334521],"mode":"2D","zoom":7}
 * - https://localhost:9001/portal/master/?MAPS={"center":[571278.4429867676,5938534.397334521],"mode":"3D","zoom":7,"altitude":127,"heading":-1.2502079000000208,"tilt":45}
 * - https://localhost:9001/portal/master/?MAPS={"center":[566052.8033758092,5934047.425113484],"mode":"3D","zoom":6,"lon":9.998038825236218,"lat":53.547413802000875,"height":752.2291730177016,"heading":350.604574930956,"pitch":-60.68774191413812}
 * - https://localhost:9001/portal/master/?marker=565874,5934140
 * - https://localhost:9001/portal/master/?ZOOMTOFEATUREID=18,26
 * - https://localhost:9001/portal/master/?zoomtogeometry=bergedorf
 *
 * - https://localhost:9001/portal/master/?map=3d&altitude=127&heading=-1.2502079000000208&tilt=45
 * - https://localhost:9001/portal/master/?Map/highlightfeature=1711,DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2
 * - https://localhost:9001/portal/master/?bezirk=bergedorf
 * - https://localhost:9001/portal/master/?center=553925,5931898
 * - https://localhost:9001/portal/master/?center=[553925,5931898]
 * - https://localhost:9001/portal/master/?Map/center=[553925,5931898]
 * - https://localhost:9001/portal/master/?mapMode=3d
 * - https://localhost:9001/portal/master/?MAP/MAPMODE=3d
 * - https://localhost:9001/portal/master/?MAPMARKER=[565874,5934140]
 * - https://localhost:9001/portal/master/?Map/projection=EPSG:31467&Map/center=[3565836,5945355]
 * - https://localhost:9001/portal/master/?projection=EPSG:31467&marker=3565836,5945355
 * - https://localhost:9001/portal/master/?zoomtogeometry=altona
 * - https://localhost:9001/portal/master/?zoomlevel=0
 * - https://localhost:9001/portal/master/?ZOOMTOEXTENT=10.0822,53.6458,10.1781,53.8003&PROJECTION=EPSG:4326
 * - https://localhost:9001/portal/master/?zoomToExtent=510000,5850000,625000,6000000
 * - https://localhost:9001/portal/master/?MAP/ZOOMTOFEATUREID=18,26
 * - https://localhost:9001/portal/master/?featureid=18,26
 */

/**
 * URL Parameters for Map Configuration & Interaction
 * --------------------------------------------------
 * This section documents the supported URL parameters used to control and interact with the map.
 * Both modern and legacy formats are processed. Modern usage is preferred for consistency and flexibility.
 *
 * =========================
 * Modern URL Parameters
 * =========================
 * These are recommended for new implementations. All complex map state is passed via a JSON object
 * in the `MAPS` parameter. Values should be URL-encoded but shown decoded here for clarity.
 *
 * Examples:
 *
 * 1. Add features to map dynamically:
 *    https://localhost:9001/portal/master/?featureviaurl=[{"layerId":"42","features":[{"coordinates":[10,53.5],"label":"TestPunkt"}]}]
 *
 * 2. Highlight a feature by ID (The layer with the specified ID (here: 1711) must be initially visible for the feature to be highlighted.):
 *    https://localhost:9001/portal/master/?highlightfeature=1711,DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2
 *
 * 3. Highlight features by attribute query:
 *    https://localhost:9001/portal/master/?highlightFeaturesByAttribute=123&wfsId=8712&attributeName=bezirk&attributeValue=Altona&attributeQuery=IsLike
 *
 * 4. Set map center, mode, and zoom (2D):
 *    https://localhost:9001/portal/master/?MAPS={"center":[571278.44,5938534.39],"mode":"2D","zoom":7}
 *
 * 5. Set camera parameters (3D mode, basic):
 *    https://localhost:9001/portal/master/?MAPS={"center":[571278.44,5938534.39],"mode":"3D","zoom":7,"altitude":127,"heading":-1.25,"tilt":45}
 *
 * 6. Set 3D camera with lon/lat, pitch, and heading:
 *    https://localhost:9001/portal/master/?MAPS={"center":[566052.80,5934047.42],"mode":"3D","zoom":6,"lon":9.9980,"lat":53.5474,"height":752.23,"heading":350.60,"pitch":-60.68}
 *
 * 7. Set marker on the map:
 *    https://localhost:9001/portal/master/?marker=565874,5934140
 *
 * 8. Zoom to specific feature ID(s):
 *    https://localhost:9001/portal/master/?ZOOMTOFEATUREID=18,26
 *
 * --------------------------------------------------
 * Note: When passing JSON in URL (e.g., MAPS), ensure it is properly URL-encoded.
 * Most browsers will automatically decode when navigating, but encoding is required for consistency.
 *
 *
 * =========================
 * Legacy URL Parameters
 * =========================
 * These formats are still supported for backward compatibility but should be avoided for new features.
 * Functionality is equivalent to modern URLs but lacks flexibility and standardization.
 *
 * Examples:
 *
 * 1. Set map mode and camera (3D):
 *    https://localhost:9001/portal/master/?map=3d&altitude=127&heading=-1.25&tilt=45
 *
 * 2. Highlight feature:
 *    https://localhost:9001/portal/master/?Map/highlightfeature=1711,DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2
 *
 * 3. Zoom to geometry by name:
 *    https://localhost:9001/portal/master/?bezirk=bergedorf
 *    https://localhost:9001/portal/master/?zoomtogeometry=altona
 *
 * 4. Set map center (string or array):
 *    https://localhost:9001/portal/master/?center=553925,5931898
 *    https://localhost:9001/portal/master/?center=[553925,5931898]
 *    https://localhost:9001/portal/master/?Map/center=[553925,5931898]
 *
 * 5. Switch map mode:
 *    https://localhost:9001/portal/master/?mapMode=3d
 *    https://localhost:9001/portal/master/?MAP/MAPMODE=3d
 *
 * 6. Set map marker:
 *    https://localhost:9001/portal/master/?MAPMARKER=[565874,5934140]
 *
 * 7. Set projection and center/marker:
 *    https://localhost:9001/portal/master/?Map/projection=EPSG:31467&Map/center=[3565836,5945355]
 *    https://localhost:9001/portal/master/?projection=EPSG:31467&marker=3565836,5945355
 *
 * 8. Set zoom level:
 *    https://localhost:9001/portal/master/?zoomlevel=0
 *
 * 9. Zoom to extent (WGS84 and projected):
 *    https://localhost:9001/portal/master/?ZOOMTOEXTENT=10.0822,53.6458,10.1781,53.8003&PROJECTION=EPSG:4326
 *    https://localhost:9001/portal/master/?zoomToExtent=510000,5850000,625000,6000000
 *
 * 10. Zoom to feature ID(s):
 *     https://localhost:9001/portal/master/?MAP/ZOOMTOFEATUREID=18,26
 *     https://localhost:9001/portal/master/?featureid=18,26
 *
 *
 * --------------------------------------------------
 * Note: Legacy parameters may vary in capitalization and structure (e.g., "Map/", "MAP/").
 * The app handles normalization internally, but standardized usage is encouraged going forward.
 */

const mapUrlParams = {
        FEATUREVIAURL: featureViaUrl,
        HIGHLIGHTFEATURE: highlightFeature,
        HIGHLIGHTFEATURESBYATTRIBUTE: highlightFeaturesByAttributes,
        MAPS: setMapAttributes,
        MARKER: setMapMarker,
        ZOOMTOEXTENT: zoomToProjExtent,
        ZOOMTOFEATUREID: zoomToFeatures,
        ZOOMTOGEOMETRY: zoomToFeatures
    },
    legacyMapUrlParams = {
        "API/HIGHLIGHTFEATURESBYATTRIBUTE": highlightFeaturesByAttributes,
        ATTRIBUTENAME: highlightFeaturesByAttributes,
        ATTRIBUTEQUERY: highlightFeaturesByAttributes,
        ATTRIBUTEVALUE: highlightFeaturesByAttributes,
        BEZIRK: zoomToFeatures,
        CENTER: zoomToCoordinates,
        FEATUREID: zoomToFeatures,
        MAP: setMode,
        MAPMARKER: setMapMarker,
        MAPMODE: setMode,
        "MAP/CENTER": zoomToCoordinates,
        "MAP/HIGHLIGHTFEATURE": highlightFeature,
        "MAP/MAPMODE": setMode,
        "MAP/PROJECTION": processProjection,
        "MAP/ZOOMLEVEL": zoomToCoordinates,
        "MAP/ZOOMTOEXTENT": zoomToProjExtent,
        "MAP/ZOOMTOFEATUREID": zoomToFeatures,
        "MAP/ZOOMTOGEOMETRY": zoomToFeatures,
        PROJECTION: processProjection,
        WFSID: highlightFeaturesByAttributes,
        ZOOMLEVEL: zoomToCoordinates,
        HEADING: setCamera,
        TILT: setCamera,
        ALTITUDE: setCamera
    };

/**
 * Process the map url params.
 * @returns {void}
 */
function processMapUrlParams () {
    processUrlParams(mapUrlParams, legacyMapUrlParams);
}

/**
 * Set the map attributes.
 * @param {Object} params The found params.
 * @returns {void}
 */
function setMapAttributes (params) {
    const mapsParams = Object.fromEntries(
        Object.entries(JSON.parse(params.MAPS)).map(([k, v]) => [k.toUpperCase(), v])
    );

    setCamera(mapsParams);
    setMode(mapsParams);
    zoomToCoordinates(mapsParams);
}

/**
 * Creates a feature via url.
 * @param {Object} params The found params.
 * @returns {void}
 */
function featureViaUrl (params) {
    try {
        store.dispatch("Maps/featureViaUrl", JSON.parse(params.FEATUREVIAURL));
    }
    catch (error) {
        console.warn(i18next.t("common:core.maps.featureViaURL.messages.featureParsing"));
        console.error(error);
    }
}

/**
 * Highlights a feature via layerid and featureid.
 * @param {Object} params The found params.
 * @returns {void}
 */
function highlightFeature (params) {
    const layerId = (params.HIGHLIGHTFEATURE || params["MAP/HIGHLIGHTFEATURE"])?.split(",")[0],
        featureIds = (params.HIGHLIGHTFEATURE || params["MAP/HIGHLIGHTFEATURE"])?.split(",");

    featureIds.shift();
    featureIds.forEach(featureId => {
        store.dispatch("Maps/highlightFeature", {
            layerIdAndFeatureId: [layerId, featureId],
            type: "viaLayerIdAndFeatureId"
        });
    });
    store.dispatch("Maps/zoomToFilteredFeatures", {ids: featureIds, layerId: layerId, zoomOptions: {duration: 0}});
}

/**
 * Highlight Features by Attributes.
 * @param {Object} params The found params.
 * @returns {void}
 */
function highlightFeaturesByAttributes (params) {
    if (!params.ATTRIBUTENAME && !params.ATTRIBUTEVALUE && !params.ATTRIBUTEQUERY || !params.WFSID) {
        return;
    }
    const attributeName = params.ATTRIBUTENAME,
        attributeValue = params.ATTRIBUTEVALUE,
        attributeQuery = params.ATTRIBUTEQUERY,
        wfsId = params.WFSID;

    if (attributeName && attributeValue && attributeQuery && wfsId) {
        highlightFeaturesByAttribute.highlightFeaturesByAttribute(
            store.dispatch,
            store.getters,
            wfsId,
            attributeName,
            attributeValue,
            attributeQuery
        );
    }
    else {
        console.warn("Not all required URL parameters given for highlightFeaturesByAttribute.");
    }
}

/**
 * Process the param PROJECTION.
 * PROJECTION is only used in combination with one of the following parameters:
 * - CENTER, "MAP/CENTER"
 * - MARKER, MAPMARKER
 * - ZOOMTOEXTENT,"MAP/ZOOMTOEXTENT"
 * @param {Object} params The found params.
 * @returns {void}
 */
function processProjection (params) {
    if (params.CENTER || params["MAP/CENTER"]) {
        zoomToCoordinates(params);
    }
    if (params.MARKER || params.MAPMARKER) {
        setMapMarker(params);
    }
    if (params.ZOOMTOEXTENT || params["MAP/ZOOMTOEXTENT"]) {
        zoomToProjExtent(params);
    }
}

/**
 * Sets the camera parameters in the store or the Cesium map.
 * @param {Object} param The store context.
 * @param {Object} param.rootGetters The root getters of the store.
 * @param {Object} cameraParams The camera parameters.
 * @param {number} [cameraParams.altitude] The camera altitude parameter.
 * @param {number} [cameraParams.heading] The camera heading parameter.
 * @param {number} [cameraParams.tilt] The camera tilt parameter.
 * @param {number} [cameraParams.pitch] The camera pitch parameter.
 * @param {number} [cameraParams.cameraPosition] The camera position (latitude, longitude, height).
 * @returns {void}
 */
function setCamera (params) {
    const cameraSettings = {};

    if (params.LON !== undefined && params.LAT !== undefined && params.HEIGHT !== undefined) {
        cameraSettings.cameraPosition = [params.LON, params.LAT, params.HEIGHT];
    }

    if (params.HEADING !== undefined) {
        cameraSettings.heading = params.HEADING;
    }

    if (params.PITCH !== undefined) {
        cameraSettings.pitch = params.PITCH;
    }

    if (params.ALTITUDE !== undefined) {
        cameraSettings.altitude = params.ALTITUDE;
    }

    if (params.TILT !== undefined) {
        cameraSettings.tilt = params.TILT;
    }

    if (Object.keys(cameraSettings).length > 0) {
        store.dispatch("Maps/setCamera", cameraSettings);
    }
}

/**
 * Sets the map marker params.
 * @param {Object} params The found params.
 * @returns {void}
 */
function setMapMarker (params) {
    const projection = params.PROJECTION || params["MAP/PROJECTION"];
    let marker = params.MARKER || params.MAPMARKER;

    if (marker && !Array.isArray(marker)) {
        if (marker.includes("[")) {
            marker = JSON.parse(marker);
        }
        else {
            marker = marker?.split(",");
        }
    }
    marker = marker?.map(coord => parseFloat(coord, 10));

    if (store.getters.styleListLoaded) {
        store.dispatch("Maps/placingPointMarker", projection ? crs.transformToMapProjection(mapCollection.getMap("2D"), projection, marker) : marker);
    }
    else {
        store.watch((state, getters) => getters.styleListLoaded, value => {
            if (value) {
                store.dispatch("Maps/placingPointMarker", projection ? crs.transformToMapProjection(mapCollection.getMap("2D"), projection, marker) : marker);
            }
        });
    }

}

/**
 * Sets the mode params.
 * @param {Object} params The found params.
 * @returns {void}
 */
function setMode (params) {
    store.dispatch("Maps/changeMapMode", (params.MODE || params.MAP || params.MAPMODE || params["MAP/MAPMODE"])?.toUpperCase());
}

/**
 * Sets the view params zoom, center and rotation.
 * @param {Object} params The found params.
 * @returns {void}
 */
function zoomToCoordinates (params) {
    const projection = params.PROJECTION || params["MAP/PROJECTION"];
    let center = params.CENTER || params["MAP/CENTER"];

    if (center && !Array.isArray(center)) {
        if (center.includes("[")) {
            center = JSON.parse(center);
        }
        else {
            center = center?.split(",");
        }
    }

    store.dispatch("Maps/zoomToCoordinates", {
        center: projection ? crs.transformToMapProjection(mapCollection.getMap("2D"), projection, center) : center,
        zoom: params.ZOOM ?? params.ZOOMLEVEL ?? params["MAP/ZOOMLEVEL"],
        rotation: params.ROTATION
    });
}

/**
 * Zoom to features.
 * @param {Object} params The found params.
 * @returns {void}
 */
function zoomToFeatures (params) {
    store.dispatch("Maps/zoomToFeatures", {
        ZOOMTOFEATUREID: params.FEATUREID || params.ZOOMTOFEATUREID || params["MAP/ZOOMTOFEATUREID"],
        ZOOMTOGEOMETRY: params.BEZIRK || params.ZOOMTOGEOMETRY || params["MAP/ZOOMTOGEOMETRY"]
    });
}

/**
 * Zoom on an extent, with coordinates of another projection than the map.
 * @param {Object} params The found params.
 * @returns {void}
 */
function zoomToProjExtent (params) {
    store.dispatch("Maps/zoomToProjExtent", {
        extent: (params.ZOOMTOEXTENT || params["MAP/ZOOMTOEXTENT"])?.split(","),
        options: {duration: 0},
        projection: params.PROJECTION || params["MAP/PROJECTION"] || store.getters["Maps/projectionCode"]
    });
}

export default {
    processMapUrlParams,
    setMapAttributes,
    featureViaUrl,
    highlightFeature,
    highlightFeaturesByAttributes,
    processProjection,
    setMapMarker,
    setCamera,
    setMode,
    zoomToCoordinates,
    zoomToFeatures,
    zoomToProjExtent
};
