import Layer2dRaster from "./layer2dRaster.js";
import WMSLayer from "./layer2dRasterWms.js";
import store from "@appstore/index.js";
import handleAxiosResponse from "@shared/js/utils/handleAxiosResponse.js";
import detectIso8601Precision from "@shared/js/utils/detectIso8601Precision.js";
import isNumber from "@shared/js/utils/isNumber.js";

import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Creates a 2d raster layer of type WMSTime.
 * @name Layer2dRasterWmsTime
 * @constructs
 * @extends Layer2dRaster
 * @param {Object} attrs Attributes of the layer.
 * @returns {void}
 */
export default function Layer2dRasterWmsTimeLayer (attrs) {

    const defaults = {
        keyboardMovement: 5,
        time: true
    };

    // call the super-layer
    WMSLayer.call(this, Object.assign(defaults, attrs));
}

// Link prototypes and add prototype methods, means WMSTimeLayer uses all methods and properties of WMSLayer
Layer2dRasterWmsTimeLayer.prototype = Object.create(WMSLayer.prototype);

/**
 * Creates the capabilities url.
 * @param {String} wmsTimeUrl The url of wms time.
 * @param {String} version The version of wms time.
 * @param {String} layers The layers of wms time.
 * @returns {String} the created url
 */
Layer2dRasterWmsTimeLayer.prototype.createCapabilitiesUrl = function (wmsTimeUrl, version, layers) {
    const url = new URL(wmsTimeUrl);

    url.searchParams.set("service", "WMS");
    url.searchParams.set("version", version);
    url.searchParams.set("layers", layers);
    url.searchParams.set("request", "GetCapabilities");
    return url;
};

/**
 * Create a dimension range list.
 * @param {Object} dimensionRange The dimension range.
 * @param {String} dimensionRange.min The minimum value of dimension range.
 * @param {String} dimensionRange.max The maximum value of dimension range.
 * @param {String} dimensionRange.resolution The resolution of dimension range.
 * @returns {String[]} The dimension range list.
 */
Layer2dRasterWmsTimeLayer.prototype.createDimensionRangeList = function (dimensionRange) {
    const {min, max, resolution} = dimensionRange;

    if (min && max && resolution) {
        const increment = this.getIncrementsFromResolution(resolution);

        return this.createTimeRange(min, max, increment);
    }

    console.warn(`The attribute "dimensionRange": ${dimensionRange} is not correctly configured as an object. Ensure that all three attributes, "start", "end", and "range", are configured correctly.`);
    return [];
};

/**
 * Creates an array with ascending values from min to max separated by resolution.
 * @param {String} min Minimum value.
 * @param {String} max Maximum value.
 * @param {Object} increment Distance between each value inside the array.
 * @returns {Object} Steps and step increments.
 */
Layer2dRasterWmsTimeLayer.prototype.createTimeRange = function (min, max, increment) {
    let start = dayjs.utc(min);
    const increments = Object.entries(increment),
        end = dayjs.utc(max),
        timeRange = [],
        format = detectIso8601Precision(min),
        suffix = min.endsWith("Z") ? "Z" : "";

    while (start.valueOf() <= end.valueOf()) {
        timeRange.push(start.format(format) + suffix);
        /* eslint-disable no-loop-func */
        increments.forEach(([units, difference]) => {
            start = start.add(Number(difference), units);
        });
        /* eslint-enable no-loop-func */
    }
    return timeRange;
};

/**
 * Determines the default value from time range.
 * @param {String[]} timeRange Valid points in time for WMS-T.
 * @param {String|Number} extentDefault Default specified by service. Either a specific value from the time range is specified as a string, or a position in the time range is specified as a number.
 * @param {String?} configuredDefault Default specified by config (preferred usage).
 * @returns {String} Default to use.
 */
