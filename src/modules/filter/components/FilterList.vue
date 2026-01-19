<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {translateKeyWithPlausibilityCheck} from "@shared/js/utils/translateKeyWithPlausibilityCheck.js";
import {mapActions, mapGetters} from "vuex";
import {isRule} from "../utils/isRule.js";
import {hasUnfixedRules} from "../utils/hasUnfixedRules.js";

/**
 * Filter List
 * @module modules/FilterList
 * @vue-prop {Boolean} multiLayerSelector - Shows if multi layer selection is allowed.
 * @vue-prop {Array} filters - List of all the filters.
 * @vue-prop {Array} selectedLayers - List of all the selected layers.
 * @vue-prop {Number} jumpToId - The id it should scroll to.
 * @vue-data {Array} itemRefs - The references to the item.
 * @vue-computed {Boolean} disabled - Shows if button should be disabled.
 * @vue-event {String} selectedAccordions - Updates the selected accordions.
 * @vue-event {String} setLayerLoaded - Emitting the function by transferring the filter Id of layer.
 * @vue-event {null} resetJumpToId - Resets the function.
 */
export default {
    name: "FilterList",
    components: {
        AccordionItem
    },
    props: {
        collapseButtons: {
            type: Boolean,
            required: false,
            default: false
        },
        multiLayerSelector: {
            type: Boolean,
            required: false,
            default: true
        },
        filters: {
            type: Array,
            required: false,
            default: () => []
        },
        selectedLayers: {
            type: Array,
            required: false,
            default: () => []
        },
        jumpToId: {
            type: Number,
            required: false,
            default: undefined
        }
    },
    emits: ["selectedAccordions", "setLayerLoaded", "resetJumpToId", "deleteAllRules"],
    data () {
        return {
            itemRefs: []
        };
    },
    computed: {
        ...mapGetters("Modules/Filter", ["rulesOfFilters", "shouldSubjectDataSelectedInTree"]),
        ...mapGetters(["layerConfigById"])
    },
    watch: {
        jumpToId (newFilterId) {
            this.scrollToView(newFilterId);
        }
    },
    mounted () {
        this.scrollToView(this.jumpToId);
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        translateKeyWithPlausibilityCheck,
        hasUnfixedRules,
        isRule,

        /**
         * Checks if layer is visible.
         * @param {String} layerId - The layer id.
         * @returns {Boolean} true, if the layer is visible.
         */
        isLayerVisible (layerId) {
            if (!this.shouldSubjectDataSelectedInTree) {
                return true;
            }
            return this.layerConfigById(layerId)?.visibility === true;
        },

        /**
         * Updates selectedLayers array.
         * @param {Number} filterId id which should be removed or added to selectedLayers array
         * @returns {void}
         */
        updateSelectedLayers (filterId) {
            if (typeof filterId !== "number") {
                return;
            }
            this.$emit("selectedAccordions", filterId);
        },
        /**
         * Emitting the function by transfering the filter Id of layer
         * @param {Number} filterId id to check if should be disabled
         * @returns {void}
         */
        setLayerLoaded (filterId) {
            this.$emit("setLayerLoaded", filterId);
        },
        /**
         * Checks if the layer with a given filterId is selected and a rule is defined.
         * @param {number} filterId - The filterId.
         * @param {Array} selectedLayers - The selected layers.
         * @param {Array} rulesOfFilters - The rules of filters.
         * @returns {Boolean} true, if the rules number is to be displayed.
         */
        showRulesNumber (filterId, selectedLayers, rulesOfFilters) {
            if (typeof filterId !== "number" || !Array.isArray(selectedLayers) || !Array.isArray(rulesOfFilters[filterId])) {
                return false;
            }
            return !selectedLayers.some(layers => layers.filterId === filterId) && rulesOfFilters[filterId].some(rule => isRule(rule));
        },
        /**
         * Returns the number of the defined rules.
         * @param {number} filterId - The filterId.
         * @param {Array} rulesOfFilters - The rules of filters.
         * @returns {number} The defined rules number.
         */
        getRulesNumber (filterId, rulesOfFilters) {
            let i = 0;

            if (typeof filterId !== "number" || typeof rulesOfFilters === "undefined" || !Array.isArray(rulesOfFilters[filterId])) {
                return i;
            }

            rulesOfFilters[filterId].forEach(rule => {
                if (isRule(rule) && rule?.fixed !== true) {
                    i++;
                }
            });
            return i;
        },
        /**
         * Scrolls to given filterId.
         * @param {Number} filterId The filterId to jump to.
         * @returns {void}
         */
        scrollToView (filterId) {
            if (typeof filterId !== "number" || !this.filters.some(filter => filter.filterId === filterId)) {
                return;
            }
            const filter = Array.isArray(this.$refs[filterId]) ? this.$refs[filterId][0] : this.$refs[filterId];

            if (filter && typeof filter.scrollIntoView === "function") {
                this.$nextTick(() => {
                    filter.scrollIntoView({behavior: "smooth"});
                });
            }
            else {
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:modules.filter.alertingMessages.noMatchingFilterId"), {root: true});
            }
            this.$emit("resetJumpToId");
            if (!this.selectedLayers.some(selectedLayer => selectedLayer.filterId === filterId)) {
                this.updateSelectedLayers(filterId);
            }
        },
        setItemRef (el) {
            if (el) {
                this.itemRefs.push(el);
            }
        },
        /**
         * Emits 'deleteAllRules' event.
         * @param {Number} filterId The filter id which triggers the emit.
         * @returns {void}
         */
        deleteAllRulesEmit (filterId) {
            this.$emit("deleteAllRules", filterId);
        },
        /**
         * Checks if selector should be disabled.
         * @param {Number} filterId id to check if should be disabled
         * @returns {Boolean} if button should be disabled
         */
        disabled (filterId) {
            return this.selectedLayers.length === 0 || !this.multiLayerSelector && this.selectedLayers.length > 0 && !this.selectedLayers.some(accordion => accordion.filterId === filterId);
        }
    }
};
</script>

