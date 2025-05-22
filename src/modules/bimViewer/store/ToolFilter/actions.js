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
            metaObjects = rootGetters["Modules/BimViewer/xeokitViewer"].metaScene.metaObjects,
            matchedObjects = [];

        // Find all matching objects
        for (const objectId in metaObjects) {
            const metaObject = metaObjects[objectId],
                searchArray = [
                    metaObject.name,
                    metaObject.type,
                    metaObject.id,
                    metaObject.storey,
                    metaObject.metaModels[0].schema,
                    metaObject.metaModels[0].createdAt,
                    metaObject.metaModels[0].author,
                    metaObject.metaModels[0].id
                ];

            metaObject?.propertySets.forEach((propertySet) => {
                propertySet?.properties.forEach((property) => {
                    if (String(property.value).toLowerCase().includes(payload.filterText.toLowerCase())) {
                        matchedObjects.push(objectId);
                    }
                });
            });

            searchArray?.forEach((searchString) => {
                if (String(searchString).toLowerCase().includes(payload.filterText.toLowerCase())) {
                    matchedObjects.push(objectId);
                }
            });
        }

        return new Promise((resolve) => {
            resolve([...new Set(matchedObjects)]);
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
            xeokitViewer = rootGetters["Modules/BimViewer/xeokitViewer"],
            scene = xeokitViewer.scene;

        // Make all objects semi transparent and remove previous highlighting
        scene.setObjectsOpacity(scene.objectIds, 0.3);
        scene.setObjectsHighlighted(scene.objectIds, false);

        // Highlight all matched objects
        scene.setObjectsOpacity(payload.matchedObjects, 1.0);
        scene.setObjectsHighlighted(payload.matchedObjects, true);

        // Set highlight color
        scene.highlightMaterial.fillColor = [0.1, 0.8, 0.8];
        scene.highlightMaterial.fillAlpha = 1;

        xeokitViewer.cameraFlight.flyTo({
            aabb: scene.getAABB(payload.matchedObjects),
            duration: 0.5
        });
    },
    /**
     * Reset highlighting
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    resetHighlighting ({rootGetters}) {
        const scene = rootGetters["Modules/BimViewer/xeokitViewer"].scene;

        scene.setObjectsOpacity(scene.objectIds, 1.0);
        scene.setObjectsHighlighted(scene.objectIds, false);
    }
};

export default actions;
