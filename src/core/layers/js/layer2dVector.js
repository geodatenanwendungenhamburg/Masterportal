import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import getGeometryTypeFromService from "@masterportal/masterportalapi/src/vectorStyle/lib/getGeometryTypeFromService.js";
import {getCenter} from "ol/extent.js";
import webgl from "./webglRenderer.js";
import store from "@appstore/index.js";
import Layer2d from "./layer2d.js";
import Cluster from "ol/source/Cluster.js";
import Style from "ol/style/Style.js";

/**
 * Creates a 2d vector layer.
 * @name Layer2dVector
 * @abstract
 * @constructs
 * @extends Layer2d
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
export default function Layer2dVector (attributes) {
    const defaultAttributes = {
        altitudeMode: "clampToGround",
        renderer: "default",
        styleId: "default"
    };

    this.isStyling = false;
    this.geometryTypeRequestLayers = [];
    this.attributes = Object.assign(defaultAttributes, attributes);
    Layer2d.call(this, this.attributes);
    // override class methods for webgl rendering
    // has to happen before setStyle
    if (attributes.renderer === "webgl") {
        webgl.setLayerProperties(this);
    }
    this.initStyle(attributes);
}

Layer2dVector.prototype = Object.create(Layer2d.prototype);

/**
 * Sets values to the ol layer.
 * @param {Object} attributes The new attributes.
 * @returns {void}
 */
Layer2dVector.prototype.updateLayerValues = function (attributes) {
    this.getLayer()?.setOpacity((100 - attributes.transparency) / 100);
    this.getLayer()?.setVisible(attributes.visibility);
    this.getLayer()?.setZIndex(attributes.zIndex);
    this.controlAutoRefresh(attributes);

    if (this.get("typ") === "WFS" || this.get("typ") === "OAF" || this.get("typ") === "GeoJSON") {
        if (store.getters["Maps/mode"] === "3D" && this.layerSource.getFeatures().length === 0) {
            this.loadFeaturesManually(attributes);
        }
    }
    if (attributes.fitCapabilitiesExtent && attributes.visibility && !attributes.encompassingBoundingBox) {
        if (!attributes.capabilitiesUrl) {
            console.warn("Please add a capabilitiesUrl for your layer configuration if you want to use fitCapabilitiesExtent!");

        }
        else {
            this.requestCapabilitiesToFitExtent();
            attributes.encompassingBoundingBox = true;
        }
    }
    else if (attributes.fitCapabilitiesExtent && !attributes.visibility && attributes.encompassingBoundingBox) {
        attributes.encompassingBoundingBox = false;
    }
};

/**
 * Gets the cluster feature geometry.
 * Note: Do not cluster invisible features;
 * can't rely on style since it will be null initially.
 * @param {module:ol/Feature~Feature} feature The ol feature.
 * @returns {module:ol/geom/Point~Point} The feature geometry.
 */
Layer2dVector.prototype.clusterGeometryFunction = function (feature) {
    if (feature.get("hideInClustering") === true) {
        return null;
    }

    return feature.getGeometry();
};

/**
 * Returns a function to filter features with.
 * Note: only use features with a geometry.
 * @param {Object} attributes The attributes of the layer configuration.
 * @param {module:ol/Feature~Feature[]} features The ol features.
 * @returns {module:ol/Feature~Feature[]} to filter features with
 */
Layer2dVector.prototype.featuresFilter = function (attributes, features) {
    let filteredFeatures = features.filter(feature => Boolean(feature.getGeometry()));

    if (attributes.bboxGeometry) {
        filteredFeatures = filteredFeatures.filter(
            (feature) => attributes.bboxGeometry.intersectsCoordinate(getCenter(feature.getGeometry().getExtent()))
        );
    }

    return filteredFeatures;
};

/**
 * Gets additional layer params.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {Object} The layer params.
 */
