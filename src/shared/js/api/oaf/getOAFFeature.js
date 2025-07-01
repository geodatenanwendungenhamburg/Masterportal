import axios from "axios";
import isObject from "../../utils/isObject.js";
import {GeoJSON} from "ol/format";
import {getUniqueValuesFromFetchedFeatures} from "@modules/filter/utils/fetchAllOafProperties";

/**
 * Gets all features of given collection.
 * @param {String} baseUrl The base url.
 * @param {String} collection The collection.
 * @param {Object} [options={}] Additional options.
 * @param {String} [options.bbox] The bounding box to filter the features.
 * @param {String} [options.bboxCrs] The coordinate reference system of the bounding box.
 * @param {String} [options.crs] The coordinate reference system of the response geometries.
 * @param {String} [options.datetime] An optional datetime string to filter the features temporally.
 * @param {String} [options.filter] The filter. See https://ogcapi.ogc.org/features/ for more information.
 * @param {String} [options.filterCrs] The filter crs. Needs to be set if a filter is used.
 * @param {Number} [options.limit=400] The limit of features per request.
 * @param {String[]} [options.propertyNames] The property names to narrow the request.
 * @param {AbortSignal} [options.signal] An optional AbortSignal to cancel the request.
 * @param {boolean} [options.skipGeometry=false] If true, the geometries will not be returned.
 * @returns {Promise} An promise which resolves an array of oaf features.
 */
async function getOAFFeatureGet (baseUrl, collection, {
    bbox,
    bboxCrs,
    crs,
    datetime,
    filter,
    filterCrs,
    limit = 400,
    propertyNames,
    signal,
    skipGeometry = false
} = {}) {
    if (typeof baseUrl !== "string") {
        return new Promise((resolve, reject) => {
            reject(new Error(`Please provide a valid base url! Got ${baseUrl}`));
        });
    }
    if (typeof collection !== "string") {
        return new Promise((resolve, reject) => {
            reject(new Error(`Please provide a collection! Got ${collection}`));
        });
    }
    if (typeof filter !== "undefined" && typeof filterCrs === "undefined") {
        return new Promise((resolve, reject) => {
            reject(new Error(`Please provide a valid crs for the oaf filter! Got ${filterCrs}`));
        });
    }
    if (typeof bbox !== "undefined" && typeof bboxCrs === "undefined") {
        return Promise.reject(new Error(`Please provide a valid crs for the bbox! Got ${bboxCrs}`));
    }
    const url = `${baseUrl}/collections/${collection}/items?limit=${limit}`,
        result = [];

    let extendedUrl = filter ? `${url}&filter=${encodeURIComponent(filter)}&filter-crs=${filterCrs}` : `${url}`;

    if (typeof bbox === "string") {
        extendedUrl += `&bbox=${bbox}&bbox-crs=${bboxCrs}`;
    }

    if (typeof crs === "string") {
        extendedUrl += `&crs=${crs}`;
    }

    if (Array.isArray(propertyNames)) {
        extendedUrl += `&properties=${propertyNames.join(",")}`;
    }

    if (skipGeometry) {
        extendedUrl += `&skipGeometry=${skipGeometry}`;
    }

    if (typeof datetime === "string") {
        extendedUrl += `&datetime=${datetime}`;
    }

    return this.oafRecursionHelper(result, extendedUrl, signal);
}

/**
 * An recursion helper which calls the given url and pushes the result in the given 'result' reference.
 * @param {Object[]} result An array of objects.
 * @param {String} url The url to call.
 * @returns {Promise} an promise which resolves all oaf features as geojson.
 */
async function oafRecursionHelper (result, url, signal) {
    return new Promise((resolve, reject) => {
        axios.get(url, {
            headers: {
                accept: "application/geo+json"
            },
            signal: signal
        }).then(async (response) => {
            const nextLink = this.getNextLinkFromFeatureCollection(response?.data);

            if (Array.isArray(response?.data?.features)) {
                result.push(...response.data.features);
            }
            if (typeof nextLink === "string") {
                try {
                    resolve(await this.oafRecursionHelper(result, nextLink, signal));
                }
                catch (error) {
                    reject(error);
                }
            }
            else {
                resolve(result);
            }
        }).catch(error => reject(error));
    });
}

