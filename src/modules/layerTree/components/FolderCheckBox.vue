<script>
import {mapActions} from "vuex";
import escapeId from "@shared/js/utils/escapeId.js";

/**
 * Displays a checkbox that can be used to select or deselect all layers in a folder in the layer tree.
 * All folders with "isSelectable": true will have a checkbox added at the beginning. All other folders will be indented.
 * @module modules/layerTree/components/FolderCheckBox
 * @vue-prop {Object} conf - The current layer configuration.
 * @vue-data {Object} icons - The checkbox icons.
 */
export default {
    name: "FolderCheckBox",
    props: {
        /** current layer configuration */
        conf: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            icons: {
                indeterminate: "bi-dash-square",
                selected: "bi-check-square",
                unselected: "bi-square"
            }
        };
    },
    computed: {
        /**
         * Determines whether layers are active or inactive and returns the corresponding status.
         * @returns {String} The current status of folder checkbox.
         */
        currentStatus () {
            const layerVisibilities = this.checkLayerStatus(this.conf);
            let status = "unselected";

            if (layerVisibilities.has(true) && !layerVisibilities.has(false)) {
                status = "selected";
            }
            else if (!layerVisibilities.has(true) && layerVisibilities.has(false)) {
                status = "unselected";
            }
            else if (layerVisibilities.has(true) && layerVisibilities.has(false)) {
                status = "indeterminate";
            }

            return status;
        },

        /**
         * Returns the correct checkbox icon for the current status.
         * @returns {String} The current checkbox icon.
         */
        folderCheckBoxIcon () {
            return this.icons[this.currentStatus];
        },

        /**
         * Returns the folder checkbox title key for the current status.
         * @returns {String} The folder checkbox title key.
         */
        folderCheckboxTitleKey () {
            let title = "";

            if (this.currentStatus === "selected" || this.currentStatus === "indeterminate") {
                title = "common:modules.layerSelection.folderCheckbox.unselectedAllLayer";
            }
            else if (this.currentStatus === "unselected") {
                title = "common:modules.layerSelection.folderCheckbox.selectedAllLayer";
            }
            return title;
        }
    },
    methods: {
        ...mapActions("Modules/LayerSelection", ["changeVisibility"]),
        escapeId,

        /**
         * Check the visibility for all layers in a folder.
         * @param {Object} element The element with folders and layers.
         * @param {Boolean[]} [layerVisibilities=[]] The layer visibilities.
         * @returns {Set} A set of layer visibilities.
         */
        checkLayerStatus (element, layerVisibilities = []) {
            if (element.type === "folder" && element.elements?.length > 0) {
                element.elements.forEach(subElement => {
                    this.checkLayerStatus(subElement, layerVisibilities);
                });
            }
            else if (element.type === "layer") {
                layerVisibilities.push(element.visibility || false);
            }

            return new Set(layerVisibilities);
        },

        /**
         * Change the checkbox status.
         * @param {String} The current checkbox status.
         * @returns {void}
         */
        changeCheckboxStatus (currentStatus) {
            if (currentStatus === "selected") {
                this.changeLayerVisibilities(this.conf, false);
            }
            else if (currentStatus === "unselected") {
                this.changeLayerVisibilities(this.conf, true);
            }
            else if (currentStatus === "indeterminate") {
                this.changeLayerVisibilities(this.conf, false);
            }
        },

        /**
         * Change the visibility for all layers in a folder.
         * @param {Object} element The element with folders and layers.
         * @param {Boolean} targetVisibility The new visibility for layers.
         * @returns {void}
         */
        changeLayerVisibilities (element, targetVisibility) {
            if (element.type === "folder" && element.elements?.length > 0) {
                element.elements.forEach(subElement => {
                    this.changeLayerVisibilities(subElement, targetVisibility);
                });
            }
            else if (element.type === "layer") {
                this.changeVisibility({layerId: element.id, value: targetVisibility});
            }
        }
    }
};
</script>

<template lang="html">
    <div
        :id="'folder-checkbox-container-' + escapeId(conf.id)"
        class="d-flex d-flex align-items-center"
    >
        <button
            :id="'folder-checkbox-' + escapeId(conf.id)"
            :title="$t(folderCheckboxTitleKey, {folderName: conf.name})"
            :class="[
                'btn d-flex align-items-center layer-tree-folder-title p-1 btn-light',
                !Boolean(conf.isFolderSelectable) ? 'button-hidden' : ''
            ]"
            @click="changeCheckboxStatus(currentStatus)"
            @keydown.enter="changeCheckboxStatus(currentStatus)"
        >
            <span
                :id="'layer-tree-folder-checkbox-' + escapeId(conf.id)"
                :class="[
                    'px-1 py-2',
                    folderCheckBoxIcon
                ]"
            />
        </button>
    </div>
</template>

<style lang="scss" scoped>
    .layer-tree-folder-title {
        overflow: hidden;
        line-height: normal;
    }

    .button-hidden {
        visibility: hidden;
    }
</style>
