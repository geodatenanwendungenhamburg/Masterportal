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

        // Handle click on node in TreeView, if object info is active.
        viewer.cameraControl.on("picked", (event) => {
            if (getters.modeObjectInfoActive === false) {
                return;
            }

            if (event?.entity?.id !== undefined && event.entity.id !== null) {
                scene.setObjectsSelected(scene.objectIds, false);
                scene.setObjectsXRayed(scene.objectIds, false);

                const parentID = rootGetters["Modules/BimViewer/relAggregatesMap"][event.entity.id];

                dispatch("Modules/BimViewer/getObjectDataForId", {objectId: parentID}, {root: true}).then(parent => {
                    const childrenIDs = parent ? parent?.children.map(child => {
                            return child.id;
                        }) : [event.entity.id],
                        pickedId = parent ? parent.id : event.entity.id;

                    if (event.entity.id !== rootGetters["Modules/BimViewer/ToolObjectInfo/pickedObjectId"]) {
                        // Reset all objects of the current scene
                        scene.setObjectsXRayed(scene.objectIds, true);

                        // Set only the selected object
                        scene.setObjectsXRayed(childrenIDs, false);
                        scene.setObjectsSelected(childrenIDs, true);

                        commit("setPickedObjectId", pickedId);
                        commit("setModeObjectInfoPickedObjects", Object.values(scene.selectedObjects));
                        commit("Modules/BimViewer/setToggleRightSidebar", true, {root: true});

                        treeView.showNode(String(pickedId));
                    }
                    else {
                        commit("setPickedObjectId", "");
                        commit("setModeObjectInfoPickedObjects", []);
                        commit("Modules/BimViewer/setToggleRightSidebar", false, {root: true});

                        treeView.unShowNode();
                    }

                    // Required to refresh the "object structure" sidebar icons (visible/xRayed)
                    dispatch("Modules/BimViewer/refreshLoadedModelExtraSettings", {}, {root: true});
                });
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
    reset ({rootGetters, commit, dispatch}, closeSidebar = true) {
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

        // Required to refresh the "object structure" sidebar icons (visible/xRayed)
        dispatch("Modules/BimViewer/refreshLoadedModelExtraSettings", {}, {root: true});

        treeView.unShowNode();
    }
};

export default actions;