Layer2dRasterWmsTimeLayer.prototype.determineDefault = function (timeRange, extentDefault, configuredDefault) {
    if (typeof configuredDefault !== "undefined" && configuredDefault !== "current") {
        if (timeRange.includes(configuredDefault)) {
            return configuredDefault;
        }
        else if (isNumber(configuredDefault) && timeRange.at(configuredDefault)) {
            return timeRange.at(configuredDefault);
        }

        console.warn(
            `Configured WMS-T default ${configuredDefault} is not within timeRange:`,
            timeRange,
            "Falling back to WMS-T default value."
        );
    }

    if (configuredDefault === "current" || extentDefault === "current") {
        const now = dayjs(),
            firstGreater = timeRange.findLast(
                timestamp => dayjs(timestamp).diff(now) <= 0
            );

        return firstGreater || timeRange[timeRange.length - 1];
    }

    return extentDefault || timeRange[0];
};

/**
 * Determines the default value of the static dimensions.
 * @param {Object[]} staticDimensions The static dimensions from getCapabilities.
 * @param {Object} timeStaticDimensions The static dimensions from config.
 * @returns {Object} The static dimensions with default values.
 */
Layer2dRasterWmsTimeLayer.prototype.determineStaticDimensions = function (staticDimensions, timeStaticDimensions = {}) {
    const staticDimensionsWithDefaultValue = {};

    staticDimensions.forEach(staticDimension => {
        const timeRange = this.extractExtentValues(staticDimension)?.timeRange,
            configuredDefaultValue = timeStaticDimensions[staticDimension.name],
            defaultValue = this.determineDefault(timeRange, undefined, configuredDefaultValue === true ? undefined : configuredDefaultValue);

        staticDimensionsWithDefaultValue[staticDimension.name.toUpperCase()] = defaultValue;
    });

    return staticDimensionsWithDefaultValue;
};

/**
 * Extracts the values from the time dimensional extent.
 * There are four different cases how the values may be present (as described in the [WMS Specification at Table C.1]{@link http://cite.opengeospatial.org/OGCTestData/wms/1.1.1/spec/wms1.1.1.html#dims.declaring}).
 * They can be determined based on the characters "," and '/'.
 *
 * - CASE 1: Single Value; neither ',' nor '/' are present. The returned Array will have only this value, the step will be 1.
 * - CASE 2: List of multiple values; ',' is present, '/' isn't. The returned array will have exactly these values. The step is dependent on the minimal distances found inside this array.
 * - CASE 3: Interval defined by its lower and upper bounds and its resolution; '/' is present, ',' isn't. The returned Array will cover all values between the lower and upper bounds with a distance of the resolution.
 *         The step is retrieved from the resolution.
 * - Case 4: List of multiple intervals; ',' and '/' are present. For every interval the process described in CASE 3 will be performed.
 *
 * @param {Object} extent Time dimensional extent retrieved from the service.
 * @returns {Object} An object containing the range of possible time values.
 */
Layer2dRasterWmsTimeLayer.prototype.extractExtentValues = function (extent) {
    let step;
    const extentValue = extent.value,
        timeRange = extentValue
            .replaceAll(" ", "")
            .split(",")
            .map(entry => entry.split("/"))
            .map(entry => {
                // CASE 1 & 2
                if (entry.length === 1) {
                    return entry;
                }
                // CASE 3 & 4
                const [min, max, resolution] = entry,
                    increment = this.getIncrementsFromResolution(resolution),
                    singleTimeRange = this.createTimeRange(min, max, increment);

                if (!step || this.incrementIsSmaller(step, increment)) {
                    step = increment;
                }
                return singleTimeRange;
            })
            .flat(1)
            .sort((first, second) => first > second);

    return {
        timeRange: [...new Set(timeRange)], // dedupe
        step
    };
};

/**
 * Filter the dimension range list by time range.
 * @param {String[]} dimensionRangeList The dimension range list.
 * @param {String[]} timeRange The time range.
 * @returns {String[]} The filtered dimension range
 */
Layer2dRasterWmsTimeLayer.prototype.filterDimensionRangeList = function (dimensionRangeList, timeRange) {
    return dimensionRangeList.filter(entry => {
        if (timeRange.includes(entry)) {
            return true;
        }

        console.warn(`The entry: ${entry} is not present in the dimension and has been removed from the dimensionRange!`);
        return false;
    });
};

