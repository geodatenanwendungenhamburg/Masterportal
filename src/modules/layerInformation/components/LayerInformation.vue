<script>
import LegendSingleLayer from "@modules/legend/components/LegendSingleLayer.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {mapActions as mapPiniaActions, mapState} from "pinia";
import {useLayerInformationStore} from "@modules/layerInformation/store/layerInformationStore.js";
import {isWebLink} from "@shared/js/utils/urlHelper.js";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import {buildMetaURLs} from "@shared/js/utils/metaUrlHelper.js";
import LayerInfoContactButton from "@modules/layerTree/components/LayerInfoContactButton.vue";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

/**
 * The Layer Information that gives the user information, links and the legend for a layer
 * @module modules/layerInformation/components/LayerInformation
 * @vue-data {string} activeTab - The active tab.
 * @vue-computed {boolean} showAdditionalMetaData - Shows if additional meta data should be displayed.
 * @vue-computed {boolean} showCustomMetaData - Shows if custom meta data should be displayed.
 * @vue-computed {boolean} showDownloadLinks - Shows if download lonks should be displayed.
 * @vue-computed {boolean} showUrl - Shows if url should be displayed.
 * @vue-computed {boolean} showAttachFile - Shows if file type needs to be attached for download.
 * @vue-computed {string} layerUrl - The layer URL.
 * @vue-computed {string} legendURL - The legend URL.
 * @vue-computed {string} contact - Contact information from pointOfContact if given otherwise from publisher from meta data information.
 * @vue-computed {boolean} menuIndicator - Returns the menu the LayerInfo module is in.
 * @vue-computed {string} layerName - Name of the layer.
 */
