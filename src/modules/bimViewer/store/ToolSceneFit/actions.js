const actions = {
    /**
     * Tool: Fit objects in scene - Fit camera position to boundaries of the scene.
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    fit ({rootGetters}) {
        const
            viewer = rootGetters["Modules/BimViewer/xeokitViewer"],
            scene = viewer.scene;

        viewer.cameraFlight.jumpTo({
            aabb: scene.getAABB(scene.visibleObjectIds)
        });
    }
};

export default actions;
