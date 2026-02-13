import epsgCodeToURI from "@modules/filter/utils/epsgCodeToURI.js";
import isObject from "@shared/js/utils/isObject.js";
import {getOafAttributeTypes} from "../../utils/getOafAttributeTypes.js";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import {fetchAllOafProperties, getUniqueValuesFromFetchedFeatures, getMinMaxFromFetchedFeatures, getMinMaxFromEnumValues} from "../../utils/fetchAllOafProperties.js";

/**
 * InterfaceOafExtern is the filter interface for Oaf services
 * @class
 */
export default class InterfaceOafExtern {
    /**
     * @constructor
     * @param {Function} handlers.getCurrentExtent a function to receive the current browser extent
     */
    constructor ({getCurrentExtent}) {
        this.getCurrentExtent = getCurrentExtent;
        this.axiosControllers = {};
        this.allFetchedProperties = false;
        this.enumList = false;
        this.hasEnums = null;
        this.waitingListForFeatures = [];
    }

    /**
     * Calls the given onsuccess function with an empty list of items to trigger progress.
     * @param {Function} onsuccess a function(filterAnswer)
     * @param {Object} filterQuestion an object with filterId, service and rules
     * @param {Number} percentage the page to set - be reminded: 1 might clear the layer, 100 might call stop events
     * @returns {void}
     */
    callEmptySuccess (onsuccess, filterQuestion, percentage) {
        if (typeof onsuccess !== "function") {
            return;
        }
        onsuccess({
            service: filterQuestion?.service,
            filterId: filterQuestion?.filterId,
            snippetId: filterQuestion?.snippetId,
            paging: {
                page: percentage,
                total: 100
            },
            items: []
        });
    }

    /**
     * Returns an object {attrName: Type} with all attributes and their types.
     * @param {Object} service the service to call, identical to filterQuestion.service
     * @param {Function} onsuccess a function({attrName: Type}[])
     * @param {Function} onerror a function(errorMsg)
     * @returns {void}
     */
    getAttrTypes (service, onsuccess, onerror) {
        if (!isObject(service)) {
            if (typeof onerror === "function") {
                onerror(new Error("InterfaceOafExtern.getAttrTypes: missing service object"));
            }
            return;
        }

        getOafAttributeTypes(service.url, service.collection, onsuccess, onerror);
    }

    /**
     * Returns an oaf filter object to use for the given rules.
     * @param {Object[]} rules the rules to parse through
     * @param {String} geometryName the attrName of the geometry
     * @param {Object} filterGeometry a geometry in which to filter
     * @param {Boolean} [ignoreRules=false] if true, rules are ignored and only the geometry is used
     * @returns {string} an OAF filter string.
     */
    getFilter (rules, geometryName, filterGeometry, ignoreRules = false) {
        const filterArgs = [];

        if (!ignoreRules) {
            rules.forEach(rule => {
                switch (rule.operator) {

                    case "INTERSECTS":
                        if (rule.format === "YYYY-MM-DD") {
                            filterArgs.push(`T_INTERSECTS(${rule.attrName},INTERVAL('${rule.value[0]}','${rule.value[1]}'))`);
                        }
                        break;

                    case "EQ":
                        if (rule.format === "YYYY-MM-DD" && rule.value !== "Invalid Date") {
                            filterArgs.push(`T_EQUALS(${rule.attrName},DATE('${rule.value}'))`);
                        }
                        else if (typeof rule.value === "string") {
                            filterArgs.push(`${rule.attrName}='${rule.value}'`);
                        }
                        else if (typeof rule.value === "number" || typeof rule.value === "boolean") {
                            filterArgs.push(`${rule.attrName}=${rule.value}`);
                        }
                        else if (Array.isArray(rule.value)) {
                            const values = rule.value.map(value => typeof value === "string" ? `'${value}'` : value);

                            filterArgs.push(`${rule.attrName} IN (${values.join(",")})`);
                        }
                        break;

                    case "NE":
                        if (typeof rule.value === "string") {
                            filterArgs.push(`NOT ${rule.attrName}='${rule.value}'`);
                        }
                        else if (typeof rule.value === "number" || typeof rule.value === "boolean") {
                            filterArgs.push(`NOT ${rule.attrName}=${rule.value}`);
                        }
                        else if (Array.isArray(rule.value)) {
                            const values = rule.value.map(value => typeof value === "string" ? `'${value}'` : value);

                            filterArgs.push(`${rule.attrName} NOT IN (${values.join(",")})`);
                        }
                        break;

                    case "BETWEEN":
                        filterArgs.push(`${rule.attrName} BETWEEN ${rule.value[0]} AND ${rule.value[1]}`);
                        break;

                    case "STARTSWITH":
                        filterArgs.push(`${rule.attrName} LIKE '${rule.value}%'`);
                        break;

                    case "ENDSWITH":
                        filterArgs.push(`${rule.attrName} LIKE '%${rule.value}'`);
                        break;

                    case "IN":
                        filterArgs.push(`${rule.attrName} LIKE '%${rule.value}%'`);
                        break;

                    case "GT":
                        filterArgs.push(`${rule.attrName}>${rule.value}`);
                        break;

                    case "GE":
                        filterArgs.push(`${rule.attrName}>=${rule.value}`);
                        break;

                    case "LT":
                        filterArgs.push(`${rule.attrName}<${rule.value}`);
                        break;

                    case "LE":
                        filterArgs.push(`${rule.attrName}<=${rule.value}`);
                        break;

                    default:
                        break;
                }
            });
        }

        if (typeof geometryName === "string" && isObject(filterGeometry)) {
            filterArgs.push(getOAFFeature.getOAFGeometryFilter(filterGeometry, geometryName, "intersects"));
        }

        return filterArgs.join(" AND ");
    }

