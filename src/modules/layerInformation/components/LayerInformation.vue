<script>
import LegendSingleLayer from "../../legend/components/LegendSingleLayer.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {isWebLink} from "../../../shared/js/utils/urlHelper";
import AccordionItem from "../../../shared/modules/accordion/components/AccordionItem.vue";
import LayerInfoContactButton from "../../layerTree/components/LayerInfoContactButton.vue";

/**
 * The Layer Information that gives the user information, links and the legend for a layer
 * @module modules/layerInformation/components/LayerInformation
 * @vue-data {String} activeTab - The active tab.
 * @vue-computed {Boolean} showAdditionalMetaData - Shows if additional meta data should be displayed.
 * @vue-computed {Boolean} showCustomMetaData - Shows if custom meta data should be displayed.
 * @vue-computed {Boolean} showPublication - Shows if publication should be displayed.
 * @vue-computed {Boolean} showRevision - Determines if the revision date should be displayed.
 * @vue-computed {Boolean} showPeriodicity - Shows if periodicity should be displayed.
 * @vue-computed {Boolean} showDownloadLinks - Shows if download lonks should be displayed.
 * @vue-computed {Boolean} showUrl - Shows if url should be displayed.
 * @vue-computed {Boolean} showAttachFile - Shows if file type needs to be attached for download.
 * @vue-computed {String} layerUrl - The layer URL.
 * @vue-computed {String} legendURL - The legend URL.
 * @vue-computed {String} contact - Contact information from pointOfContact if given otherwise from publisher from meta data information.
 * @vue-computed {Boolean} menuIndicator - Returns the menu the LayerInfo module is in.
 * @vue-computed {String} layerName - Name of the layer.
 */