Layer2dVector.prototype.getLayerParams = function (attributes) {
    return {
        altitudeMode: attributes.altitudeMode,
        gfiAttributes: attributes.gfiAttributes,
        gfiTheme: attributes.gfiTheme,
        gfiTitleAttribute: attributes.gfiTitleAttribute,
        name: attributes.name,
        opacity: (100 - attributes.transparency) / 100,
        typ: attributes.typ,
        zIndex: attributes.zIndex,
        renderer: attributes.renderer, // use "default" (canvas) or "webgl" renderer
        styleId: attributes.styleId, // styleId to pass to masterportalapi
        style: attributes.style, // style function to style the layer or WebGLPoints style syntax
        excludeTypesFromParsing: attributes.excludeTypesFromParsing, // types that should not be parsed from strings, only necessary for webgl
        isPointLayer: attributes.isPointLayer, // whether the source will only hold point data, only necessary for webgl
        gfiThemeSettings: attributes.gfiThemeSettings // for accessing additional theme settings
    };
};

/**
 * Gets the loading params.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {Object} The loading Params.
 */
Layer2dVector.prototype.loadingParams = function (attributes) {
    const loadingParams = {
        xhrParameters: attributes.isSecured ? {credentials: "include"} : undefined,
        propertyname: this.propertyNames(attributes) || undefined,
        // only used if loading strategy is all
        bbox: attributes.bboxGeometry ? attributes.bboxGeometry.getExtent().toString() : undefined
    };

    return loadingParams;
};

/**
 * Returns the propertyNames as comma separated string.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {String} The propertynames as string.
 */
Layer2dVector.prototype.propertyNames = function (attributes) {
    let propertyname = "";

    if (Array.isArray(attributes.propertyNames)) {
        propertyname = attributes.propertyNames.join(",");
    }

    return propertyname;
};

/**
 * Print the on loading error message.
 * @param {Error} error The error message.
 * @returns {void}
 */
Layer2dVector.prototype.onLoadingError = function (error) {
    console.error("Masterportal wfs loading error: ", error);
};

/**
 * Setter for style of ol layer.
 * @param {Object} value The style to set at ol layer. If value is null, undefined is set as style at layer to use defaultStyle.
 * @returns {void}
 */
Layer2dVector.prototype.setStyle = function (value) {
    const style = value === null ? undefined : value;

    this.set("style", value);
    this.getLayer()?.setStyle(style);
};

/**
 * Initializes the style for this layer. If styleId is set, this is done after vector styles are loaded.
 * @param {Object} attrs  params of the raw layer
 * @returns {void}
 */
Layer2dVector.prototype.initStyle = async function (attrs) {
    if (store.getters.styleListLoaded) {
        this.createStyle(attrs);
    }
    else {
        store.watch((state, getters) => getters.styleListLoaded, value => {
            if (value) {
                this.createStyle(attrs);
            }
        });
    }
};

/**
 * Creates the style function.
 * @param {Object} attrs  params of the raw layer
 * @returns {void}
 */
Layer2dVector.prototype.createStyle = async function (attrs) {
    const styleId = attrs.styleId,
        styleObject = styleList.returnStyleObject(styleId) ?? await styleList.initStyleAndAddToList(Config, styleId);

    if (styleObject !== undefined) {
        /**
         * Returns style function to style feature.
         * @param {ol.Feature} feature the feature to style
         * @returns {Function} style function to style feature
         */
        const style = (feature) => {
            if (this.isStyling) {
                return new Style();
            }
            this.isStyling = true;
            let styleResult;

            try {
                const feat = feature !== undefined ? feature : this,
                    isClusterFeature = typeof feat.get("features") === "function" || typeof feat.get("features") === "object" && Boolean(feat.get("features").length > 1);

                styleResult = createStyle.createStyle(styleObject, feat, isClusterFeature, Config.wfsImgPath);
            }
            finally {
                this.isStyling = false;
            }
            return styleResult;
        };

        this.setStyle(style);
    }
    else {
        console.warn(i18next.t("common:core.layers.errorHandling.wrongStyleId", {styleId}));
    }
};

/**
 * Returns the style function of this layer to be called with feature.
 * @returns {Object} the style function
 */
Layer2dVector.prototype.getStyleFunction = function () {
    return this.get("style");
};
/**
 * Only shows features that match the given ids.
 * @param {String[]} featureIdList List of feature ids.
 * @returns {void}
 */
