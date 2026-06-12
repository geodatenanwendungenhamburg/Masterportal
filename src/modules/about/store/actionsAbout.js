import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import packageJson from "../../../../package.json";
import store from "@appstore/index.js";

/**
 * Finds the "about" config object in the portal config menu sections.
 * @param {Object} portalConfig The portal config object.
 * @returns {Object|undefined} The about config or undefined.
 */
function findAboutConfig (portalConfig) {
    if (!portalConfig) {
        return undefined;
    }
    const menus = [portalConfig.mainMenu, portalConfig.secondaryMenu];

    for (const menu of menus) {
        if (!menu?.sections) {
            continue;
        }
        for (const section of menu.sections) {
            if (!Array.isArray(section)) {
                continue;
            }
            const found = findInElements(section);

            if (found) {
                return found;
            }
        }
    }
    return undefined;
}

/**
 * Recursively searches elements (including folders) for the about config.
 * @param {Object[]} elements Array of menu elements.
 * @returns {Object|undefined} The about config or undefined.
 */
function findInElements (elements) {
    for (const element of elements) {
        if (element.type === "about") {
            return element;
        }
        if (element.type === "folder" && Array.isArray(element.elements)) {
            const found = findInElements(element.elements);

            if (found) {
                return found;
            }
        }
    }
    return undefined;
}

/**
 * The actions for the About module (Pinia).
 * These are bound to the store instance via `this`.
 * @module modules/About/actions
 */
export default {
    /**
     * Loads the about config from the portalConfig and patches the store state.
     * @returns {void}
     */
    loadConfigFromPortalConfig () {
        const portalConfig = store.state?.portalConfig,
            aboutConfig = findAboutConfig(portalConfig);

        if (aboutConfig) {
            const patch = {};

            for (const key of Object.keys(this.$state)) {
                if (key in aboutConfig && aboutConfig[key] !== undefined) {
                    patch[key] = aboutConfig[key];
                }
            }
            this.$patch(patch);
        }
    },

    /**
     * Set all info for the portal from CSW metadata.
     * @returns {void}
     */
    async initializeAboutInfo () {
        this.loadConfigFromPortalConfig();
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
            const service = store.getters.restServiceById(Config.cswId);
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
     * Sets the current Masterportal version number.
     * @returns {void}
     */
    currentMasterportalVersionNumber () {
        this.version = this.version === true ? packageJson.version : this.version;
    }
};
