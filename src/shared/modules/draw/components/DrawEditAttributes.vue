<script>
import {Fill, Style, Text, Stroke} from "ol/style.js";
import {Point} from "ol/geom.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

const EXCLUDED_KEYS = new Set([
    "geometry",
    "masterportal_attributes",
    "source",
    "drawType",
    "textContent",
    "textFontSize",
    "textFont",
    "textFillColor"
]);

/**
 * Returns a style function that wraps the feature's original style and appends an asterisk (*)
 * as a marker, when a drawing has attributes.
 * @param {Function|import("ol/style").Style|null} originalStyle The original OL feature style.
 * @returns {Function} A style function returning original styles plus the attribute marker.
 */
function createMarkerStyleFn (originalStyle) {
    const markerStyle = new Style({
        geometry (feature) {
            const extent = feature.getGeometry().getExtent();

            return new Point([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
        },
        text: new Text({
            font: "bold 32px sans-serif",
            fill: new Fill({color: "#93f105"}),
            stroke: new Stroke({width: 4, color: "#2752d9"}),
            text: "*",
            offsetY: 0
        }),
        zIndex: Infinity
    });

    return (feature, resolution) => {
        let baseStyles;

        if (typeof originalStyle === "function") {
            const s = originalStyle(feature, resolution);

            if (Array.isArray(s)) {
                baseStyles = s;
            }
            else if (s) {
                baseStyles = [s];
            }
            else {
                baseStyles = [];
            }
        }
        else if (originalStyle) {
            baseStyles = [originalStyle];
        }
        else {
            baseStyles = [];
        }
        return [...baseStyles, markerStyle];
    };
}

/**
 * Component to display and edit key-value attributes of a selected drawing.
 * Click on a drawing on the map to select it and edit its attributes.
 * @module shared/modules/draw/DrawEditAttributes
 * @vue-prop {ol/layer/Vector|null} layer - The vector layer containing the drawings.
 * @vue-data {ol/Feature|null} selectedFeature - The currently selected drawing.
 * @vue-data {Object[]} attributes - List of {key, originalKey, value} attribute objects.
 * @vue-data {String} newKey - Input value for the new attribute key.
 * @vue-data {String} newValue - Input value for the new attribute value.
 * @vue-data {String} newKeyError - Validation error message for the new key input.
 * @vue-data {Object} validKeys - Map of key → {valid, message} for existing rows.
 */
export default {
    name: "DrawEditAttributes",
    components: {
        IconButton,
        InputText
    },
    props: {
        layer: {
            type: Object,
            required: false,
            default: null
        }
    },
    data () {
        return {
            selectedFeature: null,
            attributes: [],
            newKey: "",
            newValue: "",
            newKeyError: "",
            newValueError: "",
            validKeys: {},
            clickHandler: null
        };
    },
    created () {
        this._selectionMarker = null;
    },
    mounted () {
        this.registerClickHandler();
    },
    beforeUnmount () {
        this._clearSelectionMarker();
        this.unregisterClickHandler();
    },
    methods: {
        /**
         * Registers a singleclick handler on the map to select a drawing.
         * @returns {void}
         */
        registerClickHandler () {
            const map = mapCollection.getMap("2D");

            this.clickHandler = (event) => {
                let found = false;

                map.forEachFeatureAtPixel(event.pixel, (feature, featureLayer) => {
                    if (featureLayer === this.layer) {
                        this.onFeatureClick(feature);
                        found = true;
                        return true;
                    }
                    return false;
                }, {hitTolerance: 10});

                if (!found) {
                    this._clearSelectionMarker();
                    this.selectedFeature = null;
                    this.attributes = [];
                    this.validKeys = {};
                    this.newKey = "";
                    this.newValue = "";
                    this.newKeyError = "";
                }
            };

            map.on("singleclick", this.clickHandler);
        },

        /**
         * Removes the singleclick handler from the map.
         * @returns {void}
         */
        unregisterClickHandler () {
            if (this.clickHandler) {
                mapCollection.getMap("2D").un("singleclick", this.clickHandler);
                this.clickHandler = null;
            }
        },

        /**
         * Applies the selection marker (*) to a feature and saves its original style.
         * @param {ol/Feature} feature The feature to mark.
         * @returns {void}
         */
        _applySelectionMarker (feature) {
            const originalStyle = feature.getStyle();

            this._selectionMarker = {feature, originalStyle};
            feature.setStyle(createMarkerStyleFn(originalStyle));
        },

        /**
         * Restores the previously marked feature's original style.
         * @returns {void}
         */
        _clearSelectionMarker () {
            if (this._selectionMarker) {
                this._selectionMarker.feature.setStyle(this._selectionMarker.originalStyle);
                this._selectionMarker = null;
            }
        },

        /**
         * Loads the clicked feature's attributes into local state.
         * @param {ol/Feature} feature The clicked feature.
         * @returns {void}
         */
        onFeatureClick (feature) {
            this._clearSelectionMarker();
            this._applySelectionMarker(feature);
            this.selectedFeature = feature;
            this.newKey = "";
            this.newValue = "";
            this.newKeyError = "";

            const props = feature.getProperties();

            this.attributes = Object.entries(props)
                .filter(([key]) => !EXCLUDED_KEYS.has(key))
                .map(([key, value]) => ({key, originalKey: key, value: String(value ?? "")}));

            this.checkAttributes();
        },

        /**
         * Adds a new attribute to the selected feature.
         * @returns {void}
         */
        addAttribute () {
            const key = this.newKey.trim();

            if (!key) {
                this.newKeyError = this.$t("common:shared.modules.draw.attributeSelect.attributeKeyError");
                return;
            }
            if (this.attributes.some(a => a.key === key)) {
                this.newKeyError = this.$t("common:shared.modules.draw.attributeSelect.attributeDuplicatedKeyError");
                return;
            }
            if (!this.newValue.trim()) {
                this.newValueError = this.$t("common:shared.modules.draw.attributeSelect.attributeValueError");
                return;
            }

            this.newKeyError = "";
            this.newValueError = "";
            this.attributes.push({key, originalKey: key, value: this.newValue});
            this.selectedFeature?.set(key, this.newValue);
            this.newKey = "";
            this.newValue = "";
            this.checkAttributes();
        },

        /**
         * Removes an attribute from the feature and the local list.
         * @param {Number} idx Index of the attribute to remove.
         * @returns {void}
         */
        removeAttribute (idx) {
            const attr = this.attributes[idx];

            if (!attr) {
                return;
            }
            if (attr.originalKey) {
                this.selectedFeature?.unset(attr.originalKey);
            }
            if (attr.key && attr.key !== attr.originalKey) {
                this.selectedFeature?.unset(attr.key);
            }
            this.attributes.splice(idx, 1);
            this.checkAttributes();
        },

        /**
         * Saves a key change for an existing attribute row.
         * Called on blur of a key input. Handles key renames by unsetting the old key.
         * @param {Number} idx Index of the attribute row.
         * @returns {void}
         */
        saveKeyChange (idx) {
            const attr = this.attributes[idx];

            if (!attr) {
                return;
            }

            const trimmedKey = attr.key.trim();

            attr.key = trimmedKey;

            if (!trimmedKey || trimmedKey === attr.originalKey) {
                this.checkAttributes();
                return;
            }

            this.selectedFeature?.unset(attr.originalKey);
            this.selectedFeature?.set(trimmedKey, attr.value);
            attr.originalKey = trimmedKey;

            this.checkAttributes();
        },

        /**
         * Saves a value change for an existing attribute row.
         * Called on blur or change of a value input.
         * @param {Number} idx Index of the attribute row.
         * @returns {void}
         */
        saveValueChange (idx) {
            const attr = this.attributes[idx];

            if (attr?.key) {
                this.selectedFeature?.set(attr.key, attr.value);
            }
        },

        /**
         * Validates all attribute rows for empty or duplicate keys.
         * Updates validKeys for error display.
         * @returns {Boolean} true if all keys are valid, false otherwise.
         */
        checkAttributes () {
            const seen = {},
                result = {};
            let valid = true;

            this.attributes.forEach(attr => {
                const key = attr.key;

                if (!key || !key.trim()) {
                    result[key] = {
                        valid: false,
                        message: this.$t("common:shared.modules.draw.attributeSelect.attributeKeyError")
                    };
                    valid = false;
                }
                else if (Object.prototype.hasOwnProperty.call(seen, key)) {
                    result[key] = {
                        valid: false,
                        message: this.$t("common:shared.modules.draw.attributeSelect.attributeDuplicatedKeyError")
                    };
                    seen[key].valid = false;
                    seen[key].message = this.$t("common:shared.modules.draw.attributeSelect.attributeDuplicatedKeyError");
                    valid = false;
                }
                else {
                    result[key] = {valid: true, message: ""};
                    seen[key] = result[key];
                }
            });

            this.validKeys = result;
            return valid;
        },

        /**
         * Gets the validation state for a given attribute index.
         * Returns {valid: true} as default if not yet computed.
         * @param {Number} idx Index of the attribute row.
         * @returns {{valid: Boolean, message: String}} The validation state.
         */
        getValidKeyState (idx) {
            const key = this.attributes[idx]?.key;

            return this.validKeys[key] ?? {valid: true, message: ""};
        }
    }
};
</script>

<template>
    <div>
        <p>
            {{ $t("common:shared.modules.draw.attributeSelect.clickHint") }}
        </p>
        <div
            v-if="selectedFeature"
        >
            <div
                v-for="(attribute, idx) in attributes"
                :key="idx"
                class="row align-items-start gx-1 mb-1"
            >
                <div class="col">
                    <InputText
                        :id="'attr-key-' + idx"
                        v-model="attribute.key"
                        :label="$t('common:shared.modules.draw.attributeSelect.input.key')"
                        :placeholder="$t('common:shared.modules.draw.attributeSelect.input.key')"
                        :error-message="getValidKeyState(idx).valid ? null : getValidKeyState(idx).message"
                        :class-obj="{'is-invalid': !getValidKeyState(idx).valid}"
                        @blur="saveKeyChange(idx)"
                        @keyup.enter="saveKeyChange(idx)"
                    />
                </div>
                <div class="col-auto d-flex align-items-center pt-2 separator-col">
                    –
                </div>
                <div class="col">
                    <InputText
                        :id="'attr-value-' + idx"
                        v-model="attribute.value"
                        :label="$t('common:shared.modules.draw.attributeSelect.input.value')"
                        :placeholder="$t('common:shared.modules.draw.attributeSelect.input.value')"
                        @blur="saveValueChange(idx)"
                        @keyup.enter="saveValueChange(idx)"
                    />
                </div>
                <div class="col-auto d-flex align-items-center pt-2">
                    <IconButton
                        :aria="$t('common:shared.modules.draw.attributeSelect.remove')"
                        :icon="'bi bi-trash'"
                        :interaction="() => removeAttribute(idx)"
                        :class-array="['btn-light', 'btn-sm']"
                    />
                </div>
            </div>

            <div class="row align-items-start gx-1 mt-2">
                <div class="col">
                    <InputText
                        id="attr-new-key"
                        v-model="newKey"
                        :label="$t('common:shared.modules.draw.attributeSelect.input.newKey')"
                        :placeholder="$t('common:shared.modules.draw.attributeSelect.input.newKey')"
                        :error-message="newKeyError || null"
                        :class-obj="{'is-invalid': !!newKeyError}"
                        @input="newKeyError = ''"
                        @keyup.enter="addAttribute"
                    />
                </div>
                <div class="col-auto d-flex align-items-center pt-2 separator-col">
                    –
                </div>
                <div class="col">
                    <InputText
                        id="attr-new-value"
                        v-model="newValue"
                        :label="$t('common:shared.modules.draw.attributeSelect.input.newValue')"
                        :placeholder="$t('common:shared.modules.draw.attributeSelect.input.newValue')"
                        :error-message="newValueError || null"
                        :class-obj="{'is-invalid': !!newValueError}"
                        @input="newValueError = ''"
                        @keyup.enter="addAttribute"
                    />
                </div>
                <div class="col-auto d-flex align-items-center pt-2">
                    <IconButton
                        :aria="$t('common:shared.modules.draw.attributeSelect.add')"
                        :icon="'bi bi-plus-lg'"
                        :interaction="addAttribute"
                        :class-array="['btn-light', 'btn-sm']"
                    />
                </div>
            </div>
            <button
                class="btn btn-primary"
                @click="addAttribute"
            >
                {{ $t('common:shared.modules.draw.attributeSelect.accept') }}
            </button>
        </div>
        <p
            v-else
        >
            {{ $t("common:shared.modules.draw.attributeSelect.noFeatureSelected") }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
.separator-col {
    padding: 0 0.25rem;
    line-height: 1;
    margin-top: 0.5rem;
}
</style>