/**
 * The configured attributes of the dimension range are filtered out of the time range.
 * @param {String[]} timeRange The time range.
 * @param {String|String[]|Object} dimensionRange The configured dimension range.
 * @returns {String[]} The filtered time range.
 */
Layer2dRasterWmsTimeLayer.prototype.filterDimensions = async function (timeRange, dimensionRange) {
    let filteredDimensionRangeList = [],
        dimensionRangeList = dimensionRange;

    if (typeof dimensionRange === "undefined") {
        return timeRange;
    }

    if (typeof dimensionRange === "string") {
        dimensionRangeList = await this.loadDimensionRangeJson(dimensionRange);
    }

    if (typeof dimensionRangeList === "object" && !Array.isArray(dimensionRangeList) && Object.keys(dimensionRangeList).length > 0) {
        dimensionRangeList = this.createDimensionRangeList(dimensionRangeList);
    }

    if (Array.isArray(dimensionRangeList) && dimensionRangeList.length > 0) {
        filteredDimensionRangeList = this.filterDimensionRangeList(dimensionRangeList, timeRange);
    }

    if (filteredDimensionRangeList?.length === 0) {
        filteredDimensionRangeList = timeRange;
        console.error("No valid dimensions could be filtered using the attribute: 'dimensionRange'! The entire dimension of the service is being used.");
    }

    return filteredDimensionRangeList;
};

/**
 * Filters the time range by a regex.
 * @param {String} dimension.dimensionRegex The configured dimension regex.
 * @param {String[]} timeRange The time range.
 * @returns {String[]} The filtered time range
 */
Layer2dRasterWmsTimeLayer.prototype.filterWithDimensionRegex = function (dimensionRegex, timeRange) {
    let dimensionRangeList = timeRange.filter(time => new RegExp(dimensionRegex).test(time));

    if (dimensionRangeList.length === 0) {
        dimensionRangeList = timeRange;
        console.warn("The regular expression returns no matches, therefore the service's dimension range is used!");
    }

    return dimensionRangeList;
};

/**
 * Finds the Element with the given name inside the given HTMLCollection.
 * @param {HTMLCollection} element HTMLCollection to be found.
 * @param {String} nodeName Name of the Element to be searched for.
 * @returns {HTMLCollection} If found, the HTMLCollection with given name, otherwise undefined.
 */
Layer2dRasterWmsTimeLayer.prototype.findNode = function (element, nodeName) {
    return [...element.children].find(el => el.nodeName === nodeName);
};

/**
 * @param {String} resolution in WMS-T format, e.g. "P1900YT5M"; see specification
 * @returns {Object} map of increments for start date
 */
Layer2dRasterWmsTimeLayer.prototype.getIncrementsFromResolution = function (resolution) {
    const increments = {},
        shorthandsLeft = {
            Y: "year",
            M: "month",
            D: "day"
        },
        shorthandsRight = {
            H: "hour",
            M: "minute",
            S: "second"
        },
        [leftHand, rightHand] = resolution.split("T");

    [...leftHand.matchAll(/(\d+)[^0-9]/g)].forEach(([hit, increment]) => {
        increments[shorthandsLeft[hit.slice(-1)]] = increment;
    });

    if (rightHand) {
        [...rightHand.matchAll(/(\d+)[^0-9]/g)].forEach(([hit, increment]) => {
            increments[shorthandsRight[hit.slice(-1)]] = increment;
        });
    }
    return increments;
};

/**
 * Gets additional layer params.
 * Note: The layer's visibility is initially turned off (and thus the loading of the tiles is disabled) because the TIME attribute is filled too late for layer processing due to asynchronous loading of getCapabilities.
 * @param {Object} attrs The attributes of the layer configuration.
 * @returns {Obeject} The layer params.
 */
