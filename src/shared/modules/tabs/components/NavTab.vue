<script>

/**
 * NavTab component: A small implementation of navigation tabs, as used for layer information.
 * @module shared/modules/tabs/NavTab
 * @vue-prop {String} id - the id of the navTab-button.
 * @vue-prop {String} label - the label used on the navTab-button.
 * @vue-prop {String} icon - optional bootstrap icon class suffix (e.g. 'bi-geo-alt') shown before the label.
 * @vue-prop {Boolean} active - whether the tab is currently active.
 * @vue-prop {String} target - used to specify the id of the element shown by the navTab button (i.e. '#section-1').
 * @vue-prop {Function} interaction - can be used to bind a function to an interaction with the navTab-button, to be executed on click.
 */
export default {
    name: "NavTab",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: false,
            default: ""
        },
        active: {
            type: Boolean,
            required: true
        },
        target: {
            type: String,
            required: true
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
    <li
        class="nav-item"
        role="presentation"
    >
        <button
            :id="id"
            class="nav-link"
            :class="active ? 'active' : ''"
            data-bs-toggle="tab"
            :data-bs-target="target"
            type="button"
            role="tab"
            :aria-controls="target"
            aria-selected="true"
            :aria-label="label"
            @click="interaction"
        >
            <i
                v-if="icon"
                class="bi me-2"
                :class="icon"
                aria-hidden="true"
            />
            {{ $t(label) }}
        </button>
    </li>
</template>

<style lang="scss" scoped>

    .nav-tabs {
        border: none;
        .nav-link.active {
            border-top: none;
            border-left: none;
            border-right: none;
            border-bottom: 3px solid $dark_blue;
            font-family: $font_family_accent;
        }
        .nav-link {
            color: $black;
            border: none;
        }
        .nav-link:hover {
            border-radius: 0;
            background-color: $light_blue;
        }
    }
</style>
