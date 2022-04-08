import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import OpenLayersTileGrid from "ol/tilegrid/TileGrid";
import {extentFromProjection} from "ol/tilegrid";

import stylefunction from "ol-mapbox-style/dist/stylefunction";
import {defaultResolutions} from "ol-mapbox-style/dist/util";

import defaults from "../defaults";

const OL_DEFAULT_VECTOR_TILE_GRID_CRS = "EPSG:3857";

/**
 * Used properites of layer specification as in services.json.
 *
 * @typedef {Object} rawLayer
 * @property {string} id - Layer id
 * @property {string} name - Layer name
 * @property {string} url - source url
 * @property {string} [epsg=defaults.epsg] - vector tiles crs
 * @property {number[]} [extent] - extent
 * @property {number} [maxZoom=22] - min zoom level
 * @property {number} [minZoom] - max zoom level
 * @property {function} [olAttribution] - optional function that takes a module:ol/PluggableMap~FrameState and returns a string or an array of strings representing source attributions
 * @property {number[]} [origin] - The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards
 * @property {number[][]} [origins] - Tile grid origins, i.e. where the x and y axes meet ([z, 0, 0]), for each zoom level. If given, the array length should match the length of the resolutions array, i.e. each resolution can have a different origin. Tile coordinates increase left to right and downwards. If not specified, extent or origin must be provided.
 * @property {number[]} [resolutions] - Resolutions. The array index of each resolution needs to match the zoom level. This means that even if a minZoom is configured, the resolutions array will have a length of maxZoom + 1.
 * @property {number} [tileSize=512] - size of a tile in px
 * @property {number} [zDirection=1] - zoom level offset for requested tiles
 */

/**
 * Used properites of layer specification as in services.json.
 *
 * @typedef {Object} tileGridProperties
 * @property {string} [epsg=defaults.epsg] - vector tiles crs
 * @property {number} [tileSize=512] - size of a tile in px
 * @property {number} [zDirection=1] - zoom level offset for requested tiles
 * @property {number} [minZoom] - min zoom level
 * @property {number} [maxZoom=22] - may zoom level
 * @property {number[]} [extent] - extent
 * @property {number[]} [resolutions] - Resolutions. The array index of each resolution needs to match the zoom level. This means that even if a minZoom is configured, the resolutions array will have a length of maxZoom + 1.
 * @property {number[]} [origin] - The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards
 * @property {number[][]} [origins] - Tile grid origins, i.e. where the x and y axes meet ([z, 0, 0]), for each zoom level. If given, the array length should match the length of the resolutions array, i.e. each resolution can have a different origin. Tile coordinates increase left to right and downwards. If not specified, extent or origin must be provided.
 */

/**
 * Create a TileGrid.
 *
 * @param {tileGridProperties} options - options
 * @returns {ol.tilegrid.TileGrid} TileGrid
 */
export function createTileGrid ({epsg = defaults.epsg, extent = extentFromProjection(epsg),
    tileSize = 512, resolutions = defaults.options.map(x => x.resolution),
    origin = [extent[0], extent[3]], origins = undefined, minZoom = undefined}) {

    const tileGridParams = {
        extent: extent,
        resolutions: resolutions,
        tileSize: new Array(2).fill(tileSize),
        minZoom: minZoom
    };

    if (origins) {
        tileGridParams.origins = origins;
    }
    else {
        tileGridParams.origin = origin;
    }
    return new OpenLayersTileGrid(tileGridParams);
}

/**
 * Check if TileGrid must be created.
 *
 * @param {tileGridProperties} options - tile grid parameters
 * @returns {boolean} must create tileGrid
 */
function mustCreateTileGrid ({epsg, extent, tileSize, resolutions, origin, origins, minZoom}) {
    if (![extent, tileSize, resolutions, origin, origins, minZoom].every((x) => typeof x === "undefined")) {
        return true;
    }

    const epsgTest = epsg ? epsg.toUpperCase() : epsg;

    if (epsgTest !== OL_DEFAULT_VECTOR_TILE_GRID_CRS) {
        return true;
    }
    return false;
}

/**
 * Creates a Vector Tiles source.
 *
 * @param {string} url - url to vector tile service
 * @param {Object} [tileGridProperties] - properties for tileGrid
 * @returns {ol.source.VectorTile} Source
 */
export function createLayerSource (url, {epsg = defaults.epsg, tileSize = undefined, zDirection = 1,
    minZoom = undefined, maxZoom = 22, extent = undefined,
    resolutions = undefined, origin = undefined, origins = undefined}) {
    const sourceParams = {
            projection: epsg,
            format: new MVT(),
            url: url,
            tileSize: tileSize,
            zDirection: zDirection,
            minZoom: minZoom,
            maxZoom: maxZoom
        },

        gridParams = {
            epsg: epsg,
            extent: extent,
            resolutions: resolutions,
            tileSize: tileSize,
            minZoom: minZoom,
            origin: origin,
            origins: origins
        };

    if (mustCreateTileGrid(gridParams)) {
        sourceParams.tileGrid = createTileGrid(gridParams);
    }

    return new VectorTileSource(sourceParams);
}

/**
 * Creates a Vector Tiles layer.
 *
 * @param {rawLayer} rawLayer - rawLayer as specified in services.json
 * @param {object} [layerParams={}] - extra params of the layer. Can overwrite or extend all ol layer parameters.
 * @param {object} [options={}] - parameter object. Not used atm.
 * @returns {ol.layer.VectorTile} Layer with id and source specified in rawLayer
 */
export function createLayer ({id, name, url, extent, maxZoom, minZoom,
    origin, origins, resolutions, tileSize, olAttribution,
    epsg = defaults.epsg, zDirection = 1},
{layerParams = {}, options = {}} = {}) {
    if ([id, name, url].some((x) => typeof x === "undefined")) {
        console.error(`Cancelled creation of layer "${id}"(${name}) because of missing required parameters`);
        return undefined;
    }
    const source = createLayerSource(url, {epsg, tileSize, zDirection, minZoom, maxZoom, extent, resolutions, origin, origins}),
        layer = new VectorTileLayer(Object.assign({id: id, name: name, attribution: olAttribution, minZoom: minZoom, maxZoom: maxZoom, source: source,
            declutter: true}, layerParams));

    if (options.style) {
        layer.setStyle(options.style);
    }

    return layer;
}

/**
 * Set a mapbox style
 * @param {ol.layer.VectorTile} layer - layer to style
 * @param {object} glStyle - MapBox style definition
 * @param {string} [sourceId=id from given style] - key from the Mapbox Style object. When a source key is provided, all layers for the specified source will be included in the style function.
 * @param {number[]} [resolutions=default mapbox resolutions] - Resolutions for mapping resolution to zoom level.
 * @param {object} [spriteData] - Sprite data from the url specified in the Mapbox Style object's sprite property. Only required if a sprite property is specified in the Mapbox Style object.
 * @param {string} [spriteImageUrl] - Url to sprite image
 * @param {function} [getFonts] - Function that receives a font stack as arguments, and returns a (modified) font stack that is available. Font names are the names used in the Mapbox Style object. If not provided, the font stack will be used as-is. This function can also be used for loading web fonts.
 * @returns {void}
 */
export function setStyle (layer, glStyle, {sourceId = Object.keys(glStyle.sources)[0],
    resolutions = defaultResolutions,
    spriteData, spriteImageUrl, getFonts} = {}) {
    stylefunction(layer, glStyle, sourceId, resolutions, spriteData, spriteImageUrl, getFonts);
}