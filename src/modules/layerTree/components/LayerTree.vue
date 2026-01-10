<script>
import {mapActions, mapMutations, mapGetters} from "vuex";
import LayerTreeNode from "./LayerTreeNode.vue";
import {treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";
import sortBy from "@shared/js/utils/sortBy.js";
import ElevatedButton from "@shared/modules/buttons/components/ElevatedButton.vue";

/**
 * Module to display the layers in menu.
 * @module modules/layerTree/components/LayerTree
 */
export default {
    name: "LayerTree",
    components: {
        ElevatedButton,
        LayerTreeNode
    },
    computed: {
        ...mapGetters(["addLayerButton", "allLayerConfigsStructured", "showLayerAddButton", "portalConfig"]),
        ...mapGetters("Modules/LayerTree", ["menuSide"]),
        ...mapGetters("Modules/LayerSelection", {layerSelectionType: "type", layerSelectionName: "name"}),

        /**
         * Returns the title of button.
         * @returns {String} the button title.
         */
        title () {
            if (typeof this.addLayerButton?.buttonTitle === "string" && this.addLayerButton?.buttonTitle !== "") {
                return this.addLayerButton?.buttonTitle;
            }

            return "common:modules.layerTree.addLayer";
        },
        /**
         * Returns whether the layers should be reversed.
         * @retruns {Boolean} Layer reverse.
         */
        reverseLayer () {
            return Boolean(this.addLayerButton?.reverseLayer);
        }
    },
    methods: {
        ...mapActions("Modules/LayerSelection", ["navigateForward"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapMutations("Modules/LayerSelection", {setLayerSelectionVisible: "setVisible"}),
        /**
         * Sorts the configs by type: first folder, then layer.
         * @param {Array} configs list of layer and folder configs
         * @returns {Array} the sorted configs
         */
        sort (configs) {
            return sortBy(configs, (conf) => conf.type !== "folder");
        },

        /**
         * Reverse all layer configs, also in sub folders.
         * @param {Object} sublayersConfigs The layer configs.
         * @returns {Object} The reversed layer configs.
         */
        reverseAllLayerConfigs (layerConfigs) {
            layerConfigs.reverse().forEach(sublayersConfigs => {
                if (sublayersConfigs.type === "folder") {
                    this.reverseAllLayerConfigs(sublayersConfigs.elements);
                }
            });

            return layerConfigs;
        },

        /**
         * Shows the component LayerSelection and sets it visible.
         * @returns {void}
         */
        showLayerSelection () {
            const allLayerConfigsStructured = this.allLayerConfigsStructured(treeSubjectsKey),
                subjectDataLayerConfs = this.sort(this.reverseLayer ? this.reverseAllLayerConfigs(allLayerConfigsStructured) : allLayerConfigsStructured),
                baselayerConfs = this.allLayerConfigsStructured(treeBaselayersKey);

            this.changeCurrentComponent({type: this.layerSelectionType, side: this.menuSide, props: {name: this.layerSelectionName}});
            this.navigateForward({lastFolderName: "root", subjectDataLayerConfs, baselayerConfs});
            this.setLayerSelectionVisible(true);
        }
    }
};
</script>

<template lang="html">
    <div
        id="layer-tree"
        class="layer-tree"
    >
        <LayerTreeNode />
        <div
            v-if="showLayerAddButton"
            class="mt-4 d-flex justify-content-center sticky"
        >
            <ElevatedButton
                id="add-layer-btn"
                :aria-label="$t(title)"
                :interaction="showLayerSelection"
                :text="$t(title)"
                :icon="'bi-plus-circle'"
            />
        </div>
    </div>
    <hr>
</template>

<style lang="scss" scoped>

    .sticky {
        position : sticky;
        bottom: 2rem;
        z-index: 10;
        pointer-events: none;
    }
    #add-layer-btn{
        pointer-events: auto;
    }
</style>
