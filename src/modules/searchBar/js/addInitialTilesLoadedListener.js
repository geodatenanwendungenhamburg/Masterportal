import layerCollection from "@core/layers/js/layerCollection.js";

/**
 * Adds an event listener for the `initialTilesLoaded` event on all TileSet3D layers.
 * Monitors the loading state of these layers and resolves a promise when all layers have finished loading.
 * The promise also provides a cleanup function to remove the event listeners.
 *
 * @returns {Promise<{allLayersLoaded: boolean, cleanup: Function}>}
 * A promise that resolves with an object containing:
 * - `allLayersLoaded`: A boolean indicating whether all layers were loaded successfully.
 * - `cleanup`: A function to remove all added event listeners. This should be called to clean up after use.
 */
export default async function addInitialTilesLoadedListener (camera) {
    const tileSetLayers = layerCollection.getLayers().filter(layer => layer.get("typ") === "TileSet3D" && layer.get("visibility") === true && layer.attributes.gfiAttributes.PLZ === "PLZ"),
        visibleLayers = await checkVisibleLayers(camera, tileSetLayers),
        totalLayers = visibleLayers.length,
        layerLoadState = new Map(),
        cleanupCallbacks = [];

    let loadedLayersCount = 0;

    if (totalLayers === 0) {
        return Promise.resolve({allLayersLoaded: true, cleanup: () => console.warn("No layers to clean up.")});
    }


    return new Promise((resolve, reject) => {
        /**
         * Resets counters and resolves the promise with the cleanup function.
         * This is called when all layers have finished loading.
         */
        function resetCounters () {
            loadedLayersCount = 0;
            layerLoadState.clear();
            resolve({allLayersLoaded: true, cleanup: () => cleanupCallbacks.forEach(cleanup => cleanup())});
        }

        /**
         * Checks if all layers have been loaded. If true, calls `resetCounters`.
         */
        function checkIfAllLayersLoaded () {
            if (loadedLayersCount === totalLayers) {
                resetCounters();
            }
        }

        visibleLayers.forEach((layer) => {
            const tileset = layer.getLayer();

            tileset.tileset.then((result) => {
                /**
                 * Listener function triggered when the `allTilesLoaded` event fires.
                 * Updates the layer load state and checks if all layers are loaded.
                 */
                function listener () {
                    if (!layerLoadState.has(layer.get("id"))) {
                        layerLoadState.set(layer.get("id"), true);
                        loadedLayersCount++;
                        checkIfAllLayersLoaded();
                    }
                }

                result.allTilesLoaded.addEventListener(listener);

                cleanupCallbacks.push(() => result.allTilesLoaded.removeEventListener(listener));
            }).catch((error) => {
                console.error(`Error loading tiles for layer: ${layer.get("name")}`, error);
                reject(error);
            });
        });
    });
}

/**
 * Checks the visibility of all provided TileSet3D layers based on the camera's current frustum.
 * It determines whether each layer's root tile is within the camera's view (frustum culling).
 * This function supports both promise-based and ready tilesets, handling their asynchronous nature.
 *
 * @param {Cesium.Camera} camera - The Cesium camera object used to calculate the frustum and determine visibility.
 * @param {Array<Object>} tileSetLayers - An array of TileSet3D layers to check for visibility within the camera's view.
 *
 * @returns {Promise<Array<Object>>}
 * A promise that resolves with an array of TileSet3D layers that are currently visible within the camera's frustum.
 *
 * @example
 * checkVisibleLayers(camera, tileSetLayers).then(visibleLayers => {
 *     console.log("Visible TileSet3D layers:", visibleLayers);
 * });
 */
function checkVisibleLayers (camera, tileSetLayers) {
    const visibleLayers = [],
        promises = tileSetLayers.map(layer => {
            const layerData = layer.getLayer(),
                tileset = layerData.tileset;

            if (tileset && typeof tileset.then === "function") {
                return tileset.then(processTileset).catch(error => {
                    console.error(`Error loading tileset for layer: ${layer.get("name")}`, error);
                });
            }
            else if (tileset && tileset.readyPromise) {
                return tileset.readyPromise.then(() => processTileset(tileset)).catch(error => {
                    console.error(`Error loading readyPromise for layer: ${layer.get("name")}`, error);
                });
            }
            console.error("Invalid tileset:", tileset);
            return Promise.resolve();


            /**
             * Processes a TileSet3D to determine if its root tile is visible within the camera's frustum.
             * This function checks the bounding volume of the root tile and computes its visibility using
             * the camera's frustum culling. If the root tile is visible, it adds the layer to the list of
             * visible layers.
             *
             * @param {Cesium.Cesium3DTileset} currentTileset - The Cesium 3D tileset that is being checked for visibility.
             * This is the tileset associated with the layer being processed.
             *
             * @returns {void}
             * This function doesn't return any value but modifies the `visibleLayers` array by adding the layer
             * to it if the root tile is within the camera's view.
             *
             * @throws {Error} If there is no root tile or bounding volume available, a warning is logged,
             * but no layer will be added to the `visibleLayers` array.
             *
             * @example
             * processTileset(tileset).then(() => {
             *     console.log("Layer processed and checked for visibility");
             * });
            */
            function processTileset (currentTileset) {
                const rootTile = currentTileset._root,
                    boundingVolume = rootTile?._boundingVolume || rootTile?.boundingVolume,
                    frustum = camera.frustum,
                    cullingVolume = frustum.computeCullingVolume(camera.positionWC, camera.direction, camera.up),
                    visibility = cullingVolume.computeVisibility(boundingVolume),
                    isVisible = visibility !== Cesium.Intersect.OUTSIDE;

                if (!rootTile) {
                    console.warn(`No root tile for layer: ${layer.get("name")}`);
                    return;
                }

                if (!boundingVolume) {
                    console.warn("No bounding volume for layer:", layer.get("name"));
                    return;
                }

                if (isVisible) {
                    visibleLayers.push(layer);
                }
            }
        });

    return Promise.all(promises).then(() => {
        return visibleLayers;
    });
}

