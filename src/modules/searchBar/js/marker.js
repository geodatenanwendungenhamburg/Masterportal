export default {
    /**
     * Checks whether the given coordinate is within a Polygon.
     * @param {Object} feature feature to inspect
     * @param {Array} coordinates coordinates to check
     * @returns {Object|Boolean} - an object with polygonGeometryCoordinates and a boolean if a given coordinate is inside
     */
    checkIsCoordInsidePolygon: function (feature, coordinates) {
        if (feature) {
            return feature.getGeometry().intersectsCoordinate(coordinates);
        }
        return true;
    },
    /**
     * Determines a random coordinate given within a polygon.
     * @param {Array} coordinates the coordinates within a polygon.
     * @returns {Array} a random coordinate
     */
    getRandomCoordinate: function (coordinates) {
        if (Array.isArray(coordinates) && coordinates[coordinates.length - 1]) {
            const randomIndex = Math.floor(Math.random() * coordinates.length);

            return this.getRandomCoordinate(coordinates[randomIndex]);
        }
        return coordinates;
    },

    /**
     * Handels Geometry Collection for setting and showing markers:
     * Returns coordinates for first Point from a GeometryCollection if there is one.
     * @param {Object} feature feature to inspect
     * @param {Array} coordinates coordinates to check
     * @returns {Array} - coordinates from first Point or from hit coordinate
     */
    getFirstPointCoordinates: function (feature, coordinates) {
        const geomCollection = feature.getGeometry(),
            firstPoint = geomCollection.getGeometries().find(geom => geom.getType() === "Point");

        return firstPoint ? firstPoint.getCoordinates() : coordinates;
    },

    /**
     * Checks if a given Array contains valid coordinates and has the right length.
     * Is used to check if a given extent is valid or includes not finite numbers.
     * @param {Array} extent - Array with coordinates of an extent
     * @returns {Boolean} isValid - true if the extent is valid, false if not
     */
    extentIsValid: function (extent) {
        if (extent.length !== 4) {
            return false;
        }
        for (let i = 0; i < extent.length; i++) {
            if (typeof extent[i] !== "number" || !isFinite(extent[i])) {
                return false;
            }
        }
        return true;
    }
};