Layer2dVector.prototype.showFeaturesByIds = function (featureIdList) {
    const layerSource = this.getLayerSource() instanceof Cluster ? this.getLayerSource().getSource() : this.getLayerSource(),
        allLayerFeatures = layerSource.getFeatures(),
        featuresToShow = featureIdList.map(id => layerSource.getFeatureById(id));

    this.hideAllFeatures(true);
    featuresToShow.forEach(feature => {
        const style = this.getStyleAsFunction(this.get("style"));

        if (feature && feature !== null) {
            feature.set("hideInClustering", false);
            feature.setStyle(style(feature));
        }
    });

    layerSource.addFeatures(allLayerFeatures);
};

/**
 * Hides all features by setting style= null for all features.
 * @param {Boolean} [preventReAddFeaturesAfterClean=true] If true, features are not re-added after clearing the source.
 * @returns {void}
 */
Layer2dVector.prototype.hideAllFeatures = function (preventReAddFeaturesAfterClean = false) {
    const layerSource = this.getLayerSource() instanceof Cluster ? this.getLayerSource().getSource() : this.getLayerSource(),
        features = layerSource.getFeatures();

    // optimization - clear and re-add to prevent cluster updates on each change
    layerSource.clear();

    features.forEach((feature) => {
        feature.set("hideInClustering", true);
        feature.setStyle(new Style());
    });

    if (preventReAddFeaturesAfterClean) {
        return;
    }
    layerSource.addFeatures(features);
};

/**
 * Returns the style as a function.
 * @param {Function|Object} style ol style object or style function.
 * @returns {Function} - style as function.
 */
Layer2dVector.prototype.getStyleAsFunction = function (style) {
    if (typeof style === "function") {
        return style;
    }

    return function () {
        return style;
    };
};

/**
 * Creates the legend
 * @returns {void}
 */
Layer2dVector.prototype.createLegend = async function () {
    const styleObject = styleList.returnStyleObject(this.attributes.styleId),
        rules = styleObject?.rules,
        isSecured = typeof this.attributes.isSecured === "boolean" ? this.attributes.isSecured : false;
    let legend = this.inspectLegendUrl();

    if (!Array.isArray(legend)) {
        if (styleObject && legend === true) {

            const legendInfos = await createStyle.returnLegendByStyleId(styleObject.styleId);

            if (styleObject.styleId === "default") {
                const type = this.layer.getSource().getFeatures()[0].getGeometry().getType(),
                    typeSpecificLegends = [];

                if (type === "MultiLineString") {
                    typeSpecificLegends.push(legendInfos.legendInformation?.find(element => element.geometryType === "LineString"));
                    legend = typeSpecificLegends;
                }
                else {
                    typeSpecificLegends.push(legendInfos.legendInformation?.find(element => element.geometryType === type));
                    legend = typeSpecificLegends;
                }
            }
            else {
                if (!this.geometryTypeRequestLayers.includes(this.get("id"))) {
                    this.geometryTypeRequestLayers.push(this.get("id"));
                    getGeometryTypeFromService.getGeometryTypeFromWFS(rules, this.get("url"), this.get("version"), this.get("featureType"), this.get("styleGeometryType"), isSecured, Config.wfsImgPath,
                        (geometryTypes, error) => {
                            if (error) {
                                store.dispatch("Alerting/addSingleAlert", "<strong>" + i18next.t("common:core.layers.errorHandling.getGeometryTypeFromWFSFetchfailed") + "</strong> <br>"
                                    + "<small>" + i18next.t("common:core.layers.errorHandling.getGeometryTypeFromWFSFetchfailedMessage") + "</small>");
                            }
                            return geometryTypes;
                        });
                }
                if (rules && rules[0]?.conditions !== undefined && this.layer.getSource().getFeatures()) {
                    legend = this.filterUniqueLegendInfo(this.layer.getSource().getFeatures(), rules, legendInfos.legendInformation);
                }
                else {
                    legend = legendInfos.legendInformation;
                }
            }
        }
        else if (typeof legend === "string") {
            legend = [legend];
        }
    }

    return legend;
};

/**
 * Filters legend information based on active features and style rules.
 * Ensures the resulting legend order follows the order of rules in the style JSON.
 * Supports both shapes of `conditions.properties`:
 *  1) Array of objects: [{ attrName, value }]
 *  2) Plain object: { <attrName>: <value>, ... }
 * Handles numeric/string equality and numeric ranges [min, max).
 *
 * @param {Object[]} features - Selected OL features of the layer.
 * @param {Object[]} rules - Style rules from the style JSON.
 * @param {Object[]} legendInfos - All available legend entries (label, icon, etc.).
 * @returns {Object[]} Filtered legend entries, ordered by rule order; falls back to legendInfos if none matched.
 */
