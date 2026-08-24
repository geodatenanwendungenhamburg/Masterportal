import {markRaw} from "vue";
import Overlay from "ol/Overlay.js";

/**
 * Creates a custom position marker overlay with a plain DOM element that is created outside of
 * any Vue component template. This keeps the marker independent of the
 * mount/unmount cycle of the Orientation module's components (e.g. when
 * another module temporarily takes over the menu panel), so it is not
 * accidentally removed by Vue when a component owning the overlay's element
 * is unmounted.
 * @param {module:ol/coordinate~Coordinate} position Initial position for the custom position marker.
 * @returns {module:ol/Overlay~Overlay} The created custom position marker overlay, already added to the 2D map.
**/
export function createCustomPositionMarker (position) {
    const element = document.createElement("span");

    element.className = "orientation-custom-position-marker";
    element.innerHTML = "<i class=\"bi bi-geo-fill\"></i>";
    Object.assign(element.style, {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#337ab7",
        fontSize: "2rem",
        pointerEvents: "none"
    });

    const overlay = markRaw(new Overlay({
        element,
        position,
        positioning: "center-center",
        stopEvent: false
    }));

    mapCollection.getMap("2D").addOverlay(overlay);

    return overlay;
}

/**
 * Removes the given custom position marker overlay from the 2D map.
 * @param {module:ol/Overlay~Overlay|null} overlay The overlay to remove.
 * @returns {void}
 */
export function removeCustomPositionMarker (overlay) {
    if (overlay) {
        mapCollection.getMap("2D").removeOverlay(overlay);
    }
}
