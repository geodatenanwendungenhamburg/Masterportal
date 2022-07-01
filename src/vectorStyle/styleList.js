import defaultStyle from "./defaultStyle";

/**
* styleList that stores all the vector styles contained in style.json.
* Only the styles of the configured layers are kept.
* If a tool has an attribute "styleId", then also this style is kept.
* The styleId can be a string or an array of strings or an array of objects that need to have the attribute "id".
* example "myStyleId", ["myStyleId2", "myStyleId3"], [{"id": "myStyleId4", "name": "I am not relevant for the style"}]
 * @type{Array}
 * @ignore
 */
const styleList = [];

/**
 * Gets the default style for mapmarker as point.
 * @returns {Object} The default style for mapMarker point Style.
 */
function getMapmarkerPointDefaultStyle () {
    return {
        styleId: "defaultMapMarkerPoint",
        rules: [{
            style:
            {
                type: "icon",
                imageName: "mapMarker.svg",
                imagePath: "../../img/",
                imageScale: 1,
                imageWidth: 34,
                imageHeight: 48,
                imageOffsetY: 46,
                imageOffsetYUnit: "pixels"
            }
        }]
    };
}
/**
 * Gets the default style for mapmarker as polygon.
 * @returns {Object} The default style for mapMarker polygon Style.
 */
function getMapmarkerPolygonDefaultStyle () {
    return {
        styleId: "defaultMapMarkerPolygon",
        rules: [{
            style:
            {
                polygonStrokeColor: [8, 119, 95, 1],
                polygonStrokeWidth: 4,
                polygonFillColor: [8, 119, 95, 0.3],
                polygonStrokeDash: [8]
            }
        }]
    };
}

/**
 * Gets the default style for highlightFeatures as point.
 * @returns {Object} The default style for highlightFeatures point Style.
 */
function getHighlightFeaturesPointDefaultStyle () {
    return {
        styleId: "defaultHighlightFeaturesPoint",
        rules: [{
            style:
            {
                type: "circle",
                circleFillColor: [255, 255, 0, 0.9],
                circleRadius: 8
            }
        }]
    };
}

/**
 * Gets the default style for highlightFeatures as polygon.
 * @returns {Object} The default style for highlightFeatures polygon Style.
 */
function getHighlightFeaturesPolygonDefaultStyle () {
    return {
        styleId: "defaultHighlightFeaturesPolygon",
        rules: [{
            style:
            {
                polygonStrokeColor: [8, 119, 95, 1],
                polygonStrokeWidth: 4,
                polygonFillColor: [8, 119, 95, 0.3],
                polygonStrokeDash: [8]
            }
        }]
    };
}

/**
 * Gets the default style for highlightFeatures as line.
 * @returns {Object} The default style for highlightFeatures line Style.
 */
function getHighlightFeaturesLineDefaultStyle () {
    return {
        styleId: "defaultHighlightFeaturesLine",
        rules: [{
            style:
            {
                polygonStrokeColor: [8, 119, 95, 1],
                polygonStrokeWidth: 4,
                polygonFillColor: [8, 119, 95, 0.3],
                polygonStrokeDash: [8]
            }
        }]
    };
}

/**
 * Gathers the styleIds of the layers.
 * @param {Object[]} layers The configured layers.
 * @returns {Sting[]} - StyleIds from layers.
 */
