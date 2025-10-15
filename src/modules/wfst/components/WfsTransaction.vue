<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import LightButton from "@shared/modules/buttons/components/LightButton.vue";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import SelectTypeButtons from "./SelectTypeButtons.vue";


/**
 * Wfs Transaction
 * @module modules/WfsTransaction
 */
export default {
    name: "WfsTransaction",
    components: {LightButton, ModalItem, SelectTypeButtons},
    computed: {
        ...mapGetters("Modules/Wfst", [
            "currentInteractionConfig",
            "currentLayerIndex",
            "featureProperties",
            "icon",
            "id",
            "layerIds",
            "layerInformation",
            "layerSelectDisabled",
            "layerSelectLabel",
            "name",
            "selectedInteraction",
            "showConfirmModal",
            "showVoidModal",
            "voidModalCallback",
            "showInteractionsButtons",
            "transactionProcessing",
            "isFormDisabled",
            "featurePropertiesBatch",
            "multiUpdate",
            "selectedUpdate",
            "buttonsDisabled",
            "anyInputValue"
        ]),
        ...mapGetters(["allLayerConfigs", "visibleSubjectDataLayerConfigs"])
    },
    watch: {
        /**
         * Detects changes in visible Layers and initializes layers.
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler () {
                this.initializeLayers();
            },
            deep: true
        }
    },
    mounted () {
        this.initializeLayers();
        this.prepareEditButton();
    },
    beforeUnmount () {
        this.reset();
    },
    methods: {
        ...mapMutations("Modules/Wfst", ["setTransactionProcessing", "setCurrentLayerIndex", "setLayerInformation", "setShowConfirmModal", "setShowVoidModal", "setHideVoidModal", "setFeaturePropertiesBatch", "setSelectedSelectInteraction", "setIsDrawMode", "addProcessedMultiPolygon", "setVoidModalCallback"]),
        ...mapActions("Modules/Wfst", ["prepareInteraction", "reset", "resetCancel", "save", "setActive", "saveMulti", "setFeatureProperty", "setFeaturesBatchProperty", "setFeatureProperties", "updateFeatureProperty", "sendTransaction", "switchToDrawMode", "propagateModal", "prepareEditButton", "clearInteractions"]),
        /**
         * Initializes all layers stored in state's layerIds.
         * @returns {void}
         */
        initializeLayers () {
            const newLayerInformation = this.allLayerConfigs.filter(item => this.layerIds.includes(item.id)),
                firstActiveLayer = newLayerInformation.findIndex(layer => layer.visibility),
                currentLayerDeactivated = this.currentLayerIndex > -1 && !newLayerInformation[this.currentLayerIndex].visibility;

            this.setLayerInformation(newLayerInformation);
            if ((this.currentLayerIndex === -1 && firstActiveLayer > -1) ||
                (this.currentLayerIndex > -1 && firstActiveLayer === -1) ||
                (currentLayerDeactivated && firstActiveLayer > -1)) {
                this.setCurrentLayerIndex(firstActiveLayer);
            }
            if (currentLayerDeactivated) {
                this.reset();
            }
            this.setFeatureProperties();
        },
        /**
         * Changes the layer index according user selection
         * @param {Number} index Index of the layer
         * @returns {void}
         */
        layerChanged (index) {
            this.setCurrentLayerIndex(index);
            this.setFeatureProperties();
            this.setFeaturePropertiesBatch();
            this.prepareEditButton();
            this.reset();
        },
        /**
         * Handles the input types
         * @param {String} type Input type
         * @returns {String} Input type
         */
        getInputType (type) {
            if (type === "string") {
                return "text";
            }
            else if (["integer", "int", "decimal", "short", "float"].includes(type)) {
                return "number";
            }
            else if (type === "boolean") {
                return "checkbox";
            }
            else if (type === "date") {
                return "date";
            }
            else if (type === "dateTime") {
                return "datetime-local";
            }
            return "";
        },
        getDecimalStep (type, value) {
            if (type === "decimal" && value) {
                const fractionalPartLength = value.toString().split(",")?.[1]?.length || value.toString().split(".")?.[1]?.length;

                if (fractionalPartLength) {
                    switch (fractionalPartLength) {
                        case 1: return "0.1";
                        case 2: return "0.01";
                        default: return "0.001";
                    }
                }
                return "1";
            }
            return null;
        },
        formatDecimalValue (type, value) {
            if (type === "decimal" && value) {
                if (value.includes(".") || value.includes(",")) {
                    return value.replace(",", ".");
                }
                return value + ".0";
            }
            return value;
        },
        /**
         * Retrieves the control attributes for a specific layer.
         *
         * @param {string} layerId - The ID of the layer to retrieve control attributes for
         * @returns {Array} An array of control attributes for the specified layer
         * If the layer is not found, returns an empty array.
         */
        getControlAttributes (layerId) {
            const layerData = this.multiUpdate.find(item => item.layerId === layerId);

            return layerData ? layerData.controlAttributes : [];
        },
        /**
         * Retrieves the configuration attributes for a specific layer.
         *
         * @param {string} layerId - The ID of the layer to retrieve configuration attributes for.
         * @returns {Array} An array of configuration attributes for the specified layer
         * If the layer is not found, returns an empty array.
         */
        getConfigAttributes (layerId) {
            const layerData = this.multiUpdate.find(item => item.layerId === layerId);

            return layerData ? layerData.configAttributes : [];
        }
    }
};
</script>

