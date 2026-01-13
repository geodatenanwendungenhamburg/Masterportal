import axios from "axios";
import Cookie from "@modules/login/js/utilsCookies.js";

/**
 * Adds interceptors to the different HTTP Get methods of javascript
 *
 * @param {string} interceptorUrlRegex regex to match the urls that shall be eqipped with the bearer token
 * @return {void}
 */
function addInterceptor (interceptorUrlRegex) {
    axios.interceptors.request.use(
        config => {
            const configUrl = typeof config.url === "object" ? config.url.origin : config.url;

            if (!configUrl?.startsWith("http") || (interceptorUrlRegex && configUrl?.match(interceptorUrlRegex))) {
                config.headers.Authorization = `Bearer ${Cookie.get("token")}`;
                config.withCredentials = true;
            }
            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );

    (function (open, setRequestHeader) {
        XMLHttpRequest.prototype._hasAuth = false;

        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
            if (header.toLowerCase() === "authorization" && this._hasAuth) {
                return;
            }

            this._hasAuth = true;
            setRequestHeader.call(this, header, value);
        };

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            const opened = open.call(this, method, url, ...rest),
                urlString = typeof url === "object" ? url.toString() : url;

            if (interceptorUrlRegex && urlString?.match(interceptorUrlRegex)) {
                this.setRequestHeader("Authorization", `Bearer ${Cookie.get("token")}`);
                this.withCredentials = true;
            }

            return opened;
        };
    })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.setRequestHeader);

    const {fetch: originalFetch} = window;

    window.fetch = async (resource, originalConfig) => {
        const href = typeof resource !== "string" ? resource.toString() : resource;

        let config = originalConfig;

        if (interceptorUrlRegex && href?.match(interceptorUrlRegex)) {
            config = {
                ...originalConfig,
                credentials: "include",
                headers: {"Authorization": `Bearer ${Cookie.get("token")}`}
            };
        }

        return originalFetch(resource, config);
    };

}

export default {
    addInterceptor
};