export default {
    name: "LayerInformation",
    components: {
        LegendSingleLayer,
        AccordionItem,
        LayerInfoContactButton,
        NavTab
    },
    data () {
        return {
            activeTab: "layerinfo-legend",
            selectedOption: null,
            dropdownOptions: []
        };
    },
    computed: {
        ...mapGetters(["configJs", "layerConfigById"]),
        ...mapState(useLayerInformationStore, [
            "abstractText",
            "customText",
            "dateCreation",
            "datePublication",
            "dateRevision",
            "downloadLinks",
            "layerInfo",
            "legendAvailable",
            "metaURLs",
            "noMetadataLoaded",
            "periodicityKey",
            "showUrlGlobal",
            "pointOfContact",
            "publisher"
        ]),
        ...mapGetters("Modules/Legend", [
            "layerInfoLegend"
        ]),
        ...mapState(useMenuStore, [
            "mainMenu",
            "secondaryMenu"
        ]),
        ...mapGetters(["restServiceById"]),

        showAdditionalMetaData () {
            return this.layerInfo.metaURL !== null && typeof this.abstractText !== "undefined" && this.abstractText !== this.noMetadataLoaded;
        },
        showCustomMetaData () {
            return this.customText;
        },
        showDownloadLinks () {
            return this.downloadLinks !== null;
        },
        showUrl () {
            if (this.layerInfo.typ?.startsWith("GROUP") && Array.isArray(this.layerInfo.layers)) {
                const selectedLayer = this.layerInfo.layers[this.selectedOption];

                return selectedLayer?.url && this.showUrlGlobal !== false && this.layerInfo.urlIsVisible !== false;
            }
            return this.layerInfo.url && this.layerInfo.typ !== "SensorThings" && this.showUrlGlobal !== false && this.layerInfo.urlIsVisible !== false;
        },
        selectedMetaURLs () {
            if (this.layerInfo.typ?.startsWith("GROUP") && Array.isArray(this.layerInfo.layers)) {
                const selectedLayer = this.layerInfo.layers[this.selectedOption],
                      metaID = selectedLayer?.metaID;

                return buildMetaURLs(metaID, {
                    layerInfo: this.layerInfo,
                    metaDataCatalogueId: this.configJs?.metaDataCatalogueId,
                    restServiceById: this.restServiceById
                });
            }
            return this.metaURLs || [];
        },
        showAttachFile () {
            return this.downloadLinks?.length > 1;
        },
        layerUrl () {
            const layer = this.layerInfo;

            if (layer.typ?.startsWith("GROUP") && layer.layers) {
                const selectedLayer = layer.layers[this.selectedOption];

                return selectedLayer ? this.getLayerAddress(selectedLayer) : "";
            }
            return layer.url ? this.getLayerAddress(layer) : "";
        },
        legendURL  () {
            return this.layerInfo.legendURL;
        },
        layerTyp () {
            if (!this.layerInfo.typ?.startsWith("GROUP")) {
                return `${this.layerInfo.typ}-${this.$t("common:modules.layerInformation.addressSuffix")}`;
            }

            const selectedLayer = this.layerInfo.layers[this.selectedOption];

            if (selectedLayer && selectedLayer.type) {
                return `${selectedLayer.type}-${this.$t("common:modules.layerInformation.addressSuffix")}`;
            }

            return this.$t("common:modules.layerInformation.addressSuffixes");
        },
        contact () {
            return this.pointOfContact || this.publisher || null;
        },
        menuIndicator () {
            return this.mainMenu.currentComponent === "layerInformation"
                ? "mainMenu"
                : "secondaryMenu";
        },
        layerName () {
            return this.menuIndicator === "mainMenu"
                ? this.mainMenu.navigation.currentComponent.props.name
                : this.secondaryMenu.navigation.currentComponent.props.name;
        }
    },

    watch: {
        /**
         * Watches changes to `selectedOption` and updates the layer's abstract information accordingly.
         *
         * @param {number} newIndex - The newly selected layer index.
         */
        selectedOption (newIndex) {
            const metaInfo = this.getMetaInfoForLayer(newIndex);

            this.getAbstractInfo(metaInfo);
        }
    },

    created () {
        this.setConfigParams(this.configJs);

        if (this.layerInfo.typ?.startsWith("GROUP")) {
            this.createDropdownOptions();
        }
    },

    mounted () {
        this.createLegendForLayerInfo(this.layerInfo.id);
        if (!this.legendAvailable) {
            this.activeTab = "LayerInfoDataDownload";
        }
    },

    unmounted () {
        this.setLayerInfoLegend({});
    },

    methods: {
        ...mapPiniaActions(useLayerInformationStore, ["setConfigParams", "additionalSingleLayerInfo", "getAbstractInfo"]),
        ...mapActions("Modules/Legend", ["createLegendForLayerInfo"]),
        ...mapMutations("Modules/Legend", ["setLayerInfoLegend"]),
        ...mapPiniaActions(useMenuStore, ["changeCurrentComponent"]),
        setMetaDataCatalogueId (value) {
            useLayerInformationStore().metaDataCatalogueId = value;
        },

        setSelectedLayerIndex (value) {
            useLayerInformationStore().selectedLayerIndex = value;
        },
        isWebLink,

        /**
         * Creates the dropdown options from the layers and selects the first option.
         * This method maps the `layerInfo.layers` array to create an array of dropdown options,
         * where each option has a `value` (the index of the layer) and a `label` (the name of the layer).
         * If any options are available, the first option is selected by default.
         *
         * @returns {void}
         */
        createDropdownOptions () {
            this.dropdownOptions = this.layerInfo.layers.map((layer, index) => ({
                value: index,
                label: this.$t(layer.name)
            }));

            if (this.dropdownOptions.length > 0) {
                this.selectedOption = this.dropdownOptions[0].value;
            }
        },

        /**
         * Handles the change of the selected layer from the dropdown.
         * Updates the layer information displayed based on the selected layer.
         *
         * @param {Event} event - The change event from the dropdown.
         * @returns {void}
         */
        handleDropdownChange (event) {
            const selectedLayerIndex = event.target.value;

            if (selectedLayerIndex !== -1) {
                this.setSelectedLayerIndex(selectedLayerIndex);
            }
            else {
                console.warn(`Layer not found: ${event.target.label}`);
            }
        },

        /**
         * Retrieves metadata information for a specified layer.
         *
         * @param {number} index - Index of the layer to fetch metadata for.
         * @returns {Object} Metadata for the layer, including:
         *   - {string} metaId - The metadata ID for the layer.
         *   - {string} cswUrl - The CSW URL for the layer.
         *   - {Object} customMetadata - Additional custom metadata for the layer.
         *   - {Object} attributes - Attributes related to the layer.
         */
        getMetaInfoForLayer (index) {
            return {
                metaId: this.layerInfo.layers[index].metaID,
                cswUrl: this.layerInfo.cswUrl,
                customMetadata: this.layerInfo.customMetadata,
                attributes: this.layerInfo.attributes
            };
        },

        /**
         * checks if the given tab name is currently active
         * @param {string} tab the tab name
         * @returns {(boolean|null)}  true if the given tab name is active
         */
        isActiveTab (tab) {
            return this.activeTab === tab ? true : null;
        },

        /**
         * set the current tab id after clicking.
         * @param {Object[]} evt the target of current click event
         * @returns {void}
         */
        setActiveTab (evt) {
            if (!evt || !evt.target) {
                return;
            }

            const activeTab = evt.target.parentElement.getAttribute("value");

            if (!activeTab) {
                return;
            }

            this.activeTab = activeTab;
        },

        /**
         * returns the classnames for the tab
         * @param {string} tab name of the tab depending on property activeTab
         * @returns {string} classNames of the tab
         */
        getTabPaneClasses (tab) {
            return {active: this.isActiveTab(tab), show: this.isActiveTab(tab), "tab-pane": true, fade: true};
        },
        /**
         * Removes slash or questionmark from the end of the url.
         * @param {string} url the url to clean
         * @returns {string} the cleaned URL
         */
        cleanUrl (url) {
            let baseUrl = url.split("?")[0];

            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.slice(0, -1);
            }
            return baseUrl;
        },
        /**
         * Generates a GetCapabilities URL from a given service base address and type vor 2D layers or
         * Appends 'tileset.json' to TileSet3D layers url, if not exists.
         * Appends always 'layer.json' to Terrain3D layers url.
         * @param {Object} param payload
         * @param {string} param.url service base URL
         * @param {string} param.typ service type (e.g., WMS)
         * @returns {string} the created URL
         */
        getLayerAddress (layerInfo) {
            const typ = layerInfo.typ ?? layerInfo.type,
                  config = this.layerConfigById(layerInfo.id);
            let url = config?.origUrl ? config.origUrl : layerInfo.url,
                urlObject = new URL(url, location.href);

            if (typ && typ.toUpperCase() === "TILESET3D") {
                const baseUrl = this.cleanUrl(url);

                // if no json-file is provided in masterportalAPI src/layer/tileset.js "/tileset.json" is appended
                url = baseUrl + (baseUrl.endsWith(".json") ? "" : "/tileset.json");
                urlObject = new URL(url, location.href);
            }
            else if (typ && typ.toUpperCase() === "TERRAIN3D") {
                // terrain layer: in Cesium "/layer.json" is appended to url
                urlObject = new URL(this.cleanUrl(url) + "/layer.json", location.href);
            }
            else if (typ && typ !== "OAF") {
                urlObject.searchParams.set("SERVICE", typ);
                urlObject.searchParams.set("REQUEST", "GetCapabilities");
            }
            return urlObject.href;
        }
    }
};
</script>