<template>
    <div
        v-if="!collapseButtons"
    >
        <div
            class="panel-group ps-3"
            role="tablist"
        >
            <div
                v-for="filter in filters"
                :id="'filter-' + filter.filterId"
                :ref="setItemRef"
                :key="filter.filterId"
                class="panel panel-default"
            >
                <AccordionItem
                    v-if="filter.active && multiLayerSelector && isLayerVisible(filter.layerId)"
                    :id="filter.layerId + '-' + filter.filterId"
                    :title="filter.title ? filter.title : filter.layerId"
                    :is-open="true"
                    :icon="filter.icon"
                    class="filter-layer"
                    @update-accordion-state="setLayerLoaded(filter.filterId), updateSelectedLayers(filter.filterId)"
                >
                    <div
                        v-if="filter.shortDescription && selectedLayers.find(layers => layers.filterId === filter.filterId)"
                        class="layerInfoText"
                    >
                        {{ translateKeyWithPlausibilityCheck(filter.shortDescription, key => $t(key)) }}
                    </div>
                    <slot
                        :layer="filter"
                    />
                </AccordionItem>
                <AccordionItem
                    v-else-if="!multiLayerSelector && isLayerVisible(filter.layerId)"
                    :id="filter.layerId + '-' + filter.filterId"
                    :title="filter.title ? filter.title : filter.layerId"
                    :is-open="!disabled(filter.filterId)"
                    :icon="filter.icon"
                    class="filter-layer"
                    @update-accordion-state="setLayerLoaded(filter.filterId), updateSelectedLayers(filter.filterId)"
                >
                    <div
                        v-if="filter.shortDescription && selectedLayers.find(layers => layers.filterId === filter.filterId)"
                        class="layerInfoText"
                    >
                        {{ translateKeyWithPlausibilityCheck(filter.shortDescription, key => $t(key)) }}
                    </div>
                    <slot
                        :layer="filter"
                    />
                </AccordionItem>
                <AccordionItem
                    v-else-if="isLayerVisible(filter.layerId)"
                    :id="filter.layerId + '-' + filter.filterId"
                    :title="filter.title ? filter.title : filter.layerId"
                    :icon="filter.icon"
                    class="filter-layer"
                    @update-accordion-state="setLayerLoaded(filter.filterId), updateSelectedLayers(filter.filterId)"
                >
                    <div
                        v-if="filter.shortDescription && selectedLayers.find(layers => layers.filterId === filter.filterId)"
                        class="layerInfoText"
                    >
                        {{ translateKeyWithPlausibilityCheck(filter.shortDescription, key => $t(key)) }}
                    </div>
                    <slot
                        :layer="filter"
                    />
                </AccordionItem>
                <div class="number">
                    <div
                        :class="['d-flex align-items-center header-color', disabled(filter.filterId) ? 'disabled' : '']"
                    >
                        <div
                            v-if="showRulesNumber(filter.filterId, selectedLayers, rulesOfFilters) && getRulesNumber(filter.filterId, rulesOfFilters) > 0"
                            class="rules-number"
                        >
                            <span>
                                {{ getRulesNumber(filter.filterId, rulesOfFilters) }}
                            </span>
                        </div>
                    </div>
                </div>
                <div
                    v-if="filter.shortDescription && !selectedLayers.find(layers => layers.filterId === filter.filterId)"
                    class="layerInfoText"
                >
                    {{ translateKeyWithPlausibilityCheck(filter?.shortDescription, key => $t(key)) }}
                </div>
                <hr class="mb-1">
            </div>
        </div>
    </div>
    <div
        v-else
    >
        <div
            class="collapse-group ps-3 row g-1"
        >
            <div
                v-for="filter in filters"
                :id="'filter-' + filter.filterId"
                :ref="setItemRef"
                :key="filter.filterId"
                :class="'col col-md-auto'"
            >
                <button
                    class="button-collapse btn btn-secondary"
                    :class="{active: selectedLayers.some(layers => layers.filterId === filter.filterId)}"
                    data-bs-toggle="collapse"
                    data-bs-target="multi-collapse"
                    aria-expanded="false"
                    @click="setLayerLoaded(filter.filterId), updateSelectedLayers(filter.filterId)"
                    @keydown.enter="setLayerLoaded(filter.filterId), updateSelectedLayers(filter.filterId)"
                >
                    <div class="w-100 row">
                        <div
                            class="col col-md-auto text-nowrap"
                        >
                            {{ filter.title ? filter.title : filter.layerId }}
                        </div>
                        <div
                            v-if="showRulesNumber(filter.filterId, selectedLayers, rulesOfFilters) && getRulesNumber(filter.filterId, rulesOfFilters) > 0"
                            class="col col-md-1 m-0"
                        >
                            <span
                                class="outline-rules-number ms-0"
                            >
                                {{ getRulesNumber(filter.filterId, rulesOfFilters) }}
                            </span>
                        </div>
                    </div>
                </button>
                <div
                    v-if="filter.shortDescription && !selectedLayers.includes(filter.filterId) && !collapseButtons"
                    class="layerInfoText"
                >
                    {{ translateKeyWithPlausibilityCheck(filter?.shortDescription, key => $t(key)) }}
                </div>
            </div>
        </div>
        <div
            v-for="filter in filters"
            :key="filter.filterId"
        >
            <slot
                :layer="filter"
            />
            <div />
        </div>
    </div>
