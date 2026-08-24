import {markRaw} from "vue";
import Overlay from "ol/Overlay.js";

/**
 * Creates a flag overlay with a plain DOM element that is created outside of
 * any Vue component template. This keeps the flag independent of the
 * mount/unmount cycle of the Orientation module's components (e.g. when
 * another module temporarily takes over the menu panel), so it is not
 * accidentally removed by Vue when a component owning the overlay's element
 * is unmounted.
 * @param {module:ol/coordinate~Coordinate} position Initial position for the flag.
 * @returns {module:ol/Overlay~Overlay} The created overlay, already added to the 2D map.
 */
export function createFlagOverlay (position) {
    const element = document.createElement("span");

    element.className = "orientation-flag-marker";
    element.innerHTML = "<i class=\"bi-flag\"></i>";
    Object.assign(element.style, {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#151C27",
        fontSize: "1.5rem",
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
 * Removes the given flag overlay from the 2D map.
 * @param {module:ol/Overlay~Overlay|null} overlay The overlay to remove.
 * @returns {void}
 */
export function removeFlagOverlay (overlay) {
    if (overlay) {
        mapCollection.getMap("2D").removeOverlay(overlay);
    }
}