<template lang="html">
    <div>
        <div id="tool-wfs-transaction-container">
            <!-- Layer selection -->
            <div class="layer-select-container">
                <label
                    id="tool-wfs-transaction-layer-select-label"
                    for="tool-wfs-transaction-layer-select"
                >
                    {{ $t(layerSelectLabel) }}
                </label>
                <select
                    id="tool-wfs-transaction-layer-select-input"
                    class="form-select"
                    :disabled="layerSelectDisabled"
                    @change="layerChanged($event.target.options.selectedIndex)"
                >
                    <option
                        v-for="(layer, index) of layerInformation"
                        :key="layer.id"
                        :selected="index === currentLayerIndex"
                    >
                        {{ $t(layer.name) }}
                    </option>
                </select>
            </div>
            <!-- Error message if feature properties are a string -->
            <template v-if="typeof featureProperties === 'string'">
                <div class="tool-wfs-transaction-layer-failure mt-5">
                    {{ $t(featureProperties) }}
                </div>
            </template>
            <!-- Interaction buttons -->
            <div
                v-else-if="showInteractionsButtons"
                class="tool-wfs-transaction-interaction-select-container btn-toolbar"
            >
                <div
                    class="btn-group flex-wrap mr-1 mt-5"
                    role="group"
                    aria-label="Control buttons"
                >
                    <template v-for="(config, key) in currentInteractionConfig">
                        <LightButton
                            v-if="config.available"
                            :id="key"
                            :key="key"
                            :text="config.text"
                            :icon="config.icon"
                            :disabled="buttonsDisabled"
                            class="interaction-button"
                            customclasstitle="btn-title-long"
                            :interaction="() => prepareInteraction(key)"
                        />
                    </template>
                </div>
            </div>
            <!-- Feature/Features properties form -->
            <template v-else>
                <div>
                    <hr>
                    <p
                        v-if="currentInteractionConfig.Polygon.available"
                        class="mb-2"
                    >
                        {{ $t("common:modules.wfst.polygonHint") }}
                    </p>
                    <p
                        v-if="featureProperties.find(prop => prop.required)"
                        class="mb-2"
                    >
                        <span><span class="form-label-info"> - </span>{{ $t("common:modules.wfst.fieldRequired") }}</span>
                    </p>
                    <!-- Select type buttons -->
                    <div
                        v-if="selectedUpdate==='multiUpdate'"
                        class="d-flex"
                    >
                        <SelectTypeButtons
                            :select-types="multiUpdate[currentLayerIndex].selectTypes"
                            :select-icons="multiUpdate[currentLayerIndex].selectIcons"
                        />
                    </div>
                    <div v-if="featurePropertiesBatch.length !== 0">
                        <p
                            v-if="$t(multiUpdate[currentLayerIndex]?.warningText) !== 'multiUpdate[currentLayerIndex].warningText'"
                            class="mb-3 mt-3"
                        >
                            {{ $t(multiUpdate[currentLayerIndex]?.warningText) }}
                        </p>
                        <p>
                            {{ featurePropertiesBatch.length }}
                            {{ featurePropertiesBatch.length === 1
                                ? $t("common:modules.wfst.multiUpdate.oneSelected")
                                : $t("common:modules.wfst.multiUpdate.multipleSelected")
                            }}
                        </p>
                    </div>
                    <div
                        v-else-if="selectedUpdate==='multiUpdate'"
                        class="mb-3 mt-3"
                    >
                        {{ $t("common:modules.wfst.multiUpdate.noItemsSelected") }}
                    </div>
                    <!-- Scrollable list of features -->
                    <div
                        v-if="selectedUpdate==='multiUpdate' && featurePropertiesBatch.length !== 0"
                        class="scrollable-list"
                    >
                        <ul>
                            <li
                                v-for="(batchItem, index) in featurePropertiesBatch"
                                :key="`batch-${index}`"
                            >
                                <strong>
                                    {{
                                        batchItem
                                            .filter(property => getConfigAttributes(layerInformation[currentLayerIndex].id).includes(property.key))
                                            .map(property => property.value)
                                            .join(" ")
                                    }}
                                </strong>
                            </li>
                        </ul>
                    </div>
                    <!-- Multi update form -->
                    <form
                        v-if="featurePropertiesBatch.length !== 0"
                        id="tool-wfs-transaction-form"
                    >
                        <template
                            v-for="property in featurePropertiesBatch[0].filter(p => getControlAttributes(layerInformation[currentLayerIndex].id).includes(p.key))"
                            :key="`common-${property.key}`"
                        >
                            <template v-if="property.type !== 'geometry'">
                                <label
                                    :key="`${property.key}-label`"
                                    :for="`tool-wfs-transaction-form-input-${property.key}`"
                                    class="form-label"
                                >
                                    {{ $t(property.label) }}
                                </label>
                                <input
                                    v-if="getInputType(property.type) === 'checkbox'"
                                    :id="`tool-wfs-transaction-form-input-${property.key}`"
                                    :key="`${property.key}-checkbox-input`"
                                    :type="getInputType(property.type)"
                                    :checked="['true', true].includes(property.value) ? true : false"
                                    class="form-control-checkbox"
                                    @input="event => setFeaturesBatchProperty({key: property.key, type: getInputType(property.type), value: event.target.checked})"
                                >
                                <input
                                    v-else
                                    :id="`tool-wfs-transaction-form-input-${property.key}`"
                                    :key="`${property.key}-input`"
                                    class="form-control"
                                    :type="getInputType(property.type)"
                                    :required="property.required"
                                    @input="event => setFeaturesBatchProperty({key: property.key, type: getInputType(property.type), value: event.target.value})"
                                >
                            </template>
                        </template>
                        <div class="tool-wfs-transaction-form-buttons">
                            <LightButton
                                :interaction="resetCancel"
                                :disabled="buttonsDisabled"
                                text="common:modules.wfst.form.discard"
                                class="form-button"
                            />
                            <LightButton
                                :interaction="saveMulti"
                                :disabled="buttonsDisabled || Object.keys(anyInputValue).length === 0"
                                text="common:modules.wfst.form.save"
                                type="button"
                                class="form-button"
                            />
                        </div>
                    </form>
                    <!-- Cancel button in case of no form displayed -->
                    <div
                        v-else-if="featurePropertiesBatch.length == 0 && selectedUpdate==='multiUpdate'"
                        class="tool-wfs-transaction-cancel-button"
                    >
                        <LightButton
                            :interaction="resetCancel"
                            text="common:modules.wfst.form.discard"
                            class="form-button"
                        />
                    </div>
                    <!-- Individual feature update form -->
                    <form
                        v-if="selectedUpdate==='singleUpdate' || selectedInteraction==='insert'"
                        id="tool-wfs-transaction-form"
                    >
                        <template v-for="property in featureProperties">
                            <template v-if="property.type !== 'geometry'">
                                <label
                                    :key="`${property.key}-label`"
                                    :for="`tool-wfs-transaction-form-input-${property.key}`"
                                    class="form-label"
                                    :class="{'form-label__required': property.required && getInputType(property.type) !== 'checkbox'}"
                                >
                                    {{ $t(property.label) }}
                                </label>
                                <input
                                    v-if="getInputType(property.type) ==='checkbox'"
                                    :id="`tool-wfs-transaction-form-input-${property.key}`"
                                    :key="`${property.key}-checkbox-input`"
                                    :type="getInputType(property.type)"
                                    :checked="['true', true].includes(property.value) ? true : false"
                                    class="form-control-checkbox"
                                    @input="event => updateFeatureProperty({
                                        key: property.key,
                                        type: getInputType(property.type),
                                        value: event.target.checked
                                    })"
                                >
                                <input
                                    v-else
                                    :id="`tool-wfs-transaction-form-input-${property.key}`"
                                    :key="`${property.key}-input`"
                                    :class="{
                                        'form-control__valid': property.required && property.valid === true,
                                        'form-control__invalid': property.required && property.valid === false
                                    }"
                                    :step="property.type === 'decimal' ? getDecimalStep(property.type, property.value) : null"
                                    :title="property.required && !property.valid ? $t(`common:modules.wfst.mandatoryInputError.${getInputType(property.type)}`): ''"
                                    :type="getInputType(property.type)"
                                    :required="property.required"
                                    :value="property.value"
                                    @input="event => updateFeatureProperty({
                                        key: property.key,
                                        type: getInputType(property.type),
                                        value: property.type === 'decimal' ? formatDecimalValue(property.type, event.target.value) : event.target.value,
                                        required: property.required
                                    })"
                                >
                            </template>
                        </template>
                        <div class="tool-wfs-transaction-form-buttons">
                            <LightButton
                                :interaction="resetCancel"
                                :disabled="buttonsDisabled"
                                text="common:modules.wfst.form.discard"
                                class="form-button"
                            />
                            <LightButton
                                :interaction="save"
                                :disabled="isFormDisabled || buttonsDisabled"
                                text="common:modules.wfst.form.save"
                                type="button"
                                class="form-button"
                            />
                        </div>
                    </form>
                </div>
            </template>
        </div>
        <div class="d-flex justify-content-center mt-1">
            <div
                v-if="transactionProcessing"
                class="spinner-border"
            />
        </div>
        <ModalItem
            :show-modal="showConfirmModal"
            modal-inner-wrapper-style="padding: 10px;min-width: 30em;"
            modal-1-content-container-style="padding: 0;overflow: auto;max-height: 30em;"
        >
            <div id="confirmActionContainer">
                <h3>
                    {{ $t("common:modules.wfst.deleteInteraction.headline") }}
                </h3>
                <p
                    id="confirmation-textContent"
                >
                    {{ $t("common:modules.wfst.deleteInteraction.text") }}
                </p>

                <div
                    id="confirmation-button-container"
                    name="footer"
                >
                    <button
                        id="modal-button-left"
                        class="btn btn-secondary"
                        @click="sendTransaction(); setShowConfirmModal(false)"
                    >
                        {{ $t("common:modules.button.confirm") }}
                    </button>
                    <button
                        id="modal-button-right"
                        class="btn btn-secondary"
                        @click="setShowConfirmModal(false)"
                    >
                        {{ $t("common:modules.button.stop") }}
                    </button>
                </div>
            </div>
        </ModalItem>
        <ModalItem
            :show-modal="showVoidModal"
            modal-inner-wrapper-style="padding: 10px;min-width: 30em;"
            modal-1-content-container-style="padding: 0;overflow: auto;max-height: 30em;"
        >
            <div id="confirmActionContainer">
                <h3>
                    {{ $t("common:modules.wfst.confirmVoidFeatureCreation.headline") }}
                </h3>
                <p
                    id="confirmation-textContent"
                >
                    {{ $t("common:modules.wfst.confirmVoidFeatureCreation.textContent") }}
                </p>

                <div
                    id="confirmation-button-container"
                    name="footer"
                >
                    <button
                        id="modal-button-left"
                        class="btn btn-secondary"
                        @click="voidModalCallback.actionConfirmedCallback();setHideVoidModal()"
                    >
                        {{ $t("common:modules.button.confirm") }}
                    </button>
                    <button
                        id="modal-button-right"
                        class="btn btn-secondary"
                        @click="voidModalCallback.actionDeniedCallback();setHideVoidModal()"
                    >
                        {{ $t("common:modules.button.stop") }}
                    </button>
                </div>
            </div>
        </ModalItem>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
