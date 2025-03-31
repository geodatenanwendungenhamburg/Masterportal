import Cookie from "../js/utilsCookies";
import OIDC from "../js/utilsOIDC";

export default {
    /**
     * Starts a timer to periodically check if the user is still logged in
     * @param {Object} context the context Vue instance
     * @return {void}
     */
    async setUpTokenRefreshInterval ({dispatch}) {
        // Initial check
        await dispatch("checkLoggedIn");
        // Set up interval periodically check
        setInterval(() => {
            dispatch("checkLoggedIn");
        }, 10_000);
    },

    /**
     * Returns authentication URL
     *
     * @param {Object} context the context Vue instance
     * @return {String} the auth code url
     */
    async getAuthCodeUrl () {
        const oidcAuthorizationEndpoint = Config?.login?.oidcAuthorizationEndpoint || "oidcAuthorizationEndpoint_not_defined_in_config.js",
            oidcClientId = Config?.login?.oidcClientId || "oidcClientId_not_defined_in_config.js",
            oidcRedirectUri = Config?.login?.oidcRedirectUri || "oidcRedirectUri_not_defined_in_config.js",
            oidcScope = Config?.login?.oidcScope || "oidcScope_not_defined_in_config.js",

            url = await OIDC.getAuthCodeUrl(oidcAuthorizationEndpoint, oidcClientId, oidcRedirectUri, oidcScope);

        return url;
    },

    /**
     * Removes all login information from the store and erases all corresponding cookies
     *
     * @param {Object} context the context Vue instance
     * @return {void}
     */
    logout ({commit}) {
        const token = Cookie.get("token"),
            refreshToken = Cookie.get("refresh_token"),
            oidcClientId = Config?.login?.oidcClientId,
            oidcRevocationEndpoint = Config?.login?.oidcRevocationEndpoint;

        OIDC.eraseCookies();

        commit("setLoggedIn", false);
        commit("setAccessToken", undefined);
        commit("setRefreshToken", undefined);
        commit("setScreenName", undefined);
        commit("setUsername", undefined);
        commit("setEmail", undefined);

        if (oidcRevocationEndpoint && token) {
            OIDC.revokeToken(oidcRevocationEndpoint, oidcClientId, token);
        }
        if (oidcRevocationEndpoint && refreshToken) {
            OIDC.revokeToken(oidcRevocationEndpoint, oidcClientId, refreshToken);
        }
    },

    /**
     * Returns true if user is logged in, else false
     * @param {Object} context the context Vue instance
     * @return {Boolean} logged in
     */
    async checkLoggedIn ({commit, dispatch}) {
        const config = Config.login,
            token = Cookie.get("token"),
            refreshToken = Cookie.get("refresh_token"),
            loggedIn = Boolean(token);

        // Set login props immediately based on token presence
        commit("setIcon", loggedIn ? "bi-door-closed" : "bi-door-open");
        commit("setName", loggedIn ? "common:modules.login.logout" : "common:modules.login.login");

        commit("setAccessToken", token);
        commit("setRefreshToken", refreshToken);

        if (OIDC.getTokenExpiry(token) < 1) {
            await dispatch("logout");
            return false;
        }

        await OIDC.renewTokenIfNecessary(token, refreshToken, config);

        commit("setLoggedIn", loggedIn);
        commit("setScreenName", Cookie.get("name"));
        commit("setUsername", Cookie.get("username"));
        commit("setEmail", Cookie.get("email"));
        return loggedIn;
    }
};
