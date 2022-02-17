import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import OpenLayersTileGrid from "ol/tilegrid/TileGrid";
import { extentFromProjection } from "ol/tilegrid";
import stylefunction from "ol-mapbox-style/dist/stylefunction";

import defaults from "../defaults";

/**
 * Layer specification as in services.json.
 * 
 * @typedef {Object} rawLayer
 * required api
 * @property {string} id => yes
 * @property {string} name => yes
 * @property {string} url => yes
 * optional api
 * @property {string}      epsg => no
 * @property {number[4]}   extent => no
 * @property {string}      layerAttribution => no
 * @property {number}      maxZoom => no
 * @property {number}      minZoom => no
 * @property {number[2]}   origin => no
 * @property {number[2][]} origins => no
 * @property {number[]}    resolutions => no
 * @property {number}      tileSize => no
 * @property {number}      transparency => no
 * @property {VTStyle[]}   vtStyles => no
 * @property {number}      zDirection => no
 * required mp
 * @property {string} typ => yes
 * @property {string|Object} gfiAttributes => yes
 * @property {string} maxScale => yes
 * @property {string} minScale => yes
 * @property {string|object} gfiTheme => yes
 * optional mp
 * @property {Object|boolean} datasets => no
 * @property {boolean} visibility => no
 * @property {boolean} useProxy => no
 */

/**
 * @typedef {Object} VTStyle
 * @param {string} id 
 * @param {string} name
 * @param {string} url
 * @param {boolean} defaultStyle 
 * @returns 
 */

/**
 * Creates a Vector Tiles layer.
 * @param {object} rawLayer - rawLayer as specified in services.json
 * @param {object} [layerParams={}] - extra params of the layer
 * @param {object} [options={}] - parameter object
 * @returns {ol.layer.VectorTile} Layer with id and source specified in rawLayer
 */
 export function createLayer ({id, name, url, extent, maxZoom, minZoom, 
                                          origin, origins, resolutions, tileSize, vtStyles, 
                                          epsg=defaults.epsg, layerAttribution="nicht vorhanden", 
                                          transparency=0, zDirection=1}, 
                              {layerParams = {}, options = {}} = {}) {
  const source = createLayerSource(url, {epsg, tileSize, zDirection, minZoom, maxZoom, extent, resolutions, origin, origins});
  const layer = new VectorTileLayer({id: id, name: name, transparency: transparency/100, 
                                     minZoom: minZoom, maxZoom: maxZoom, source: source, });
  return layer;
}

export function createLayerSource(url, {epsg=defaults.epsg, tileSize=512, zDirection=1, 
                                        minZoom=undefined, maxZoom=22, extent=undefined, 
                                        resolutions=undefined, origin=undefined, origins=undefined}) {
  // const epsg = params.epsg || defaults.epsg;
  const sourceParams = {
    projection: epsg,
    format: new MVT(),
    url: url,
    tileSize: tileSize,
    zDirection: zDirection,
    minZoom: minZoom,
    maxZoom: maxZoom
  }

  if(epsg !== "EPSG:3857") {
    sourceParams.tileGrid = createTileGrid({
      epsg: epsg, 
      extent: extent, 
      resolutions: resolutions, 
      tileSize: tileSize, 
      minZoom: minZoom,
      origin: origin,
      origins: origins
    })
  }

  return new VectorTileSource(sourceParams);
}

export function createTileGrid({epsg=defaults.epsg, extent=extentFromProjection(epsg), 
                                tileSize=256, resolutions=defaults.options.map(x => x.resolution), 
                                origin=[extent[0], extent[3]], origins=undefined, minZoom=undefined}) {

  const tileGridParams = {
    extent: extent,
    resolutions: resolutions,
    tileSize: new Array(2).fill(tileSize),
    minZoom: minZoom
  };

  if(origins) {
    tileGridParams.origins = origins;
  } else {
    tileGridParams.origin = origin;
  }

  return new OpenLayersTileGrid(tileGridParams);
}

export function setStyle(layer, glStyle, {sourceId=Object.keys(glStyle.sources)[0], spriteData, spriteImageUrl, addMpFonts}={}) {
  stylefunction(layer, glStyle, sourceId, layer.getSource().getTileGrid().getResolutions());
}