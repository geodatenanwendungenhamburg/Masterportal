const actions = {
    /**
     * Tool: Reset Camera - Reset camera position to initial cameraSettings values from sceneConfig.
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    reset ({rootGetters}) {
        const
            xeokitViewer = rootGetters["Modules/BimViewer/xeokitViewer"],
            sceneConfig = rootGetters["Modules/BimViewer/sceneConfigSelected"],
            scene = xeokitViewer.scene;

        // re-enable all scene items which are not visible
        if (scene.objects) {
            const objIDs = [];

            Object.keys(scene.objects).forEach(entity => {
                objIDs.push(entity);
            });

            scene.setObjectsVisible(objIDs, true);
        }

        scene.camera.eye = sceneConfig.cameraSettings?.eye;
        scene.camera.look = sceneConfig.cameraSettings?.look;
        scene.camera.up = sceneConfig.cameraSettings?.up;

        xeokitViewer.cameraFlight.jumpTo({
            aabb: scene.getAABB(scene.visibleObjectIds)
        });
    }
};

export default actions;
