import isObject from "@shared/js/utils/isObject.js";
import {addSnippetOperator, addSnippetTypes} from "./compileSnippets.js";
/**
 * The UrlHandler has controll over the url of the filter and containing params.
 * @class
 */
export default class UrlHandler {
    /**
     * Gets the params and values from the state by given keys.
     * @param {Object} state The current state to get the values from.
     * @param {String[]} neededUrlParams The needed keys for the url param. Used to filter over given state.
     * @returns {Object} an object with current state of given keys.
     */
    getParamsFromState (state, neededUrlParams) {
        const params = {};

        if (!isObject(state) || !Array.isArray(neededUrlParams)) {
            return params;
        }
        Object.entries(state).forEach(([key, value]) => {
            if (neededUrlParams.includes(key) && typeof value !== "undefined") {
                params[key] = value;
            }
        });
        return params;
    }

    /**
     * Parses a JSON string if possible.
     * @param {*} value The value to parse.
     * @param {string} warningMessage The warning to log on parse failure.
     * @param {*} fallback The fallback value to return on parse failure.
     * @returns {*|undefined} The parsed value, fallback, or undefined if value is not a string.
     */
    parseJsonString (value, warningMessage, fallback = undefined) {
        if (typeof value !== "string") {
            return undefined;
        }

        try {
            return JSON.parse(value);
        }
        catch (error) {
            console.warn(warningMessage, error);
            return fallback;
        }
    }

    /**
     * Gets filter url params from app store url params.
     * @param {Object} appStoreUrlParams The url params from app store.
     * @param {string} filterKey The filter query param key.
     * @returns {Object|Object[]} Parsed filter params or an empty object.
     */
    getFilterUrlParamsFromAppStore (appStoreUrlParams, filterKey = "FILTER") {
        const filterUrlParams = this.parseJsonString(
            appStoreUrlParams?.[filterKey],
            `Cannot parse ${filterKey} url params`
        );

        if (typeof filterUrlParams !== "undefined") {
            return filterUrlParams;
        }

        const menuParams = this.parseJsonString(
            appStoreUrlParams?.MENU || "{}",
            "Cannot parse MENU url params",
            {}
        );

        return Object.values(menuParams)
            .find(value => value?.currentComponent === "filter")
            ?.attributes || {};
    }
    /**
     * Checks if the given values represent a new filter URL state.
     * @param {*} values The values to check.
     * @returns {boolean} True if the values represent a new filter URL state, false otherwise.
     */
    isNewFilterUrlState (values) {
        return isObject(values)
            && Object.prototype.hasOwnProperty.call(values, "rulesOfFilters");
    }

    /**
     * Builds current filter url.
     * @param {string} currentHref The current browser href.
     * @param {string} menuSide The active menu side.
     * @param {string} filterKey The filter query param key.
     * @param {string} urlParams The serialized filter params.
     * @returns {URL} The updated URL.
     */
    createFilterUrl (currentHref, menuSide, filterKey, urlParams) {
        const url = new URL(currentHref),
            menuSection = menuSide === "mainMenu" ? "main" : "secondary";

        url.searchParams.set("MENU", JSON.stringify({
            [menuSection]: {
                currentComponent: "filter"
            }
        }));
        url.searchParams.set(filterKey, urlParams);

        return url;
    }