    /**
     * Returns the min and max values of the given service and attrName.
     * @param {Object} service the service to call, identical to filterQuestion.service
     * @param {String} attrName the attribute to receive the min and max value from
     * @param {Function} onsuccess a function({min, max}) with the received values
     * @param {Function} onerror a function(errorMsg)
     * @param {Boolean} [minOnly=false] if only min is of interest
     * @param {Boolean} [maxOnly=false] if only max is of interest
     * @param {Object} [filterQuestion={}] the filterQuestion to receive additional information like searchInMapExtent and srsName for fetching all properties if needed
     * @returns {void}
     */
    async getMinMax (service, attrName, onsuccess, onerror, minOnly = false, maxOnly = false, filterQuestion = {}) {
        if (Array.isArray(this.allFetchedProperties)) {
            if (typeof onsuccess === "function") {
                onsuccess(getMinMaxFromFetchedFeatures(this.allFetchedProperties, attrName, minOnly, maxOnly));
            }
            return;
        }
        else if (this.enumList[attrName]) {
            onsuccess(getMinMaxFromEnumValues(this.enumList[attrName], minOnly, maxOnly));
            return;
        }

        if (this.hasEnums === null) {
            const schema = await getOAFFeature.getCollectionSchema(service.url, service.collection);

            this.enumList = this.getEnumValues(schema?.properties);
            this.hasEnums = isObject(this.enumList) && Object.keys(this.enumList).length > 0;
        }

        if (!this.allFetchedProperties && !this.enumList[attrName]) {
            const controller = new AbortController();

            this.axiosControllers[filterQuestion.filterId + ".allProperties"] = controller;
            this.allFetchedProperties = true;

            fetchAllOafProperties({url: service.url, collection: service.collection, limit: service.limit}, allProperties => {
                this.allFetchedProperties = allProperties;
                while (this.waitingListForFeatures.length) {
                    this.waitingListForFeatures.shift()();
                }
            },
            onerror,
            filterQuestion.commands.searchInMapExtent ? this.getCurrentExtent?.()?.join(",") : undefined,
            epsgCodeToURI(filterQuestion.service.srsName),
            controller.signal,
            true);
        }
        else if (this.enumList[attrName]) {
            onsuccess(getMinMaxFromEnumValues(this.enumList[attrName], minOnly, maxOnly));
            return;
        }

        this.waitingListForFeatures.push(() => {
            if (typeof onsuccess === "function") {
                onsuccess(getMinMaxFromFetchedFeatures(this.allFetchedProperties, attrName, minOnly, maxOnly));
            }
        });
    }

    /**
     * Returns a list of unique values (unsorted) of the given service and attrName.
     * @param {Object} service the service to call, identical to filterQuestion.service
     * @param {String} attrName the attribute to receive unique values from
     * @param {Function} onsuccess a function([]) with the received unique values as Array of values
     * @param {Function} onerror a function(errorMsg)
     * @returns {void}
     */
    async getUniqueValues (service, attrName, onsuccess, onerror, filterQuestion) {
        if (Array.isArray(this.allFetchedProperties)) {
            if (typeof onsuccess === "function") {
                const uniqueValue = getUniqueValuesFromFetchedFeatures(this.allFetchedProperties, attrName, false, filterQuestion);

                onsuccess(isObject(uniqueValue) ? Object.keys(uniqueValue) : []);
            }
            return;
        }
        else if (this.enumList[attrName]) {
            onsuccess(Object.keys(this.enumList[attrName]));
            return;
        }

        if (this.hasEnums === null) {
            const schema = await getOAFFeature.getCollectionSchema(service.url, service.collection);

            this.enumList = this.getEnumValues(schema?.properties);
            this.hasEnums = isObject(this.enumList) && Object.keys(this.enumList).length > 0;
        }
        if (this.allFetchedProperties === false && !this.enumList[attrName]) {
            const controller = new AbortController();

            this.axiosControllers[filterQuestion.filterId + ".allProperties"] = controller;
            this.allFetchedProperties = true;
            fetchAllOafProperties({url: service.url, collection: service.collection, limit: service.limit}, allProperties => {
                this.allFetchedProperties = allProperties;
                while (this.waitingListForFeatures.length) {
                    this.waitingListForFeatures.shift()();
                }
            },
            onerror,
            filterQuestion.commands.searchInMapExtent ? this.getCurrentExtent?.()?.join(",") : undefined,
            epsgCodeToURI(filterQuestion.service.srsName),
            controller.signal,
            true);
        }
        else if (this.enumList[attrName]) {
            onsuccess(Object.keys(this.enumList[attrName]));
            return;
        }

        this.waitingListForFeatures.push(() => {
            if (typeof onsuccess === "function") {
                const uniqueValue = getUniqueValuesFromFetchedFeatures(this.allFetchedProperties, attrName, false, filterQuestion);

                onsuccess(isObject(uniqueValue) ? Object.keys(uniqueValue) : []);
            }
        });
    }

