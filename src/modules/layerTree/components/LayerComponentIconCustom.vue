<script>
import {mapGetters} from "vuex";
import IconButton from "../../../shared/modules/buttons/components/IconButton.vue";
import store from "../../../app-store/index.js";

/**
 * Represents a custom icon button for a layer in the layertree.
 * @module modules/layerTree/components/LayerComponentIconCustom
 * @vue-prop {Object} layerConf - The current layer configuration.
 */
export default {
    name: "LayerComponentIconCustom",
    components: {IconButton},
    props: {
        /** current layer configuration */
        layerConf: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Menu", ["expanded"]),
        /**
         * Gets the custom icon configuration from the layer config
         * @returns {Object} The custom icon configuration
         */
        customIconConfig () {
            return this.layerConf.customLayerIcon || {};
        }
    },
    methods: {
        /**
         * Executes the configured action for the custom icon
         * @returns {void}
         */
        executeCustomAction () {
            const execute = this.customIconConfig.execute;

            if (!execute) {
                return;
            }

            try {
                if (execute.payload?.side) {
                    // If payload has a side property, ensure menu is expanded
                    store.commit("Menu/setExpandedBySide", {side: execute.payload.side, expanded: true});
                }
                // Dispatch the action
                store.dispatch(execute.action, execute.payload);
            }
            catch (error) {
                console.error(`Failed to execute action ${execute.action}:`, error);
            }
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="customIconConfig.type === 'customLayerIcon'"
    >
        <IconButton
            :class-array="['btn-light']"
            :aria="customIconConfig.description"
            :icon="customIconConfig.icon"
            :interaction="() => executeCustomAction()"
        />
    </div>
</template>
