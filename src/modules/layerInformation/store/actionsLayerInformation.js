import store from "@appstore/index.js";
import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import sortBy from "@shared/js/utils/sortBy.js";
import xml2json from "@shared/js/utils/xml2json.js";
import changeCase from "@shared/js/utils/changeCase.js";
import axios from "axios";
import {buildMetaURLs} from "@shared/js/utils/metaUrlHelper.js";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

/**
 * The actions for the layerInformation.
 * @module modules/layerInformation/store/actionsLayerInformation
 */
export default {
    /**
     * Starts drawing layer information. If mobile and menu is closed, menu is opened.
     * @param {Object} layerConf the layer configuration
     * @returns {void}
     */
    startLayerInformation (layerConf) {
        const mdid = layerConf?.datasets?.length > 0 ? layerConf.datasets[0].md_id : null,
            legendAvailable = layerConf.legendURL !== "ignore" && layerConf.legend !== "ignore" && layerConf.legend !== false;
        let name = null;

        if (store.getters.configJs?.metaDataCatalogueId && store.getters.configJs.metaDataCatalogueId !== this.metaDataCatalogueId) {
            this.metaDataCatalogueId = store.getters.configJs.metaDataCatalogueId;
        }

        if (layerConf?.datasets?.length > 0) {
            name = layerConf.datasets[0].md_name;
        }
        if (!name) {
            name = layerConf.name;
        }

        this.legendAvailable = legendAvailable;

        if (legendAvailable && store.getters["Modules/Legend/layerInfoLegend"].id !== layerConf.id) {
            store.commit("Modules/Legend/setLayerInfoLegend", {});
            store.dispatch("Modules/Legend/createLegendForLayerInfo", layerConf.id);
        }

        const menuStore = useMenuStore();

        if (store.getters.isMobile && !menuStore.expanded("mainMenu")) {
            menuStore.toggleMenu("mainMenu");
        }

        menuStore.changeCurrentComponent({
            type: "layerInformation",
            side: "mainMenu",
            props: {name}
        });

        this.setLayerInfo(layerConf);
        this.setMetadataURL(mdid);
        this.additionalSingleLayerInfo();
    },

    /**
     * Sets the layerinfo of the active layer.
     * @param {Object} layerConf The layer configuration.
     * @returns {void}
     */
    setLayerInfo (layerConf) {
        const metaID = layerConf?.datasets?.length > 0 ? layerConf.datasets[0].md_id : null,
            url = layerConf?.url || layerConf?.capabilitiesUrl,
            layers = [];

        let cswUrl = layerConf?.datasets?.[0]?.csw_url ?? null,
            customMetadata = layerConf?.datasets?.[0]?.customMetadata ?? null,
            attributes = layerConf?.datasets?.[0]?.attributes ?? null,
            showDocUrl = layerConf?.datasets?.[0]?.show_doc_url ?? null;

        if (layerConf?.typ?.startsWith("GROUP")) {
            layerConf.children.forEach(child => {
                const childUrl = child.url || child.capabilitiesUrl,
                    dataset = child.datasets?.[0] || {},
                    childMetaID = dataset.md_id || null,
                    childCswUrl = dataset.csw_url || null,
                    childCustomMetadata = dataset.customMetadata || null,
                    childAttributes = dataset.attributes || null,
                    childShowDocUrl = dataset.show_doc_url || null;

                layers.push({
                    name: child.name,
                    type: child.typ,
                    metaID: childMetaID,
                    url: childUrl
                });

                if (child.datasets?.length > 0) {
                    if (!cswUrl) {
                        cswUrl = childCswUrl;
                    }
                    if (!customMetadata) {
                        customMetadata = childCustomMetadata;
                    }
                    if (!attributes) {
                        attributes = childAttributes;
                    }
                    if (!showDocUrl) {
                        showDocUrl = childShowDocUrl;
                    }
                }
            });
        }

        this.layerInfo = {
            cswUrl,
            id: layerConf?.id,
            layername: layerConf?.name,
            showDocUrl,
            typ: layerConf?.typ,
            ...customMetadata && {customMetadata},
            ...attributes && {attributes},
            ...metaID && {metaID},
            ...layers.length > 0 && {layers},
            ...layerConf?.legendURL && {legendURL: layerConf.legendURL},
            ...url && {url},
            ...(layerConf?.urlIsVisible !== undefined) && {urlIsVisible: layerConf?.urlIsVisible},
            ...layerConf?.isExternal && {isExternal: true}
        };
    },

    /**
     * Retrieves layer metadata that is not yet in the store but is saved in the layerInfo object.
     * @returns {void}
     */
    async additionalSingleLayerInfo () {
        let metaId;

        if (Array.isArray(this.layerInfo.metaID) && this.layerInfo.metaID.length > 0) {
            if (this.selectedLayerIndex < this.layerInfo.metaID.length) {
                metaId = this.layerInfo.metaID[this.selectedLayerIndex];
            }
            else {
                metaId = this.layerInfo.metaID[0];
            }
        }
        else if (typeof this.layerInfo.metaID === "string") {
            metaId = this.layerInfo.metaID;
        }
        else {
            metaId = null;
        }

        const cswUrl = this.layerInfo.cswUrl,
            customMetadata = this.layerInfo.customMetadata,
            attributes = this.layerInfo.attributes,
            metaInfo = {metaId, cswUrl, customMetadata, attributes};

        this.getAbstractInfo(metaInfo);
    },

    /**
     * Sets all the abstract Infos for the layer.
     * @param {Object} metaInfo the metaInformation that is necessary
     * @returns {void}
     */
    async getAbstractInfo (metaInfo) {
        let metadata;

        this.downloadLinks = null;

        if (metaInfo.cswUrl && typeof metaInfo.metaId !== "undefined" && metaInfo.metaId !== null) {
            try {
                metadata = await getCswRecordById.getRecordById(metaInfo.cswUrl, metaInfo.metaId);
            }
            catch (error) {
                console.error(i18next.t("common:modules.layerInformation.noMetadataLoadedConsole"));
            }
        }
        // use default csw_url from rest-services.json if csw_url not stated in the specific service
        else if (Config.cswId !== null && typeof Config.cswId !== "undefined") {
            const service = store.getters.restServiceById(Config.cswId);
            let metaURL = "";

            this.customText = null;

            if (service === undefined) {
                console.warn("Rest Service with the ID " + Config.cswId + " is not configured in rest-services.json!");
            }
            else {
                metaURL = service.url;
            }

            if (metaURL !== "" && typeof metaInfo.metaId !== "undefined") {
                metadata = await getCswRecordById.getRecordById(metaURL, metaInfo.metaId);
            }
        }
        else if (metaInfo.customMetadata) {
            const metadataAsJson = await axios.get(metaInfo.cswUrl)
                .then(response => xml2json(response.request.responseXML));

            metadata = getCswRecordById.getMetadata(metadataAsJson);
            this.getCustomMetaData({
                attributes: metaInfo.attributes,
                metadataAsJson
            });
        }

        if (typeof metadata === "undefined") {
            this.title = "";
            this.periodicityKey = "";
            this.datePublication = "";
            this.abstractText = i18next.t("common:modules.layerInformation.noMetadataLoaded");
            this.noMetadataLoaded = i18next.t("common:modules.layerInformation.noMetadataLoaded");
            this.pointOfContact = "";
            this.publisher = "";
            this.dateRevision = "";
        }
        else {
            this.title = metadata?.getTitle();
            this.abstractText = metadata?.getAbstract();
            this.periodicityKey = metadata?.getFrequenzy();
            this.downloadLinks = metadata?.getDownloadLinks();
            this.datePublication = metadata?.getPublicationDate();
            this.dateCreation = metadata?.getCreationDate();
            this.pointOfContact = metadata?.getContact();
            this.publisher = metadata?.getPublisher();
            this.dateRevision = metadata?.getRevisionDate();
        }

        if (this.downloadLinks) {
            const downloadLinks = [];

            this.downloadLinks.forEach(link => {
                downloadLinks.push(link);
            });

            this.downloadLinks = sortBy(downloadLinks, "linkName");
        }
    },

    /**
     * Get metadata from path declared in the service configuration.
     * @param {Object} payload object of attributes with paths to metadata information and metadata as json
     * @returns {void}
     */
    getCustomMetaData (payload) {
        const customMetadata = Object.entries(payload.attributes).map(([key, value]) => {
                return {[key]: value.split(".").reduce((o, i) => o[i], payload.metadataAsJson).getValue()};
            }),
            singleObjectCustomMetadata = {};

        for (let i = 0; i < customMetadata.length; i++) {
            Object.assign(singleObjectCustomMetadata, customMetadata[i]);
        }

        this.customText = singleObjectCustomMetadata;
    },

    /**
     * Checks the array of metaIDs and creates array metaURL with complete URL for template.
     * Does not allow duplicated entries.
     * @param {Object} metaId the given metaId for one layer
     * @returns {void}
     */
    setMetadataURL (metaId) {
        const metaURLs = buildMetaURLs(metaId, {
            layerInfo: this.layerInfo,
            metaDataCatalogueId: this.metaDataCatalogueId,
            restServiceById: store.getters.restServiceById
        });

        this.metaURLs = metaURLs;
    },

    /**
     * Set Parameters from configuration.
     * @param {Object} config Configuration
     * @returns {void}
     */
    setConfigParams (config) {
        if (config.layerInformation !== undefined && config.layerInformation.showUrlGlobal !== null) {
            this.showUrlGlobal = config.layerInformation.showUrlGlobal;
        }
        else if (config.layerInformation === undefined) {
            this.showUrlGlobal = undefined;
        }
    },

    /**
     * Restores the layer info from urlParams.
     * @param {Object} attributes of urlParams
     * @returns {void}
     */
    restoreFromUrlParams (attributes) {
        const componentName = changeCase.upperFirst(this.type),
            layerId = attributes.layerInfo.id,
            layerConfig = store.getters.layerConfigById(layerId);

        useMenuStore().updateComponentState({
            type: componentName,
            attributes
        });

        if (store.getters.styleListLoaded) {
            this.startLayerInformation(layerConfig);
        }
        else {
            this.waitAndRestoreLayerInformation(layerConfig);
        }
    },

    /**
     * Waits for loading finished of styleList and restores the layer information.
     * @param {Object} layerConfig to restore the info of
     * @returns {void}
     */
    waitAndRestoreLayerInformation (layerConfig) {
        store.watch((state, getters) => getters.styleListLoaded, value => {
            if (value) {
                this.startLayerInformation(layerConfig);
            }
        });
    }
};
