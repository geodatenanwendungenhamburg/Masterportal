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
        },
        /**
         * ID of the feature currently being modified
         */
        currentlyModifyingFeatureId: {
            type: [String, Number],
            default: null
        },
        /**
         * Active measurement being drawn
         */
        activeMeasurement: {
            type: Object,
            default: null
        },
        /**
         * Can undo in active sketch
         */
        canUndoActive: {
            type: Boolean,
            default: false
        },
        /**
         * Can redo in active sketch
         */
        canRedoActive: {
            type: Boolean,
            default: false
        }
    },
    emits: [
        "modify-measurement",
        "delete-measurement",
        "undo-action",
        "redo-action",
        "highlight-feature",
        "unhighlight-feature",
        "rename-measurement",
        "undo-active-sketch",
        "redo-active-sketch"
    ],
    data () {
        return {
            editingFeatureId: null,
            editingName: ""
        };
    },
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
        },
        /**
         * Checks if a feature is currently being modified
         * @param {String} featureId - The feature ID
         * @returns {Boolean} True if the feature is being modified
         */
        isModifying (featureId) {
            if (!this.currentlyModifyingFeatureId) {
                return false;
            }
            const normalizedCurrent = typeof this.currentlyModifyingFeatureId === "string" ?
                parseInt(this.currentlyModifyingFeatureId, 10) : this.currentlyModifyingFeatureId;
            const normalizedFeature = typeof featureId === "string" ?
                parseInt(featureId, 10) : featureId;

            return normalizedCurrent === normalizedFeature;
        },
        /**
         * Gets the modify button text based on whether feature is being modified
         * @param {String} featureId - The feature ID
         * @returns {String} Button text
         */
        getModifyButtonText (featureId) {
            return this.isModifying(featureId)
                ? this.$t("common:modules.measure.edit.finishModify")
                : this.$t("common:modules.measure.edit.modify");
        },
        /**
         * Starts editing the name of a measurement
         * @param {Object} measurement - The measurement object
         * @returns {void}
         */
        startEditingName (measurement) {
            this.editingFeatureId = measurement.id;
            this.editingName = measurement.customName || this.getTypeLabel(measurement.type);
            this.$nextTick(() => {
                const input = this.$refs[`nameInput-${measurement.id}`];

                if (input && input[0]) {
                    input[0].focus();
                    input[0].select();
                }
            });
        },
        /**
         * Saves the edited name
         * @param {String} featureId - The feature ID
         * @returns {void}
         */
        saveEditedName (featureId) {
            const trimmedName = this.editingName.trim();

            if (trimmedName) {
                this.$emit("rename-measurement", {featureId, name: trimmedName});
            }
            this.editingFeatureId = null;
            this.editingName = "";
        },
        /**
         * Cancels editing the name
         * @returns {void}
         */
        cancelEditingName () {
            this.editingFeatureId = null;
            this.editingName = "";
        },
        /**
         * Gets the display name for a measurement
         * @param {Object} measurement - The measurement object
         * @returns {String} Display name
         */
        getDisplayName (measurement) {
            return measurement.customName || this.getTypeLabel(measurement.type);
        },
        /**
         * Emits undo action event for active sketch
         * @returns {void}
         */
        undoActiveSketch () {
            this.$emit("undo-active-sketch");
        },
        /**
         * Emits redo action event for active sketch
         * @returns {void}
         */
        redoActiveSketch () {
            this.$emit("redo-active-sketch");
        }
    }
};
</script>

