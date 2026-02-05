<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

/**
 * Component to display a list of all measurements with actions.
 * @module modules/MeasureList
 */
export default {
    name: "MeasureList",
    components: {
        IconButton
    },
    props: {
        /**
         * List of measurements to display
         */
        measurementList: {
            type: Array,
            required: true
        },
        /**
         * Currently selected feature ID
         */
        selectedFeatureId: {
            type: String,
            default: null
        }
    },
    emits: [
        "modify-measurement",
        "delete-measurement",
        "undo-action",
        "redo-action",
        "highlight-feature",
        "unhighlight-feature"
    ],
    methods: {
        /**
         * Gets the icon class for a measurement type
         * @param {String} type - The measurement type (LineString or Polygon)
         * @returns {String} Bootstrap icon class
         */
        getTypeIcon (type) {
            return type === "LineString" ? "bi-rulers" : "bi-bounding-box";
        },
        /**
         * Gets the translated label for a measurement type
         * @param {String} type - The measurement type (LineString or Polygon)
         * @returns {String} Translated type label
         */
        getTypeLabel (type) {
            return type === "LineString"
                ? this.$t("common:modules.measure.lineString")
                : this.$t("common:modules.measure.polygon");
        },
        /**
         * Emits event to modify a measurement
         * @param {String} featureId - The feature ID
         * @returns {void}
         */
        modifyMeasurement (featureId) {
            this.$emit("modify-measurement", featureId);
        },
        /**
         * Emits event to delete a measurement
         * @param {String} featureId - The feature ID
         * @returns {void}
         */
        deleteMeasurement (featureId) {
            this.$emit("delete-measurement", featureId);
        },
        /**
         * Emits undo action event for a specific measurement
         * @param {String} featureId - The feature ID
         * @returns {void}
         */
        undoMeasurement (featureId) {
            this.$emit("undo-action", featureId);
        },
        /**
         * Emits redo action event for a specific measurement
         * @param {String} featureId - The feature ID
         * @returns {void}
         */
        redoMeasurement (featureId) {
            this.$emit("redo-action", featureId);
        },
        /**
         * Emits event to highlight a feature on the map
         * @param {String} featureId - The feature ID
         * @returns {void}
         */
        highlightFeature (featureId) {
            this.$emit("highlight-feature", featureId);
        },
        /**
         * Emits event to remove highlight from a feature
         * @param {String} featureId - The feature ID
         * @returns {void}
         */
        unhighlightFeature (featureId) {
            this.$emit("unhighlight-feature", featureId);
        }
    }
};
</script>

<template>
    <div
        v-if="measurementList.length > 0"
        class="measure-list-container mb-3"
    >
        <h6 class="measure-list-title mb-2">
            {{ $t("common:modules.measure.measurementList") }}
        </h6>
        <div class="measure-list">
            <div
                v-for="measurement in measurementList"
                :key="measurement.id"
                class="measure-list-item"
                :class="{'selected': selectedFeatureId === measurement.id}"
                role="button"
                tabindex="0"
                @mouseenter="highlightFeature(measurement.id)"
                @mouseleave="unhighlightFeature(measurement.id)"
                @focusin="highlightFeature(measurement.id)"
                @focusout="unhighlightFeature(measurement.id)"
            >
                <div class="measure-item-info">
                    <span class="measure-item-type">
                        <i :class="getTypeIcon(measurement.type)" />
                        {{ getTypeLabel(measurement.type) }}
                    </span>
                    <span class="measure-item-value">
                        {{ measurement.displayValue }}
                    </span>
                </div>
                <div class="measure-item-actions">
                    <IconButton
                        :id="'measure-item-undo-' + measurement.id"
                        :aria="$t('common:modules.measure.edit.undo')"
                        :class-array="['btn-sm', 'btn-light']"
                        :disabled="!measurement.canUndo"
                        :interaction="() => undoMeasurement(measurement.id)"
                        icon="bi-arrow-left"
                    />
                    <IconButton
                        :id="'measure-item-redo-' + measurement.id"
                        :aria="$t('common:modules.measure.edit.redo')"
                        :class-array="['btn-sm', 'btn-light']"
                        :disabled="!measurement.canRedo"
                        :interaction="() => redoMeasurement(measurement.id)"
                        icon="bi-arrow-right"
                    />
                    <IconButton
                        :id="'measure-item-modify-' + measurement.id"
                        :aria="$t('common:modules.measure.edit.modify')"
                        :class-array="['btn-sm', 'btn-light']"
                        :interaction="() => modifyMeasurement(measurement.id)"
                        icon="bi-tools"
                    />
                    <IconButton
                        :id="'measure-item-delete-' + measurement.id"
                        :aria="$t('common:modules.measure.edit.delete')"
                        :class-array="['btn-sm', 'btn-light']"
                        :interaction="() => deleteMeasurement(measurement.id)"
                        icon="bi-eraser-fill"
                    />
                </div>
            </div>
        </div>
        <hr>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.measure-list-container {
    .measure-list-title {
        font-weight: bold;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }

    .measure-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid $light_grey;
        border-radius: 4px;
        background-color: $white;
    }

    .measure-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-bottom: 1px solid $light_grey;
        transition: background-color 0.2s;
        cursor: pointer;

        &:last-child {
            border-bottom: none;
        }

        &:hover {
            background-color: $light_blue;
        }

        &.selected {
            background-color: $light_blue;
        }

        .measure-item-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;

            .measure-item-type {
                font-size: 0.85rem;
                color: $dark_grey;
                display: flex;
                align-items: center;
                gap: 0.25rem;

                i {
                    font-size: 0.9rem;
                }
            }

            .measure-item-value {
                font-weight: bold;
                font-size: 0.9rem;
            }
        }

        .measure-item-actions {
            display: flex;
            gap: 0.25rem;
        }
    }
}
</style>
