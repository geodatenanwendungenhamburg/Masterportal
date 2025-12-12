<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import GraphicalSelect from "@shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "LayerListView",
    components: {
        GraphicalSelect,
        FlatButton,
        SpinnerItem,
        SwitchInput
    },
    data () {
        return {
            supportedLayerTypes: ["WFS", "OAF", "GeoJSON"],
            supportedTypesForGraphicalSelect: ["WFS"],
            unsupportedRenderers: ["WEBGL"],
            manualSelection: false
        };
    },
    computed: {
        ...mapGetters(["visibleLayerConfigs", "ignoredKeys"]),
        ...mapGetters("Modules/GraphicalSelect", [
            "selectedAreaGeoJson"
        ]),
        ...mapGetters("Modules/FeatureLister", [
            "layer",
            "loading",
            "showGraphicalSelect",
            "bufferDistance",
            "selectedArea"
        ]),
        /**
         * Returns the visible vector layers that are supported by the feature lister.
         * @returns {Array} - An array of objects containing the name and id of each visible vector layer.
         */
        visibleVectorLayers () {
            return this.visibleLayerConfigs
                .filter(layer => this.supportedLayerTypes.includes(layer.typ) && !this.unsupportedRenderers.includes(layer.renderer?.toUpperCase()))
                .map(layer => ({
                    name: layer.name,
                    id: layer.id,
                    typ: layer.typ
                }));
        }
    },
    watch: {
        /**
          * Watches for changes in the selected area GeoJSON (indicates that the graphicalSelect was used) and updates the selected area accordingly.
        */
        selectedAreaGeoJson (newValue) {
            this.setSelectedArea(newValue);
        },
        /**
         * Watches for changes in the layer and resets the selected area if the layer type is OAF.
         * OAF layers are not yet supported for graphical selection, so we switch to the list view.
         */
        layer (newValue) {
            if (newValue && (!this.supportedTypesForGraphicalSelect.includes(newValue.typ) || !this.showGraphicalSelect)) {
                this.setSelectedArea(null);
                this.switchToList();
            }
        },
        /**
         * Watches for changes in the visible vector layers and resets the selected layer and area if the current layer is no longer visible.
         * This results in resetting the feature lister to the theme chooser view.
         */
        visibleVectorLayers () {
            if (this.layer && !this.visibleLayerConfigs.find(l => l.id === this.layer.id)) {
                this.setLayer(null);
                this.setSelectedArea(null);
            }
        }
    },
    methods: {
        ...mapMutations("Modules/FeatureLister", [
            "setLayer",
            "setSelectedArea"
        ]),
        ...mapActions("Modules/FeatureLister", [
            "switchToList"
        ]),
        /**
         * Checks if the given layer is the currently selected layer.
         * @param {Object} visibleLayer - The layer to check.
         * @returns {Boolean} - True if the layer is selected, false otherwise.
         */
        isSelectedLayer (visibleLayer = {}) {
            return this.layer && this.layer.id === visibleLayer.id;
        },
        /**
         * Toggles the mode in which the features for the list are chosen.
         * If manualSelection is true, the user can select a spatial area on the map.
         * Otherwise, the features are chosen based on the current map extent.
         */
        chooseMode () {
            this.manualSelection = !this.manualSelection;

            if (!this.manualSelection) {
                this.setSelectedArea(null);
            }
        }
    }
};

</script>


<template>
    <ul
        v-for="visibleLayer in visibleVectorLayers"
        id="feature-lister-themes-ul"
        :key="'module-feature-lister-' + visibleLayer.id"
        class="nav flex-column"
    >
        <li
            :id="'feature-lister-layer-' + visibleLayer.id"
            class="nav-item"
            role="presentation"
        >
            <a
                href="#"
                :class="['nav-link', {'selected-layer': isSelectedLayer(visibleLayer)}]"
                @click.prevent="setLayer(visibleLayer)"
            >{{ visibleLayer.name }}</a>
        </li>
    </ul>
    <div
        v-if="layer && supportedTypesForGraphicalSelect.includes(layer.typ) && showGraphicalSelect"
    >
        <SwitchInput
            id="module-feature-lister-choose-mode"
            :label="$t('common:modules.featureLister.manualSelection')"
            :aria="$t('common:modules.featureLister.manualSelection')"
            class="form-switch mt-4 mb-3"
            :checked="manualSelection"
            :interaction="chooseMode"
        />
        <GraphicalSelect
            v-if="manualSelection"
            ref="graphicalSelection"
            :label="$t('common:modules.featureLister.spatialSelection')"
            :buffer-distance="bufferDistance"
        />
        <FlatButton
            id="module-feature-lister-continue"
            :aria-label="$t('common:modules.featureLister.continueButton')"
            type="button"
            :text="$t('common:modules.featureLister.continueButton')"
            :icon="'bi-list'"
            :disabled="manualSelection ? !selectedArea : false"
            :interaction="switchToList"
        />
        <SpinnerItem
            v-if="loading"
        />
    </div>
</template>

<style lang="scss" scoped>

.selected-layer {
    background-color: $secondary;
    color: $accent_contrast;
    border-radius: 4px;
    margin-bottom: 1em;
}
</style>
