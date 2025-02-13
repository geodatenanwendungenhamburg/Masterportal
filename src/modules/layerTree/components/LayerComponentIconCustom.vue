<script>
import {mapGetters, mapActions} from "vuex";
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
        ...mapActions("Menu", ["toggleMenu", "changeCurrentComponent"]),

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
            console.log("called execute: ", module);
            // Handle menu actions
            if (module === "Menu") {
                console.log("execute action:", execute);
                this.toggleMenu("secondaryMenu");
                this.changeCurrentComponent({
                    type: execute.payload.type || execute.payload,
                    side: "secondaryMenu",
                    props: execute.payload.props || {}
                });
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