/**
 * Fetches OAF features as a readable stream, following next links.
 * @param {String} url - The initial OAF endpoint URL.
 * @param {Object} searchParams - OAF-specific search parameters.
 * @returns {ReadableStream} - A readable stream of features.
 */
function getOAFFeatureStream (url, searchParams = {}) {
    const geoJSON = new GeoJSON();

    return new ReadableStream({
        async start (controller) {
            let nextUrl = url,
                params = {...searchParams};

            try {
                while (nextUrl) {
                    const response = await axios.get(nextUrl, {params}),
                        nextLink = response.data.links?.find(link => link.rel === "next");

                    response.data.features.forEach(feature => {
                        const olFeature = geoJSON.readFeature(feature);

                        controller.enqueue(olFeature);
                    });

                    nextUrl = nextLink ? nextLink.href : null;
                    params = {};
                }

                controller.close();
            }
            catch (err) {
                controller.error(err);
            }
        }
    });
}

/**
 * Gets the schema of the given collection.
 * @param {String} baseUrl - The base url of the oaf api.
 * @param {String} collection - The collection name.
 * @returns {Promise} an promise which resolves.
 */
async function getCollectionSchema (baseUrl, collection) {
    if (typeof baseUrl !== "string" || typeof collection !== "string") {
        return new Promise((resolve, reject) => {
            reject(new Error(`Please provide a valid base url! Got ${baseUrl}`));
        });
    }
    const url = `${baseUrl}/collections/${collection}/schema?f=json`;

    return new Promise((resolve, reject) => {
        axios.get(url, {
            headers: {
                accept: "application/schema+json"
            }
        }).then(response => resolve(response.data)).catch(error => reject(error));
    });
}

/**
 * Reads the given features or featureCollections and parse them to ol/GeoJSON.
 * @param {Object[]|ol} features The array of features.
 * @param {Object} [options={}] The options to pass to the GeoJSON constructor.
 * @returns {ol/Feature[]} an array of ol features.
 */
function readAllOAFToGeoJSON (features, options = {}) {
    if (!Array.isArray(features)) {
        return features;
    }
    const geoJSONParser = new GeoJSON(options),
        olFeatures = geoJSONParser.readFeatures(
            {
                type: "FeatureCollection",
                features
            }
        );

    return olFeatures;
}

/**
 * Parses the given feature collection for the next nextLink.
 * @param {Object} featureCollection the feature collection
 * @returns {String|Boolean} the next link or false if no next link exists
 */
function getNextLinkFromFeatureCollection (featureCollection) {
    if (!Array.isArray(featureCollection?.links)) {
        return false;
    }
    const len = featureCollection.links.length;

    for (let i = 0; i < len; i++) {
        if (
            isObject(featureCollection.links[i])
            && typeof featureCollection.links[i].href === "string"
            && featureCollection.links[i].rel === "next"
            && featureCollection.links[i].type === "application/geo+json"
        ) {
            return featureCollection.links[i].href;
        }
    }
    return false;
}

/**
 * Gets the unique values for given properties.
 * @param {String} baseUrl The base url.
 * @param {String} collection The collection name.
 * @param {Number} limit The limit of features each request should contain.
 * @param {String[]} propertiesToGetValuesFor The properties to get values for.
 * @returns {Promise} a promise which resolves the unique values as object or rejects on error.
 */