Layer2dRasterWmsTimeLayer.prototype.getLayerParams = function (attrs) {
    return Object.assign(WMSLayer.prototype.getLayerParams.call(this, attrs), {visible: false});
};

/**
 * Overrides the parent to block OL visibility until the correct TIME parameter has been
 * installed by prepareTimeSliderObject (i.e. GetCapabilities has resolved).
 * This prevents TileLoadErrors caused by tile requests with no or invalid—TIME value.
 * @param {Object} attributes The new attributes.
 * @returns {void}
 */
Layer2dRasterWmsTimeLayer.prototype.updateLayerValues = function (attributes) {
    Layer2dRaster.prototype.updateLayerValues.call(this, {
        ...attributes,
        visibility: this._timeInitialized === true ? attributes.visibility : false
    });
};

/**
 * Gets raw level attributes from parent extended by an attribute TIME.
 * @param {Object} attrs Params of the raw layer.
 * @returns {Object} The raw layer attributes with TIME.
 */
Layer2dRasterWmsTimeLayer.prototype.getRawLayerAttributes = function (attrs) {
    return Object.assign({TIME: this.prepareTime(attrs)}, WMSLayer.prototype.getRawLayerAttributes.call(this, attrs));
};

/**
 * Compares WMS-T resolution increments.
 * @param {Object} step increment to compare to
 * @param {Object} increment increment to consider
 * @returns {Boolean} whether increment is smaller
 */
Layer2dRasterWmsTimeLayer.prototype.incrementIsSmaller = function (step, increment) {
    const compareStrings = [step, increment].map(
        ({years, months, days, minutes, hours, seconds}) => "P" +
            (years || "").padStart(4, "0") + "Y" +
            (months || "").padStart(2, "0") + "M" +
            (days || "").padStart(2, "0") + "D" +
            "T" +
            (minutes || "").padStart(2, "0") + "H" +
            (hours || "").padStart(2, "0") + "M" +
            (seconds || "").padStart(2, "0") + "S"
    );

    return compareStrings[0] > compareStrings[1];
};

/**
 * Load dimension range from a JSON-File.
 * @param {String[]} dimensionRange The dimension range.
 * @returns {Promise<String[]>} A Promise that returns the dimension range attribute from the loaded JSON file.
 */
Layer2dRasterWmsTimeLayer.prototype.loadDimensionRangeJson = async function (dimensionRange) {
    return axios.get(dimensionRange)
        .then(response => handleAxiosResponse(response))
        .then(data => data.dimensionRange)
        .catch(error => {
            console.error(`The file: "${dimensionRange}" could not be loaded. Please ensure that the file is in the correct location and format!`);
            console.error(error);
        });
};

/**
 * Requests the GetCapabilities document and parses the result.
 * @param {String} url The url of wms time.
 * @param {String} version The version of wms time.
 * @param {String} layers The layers of wms time.
 * @returns {Promise} A promise which will resolve the parsed GetCapabilities object.
 */
Layer2dRasterWmsTimeLayer.prototype.requestCapabilities = function (url, version, layers) {
    return axios.get(this.createCapabilitiesUrl(url, version, layers))
        .then(response => handleAxiosResponse(response, "WMS, createLayerSource, requestCapabilities"));
};

/**
 * Retrieves the attributes from the given HTMLCollection and adds the key value pairs to an object.
 * Also retrieves its value.
 * @param {HTMLCollection} node The Collection of values for the time node.
 * @returns {Object} An Object containing the attributes of the time node as well as its value.
 */
Layer2dRasterWmsTimeLayer.prototype.retrieveAttributeValues = function (node) {
    return [...node.attributes]
        .reduce((acc, att) => ({...acc, [att.name]: att.value}), {value: node.innerHTML});
};

/**
 * Prepares the parameters for the WMS-T.
 * This includes creating the range of possible time values, the minimum step between these as well as the initial value set.
 * @param {Object} attrs Attributes of the layer.
 * @throws {Error} Will throw an Error if the given layer is not a valid time layer.
 * @returns {Promise<number>} If the functions resolves, the initial value for the time dimension is returned.
 */