function getStyleIdsFromLayers (layers) {
    const styleIds = [];

    if (layers) {
        layers.forEach(layer => {
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
 * @param {Object[]} tools The configured tools.
 * @returns {String[]} - StyleIds of Tools
 */
function getStyleIdsFromTools (tools) {
    const styleIds = [];

    if (tools) {
        tools.forEach(tool => {
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
 * @param {String} mapMarkerPointStyleId The styleId from mapMarker store getter.
 * @returns {String} - Style id of mapMarker.
 */
function getStyleIdForMapMarkerPoint (mapMarkerPointStyleId) {
    let styleId;

    if (mapMarkerPointStyleId) {
        styleId = mapMarkerPointStyleId;
    }
    return styleId;
}

/**
 * gets style id from HighlightFeatures
 * @param {String} highlightFeaturesPointStyleId The styleId from highlightFeatures store getter.
 * @returns {String} - Style id of highlightFeatures.
 */
function getStyleIdForHighlightFeaturesPoint (highlightFeaturesPointStyleId) {
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
 * @param {String} highlightFeaturesLineStyleId The styleId from highlightFeatures store getter.
 * @returns {String} - Style id of highlightFeatures.
 */
function getStyleIdForHighlightFeaturesLine (highlightFeaturesLineStyleId) {
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
 * @param {String} mapMarkerPolygonStyleId The styleId from mapMarker store getter.
 * @returns {String} - Style id of mapMarker.
 */
function getStyleIdForMapMarkerPolygon (mapMarkerPolygonStyleId) {
    let styleId;

    if (mapMarkerPolygonStyleId) {
        styleId = mapMarkerPolygonStyleId;
    }
    return styleId;
}

/**
 * gets style id from HighlightFeatures
 * @param {String} highlightFeaturesPolygonStyleId The styleId from highlightFeatures store getter.
 * @returns {String} - Style id of highlightFeatures.
 */
function getStyleIdForHighlightFeaturesPolygon (highlightFeaturesPolygonStyleId) {
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
 * @param {Object} Config Config object from store
 * @returns {String[]} Array of styleIds for the layers for the features given via the URL.
 */
function getFeatureViaURLStyles (Config) {
    const styleIds = [],
        layers = Config?.featureViaURL?.layers;

    if (layers !== undefined) {
        layers.forEach(layer => {
            styleIds.push(layer.styleId);
        });
    }
    return styleIds;
}
/**
 * overwrite parse function so that only the style-models are saved
 * whose layers are configured in the config.json
 * After that these models are automatically added to the collection
 * @param  {object} styleGetters parsed style.json
 * @param  {object} Config parsed style.json
 * @param  {object[]} data parsed style.json
 * @param {array} [layers] - an array with the configured layers
 * @param {array} [tools] - an array with the configured tools
 * @return {object[]} filtered style.json objects
 * @fires Core.ConfigLoader#RadioRequestParserGetItemsByAttributes
 */
function parseStyles (styleGetters, Config, data, layers, tools) {
    const dataWithDefaultValue = [...data];
    let styleIds = [],
        filteredData = [];

    dataWithDefaultValue.push({styleId: "default", rules: [{style: {}}]});
    dataWithDefaultValue.push(getMapmarkerPointDefaultStyle());
    dataWithDefaultValue.push(getMapmarkerPolygonDefaultStyle());
    dataWithDefaultValue.push(getHighlightFeaturesPointDefaultStyle());
    dataWithDefaultValue.push(getHighlightFeaturesPolygonDefaultStyle());
    dataWithDefaultValue.push(getHighlightFeaturesLineDefaultStyle());

    styleIds.push(getStyleIdsFromLayers(layers));
    styleIds.push(getStyleIdForMapMarkerPoint(styleGetters.mapMarkerPointStyleId));
    styleIds.push(getStyleIdForMapMarkerPolygon(styleGetters.mapMarkerPolygonStyleId));
    styleIds.push(getStyleIdForHighlightFeaturesPoint(styleGetters.highlightFeaturesPointStyleId));
    styleIds.push(getStyleIdForHighlightFeaturesPolygon(styleGetters.highlightFeaturesPolygonStyleId));
    styleIds.push(getStyleIdForHighlightFeaturesLine(styleGetters.highlightFeaturesLineStyleId));
    styleIds.push(getStyleIdsFromTools(tools));
    styleIds.push(getFeatureViaURLStyles(Config));

    styleIds = Array.isArray(styleIds) ? styleIds.reduce((acc, val) => acc.concat(val), []) : styleIds;
    filteredData = dataWithDefaultValue.filter(styleModel => styleIds.includes(styleModel.styleId));

    return filteredData;
}
/**
    * Initializes the style list with fetching the services.json.
    * [styleConf="https://geoportal-hamburg.de/lgv-config/style_v3.json"] - the URL to fetch the services from.
    * @param {object} [styleGetters] - object with the needed getters from vue store
    * @param {object} [Config] - the Config.js object
    * @param {array} [layers] - an array with the configured layers
    * @param {array} [tools] - an array with the configured tools
    * @param {function} [callback] - called with services after loaded; called with false and error on error
    * @param {object} [style] - an object with styles
    * @returns {undefined} nothing, add callback to receive styleList
 */
export function initializeStyleList (styleGetters, Config, layers, tools, callback, style = defaultStyle) {
    styleList.push(style);
    const xhr = new XMLHttpRequest();

    xhr.open("GET", Config.styleConf, false);
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
                console.error("An error occured when parsing the response after loading '" + Config.styleConf + "':", error);
                return callback(false, error);
            }
            parseStyles(styleGetters, Config, data, layers, tools);
        }
        // not found
        else if (status === 404) {
            console.error("An error occured when trying to fetch services from '" + Config.styleConf + "':", 404);
            return callback(false, true);
        }
        if (typeof callback === "function") {
            return callback(styleList);
        }
        return true;
    };
    xhr.send();
}