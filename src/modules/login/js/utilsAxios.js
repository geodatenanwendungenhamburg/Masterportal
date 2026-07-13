import axios from "axios";
import utilsUrl from "@modules/login/js/utilsUrl.js";

/**
 * Adds interceptors to the different HTTP Get methods of javascript
 *
 * @param {string|RegExp} interceptorUrlRegex regex to match the urls that shall be equipped with the bearer token
 * @param {boolean} [disableCredentials=false] disables sending credentials for intercepted requests
 * @return {void}
 */
function addInterceptor (interceptorUrlRegex, disableCredentials = false) {
    if (!interceptorUrlRegex) {
        return;
    }

    axios.interceptors.request.use(
        config => {
            if (!utilsUrl.shouldAddToken(config.url, interceptorUrlRegex)) {
                return config;
            }

            return utilsUrl.getAuthToken(config, !disableCredentials);
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
            const opened = open.call(this, method, url, ...rest);

            if (!utilsUrl.shouldAddToken(url, interceptorUrlRegex)) {
                return opened;
            }

            const tokenHeader = utilsUrl.getTokenHeader();

            if (tokenHeader) {
                this.setRequestHeader("Authorization", tokenHeader);

                if (!disableCredentials) {
                    this.withCredentials = true;
                }
            }

            return opened;
        };
    })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.setRequestHeader);

    const {fetch: originalFetch} = window;

    window.fetch = async (resource, originalConfig) => {
        if (!utilsUrl.shouldAddToken(resource, interceptorUrlRegex)) {
            return originalFetch(resource, originalConfig);
        }

        const config = {
            ...originalConfig,
            headers: originalConfig?.headers || {}
        };

        if (!disableCredentials) {
            config.credentials = "include";
        }

        const configWithAuth = utilsUrl.getAuthToken(config, !disableCredentials);

        return originalFetch(resource, configWithAuth);
    };

}

export default {
    addInterceptor
};