Layer2dVector.prototype.filterUniqueLegendInfo = function (features, rules, legendInfos) {
    if (!Array.isArray(features) || features.length === 0) {
        return legendInfos;
    }

    // Fast lookup: label -> legend entry
    const legendMap = new Map((legendInfos || []).map(li => [String(li?.label), li])),
        valuesByAttr = new Map(), // Cache collected feature values per attribute
        uniqueLegendInformation = [];

    // Reused variables (keeps function scope tidy)
    let attrName, ruleValue, featVals, hasMatch, label, li, rule, propsRaw, propKeys;

    /**
     * Converts a value to a finite number; returns null if not numeric.
     * @param {*} v
     * @returns {number|null} The numeric value if conversion succeeds, otherwise null.
     */
    function toNum (v) {
        const n = Number(v);

        return Number.isFinite(n) ? n : null;
    }

    /**
     * Collects all distinct values for a given attribute from features (cached).
     * @param {string} aName - The attribute name to collect values for.
     * @returns {Set<*>} A set containing all unique values found for the given attribute.
     */
    function getFeatureValuesFor (aName) {
        if (valuesByAttr.has(aName)) {
            return valuesByAttr.get(aName);
        }
        const set = new Set();

        for (let i = 0; i < features.length; i++) {
            const v = features[i].get(aName);

            if (typeof v !== "undefined") {
                set.add(v);
            }
        }
        valuesByAttr.set(aName, set);
        return set;
    }

    /**
     * Checks if a rule value matches any collected feature values.
     * Supports ranges [min, max) and exact (numeric/string) matches.
     * @param {Set<*>} featValues
     * @param {*} rValue
     * @returns {boolean} True if at least one feature value matches the rule value, otherwise false.
     */
    function ruleMatches (featValues, rValue) {
        // Range [min, max)
        if (Array.isArray(rValue) && rValue.length === 2) {
            const min = toNum(rValue[0]),
                max = toNum(rValue[1]);

            if (min === null || max === null) {
                return false;
            }
            for (const val of featValues) {
                const n = toNum(val);

                if (n !== null && n >= min && n < max) {
                    return true;
                }
            }
            return false;
        }

        // Exact match (numeric or string)
        const wantedNum = toNum(rValue);

        for (const val of featValues) {
            const n = toNum(val);

            if (wantedNum !== null && n !== null) {
                if (n === wantedNum) {
                    return true;
                }
            }
            else if (String(val) === String(rValue)) {
                return true;
            }
        }
        return false;
    }

    // Preserve JSON rule order in the resulting legend
    for (rule of rules || []) {
        // Support both schema formats for conditions.properties
        propsRaw = rule && rule.conditions ? rule.conditions.properties : undefined;

        if (Array.isArray(propsRaw) && propsRaw.length > 0) {
            attrName = propsRaw[0] && propsRaw[0].attrName;
            ruleValue = propsRaw[0] && propsRaw[0].value;
        }
        else if (propsRaw && typeof propsRaw === "object") {
            propKeys = Object.keys(propsRaw);
            if (propKeys.length > 0) {
                attrName = propKeys[0];
                ruleValue = propsRaw[attrName];
            }
            else {
                attrName = undefined;
                ruleValue = undefined;
            }
        }
        else {
            attrName = undefined;
            ruleValue = undefined;
        }

        if (!attrName) {
            continue;
        }

        featVals = getFeatureValuesFor(attrName);
        hasMatch = ruleMatches(featVals, ruleValue);
        if (!hasMatch) {
            continue;
        }

        // Prefer an explicit style.legendValue; otherwise derive label from rule value
        if (rule && rule.style && rule.style.legendValue !== null && typeof rule.style.legendValue !== "undefined") {
            label = String(rule.style.legendValue);
        }
        else {
            label = String(Array.isArray(ruleValue) ? `${ruleValue[0]},${ruleValue[1]}` : ruleValue);
        }

        li = legendMap.get(label);
        if (li) {
            uniqueLegendInformation.push(li);
        }
    }

    return uniqueLegendInformation.length ? uniqueLegendInformation : legendInfos;
};


