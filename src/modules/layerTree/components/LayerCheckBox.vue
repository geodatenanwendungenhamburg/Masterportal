<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import LayerPreview from "@shared/modules/layerPreview/components/LayerPreview.vue";
import baselayerHandler from "../../layerSelection/js/handleSingleBaselayer.js";
import {addSourceToPayload} from "@shared/js/utils/addSourceToPayload.js";
import escapeId from "@shared/js/utils/escapeId.js";
import isLoginRequired from "@shared/js/utils/isLoginRequired.js";

/**
 * Displays a checkbox to select a layer in layertree.
 * @module modules/layerTree/components/LayerCheckBox
 * @vue-prop {Object} conf - The current layer configuration.
 * @vue-prop {Boolean} isLayerTree - Shows if parent is layer tree (true) or layer selection (false).
 * @vue-prop {Boolean} [disabled=false] - Set to true, layer shall be disabled.
 * @vue-computed {Boolean} isLayerVisible - Returns the value of layerConf's attribute visibility.
 * @vue-computed {Boolean} isLoginRequired - Returns true, if the layer is secured, the portal uses the login and the user is not logged in.
 * @vue-computed {String} securedIcon - Returns the icon of a secured layer, a closed lock if the user is not logged in and an open lock if the user is logged in.
 */
export default {
    name: "LayerCheckBox",
    components: {
        LayerPreview
    },
    props: {
        /** current layer configuration */
        conf: {
            type: Object,
            required: true
        },
        /** true, if parent is layer tree and false if parent is layer selection */
        isLayerTree: {
            type: Boolean,
            required: true
        },
        /** true, if layer shall be disabled. Default is false. */
        disabled: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        ...mapGetters(["configJs", "singleBaselayer", "visibleBaselayerConfigs"]),
        ...mapGetters("Modules/LayerSelection", ["layersToAdd", "highlightLayerId"]),
        ...mapGetters("Modules/Login", ["loggedIn"]),

        /**
         * Returns true, if the layer is secured, the portal uses the login and the user is not logged in.
         * Portals without a configured login are not affected, as their secured layers may be authorized otherwise.
         * @returns {Boolean} true, if the user has to log in to show the layer.
         */
        isLoginRequired () {
            return isLoginRequired(this.conf, this.configJs, this.loggedIn);
        },

        /**
         * Returns the icon of a secured layer.
         * A closed lock is shown if the user is not logged in and an open lock if the user is logged in.
         * @returns {String} the class of the icon.
         */
        securedIcon () {
            return this.loggedIn ? "bi-unlock-fill" : "bi-lock-fill";
        },

        /**
         * Returns the value of layerConf's attribute visibility
         * @returns {Boolean} the value of layerConf's attribute visibility
         */
        isLayerVisible () {
            return typeof this.conf.visibility === "boolean" ? this.conf.visibility : false;
        },
        /**
         * Returns true, if layer is visible or state property 'boldLayerId' contains this confs id.
         * @returns {Boolean} true, if layers name shall be displayed bold
         */
        isBold () {
            return this.isLayerVisible || this.highlightLayerId === this.conf.id;
        },
        layerName () {
            return this.conf.shortname || this.conf.name;
        }
    },
    mounted () {
        if (this.highlightLayerId === this.conf.id) {
            this.$nextTick(() => {
                const el = document.querySelector("#layer-selection-treenode-" + escapeId(this.highlightLayerId));

                if (!el || this.hasAutoScrolled) {
                    return;
                }
                this.hasAutoScrolled = true;
                setTimeout(() => el.scrollIntoView({block: "nearest", behavior: "smooth"}), 0);
            });
        }
    },
    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/LayerSelection", ["changeVisibility"]),
        ...mapMutations("Modules/LayerSelection", ["addSelectedLayer", "removeSelectedLayer"]),
        escapeId,
        /**
         * Replaces the value of current conf's visibility in state's layerConfig
         * @param {Boolean} value visible or not
         * @returns {void}
         */
        visibilityInLayerTreeChanged (value) {
            const layerConfigs = [];

            layerConfigs.push({
                id: this.conf.id,
                layer: {
                    id: this.conf.id,
                    visibility: value
                }
            });
            if (this.conf.baselayer) {
                baselayerHandler.checkAndAdd(this.singleBaselayer, this.visibleBaselayerConfigs, layerConfigs);
            }
            this.replaceByIdInLayerConfig(addSourceToPayload(this, {layerConfigs}));
        },
        /**
         * Listener for click on layer checkbox.
         * @returns {void}
         */
        clicked () {
            const value = !this.isLayerVisible;

            // a secured layer can only be requested by a logged in user, so it is not shown and the user is asked to log in
            if (value && this.isLoginRequired) {
                this.addSingleAlert({
                    category: "info",
                    content: this.$t("common:modules.layerTree.loginRequired", {layerName: this.$t(this.layerName)})
                });
                return;
            }

            if (this.isLayerTree) {
                this.visibilityInLayerTreeChanged(value);
            }
            else {
                this.changeVisibility({layerId: this.conf.id, value: value});
            }

        }
    }
};
</script>

<template lang="html">
    <div
        v-if="conf.baselayer && !isLayerTree"
        class="w-100 p-1"
    >
        <LayerPreview
            :id="'layer-tree-layer-preview-' + conf.id"
            :layer-id="conf.id"
            :checkable="true"
            :checked="isLayerVisible"
            :zoom-level="typeof conf.preview?.zoomLevel === 'number'? conf.preview?.zoomLevel : null"
            :radius="conf.preview?.radius ? conf.preview?.radius : null"
            :center="conf.preview?.center ? conf.preview?.center : null"
            :custom-class="conf.preview?.customClass ? conf.preview?.customClass : null"
            @preview-clicked="clicked()"
        />
        <span class="pt-4">{{ $t(layerName) }}</span>
    </div>
    <button
        v-else
        :id="'layer-checkbox-' + escapeId(conf.id)"
        role="checkbox"
        :aria-checked="isLayerVisible"
        :aria-label="$t(layerName)"
        :disabled="disabled"
        class="btn d-flex w-100 layer-tree-layer-title pe-2 p-1 btn-light"
        @click="clicked()"
        @keydown.enter.prevent="clicked()"
        @keydown.space.prevent="clicked()"
    >
        <span
            :id="'layer-tree-layer-checkbox-' + conf.id"
            :class="[
                'layer-tree-layer-checkbox ps-1 pe-3',
                {
                    'bi-check-square': !(conf.baselayer && singleBaselayer) && isLayerVisible,
                    'bi-square': !(conf.baselayer && singleBaselayer) && !isLayerVisible,
                    'bi-check-circle': conf.baselayer && singleBaselayer && isLayerVisible,
                    'bi-circle': conf.baselayer && singleBaselayer && !isLayerVisible
                }
            ]"
        />
        <i
            v-if="conf.isSecured"
            :class="[securedIcon, 'pe-1']"
        />
        <span
            :class="['layer-tree-layer-label', 'mt-0 d-flex flex-column align-self-start', isBold ? 'font-bold' : '']"
            v-html="$t(conf.shortname || conf.htmlName || conf.name)"
        />
    </button>
</template>

<style lang="scss" scoped>

    .layer-tree-layer-title {
        overflow: hidden;
        line-height: normal;
    }
    .layer-tree-layer-label {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

</style>
