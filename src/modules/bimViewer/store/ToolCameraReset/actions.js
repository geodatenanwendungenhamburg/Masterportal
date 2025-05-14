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

        // If there are camera settings, reset camera using these. Otherwise, just fit the object ids.
        if (sceneConfig.cameraSettings !== null) {
            scene.camera.eye = sceneConfig.cameraSettings?.eye;
            scene.camera.look = sceneConfig.cameraSettings?.look;
            scene.camera.up = sceneConfig.cameraSettings?.up;
        }
        else {
            dispatch("Modules/BimViewer/ToolSceneFit/fit", null, {root: true});
        }
    }
};

export default actions;