    /**
     * Reads the given params.
     * @param {String|Object} params The params to read.
     * @param {Object} config Config to use for the old url syntax.
     * @param {Object} mapHandler The mapHandler.
     * @param {Function} onsuccess Function to call when success.
     * @return {void}
     */
    readFromUrlParams (params, config, mapHandler, onsuccess) {
        let values = params;

        if (typeof values === "string") {
            try {
                values = JSON.parse(values);
            }
            catch (error) {
                return;
            }
        }
        if (this.isNewFilterUrlState(values)) {
            if (typeof onsuccess === "function") {
                onsuccess(values);
            }
        }
        else if (Array.isArray(values)) {
            this.transformOldUrl(values, config, mapHandler, onsuccess);
        }
    }
    /**
     * Transforms the old url params to new syntax.
     * @param {Object[]} oldObjectArray The old params.
     * @param {Object} config The config of the filter tool.
     * @param {Object} mapHandler The mapHandler.
     * @param {Function} onsuccess The function to call when success.
     * @returns {void}
     */
    transformOldUrl (oldObjectArray, config, mapHandler, onsuccess) {
        const result = {
            rulesOfFilters: [],
            selectedAccordions: []
        };
        let apiCallsDone = 0;

        if (!Array.isArray(oldObjectArray)) {
            onsuccess(result);
            return;
        }
        oldObjectArray.forEach(filterObject => {
            const matchingFilter = this.getMatchingFilterFromGroupsOrLayers(filterObject, config?.groups, config?.layers),
                extern = typeof matchingFilter?.filter?.extern === "boolean" ? matchingFilter.filter.extern : false;

            if (matchingFilter.index === -1 || matchingFilter.index === null) {
                return;
            }
            filterObject.layerId = matchingFilter.filter.layerId;
            if (!Array.isArray(filterObject?.rules)) {
                filterObject.rules = [];
            }
            mapHandler.initializeLayer(matchingFilter.filter.api.filterId, matchingFilter.filter.layerId, extern, error => {
                console.warn(error);
            });
            matchingFilter.filter.api.setServiceByLayerModel(matchingFilter.filter.layerId, mapHandler.getLayerModelByFilterId(matchingFilter.filter.api.filterId), extern, error => {
                console.warn(error);
            });
            matchingFilter.filter.api.getAttrTypes(attrTypes => {
                apiCallsDone++;
                this.setResultValues(filterObject, matchingFilter, attrTypes, result);
                if (apiCallsDone === oldObjectArray.length - 1 && typeof onsuccess === "function") {
                    onsuccess(result);
                }
            }, error => {
                console.warn(error);
            });
        },
        error => {
            console.warn(error);
        });
    }
    /**
     * Sets the values for the given result.
     * @param {Object} oldFilter The old filter object to get the old data from.
     * @param {Object} matchingFilter The configured filter to get the base stucture.
     * @param {String[]} attrTypes The attr types for the snippets of the matching filter.
     * @param {Object} result The result object to operate on.
     * @returns {void}
     */
    setResultValues (oldFilter, matchingFilter, attrTypes, result) {
        if (!isObject(oldFilter) || !isObject(matchingFilter) || !isObject(attrTypes) || !isObject(result)) {
            return;
        }
        addSnippetTypes(matchingFilter.filter.snippets, attrTypes);
        addSnippetOperator(matchingFilter.filter.snippets);
        oldFilter.rules.forEach(oldRule => {
            matchingFilter.filter.snippets.forEach((snippet, idx) => {
                Object.assign(oldRule, this.getPreparedRule(oldRule, snippet, idx));
            });
            delete oldRule.values;
            delete oldRule.tagTitle;
        });
        if (Object.prototype.hasOwnProperty.call(oldFilter, "isSelected") && oldFilter.isSelected) {
            result.selectedAccordions.push({
                layerId: oldFilter.layerId,
                filterId: matchingFilter.index
            });
        }
        result.rulesOfFilters[matchingFilter.index] = [];
        oldFilter.rules.forEach(rule => {
            result.rulesOfFilters[matchingFilter.index][rule.snippetId] = rule.value === null ? null : rule;
        });
    }
    /**
     * Gets the matching filter from the groups or layers.
     * @param {Object} filterToMatch The filter to find a matching filter in groups or layers.
     * @param {Object[]} groups The groups from the filter config.
     * @param {Object[]} layers The layers from the filter config.
     * @returns {Object} The matching filter and the index of the found filter => {filter: ..., index: ...}.
     */
    getMatchingFilterFromGroupsOrLayers (filterToMatch, groups, layers) {
        let groupNestedIdx = 0,
            matchingFilterIdx = null,
            matchingFilter = null;

        if (Array.isArray(groups) && groups.length) {
            groups.forEach(group => {
                if (!Array.isArray(group?.layers)) {
                    return;
                }
                group.layers.forEach((configFilter, idx) => {
                    if (configFilter.title === filterToMatch.name) {
                        matchingFilterIdx = idx;
                        matchingFilter = configFilter;
                    }
                    groupNestedIdx += 1;
                });
            });
        }
        if (matchingFilterIdx !== null || !Array.isArray(layers)) {
            return {filter: matchingFilter, index: matchingFilterIdx};
        }
        layers.forEach((configFilter, idx) => {
            if (configFilter.title === filterToMatch.name) {
                matchingFilterIdx = groupNestedIdx ? idx + groupNestedIdx : idx;
                matchingFilter = configFilter;
            }
        });
        return {filter: matchingFilter, index: matchingFilterIdx};
    }
    /**
     * Gets a prepared rule which contains snippetId, fixed, startup, operator and value.
     * @param {Object} rule The old rule.
     * @param {Object} snippet The snippet to get the properties from. I.e. 'operator'.
     * @param {Number} idx The id for the snippetId property.
     * @returns {Object} The prepare rule.
     */
    getPreparedRule (rule, snippet, idx) {
        const preparedRule = rule;

        if (typeof snippet?.attrName === "string" && snippet?.attrName === preparedRule?.attrName
            || Array.isArray(snippet?.attrName)
            && Array.isArray(preparedRule?.attrName)
            && snippet.attrName.length === preparedRule.attrName.length
            && snippet.attrName.every((value, index) => value === preparedRule.attrName[index])) {
            preparedRule.snippetId = idx;
            preparedRule.fixed = false;
            preparedRule.startup = false;
            preparedRule.operator = snippet.operator;
            if (Array.isArray(preparedRule.values)
                && preparedRule.values.length === 1
                && typeof preparedRule.values[0] === "boolean") {
                if (preparedRule.values[0] === true) {
                    preparedRule.value = preparedRule.values[0];
                }
                else {
                    preparedRule.value = null;
                }
            }
            else {
                preparedRule.value = preparedRule.values;
            }
        }
        return preparedRule;
    }
}
