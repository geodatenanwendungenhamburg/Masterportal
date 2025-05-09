const actions = {
    /**
     * Initializes the picking event to highlight a picked object and to show
     * details/information right after at the right sidebar
     *
     * @param {Object} store getters object.
     * @returns {void}
     */
    initialize ({commit, dispatch, getters, rootGetters}) {
        const
            viewer = rootGetters["Modules/BimViewer/xeokitViewer"],
            scene = viewer.scene,
            treeView = rootGetters["Modules/BimViewer/xeokitPluginTreeView"];

        viewer.cameraControl.on("picked", (event) => {
            if (getters.modeObjectInfoActive === false) {
                return;
            }

            if (event?.entity?.id !== undefined && event.entity.id !== null) {
                // Reset visibility and xRayed settings
                dispatch("Modules/BimViewer/resetLoadedModelExtraSettings", {}, {root: true});

                scene.setObjectsSelected(scene.objectIds, false);
                scene.setObjectsXRayed(scene.objectIds, false);

                if (event.entity.id !== rootGetters["Modules/BimViewer/ToolObjectInfo/pickedObjectId"]) {
                    // Reset all objects of the current scene
                    scene.setObjectsVisible(scene.objectIds, true);
                    scene.setObjectsXRayed(scene.objectIds, true);

                    // Set only the selected object
                    scene.setObjectsXRayed([event.entity.id], false);
                    scene.setObjectsSelected([event.entity.id], true);

                    commit("setPickedObjectId", event.entity.id);
                    commit("setModeObjectInfoPickedObjects", Object.values(scene.selectedObjects));
                    commit("Modules/BimViewer/setToggleRightSidebar", true, {root: true});

                    treeView.showNode(String(event.entity.id));
                }
                else {
                    commit("setPickedObjectId", "");
                    commit("setModeObjectInfoPickedObjects", []);
                    commit("Modules/BimViewer/setToggleRightSidebar", false, {root: true});

                    treeView.unShowNode();
                }
            }
        });
    },
    /**
     * Switch picking mode of and un-select highlighted object
     *
     * @param {Object} store getters object.
     * @param {Boolean} closeSidebar Close the sidebar or not
     * @returns {void}
     */
    reset ({rootGetters, commit}, closeSidebar = true) {
        const
            scene = rootGetters["Modules/BimViewer/xeokitViewer"].scene,
            treeView = rootGetters["Modules/BimViewer/xeokitPluginTreeView"];

        scene.setObjectsXRayed(scene.objectIds, false);
        scene.setObjectsSelected(scene.objectIds, false);

        commit("setPickedObjectId", "");

        if (closeSidebar) {
            commit("setModeObjectInfoActive", false);
            commit("Modules/BimViewer/setToggleRightSidebar", false, {root: true});
        }

        treeView.unShowNode();
    }
};

export default actions;
