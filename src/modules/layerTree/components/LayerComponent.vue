<script>
import {mapGetters} from "vuex";
import layerTypes from "@core/layers/js/layerTypes.js";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import LayerCheckBox from "./LayerCheckBox.vue";
import LayerComponentIconFilter from "./LayerComponentIconFilter.vue";
import LayerComponentIconInfo from "./LayerComponentIconInfo.vue";
import LayerComponentIconCustom from "./LayerComponentIconCustom.vue";
import LayerComponentIconSubMenu from "./LayerComponentIconSubMenu.vue";
import LayerComponentSubMenu from "./LayerComponentSubMenu.vue";
import layerCollection from "@core/layers/js/layerCollection.js";

/**
 * Representation of a layer in layerTree.
 * @module modules/layerTree/components/LayerComponent
 * @vue-prop {Object} conf - The current layer configuration.
 * @vue-data {String} tooltipText - Contains information about scales, when the layer shall be disabled and is not shown in the map.
 */
export default {
    name: "LayerComponent",
    components: {
        LayerCheckBox,
        LayerComponentIconFilter,
        LayerComponentIconInfo,
        LayerComponentIconCustom,
        LayerComponentIconSubMenu,
        LayerComponentSubMenu
    },
    props: {
        /** current layer configuration */
        conf: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Maps", ["mode", "scale", "scales"])
    },
    mounted () {
        // #VITE The condition was adjusted to prevent the error Cannot read properties of null (reading 'length').
        if (this.conf.maxScale && this.conf.minScale && Array.isArray(this.scales)) {
            let minScale = parseInt(this.conf.minScale, 10);

        /**
         * Tooltip text explaining why a layer is disabled due to scale restrictions.
         * If both minScale and maxScale exist, it returns a formatted scale range explanation.
         * If only one is present, a generic "invisible layer" text is returned.
         * If no scale limits exist, an empty string is returned.
         *
         * @returns {String} The tooltip text for layers out of visible scale range.
         */
        tooltipText () {
            const minScaleRaw = this.conf.minScale !== undefined
                    ? parseInt(this.conf.minScale, 10)
                    : null,

                maxScale = this.conf.maxScale !== undefined
                    ? parseInt(this.conf.maxScale, 10)
                    : null,


                minScale = minScaleRaw === 0
                    ? this.scales[this.scales.length - 1]
                    : minScaleRaw;

            if (minScale && maxScale) {
                return this.$t("common:modules.layerTree.invisibleLayer", {
                    minScale: "1: " + thousandsSeparator(minScale),
                    maxScale: "1: " + thousandsSeparator(maxScale)
                });
            }

            if (minScale) {
                return this.$t("common:modules.layerTree.invisibleLayerMinScale", {
                    minScale: "1: " + thousandsSeparator(minScale)
                });
            }

            if (maxScale) {
                return this.$t("common:modules.layerTree.invisibleLayerMaxScale", {
                    maxScale: "1: " + thousandsSeparator(maxScale)
                });
            }

            return "";
        }
    },
    methods: {
        /**
         * Returns true, if layer configuration shall be shown in tree in current map mode.
         * Filteres by attribute 'showInLayerTree' and respects 'isNeverVisibleInTree' is not true.
         * @returns {Boolean} true, if layer configuration shall be shown in tree
         */
        show () {
            const showLayerTyp = this.mode === "2D" ? !layerTypes.getLayerTypes3d().includes(this.conf.typ?.toUpperCase()) : !layerTypes.getLayerTypesNotVisibleIn3d().includes(this.conf.typ?.toUpperCase());

            if (this.isLayerTree()) {
                return this.conf.showInLayerTree === true && showLayerTyp && this.conf.isNeverVisibleInTree !== true;
            }
            return showLayerTyp && this.conf.isNeverVisibleInTree !== true;
        },
        /**
         * Returns true, if this parent is a 'LayerTreeNode' in layer-tree and false if parent is 'LayerSelectionTreeNode' in layer-selection.
         * @returns {Boolean} true, if this parent is a 'LayerTreeNode' in layer-tree
         */
        isLayerTree () {
            return this.$parent.$options.name !== "LayerSelectionTreeNode";
        },
        /**
         * Returns true, if this layer is not visible in the maps current scale. Returns false, if this is not the layerTree or mode is '3D'.
         * @returns {Boolean}  true, if this layer is not visible in the maps current scale
         */
        scaleIsOutOfRange () {
            if (this.conf.maxScale === undefined) {
                return false;
            }

            const isOutOfRange = this.scale > parseInt(this.conf.maxScale, 10) || this.scale < parseInt(this.conf.minScale, 10),
                layerEntry = layerCollection.getLayerById(this.conf.id);

            if (this.mode === "3D" && this.conf.visibility === true && layerEntry && layerEntry.attributes && layerEntry.attributes.is3DLayer) {

                if (isOutOfRange) {
                    layerEntry.layer.setVisible(false, mapCollection.getMap("3D"), layerEntry.attributes);
                }
                else {
                    layerEntry.layer.setVisible(true, mapCollection.getMap("3D"), layerEntry.attributes);
                }
            }
            else if (this.mode === "3D" && this.conf.visibility === true && layerEntry && layerEntry.attributes) {
                if (isOutOfRange) {
                    layerEntry.layer.setVisible(false);
                }
                else {
                    layerEntry.layer.setVisible(true);
                }
            }

            return this.scale > parseInt(this.conf.maxScale, 10) || this.scale < parseInt(this.conf.minScale, 10);
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="show()"
        :id="'layer-tree-layer-' + conf.id"
        :class="['layer-tree-layer', 'd-flex', 'flex-column', 'justify-content-between', !isLayerTree() ? 'layer-selection': '']"
    >
        <div class="d-flex justify-content-between align-items-center handle-layer-component-drag">
            <span
                class="layer-checkbox-tooltip"
            >
                <LayerCheckBox
                    :conf="conf"
                    :disabled="scaleIsOutOfRange()"
                    :is-layer-tree="isLayerTree()"
                />
            </span>
            <span
                v-show="scaleIsOutOfRange()"
                class="mp-tooltip"
            >
                {{ tooltipText }}
            </span>
            <div
                class="d-flex"
            >
                <LayerComponentIconFilter
                    :layer-conf="conf"
                />
                <LayerComponentIconSubMenu
                    v-if="isLayerTree()"
                    :layer-conf="conf"
                />
                <LayerComponentIconInfo
                    :is-layer-tree="isLayerTree()"
                    :layer-conf="conf"
                />
                <LayerComponentIconCustom
                    v-if="isLayerTree()"
                    :layer-conf="conf"
                />
            </div>
        </div>
        <div
            v-if="isLayerTree()"
            :id="'collapse-sub-menu-' + conf.id.split('.').join('_')"
            class="collapse"
        >
            <LayerComponentSubMenu :layer-conf="conf" />
        </div>
    </div>
</template>

<style lang="scss" scoped>


    .handle-layer-component-drag {
      position: relative;
    }

    .layer-tree-layer {
      font-size: 0.9rem;

      &.layer-selection {
        margin-left: 0.7rem;
      }
    }

    .layer-checkbox-tooltip {
      overflow-x: hidden;
      overflow-y: visible;
      display: block;
      position: relative;
      width: 100%;

      &:hover + .mp-tooltip {
        visibility: visible;
        opacity: 0.8;

        &::before {
          visibility: visible;
          opacity: 1;
        }
      }
    }

    .mp-tooltip {
      position: absolute;
      display: inline-block;
      visibility: hidden;
      opacity: 0;
      transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
      left: 50%;
      top: 100%;
      margin-top: 6px;
      transform: translateX(-50%);
      background-color: $black;
      color: $white;
      padding: 6px 8px;
      border-radius: 0.25rem;
      font-size: 0.85rem;
      z-index: 2000;
      max-width: 200px;
      white-space: normal;
      word-wrap: break-word;
      text-align: center;

      &::before {
        content: "";
        position: absolute;
        left: 50%;
        top: -12px;
        transform: translateX(-50%) rotate(180deg);
        border-width: 6px;
        border-style: solid;
        border-color: $black transparent transparent transparent;
        z-index: 2000;
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
      }
    }
</style>