    /**
     * Cancels the current request.
     * @pre a request is send to the server and the data is still loading
     * @post the request is terminated and the server response is aborted
     * @param {Number} filterId the id of the filter that should stop
     * @param {Function} onsuccess a function to call when finished
     * @param {Function} onerror a function to call on error
     * @returns {void}
     */
    stop (filterId, onsuccess, onerror) {
        const controllers = [this.axiosControllers[filterId], this.axiosControllers[filterId + ".allProperties"]];
        let errorOccurred = false,
            foundController = false;

        controllers.forEach((controller) => {
            if (controller instanceof AbortController) {
                controller.abort();
                foundController = true;
            }
            else if (foundController === false) {
                errorOccurred = true;
            }
        });
        if (errorOccurred && typeof onerror === "function") {
            onerror();
            return;
        }
        onsuccess();
    }

    /**
     * Filters the given filterQuestion and returns the resulting filterAnswer.
     * @param {Object} filterQuestion an object with filterId, service and rules
     * @param {Function} onsuccess a function(filterAnswer)
     * @param {Function} onerror a function(errorMsg)
     * @param {Function|Boolean} [axiosMock=false] false to use axios, an object with get function(url, {params}) if mock is needed
     * @param {Boolean} ignoreRules should ignore rules and just start a filter request without.
     * @returns {void}
     */
    async filter (filterQuestion, onsuccess, onerror, axiosMock = false, ignoreRules = false) {
        if (axiosMock) {
            console.warn("Parameter axiosMock not supported in InterfaceOafExtern.filter()");
        }

        const controller = new AbortController(),
            progress = 1,
            bbox = filterQuestion.commands.searchInMapExtent ? this.getCurrentExtent?.()?.join(",") : undefined,
            filter = this.getFilter(filterQuestion.rules, filterQuestion.commands?.geometryName, filterQuestion.commands?.filterGeometry, ignoreRules);
        let stream = null,
            items = [];

        this.callEmptySuccess(onsuccess, filterQuestion, progress);

        this.axiosControllers[filterQuestion.filterId] = controller;

        stream = getOAFFeature.getOAFFeatureStream(`${filterQuestion.service.url}/collections/${filterQuestion.service.collection}/items`, {
            filter,
            "filter-crs": epsgCodeToURI(filterQuestion.service.srsName),
            crs: epsgCodeToURI(filterQuestion.service.srsName),
            bbox,
            "bbox-crs": epsgCodeToURI(filterQuestion.service.srsName),
            limit: filterQuestion.service.limit
        },
        (nextUrl) => {
            const u = new URL(nextUrl),
                filterSearchParam = u.searchParams.get("filter");

            if (filterSearchParam) {
                u.searchParams.set("filter", filterSearchParam.replaceAll("+", " "));
            }
            return u.toString();
        },
        controller.signal,
        onerror,
        true);

        try {
            for await (const evt of stream) {
                const event = isObject(evt) && typeof evt.type === "string"
                    ? evt
                    : {type: "feature", feature: evt};

                if (event.type === "progress") {
                    onsuccess({
                        service: filterQuestion.service,
                        filterId: filterQuestion.filterId,
                        snippetId: filterQuestion.snippetId,
                        paging: {
                            page: event.loaded,
                            total: event.total
                        },
                        items
                    });
                    items = [];
                }
                else {
                    items.push(event.feature);
                }
            }
            if (items.length > 0) {
                onsuccess({
                    service: filterQuestion.service,
                    filterId: filterQuestion.filterId,
                    snippetId: filterQuestion.snippetId,
                    paging: {
                        loaded: 100,
                        total: 100
                    },
                    items
                });
                items = [];
            }
        }
        catch (e) {
            if (controller.signal.aborted || e?.name === "AbortError") {
                return;
            }
            if (typeof onerror === "function") {
                onerror(e);
            }
        }
    }

    /**
     * Gets enum values from schema properties.
     * @param {Object} properties The schema properties.
     * @returns {Object} An object with enum values for each property.
     */
    getEnumValues (properties) {
        const result = {};

        Object.entries(properties).forEach(([key, value]) => {
            if (!Object.prototype.hasOwnProperty.call(value, "enum")) {
                return;
            }
            const uniqueList = {};

            value.enum.forEach(uniqueValue => {
                uniqueList[uniqueValue] = true;
            });
            result[key] = uniqueList;
        });
        return result;
    }
}
