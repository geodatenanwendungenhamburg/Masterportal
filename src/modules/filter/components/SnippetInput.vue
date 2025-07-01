<script>
import {getDefaultOperatorBySnippetType} from "../utils/getDefaultOperatorBySnippetType.js";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import SnippetInfo from "./SnippetInfo.vue";
import {translateKeyWithPlausibilityCheck} from "@shared/js/utils/translateKeyWithPlausibilityCheck.js";

/**
* Snippet Input
* @module modules/SnippetInput
* @vue-prop {String} attrName - The title and aria label.
* @vue-prop {Array} adjustment - The changes made by other snippets that change settings in this snippet. E.g. one snippet changes to "Grundschulen" and other snippets change their min value as a result of the adjustment.
* @vue-prop {Boolean} disabled - Shows if snippet is disabled.
* @vue-prop {Array} info - The information for the SnippetInfo.
* @vue-prop {Array} title - The label.
* @vue-prop {String} operator - (???).
* @vue-prop {String} placeholder - The placeholder for the multiselect.
* @vue-prop {String} prechecked - (???).
* @vue-prop {Number} snippetId - The snippet's id.
* @vue-prop {Boolean} visible - Shows if snippet is visible.
*
* @vue-data {Boolean} isInitializing - Shows if snippet is initializing.
* @vue-data {String} translationKey - The translation key.
* @vue-data {Array} operatorWhitelist - The operator white list.
* @vue-data {String} value - The value for the input.
*
* @vue-event {Object} changeRule - Emits the current rule to whoever is listening.
* @vue-event {Number} deleteRule - Emits the delete rule function to whoever is listening.
* @vue-event {*} setSnippetPrechecked - Emits the setSnippetPrechecked event.
*/
export default {
    name: "SnippetInput",
    components: {
        InputText,
        SnippetInfo
    },
    props: {
        attrName: {
            type: [String, Array],
            required: false,
            default: ""
        },
        adjustment: {
            type: [Object, Boolean],
            required: false,
            default: false
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        info: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        title: {
            type: [String, Boolean],
            required: false,
            default: true
        },
        operatorForAttrName: {
            type: String,
            required: false,
            default: "AND"
        },
        operator: {
            type: String,
            required: false,
            default: undefined
        },
        placeholder: {
            type: String,
            required: false,
            default: ""
        },
        prechecked: {
            type: [String, Array],
            required: false,
            default: ""
        },
        snippetId: {
            type: Number,
            required: false,
            default: 0
        },
        visible: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    emits: ["changeRule", "deleteRule", "setSnippetPrechecked"],
    data () {
        return {
            isInitializing: true,
            value: "",
            translationKey: "snippetInput",
            operatorWhitelist: [
                "EQ",
                "IN",
                "STARTSWITH",
                "ENDSWITH"
            ]
        };
    },
    computed: {
        ariaLabelInput () {
            return this.$t("common:modules.filter.ariaLabel.input", {param: this.attrName});
        },
        titleText () {
            if (this.title === true) {
                return this.attrName;
            }
            else if (typeof this.title === "string") {
                return this.translateKeyWithPlausibilityCheck(this.title, key => this.$t(key));
            }
            return "";
        },
        securedOperator () {
            if (!this.operatorWhitelist.includes(this.operator)) {
                return getDefaultOperatorBySnippetType("text");
            }
            return this.operator;
        }
    },
    created () {
        if (this.prechecked) {
            this.value = this.prechecked;
        }
        this.$nextTick(() => {
            this.isInitializing = false;
        });
        if (this.visible && this.prechecked !== "") {
            this.emitCurrentRule(this.prechecked, true);
        }
    },
    mounted () {
        this.$emit("setSnippetPrechecked", this.visible && this.prechecked ? this.snippetId : false);
    },
    methods: {
        translateKeyWithPlausibilityCheck,

        /**
         * Emits the current rule to whoever is listening.
         * @param {*} value the value to put into the rule
         * @param {Boolean} [startup=false] true if the call comes on startup, false if a user actively changed a snippet
         * @returns {void}
         */
        emitCurrentRule (value, startup = false) {
            this.$emit("changeRule", {
                snippetId: this.snippetId,
                startup,
                fixed: !this.visible,
                attrName: this.attrName,
                attrLabel: this.titleText,
                operatorForAttrName: this.operatorForAttrName,
                operator: this.securedOperator,
                value
            });
        },
        /**
         * Emits the delete rule function to whoever is listening.
         * @returns {void}
         */
        deleteCurrentRule () {
            this.$emit("deleteRule", this.snippetId);
        },
        /**
         * Resets the values of this snippet.
         * @param {Function} onsuccess the function to call on success
         * @returns {void}
         */
        resetSnippet (onsuccess) {
            if (this.visible) {
                this.value = "";
            }
            this.$nextTick(() => {
                if (typeof onsuccess === "function") {
                    onsuccess();
                }
            });
        },
        /**
         * Triggers when the input field has lost its focus.
         * @returns {void}
         */
        inputChanged (val) {
            this.value = val;
            if (!this.value) {
                this.deleteCurrentRule();
            }
            else {
                this.emitCurrentRule(this.value, this.isInitializing);
            }
        }
    }
};
</script>

<template>
    <div
        v-show="visible"
        class="form-floating input-container d-flex justify-content-between align-items-center"
    >
        <InputText
            :id="'snippetInput-' + snippetId"
            v-model="value"
            class="snippetInput d-flex"
            :label="titleText"
            :aria-label="ariaLabelInput"
            :placeholder="placeholder"
            :input="inputChanged"
            :disabled="disabled"
        />
        <div
            v-if="info"
        >
            <SnippetInfo
                :info="info"
                :translation-key="translationKey"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .snippetInput {
        box-sizing: border-box;
        position: relative;
        width: 100%;
        border-radius: 5px;
        border: 1px solid #dee2e6;
        box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.08);
        -o-transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
        transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
        &:focus-within {
            border: 1px solid $form-check-input-checked-bg-color;
        }
    }
</style>

<style lang="scss">
    .snippetInput {
        .form-control {
            height: unset;
            min-height: unset;
        }
        .input-label {
            padding: 1rem 0.75rem;
        }
    }
</style>
