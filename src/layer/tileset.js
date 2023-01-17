/**
 * Creates the tileset.
 * @param {Object} rawLayer  attributes of the layer
 * @param {string} [rawLayer.url] - the URL of the Cesium terrain server
 * @param {string} [rawLayer.cesiumTerrainProviderOptions] - see https://cesiumjs.org/Cesium/Build/Documentation/CesiumTerrainProvider.html
 * @returns {Cesium.Cesium3DTileset} the tileset
 */
function createTileSet (rawLayer) {
    const url = rawLayer.url.split("?")[0] + "/tileset.json",
        options = {};

    if (rawLayer.cesium3DTilesetOptions) {
        Object.assign(options, rawLayer.cesium3DTilesetOptions);
    }
    options.url = url;
    return new Cesium.Cesium3DTileset(options);
}

/**
 * Creates an terrain layer to use in ol-Cesium map. Sets the id of the rawlayer to tileset.layerReferenceId.
 * @param {Object} rawLayer - layer specification as in services.json
 * @param {string} [rawLayer.id] - optional id of the layer, passed to help identification in services.json
 * @param {string} [rawLayer.url] - the URL of the Cesium terrain server
 * @param {string} [rawLayer.cesiumTerrainProviderOptions] - see https://cesiumjs.org/Cesium/Build/Documentation/CesiumTerrainProvider.html
 * @returns {void}
 */
export default function Tileset (rawLayer) {
    this.values = {
        name: rawLayer.name,
        id: rawLayer.id,
        typ: rawLayer.typ
    };
    if (Cesium) {
        this.tileset = createTileSet(rawLayer);
        this.tileset.layerReferenceId = rawLayer.id;
    }
}

/**
 * Sets the opacity to the tilset.
 * @param {Numbe} opacity the opacity
 * @returns {void}
 */
Tileset.prototype.setOpacity = function (opacity) {
    let color = "rgba(255, 255, 255, " + opacity + ")";

    if (this.tileset.style !== undefined) {
        const splitValues = this.tileset.style.style.color.split(",");

        if (!splitValues[0].startsWith("rgba") && splitValues[0].startsWith("rgb")) {
            splitValues[0] = splitValues[0].replace("rgb", "rgba");
            splitValues[2] = splitValues[2].split(")")[0];
        }

        splitValues[3] = ` ${opacity})`;
        color = splitValues.toString();
    }

    this.tileset.style = new Cesium.Cesium3DTileStyle({color});
};

/**
 *
 * @param {boolean} value  if true, terrainProvider is set to map and terrain will be visible
 * @param {OLCesium} map ol cesium map
 * @returns {void}
 */
Tileset.prototype.setVisible = function (value, map) {
    if (map && typeof map.getCesiumScene === "function") {
        if (value) {
            if (!map.getCesiumScene().primitives.contains(this.tileset)) {
                map.getCesiumScene().primitives.add(this.tileset);
            }
            this.tileset.show = true;
        }
        else {
            this.tileset.show = false;
        }
    }
};

/**
 * Returns the value for the given key of the rawlayer.
 * @param {String} key to get the value for
 * @returns {*} the value to the key
 */
Tileset.prototype.get = function (key) {
    if (!this.values) {
        return undefined;
    }
    return this.values[key];
};
