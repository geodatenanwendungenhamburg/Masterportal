<script>
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {extractEditableState, applyStyleChange} from "../js/editStyleInteractions.js";

/**
 * Subcomponent of DrawEdit that provides rich style editing controls
 * for any selected drawn feature (text, point, line, polygon, circle, icon).
 * @module shared/modules/draw/DrawEditStyle
 * @vue-prop {ol/Feature|null} selectedFeature - The currently selected feature to edit.
 * @vue-data {Object|null} editState - The current editable state values.
 * @vue-data {String} activeKey - The currently expanded layout key (for slider display).
 */
export default {
    name: "DrawEditStyle",
    components: {
        SliderItem,
        InputText
    },
    props: {
        selectedFeature: {
            type: Object,
            default: null
        }
    },
    data () {
        return {
            editState: null,
            activeKey: ""
        };
    },
    computed: {
        /**
         * Returns the edit type of the currently selected feature.
         * @returns {String|null} The feature edit type.
         */
        featureEditType () {
            return this.editState?.editType || null;
        },
        /**
         * Returns true if the feature has fill color editing.
         * @returns {Boolean} Whether fill color is editable.
         */
        hasFillColor () {
            return ["text", "point", "polygon", "circle"].includes(this.featureEditType);
        },
        /**
         * Returns true if the feature has stroke color editing.
         * @returns {Boolean} Whether stroke color is editable.
         */
        hasStrokeColor () {
            return ["point", "line", "polygon", "circle"].includes(this.featureEditType);
        },
        /**
         * Returns true if the feature has stroke width editing.
         * @returns {Boolean} Whether stroke width is editable.
         */
        hasStrokeWidth () {
            return ["point", "line", "polygon", "circle"].includes(this.featureEditType);
        },
        /**
         * Returns true if the feature has fill transparency editing.
         * @returns {Boolean} Whether fill transparency is editable.
         */
        hasFillTransparency () {
            return ["text", "point", "line", "polygon", "circle"].includes(this.featureEditType);
        },
        /**
         * Returns the transparency key name based on edit type.
         * For lines, transparency applies to the stroke; for others, to the fill.
         * @returns {String} The transparency property name.
         */
        transparencyKey () {
            return this.featureEditType === "line" ? "strokeTransparency" : "fillTransparency";
        },
        /**
         * Returns the current transparency value for the UI.
         * @returns {Number} The transparency percentage.
         */
        transparencyValue () {
            if (!this.editState) {
                return 0;
            }
            return this.editState[this.transparencyKey] ?? 0;
        }
    },
    watch: {
        /**
         * Extracts editable state whenever the selected feature changes.
         * @param {ol/Feature|null} feature The new selected feature.
         * @returns {void}
         */
        selectedFeature (feature) {
            this.activeKey = "";
            this.editState = extractEditableState(feature);
        }
    },
    mounted () {
        if (this.selectedFeature) {
            this.editState = extractEditableState(this.selectedFeature);
        }
    },
    methods: {
        /**
         * Applies a single style property change to the feature and updates local state.
         * @param {String} key The property key to change.
         * @param {*} value The new value.
         * @returns {void}
         */
        updateStyle (key, value) {
            if (!this.selectedFeature || !this.editState) {
                return;
            }
            this.editState[key] = value;
            applyStyleChange(this.selectedFeature, {[key]: value});
        },

        /**
         * Applies all current editable state values to the feature at once.
         * Used for confirming text edits that need multiple properties applied together.
         * @returns {void}
         */
        applyAll () {
            if (!this.selectedFeature || !this.editState) {
                return;
            }
            applyStyleChange(this.selectedFeature, this.editState);
        }
    }
};
</script>

