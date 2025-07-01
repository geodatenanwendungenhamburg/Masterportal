<script>

/**
 * AccordionItem: An accordion component with a foldable slot to show or hide information dynamically through user-interaction.
 * @module shared/modules/accordion/AccordionItem
 * @vue-prop {String} id - sets the id to be used for the accordion container, the resulting id will be accordion-container-id.
 * @vue-prop {String} title - sets the title to be shown even when the accordion is closed.
 * @vue-prop {Boolean|String} icon - sets an optional (bootstrap-)icon to be displayed next to the title.
 * @vue-prop {Boolean} isOpen - manages the state of the accordion.
 * @vue-prop {String} fontSize - defaults to font-size-big (1.167rem) and can be changed to use a different size.
 * @vue-prop {Boolean} colouredHeader - if true, the title of the accordion will have a light blue background.
 */
export default {
    name: "AccordionItem",
    props: {
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        icon: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        isOpen: {
            type: Boolean,
            required: false,
            default: false
        },
        fontSize: {
            type: String,
            required: false,
            default: "font-size-big"
        },
        colouredHeader: {
            type: Boolean,
            required: false,
            default: null
        }
    },
    emits: ["updateAccordionState"],
    methods: {
        updateState (event) {
            this.$emit("updateAccordionState", event.target.classList.contains("collapsed"));
        }
    }
};
</script>

<template>
    <div
        :id="`accordion-container-${id}`"
        class="accordion accordion-bg accordion-flush"
        :class="[!colouredHeader? 'border-0' : 'pt-2']"
    >
        <div
            class="accordion-item border-0"
        >
            <div
                v-if="title"
                :id="`flush-heading-${id}`"
                class="accordion-header ms-0"
            >
                <button
                    :class="['accordion-button', fontSize, !isOpen? 'collapsed' : '', !colouredHeader? 'ps-0' : 'rounded']"
                    type="button"
                    :coloured="colouredHeader"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#flush-collapse-${id}`"
                    aria-expanded="true"
                    :aria-controls="`#flush-collapse-${id}`"
                    @click="updateState"
                    @keydown.enter="updateState"
                >
                    <i
                        v-if="icon"
                        :class="`${icon} mt-1 me-3`"
                    />
                    {{ title }}
                </button>
            </div>
            <div
                :id="`flush-collapse-${id}`"
                :class="`accordion-collapse collapse ${isOpen ? 'show' : ''}`"
                :aria-labelledby="`flush-heading-${id}`"
                :data-bs-parent="`#accordion-container-${id}`"
            >
                <div
                    class="accordion-body"
                    :class="['accordion-body', !colouredHeader? 'pt-0' : 'pb-2']"
                >
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .accordion {
        --bs-accordion-border-width: 0;
        --bs-accordion-active-bg: $white;
        --bs-accordion-btn-focus-box-shadow: none;
        .font-size-big {
            font-size: $font_size_big;
        }
        .font-size-base {
            font-size: $font-size-base;
        }

        [coloured=true] {
                background-color: $light_blue;
        }
    }
</style>
