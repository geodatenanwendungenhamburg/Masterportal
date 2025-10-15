<script>
import {mapGetters, mapActions} from "vuex";
import {WMSCapabilities} from "ol/format.js";
import {intersects} from "ol/extent";
import crs from "@masterportal/masterportalapi/src/crs";
import axios from "axios";
import {treeSubjectsKey} from "@shared/js/utils/constants";
import {deleteParams} from "@shared/js/utils/deleteUrlParams";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import buildTreeStructure from "@appstore/js/buildTreeStructure";

/**
 * Adds WMS
 * @module modules/AddWMS
 * @vue-data {Number} uniqueId - Current unique id.
 * @vue-data {String} infoFormat - The infoFormat for gfi requests.
 * @vue-data {Boolean} invalidUrl - Shows if Url is invalid.
 * @vue-data {String} wmsUrl - Current wms url.
 * @vue-data {String} version - Current version.
 */
export default {
    name: "AddWMS",
    components: {
        InputText
    },
    data () {
        return {
            uniqueId: 100,
            infoFormat: "",
            invalidUrl: false,
            wmsUrl: "",
            version: ""
        };
    },
    computed: {
        ...mapGetters("Modules/AddWMS", ["exampleURLs", "featureCount", "visibility", "showInLayerTree"]),
        ...mapGetters("Maps", ["projection", "mode"]),
        ...mapGetters(["mapViewSettings", "portalConfig"])
    },
    mounted () {
        this.setFocusToFirstControl();
    },
    methods: {
        ...mapActions(["addLayerToLayerConfig"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Sets the focus to the first control
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs.wmsUrl) {
                    this.$refs.wmsUrl.focus();
                }
            });
        },
        /**
         * Send via Enter key.
         * @param {Event} event - Key event.
         * @returns {void}
         */
        keydown: function (event) {
            const code = event.keyCode;

            if (code === 13) {
                this.importLayers();
            }
        },

        /**
         * Creates the url with the given params and checks if it is valid
         * @param {String} serviceUrl inserted url by user
         * @returns {String} the url.href
        */
        getUrl: function (serviceUrl) {
            let url;

            this.invalidUrl = false;
            try {
                url = new URL(serviceUrl);
            }
            catch (e) {
                this.invalidUrl = true;
                this.displayErrorMessage();
            }
            if (url.href.includes("http:")) {
                this.addSingleAlert({
                    content: this.$t("common:modules.addWMS.errorHttpsMessage"),
                    category: "error",
                    title: this.$t("common:modules.addWMS.errorTitle")});
            }
            else {

                deleteParams(url, ["request", "service"]);
                url.searchParams.set("request", "GetCapabilities");
                url.searchParams.set("service", "WMS");
            }
            return url.href;
        },

        /**
         * Creates the url without the parameter service, request and version
         * @param {String} serviceUrl inserted url by user
         * @returns {String} the url.href
         */
        getBaseServiceUrl: function (serviceUrl) {
            const url = new URL(serviceUrl);

            deleteParams(url, ["request", "service", "version"]);
            return url.href;
        },

        /**
         * Importing the external wms layers
         * @returns {void}
         */
        importLayers: function () {
            const serviceUrl = this.$el.querySelector("#wmsUrl").value.trim(),
                url = this.getUrl(serviceUrl);

            if (this.invalidUrl === true || url.includes("http:") || url.length === 0) {
                return;
            }

            axios({
                timeout: 4000,
                url: url
            })
                .then(response => response.data)
                .then((data) => {
                    try {
                        const parser = new WMSCapabilities(),
                            capability = parser.read(data),
                            version = capability?.version,
                            checkVersion = this.isVersionEnabled(version),
                            currentExtent = this.mapViewSettings?.extent,
                            folder = {
                                type: "folder",
                                isExternal: true,
                                name: "",
                                elements: []
                            };
                        let checkExtent = this.getIfInExtent(capability, currentExtent),
                            finalCapability = capability;

                        if (!checkVersion) {
                            const reversedData = this.getReversedData(data);

                            finalCapability = parser.read(reversedData);
                            checkExtent = this.getIfInExtent(finalCapability, currentExtent);
                        }

                        if (!checkExtent) {
                            this.addSingleAlert({
                                content: this.$t("common:modules.addWMS.ifInExtent"),
                                category: "error",
                                title: this.$t("common:modules.addWMS.errorTitle")
                            });
                            return;
                        }

                        this.version = version;
                        this.wmsUrl = url;
                        this.infoFormat = this.getInfoFormat(finalCapability?.Capability?.Request?.GetFeatureInfo?.Format);

                        folder.name = finalCapability.Capability.Layer.Title;
                        finalCapability.Capability.Layer.Layer.forEach(layer => {
                            this.parseLayerStructure(folder, layer, 1);
                        });
                        buildTreeStructure.setIdsAtFolders([folder]);
                        this.addLayerToTopicTree(folder);
                    }
                    catch (e) {
                        this.displayErrorMessage();
                    }
                }, () => {
                    this.displayErrorMessage();
                });
        },

        /**
         * Send via Enter key.
         * @param {Event} e - Key event.
         * @returns {void}
         */
        inputUrl: function (e) {
            const code = e.keyCode;

            this.invalidUrl = false;
            if (code === 13) {
                this.importLayers();
            }
        },

        /**
         * Display error message for wms which have misspelling or no CORS-Header.
         * @returns {void}
         */
        displayErrorMessage: function () {
            this.addSingleAlert({
                content: this.$t("common:modules.addWMS.errorMessage"),
                category: "error",
                title: this.$t("common:modules.addWMS.errorTitle")
            });
        },

        /**
         * Returns the infoFormat for the wms.
         * If the wms does not provide any formats, `text/xml` is used as default.
         * Note: The infoFormat `Application/vnd.ogc.gml` is preferred because OL on MapServer WMS cannot handle the prefixes `ogr` in the `text/xml` infoFormat.
         * @param {String[]} possibleFormats The possible infoFormats of capabilities.
         * @returns {String} The infoFormat.
         */
        getInfoFormat: function (possibleFormats) {
            let infoFormat = this.portalConfig?.tree?.rasterLayerDefaultInfoFormat;

            if (possibleFormats?.includes("gml") || possibleFormats?.includes("application/vnd.ogc.gml")) {
                infoFormat = "application/vnd.ogc.gml";
            }
            else if (possibleFormats?.length > 0 && !possibleFormats.includes(infoFormat)) {
                infoFormat = possibleFormats[0];
            }

            if (infoFormat === undefined) {
                infoFormat = "text/xml";
            }

            return infoFormat;
        },

        /**
         * Creates recursive the layer structure with subfolders and layers.
         * @info recursive function
         * @param {Object} folder The layerTree folder.
         * @param {Object} object the layer object to add.
         * @param {Number} level The depth of the recursion.
         * @return {void}
         */
        parseLayerStructure: function (folder, object, level) {
            if (Object.prototype.hasOwnProperty.call(object, "Layer")) {
                const subFolder = {
                    type: "folder",
                    name: object.Title,
                    elements: []
                };

                folder.elements.push(subFolder);
                object.Layer.forEach(layer => {
                    this.parseLayerStructure(subFolder, layer, level + 1);
                });
            }
            else {
                const datasets = [];
                let layerObject = {};

                if (object?.MetadataURL?.[0].OnlineResource) {
                    datasets.push({
                        customMetadata: true,
                        csw_url: object.MetadataURL[0].OnlineResource,
                        attributes: {}
                    });
                }
                layerObject = {
                    id: this.getParsedTitle(object.Title),
                    name: object.Title,
                    typ: "WMS",
                    layers: [object.Name],
                    url: this.getBaseServiceUrl(this.wmsUrl),
                    version: this.version,
                    visibility: this.visibility,
                    type: "layer",
                    isExternal: true,
                    featureCount: this.featureCount,
                    infoFormat: this.infoFormat,
                    showInLayerTree: this.showInLayerTree,
                    maxScale: object?.MaxScaleDenominator?.toString(),
                    minScale: object?.MinScaleDenominator?.toString(),
                    legendURL: object?.Style?.[0].LegendURL?.[0].OnlineResource?.toString(),
                    datasets
                };

                folder.elements.push(layerObject);
            }
        },

        /**
         * Adds the layer in folder structure to the topic tree.
         * @param {Object} folder The layerTree folder.
         * @returns {void}
         */
        addLayerToTopicTree: function (folder) {
            this.addLayerToLayerConfig({layerConfig: folder, parentKey: treeSubjectsKey}).then((addedLayer) => {
                if (addedLayer) {
                    this.addSingleAlert({
                        content: this.showInLayerTree ? this.$t("common:modules.addWMS.completeMessageShowInLayerTree") : this.$t("common:modules.addWMS.completeMessage"),
                        category: "success",
                        title: this.$t("common:modules.addWMS.alertTitleSuccess")});
                    this.wmsUrl = "";
                }
                else {
                    this.addSingleAlert({
                        content: this.$t("common:modules.addWMS.alreadyAdded"),
                        category: "warning",
                        title: this.$t("common:modules.addWMS.errorTitle")});
                    this.wmsUrl = "";
                }
            });
        },

        /**
         * Getter if the version is enabled and above 1.3.0
         * @param {String} version the version of current external wms layer
         * @returns {Boolean} true or false
         */
        isVersionEnabled: function (version) {
            if (typeof version !== "string") {
                return false;
            }

            const parsedVersion = version.split(".");

            if (parseInt(parsedVersion[0], 10) < 1) {
                return false;
            }
            else if (parsedVersion.length >= 2 && parseInt(parsedVersion[0], 10) === 1 && parseInt(parsedVersion[1], 10) < 3) {
                return false;
            }

            return true;
        },

        /**
         * Getter if the imported wms layer in the extent of current map
         * @param {Object} capability the response of the imported wms layer in parsed format
         * @param {Number[]} currentExtent the extent of current map view
         * @returns {Boolean} true or false
         */
        getIfInExtent: function (capability, currentExtent) {
            const layer = capability?.Capability?.Layer?.BoundingBox?.filter(bbox => {
                    return bbox?.crs && bbox?.crs.includes("EPSG") && crs.getProjection(bbox?.crs) !== undefined && Array.isArray(bbox?.extent) && bbox?.extent.length === 4;
                }),
                layerEPSG4326Projection = layer.find((element) => element.crs === "EPSG:4326");
            let layerExtent;

            // If there is no extent defined or the extent is not right defined, it will import the external wms layer(s).
            if (!Array.isArray(currentExtent) || currentExtent.length !== 4) {
                return true;
            }

            if (Array.isArray(layer) && layer.length) {
                let firstLayerExtent = [],
                    secondLayerExtent = [];

                layer.forEach(singleLayer => {
                    if (singleLayer.crs === this.projection.getCode()) {
                        firstLayerExtent = [singleLayer.extent[0], singleLayer.extent[1]];
                        secondLayerExtent = [singleLayer.extent[2], singleLayer.extent[3]];
                    }
                });

                if (layerEPSG4326Projection && !firstLayerExtent.length && !secondLayerExtent.length) {
                    firstLayerExtent = crs.transform(layer[0].crs, this.projection.getCode(), [layerEPSG4326Projection.extent[1], layerEPSG4326Projection.extent[0]]);
                    secondLayerExtent = crs.transform(layer[0].crs, this.projection.getCode(), [layerEPSG4326Projection.extent[3], layerEPSG4326Projection.extent[2]]);
                }
                else if (!firstLayerExtent.length && !secondLayerExtent.length) {
                    firstLayerExtent = crs.transform(layer[0].crs, this.projection.getCode(), [layer[0].extent[0], layer[0].extent[1]]);
                    secondLayerExtent = crs.transform(layer[0].crs, this.projection.getCode(), [layer[0].extent[2], layer[0].extent[3]]);
                }

                layerExtent = [firstLayerExtent[0], firstLayerExtent[1], secondLayerExtent[0], secondLayerExtent[1]];

                return intersects(currentExtent, layerExtent);
            }

            return true;
        },

        /**
         * Getter for reversed data of old wms version
         * @param {Object} data the response of the imported wms layer
         * @returns {xml} reversedData - The reversed data of the response of the imported wms layer
         */
        getReversedData: function (data) {
            let reversedData = new XMLSerializer().serializeToString(data);

            reversedData = reversedData.replace(/<SRS>/g, "<CRS>").replace(/<\/SRS>/g, "</CRS>").replace(/SRS=/g, "CRS=");
            reversedData = new DOMParser().parseFromString(reversedData, "text/xml");

            return reversedData;
        },

        /**
         * Getter for parsed title without space and slash
         * It will be used as id later in template
         * @param {String} title - the title of current layer
         * @returns {String} parsedTitle - The parsed title
         */
        getParsedTitle: function (title) {
            return String(title).replace(/\s+/g, "-").replace(/\//g, "-").replace(/[():]/g, "-");
        }
    }
};
</script>

