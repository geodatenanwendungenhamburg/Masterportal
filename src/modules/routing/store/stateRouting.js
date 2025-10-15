/**
 * State of routing
 * @module modules/routing/store/state
 *
 * @typedef {Object} RoutingState
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} type The type of the module.
 * @property {Boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} icon Icon next to title (config-param).
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map mode in which this module can be used.

 * @property {String} activeRoutingToolOption Navigation Parameter which raouting mode is actived from begin.
 * @property {String[]} routingToolOptions routingToolOptions: ["DIRECTIONS", "ISOCHRONES"].
 * @property {Object} taskHandler Used to keep Track of the current process of batchProcessing.
 * @property {Object} download Download Parameter.
 * @property {Object} geosearch Routing Geosearch Parameter. // type: "NOMINATIM", serviceId: "nominatim_suche" or type: "BKG",serviceId: "bkg_geosearch".
 * @property {Object} geosearchReverse Routing GeosearchReverse Parameters.  // type: "NOMINATIM",serviceId: "nominatim_reverse"type: "BKG",serviceId: "bkg_geosearch".
 * @property {Object} directionsSettings Routing Direction Parameters. // type: "ORS",serviceId: "bkg_ors".
 * @property {Object} isochronesSettings Routing Isochrones Parameters. // type: "ORS",serviceId: "bkg_ors".
*/
const state = {
    // mandatory
    type: "routing",
    // mandatory defaults for config.json parameters
    hasMouseMapInteractions: true,
    description: "common:modules.routing.description",
    name: "common:modules.routing.name",
    icon: "bi-signpost-2",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],

    // Navigation Parameter
    activeRoutingToolOption: "DIRECTIONS",
    routingToolOptions: [],
    taskHandler: null,
    download: {
        fileName: "",
        format: "GEOJSON"
    },
    geosearch: {
        minChars: 3,
        limit: 10,
        bbox: "",
        type: null,
        serviceId: null,
        epsg: "4326",
        searchField: null,
        sortField: null,
        typeName: null,
        propertyNames: null,
        geometryName: null
    },
    geosearchReverse: {
        type: null,
        serviceId: null,
        distance: 1000,
        filter: null
    },
    directionsSettings: {
        type: null,
        serviceId: null,
        speedProfile: "CAR",
        preference: "RECOMMENDED",
        elevation: false,
        avoidRadius: 0.005,
        maxAvoidRadius: 12,
        defaultAvoidRadius: 0.005,
        styleRoute: {
            fillColor: [255, 44, 0, 1],
            width: 6,
            highlightColor: [255, 255, 255, 1],
            highlightWidth: 9,
            partHighlightColor: [255, 255, 255, 1],
            partHighlightWidth: 3
        },
        styleWaypoint: {
            lineColor: [255, 127, 0],
            lineWidth: 4,
            fillColor: [255, 127, 0],
            textFillColor: "#000",
            textLineColor: "#fff",
            textLineWidth: 3,
            opacity: 0.3,
            radius: 8
        },
        styleAvoidAreas: {
            lineColor: [0, 127, 255],
            lineWidth: 2,
            fillColor: [0, 127, 255],
            opacity: 0.3,
            pointRadius: 8,
            pointLineWidth: 4
        },
        styleElevationProfile: {
            profileColor: "#fe2c00",
            profileFillColor: "#fccac0",
            elevationPointLineColor: [0, 0, 0, 1.0],
            elevationPointFillColor: [125, 125, 125, 1.0]
        },
        batchProcessing: {
            enabled: false,
            active: false,
            limit: 1000,
            maximumConcurrentRequests: 3
        },
        avoidAreaOptions: {
            maxFeatures: 50,
            maxArea: 200000,
            maxSideLength: 20000
        }
    },
    isochronesSettings: {
        type: null,
        serviceId: null,
        speedProfile: "CAR",
        isochronesMethodOption: "TIME",
        distanceValue: 30,
        minDistance: 1,
        maxDistance: 400,
        timeValue: 30,
        minTime: 1,
        maxTime: 180,
        intervalValue: 15,
        minInterval: 3,
        maxInterval: 30,
        attributes: [],
        areaUnit: "km",
        styleCenter: {
            lineColor: [255, 127, 0],
            lineWidth: 4,
            fillColor: [255, 127, 0],
            opacity: 0.3,
            radius: 8
        },
        styleIsochrones: {
            lineWidth: 2,
            opacity: 0.65,
            startColor: [66, 245, 78],
            endColor: [245, 66, 66]
        },
        batchProcessing: {
            enabled: false,
            active: false,
            limit: 1000,
            maximumConcurrentRequests: 3
        }
    },
    tsrSettings: {
        type: null,
        serviceId: null,
        speedProfile: "CAR",
        preference: "RECOMMENDED",
        elevation: false,
        tsrPointLimit: 50,
        styleRoute: {
            fillColor: [255, 44, 0],
            width: 6
        },
        styleWaypoint: {
            lineColor: [255, 127, 0],
            lineWidth: 4,
            fillColor: [255, 127, 0],
            textFillColor: "#000",
            textLineColor: "#fff",
            textLineWidth: 3,
            opacity: 0.3,
            radius: 8
        },
        styleElevationProfile: {
            profileColor: "#32a9e8",
            profileFillColor: "#8cc7e6",
            elevationPointLineColor: [0, 0, 0, 1.0],
            elevationPointFillColor: [125, 125, 125, 1.0]
        }
    }
};

export default state;
