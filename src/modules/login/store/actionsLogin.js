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

        // Erase cookies and local storage items
        OIDC.eraseCookies();

        // Reset all login-related state
        commit("setLoggedIn", false);
        commit("setAccessToken", undefined);
        commit("setRefreshToken", undefined);
        commit("setScreenName", undefined);
        commit("setUsername", undefined);
        commit("setEmail", undefined);
        commit("setIcon", "bi-door-open");
        commit("setName", "common:modules.login.login");

        // Revoke tokens if a revocation endpoint is configured
        if (oidcRevocationEndpoint && token) {
            try {
                OIDC.revokeToken(oidcRevocationEndpoint, oidcClientId, token);
            }
            catch (error) {
                console.error("Error revoking access token:", error);
            }
        }
        if (oidcRevocationEndpoint && refreshToken) {
            try {
                OIDC.revokeToken(oidcRevocationEndpoint, oidcClientId, refreshToken);
            }
            catch (error) {
                console.error("Error revoking refresh token:", error);
            }
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

        // If no token is present, ensure we're in a logged out state
        if (!token) {
            await dispatch("logout");
            return false;
        }

        commit("setAccessToken", token);
        commit("setRefreshToken", refreshToken);

        // Check if token is expired
        if (OIDC.getTokenExpiry(token) < 1) {
            await dispatch("logout");
            return false;
        }

        // Renew token if necessary
        await OIDC.renewTokenIfNecessary(token, refreshToken, config);

        // Update login state
        commit("setLoggedIn", loggedIn);
        commit("setScreenName", Cookie.get("name"));
        commit("setUsername", Cookie.get("username"));
        commit("setEmail", Cookie.get("email"));
        return loggedIn;
    }
};
