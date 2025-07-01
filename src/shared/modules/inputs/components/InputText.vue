<script>

/**
 * InputText component: A very variable component realising an input text field.
 * @module shared/modules/inputs/InputText
 * @vue-prop {String} id provides the id of the html-input-tag
 * @vue-prop {String} label is used to provide the label of the input field.
 * @vue-prop {String} placeholder provides the placeholder of the input-field as long as no user input is made.
 * @vue-prop {T} modelValue holds the value of the input-field and is not explicitly typed to allow for diverse inputs.
 * @vue-prop {String} type specifies the type of the inputField, defaulting to "text".
 * @vue-prop {String} maxLength specifies the maximum length of input.
 * @vue-prop {Function} onInput can define a function to be executed every time the input and modelValue get changed.
 * @vue-prop {Function} onChange can define a function to be executed on any change of the inputs modelValue.
 * @vue-prop {Boolean} disabled can be set to disable the input field.
 * @vue-prop {Boolean} readonly can be set to make the input-field read-only.
 * @vue-prop {Object} classObj can be used to define custom classes for the input field.
 * @vue-prop {Number} min can be used to define a lower bound of values for the input field in case of a number-only input.
 * @vue-prop {Number} max can be used to define a upper bound of values for the input field in case of a number-only input.
 * @vue-prop {Number} step can provide a value for limiting the possible values in case of a number-only input with upper and lower bound.
 * @vue-prop {String} errorMessage can be used to provide an error message below the input field in case of bad validation.
 */
export default {
    name: "InputText",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        placeholder: {
            type: String,
            required: true
        },
        modelValue: {
            type: null,
            default: ""
        },
        type: {
            type: String,
            default: "text",
            required: false
        },
        maxLength: {
            type: String,
            default: null,
            required: false
        },
        onInput: {
            type: Function,
            default: null,
            required: false
        },
        onChange: {
            type: Function,
            default: null,
            required: false
        },
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },
        readonly: {
            type: Boolean,
            default: false,
            required: false
        },
        classObj: {
            type: Object,
            default: null,
            required: false
        },
        min: {
            type: Number,
            default: null,
            required: false
        },
        max: {
            type: Number,
            default: null,
            required: false
        },
        step: {
            type: Number,
            default: null,
            required: false
        },
        errorMessage: {
            type: String,
            default: null,
            required: false
        }
    },
    emits: ["update:modelValue", "focus", "blur", "click"],
    methods: {
        /**
         * Sets focus to the input element of the component.
         * Can be called from parent components using $refs.
         * @public
         * @returns {void}
         */
        focus () {
            this.$refs.input?.focus();
        }
    }
};
</script>

<template>
    <div class="form-floating mb-3">
        <input
            :id="id"
            ref="input"
            :type="type"
            class="form-control"
            :class="classObj"
            :placeholder="placeholder"
            :aria-label="placeholder"
            :value="modelValue"
            :readonly="readonly"
            :maxLength="maxLength"
            :disabled="disabled"
            :min="min"
            :max="max"
            :step="step"
            :error-message="errorMessage"
            @input="$emit('update:modelValue', $event.target.value); onInput?.($event.target.value)"
            @change="event => onChange?.(event.target.value)"
            @focus="$emit('focus', $event)"
            @blur="$emit('blur', $event)"
            @click="$emit('click', $event)"
        >
        <label
            class="input-label"
            :for="id"
        >{{ $t(label) }}</label>
        <span
            v-if="errorMessage"
            :id="id + '-input-help'"
            class="invalid-feedback"
        >
            {{ errorMessage }}
        </span>
        <slot />
    </div>
</template>

<style lang="scss" scoped>


.form-control:focus ~ label {
    color: $secondary;
}
.input-label {
    color: $placeholder-color;
}
</style>
