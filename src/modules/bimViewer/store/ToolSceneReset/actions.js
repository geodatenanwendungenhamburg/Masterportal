const actions = {
    /**
     * Tool: Reset scene - Reset camera to initial settings, make objects visible and not xRayed.
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    resetScene ({rootGetters, dispatch}) {
        const
            selectedSceneConfig = rootGetters["Modules/BimViewer/sceneConfigSelected"],
            scene = rootGetters["Modules/BimViewer/xeokitViewer"].scene;

        scene.setObjectsVisible(scene.objectIds, true);
        scene.setObjectsXRayed(scene.objectIds, false);

        dispatch("Modules/BimViewer/adjustSceneCamera", {
            cameraSettings: selectedSceneConfig.cameraSettings ?? null
        }, {root: true});

        // Required to refresh the "object structure" sidebar icons (visible/xRayed)
        dispatch("Modules/BimViewer/refreshLoadedModelExtraSettings", {}, {root: true});
    }
};

export default actions;
