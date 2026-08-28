<script>
import {mapGetters} from "vuex";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import svgFactory from "@shared/js/utils/svgFactory.js";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";


export default {
    name: "OrientationComponentResults",
    components: {
        NavTab,
        FlatButton
    },
    props: {
        position: {
            type: Array,
            required: true
        },
        selectedMode: {
            type: String,
            required: true
        },
        poiDistances: {
            type: [Boolean, Array],
            required: false,
            default: () => []
        },
        getFeaturesInCircle: {
            type: Function,
            required: true
        }
    },
    emits: ["feature-selected", "back-to-choice", "zoom-to-location", "select-map-point"],
    data () {
        return {
            poiFeatures: [],
            imgPathByFeature: {},
            activeCategory: null
        };
    },
    computed: {
        ...mapGetters(["visibleLayerConfigs"])
    },
    watch: {
        position (newPosition) {
            if (newPosition) {
                this.getFeatures(this.visibleLayerConfigs);
            }
        },
        visibleLayerConfigs: {
            handler (newLayerConfigs) {
                this.getFeatures(newLayerConfigs);
            },
            deep: true
        },
        poiFeatures: {
            handler (newPoiFeatures) {
                if (newPoiFeatures.length > 0) {
                    this.initActiveCategory();
                }
            },
            deep: true
        }
    },
    mounted () {
        this.getFeatures(this.visibleLayerConfigs);
        this.initActiveCategory();
    },
    methods: {

        /**
         * Getting the features within the distances
         * @param {Array} layerConfigs visible layer configs
         * @returns {void}
         */
        getFeatures (layerConfigs) {
            const poiFeatures = [],
                  centerPosition = this.position;

            this.poiDistances.forEach(distance => {
                const featInCircle = this.getFeaturesInCircle(layerConfigs, distance, centerPosition);

                featInCircle.sort((featureA, featureB) => featureA.dist2Pos - featureB.dist2Pos);

                featInCircle.forEach(feat => {
                    this.fillImagePath(feat);
                    feat.nearbyTitleText = this.getFeatureTitle(feat);
                });

                poiFeatures.push({
                    category: distance,
                    features: featInCircle
                });
            });

            this.poiFeatures = poiFeatures;
        },

        /**
         * Initial the active category
         * @returns {void}
         */
        initActiveCategory () {
            if (this.poiFeatures.length === 0 || typeof this.activeCategory === "number") {
                return;
            }

            const first = this.poiFeatures.find(dist => dist.features.length > 0);

            this.activeCategory = first ? first.category : this.poiFeatures[0].category;
        },

        /**
         * Getting the feature title
         * @param  {ol/Feature} feature the vector feature
         * @return {String[]} the nearbyTitle Text
         */
        getFeatureTitle (feature) {
            if (!Array.isArray(feature.nearbyTitleText) || !feature.nearbyTitleText.length) {
                if (feature.get("name")) {
                    return [feature.get("name")];
                }
                else if (feature.layerName) {
                    return [feature.layerName];
                }
            }

            return feature.nearbyTitleText;

        },

        fillImagePath (feat) {
            const styleObject = styleList.returnStyleObject(feat.styleId);

            this.imgPathByFeature[feat.getId()] = "";
            if (styleObject) {
                const featureStyleObject = createStyle.getGeometryStyle(feat, styleObject.rules, false, Config.wfsImgPath),
                      featureStyle = createStyle.createStyle(styleObject, feat, false, Config.wfsImgPath);

                if (featureStyleObject.attributes?.type === "icon") {
                    this.imgPathByFeature[feat.getId()] = featureStyle.getImage()?.getSrc() ? featureStyle.getImage()?.getSrc() : "";
                }

                else {
                    createStyle.returnLegendByStyleId(feat.styleId).then(layerLegends => {
                        layerLegends.legendInformation.forEach(legendInfo => {
                            if (legendInfo.geometryType === "Point" && legendInfo.styleObject.attributes?.type === "circle" && legendInfo.label === feat.legendValue) {
                                this.imgPathByFeature[feat.getId()] = svgFactory.createCircle(legendInfo.styleObject);
                            }
                            else if (legendInfo.geometryType === "LineString" && legendInfo.label === feat.legendValue) {
                                this.imgPathByFeature[feat.getId()] = svgFactory.createLine(legendInfo.styleObject);
                            }
                            else if (legendInfo.geometryType === "Polygon" && legendInfo.label === feat.legendValue) {
                                this.imgPathByFeature[feat.getId()] = svgFactory.createPolygon(legendInfo.styleObject);
                            }
                        });
                    });
                }
            }
        },

        /**
         * Zooming to the feature point
         * @param {Event} evt click event
         * @returns {void}
         */
        zoomFeature (evt) {
            const id = evt.currentTarget.id,
                  poiFeatures = this.poiFeatures,
                  activeCategory = this.activeCategory,
                  selectedPoiFeatures = poiFeatures.find(poi => {
                      return poi.category === activeCategory;
                  }),
                  feature = selectedPoiFeatures.features.find(feat => {
                      return feat.getId() === id;
                  });

            this.$emit("feature-selected", feature);
        },

        /**
         * Sets the active category in Vuex state.
         * @param {number} category The category distance value
         * @returns {void}
         */
        changedCategory (category) {
            this.activeCategory = category;
        }
    }
};
</script>