</template>

<style lang="scss" scoped>

.header-color {
   color: $light_grey_inactive_contrast;
}

.panel {
    position: relative;
}
.panel-group .panel + .panel {
    margin-top: 10px;
}
.panel-default > .panel-heading {
    cursor: default;
    background-color: $white;
}
.panel-default > .panel-heading.disabled {
    background-color: $light_grey;
}
.panel-title {
    cursor: pointer;
}
.btn-transparent {
    background-color: transparent;
    border: none;
    text-align:left;
}
.outline-rules-number {
    margin-left: 0.625rem;
    text-align: center;
    user-select: none;
    color: $dark_grey;
    display: inline;
    padding: 0.275rem 0.875rem;
    font-size: $font-size-sm;
    font-family: $font_family_accent;
    vertical-align: middle;
    border-radius: 0.688rem;
    background-color: $light_grey;
}
.reset {
    position: absolute;
    right: 80px;
    top: -5px;
    z-index: 11;
}
.number {
    position: absolute;
    right: 50px;
    top: 0;
    z-index: 10;
    .rules-number {
        margin-bottom: 0.5rem;
        span {
            margin-left: 0.625rem;
            text-align: center;
            user-select: none;
            color: #ffffff;
            display: inline;
            padding: 0.275rem 0.875rem;
            font-size: $font-size-sm;
            font-weight: 100;
            vertical-align: middle;
            border-radius: 0.688rem;
            background-color: #3C5F94;
            border-color: #3C5F94;
        }
    }
}
.btn-secondary {
    border-radius: $badge-border-radius;
}
hr {
    background-color: $navbar-light-color;
    height: 1px;
    border: none;
}
.panel-group hr {
    border-width: 1px;
    border-color: $light_grey_active;
}
.panel-group div:last-child hr {
  display: none;
}
</style>

<style lang="scss">
.filter-layer {
    button, .accordion-body {
        padding: 0px;
    }
    .accordion-collapse {
        margin-top: 10px;
    }
    .ps-3 {
        padding-left: 0;
    }
}
</style>
