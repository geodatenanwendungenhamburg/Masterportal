<script>
import {mapGetters} from "vuex";

/**
 * Legend Single Layer
 * @module modules/LegendSingleLayer
 * @vue-prop {Object} legendObj - The Legend.
 */

export default {
    name: "LegendSingleLayer",
    props: {
        legendObj: {
            type: Object && undefined,
            required: true
        },
        selectedLayer: {
            type: Number,
            required: false,
            default: null
        }
    },
    data () {
        return {
            imageSources: {}
        };
    },
    computed: {
        ...mapGetters("Modules/Legend", ["sldVersion"]),

        /**
         * Filters the legend object to return the appropriate legend entries based on the selected layer.
         * If no legend object is available, an empty array is returned.
         *
         * @returns {Array} The filtered legend entries:
         *   - Returns all legends grouped by layers if no layer is selected (`selectedLayer` is null or undefined).
         *   - Returns the legend entries for the selected layer group if a valid `selectedLayer` index is specified.
         *   - Returns an empty array if the `selectedLayer` index is out of bounds or no legend exists.
         */
        filteredLegend () {
            if (!this.legendObj || !this.legendObj.legend || !Array.isArray(this.legendObj.legend)) {
                return [];
            }

            const isGrouped = Array.isArray(this.legendObj.legend[0]);

            if (!isGrouped) {
                if (this.selectedLayer === null || this.selectedLayer === undefined) {
                    return this.legendObj.legend;
                }

                if (this.selectedLayer >= 0 && this.selectedLayer < this.legendObj.legend.length) {
                    return [this.legendObj.legend[this.selectedLayer]];
                }

                return [];
            }

            if (this.selectedLayer === null || this.selectedLayer === undefined) {
                return this.legendObj.legend.flat();
            }

            if (this.selectedLayer >= 0 && this.selectedLayer < this.legendObj.legend.length) {
                return this.legendObj.legend[this.selectedLayer];
            }

            return [];
        },

        /**
         * Returns true, if legend images have to be loaded by fetch, so that the login interceptor can add the auth token.
         * @returns {Boolean} true, if the login module is available
         */
        loadImagesByFetch () {
            return this.$store.getters.isModuleAvailable?.("login") === true;
        }
    },
    watch: {
        filteredLegend: {
            handler (legendParts) {
                this.loadImageSources(legendParts);
            },
            immediate: true
        }
    },
    beforeUnmount () {
        Object.values(this.imageSources).forEach(src => {
            if (src?.startsWith("blob:")) {
                URL.revokeObjectURL(src);
            }
        });
    },
    methods: {
        scaleImg (evt, legendPart) {
            if (legendPart.imageScale !== null && legendPart.imageScale !== undefined) {
                evt.target.width = legendPart.imageScale * evt.target.naturalWidth;
            }
        },

        /**
         * Returns the url of a legend string, extended by the sld version for GetLegendGraphic requests.
         * @param {String} legendPart The legend url.
         * @returns {String} The legend url.
         */
        getLegendUrl (legendPart) {
            return legendPart + (legendPart.toUpperCase().includes("GETLEGENDGRAPHIC") && this.sldVersion ? "&sld_version=" + this.sldVersion : "");
        },

        /**
         * Returns true, if the given src has to be loaded by fetch.
         * @param {String} src The image source.
         * @returns {Boolean} true, if the src is an url to fetch.
         */
        isFetchableUrl (src) {
            return typeof src === "string" && !src.startsWith("data:") && !src.startsWith("blob:") && !src.trim().startsWith("<");
        },

        /**
         * Returns the src for an legend image. If images are loaded by fetch, the object url is returned after loading.
         * @param {String} src The image source.
         * @returns {String|undefined} The image source to use.
         */
        getImageSrc (src) {
            if (!this.loadImagesByFetch || !this.isFetchableUrl(src)) {
                return src;
            }
            return this.imageSources[src];
        },

        /**
         * Collects the image urls of the given legend parts.
         * @param {Array} legendParts The legend parts.
         * @returns {String[]} The image urls.
         */
        collectImageUrls (legendParts) {
            const urls = [];

            legendParts.forEach(legendPart => {
                if (typeof legendPart === "string" && !legendPart.endsWith(".pdf")) {
                    urls.push(this.getLegendUrl(legendPart));
                }
                else if (Array.isArray(legendPart?.graphic)) {
                    urls.push(...legendPart.graphic);
                }
                else if (typeof legendPart?.graphic === "string" && !legendPart.graphic.endsWith(".pdf")) {
                    urls.push(legendPart.graphic);
                }
            });

            return urls.filter(url => this.isFetchableUrl(url));
        },

        /**
         * Loads the legend images by fetch, so that the login interceptor adds the auth token.
         * @param {Array} legendParts The legend parts.
         * @returns {Promise<void>} resolves, if all images are loaded
         */
        async loadImageSources (legendParts) {
            if (!this.loadImagesByFetch) {
                return;
            }

            await Promise.all(this.collectImageUrls(legendParts)
                .filter(url => !Object.hasOwn(this.imageSources, url))
                .map(url => this.fetchImage(url)));
        },

        /**
         * Fetches an image and stores its object url. If fetching fails, the original url is used.
         * @param {String} url The image url.
         * @returns {Promise<void>} resolves, if the image is loaded
         */
        async fetchImage (url) {
            this.imageSources[url] = undefined;

            try {
                const response = await fetch(url);

                this.imageSources[url] = response.ok ? URL.createObjectURL(await response.blob()) : url;
            }
            catch {
                this.imageSources[url] = url;
            }
        }
    }
};
</script>

