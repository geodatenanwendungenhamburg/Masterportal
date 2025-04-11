const actions = {
    /**
     * Toggle Measurements - Starts/Ends measurements
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {isActive}
     * @returns {void}
     */
    toggle ({rootGetters}, payload) {
        const distanceMeasurementsControl = rootGetters["Modules/BimViewer/xeokitPluginDistanceMeasurementsControl"];

        if (payload.isActive) {
            distanceMeasurementsControl.activate();
        }
        else {
            distanceMeasurementsControl.deactivate();
        }
    },
    /**
     * Clear measurements - Remove all measurements
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    clear ({rootGetters}) {
        rootGetters["Modules/BimViewer/xeokitPluginDistanceMeasurements"].clear();
    }
};

export default actions;
