import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import packageJson from "../../../../package.json";

/**
 * The actions for the About store.
 *
 * @module modules/About/store/actionsAbout
 */
export default {
    /**
     * Loads the portal metadata and sets the title, abstract text and
     * contact information.
     *
     * If no CSW URL is configured directly in the About module, the
     * globally configured CSW service is used.
     *
     * @returns {Promise<void>}
     */
    async initializeAboutInfo () {
        let metadata;

        if (this.cswUrl && this.metaId) {
            try {
                metadata = await getCswRecordById.getRecordById(
                    this.cswUrl,
                    this.metaId
                );
            }
            catch (error) {
                console.warn("CSW request failed:", error);
            }
        }
        else if (Config.cswId && this.metaId) {
            const {default: store} = await import("../../../app-store/index.js"),
                service = store.getters.restServiceById(Config.cswId);

            if (!service) {
                console.warn(
                    `Rest Service with the ID ${Config.cswId} ` +
                    "is not configured in rest-services.json!"
                );
            }
            else if (service.url) {
                try {
                    metadata = await getCswRecordById.getRecordById(
                        service.url,
                        this.metaId
                    );
                }
                catch (error) {
                    console.warn(
                        "CSW fallback request failed:",
                        error
                    );
                }
            }
        }

        if (metadata) {
            this.title = metadata.getTitle?.() ?? "";
            this.abstractText = metadata.getAbstract?.() ?? "";
            this.contact = metadata.getContact?.()
                ?? metadata.getPublisher?.()
                ?? null;
        }

        this.currentMasterportalVersionNumber();
    },

    /**
     * Sets the current Masterportal version from package.json if the version
     * property is configured with the boolean value true.
     *
     * @returns {void}
     */
    currentMasterportalVersionNumber () {
        if (this.version === true) {
            this.version = packageJson.version;
        }
    }
};
