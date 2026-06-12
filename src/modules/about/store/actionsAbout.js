import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import packageJson from "../../../../package.json";

/**
 * Pinia actions for the About module.
 * These are bound to the store instance via `this`.
 * @module modules/About/actions
 */
export default {
    /**
     * Applies portal configuration to this store.
     * @param {Object} config - The configuration object from portalConfig menu sections.
     * @returns {void}
     */
    applyConfig (config) {
        if (config && typeof config === "object") {
            this.$patch(config);
        }
    },

    /**
     * Set all info for the portal from CSW metadata.
     * @param {Object} [options] - Optional dependencies.
     * @param {Function} [options.restServiceById] - Function to resolve rest service by ID.
     * @returns {void}
     */
    async initializeAboutInfo ({restServiceById} = {}) {
        let metadata;

        if (this.cswUrl && this.metaId) {
            try {
                metadata = await getCswRecordById.getRecordById(this.cswUrl, this.metaId);
            }
            catch (e) {
                console.warn("CSW request failed:", e);
            }
        }
        else if (Config.cswId && typeof this.metaId !== "undefined") {
            const service = restServiceById?.(Config.cswId);
            let metaURL = "";

            if (!service) {
                console.warn("Rest Service with the ID " + Config.cswId + " is not configured in rest-services.json!");
            }
            else {
                metaURL = service.url;
            }

            if (metaURL && this.metaId) {
                try {
                    metadata = await getCswRecordById.getRecordById(metaURL, this.metaId);
                }
                catch (e) {
                    console.warn("CSW fallback request failed:", e);
                }
            }
        }

        if (typeof metadata !== "undefined") {
            this.title = metadata?.getTitle();
            this.abstractText = metadata?.getAbstract();
            if (metadata?.getContact()) {
                this.contact = metadata?.getContact();
            }
            else {
                this.contact = metadata?.getPublisher();
            }
        }

        this.currentMasterportalVersionNumber();
    },

    /**
     * Sets current Masterportal Version Number from package.json or state.
     * @returns {void}
     */
    currentMasterportalVersionNumber () {
        this.version = this.version === true ? packageJson.version : this.version;
    }
};
