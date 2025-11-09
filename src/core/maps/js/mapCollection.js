const mapCollection = [];

export default {
    /**
     * Adds a map to the mapCollection.
     * At the moment the architecture only considers one 2D and one 3D map without Ids.
     * @param {module:ol/PluggableMap~PluggableMap} map The map.
     * @param {String} mode The map mode.
     * @returns {void}
     */
    addMap: function (map, mode) {
        map.mode = mode;

        mapCollection.push(map);
    },

    /**
     * Removes all entries from the collection.
     * @returns {void}
     */
    clear: function () {
        mapCollection.length = 0;
    },
    /**
     * Returns the amount of all maps in collection.
     * @returns {Number} the amount of all maps in collection.
     */
    count: function () {
        return mapCollection.length;
    },
    /**
     * Returns true, if mapCollection is empty.
     * @returns {Boolean} true, if mapCollection is empty.
     */
    isEmpty: function () {
        return mapCollection.length === 0;
    },

    /**
     * Gets a map by the given mode.
     * @param {String} mode The map mode.
     * @returns {module:ol/PluggableMap~PluggableMap} The map.
     */
    getMap: function (mode) {
        return mapCollection.find(map => map?.mode === mode);
    },

    /**
     * Gets a mapview of a map by the given mode.
     * @param {String} mode The map mode.
     * @returns {module:ol/PluggableMap~PluggableMap} The mapview.
     */
    getMapView: function (mode) {
        return this.getMap(mode).getView();
    }
};
