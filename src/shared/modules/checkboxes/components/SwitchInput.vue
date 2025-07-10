<script>

/**
 * SwitchInput component: A small toggle/switch input interface used for toggles and on/off-switches.
 * @module shared/modules/checkboxes/SwitchInput
 * @vue-prop {String} id - is used to set the id of the input-tag.
 * @vue-prop {String} label - sets the label of the toggle.
 * @vue-prop {String} aria - sets a description of the toggle for assistive technology like screenreaders.
 * @vue-prop {Boolean} disabled - if true, the input is disabled.
 * @vue-prop {Boolean} checked - the current state of the toggle.
 * @vue-prop {Function} interaction - can bind a function to be executed on using the toggle.
 */
export default {
    name: "SwitchInput",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        aria: {
            type: String,
            required: true
        },
        disabled: {
            type: Boolean,
            default: null,
            required: false
        },
        checked: {
            type: Boolean,
            default: null,
            required: false
        },
        interaction: {
            type: Function,
            required: false,
            default: () => {
                return true;
            }
        }
    }
};
</script>

<template>
    <div class="form-check form-switch">
        <input
            :id="id"
            type="checkbox"
            role="switch"
            aria-checked="mixed"
            :aria-label="aria"
            class="form-check-input"
            :disabled="disabled"
            :checked="checked"
            @change="interaction"
        >
        <label
            class="form-check-label ps-2 pt-1 me-2"
            :for="id"
        >
            {{ $t(label) }}
        </label>
    </div>
</template>

<style lang="scss" scoped>


.form-check-input {
        width: 2.5rem;
        height: 1.5rem;
}
</style>
