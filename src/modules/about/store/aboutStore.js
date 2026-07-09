import {defineStore} from "pinia";
import actionsAbout from "./actionsAbout.js";
import gettersAbout from "./gettersAbout.js";

/**
 * @module modules/About/store/aboutStore
 * @typedef {Object} AboutState
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon Icon next to the module name.
 * @property {String} name Name of this module.
 * @property {String} menuSide Specifies in which menu the About module should be rendered.
 * @property {String} type The module type.
 * @property {String} abstractText The abstract information text.
 * @property {Object|null} contact The metadata contact.
 * @property {String} cswUrl The CSW metadata URL.
 * @property {String} logo The Masterportal logo.
 * @property {String} logoLink The link behind the Masterportal logo.
 * @property {String} logoText The alternative text for the Masterportal logo.
 * @property {String} metaDataCatalogueId ID of the metadata catalogue.
 * @property {String} metaId ID of the metadata record.
 * @property {String} metaUrl The metadata URL.
 * @property {String} noMetadataLoaded Text shown when no metadata is loaded.
 * @property {Boolean} showAdditionalMetaData Whether to show the additional metadata link.
 * @property {String} title The metadata title.
 * @property {String|Boolean} version The current Masterportal version or true to use the package version.
 * @property {String} versionLink The link behind the Masterportal version.
 * @property {String} ustId The sales tax identification number.
 * @property {String} privacyStatementText Text for the data privacy section.
 * @property {String} privacyStatementUrl URL of the data privacy policy.
 * @property {String} accessibilityText Text for the accessibility section.
 * @property {String} accessibilityUrl URL of the accessibility statement.
 * @property {Boolean} hideImprintInFooter Whether to hide the imprint link in the footer.
 */

/**
 * Pinia store for the About module.
 *
 * @returns {AboutState} The About store.
 */
export const useAboutStore = defineStore("about", {
    state: () => ({
        description: "common:modules.about.description",
        icon: "bi-info-circle",
        name: "common:modules.about.name",
        menuSide: "mainMenu",
        type: "about",
        abstractText: "",
        contact: null,
        cswUrl: "",
        logo: `${MASTERPORTAL_ASSETS_PATH}/Logo_Masterportal.svg`,
        logoLink: "https://masterportal.org",
        logoText: "Masterportallogo",
        metaDataCatalogueId: "2",
        metaId: "",
        metaUrl: "",
        noMetadataLoaded: "",
        showAdditionalMetaData: true,
        title: "",
        version: true,
        versionLink: "https://bitbucket.org/geowerkstatt-hamburg/masterportal/downloads/",
        ustId: "",
        privacyStatementText: "",
        privacyStatementUrl: "",
        accessibilityText: "",
        accessibilityUrl: "",
        hideImprintInFooter: false
    }),

    getters: {
        ...gettersAbout
    },

    actions: {
        ...actionsAbout
    }
});