<template>
    <div
        v-if="editState"
        class="draw-edit-style mt-3"
    >
        <!-- Text editing -->
        <div v-if="featureEditType === 'text'">
            <InputText
                id="draw-edit-style-text"
                v-model="editState.text"
                :label="$t('common:shared.modules.draw.drawEdit.textLabel')"
                :placeholder="$t('common:shared.modules.draw.drawEdit.textPlaceholder')"
                type="text"
                @update:modelValue="val => updateStyle('text', val)"
            />
            <select
                id="draw-edit-style-font-size"
                v-model="editState.fontSize"
                class="form-select mb-2"
                @change="updateStyle('fontSize', parseInt($event.target.value, 10))"
            >
                <option
                    v-for="s in [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48]"
                    :key="s"
                    :value="s"
                >
                    {{ s }} px
                </option>
            </select>
            <select
                id="draw-edit-style-font"
                v-model="editState.font"
                class="form-select mb-2"
                @change="updateStyle('font', $event.target.value)"
            >
                <option
                    v-for="f in ['Arial', 'Times New Roman', 'Calibri']"
                    :key="f"
                    :value="f"
                >
                    {{ f }}
                </option>
            </select>
        </div>

        <!-- Icon scale -->
        <div v-if="featureEditType === 'icon'">
            <label
                for="draw-edit-style-icon-scale"
                class="form-label"
            >
                {{ $t("common:shared.modules.draw.drawEditStyle.iconScale") }}
            </label>
            <SliderItem
                id="draw-edit-style-icon-scale"
                :aria="`${editState.iconScale}`"
                :label="`${editState.iconScale}`"
                min="0.5"
                max="5"
                :value="editState.iconScale.toString()"
                :step="0.5"
                :interaction="event => updateStyle('iconScale', parseFloat(event.target.value))"
            />
        </div>

        <!-- Point size -->
        <div
            v-if="featureEditType === 'point'"
            class="mb-2"
        >
            <label
                for="draw-edit-style-point-size"
                class="form-label"
            >
                {{ $t("common:shared.modules.draw.drawEditStyle.pointSize") }}
            </label>
            <SliderItem
                id="draw-edit-style-point-size"
                :aria="`${editState.pointSize}px`"
                :label="`${editState.pointSize}px`"
                min="4"
                max="64"
                :value="editState.pointSize.toString()"
                :step="2"
                :interaction="event => updateStyle('pointSize', parseInt(event.target.value, 10))"
            />
        </div>

        <!-- Style buttons row -->
        <div class="draw-edit-style-buttons d-flex flex-row align-items-center flex-wrap">
            <!-- Fill color -->
            <div
                v-if="hasFillColor"
                class="button-container text-center"
            >
                <button
                    id="draw-edit-style-fill-color"
                    :class="['btn', 'btn-secondary']"
                >
                    <i
                        class="bi-paint-bucket"
                        role="img"
                    />
                    <span
                        class="color-preview"
                        :style="{ backgroundColor: editState.fillColor }"
                    />
                    <input
                        type="color"
                        class="color-input-overlay"
                        :value="editState.fillColor"
                        @input="event => updateStyle('fillColor', event.target.value)"
                    >
                </button>
                <span class="text-center btn-label">
                    {{ $t("common:shared.modules.draw.drawLayout.fillColor") }}
                </span>
            </div>

            <!-- Stroke color -->
            <div
                v-if="hasStrokeColor"
                class="button-container text-center"
            >
                <button
                    id="draw-edit-style-stroke-color"
                    :class="['btn', 'btn-secondary']"
                >
                    <i
                        class="bi-pencil-fill"
                        role="img"
                    />
                    <span
                        class="color-preview"
                        :style="{ backgroundColor: editState.strokeColor }"
                    />
                    <input
                        type="color"
                        class="color-input-overlay"
                        :value="editState.strokeColor"
                        @input="event => updateStyle('strokeColor', event.target.value)"
                    >
                </button>
                <span class="text-center btn-label">
                    {{ $t("common:shared.modules.draw.drawLayout.strokeColor") }}
                </span>
            </div>

            <!-- Stroke width -->
            <div
                v-if="hasStrokeWidth"
                class="button-container text-center"
            >
                <button
                    id="draw-edit-style-stroke-width"
                    :class="['btn', 'btn-secondary', activeKey === 'strokeWidth' ? 'active' : '']"
                    @click="activeKey = activeKey === 'strokeWidth' ? '' : 'strokeWidth'"
                >
                    <i
                        class="bi-border-width"
                        role="img"
                    />
                    <span class="btn-value">{{ editState.strokeWidth + 'px' }}</span>
                </button>
                <span class="text-center btn-label">
                    {{ $t("common:shared.modules.draw.drawLayout.strokeWidth") }}
                </span>
            </div>

            <!-- Fill / stroke transparency -->
            <div
                v-if="hasFillTransparency"
                class="button-container text-center"
            >
                <button
                    id="draw-edit-style-transparency"
                    :class="['btn', 'btn-secondary', activeKey === 'transparency' ? 'active' : '']"
                    @click="activeKey = activeKey === 'transparency' ? '' : 'transparency'"
                >
                    <i
                        class="bi-droplet-half"
                        role="img"
                    />
                    <span class="btn-value">{{ transparencyValue + '%' }}</span>
                </button>
                <span class="text-center btn-label">
                    {{ $t("common:shared.modules.draw.drawLayout.fillTransparency") }}
                </span>
            </div>
        </div>

        <!-- Slider for stroke width -->
        <div
            v-if="activeKey === 'strokeWidth' && hasStrokeWidth"
            class="d-flex mt-3"
        >
            <SliderItem
                id="slider-edit-stroke-width"
                :aria="`${editState.strokeWidth}px`"
                :label="`${editState.strokeWidth}px`"
                min="1"
                max="32"
                :value="editState.strokeWidth.toString()"
                :step="1"
                :interaction="event => updateStyle('strokeWidth', parseInt(event.target.value, 10))"
            />
        </div>

        <!-- Slider for transparency -->
        <div
            v-if="activeKey === 'transparency' && hasFillTransparency"
            class="d-flex mt-3"
        >
            <SliderItem
                id="slider-edit-transparency"
                :aria="`${transparencyValue}%`"
                :label="`${transparencyValue}%`"
                min="0"
                max="100"
                :value="transparencyValue.toString()"
                :step="1"
                :interaction="event => updateStyle(transparencyKey, parseInt(event.target.value, 10))"
            />
        </div>
    </div>
    <p v-else>
        {{ $t("common:shared.modules.draw.drawEdit.chooseFeature") }}
    </p>
</template>

<style lang="scss" scoped>
.draw-edit-style-buttons {
    gap: 0.5rem;
}

.button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
}

.btn-label {
    display: block;
    font-size: 0.8rem;
}

.btn-value {
    font-size: 0.75rem;
    width: 100%;
    display: block;
}

.color-preview {
    display: block;
    width: 1.8rem;
    height: 0.6rem;
    border-radius: 4px;
}

.color-input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
}

.draw-edit-style-buttons .btn {
    width: 3.65rem;
    height: 3.65rem;
    position: relative;
    text-align: center;
    font-size: 1.143rem;
    border-radius: 50%;
}
</style>
