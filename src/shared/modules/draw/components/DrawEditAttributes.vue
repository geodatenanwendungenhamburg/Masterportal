<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {createMarkerStyleFn} from "../js/editStyleInteractions.js";

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
        InputText,
        FlatButton
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
            clickHandler: null,
            addFeatureHandler: null
        };
    },
    watch: {
        /**
         * Rebinds source listeners when the layer changes.
         * @param {ol/layer/Vector|null} newLayer The new layer.
         * @param {ol/layer/Vector|null} oldLayer The previous layer.
         * @returns {void}
         */
        layer (newLayer, oldLayer) {
            if (newLayer === oldLayer) {
                return;
            }
            this.unregisterAddFeatureHandler(oldLayer?.getSource?.());
            this.registerAddFeatureHandler(newLayer?.getSource?.());
        }
    },
    created () {
        this.selectionMarker = null;
    },
    mounted () {
        this.registerClickHandler();
        this.registerAddFeatureHandler();
    },
    beforeUnmount () {
        this.clearSelectionMarker();
        this.unregisterClickHandler();
        this.unregisterAddFeatureHandler();
    },
    methods: {
        /**
         * Returns all features from the configured layer.
         * @returns {ol/Feature[]} List of draw features.
         */
        getAllFeatures () {
            return this.layer?.getSource()?.getFeatures() ?? [];
        },

        /**
         * Returns known user-facing attribute keys from all features.
         * @param {ol/Feature} [excludedFeature] Optional feature to skip.
         * @returns {String[]} List of known attribute keys.
         */
        getKnownAttributeKeys (excludedFeature = undefined) {
            const keys = new Set();

            this.getAllFeatures().forEach(feature => {
                if (feature === excludedFeature) {
                    return;
                }
                Object.keys(feature.getProperties()).forEach(key => {
                    if (!EXCLUDED_KEYS.has(key)) {
                        keys.add(key);
                    }
                });
            });

            return Array.from(keys);
        },

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
                    this.clearSelectionMarker();
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
         * Registers a handler to sync known attribute keys to newly added features.
         * @returns {void}
         */
        registerAddFeatureHandler (source = this.layer?.getSource?.()) {

            if (!source || this.addFeatureHandler) {
                return;
            }

            this.addFeatureHandler = (event) => {
                const feature = event?.feature,
                      knownKeys = this.getKnownAttributeKeys(feature);

                if (!feature || knownKeys.length === 0) {
                    return;
                }

                knownKeys.forEach(key => {
                    if (!Object.prototype.hasOwnProperty.call(feature.getProperties(), key)) {
                        feature.set(key, "");
                    }
                });

                this.updateGfiAttributes();
            };

            source.on("addfeature", this.addFeatureHandler);
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
         * Removes the addfeature handler from the layer source.
         * @returns {void}
         */
        unregisterAddFeatureHandler (source = this.layer?.getSource?.()) {

            if (source && this.addFeatureHandler) {
                source.un("addfeature", this.addFeatureHandler);
                this.addFeatureHandler = null;
            }
        },

        /**
         * Applies the selection marker (*) to a feature and saves its original style.
         * @param {ol/Feature} feature The feature to mark.
         * @returns {void}
         */
        applySelectionMarker (feature) {
            const originalStyle = feature.getStyle();

            this.selectionMarker = {feature, originalStyle};
            feature.setStyle(createMarkerStyleFn(originalStyle));
        },

        /**
         * Restores the previously marked feature's original style.
         * @returns {void}
         */
        clearSelectionMarker () {
            if (this.selectionMarker) {
                this.selectionMarker.feature.setStyle(this.selectionMarker.originalStyle);
                this.selectionMarker = null;
            }
        },

        /**
         * Loads the clicked feature's attributes into local state.
         * @param {ol/Feature} feature The clicked feature.
         * @returns {void}
         */
        onFeatureClick (feature) {
            this.clearSelectionMarker();
            this.applySelectionMarker(feature);
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

            this.getAllFeatures().forEach(feature => {
                if (feature === this.selectedFeature) {
                    feature.set(key, this.newValue);
                }
                else if (!Object.prototype.hasOwnProperty.call(feature.getProperties(), key)) {
                    feature.set(key, "");
                }
            });

            this.newKey = "";
            this.newValue = "";
            this.updateGfiAttributes();
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
            this.getAllFeatures().forEach(feature => {
                if (attr.originalKey) {
                    feature.unset(attr.originalKey);
                }
                if (attr.key && attr.key !== attr.originalKey) {
                    feature.unset(attr.key);
                }
            });

            this.attributes.splice(idx, 1);
            this.updateGfiAttributes();
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

            this.getAllFeatures().forEach(feature => {
                if (Object.prototype.hasOwnProperty.call(feature.getProperties(), attr.originalKey)) {
                    feature.set(trimmedKey, String(feature.get(attr.originalKey) ?? ""));
                }
                else if (!Object.prototype.hasOwnProperty.call(feature.getProperties(), trimmedKey)) {
                    feature.set(trimmedKey, "");
                }

                feature.unset(attr.originalKey);
            });

            attr.originalKey = trimmedKey;

            this.updateGfiAttributes();

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

            this.updateGfiAttributes();
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
        },
        /**
         * Updates the layer's gfiAttributes to show only user-facing attribute keys and no internal keys like the ones stored in masterportal_attributes.
         * @returns {void}
         */
        updateGfiAttributes () {
            if (!this.layer) {
                return;
            }
            const allFeatures = this.getAllFeatures(),
                  gfiAttrs = {};

            allFeatures.forEach(feature => {
                Object.keys(feature.getProperties()).forEach(key => {
                    if (!EXCLUDED_KEYS.has(key)) {
                        gfiAttrs[key] = key;
                    }
                });
            });

            this.layer.set("gfiAttributes", gfiAttrs);
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
            <FlatButton
                :interaction="addAttribute"
                text="common:shared.modules.draw.attributeSelect.accept"
            />
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
