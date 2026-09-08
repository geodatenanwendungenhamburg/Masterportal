<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import store from "../../../app-store/index.js";
import {mapState} from "pinia";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

/**
     * Represents a custom icon button for a layer in the layertree.
     * @module modules/layerTree/components/LayerComponentIconCustom
     * @vue-prop {Object} layerConf - The current layer configuration.
     */
export default {
    name: "LayerComponentIconCustom",
    components: {IconButton},
    props: {
        layerConf: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapState(useMenuStore, ["expanded"]),
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
            store.dispatch(execute.action, execute.payload);
        }
    }
};
</script>

<template>
    <div
        v-if="customIconConfig.type === 'customLayerIcon'"
    >
        <IconButton
            :class-array="['btn-light']"
            :aria="customIconConfig.description"
            :icon="customIconConfig.icon"
            :interaction="executeCustomAction"
        />
    </div>
</template>
