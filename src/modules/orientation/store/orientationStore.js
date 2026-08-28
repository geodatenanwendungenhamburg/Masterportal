import {defineStore} from "pinia";

/**
 * Orientation module store
 * Manages user location workflow for finding nearby features
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
