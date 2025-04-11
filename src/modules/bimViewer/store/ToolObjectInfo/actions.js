const actions = {
    /**
     * Initializes the picking event to highlight a picked object and to show
     * details/information right after at the right sidebar
     *
     * @param {Object} store getters object.
     * @returns {void}
     */
    initialize ({commit, getters, rootGetters}) {
        const viewer = rootGetters["Modules/BimViewer/xeokitIfcViewer"];

        viewer.cameraControl.on("picked", (event) => {
            // return just here possible, not at function beginning
            if (getters.modeObjectInfoActive === false) {
                return;
            }

            if (event?.entity?.id !== undefined && event.entity.id !== null) {
                getters.modeObjectInfoPickedObjects.push(event.entity);
                getters.modeObjectInfoPickedObjects.forEach((element) => {

                    if (element.id === event.entity.id) {
                        event.entity.selected = true;
                    }
                });

                if (getters.modeObjectInfoPickedObjects.length > 1) {
                    const oldObj = getters.modeObjectInfoPickedObjects.shift();

                    if (oldObj.id !== event.entity.id) {
                        oldObj.selected = false;
                    }
                }

                commit("setPickedObjectId", event.entity.id);
                commit("Modules/BimViewer/setToggleRightSidebar", true, {root: true});
            }
        });
    },
    /**
     * Switch picking mode of and un-select highlighted object
     *
     * @param {Object} store getters object.
     * @returns {void}
     */
    reset ({getters, commit}) {
        commit("setModeObjectInfoActive", false);
        commit("setPickedObjectId", "");

        getters.modeObjectInfoPickedObjects.forEach((element) => {
            element.selected = false;
        });
    }
};

export default actions;