<template>
    <div class="button-row">
        <FlatButton
            :text="$t('common:modules.orientation.backToChoiceButton')"
            @click="$emit('back-to-choice')"
        />
        <FlatButton
            v-if="selectedMode === 'currentPosition'"
            :text="$t('common:modules.orientation.jumpToLocationButton')"
            @click="$emit('zoom-to-location')"
        />
        <FlatButton
            v-if="selectedMode === 'customPosition'"
            :text="$t('common:modules.orientation.chooseNewLocationButton')"
            @click="$emit('select-map-point')"
        />
    </div>
    <div class="orientation-component-results">
        <ul
            class="nav nav-tabs"
            role="tablist"
        >
            <NavTab
                v-for="(feature, index) in poiFeatures"
                :id="`poi-tab-${feature.category}`"
                :key="index"
                :label="`${feature.category}m`"
                :active="feature.category === activeCategory"
                :target="`#poi-distance-${feature.category}`"
                :interaction="() => changedCategory(feature.category)"
            >
                <span
                    class="result-count"
                >{{ feature.features.length }}</span>
            </NavTab>
        </ul>
        <div class="tab-content">
            <div
                v-for="(feature, index) in poiFeatures"
                :id="`poi-distance-${feature.category}`"
                :key="'list' + index"
                role="tabpanel"
                :class="[
                    'tab-pane fade show',
                    feature.category === activeCategory
                        ? 'active'
                        : '',
                ]"
            >
                <ul class="poi-list">
                    <li
                        v-for="(feat, i) in feature.features"
                        :key="'poi-item' + i"
                        class="poi-item"
                    >
                        <button
                            :id="feat.getId()"
                            class="poi-button"
                            @click="zoomFeature"
                        >
                            <div
                                v-if="imgPathByFeature[feat.getId()].length > 0"
                                class="poi-icon"
                            >
                                <span
                                    v-if="imgPathByFeature[feat.getId()].indexOf('</svg>') !== -1"
                                    v-html="imgPathByFeature[feat.getId()]"
                                />
                                <img
                                    v-else
                                    :src="imgPathByFeature[feat.getId()]"
                                    :alt="$t('common:modules.orientation.imgAlt')"
                                >
                            </div>

                            <div
                                class="poi-description"
                                :class="{ 'full-width': imgPathByFeature[feat.getId()].length === 0 }"
                            >
                                <div>
                                    <p
                                        v-for="(featNearbyTitleText, iNearby) in feat.nearbyTitleText"
                                        :key="'featNearbyTitleText' + iNearby"
                                    >
                                        <strong>{{ featNearbyTitleText }}</strong>
                                    </p>
                                    <p>{{ feat.dist2Pos + " " + $t("common:modules.orientation.distanceUnit") }}</p>
                                </div>
                            </div>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.button-row {
    display: flex;
    gap: 1rem;
    padding: 1rem 0;
}
    .orientation-component-results {

        .modal-header {
            justify-content: space-between;
            padding-bottom: 0;
            border-bottom: 0;
        }
        .nav-pills {
            padding: $padding;
            padding-top: 0;
        }
        .modal-title {
            padding: 8px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }
        .bi-x-lg {
            font-size: $font_size_icon_lg;
            float: right;
            padding: 12px;
            cursor: pointer;
        }
        .modal-dialog {
            z-index: 1051;
        }
        .result-count {
            background-color: $dark_blue;
            color: white;
            border-radius: 12px;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 0.5rem;
            vertical-align: middle;
        }
        .tab-content {
            .poi-list {
                display: flex;
                flex-direction: column;
                list-style: none;
                padding: 0 $padding;
                .poi-item {
                    cursor: pointer;
                    .poi-button {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        padding: 8px;
                        cursor: pointer;
                        background: transparent;
                        border: none;
                        border-bottom: $border-width solid $gray-300;
                        &:hover {
                            background: $accent_hover;
                        }
                    }

                    &:last-child {
                        .poi-button {
                            border-bottom: none;
                        }
                    }

                    .poi-icon {
                        flex: 0 0 50px;
                        display: flex;
                        justify-content: center;
                        align-items: center;

                        img {
                            max-width: 50px;
                            max-height: 50px;
                            vertical-align: middle;
                        }
                    }

                    .poi-description {
                        flex: 1;
                        padding-left: 10px;

                        &.full-width {
                            padding-left: 0;
                        }
                    }
                }
            }
        }
    }

</style>
