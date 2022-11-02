import {Map} from "ol";
import {DragPan, defaults as olDefaultInteractions} from "ol/interaction.js";
import setBackgroundImage from "../../lib/setBackgroundImage";
import getInitialLayers from "../../lib/getInitialLayers";
import defaults from "../../defaults";
import * as wms from "../../layer/wms";
import * as wmts from "../../layer/wmts";
import * as geojson from "../../layer/geojson";
import * as wfs from "../../layer/wfs";
import * as vectorBase from "../../layer/vectorBase";
import * as vectortile from "../../layer/vectorTile";
import * as oaf from "../../layer/oaf";
import {createMapView} from "../../maps/mapView";
import rawLayerList from "../../rawLayerList";
import crs from "../../crs";
import {setGazetteerUrl} from "../../searchAddress";

let mapIdCounter = 0;

/**
 * lookup for layer constructors
 * @ignore
 */
const layerBuilderMap = {
        wms,
        wmts,
        wfs,
        geojson,
        vectorBase,
        vectortile,
        oaf
    },
    originalAddLayer = Map.prototype.addLayer;

/**
 * Flattens a Layer/LayerGroup to an array of non-group instances.
 * @param {ol/layer/Base} layer any layer, possibly a LayerGroup
 * @returns {ol/layer/Base[]} array of all given layers
 */
function flattenLayerGroups (layer) {
    return layer.getLayers
        ? layer
            .getLayers()
            .getArray()
            .map(l => flattenLayerGroups(l))
            .flat(1)
        : [layer];
}

/**
 * Adds an error handling function to an arbitrary layer. The event will be
 * registered to the tileloaderror, imageloaderror, featuresloaderror, and
 * generic error event. Depending on the type of layer and error, only one of
 * these events will fire.
 * @param {ol/layer/Base} layer Any type of layer implemented.
 * @param {Function} errorCallback Error callback, called from OL event.
 * @returns {void} side-effect to layer
 */
function injectErrorCallback (layer, errorCallback) {
    const layers = flattenLayerGroups(layer);

    layers.forEach(l => {
        const source = l.getSource?.();

        if (source) {
            source.on?.("tileloaderror", errorCallback);
            source.on?.("imageloaderror", errorCallback);
            source.on?.("featuresloaderror", errorCallback);
            source.on?.("error", errorCallback);
        }
        else {
            console.error("Could not register error callback on layer:", l);
        }
    });
}

/**
 * Adds a layer to the map, or adds a layer to the map by id.
 * This id is looked up within the array of all known services.
 *
 * Make sure services have been loaded with a callback on createMap
 * if you request the services from the internet.
 *
 * This function is available on all ol/Map instances.
 * @param {(string|ol/layer/Base)} layerOrId - if of layer to add to map
 * @param {object} [params] - optional parameter object
 * @param {boolean} [params.visibility=true] - whether added layer is initially visible
 * @param {Number} [params.transparency=0] - how visible the layer is initially
 * @param {Function} [params.errorCallback=console.error] - callback for layer source error events
 * @returns {?ol.Layer} added layer
 */
function addLayer (layerOrId, params = {visibility: true, transparency: 0, errorCallback: console.error}) {
    const errorCallback = typeof params.errorCallback === "function"
        ? params.errorCallback
        : console.error;
    let layer, layerBuilder;

    // if parameter is id, create and add layer with masterportalAPI mechanisms
    if (typeof layerOrId === "string") {
        const rawLayer = rawLayerList.getLayerWhere({id: layerOrId});

        if (!rawLayer) {
            console.error("Layer with id '" + layerOrId + "' not found. No layer added to map.");
            return null;
        }
        layerBuilder = layerBuilderMap[rawLayer.typ.toLowerCase()];
        if (!layerBuilder) {
            console.error("Layer with id '" + layerOrId + "' has unknown type '" + rawLayer.typ + "'. No layer added to map.");
            return null;
        }
        layer = layerBuilder.createLayer(rawLayer, {}, {map: this});
        layer.setVisible(typeof params.visibility === "boolean" ? params.visibility : true);
        layer.setOpacity(typeof params.transparency === "number" ? (100 - params.transparency) / 100 : 1);
        injectErrorCallback(layer, errorCallback);
        originalAddLayer.call(this, layer);
        return layer;
    }

    // else use original function
    injectErrorCallback(layerOrId, errorCallback);
    return originalAddLayer.call(this, layerOrId);
}

Map.prototype.addLayer = addLayer;

/**
 * Creates an openlayers map according to configuration. Does not set many default values itself, but uses function that do.
 * Check the called functions for default values, or [the defaults file]{@link ./defaults.js}.
 * @param {object} [config] - configuration object - falls back to defaults if none given
 * @param {string} [config.target="map"] - div id to render map to
 * @param {string} [config.namedProjections] - projections to create the map
 * @param {string} [config.backgroundImage] - background image for map; "" to use none
 * @param {string} [config.epsg] - CRS to use
 * @param {number[]} [config.extent] - extent to use
 * @param {Array.<{resolution: number, scale: number, zoomLevel: number}>} [config.options] - zoom level definition
 * @param {Array.<string[]>} [config.options] - each sub-array has two values: projection name, and projection description
 * @param {number} [config.startResolution] - initial resolution
 * @param {number[]} [config.startCenter] - initial position
 * @param {(string|object)} [config.layerConf] - services registry or URL thereof
 * @param {string} [config.gazetteerUrl] - url of gazetteer to use in searchAddress
 * @param {object}  [settings={}] - setings object
 * @param {object} [settings.mapParams] - additional parameter object that is spread into the ol.Map constructor object
 * @param {function} [settings.callback] - optional callback for layer list loading
 * @param {function} [settings.errorCallback] – method called on error events
 * @param {String} [mapMode = "2D"] The map mode. '2D' to craete a 2D-map and '3D' to create a 3D-map.
 * @returns {object} map object from ol
 */
export function createMap (config = defaults, {mapParams, callback, errorCallback} = {}) {
    crs.registerProjections(config.namedProjections);
    setBackgroundImage(config);
    setGazetteerUrl(config.gazetteerUrl);
    const map = new Map(Object.assign({
        target: config.target || defaults.target,
        interactions: olDefaultInteractions({dragPan: false, altShiftDragRotate: false, pinchRotate: false}).extend([
            new DragPan({
              condition: function (event) {
                return (!event.originalEvent.pointerType || event.originalEvent.pointerType === "mouse") || (config.twoFingerPan && this.getPointerCount() === 2) || !config.twoFingerPan;
              },
            })
        ]),
        controls: [],
        view: createMapView(config)
    }, mapParams));

    map.set("mapMode", "2D");
    map.set("id", `map2D_${mapIdCounter++}`);

    // extend callback to load configured initial layers
    rawLayerList.initializeLayerList(config.layerConf, (param, error) => {
        getInitialLayers(config)
            .forEach(layer => {
                map.addLayer(layer.id, {errorCallback});
            });

        if (typeof callback === "function") {
            return callback(param, error);
        }

        return null;
    });

    return map;
}
