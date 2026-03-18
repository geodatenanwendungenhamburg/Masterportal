import transformer from "@shared/js/utils/coordToPixel3D.js";
import get3DHighlightColor from "@shared/js/utils/get3DHighlightColor.js";
import applyTileStyle from "@shared/js/utils/applyTileStyle.js";
import find3DPickedFeatureProvider from "@shared/js/utils/find3DPickedFeature.js";

/**
 * Waits until the Cesium scene is fully rendered and all globe tiles are loaded.
 *
 * @param {Cesium.Scene} scene - The Cesium scene instance.
 * @returns {Promise<void>} Resolves when tiles are loaded and a render frame is complete.
 */
export function waitForRenderComplete (scene) {
    return new Promise(resolve => {
        const remove = scene.postRender.addEventListener(() => {
            if (scene.globe.tilesLoaded) {
                remove();
                resolve();
            }
        });
    });
}

/**
 * Waits until a 3D feature is pickable and its tile is loaded.
 * Optionally highlights it while waiting.
 *
 * @param {Cesium.Scene} scene - The Cesium scene instance.
 * @param {string|number} featureId - The feature ID to wait for.
 * @param {string} [color="RED"] - Optional highlight color.
 * @returns {Promise<void>}
 */
export async function waitForFeatureReady (scene, featureId, color = "RED") {
    return new Promise(resolve => {
        /**
         *
         */
        async function checkFeature () {
            applyTileStyle(featureId, get3DHighlightColor(color, "RED"));

            const pickedFeature = await find3DPickedFeatureProvider.find3DPickedFeature(scene, featureId);

            if (!pickedFeature?.content?.tile?.boundingSphere) {
                requestAnimationFrame(checkFeature);
                return;
            }

            resolve();
        }
        checkFeature();
    });
}

/**
 * Transforms coordinates to pixel after feature and tiles are ready.
 *
 * @param {Array<number>} coordinates - [longitude, latitude, height] of click.
 * @returns {Array<number>} Pixel coordinates.
 */
export function getClickPixel (coordinates) {
    return transformer.coordToPixel3D(coordinates);
}
