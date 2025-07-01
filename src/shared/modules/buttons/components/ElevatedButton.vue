<script>

/**
 * Elevated Button component: A simple button that looks elevated from its background.
 * @module shared/modules/buttons/ElevatedButton
 * @vue-prop {String} text holds the Button-text.
 * @vue-prop {function} interaction binds a function to a click on the button.
 * @vue-prop {String} icon defines the Icon to be displayed alongside the text inside the button.
 */
export default {
    name: "ElevatedButton",
    props: {
        text: {
            type: String,
            required: true
        },
        interaction: {
            type: Function,
            required: true
        },
        icon: {
            type: String,
            default: null,
            required: false
        }
    }
};
</script>

<template>
    <button
        class="btn btn-primary d-flex align-items-center shadow"
        type="button"
        :aria-label="text"
        @click="interaction"
    >
        <i
            v-if="icon !== null"
            :class="icon"
            role="img"
        />
        {{ $t(text) }}
    </button>
</template>

<style lang="scss" scoped>
.btn {
    display: flex;
    justify-content: center;
    white-space: nowrap;
    height: 3.5rem;
    min-width: 5rem;
    width: fit-content;
    padding-right: 1.5rem;
    padding-left: 1rem;

    i {
        font-size: 1.5rem;
        padding-right: .5rem;
    }
}
</style>
