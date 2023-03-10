
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import * as webgl from "../renderer/webgl";

/**
 * Triggered by Layer to create a layerSource
 * @param {Object} attrs  attributes of the layer
 * @returns {void}
 */
export function createLayerSource (attrs) {
    const source = new VectorSource({
        features: attrs.features
    });

    // perform necessary feature operations if renderer is webgl
    if (attrs.renderer === "webgl") {
        webgl.afterLoading(source.getFeatures(), attrs.styleId, attrs.excludeTypesFromParsing);
    }

    return source;
}

/**
 * updates the source
 * @param {module:ol/layer/Base~BaseLayer} layer The vector base layer that is to be updated.
 * @param {module:ol/Feature~Feature[]} features The ol features.
 * @returns {void}
 */
export function updateSource (layer, features) {
    // perform necessary feature operations if renderer is webgl
    if (layer.get("renderer") === "webgl") {
        webgl.afterLoading(features, layer.get("styleId"), layer.get("excludeTypesFromParsing"));
    }

    layer.getSource().clear(true);
    layer.getSource().addFeatures(features);
}

/**
 * creates an vector Base
 * @param {Object} attrs  attributes of the layer
 * @returns {Object} layer
 */
export function createLayer (attrs) {
    const source = this.createLayerSource(attrs);

    if (attrs.renderer === "webgl") {
        return webgl.createLayer({
            ...attrs,
            source
        });
    }
    return new VectorLayer({
        source: source,
        name: attrs.name,
        typ: attrs.typ,
        gfiAttributes: attrs.gfiAttributes,
        id: attrs.id
    });
}