<template>
    <div>
        <!-- Active Measurement Section -->
        <div
            v-if="activeMeasurement"
            class="active-measurement-container mb-3"
        >
            <h6 class="active-measurement-title mb-2">
                {{ $t("common:modules.measure.activeMeasurement") }}
            </h6>
            <div class="active-measurement-card">
                <div class="active-measurement-info">
                    <span class="active-measurement-type">
                        <i :class="getTypeIcon(activeMeasurement.type)" />
                        {{ getTypeLabel(activeMeasurement.type) }}
                    </span>
                    <span class="active-measurement-value">
                        {{ activeMeasurement.displayValue }}
                    </span>
                </div>
                <div class="active-measurement-actions">
                    <IconButton
                        id="measure-active-undo"
                        :aria="$t('common:modules.measure.edit.undo')"
                        :class-array="['btn-sm', 'btn-light']"
                        :disabled="!canUndoActive"
                        :interaction="undoActiveSketch"
                        icon="bi-arrow-left"
                        :title="$t('common:modules.measure.edit.undo')"
                    />
                    <IconButton
                        id="measure-active-redo"
                        :aria="$t('common:modules.measure.edit.redo')"
                        :class-array="['btn-sm', 'btn-light']"
                        :disabled="!canRedoActive"
                        :interaction="redoActiveSketch"
                        icon="bi-arrow-right"
                        :title="$t('common:modules.measure.edit.redo')"
                    />
                </div>
            </div>
        </div>

        <!-- Completed Measurements List -->
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
                    :class="{ 'selected': selectedFeatureId === measurement.id }"
                    role="button"
                    tabindex="0"
                    @mouseenter="highlightFeature(measurement.id)"
                    @mouseleave="unhighlightFeature(measurement.id)"
                    @focusin="highlightFeature(measurement.id)"
                    @focusout="unhighlightFeature(measurement.id)"
                >
                    <div class="measure-item-info">
                        <span
                            v-if="editingFeatureId !== measurement.id"
                            class="measure-item-type"
                            role="button"
                            tabindex="0"
                            @dblclick="startEditingName(measurement)"
                            @keydown.enter="startEditingName(measurement)"
                        >
                            <i :class="getTypeIcon(measurement.type)" />
                            {{ getDisplayName(measurement) }}
                        </span>
                        <input
                            v-else
                            :ref="'nameInput-' + measurement.id"
                            v-model="editingName"
                            type="text"
                            class="form-control form-control-sm measure-item-name-input"
                            @keydown.enter="saveEditedName(measurement.id)"
                            @keydown.esc="cancelEditingName"
                            @blur="saveEditedName(measurement.id)"
                        >
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
                            :aria="getModifyButtonText(measurement.id)"
                            :class-array="['btn-sm', isModifying(measurement.id) ? 'btn-modify-active' : 'btn-light']"
                            :interaction="() => modifyMeasurement(measurement.id)"
                            icon="bi-tools"
                            :title="getModifyButtonText(measurement.id)"
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
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.active-measurement-container {
    .active-measurement-title {
        font-weight: bold;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        color: $dark_grey;
    }

    .active-measurement-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border: 2px solid #001B3D;
        border-radius: 6px;
        background-color: lighten(#001B3D, 70%);
        transition: all 0.2s;

        .active-measurement-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;

            .active-measurement-type {
                font-size: 0.9rem;
                color: $dark_grey;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-weight: 500;

                i {
                    font-size: 1rem;
                    color: #001B3D;
                }
            }

            .active-measurement-value {
                font-weight: bold;
                font-size: 1rem;
                color: #001B3D;
            }
        }

        .active-measurement-actions {
            display: flex;
            gap: 0.5rem;
        }
    }
}

.measure-list-container {
    .measure-list-title {
        font-weight: bold;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        margin-top: 0.75rem;
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
                cursor: text;

                i {
                    font-size: 0.9rem;
                }
            }

            .measure-item-name-input {
                font-size: 0.85rem;
                padding: 0.125rem 0.25rem;
                height: auto;
            }

            .measure-item-value {
                font-weight: bold;
                font-size: 0.9rem;
            }
        }

        .measure-item-actions {
            display: flex;
            gap: 0.25rem;

            :deep(.btn-modify-active) {
                --bs-btn-color: #ffffff;
                --bs-btn-bg: #001B3D;
                --bs-btn-border-color: #001B3D;
                --bs-btn-hover-color: #ffffff;
                --bs-btn-hover-bg: #3C5F94;
                --bs-btn-hover-border-color: #3C5F94;
            }
        }
    }
}
</style>
