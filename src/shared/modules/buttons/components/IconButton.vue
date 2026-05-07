<script>

/**
 * IconButton component: A component to display an icon button.
 * @module shared/modules/buttons/components/IconButton
 * @vue-prop {Function} interaction provides the function to be called on click of the button (deprecated, use @click instead).
 * @vue-prop {string} aria sets the tooltip of the button to be displayed on hover.
 * @vue-prop {string} icon sets the (bootstrap-)icon to be used by the button.
 * @vue-prop {string[]} iconArray : An iconArray can be provided as well, the first entry of the Array will be used as the icon.
 * @vue-prop {string[]} classArray can be used to set an Array of custom Classes to be applied to the button.
 * @vue-prop {string} id sets the html-id of the button.
 * @vue-prop {boolean} disabled can be used to disable the button.
 * @vue-prop {string} label can be used to add a Label to the iconButton to be displayed beside it.
 * @vue-emit {Event} click emits the native click event when the button is clicked. Can be modified with .stop to prevent event propagation.
 */
export default {
    name: "IconButton",
    props: {
        interaction: {
            type: Function,
            required: false,
            default: () => {
                return true;
            }
        },
        aria: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: null,
            required: false
        },
        iconArray: {
            type: Array,
            default: null,
            required: false
        },
        classArray: {
            type: Array,
            default: null,
            required: false
        },
        id: {
            type: String,
            default: null,
            required: false
        },
        disabled: {
            type: Boolean,
            default: null,
            required: false
        },
        label: {
            type: String,
            default: null,
            required: false
        }
    },
    emits: ["click"],
    methods: {
        /** Handles the click event of the button, emits click event and calls the interaction function if provided.
         * @param {Event} event - The click event.
         */
        handleClick (event) {
            this.$emit("click", event);
            this.interaction(event);
        }
    }
};
</script>

<template>
    <div
        :class="[label ? 'btn-wrapper flex-column d-flex align-items-center': '']"
    >
        <button
            :id="id"
            tabindex="0"
            class="btn d-flex align-items-center justify-items-center mb-auto"
            type="button"
            :title="aria"
            :aria-label="aria"
            :class="classArray"
            :disabled="disabled"
            @click="handleClick"
        >
            <i
                :class="iconArray ? iconArray : icon"
                role="img"
            />
        </button>
        <label
            v-if="label"
            class="text-center btn-label"
            :for="id"
            :aria-label="label"
        >
            {{ label }}
        </label>
    </div>
</template>

<style lang="scss" scoped>


.btn-wrapper {
    width: 16rem;
}

.btn-wrapper > .btn-label {
    font-size: 0.9rem;
}

 .btn {
    position: relative;
    text-align: center;
    top: auto;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.5rem;
    border-radius: 50%;
    border: solid $white 1px;
    z-index: 2;
    /* position icon in center of button */
    > i {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        // adjust line-height to use same height as ::before Element
        line-height: 0;
    }
}
</style>
