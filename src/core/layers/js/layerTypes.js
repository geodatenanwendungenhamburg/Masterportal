/**
 * Return 2D layer types
 * @returns {Array} The 2D layer types as an array.
 */
function getLayerTypes2d () {
    return ["GEOJSON",
        "GROUP",
        "OAF",
        "SENSORTHINGS",
        "STATICIMAGE",
        "VECTORBASE",
        "VECTORTILE",
        "WFS",
        "WMS",
        "WMTS",
        "WMSTIME"];
}

/**
 * Return 3D layer types
 * @returns {Array} The 3D layer types as an array.
 */
function getLayerTypes3d () {
    return ["ENTITIES3D",
        "TERRAIN3D",
        "TILESET3D"];
}

/**
 * Return layer types not visible in 3D.
 * @returns {Array} layer types not visible in 3D.
 */
function getLayerTypesNotVisibleIn3d () {
    return ["VECTORTILE"];
}

export default {
    getLayerTypes2d,
    getLayerTypes3d,
    getLayerTypesNotVisibleIn3d
};
