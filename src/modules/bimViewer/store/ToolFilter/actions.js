const actions = {
    /**
     * Filter IFC metaObjects by property value
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {filterText}
     * @returns {Promise<array>} Promise
     */
    filterIfcMetaObjects ({rootGetters}, payload) {
        const
            metaObjects = rootGetters["Modules/BimViewer/xeokitIfcViewer"].metaScene.metaObjects,
            matchedObjects = [];

        // Find all matching objects
        for (const objectId in metaObjects) {
            const metaObject = metaObjects[objectId];

            metaObject?.propertySets.forEach((propertySet) => {
                propertySet?.properties.forEach((property) => {
                    if (String(property.value).toLowerCase().includes(payload.filterText.toLowerCase())) {
                        matchedObjects.push(objectId);
                    }
                });
            });

            // Try to apply the filter to the full metaObject too
            if (String(metaObject.name).toLowerCase().includes(payload.filterText.toLowerCase())) {
                matchedObjects.push(objectId);
            }
        }

        return new Promise((resolve) => {
            resolve(matchedObjects);
        });
    },
    /**
     * Set highlighting
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {matchedObjects}
     * @returns {void}
     */
    setHighlighting ({rootGetters}, payload) {
        const
            xeokitIfcViewer = rootGetters["Modules/BimViewer/xeokitIfcViewer"],
            scene = xeokitIfcViewer.scene;

        // Make all objects semi transparent and remove previous highlighting
        scene.setObjectsOpacity(scene.objectIds, 0.3);
        scene.setObjectsHighlighted(scene.objectIds, false);

        // Highlight all matched objects
        scene.setObjectsOpacity(payload.matchedObjects, 1.0);
        scene.setObjectsHighlighted(payload.matchedObjects, true);

        // Set highlight color
        scene.highlightMaterial.fillColor = [0.1, 0.8, 0.8];
        scene.highlightMaterial.fillAlpha = 1;

        xeokitIfcViewer.cameraFlight.jumpTo({
            aabb: scene.getAABB(payload.matchedObjects)
        });
    },
    /**
     * Reset highlighting
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    resetHighlighting ({rootGetters}) {
        const scene = rootGetters["Modules/BimViewer/xeokitIfcViewer"].scene;

        scene.setObjectsOpacity(scene.objectIds, 1.0);
        scene.setObjectsHighlighted(scene.objectIds, false);
    }
};

export default actions;
