<script>
export default {
    name: "RadioButtonGroup",
    props: {
        options: {
            type: Array, // [{value: "current", label: "Current Location", icon: "bi-geo-alt"}, ...]
            required: true
        },
        name: {
            type: String,
            required: true
        },
        modelValue: {
            type: String,
            required: true
        }
    },
    emits: ["update:modelValue"]
};
</script>

<template>
    <fieldset class="radio-group">
        <label
            v-for="option in options"
            :key="option.value"
            class="radio-option"
        >
            <input
                type="radio"
                :name="name"
                :value="option.value"
                :checked="modelValue === option.value"
                @change="$emit('update:modelValue', option.value)"
            >
            <span class="radio-label">
                <i
                    v-if="option.icon"
                    :class="`${option.icon} pe-2`"
                />
                {{ option.label }}
            </span>
        </label>
    </fieldset>
</template>

<style lang="scss" scoped>
.radio-group {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;

}

.radio-option {
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: 0.5rem;

    input[type="radio"] {
        cursor: pointer;
        accent-color: $secondary;
    }

    &:hover .radio-label {
        color: $secondary;
    }
}

.radio-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
}
</style>
