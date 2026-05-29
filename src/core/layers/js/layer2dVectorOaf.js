import {all, bbox} from "ol/loadingstrategy.js";
import {oaf} from "@masterportal/masterportalapi/src/index.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import getGeometryTypeFromService from "@masterportal/masterportalapi/src/vectorStyle/lib/getGeometryTypeFromService.js";
import store from "@appstore/index.js";
import Layer2dVector from "./layer2dVector.js";

/**
 * Creates a 2d vector oaf (OGC API - Features) layer.
 * @name Layer2dVectorOaf
 * @constructs
 * @extends Layer2dVector
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
export default function Layer2dVectorOaf (attributes) {
    const defaultAttributes = {
    };

    this.attributes = Object.assign(defaultAttributes, attributes);
    Layer2dVector.call(this, this.attributes);
    this.prepareFeaturesFor3D(this.layer?.getSource().getFeatures());
}

Layer2dVectorOaf.prototype = Object.create(Layer2dVector.prototype);

/**
 * Creates a layer of type Geojson by using geojson-layer of the masterportalapi.
 * Sets all needed attributes at the layer and the layer source.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer2dVectorOaf.prototype.createLayer = function (attributes) {
    const rawLayerAttributes = this.getRawLayerAttributes(attributes),
        layerParams = this.getLayerParams(attributes),
        options = this.getOptions(attributes);

    this.setLayer(oaf.createLayer(rawLayerAttributes, {layerParams, options}));
};

/**
 * Gets raw layer attributes from attributes.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {Object} The raw layer attributes.
 */
Layer2dVectorOaf.prototype.getRawLayerAttributes = function (attributes) {
    const crs = attributes.crs === false || attributes.crs ? attributes.crs : "http://www.opengis.net/def/crs/EPSG/0/25832";
    let bboxExtent;

    if (attributes.bbox === false) {
        bboxExtent = undefined;
    }
    else {
        bboxExtent = attributes.bbox || Array.isArray(attributes.datasets) && attributes.datasets[0]?.bbox || store.getters["Maps/extent"];
    }

    return {
        bbox: bboxExtent,
        bboxCrs: typeof bboxExtent === "undefined" ? undefined : attributes.bboxCrs || crs,
        clusterDistance: attributes.clusterDistance,
        collection: attributes.collection,
        crs: crs,
        datetime: attributes.datetime,
        id: attributes.id,
        limit: typeof attributes.limit === "undefined" ? 200 : attributes.limit,
        offset: attributes.offset,
        params: attributes.params,
        url: attributes.url
    };
};

/**
 * Gets additional options.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {Object} The options.
 */
Layer2dVectorOaf.prototype.getOptions = function (attributes) {
    const loadingParams = this.loadingParams(attributes);

    // do not pass a bbox to the loading strategy if bbox is false — many OAF implementations do not reliably support non-WGS84 bbox filters
    if (attributes.bbox === false) {
        delete loadingParams.bbox;
    }

    const options = {
        clusterGeometryFunction: this.clusterGeometryFunction,
        doNotLoadInitially: typeof attributes.doNotLoadInitially === "boolean" ? attributes.doNotLoadInitially : true,
        featuresFilter: (features) => this.featuresFilter(attributes, features),
        loadingParams,
        loadingStrategy: attributes.loadingStrategy === "all" ? all : bbox,
        onLoadingError: this.onLoadingError,
        style: this.getStyleFunction(attributes)
    };

    return options;
};

/**
 * Creates the legend
 * @returns {void}
 */
Layer2dVectorOaf.prototype.createLegend = async function () {
    const styleObject = styleList.returnStyleObject(this.attributes.styleId),
        rules = styleObject?.rules;
    let legend = this.inspectLegendUrl();

    if (!Array.isArray(legend)) {
        if (styleObject && legend === true) {
            getGeometryTypeFromService.getGeometryTypeFromOAF(rules, this.get("url"), this.get("collection"), Config.wfsImgPath,
                (error) => {
                    if (error) {
                        store.dispatch("Alerting/addSingleAlert", "<strong>" + i18next.t("common:core.layers.errorHandling.getGeometryTypeFromOAFFetchfailed") + "</strong> <br>"
                        + "<small>" + i18next.t("common:core.layers.errorHandling.getGeometryTypeFromOAFFetchfailedMessage") + "</small>");
                    }
                });
            const legendInfos = await createStyle.returnLegendByStyleId(styleObject.styleId);

            legend = legendInfos.legendInformation;
        }
        else if (typeof legend === "string") {
            legend = [legend];
        }
    }

    return legend;
};
/**
 * Recursively fetches all OAF feature pages and adds them to the source.
 * Avoids masterportalapi's loadFeaturesManually which lacks an Accept header and can fail on strict services.
 * @param {string} url URL to fetch
 * @param {ol/source/Vector} source OL vector source
 * @param {ol/format/GeoJSON} format GeoJSON format
 * @param {Object[]} accumulated features collected so far
 * @returns {void}
 */
Layer2dVectorOaf.prototype.fetchOafPage = function (url, source, format, accumulated = []) {
    fetch(url.toString(), {
        headers: {Accept: "application/geo+json"},
        method: "GET"
    })
        .then(response => {
            if (!response.ok) {
                console.error("OAF fetch failed: " + response.status + " " + response.statusText);
                return null;
            }
            return response.json();
        })
        .then(responseJson => {
            if (!responseJson || !Array.isArray(responseJson.features)) {
                return;
            }
            accumulated.push(...responseJson.features);

            const nextLink = Array.isArray(responseJson.links)
                ? responseJson.links.find(link => link.rel === "next" && link.type === "application/geo+json")
                : null;

            if (nextLink?.href && responseJson.features.length > 0) {
                this.fetchOafPage(nextLink.href, source, format, accumulated);
                return;
            }

            const collection = {...responseJson, features: accumulated},
                featureProjection = store.getters["Maps/projection"].getCode(),
                dataProjection = this.attributes?.dataProjection || "EPSG:4326",
                features = format.readFeatures(collection, {dataProjection, featureProjection});

            source.addFeatures(features);
        })
        .catch(error => {
            console.error("OAF loadFeaturesManually error:", error);
        });
};

/**
 * Load the features manually.
 * @param {Object} attributes The new attributes.
 * @returns {void}
 */
Layer2dVectorOaf.prototype.loadFeaturesManually = function (attributes) {
    const attr = {...this.getRawLayerAttributes(attributes)};

    if (!attr.url) {
        attr.url = this.attributes.url;
    }
    // avoid sending auto bbox from map extent.
    delete attr.bbox;
    delete attr.bboxCrs;

    const source = this.layer.getSource(),
        format = source.getFormat(),
        url = oaf.createUrl(attr, undefined);

    this.fetchOafPage(url.toString(), source, format);
};
