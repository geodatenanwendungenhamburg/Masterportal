/**
 * Checks if the user has to log in to show the given layer.
 * This is the case, if the layer is secured, the portal uses the login and the user is not logged in.
 * Portals without a configured login are not affected, as their secured layers may be authorized otherwise.
 * @param {Object} layerConf the configuration of the layer.
 * @param {Object} configJs the config.js of the portal.
 * @param {Boolean} loggedIn true, if the user is logged in.
 * @returns {Boolean} true, if the user has to log in to show the layer.
 */
export default function isLoginRequired (layerConf, configJs, loggedIn) {
    return Boolean(layerConf?.isSecured && configJs?.login && !loggedIn);
}
