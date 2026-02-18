import crs from "@masterportal/masterportalapi/src/crs.js";

/**
 * Returns the pixel in 3D map, calculated by the given coordinates.
 * Works with old and new Cesium versions.
 * @param {Array} clickCoordinates the clicked coordinates
 * @returns {Array} the pixel in 3D map.
 */
function coordToPixel3D (clickCoordinates) {
    const scene = mapCollection.getMap("3D").getCesiumScene();

    const coordWGS84 = crs.transform(
        crs.getMapProjection(mapCollection.getMap("2D")),
        "EPSG:4326",
        clickCoordinates
    );

    const fromDegrees = Cesium.Cartesian3.fromDegrees(
        coordWGS84[0],
        coordWGS84[1],
        coordWGS84[2] || 0
    );

    let windowCoord;

    if (Cesium.SceneTransforms.worldToWindowCoordinates) {
        // Cesium >= 1.105
        windowCoord = Cesium.SceneTransforms.worldToWindowCoordinates(scene, fromDegrees);
    }
    else {
        // Cesium <= 1.104
        windowCoord = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, fromDegrees);
    }

    if (!windowCoord) {
        return null;
    }

    return [
        Math.round(windowCoord.x),
        Math.round(windowCoord.y)
    ];
}

export default {
    coordToPixel3D
};