<template lang="html">
    <div
        id="modules-layer-information"
    >
        <div
            v-if="layerInfo.typ?.startsWith('GROUP')"
            class="form-floating mb-3"
        >
            <select
                id="layer-selection-dropdown"
                v-model="selectedOption"
                class="form-select"
                @change="handleDropdownChange"
            >
                <option
                    v-for="option in dropdownOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
            <label
                for="layer-selection-dropdown"
            > {{ $t('common:modules.layerInformation.changeLayerInfo') }}</label>
        </div>
        <div
            class="mb-2 abstract layer-info-text"
            v-html="abstractText"
        />
        <br>
        <AccordionItem
            v-if="contact"
            id="layer-info-contact"
            :title="$t('common:modules.layerInformation.pointOfContact')"
            :is-open="false"
            :font-size="'font-size-base'"
            :coloured-header="false"
        >
            <p>
                {{ contact.name }}
            </p>
            <p
                v-for="(positionName) in contact.positionName"
                :key="positionName"
            >
                {{ positionName }}
            </p>
            <p>
                {{ contact.street }}
            </p>
            <p>
                {{ contact.postalCode }} {{ contact.city }}
            </p>
            <a
                :href="'mailto:' + contact.email"
            >
                {{ contact.email }}
            </a>
        </AccordionItem>
        <LayerInfoContactButton
            :layer-name="layerName"
            previous-component="layerInformation"
        />
        <div v-if="selectedMetaURLs.length">
            <p
                v-for="url in selectedMetaURLs"
                :key="url"
                class="float-end"
            >
                <a
                    :href="url"
                    target="_blank"
                >
                    {{ $t("common:modules.layerInformation.additionalMetadata") }}
                </a>
            </p>
        </div>
        <br>
        <br>
        <p v-if="datePublication">
            {{ $t("common:modules.layerInformation.publicationDate") }}: {{ datePublication }}
        </p>
        <p v-if="dateCreation">
            {{ $t("common:modules.layerInformation.creationDate") }}: {{ dateCreation }}
        </p>
        <p v-if="dateRevision">
            {{ $t("common:modules.layerInformation.lastModified") }}: {{ dateRevision }}
        </p>
        <p v-if="periodicityKey">
            {{ $t("common:modules.layerInformation.periodicityTitle") }}: {{ $t(periodicityKey) }}
        </p>
        <template
            v-if="showCustomMetaData"
        >
            <div
                v-for="(key, value) in customText"
                :key="key"
            >
                <p
                    v-if="isWebLink(key)"
                    class="mb-0"
                >
                    {{ value + ": " }}
                    <a
                        :href="value"
                        target="_blank"
                    >{{ key }}</a>
                </p>
                <p
                    v-else
                    class="mb-0"
                >
                    {{ value + ": " + key }}
                </p>
            </div>
        </template>
        <hr>
        <nav role="navigation">
            <ul
                class="nav nav-tabs"
                role="tablist"
            >
                <NavTab
                    v-if="legendAvailable"
                    id="layerinfo-legend-tab"
                    target=""
                    value="layerinfo-legend"
                    :active="isActiveTab('layerinfo-legend') || false"
                    :interaction="setActiveTab"
                    :label="$t('common:modules.layerInformation.legend')"
                />
                <NavTab
                    v-if="showDownloadLinks"
                    id="layerinfo-data-download-tab"
                    target=""
                    value="LayerInfoDataDownload"
                    :active="isActiveTab('LayerInfoDataDownload') || false"
                    :interaction="setActiveTab"
                    :label="$t('common:modules.layerInformation.downloadDataset')"
                />
                <NavTab
                    v-if="showUrl"
                    id="layerinfo-url-tab"
                    target=""
                    value="url"
                    :active="isActiveTab('url') || false"
                    :interaction="setActiveTab"
                    :label="layerTyp"
                />
            </ul>
        </nav>
        <div class="tab-content">
            <div
                v-if="legendAvailable"
                id="layerinfo-legend"
                :class="getTabPaneClasses('layerinfo-legend')"
                :show="isActiveTab('layerinfo-legend')"
            >
                <LegendSingleLayer
                    v-if="legendURL !== 'ignore'"
                    :legend-obj="layerInfoLegend"
                    :selected-layer="selectedOption"
                />
            </div>
            <div
                id="LayerInfoDataDownload"
                class="row"
                :class="getTabPaneClasses('LayerInfoDataDownload')"
                :show="isActiveTab('LayerInfoDataDownload')"
                :type="String('LayerInfoDataDownload')"
            >
                <div class="col-lg-7">
                    <ul
                        v-if="showDownloadLinks"
                        class="pt-5"
                    >
                        <li
                            v-for="downloadLink in downloadLinks"
                            :key="downloadLink.linkName"
                        >
                            <a
                                :href="downloadLink.link"
                                target="_blank"
                            >
                                {{ $t(downloadLink.linkName) }}
                            </a>
                        </li>
                    </ul>
                </div>
                <div
                    v-if="(showAttachFile)"
                    class="col-lg-5 pt-5"
                >
                    <span class="bold">{{ $t(("common:modules.layerInformation.attachFileMessage")) }}</span>
                </div>
            </div>
            <div
                v-if="showUrl"
                id="url"
                :show="isActiveTab('url')"
                :class="getTabPaneClasses('url')"
                :type="String('url')"
            >
                <div
                    class="pt-5"
                >
                    <a
                        v-if="typeof layerUrl === 'string' && layerUrl"
                        :href="layerUrl"
                        target="_blank"
                    >
                        {{ layerUrl }}
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .layer-info-text {
        word-break: break-word;
    }

    :deep(#accordion-container-layer-info-contact) {
        .accordion-button {
            color: $link-color;
            transition: color 0.2s ease;

            &:hover {
                color: $link-hover-color;
            }
        }
    }

    hr {
        margin: 15px 0 10px 0;
    }

    .abstract {
        max-height: 40vH;
        overflow-y: auto;

        :deep(>p) {
            font-size: $font-size-base;
        }
    }

    .nav-tabs {
        border-bottom: 0;
        display: flex;
        flex-wrap: nowrap;

        :deep(>li) {
            font-size: $font-size-base;
        }
    }

    .tab-content {
        .tab-pane {
            >ul {
                >li {
                    >a {
                        font-size: $font-size-base;
                        text-overflow: ellipsis;
                        display: inline-block;
                        max-width: 95%;
                        overflow: hidden;
                    }
                }
            }
        }

        #layerinfo-legend {
            max-width: 95%;
            overflow: auto;
        }
    }

    .mb-2 {
        margin-bottom: 2rem;
    }

    .pt-5 {
        padding-top: 5px;
    }
</style>