async function getUniqueValuesFromCollection (baseUrl, collection, limit, propertiesToGetValuesFor) {
    return new Promise((resolve, reject) => {
        this.getOAFFeatureGet(baseUrl, collection, {limit, propertyNames: propertiesToGetValuesFor, skipGeometry: true}).then(features => {
            resolve(getUniqueValuesFromFetchedFeatures(features.map(feature => feature?.properties), propertiesToGetValuesFor, true));
        }).catch(error => reject(error));
    });
}
/**
 * Gets the unique values by a scheme request.
 * @param {String} baseUrl The base url of the dataset.
 * @param {String} collection The collection name.
 * @param {String[]} propertiesToGetValuesFor List of properties to get the values for. If empty it returns all attributes.
 * @returns {Object} an object with property name as key and the unique values as object as value.
 */
async function getUniqueValuesByScheme (baseUrl, collection, propertiesToGetValuesFor) {
    if (typeof baseUrl !== "string" || typeof collection !== "string" || !Array.isArray(propertiesToGetValuesFor)) {
        return {};
    }
    const url = `${baseUrl}/collections/${collection}/schema`,
        response = await axios.get(url, {
            headers: {
                accept: "application/schema+json"
            }
        }),
        result = {};
    let atLeastOneEnumFound = false;

    if (response.status !== 200 || !isObject(response.data?.properties)) {
        return this.getUniqueValuesFromCollection(baseUrl, collection, 400, propertiesToGetValuesFor);
    }

    Object.entries(response.data.properties).forEach(([key, value]) => {
        if (!Object.prototype.hasOwnProperty.call(value, "enum") || (propertiesToGetValuesFor.length && !propertiesToGetValuesFor.includes(key))) {
            return;
        }
        atLeastOneEnumFound = true;
        const uniqueList = {};

        value.enum.forEach(uniqueValue => {
            uniqueList[uniqueValue] = true;
        });
        result[key] = uniqueList;
    });

    if (!atLeastOneEnumFound) {
        return this.getUniqueValuesFromCollection(baseUrl, collection, 400, propertiesToGetValuesFor);
    }
    return result;
}

/**
 * Gets an oaf geometry filter.
 * @param {ol/geom/Geometry} geometry - The Geometry.
 * @param {String} geometryName - The geometry-valued property.
 * @param {String} filterType - Possible types are intersects | within.
 * @returns {String|undefined} a string which represents the oaf geometry filter.
 */
function getOAFGeometryFilter (geometry, geometryName, filterType) {
    if (typeof filterType !== "string" || filterType !== "intersects" && filterType !== "within") {
        return undefined;
    }

    const flattenCoordinates = Array.isArray(geometry?.flatCoordinates) && geometry?.flatCoordinates[2] === 0 ? geometry.flatCoordinates.filter((coordinate, index) => (index + 1) % 3) : geometry.flatCoordinates,
        result = [],
        operation = filterType === "intersects" ? "S_INTERSECTS" : "S_WITHIN";

    for (let i = 0; i < flattenCoordinates.length; i += 2) {
        const chunk = flattenCoordinates.slice(i, i + 2);

        result.push(chunk.join(" "));
    }

    if (geometry?.getType() === "Point") {
        return `${operation}(${geometryName}, POINT(${result.join(", ")}))`;
    }
    return `${operation}(${geometryName}, POLYGON((${result.join(", ")})))`;
}

/**
 * Gets the temporal extent of a collection
 * @param {String} baseUrl The base url of the dataset.
 * @param {String} collection The collection name.
 * @returns {Date[][]} An array of intervals, each defined by a start date and an end date. Undefined in case of an error.
 */
async function getTemporalExtent (baseUrl, collection) {
    if (typeof baseUrl !== "string" || typeof collection !== "string") {
        return undefined;
    }

    const response = await axios.get(`${baseUrl}/collections/${collection}`, {
        params: {f: "json"}
    });

    return response?.data?.extent?.temporal?.interval?.map(
        interval => interval.map(dateString => new Date(dateString))
    );
}

export default {
    getCollectionSchema,
    getOAFFeatureGet,
    getOAFFeatureStream,
    readAllOAFToGeoJSON,
    oafRecursionHelper,
    getNextLinkFromFeatureCollection,
    getUniqueValuesFromCollection,
    getUniqueValuesByScheme,
    getOAFGeometryFilter,
    getTemporalExtent
};
