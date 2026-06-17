import Cookie from "@modules/login/js/utilsCookies.js";

/**
 * Checks if the given URL matches the specified pattern (string or regex).
 *
 * @param {string} url - The URL to be checked.
 * @param {string|RegExp} pattern - The pattern to match against the URL.
 * @returns {boolean} - Returns true if the URL matches the pattern, otherwise false.
 */
function isUrlMatchingRegex (url, pattern) {
    const urlString = typeof url === "string" ? url : url.toString();

    if (!pattern) {
        return false;
    }

    try {
        return urlString.match(pattern) !== null;
    }
    catch {
        return false;
    }
}

/**
 * Checks if the given URL is an absolute URL.
 *
 * @param {string} url - The URL to be checked.
 * @returns {boolean} - Returns true if the URL is absolute.
 */
function isAbsoluteUrl (url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}

/**
 * Determines if a URL should have an authentication token added.
 * Relative URLs always get the token, absolute URLs only if they match the regex.
 *
 * @param {string} url - The URL to check.
 * @param {RegExp} regex - The pattern to match for absolute URLs.
 * @returns {boolean} - True if the URL should have authentication.
 */
function shouldAddToken (url, regex) {
    if (!regex) {
        return false;
    }

    if (!isAbsoluteUrl(url)) {
        return true;
    }

    return isUrlMatchingRegex(url, regex);
}

/**
 * Gets the authorization token as Bearer string.
 *
 * @returns {string|null} The Bearer token or null if not available.
 */
function getTokenHeader () {
    const token = Cookie.get("token");

    if (!token) {
        console.warn("No authentication token found in cookies");
        return null;
    }

    return `Bearer ${token}`;
}

/**
 * Adds authentication token to a config object.
 *
 * @param {object} config - The config object (axios or fetch).
 * @returns {object} - The config with Authorization header.
 */
function getAuthToken (config) {
    const tokenHeader = getTokenHeader();

    if (!tokenHeader) {
        return config;
    }

    if (!config.headers) {
        config.headers = {};
    }

    config.headers.Authorization = tokenHeader;
    config.withCredentials = true;

    return config;
}

export default {
    isUrlMatchingRegex,
    isAbsoluteUrl,
    shouldAddToken,
    getAuthToken,
    getTokenHeader
};

