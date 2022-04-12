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
 * @property {string} [epsg] - vector tiles crs
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
 * @param {tileGridProperties} [options] - options
 * @returns {ol.tilegrid.TileGrid} TileGrid
 */
export function createTileGrid (options = {}) {

    const epsg = options.epsg ? options.epsg : defaults.epsg,
        extent = options.extent ? options.extent : extentFromProjection(epsg),
        tileSize = options.tileSize ? options.tileSize : 512,
        resolutions = options.resolutions ? options.resolutions : defaults.options.map(x => x.resolution),
        tileGridParams = {
            extent: extent,
            resolutions: resolutions,
            minZoom: options.minZoom,
            tileSize: new Array(2).fill(tileSize)
        };

    if (options.origins) {
        tileGridParams.origins = options.origins;
    }
    else {
        tileGridParams.origin = options.origin ? options.origin : [tileGridParams.extent[0], tileGridParams.extent[3]];
    }

    return new OpenLayersTileGrid(tileGridParams);
}

/**
 * Check if TileGrid must be created.
 *
 * @param {tileGridProperties} options - tile grid parameters
 * @returns {boolean} must create tileGrid
 */
function mustCreateTileGrid (options = {}) {
    const createOptions = [options.extent, options.tileSize, options.resolutions, options.origin, options.origins, options.minZoom],
        epsgTest = options.epsg ? options.epsg.toUpperCase() : options.epsg;

    if (!createOptions.every((x) => typeof x === "undefined")) {
        return true;
    }

    if (epsgTest !== OL_DEFAULT_VECTOR_TILE_GRID_CRS) {
        return true;
    }
    return false;
}

/**
 * Creates a Vector Tiles source.
 *
 * @param {string} url - url to vector tile service
 * @param {tileGridProperties} [options] - properties for tileGrid
 * @returns {ol.source.VectorTile} Source
 */
export function createLayerSource (url, options = {}) {
    options.epsg = options.epsg ? options.epsg : defaults.epsg;

    const sourceParams = {
        projection: options.epsg,
        format: new MVT(),
        url: url,
        tileSize: options.tileSize,
        zDirection: options.zDirection,
        minZoom: options.minZoom,
        maxZoom: options.maxZoom
    };

    if (mustCreateTileGrid(options)) {
        sourceParams.tileGrid = createTileGrid(options);
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
export function createLayer (rawLayer = {}, {layerParams = {}, options = {}} = {}) {
    if ([rawLayer.id, rawLayer.name, rawLayer.url].some((x) => typeof x === "undefined")) {
        console.error(`Cancelled creation of layer "${rawLayer.id}"(${rawLayer.name}) because of missing required parameters`);
        return undefined;
    }
    const source = createLayerSource(rawLayer.url, rawLayer),
        layer = new VectorTileLayer(Object.assign({
            id: rawLayer.id, name: rawLayer.name, attribution: rawLayer.olAttribution, extent: source.getTileGrid().getExtent(),
            minZoom: rawLayer.minZoom, maxZoom: rawLayer.maxZoom, source: source,
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