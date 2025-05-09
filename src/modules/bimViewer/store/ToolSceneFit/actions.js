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

        viewer.cameraFlight.flyTo({
            aabb: scene.getAABB(scene.visibleObjectIds),
            duration: 0.5
        });
    }
};

export default actions;
