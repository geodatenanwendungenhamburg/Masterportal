/**
 * Helper function to find the picked feature by its ID.
 * @param {Cesium.Scene} scene The Cesium scene.
 * @param {string} featureId The ID of the feature to find.
 * @returns {Promise<Cesium.Feature|null>} The picked feature or null if not found.
 */
async function find3DPickedFeature (scene, featureId) {
    return new Promise((resolve) => {
        const tilesetList = scene._primitives._primitives.filter(p => p instanceof Cesium.Cesium3DTileset);

        for (const tileset of tilesetList) {
            for (const tile of tileset._selectedTiles) {
                const content = tile._content;

                if (!content) {
                    continue;
                }

                for (let i = 0; i < content.featuresLength; i++) {
                    const feature = content.getFeature(i);

                    if (feature?.getProperty("id") === featureId) {
                        resolve(feature);
                        return;
                    }
                }
            }
        }

        resolve(null);
    });
}

export default {
    find3DPickedFeature
};
