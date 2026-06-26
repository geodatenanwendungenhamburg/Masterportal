import {defineStore} from "pinia";
import {ref, computed} from "vue";
import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import packageJson from "../../../../package.json";

/**
 * Pinia store for the About module.
 * Provides portal metadata, contact, version, and legal information.
 */
export const useAboutStore = defineStore("about", () => {
    // --- State ---
    const description = ref("common:modules.about.description");
    const icon = ref("bi-info-circle");
    const name = ref("common:modules.about.name");
    const menuSide = ref("mainMenu");
    const type = ref("about");

    const abstractText = ref("");
    const contact = ref(null);
    const cswUrl = ref("");
    const logo = ref(`${MASTERPORTAL_ASSETS_PATH}/Logo_Masterportal.svg`);
    const logoLink = ref("https://masterportal.org");
    const logoText = ref("Masterportallogo");
    const metaDataCatalogueId = ref("2");
    const metaId = ref("");
    const metaUrl = ref("");
    const noMetadataLoaded = ref("");
    const showAdditionalMetaData = ref(true);
    const title = ref("");
    const version = ref(true);
    const versionLink = ref("https://bitbucket.org/geowerkstatt-hamburg/masterportal/downloads/");
    const ustId = ref("");
    const privacyStatementText = ref("");
    const privacyStatementUrl = ref("");
    const accessibilityText = ref("");
    const accessibilityUrl = ref("");
    const hideImprintInFooter = ref(false);

    // --- Getters ---
    const hasMetaUrl = computed(() => metaUrl.value.length > 0);

    // --- Actions ---

    /**
     * Fetches portal metadata from a CSW service and sets title, abstract, and contact.
     * Falls back to the global Config.cswId if no specific cswUrl is configured.
     * @returns {void}
     */
    async function initializeAboutInfo () {
        let metadata;

        if (cswUrl.value && metaId.value) {
            try {
                metadata = await getCswRecordById.getRecordById(cswUrl.value, metaId.value);
            }
            catch (e) {
                console.warn("CSW request failed:", e);
            }
        }
        else if (Config.cswId && typeof metaId.value !== "undefined") {
            const {default: store} = await import("../../../app-store/index.js"),
                service = store.getters.restServiceById(Config.cswId);
            let metaURL = "";

            if (!service) {
                console.warn("Rest Service with the ID " + Config.cswId + " is not configured in rest-services.json!");
            }
            else {
                metaURL = service.url;
            }

            if (metaURL && metaId.value) {
                try {
                    metadata = await getCswRecordById.getRecordById(metaURL, metaId.value);
                }
                catch (e) {
                    console.warn("CSW fallback request failed:", e);
                }
            }
        }

        if (typeof metadata !== "undefined") {
            title.value = metadata?.getTitle();
            abstractText.value = metadata?.getAbstract();
            if (metadata?.getContact()) {
                contact.value = metadata?.getContact();
            }
            else {
                contact.value = metadata?.getPublisher();
            }
        }

        currentMasterportalVersionNumber();
    }

    /**
     * Sets the current Masterportal version number from package.json or keeps a custom version string.
     * @returns {void}
     */
    function currentMasterportalVersionNumber () {
        version.value = version.value === true ? packageJson.version : version.value;
    }

    /**
     * Merges the module configuration (from config.json) into the store state.
     * Only known state keys are applied. This replaces the former Vuex
     * fetchFirstModuleConfig/state-merge mechanism for this module.
     * @param {Object} config The module config object from config.json.
     * @returns {void}
     */
    function initialize (config) {
        if (!config || typeof config !== "object") {
            return;
        }
        const refs = {
            description, icon, name, menuSide,
            abstractText, contact, cswUrl, logo, logoLink, logoText,
            metaDataCatalogueId, metaId, metaUrl, noMetadataLoaded,
            showAdditionalMetaData, title, version, versionLink, ustId,
            privacyStatementText, privacyStatementUrl, accessibilityText,
            accessibilityUrl, hideImprintInFooter
        };

        Object.entries(config).forEach(([key, value]) => {
            if (key !== "type" && Object.prototype.hasOwnProperty.call(refs, key)) {
                refs[key].value = value;
            }
        });
    }

    return {
        // state
        description,
        icon,
        name,
        menuSide,
        type,
        abstractText,
        contact,
        cswUrl,
        logo,
        logoLink,
        logoText,
        metaDataCatalogueId,
        metaId,
        metaUrl,
        noMetadataLoaded,
        showAdditionalMetaData,
        title,
        version,
        versionLink,
        ustId,
        privacyStatementText,
        privacyStatementUrl,
        accessibilityText,
        accessibilityUrl,
        hideImprintInFooter,

        // getters
        hasMetaUrl,

        // actions
        initialize,
        initializeAboutInfo,
        currentMasterportalVersionNumber
    };
});
