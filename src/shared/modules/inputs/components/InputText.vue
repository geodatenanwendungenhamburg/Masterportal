<script>
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
            id="input-help"
            class="invalid-feedback"
        >
            {{ errorMessage }}
        </span>
        <slot />
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.form-control:focus ~ label {
    color: $secondary;
}
.input-label {
    color: $placeholder-color;
}
</style>
