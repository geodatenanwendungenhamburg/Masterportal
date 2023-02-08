import WebGLPointsLayer from "ol/layer/WebGLPoints";
import WebGLVectorLayerRenderer from "ol/renderer/webgl/VectorLayer";
import VectorLayer from "ol/layer/Layer";
import {packColor} from "ol/renderer/webgl/shaders";
import {returnStyleObject} from "../vectorStyle/styleList";
import {getRulesForFeature} from "../vectorStyle/lib/getRuleForIndex";

/**
 * The default style for OpenLayers WebGLPoints class
 * @see https://openlayers.org/en/latest/examples/webgl-points-layer.html
 * @private
 */
const defaultStyle = {
    symbol: {
        symbolType: "circle",
        size: 20,
        color: "#006688",
        rotateWithView: false,
        offset: [0, 0],
        opacity: 0.6
    }
};

/**
 * parses the styling rules for the renderer
 * @static
 * @private
 * @returns {Object} the style options object with conditional functions
 */
export function getRenderFunctions () {
    return {
        /**
         * Used for polygon fills
         * Reads the relevant properties from the Masterportal style object
         * @see https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/style.json.md
         */
        fill: {
            attributes: {
                color: (feature) => {
                    return packColor(feature.styleRule?.style.polygonFillColor || "#006688");
                },
                opacity: (feature) => {
                    return typeof feature.styleRule?.style.polygonFillColor?.[3] === "number" ?
                        feature.styleRule.style.polygonFillColor[3] : 1;
                }
            }
        },
        stroke: {
            /**
             * Used for polygon edges and lineStrings
             * Reads the relevant properties from the Masterportal style object
             * @see https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/style.json.md
             */
            attributes: {
                color: (feature) => {
                    return packColor(feature.styleRule?.style.polygonStrokeColor || "#006688");
                },
                width: (feature) => {
                    return feature.styleRule?.style.polygonStrokeWidth || 1;
                },
                opacity: (feature) => {
                    return typeof feature.styleRule?.style.polygonStrokeColor?.[3] === "number" ?
                        feature.styleRule.style.polygonStrokeColor[3] : 1;
                }
            }
        },
        point: {
            /**
             * As of now, the generic VectorLayerRenderer only supports points rendered as quads
             * available attributes: color, size, opacity
             * Due to that, we use WebGLPoints Layer Class for point geom types
             * Reads the relevant properties from the Masterportal style object
             * @see https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/style.json.md
             */
            attributes: {
                color: (feature) => {
                    return packColor(feature.styleRule?.style.circleFillColor || "#006688");
                },
                size: (feature) => {
                    return feature.styleRule?.style.circleRadius || 20;
                },
                opacity: (feature) => {
                    return typeof feature.styleRule?.style.circleFillColor?.[3] === "number" ?
                        feature.styleRule.style.circleFillColor[3] : 1;
                }
            }
        }
    };
}

/**
 * Creates a layer object to extend from.
 * @augments VectorLayer
 * @private
 * @implements {WebGLVectorLayerRenderer}
 * @param {Object} attrs attributes of the layer
 * @returns {module:ol/layer/Layer} the LocalWebGLLayer with a custom renderer for WebGL styling
 */
export function createVectorLayerRenderer () {
    /**
     * @class LocalWebGLLayer
     * @see https://openlayers.org/en/latest/examples/webgl-vector-layer.html
     * @description the temporary class with a custom renderer to render the vector data with WebGL
     */
    class LocalWebGLLayer extends VectorLayer {
        /**
         * Creates a new renderer that takes the defined style of the new layer as an input
         * @returns {module:ol/renderer/webgl/WebGLVectorLayerRenderer} the custom renderer
         * @experimental
         */
        createRenderer () {
            return new WebGLVectorLayerRenderer(this, getRenderFunctions());
        }
    }

    return LocalWebGLLayer;
}

/**
 * Parses the vectorStyle from style.json to the feature
 * to reduce processing on runtime
 * @private
 * @param {module:ol/Feature} feature - the feature to check
 * @param {module:Backbone/Model} [styleObject] - (optional) the style model from StyleList
 * @returns {void}
 */
export function formatFeatureStyles (feature, styleObject) {
    if (!styleObject) {
        return;
    }

    // extract first matching rule only
    const rule = getRulesForFeature(styleObject, feature)[0];

    // don't set on properties to avoid GFI issues
    // undefined if no match
    feature.styleRule = rule;
}

