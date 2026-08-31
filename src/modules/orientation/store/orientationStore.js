import {defineStore} from "pinia";

/**
* Orientation module store
* Manages user location workflow for finding nearby features
* @module modules/orientation/store/orientationStore
* @typedef {Object} useOrientationStore
* @property {String} iconGeolocationMarker Icon of the orientation geolocate map marker.
* @property {String[]} poiDistances The distances in config.json.
* @property {String[]} supportedDevices Devices on which the module is displayed.
* @property {String[]} supportedMapModes Map mode in which this module can be used.
* @property {String} zoomMode The zoomMode in config.json.
* @property {String} geolocation The current geolocation.
* @property {Boolean} iFrameGeolocationEnabled If true geolocation in an iFrame is possible, iff the outer page has an allow="geolocation" iFrame tag.
* @property {Boolean} onlyFilteredFeatures If true the filtered features will be used.
* @property {Boolean} currentPositionModeEnabled The status if poi mode is current position.
* @property {Boolean} showAccuracy Wether to show the accuracy circle which is displayed around the marker.
* @property {Boolean} showDirection Wether to show the direction arrow with the marker.
* @property {Boolean} hasMouseMapInteractions If true, this module claims exclusive map click/pointer interactions while active (prevents GFI and other modules with this flag from reacting to map clicks).
* @property {String} menuSide The side ("mainMenu" or "secondaryMenu") in which this module is configured, used to correctly release/claim mouse map interactions on the right menu side.
* @property {Object|null} customPositionMarker The overlay object for the custom position marker used in customPosition mode
*/
export const useOrientationStore = defineStore("orientation", {
    state: () => ({
        type: "orientation",
        name: "common:modules.orientation.name",
        description: "common:modules.orientation.description",
        icon: "bi-geo-alt",
        poiDistances: [],
        supportedDevices: ["Desktop", "Mobile"],
        supportedMapModes: ["2D", "3D"],
        zoomMode: "once",
        geolocation: null,
        iconGeolocationMarker: "bi-circle-fill",
        iconDirectionArrow: "bi-triangle-fill",
        iFrameGeolocationEnabled: "common:modules.orientation.iFrameGeolocationEnabled",
        onlyFilteredFeatures: false,
        currentPage: "choice",
        selectedMode: null,
        receivedPosition: null,
        accuracyFeature: null,
        accuracyLayer: null,
        currentPositionModeEnabled: true,
        showAccuracy: false,
        showDirection: false,
        hasMouseMapInteractions: true,
        customPositionMarker: null,
        menuSide: "secondaryMenu"
    })
});
