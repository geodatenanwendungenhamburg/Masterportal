const actions = {
    /**
     * Tool: Reset Camera - Reset camera position to initial cameraSettings values from sceneConfig.
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    reset ({rootGetters, dispatch}) {
        const
            xeokitViewer = rootGetters["Modules/BimViewer/xeokitViewer"],
            sceneConfig = rootGetters["Modules/BimViewer/sceneConfigSelected"],
            scene = xeokitViewer.scene;

        scene.setObjectsVisible(scene.objectIds, true);
        scene.setObjectsXRayed(scene.objectIds, false);

        dispatch("Modules/BimViewer/adjustSceneCamera", {
            cameraSettings: sceneConfig.cameraSettings ?? null
        }, {root: true});


        // Required to refresh the "object structure" sidebar icons (visible/xRayed)
        dispatch("Modules/BimViewer/refreshLoadedModelExtraSettings", {}, {root: true});
    }
};

export default actions;
