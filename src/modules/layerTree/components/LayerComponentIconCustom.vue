<script>
import {mapActions, mapGetters} from "vuex";
import IconButton from "../../../shared/modules/buttons/components/IconButton.vue";

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
        ...mapActions("Menu", ["changeCurrentComponent", "toggleMenu"]),
        ...mapActions("Modules/Alerting", ["addSingleAlert"]),

        /**
         * Executes the configured action for the custom icon
         * @returns {void}
         */
        executeCustomAction () {
            const execute = this.customIconConfig.execute;
            if (!execute) {
                return;
            }

            const [module, action] = execute.action.split("/");

            // Handle menu actions
            if (module === "Menu") {
                this.changeCurrentComponent({
                    type: execute.payload.type,
                    side: execute.payload.side || "secondaryMenu",
                    props: execute.payload.props || {}
                });

                if (!this.expanded(execute.payload.side || "secondaryMenu")) {
                    this.toggleMenu(execute.payload.side || "secondaryMenu");
                }
            }
            // Handle alerting actions
            else if (module === "Alerting") {
                this.addSingleAlert(execute.payload);
            }
            // Add more action types here as needed
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
