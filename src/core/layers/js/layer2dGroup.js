import {Group as LayerGroup} from "ol/layer.js";
import Layer2d from "./layer2d.js";

/**
 * Creates a 2d layer group.
 * @name Layer2dGroup
 * @abstract
 * @constructs
 * @extends Layer2d
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
export default function Layer2dGroup (attributes, factory) {
    const defaultAttributes = {
    };

    this.attributes = Object.assign(defaultAttributes, attributes);
    this.layerFactory = factory;
    if (!Array.isArray(attributes.children)) {
        console.warn("Wrong configuration for Grouplayer: children are missing.", attributes);
    }
    else {
        Layer2d.call(this, this.attributes);
    }
}

Layer2dGroup.prototype = Object.create(Layer2d.prototype);

/**
 * Creates a layer of type GROUP.
 * Sets all needed attributes at the layer and the layer source.
 * Grouped layers are stored in layerSource.
 * Child layers will retrieve the visibility of the paren. They will
 * also inherit the parents autoRefresh value, given that it is set on
 * the parent and not set on the child. The autoRefresh configuration
 * of a child takes higher precedence.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer2dGroup.prototype.createLayer = function (attributes) {
    const olLayers = [],
        sourceLayers = [],
        opacity = !isNaN(attributes.transparency) ? (100 - attributes.transparency) / 100 : 1;
    let groupLayer = null;

    attributes.children.forEach(rawLayer => {
        const childHasAutoRefresh = rawLayer.autoRefresh !== undefined && rawLayer.autoRefresh !== null,
            parentHasAutoRefresh = attributes.autoRefresh !== undefined && attributes.autoRefresh !== null,
            childProps = {
                ...rawLayer,
                autoRefresh: !childHasAutoRefresh && parentHasAutoRefresh ? attributes.autoRefresh : rawLayer.autoRefresh,
                visibility: attributes.visibility
            },
            layer = this.layerFactory.createLayer(childProps, "2D");

        olLayers.push(layer.getLayer());
        sourceLayers.push(layer);
    });
    groupLayer = new LayerGroup({layers: olLayers, zIndex: attributes.zIndex, opacity: opacity});
    groupLayer.getSource = () => {
        return sourceLayers;
    };

    this.setLayer(groupLayer);
};

/**
 * Updates the layer values of the Layer2dGroup.
 * Passes the visibility of the group to its children.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer2dGroup.prototype.updateLayerValues = function (attributes) {
    Layer2d.prototype.updateLayerValues.call(this, attributes);

    this.getLayerSource().forEach(l => {
        const childProps = {
            ...l.attributes,
            visibility: attributes.visibility
        };

        l.updateLayerValues(childProps);
    });
};

/**
 * No-op
 * The group itself does not control any autoRefreshing.
 * Instead, we let the actual layers handle their refreshing
 * themselves. We only pass the visibility and (if unset)
 * the autoRefresh config from the group to its child layers.
 */
Layer2dGroup.prototype.controlAutoRefresh = function () {
    // no-op
};

/**
 * No-op
 * The group itself does not start any autoRefreshing.
 * Instead, we let the actual layers handle their refreshing
 * themselves. We only pass the visibility and (if unset)
 * the autoRefresh config from the group to its child layers.
 */
Layer2dGroup.prototype.startAutoRefresh = function () {
    // no-op
};

/**
 * No-op
 * The group itself does not stop any autoRefreshing.
 * Instead, we let the actual layers handle their refreshing
 * themselves. We only pass the visibility and (if unset)
 * the autoRefresh config from the group to its child layers.
 */
Layer2dGroup.prototype.stopAutoRefresh = function () {
    // no-op
};

/**
 * Setter for ol layer source. Sets this grouped layers as layerSource.
 * @returns {void}
 */
Layer2dGroup.prototype.setLayerSource = function () {
    this.layerSource = this.getLayer().getSource();
};
/**
 * Getter for ol layer source. Returns an array with the grouped layers.
 * @returns {Array} an array with the grouped layers.
 */
Layer2dGroup.prototype.getLayerSource = function () {
    return this.layerSource;
};
/**
 * Calls super.addErrorListener for each grouped layer.
 * Adds listener on 'featuresloaderror', 'tileloaderror' and 'imageloaderror' at layer source.
 * @returns {void}
 */
Layer2dGroup.prototype.addErrorListener = function () {
    this.layerSource.forEach(sourceLayer => {
        Layer2d.prototype.addErrorListener.call(sourceLayer.getLayerSource());
    });
};

