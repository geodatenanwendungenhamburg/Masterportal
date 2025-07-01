<script>
import SpinnerItem from "../../spinner/components/SpinnerItem.vue";


/**
 * FlatButton component: A simple Button component.
 * @module shared/modules/buttons/FlatButton
 * @vue-prop {String} customclass can be used to give custom html-classes to the Button.
 * @vue-prop {Boolean} disabled can be used to disable the buttons functionality.
 * @vue-prop {String} icon can be used to attach a (bootstrap-)icon to the button that shows left of the buttons title.
 * @vue-prop {Function} interaction provides the function to be called on click of the button.
 * @vue-prop {Boolean} secondary - if true, the button will be styled in masterportals secondary colors.
 * @vue-prop {Boolean} spinnerTrigger - if set to true, a loading spinner is shown during execution of the attached function.
 * @vue-prop {String} text is used to set the label of the button.
 * @vue-prop {String} type sets the type of button.
 * @vue-prop {String} title defines the text shown in the tooltip of the button on hover.
 */
export default {
    name: "FlatButton",
    components: {SpinnerItem},
    props: {
        customclass: {
            type: String,
            default: null,
            required: false
        },
        disabled: {
            type: Boolean,
            default: null,
            required: false
        },
        icon: {
            type: String,
            default: null,
            required: false
        },
        interaction: {
            type: Function,
            required: false,
            default: () => {
                return true;
            }
        },
        secondary: {
            type: Boolean,
            default: false,
            required: false
        },
        spinnerTrigger: {
            type: Boolean,
            default: false,
            required: false
        },
        text: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: false,
            default: "button"
        },
        title: {
            type: String,
            required: false,
            default: ""
        }
    }
};
</script>

<template>
    <button
        class="flat-button btn btn-secondary d-flex align-items-center custom-mb-3"
        :class="[
            customclass,
            secondary ? 'btn-scnd' : ''
        ]"
        :type="type"
        :aria-label="text"
        :disabled="disabled"
        :title="title"
        @click="interaction"
    >
        <i
            v-if="icon !== null && !spinnerTrigger "
            :class="icon"
            role="img"
        />
        <SpinnerItem
            v-if="spinnerTrigger"
            :custom-class="'p-2'"
        />
        <span class="btn-texts">
            {{ $t(text) }}
        </span>
    </button>
</template>

<style lang="scss" scoped>


.btn {
    display: flex;
    justify-content: center;
    white-space: nowrap;
    min-height: 2.5rem;
    max-width: fit-content;
    padding-right: 1.5rem;
    padding-left: 1rem;

    i {
        font-size: 1.125rem;
        padding-right: .5rem;
        position: relative;
        top: 2px;
    }
    .btn-texts {
        white-space: normal;
        margin-left: .5rem;
    }

    &.custom-mb-3 {
        margin-bottom: 1rem;
    }
}

.btn-scnd {
    background-color: $light-blue;
    border-color: $light-blue;
    color: $black;
}
</style>