Layer2dRasterWmsTimeLayer.prototype.prepareTime = function (attrs) {
    const time = typeof attrs.time === "object" ? attrs.time : {};

    if (!time.dimensionName) {
        time.dimensionName = "time";
    }

    if (!time.extentName) {
        time.extentName = "time";
    }

    return this.requestCapabilities(attrs.url, attrs.version, attrs.layers)
        .then(xmlCapabilities => {
            const {dimension, extent, staticDimensions} = this.retrieveTimeData(xmlCapabilities, attrs.layers, time),
                timeSource = extent ? extent : dimension;

            if (!timeSource) {
                throw Error(i18next.t("common:modules.core.modelList.layer.wms.invalidTimeLayer", {id: this.id}));
            }
            else if (dimension && dimension.units !== "ISO8601") {
                throw Error(`WMS-T layer ${this.id} specifies time dimension in unit ${dimension.units}. Only ISO8601 is supported.`);
            }
            else {
                const {step, timeRange} = this.extractExtentValues(timeSource);

                return this.filterDimensions(timeRange, time.dimensionRange)
                    .then(filteredTimeRange => this.prepareTimeSliderObject(time, filteredTimeRange, timeSource, staticDimensions, step, attrs));
            }
        })
        .catch(error => {
            console.error(i18next.t("common:modules.wmsTime.layer.errorTimeLayer", {error, id: attrs.id}));
        });
};

/**
 * Prepare the time attributes for time slider and receive the default value.
 * @param {Object} time The time dimension.
 * @param {String[]} filteredTimeRange The filtered time range.
 * @param {Object} timeSource The time source.
 * @param {Object[]} staticDimensions The static dimensions.
 * @param {Object} step The time step.
 * @param {Object} attrs Attributes of the layer.
 * @returns {String} The default value.
 */
Layer2dRasterWmsTimeLayer.prototype.prepareTimeSliderObject = function (time, filteredTimeRange, timeSource, staticDimensions, step, attrs) {
    const filtereTimeRangeByRegex = typeof time.dimensionRegex === "string" ? this.filterWithDimensionRegex(time.dimensionRegex, filteredTimeRange) : filteredTimeRange,
        defaultValue = this.determineDefault(filtereTimeRangeByRegex, timeSource.default, Array.isArray(time.default) ? time.default[0] : time.default),
        defaultValueEnd = time.dualRangeSlider === true && Array.isArray(time.default) && time.default.length >= 2 ? this.determineDefault(filtereTimeRangeByRegex, timeSource.default, time.default[1]) : null,
        staticDimensionsWithDefaultValue = this.determineStaticDimensions(staticDimensions, time.staticDimensions),
        timeData = {
            defaultValue: defaultValue,
            defaultValueEnd: defaultValueEnd,
            step: step,
            timeRange: filtereTimeRangeByRegex,
            staticDimensions: staticDimensionsWithDefaultValue,
            dualRangeSlider: time.dualRangeSlider || false
        };

    attrs.time = {...time, ...timeData};
    timeData.layerId = attrs.id;
    store.commit("Modules/WmsTime/addTimeSliderObject", {keyboardMovement: attrs.keyboardMovement, ...timeData});

    this._timeInitialized = true;
    this.getLayerSource().updateParams({"TIME": defaultValue});
    this.getLayer().setVisible(this.get("visibility") === true);

    return defaultValue;
};

/**
 * If two WMS-T are shown: Remove the layerSwiper; depending if the original layer was closed, update the layer with a new time value.
 * @param {String} layerId The layer id.
 * @returns {void}
 */
Layer2dRasterWmsTimeLayer.prototype.removeLayer = function (layerId) {
    // If the swiper is active, two WMS-T are currently active
    if (store.getters["Modules/WmsTime/timeSlider"].active) {
        if (!layerId.endsWith(store.getters["Modules/WmsTime/layerAppendix"])) {
            store.dispatch("replaceByIdInLayerConfig", {layerConfigs: [{
                id: layerId,
                layer: {
                    visibility: true,
                    showInLayerTree: true
                }
            }]});
        }
        store.dispatch("Modules/WmsTime/toggleSwiper", layerId);
    }
    else {
        store.commit("Modules/WmsTime/setTimeSliderActive", {active: false, currentLayerId: ""});
    }
};