<template>
    <div
        class="layer-legend show"
    >
        <template
            v-if="legendObj && Object.keys(legendObj).length > 0"
        >
            <div
                v-for="(legendPart, index) in filteredLegend"
                :key="index"
                class="mt-2 layer-legend-container"
            >
                <!-- String -->
                <template
                    v-if="typeof legendPart === 'string'"
                >
                    <!--Legend as Image-->
                    <img
                        v-if="!legendPart.endsWith('.pdf') && !legendPart.endsWith('</svg>')"
                        :alt="legendPart.name ? legendPart.name : legendObj.name"
                        :src="getImageSrc(getLegendUrl(legendPart))"
                    >
                    <!--Legend as SVG-->
                    <div
                        v-if="legendPart.endsWith('</svg>')"
                    >
                        {{ legendPart }}
                    </div>
                    <!--Legend PDF as Link-->
                    <a
                        v-if="legendPart.endsWith('.pdf')"
                        :href="legendPart"
                        target="_blank"
                        :title="legendPart"
                    >
                        {{ $t("common:modules.legend.linkToPdf") }}
                    </a>
                </template>

                <!-- Object -->
                <template
                    v-if="typeof legendPart === 'object'"
                >
                    <div
                        v-if="Array.isArray(legendPart.graphic)"
                        class="images-row"
                    >
                        <!--Legend as Image or SVG -->
                        <img
                            :alt="legendPart.name ? legendPart.name : legendObj.name"
                            :src="getImageSrc(legendPart.graphic[1])"
                            :style="{
                                width: legendPart.iconSize[0] + 'px',
                                height: legendPart.iconSize[1] + 'px',
                                margin: legendPart.iconSizeDifferenz + 'px'
                            }"
                            class="first-image"
                            @load="(evt) => scaleImg(evt, legendPart)"
                        >
                        <img
                            :alt="legendPart.name ? legendPart.name : legendObj.name"
                            :src="getImageSrc(Array.isArray(legendPart.graphic) ? legendPart.graphic[0] : legendPart.graphic)"
                            class="second-image"
                            @load="(evt) => scaleImg(evt, legendPart)"
                        >
                        <span
                            class="ms-4 image-name"
                        >
                            {{ $t(legendPart.name) }}
                        </span>
                    </div>
                    <div v-else>
                        <!--Legend as Image or SVG -->
                        <img
                            v-if="!legendPart.graphic.endsWith('.pdf')"
                            :alt="legendPart.name ? legendPart.name : legendObj.name"
                            :src="getImageSrc(legendPart.graphic)"
                            class="left"
                            @load="(evt) => scaleImg(evt, legendPart)"
                        >
                        <!--Legend PDF as Link-->
                        <a
                            v-if="legendPart.graphic.endsWith('.pdf')"
                            :href="legendPart.graphic"
                            target="_blank"
                            :title="legendPart.graphic"
                        >
                            {{ $t("common:modules.legend.linkToPdf") }}
                        </a>
                        <span
                            class="ms-4"
                        >
                            {{ $t(legendPart.name) }}
                        </span>
                    </div>
                </template>
            </div>
        </template>
        <template
            v-else
        >
            <p class="mt-3">
                {{ $t("common:modules.legend.noLegendForLayerInfo") }}
            </p>
        </template>
    </div>
</template>

<style lang="scss" scoped>

    .first-image {
        grid-column: 1;
        grid-row: 1;
        z-index: 1;
    }
    .second-image {
        grid-column: 1;
        grid-row: 1;
    }
    .image-name {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: center;
    }
    .images-row{
        display: inline-grid;
    }
</style>