<template>
    <div
        id="addWMS"
        class="row"
    >
        <div>
            <InputText
                id="wmsUrl"
                ref="wmsUrl"
                v-model="wmsUrl"
                aria-label="WMS-Url"
                :label="$t('common:modules.addWMS.placeholder')"
                :placeholder="$t('common:modules.addWMS.placeholder')"
                @keydown.enter="inputUrl"
            />
            <button
                id="addWMSButton"
                type="button"
                class="btn btn-primary"
                @click="importLayers"
            >
                <span
                    class=""
                    aria-hidden="true"
                >{{ $t('common:modules.addWMS.textLoadLayer') }}</span>
                <span
                    class="bootstrap-icon"
                    aria-hidden="true"
                >
                    <i class="bi-check-lg" />
                </span>
            </button>
        </div>
        <div
            v-if="exampleURLs && exampleURLs.length > 0"
            class="WMS_example_urls"
        >
            <h5>{{ $t('common:modules.addWMS.examples') }}</h5>
            <ul>
                <li
                    v-for="url in exampleURLs"
                    :key="url"
                >
                    {{ url }}
                </li>
            </ul>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";
    .WMS_example_text {
        margin-top: 10px;
        color: $light_grey;
    }
    #addWMSButton {
        margin-top: 15px;
        width: 50%;
    }
    .addwms_error {
        font-size: $font-size-lg;
        color: $light_red;
        margin-bottom: 10px;
    }
    .WMS_example_urls {
        margin-top: 32px;
        font-size: $font-size-sm;
    }
</style>