/**
 * Retrieves the configured static dimensions from wms-time layer.
 * @param {String[]} staticDimensionsNames The static dimensions names.
 * @param {HTMLCollection} layerNode The layernode from getCapabilities.
 * @returns {Object[]} The static dimensions.
 */
Layer2dRasterWmsTimeLayer.prototype.retrieveStaticDimensions = function (staticDimensionsNames, layerNode) {
    const staticDimensions = [];

    staticDimensionsNames.forEach(staticDimensionName => {
        const xmlstaticDimension = layerNode.querySelector(`Dimension[name="${staticDimensionName}"]`);

        if (xmlstaticDimension) {
            staticDimensions.push(this.retrieveAttributeValues(xmlstaticDimension));
        }
        else {
            console.warn(`No dimension "${staticDimensionName}" could be found! Please check your configuration.`);
        }
    });

    return staticDimensions;
};

/**
 * Retrieves wmsTime-related entries from GetCapabilities layer specification.
 * @param {String} xmlCapabilities GetCapabilities XML response
 * @param {String} layerName name of layer to use
 * @param {Object} timeSpecification may contain "dimensionName" and "extentName"
 * @returns {Object} dimension, extent and staticDimensions of layer
 */
Layer2dRasterWmsTimeLayer.prototype.retrieveTimeData = function (xmlCapabilities, layerName, timeSpecification) {
    const {dimensionName, extentName} = timeSpecification,
        staticDimensionsNames = typeof timeSpecification.staticDimensions === "object" ? Object.keys(timeSpecification.staticDimensions) : [],
        xmlDocument = new DOMParser().parseFromString(xmlCapabilities, "text/xml"),
        layerNode = [
            ...xmlDocument.querySelectorAll("Layer > Name")
        ].filter(node => node.textContent === layerName)[0].parentNode,
        xmlDimension = layerNode.querySelector(`Dimension[name="${dimensionName}"]`),
        xmlExtent = layerNode.querySelector(`Extent[name="${extentName}"]`),
        dimension = xmlDimension ? this.retrieveAttributeValues(xmlDimension) : null,
        extent = xmlExtent ? this.retrieveAttributeValues(xmlExtent) : null,
        staticDimensions = this.retrieveStaticDimensions(staticDimensionsNames, layerNode);

    return {dimension, extent, staticDimensions};
};

/**
 * Setter for isVisibleInMap and setter for layer.setVisible
 * @param {Boolean} newValue Flag if layer is visible in map
 * @returns {void}
 */
Layer2dRasterWmsTimeLayer.prototype.setIsVisibleInMap = function (newValue) {
    store.commit("Modules/WmsTime/setVisibility", newValue);
    Layer2dRaster.prototype.setIsVisibleInMap.call(this, newValue);
};

/**
 * Updates the time parameter of the WMS-T if the id of the layer is correct.
 * @param {String} id Unique Id of the layer to update.
 * @param {String} newValue New TIME value of the WMS-T.
 * @param {Object} [staticDimensions={}] The static dimensions.
 * @returns {void}
 */
Layer2dRasterWmsTimeLayer.prototype.updateTime = function (id, newValue, newValueEnd = null, staticDimensions = {}) {
    if (id === this.get("id")) {
        const value = newValueEnd !== null ? newValue + "/" + newValueEnd : newValue,
            dimensionParams = {
                "TIME": value,
                ...staticDimensions
            };

        this.getLayerSource().updateParams(dimensionParams);
        this.getLayer().setVisible(true);

        if (store.getters["Modules/GetFeatureInfo/visible"] === true) {
            store.dispatch("Modules/GetFeatureInfo/collectGfiFeatures");
        }
    }
};
