import defaultStyle from "./styles/defaultStyles";

/**
* styleList that stores all the vector styles contained in style.json.
* Only the styles of the configured layers are kept.
* If a tool has an attribute "styleId", then also this style is kept.
* The styleId can be a string or an array of strings or an array of objects that need to have the attribute "id".
* example "myStyleId", ["myStyleId2", "myStyleId3"], [{"id": "myStyleId4", "name": "I am not relevant for the style"}]
 * @type{Array}
 * @ignore
 */
let styleList,
    configuredLayers,
    configuredTools,
    mapMarkerPointStyleId,
    mapMarkerPolygonStyleId,
    highlightFeaturesPointStyleId,
    highlightFeaturesPolygonStyleId,
    highlightFeaturesLineStyleId,
    styleConf,
    featureViaUrlLayers;

/**
 * Gathers the styleIds of the layers.
 * @returns {Sting[]} - StyleIds from layers.
 */
function getStyleIdsFromLayers () {
    const styleIds = [];

    if (configuredLayers) {
        configuredLayers.forEach(layer => {
            if (layer.typ === "WFS" || layer.typ === "GeoJSON" || layer.typ === "SensorThings" || layer.typ === "TileSet3D") {
                if (layer?.styleId) {
                    styleIds.push(layer.styleId);
                }
            }
            else if (layer.typ === "GROUP") {
                layer.children.forEach(child => {
                    if (child?.styleId) {
                        styleIds.push(child.styleId);
                    }
                });
            }
        });
    }
    return styleIds;
}

/**
 * Gathers the styleIds of the configured tools.
 * @returns {String[]} - StyleIds of Tools
 */
function getStyleIdsFromTools () {
    const styleIds = [];

    if (configuredTools) {
        configuredTools.forEach(tool => {
            if (tool?.styleId) {
                if (Array.isArray(tool.styleId)) {
                    tool.styleId.forEach(styleIdInArray => {
                        if (styleIdInArray instanceof Object) {
                            styleIds.push(styleIdInArray.id);
                        }
                        else {
                            styleIds.push(styleIdInArray);
                        }
                    });
                }
                else {
                    styleIds.push(tool.styleId);
                }
            }
        });
    }
    return styleIds;
}

/**
 * gets style id from MapMarker
 * @returns {String} - Style id of mapMarker.
 */
function getStyleIdForMapMarkerPoint () {
    let styleId;

    if (mapMarkerPointStyleId) {
        styleId = mapMarkerPointStyleId;
    }
    return styleId;
}

/**
 * gets style id from HighlightFeatures
 * @returns {String} - Style id of highlightFeatures.
 */
function getStyleIdForHighlightFeaturesPoint () {
    let styleId;

    if (highlightFeaturesPointStyleId) {
        styleId = highlightFeaturesPointStyleId;
    }
    else {
        styleId = "defaultHighlightFeaturesPoint";
    }
    return styleId;
}

/**
 * gets style id from HighlightFeatures
 * @returns {String} - Style id of highlightFeatures.
 */
function getStyleIdForHighlightFeaturesLine () {
    let styleId;

    if (highlightFeaturesLineStyleId) {
        styleId = highlightFeaturesLineStyleId;
    }
    else {
        styleId = "defaultHighlightFeaturesLine";
    }
    return styleId;
}

/**
 * gets style id from MapMarker
 * @returns {String} - Style id of mapMarker.
 */
function getStyleIdForMapMarkerPolygon () {
    let styleId;

    if (mapMarkerPolygonStyleId) {
        styleId = mapMarkerPolygonStyleId;
    }
    return styleId;
}

/**
 * gets style id from HighlightFeatures
 * @returns {String} - Style id of highlightFeatures.
 */
function getStyleIdForHighlightFeaturesPolygon () {
    let styleId;

    if (highlightFeaturesPolygonStyleId) {
        styleId = highlightFeaturesPolygonStyleId;
    }
    else {
        styleId = "defaultHighlightFeaturesPolygon";
    }
    return styleId;
}

/**
 * Checks whether the module featureViaURL is activated and retrieves the styleIds.
 * @returns {String[]} Array of styleIds for the layers for the features given via the URL.
 */