export default {
    name: "LayerInformation",
    components: {
        LegendSingleLayer,
        AccordionItem,
        LayerInfoContactButton
    },
    data () {
        return {
            activeTab: "layerinfo-legend",
            selectedOption: null,
            dropdownOptions: []
        };
    },
    computed: {
        ...mapGetters(["configJs"]),
        ...mapGetters("Modules/LayerInformation", [
            "abstractText",
            "customText",
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
        ...mapGetters("Menu", [
            "mainMenu",
            "secondaryMenu"
        ]),
        showAdditionalMetaData () {
            return this.layerInfo.metaURL !== null && typeof this.abstractText !== "undefined" && this.abstractText !== this.noMetadataLoaded;
        },
        showCustomMetaData () {
            return this.customText;
        },
        showPublication () {
            return typeof this.datePublication !== "undefined" && this.datePublication !== null && this.datePublication !== "";
        },
        showRevision () {
            return typeof this.dateRevision !== "undefined" && this.dateRevision !== null && this.dateRevision !== "";
        },
        showPeriodicity () {
            return this.periodicityKey !== "" && this.periodicityKey !== null && this.periodicityKey !== undefined;
        },
        showDownloadLinks () {
            return this.downloadLinks !== null;
        },
        showUrl () {
            if (this.layerInfo.typ === "GROUP" && Array.isArray(this.layerInfo.layers)) {
                const selectedLayer = this.layerInfo.layers[this.selectedOption];

                return selectedLayer?.url && this.showUrlGlobal !== false && this.layerInfo.urlIsVisible !== false;
            }
            return this.layerInfo.url && this.layerInfo.typ !== "SensorThings" && this.showUrlGlobal !== false && this.layerInfo.urlIsVisible !== false;
        },
        showAttachFile () {
            return this.downloadLinks?.length > 1;
        },
        layerUrl () {
            const layer = this.layerInfo;

            if (layer.typ === "GROUP" && layer.layers) {
                const selectedLayer = layer.layers[this.selectedOption];

                return selectedLayer ? this.getGetCapabilitiesUrl(selectedLayer) : "";
            }
            return layer.url ? this.getGetCapabilitiesUrl(layer) : "";
        },
        legendURL  () {
            return this.layerInfo.legendURL;
        },
        layerTyp () {
            if (this.layerInfo.typ !== "GROUP") {
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
         * @param {Number} newIndex - The newly selected layer index.
         */
        selectedOption (newIndex) {
            const metaInfo = this.getMetaInfoForLayer(newIndex);

            this.getAbstractInfo(metaInfo);
        }
    },

    created () {
        this.setConfigParams(this.configJs);

        if (this.layerInfo.typ === "GROUP") {
            this.createDropdownOptions();
        }
    },

    mounted () {
        if (this.configJs?.metaDataCatalogueId) {
            this.setMetaDataCatalogueId(this.configJs.metaDataCatalogueId);
        }
        this.createLegendForLayerInfo(this.layerInfo.id);
        if (!this.legendAvailable) {
            this.activeTab = "LayerInfoDataDownload";
        }
    },

    unmounted () {
        this.setLayerInfoLegend({});
    },

    methods: {
        ...mapActions("Modules/LayerInformation", ["setConfigParams", "additionalSingleLayerInfo", "getAbstractInfo"]),
        ...mapActions("Modules/Legend", ["createLegendForLayerInfo"]),
        ...mapMutations("Modules/LayerInformation", ["setMetaDataCatalogueId", "setSelectedLayerIndex"]),
        ...mapMutations("Modules/Legend", ["setLayerInfoLegend"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
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
                label: layer.name
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
         *   - {String} metaId - The metadata ID for the layer.
         *   - {String} cswUrl - The CSW URL for the layer.
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
         * @param {String} tab the tab name
         * @returns {Boolean}  true if the given tab name is active
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
            if (evt && evt.target && evt.target.hash) {
                this.activeTab = evt.target.hash.substring(1);
            }
        },
        /**
         * returns the classnames for the tab
         * @param {String} tab name of the tab depending on property activeTab
         * @returns {String} classNames of the tab
         */
        getTabPaneClasses (tab) {
            return {active: this.isActiveTab(tab), show: this.isActiveTab(tab), "tab-pane": true, fade: true};
        },
        /**
         * generates a GetCapabilities URL from a given service base address and type
         * @param {Object} param payload
         * @param {String} param.url service base URL
         * @param {String} param.typ service type (e.g., WMS)
         * @returns {String} GetCapabilities URL
         */
        getGetCapabilitiesUrl ({url, typ}) {
            const urlObject = new URL(url, location.href);

            if (typ !== "OAF") {
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
            v-if="layerInfo.typ === 'GROUP'"
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
        <div v-if="showAdditionalMetaData">
            <p
                v-for="url in metaURLs"
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
        <p v-if="showPublication">
            {{ $t("common:modules.layerInformation.publicationCreation") }}: {{ datePublication }}
        </p>
        <p v-if="showRevision">
            {{ $t("common:modules.layerInformation.lastModified") }}: {{ dateRevision }}
        </p>
        <p v-if="showPeriodicity">
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
            <ul class="nav nav-tabs">
                <li
                    v-if="legendAvailable"
                    value="layerinfo-legend"
                    class="nav-item"
                >
                    <a
                        href="#layerinfo-legend"
                        class="nav-link"
                        :class="{active: isActiveTab('layerinfo-legend') }"
                        @click="setActiveTab"
                    >{{ $t("common:modules.layerInformation.legend") }}
                    </a>
                </li>
                <li
                    v-if="showDownloadLinks"
                    value="LayerInfoDataDownload"
                    class="nav-item"
                >
                    <a
                        href="#LayerInfoDataDownload"
                        class="nav-link"
                        :class="{active: isActiveTab('LayerInfoDataDownload') }"
                        @click="setActiveTab"
                    >{{ $t("common:modules.layerInformation.downloadDataset") }}
                    </a>
                </li>
                <li
                    v-if="showUrl"
                    value="url"
                    class="nav-item"
                >
                    <a
                        href="#url"
                        class="nav-link"
                        :class="{active: isActiveTab('url') }"
                        @click="setActiveTab"
                    >{{ layerTyp }}
                    </a>
                </li>
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

<style lang="scss">
    @import "~variables";

    .layer-info-text {
        word-break: break-word;
    }

    #accordion-container-layer-info-contact {
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
    }

    .abstract > p {
        font-size: $font-size-base;
    }

    .layerInformation {
        position: absolute;
        overflow: unset;
        top: 20px;
        right: 60px;
        max-width:600px;
        width: 45vw;
        margin: 0 10px 30px 10px;
        z-index: 1010;
        background-color: $white;
        box-shadow: 8px 8px 12px rgba(0, 0, 0, 0.176);
        border: 1px solid $light_grey;

        @include media-breakpoint-down(sm) {
            inset: 12px auto auto 0;
            max-width:750px;
            width: 95vw;
            max-height: 80vh;
        }
    }

    .header {
        padding: 10px 10px 5px 10px;
        border-bottom: 1px solid $light_grey;
        cursor: move;
    }
    .bi-x-lg {
        &:hover {
            opacity: 0.7;
            cursor: pointer;
        }
    }

    .nav-tabs {
        display: flex;
        flex-wrap: nowrap;
        >li {
            font-size: $font-size-base;
            >a {
                text-overflow: ellipsis;
                overflow: hidden;
            }
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

    .dropdown-toggle {
        width: 100%;
    }

    .dropdown-menu {
        width: 100%;
        a.active {
            background-color: $accent_active;
            color: white;
        }
        a:hover {
            background-color: $accent_hover;
        }
    }

    .pt-5 {
        padding-top: 5px;
    }

</style>
