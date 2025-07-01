<script>
import {mapActions, mapGetters} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import layerTypes from "@core/layers/js/layerTypes.js";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";
import LayerInfoContactButton from "./LayerInfoContactButton.vue";

/**
 * Layer Component Sub Menu
 * @module modules/layerTree/components/LayerComponentSubMenu
 * @vue-prop {Object} layerConf - The current layer configuration.
 * @vue-computed {Number} transparency - Returns the transparency of the layer config.
 * @vue-computed {Number} supportedTransparency - Indicates if the layer type supports transparency settings.
 */
export default {
    name: "LayerComponentSubMenu",
    components: {
        FlatButton,
        SliderItem,
        LayerInfoContactButton
    },
    props: {
        /** current layer configuration */
        layerConf: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters(["folderById", "showFolderPath", "portalConfig", "layerConfig"]),
        ...mapGetters("Modules/LayerTree", ["menuSide"]),
        ...mapGetters("Modules/LayerSelection", {layerSelectionType: "type", layerSelectionName: "name"}),
        /**
         * Returns the transparency of the layer config.
         * @returns {Number} Transparency of the layer config.
         */
        transparency () {
            return this.layerConf.transparency || 0;
        },

        /**
         * Indicates if the layer type supports transparency settings.
         * NOte: The type Tileset3D is supported.
         * @returns {Boolean} Supports transparency.
         */
        supportedTransparency () {
            const unSupportedLayerTypes = layerTypes.getLayerTypes3d().filter(layerType => layerType !== "TILESET3D");

            return !unSupportedLayerTypes.includes(this.layerConf.typ?.toUpperCase());
        },
        /**
         * Returns the Name of the layer fromt the metadata if available otherwise from the confg.
         * @returns {String} Name of the layer.
         */
        layerName () {
            return this.layerConf?.datasets?.length > 0 && this.layerConf.datasets[0].md_name ? this.layerConf.datasets[0].md_name : this.layerConf.name;
        },
        /**
         * Returns the metadata id
         * @returns {String} Metadata Id.
         */
        mdid () {
            return this.layerConf?.datasets?.length > 0 ? this.layerConf.datasets[0].md_id : null;
        },
        /**
         * Checks if layer is rootLayer.
         * @returns {boolean} True, if layer is rootLayer. False otherwise.
         */
        isRootLayer () {
            return this.layerConfig[treeSubjectsKey].elements
                .some(l => l.type !== "folder" && l.id === this.layerConf.id);
        }
    },
    methods: {
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapActions("Modules/LayerTree", ["removeLayer", "updateTransparency"]),
        ...mapActions("Modules/LayerSelection", ["showLayer"]),
        /**
         * Returns the names of all parent folders reversed and separated.
         * @returns {String} the names of all parent folders
         */
        getPath () {
            let names = [];

            this.getNamesOfParentFolder(this.layerConf.parentId, names);
            names = names.reverse();
            const translatedNames = names.map(name => {
                return this.$t(name) !== name ? this.$t(name) : name;
            });

            return translatedNames.length > 0 ? translatedNames.join("/") : null;
        },
        /**
         * Looks up for the names of all parent folders.
         * @param {String} parentId id of the parent folder
         * @param {Array} names to store names
         * @returns {Array}  the names of all parent folders
         */
        getNamesOfParentFolder (parentId, names) {
            if (parentId !== undefined) {
                const parent = this.folderById(parentId);

                if (parent) {
                    names.push(parent.name);
                    this.getNamesOfParentFolder(parent.parentId, names);
                }
            }
            return names;
        },

        goToLayer () {
            this.changeCurrentComponent({
                type: this.layerSelectionType,
                side: this.menuSide,
                props: {name: this.layerSelectionName}}
            );
            this.showLayer({layerId: this.layerConf.id});
        }
    }
};
</script>

<template lang="html">
    <div
        :id="'layer-component-sub-menu-' + layerConf.id"
        class="d-flex flex-column layer-component-sub-menu"
    >
        <div
            v-if="showFolderPath && (getPath() || isRootLayer)"
        >
            <FlatButton
                :interaction="goToLayer"
                :text="isRootLayer ? 'common:modules.layerTree.rootLayerPath' : getPath()"
                :customclass="'path btn-light'"
                :icon="'bi-folder'"
            />
        </div>
        <div
            v-if="supportedTransparency"
            :id="'layer-component-icon-sub-menu-transparency-container-' + layerConf.id"
            class="d-flex transparency-container"
        >
            <i class="bi-droplet-half" />
            <label
                :for="'layer-component-sub-menu-transparency-input-' + layerConf.id"
            >
                {{ $t("common:modules.layerTree.iconTransparency") + ":" }}
            </label>
            <SliderItem
                :id="'layer-component-sub-menu-transparency-input-' + layerConf.id"
                :aria="$t('common:modules.aria.sliderAria') + `${transparency}%`"
                :label="`${transparency}%`"
                :value="transparency"
                :min="0"
                :max="100"
                :step="1"
                :interaction="$event => updateTransparency({layerConf, transparency: parseInt($event.target.value, 10)})"
                :show-markers="true"
            />
        </div>
        <div class="remove-layer-container">
            <FlatButton
                :interaction="() => removeLayer(layerConf)"
                :text="'common:modules.layerTree.iconRemoveLayer'"
                :customclass="'btn-light'"
                :icon="'bi-trash3'"
            />
        </div>
        <LayerInfoContactButton
            v-if="portalConfig.tree.subMenuContactButton !== false"
            class="layerInfo-contact-button"
            :layer-name="layerName"
            previous-component="root"
        />
    </div>
</template>

<style lang="scss" scoped>
    .path {
        text-align: left;
        margin-bottom: 0!important;
    }
    .foldericon{
        font-size: 1.3rem;
        padding-right: 0.5rem;
    }
    .layer-component-sub-menu {
        font-size: $font-size-base;
        padding-left: 2rem;
        padding-right: 0.5rem;

        .transparency-container {
            min-height: 2.5rem;
            align-items: center;

            &:has(.markers) {
                align-items: baseline;

                label {
                    margin-right: .75rem;
                }
            }

            i {
                padding-right: 1rem;
                padding-left: 1rem;
                align-self: normal;
            }

            label {
                margin-right: .5rem;
                align-self: normal;
            }

            .transparency-input {
                accent-color: $secondary;
                width: 100%;
            }
        }

        .layerInfo-contact-button {
            position: relative;
            left: 0.125rem;
            bottom: 0.5rem;
        }
    }
</style>
