import processUrlParams from "@shared/js/utils/processUrlParams.js";

/**
 * Examples:
 * - https://localhost:9001/portal/master/?configjson=../basic/config.json
 * - https://localhost:9001/portal/master/?configjs=../layer/config.js
 * - https://localhost:9001/portal/master/?lng=en&STYLE=simple
 */

const globalUrlParams = {
        CONFIGJSON: setConfigJsonPath,
        LNG: setLanguage,
        UISTYLE: setUiStyle
    },
    legacyGlobalUrlParams = {
        CONFIG: setConfigJsonPath,
        STYLE: setUiStyle
    };

/**
 * Process the menu url params.
 * @returns {void}
 */
function processGlobalUrlParams () {
    processUrlParams(globalUrlParams, legacyGlobalUrlParams);
}

/**
 * Sets the config.json path to the config.js.
 * @param {Object} params The found params.
 * @returns {void}
 */
function setConfigJsonPath (params) {
    Config.portalConf = params.CONFIGJSON || params.CONFIG;
}

/**
 * Sets the langugage to the config.js.
 * @param {Object} params The found params.
 * @returns {void}
 */
function setLanguage (params) {
    i18next.changeLanguage(params.LNG);
}

/**
 * Sets the ui style to the config.js.
 * @param {Object} params The found params.
 * @returns {void}
 */
function setUiStyle (params) {
    Config.uiStyle = params.UISTYLE || params.STYLE;
}

/**
 * Returns the value of urlParam key 'configjs' appended to windows location.
 * @returns {String} the path to the 'configjs' given as urlParam or null if not found
 */
function getConfigJsPath () {
    let configPath = null;

    new URLSearchParams(window.location.search).forEach((value, key) => {
        if (key.toLowerCase().localeCompare("configjs") === 0) {
            if (value.startsWith("https://")) {
                configPath = value;
            }
            else {
                const strippedLocation = window.location.href.split("?").shift();

                configPath = strippedLocation.substring(0, strippedLocation.lastIndexOf("/") + 1) + value;
            }
        }
    });
    return configPath;
}

export default {
    getConfigJsPath,
    processGlobalUrlParams
};
