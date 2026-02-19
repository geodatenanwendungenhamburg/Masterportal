import store from "@appstore/index.js";
import mapCollection from "@core/maps/js/mapCollection.js";

/**
 * Waits until the 3D map and Cesium globe are fully ready.
 *
 * @returns {Promise<Cesium.Scene>} Resolves with the Cesium scene once the map is in 3D mode and all globe tiles are fully loaded.
 */
export default function waitFor3DReady () {
    return new Promise(resolve => {

        /**
         * Checks whether the 3D map and Cesium globe are fully ready.
         *
         * Conditions:
         * - Map mode must be "3D"
         * - A Cesium scene must exist
         * - Globe tiles must be fully loaded
         *
         * @returns {Cesium.Scene|false} Returns the Cesium scene if ready,
         * otherwise false.
         */
        function checkIfReady () {
            const mode = store.getters["Maps/mode"];

            if (mode !== "3D") {
                return false;
            }

            const scene = mapCollection.getMap("3D")?.getCesiumScene();

            if (!scene) {
                return false;
            }

            if (!scene.globe?.tilesLoaded) {
                return false;
            }

            return scene;
        }

        const readyScene = checkIfReady();

        if (readyScene) {
            resolve(readyScene);
            return;
        }

        const unwatch = store.watch(
            (state, getters) => getters["Maps/mode"],
            () => {
                const scene = checkIfReady();

                if (!scene) {
                    return;
                }

                unwatch();

                scene.globe.tileLoadProgressEvent.addEventListener(function listener () {
                    if (!scene.globe.tilesLoaded) {
                        return;
                    }

                    scene.globe.tileLoadProgressEvent.removeEventListener(listener);
                    resolve(scene);
                });
            }
        );
    });
}
