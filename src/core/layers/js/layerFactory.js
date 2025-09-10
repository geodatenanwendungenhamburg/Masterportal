import Layer2dRasterStaticImage from "./layer2dRasterStaticImage.js";
import Layer2dRasterGeoTiff from "./layer2dRasterGeoTiff.js";
import Layer2dRasterWms from "./layer2dRasterWms.js";
import Layer2dRasterWmts from "./layer2dRasterWmts.js";
import Layer2dRasterWmsTime from "./layer2dRasterWmsTime.js";
import Layer2dVector from "./layer2dVector.js";
import Layer2dVectorGeojson from "./layer2dVectorGeojson.js";
import Layer2dVectorOaf from "./layer2dVectorOaf.js";
import Layer2dVectorSensorThings from "./layer2dVectorSensorThings.js";
import Layer2dVectorTile from "./layer2dVectorTile.js";
import Layer2dVectorVectorbase from "./layer2dVectorVectorbase.js";
import Layer2dVectorWfs from "./layer2dVectorWfs.js";
import Layer2dGroup from "./layer2dGroup.js";
import Layer3dEntities from "./layer3dEntities.js";
import Layer3dTerrain from "./layer3dTerrain.js";
import Layer3dTileset from "./layer3dTileset.js";

const layerTypes2d = {
        GEOJSON: Layer2dVectorGeojson,
        GROUP: Layer2dGroup,
        OAF: Layer2dVectorOaf,
        SENSORTHINGS: Layer2dVectorSensorThings,
        STATICIMAGE: Layer2dRasterStaticImage,
        GEOTIFF: Layer2dRasterGeoTiff,
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
 * @returns {Layer} The layer instance.
 */
function createLayer (layerConf, mapMode) {
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
        layer = new layerTypes3d[typ](layerConf);
    }

    return layer;
}

/**
 * Return vector layer types
 * @returns {Array} The vectorLayer types as an array.
 */
function getVectorLayerTypes () {
    const vectorLayerTypes = [];

    Object.keys(layerTypes2d).forEach(layerTyp => {
        if (layerTypes2d[layerTyp].prototype instanceof Layer2dVector) {
            vectorLayerTypes.push(layerTyp);
        }
    });

    return vectorLayerTypes;
}

export default {
    createLayer,
    getVectorLayerTypes
};