function getFeatureViaURLStyles () {
    const styleIds = [];

    if (featureViaUrlLayers !== undefined) {
        featureViaUrlLayers.forEach(layer => {
            styleIds.push(layer.styleId);
        });
    }
    return styleIds;
}

/**
 * overwrite parse function so that only the style objects are saved
 * whose layers are configured in the config.json
 * After that these objects are automatically added to the collection
 * @param  {object[]} data parsed style.json
 * @return {object[]} filtered style.json objects
 */
function parseStyles (data) {
    const dataWithDefaultValue = [...data];
    let styleIds = [],
        filteredData = [];

    dataWithDefaultValue.push({styleId: "default", rules: [{style: {}}]},
        defaultStyle.defaultMapMarkerPoint,
        defaultStyle.defaultMapMarkerPolygon,
        defaultStyle.defaultHighlightFeaturesPoint,
        defaultStyle.defaultHighlightFeaturesPolygon,
        defaultStyle.defaultHighlightFeaturesLine);

    // TODO(roehlipa): Funktionen liefern nur bedingt etwas zurück (wenn eine lokale Variable existiert)
    //  ==> Es kann sich mMn der gesamte Funktionsaufruf gespart werden, indem man in dieser Funktion eine vorangehende if-Abfrage macht
    styleIds.push(getStyleIdsFromLayers(),
        getStyleIdForMapMarkerPoint(),
        getStyleIdForMapMarkerPolygon(),
        getStyleIdForHighlightFeaturesPoint(),
        getStyleIdForHighlightFeaturesPolygon(),
        getStyleIdForHighlightFeaturesLine(),
        getStyleIdsFromTools(),
        getFeatureViaURLStyles());

    styleIds = styleIds.reduce((acc, val) => acc.concat(val), []);
    filteredData = dataWithDefaultValue.filter(styleObject => styleIds.includes(styleObject.styleId));

    return filteredData;
}

/**
 * Initializes the style list with fetching the services.json.
 * [styleConf="https://geoportal-hamburg.de/lgv-config/style_v3.json"] - the URL to fetch the services from.
 * TODO(roehlipa): Keiner der Parameter wird innerhalb der Funktion tatsächlich als optional behandelt
 * @param {object} [styleGetters] - object with the needed getters from vue store
 * @param {object} [Config] - the Config.js object
 * @param {array} [layers] - an array with the configured layers
 * @param {array} [tools] - an array with the configured tools
 * @param {function} [callback] - called with services after loaded; called with false and error on error
 * @returns {undefined} nothing, add callback to receive styleList
 */
export function initializeStyleList (styleGetters, Config, layers, tools, callback) {
    configuredLayers = layers;
    configuredTools = tools;

    mapMarkerPointStyleId = styleGetters.mapMarkerPointStyleId;
    mapMarkerPolygonStyleId = styleGetters.mapMarkerPolygonStyleId;
    highlightFeaturesPointStyleId = styleGetters.highlightFeaturesPointStyleId;
    highlightFeaturesPolygonStyleId = styleGetters.highlightFeaturesPolygonStyleId;
    highlightFeaturesLineStyleId = styleGetters.highlightFeaturesLineStyleId;

    styleConf = Config.styleConf;
    featureViaUrlLayers = Config.featureViaURL?.layers;

    const xhr = new XMLHttpRequest();

    xhr.open("GET", styleConf, false);
    xhr.onreadystatechange = function (event) {
        const target = event.target,
            status = target.status;
        let data;

        // ok
        if (status === 200) {
            try {
                data = JSON.parse(target.response);
            }
            catch (error) {
                console.error("An error occured when parsing the response after loading '" + styleConf + "':", error);
                return callback(false, error);
            }
            styleList = parseStyles(data);
        }
        // not found
        else if (status === 404) {
            console.error("An error occured when trying to fetch services from '" + styleConf + "':", 404);
            return callback(false, true);
        }
        return callback(styleList);
    };
    xhr.send();
}

/**
 * Returns style object by styleId or by layerId
 * @param {string} layerId layerId
 * @returns {object} style object
 */
export function returnStyleObject (layerId) {
    return styleList.find(styleObject => styleObject.styleId === layerId);
}
