/**
 * Creates a terrrain provider with the cesiumTerrainProviderOptions, if not exists.
 * @param {Object} rawLayer  attributes of the layer
 * @param {string} [rawLayer.url] - the URL of the Cesium terrain server
 * @param {string} [rawLayer.cesiumTerrainProviderOptions] - see https://cesiumjs.org/Cesium/Build/Documentation/CesiumTerrainProvider.html
 * @returns {void}
 */
function createTerrainProvider (rawLayer) {
    const options = {};

    if (rawLayer.cesiumTerrainProviderOptions) {
        Object.assign(options, rawLayer.cesiumTerrainProviderOptions);
    }
    options.url = rawLayer.url;
    /* eslint-disable no-undef */
    return new Cesium.CesiumTerrainProvider(options);
}

/**
 * Sets the layers visibility by setting the terrain provider at Cesium scene.
 * @param {boolean} value  if true, terrainProvider is set to map and terrain will be visible
 * @param {Object} rawLayer  attributes of the layer
 * @param {string} [rawLayer.url] - the URL of the Cesium terrain server
 * @param {string} [rawLayer.cesiumTerrainProviderOptions] - see https://cesiumjs.org/Cesium/Build/Documentation/CesiumTerrainProvider.html
 * @param {OLCesium} map ol cesium map
 * @returns {void}
 */
export function setVisible (value, rawLayer, map) {
    if (map && typeof map.getCesiumScene === "function") {
        if (value) {
            map.getCesiumScene().terrainProvider = createTerrainProvider(rawLayer);
        }
        else {
            /* eslint-disable no-undef */
            map.getCesiumScene().terrainProvider = new Cesium.EllipsoidTerrainProvider({});
        }
    }
}

/**
 * Creates an terrain layer to use in ol-Cesium map.
 * @param {Object} rawLayer - layer specification as in services.json
 * @param {string} [rawLayer.id] - optional id of the layer, passed to help identification in services.json
 * @param {string} [rawLayer.url] - the URL of the Cesium terrain server
 * @param {string} [rawLayer.isSelected] - if true, terrain is created and shown
 * @param {string} [rawLayer.cesiumTerrainProviderOptions] - see https://cesiumjs.org/Cesium/Build/Documentation/CesiumTerrainProvider.html
 * @param {OLCesium} map ol cesium map
 * @returns {Object} layer
 */
export function createLayer (rawLayer, map) {
    this.values = {
        name: rawLayer.name,
        id: rawLayer.id,
        typ: rawLayer.typ
    };
    if (rawLayer.isSelected && map && typeof map.getCesiumScene === "function") {
        setVisible(true, rawLayer, map);
    }
    return this;
}
/**
 * Returns the value for the given key of the rawlayer.
 * @param {String} key to get the value for
 * @returns {*} the value to the key
 */
export function get (key) {
    if (!this.values) {
        return undefined;
    }
    return this.values[key];
}