/**
 * Layouts the geometry coordinates, removes the Z component
 * @deprecated Will be probably removed in release version
 * @private
 * @param {module:ol/Feature} feature - the feature to format
 * @returns {void}
 */
export function formatFeatureGeometry (feature) {
    feature.getGeometry()?.setCoordinates?.(feature.getGeometry().getCoordinates(), "XY");
}

/**
 * Cleans the data by automatically parsing data provided as strings to the accurate data type
 * @todo Extend to Date types
 * @private
 * @param {module:ol/Feature} feature - the feature to format
 * @param {String[]} [excludeTypes=["boolean"]] - types that should not be parsed from strings
 * @returns {void}
 */
export function formatFeatureData (feature, excludeTypes = ["boolean"]) {
    for (const key in feature.getProperties()) {
        const
            valueAsNumber = parseFloat(feature.get(key)),
            valueIsTrue = typeof feature.get(key) === "string" && feature.get(key).toLowerCase() === "true" ? true : undefined,
            valueIsFalse = typeof feature.get(key) === "string" && feature.get(key).toLowerCase() === "false" ? false : undefined;

        if (!isNaN(parseFloat(feature.get(key))) && !excludeTypes.includes("number")) {
            feature.set(key, valueAsNumber);
        }
        if (valueIsTrue === true && !excludeTypes.includes("boolean")) {
            feature.set(key, valueIsTrue);
        }
        if (valueIsFalse === false && !excludeTypes.includes("boolean")) {
            feature.set(key, valueIsFalse);
        }
    }
}

/**
 * feature transformations called after loading
 * called by the layer source loader, binds the instance of the layer model
 * should be called on each source refresh
 * @param {module:ol/Feature[]} features - the features loaded by the layer
 * @param {String} styleId - The layer's styleId
 * @param {String[]} excludeTypesFromParsing - types that should not be parsed from strings, only necessary for webgl
 * @returns {void}
 */
export function afterLoading (features, styleId, excludeTypesFromParsing) {
    const styleObject = returnStyleObject(styleId); // load styleModel to extract rules per feature

    if (Array.isArray(features)) {
        features.forEach(feature => {
            formatFeatureGeometry(feature); /** @deprecated will propbably not be necessary anymore in release version */
            formatFeatureStyles(feature, styleObject); /** @todo needs refactoring in release version  */
            formatFeatureData(feature, excludeTypesFromParsing); /** Necessary since the WebGLPoints Style Syntax depends on data types (i.e. numbers not as strings) */
        });
    }
}


/**
 * Creates the OL Layer instance, used to rebuild the layer when shown again after layer has been disposed
 * @param {Object} attrs - the attributes of the layer
 * @public
 * @returns {VectorLayer | WebGLPointsLayer} returns the layer instance
 */
export function createLayer (attrs) {
    let LayerConstructor = WebGLPointsLayer;
    const options = {
        id: attrs.id,
        source: attrs.source,
        disableHitDetection: false,
        name: attrs.name,
        typ: attrs.typ,
        gfiAttributes: attrs.gfiAttributes,
        gfiTheme: attrs.gfiTheme,
        hitTolerance: attrs.hitTolerance || 10,
        opacity: attrs.transparency ? (100 - attrs.transparency) / 100 : attrs.opacity,
        renderer: "webgl",
        styleId: attrs.styleId,
        excludeTypesFromParsing: attrs.excludeTypesFromParsing
    };

    /**
     * If the layer consists only of points, use WebGLPointsLayer
     * For advanced styling options
     * @see https://openlayers.org/en/latest/examples/webgl-points-layer.html
    */
    if (attrs.isPointLayer) {
        /**
         * @deprecated
         * @todo will be replaced in the next OL release and incorporated in the WebGLVectorLayerRenderer
         */
        return new LayerConstructor({
            style: attrs.style || defaultStyle,
            disableHitDetection: false,
            ...options,
            isPointLayer: true
        });
    }

    /**
     * use ol/renderer/webgl/WebGLVectorLayerRenderer if not point layer
     * Point styling as quads only
     */
    LayerConstructor = createVectorLayerRenderer(attrs);
    return new LayerConstructor({
        ...options,
        isPointLayer: false
    });
}