.tool-wfs-transaction-cancel-button {
    margin-top: 20px;
    display: inline-block;
    text-align: right;
}

#delete:focus, #update:focus,  #multiUpdate:focus {
    background-color:$light_blue;
}
.spinner-border {
    border: 4px solid $primary;
    border-radius: 50%;
    border-top: 4px solid $dark_blue;
    width: 25px;
    height: 25px;
}
h3 {
    border:none;
    color: grey;
    font-size:14px;
    font-weight:bold;
    letter-spacing:initial;
    line-height:18px;
    padding:0;
}
#confirmation-textContent {
    color:#777777;
    font-size:12px;
}
#confirmation-button-container {
    overflow:hidden;
    margin-top:12px;
}
.scrollable-list {
  height: 110px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 2px;
}
.scrollable-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.scrollable-list li {
  padding: 2px 0;
}
#modal-button-left {
    float:left;
    margin: 0 12px 0 0;
}
#modal-button-right {
    float:right;
    margin: 0 0 0 12px;
}
#tool-wfs-transaction-container {
    .layer-select-container {
        display: flex;
        justify-content: space-between;
        width: 25em;

        #tool-wfs-transaction-layer-select-label {
            width: 5em;
            align-self: center;
            margin-right: 1em;
        }
    }

    .tool-wfs-transaction-layer-failure {
        display: flex;
        justify-content: center;
        align-content: center;
        margin-top: 1em;
    }

   .tool-wfs-transaction-interaction-select-container {
        .interaction-button {
            border-radius: 0
        }
        .interaction-button:first-child {
            margin-left: 0;
        }
        .interaction-button:last-child {
            margin-right: 0;
        }
    }

    #tool-wfs-transaction-form {
        margin-top: 1em;
        display: grid;
        grid-template-columns: 8em 20em;
        row-gap: 0.5em;
        column-gap: 3em;

        .form-label {
            align-self: center;
            margin: 0;
        }
        .form-control.form-control__valid {
            border: 1px solid green;
        }
        .form-control.form-control__invalid {
            border: 1px solid red;
        }
    }
    .form-label__required::after,
    .form-label-info::before {
        content: "*";
        color: red;
    }

    .tool-wfs-transaction-form-buttons {
        display: grid;
        grid-template-columns: repeat(2, 12.5em);
        margin-top: calc(#{1em} / 2);

        .form-button:first-child {
            margin-right: calc(#{1em} / 2);
        }
        .form-button:last-child {
            margin-left: calc(#{1em} / 2);
        }
    }
}
</style>
