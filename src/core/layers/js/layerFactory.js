import removeHtmlTags from "@shared/js/utils/removeHtmlTags";

/**
 * Dynamic import registry for layers.
 * If not dynamic imports: any code path (including test) causes layerFactory.js to be loaded before e.g. layer2dRaster.js is fully evaluated,
 * a circular dependency is created and test will fail.
 */
const layerTypes2d = {
        GEOJSON: Layer2dVectorGeojson,
        // to circular dependency
        GROUP: Layer2dGroup,
        OAF: Layer2dVectorOaf,
        SENSORTHINGS: Layer2dVectorSensorThings,
        STATICIMAGE: Layer2dRasterStaticImage,
        VECTORBASE: Layer2dVectorVectorbase,
        VECTORTILE: Layer2dVectorTile,
        WFS: Layer2dVectorWfs,
        WMS: Layer2dRasterWms,
        WMTS: Layer2dRasterWmts,
        WMSTIME: Layer2dRasterWmsTime
    },
    layerTypes3d = {
        ENTITIES3D: Layer3dEntities,
        TERRAIN3D: Layer3dTerrain,
        TILESET3D: Layer3dTileset
    };

/**
 * Creates layer instances.
 * @param {Object} layerConf The layer configuration.
 * @param {String} mapMode The current map mode.
 * @returns {Object} The layer instance.
 */
export async function createLayer (layerConf, mapMode) {
    let layer,
        typ;

    if (layerConf?.typ?.toUpperCase() === "WMS" && layerConf?.time) {
        typ = "WMSTIME";
    }
    else {
        typ = layerConf?.typ?.toUpperCase();
    }

    if (layerTypes2d[typ]) {
        layer = new layerTypes2d[typ](layerConf, typ === "GROUP" ? this : undefined);
    }
    else if (mapMode === "3D" && layerTypes3d[typ]) {
        const module = await layerTypes3d[typ]();

        layer = new module.default(layerConf);
    }
    if (layer) {
        const htmlName = layer.attributes.name;

        layer.attributes.htmlName = htmlName;
        layer.attributes.name = removeHtmlTags(htmlName);
    }

    return layer;
}

/**
 * Return vector layer types
 * @returns {Array} The vectorLayer types as an array.
 */
function getVectorLayerTypes () {
    return [
        "GEOJSON",
        "OAF",
        "SENSORTHINGS",
        "VECTORBASE",
        "WFS"
    ];
}

export default {
    createLayer,
    getVectorLayerTypes
};

