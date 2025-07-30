<script>

/**
 * Menu Container Body Root Logo
 * @module modules/MenuContainerBodyRootLogo
 * @vue-prop {String} idAppendix - The appendix set on the id to make it unique.
 * @vue-prop {String} text - The name.
 * @vue-prop {String} link - The URL of an external website to link to.
 * @vue-prop {String} logo - The path to an external image file.
 * @vue-prop {String} toolTip - The text that is shown on hovering the name logo.
 */
export default {
    name: "MenuContainerBodyRootLogo",
    props: {
        /** Appendix set on the id to make it unique. Needed, as the menu can be rendered multiple times. */
        idAppendix: {
            type: String,
            required: true
        },
        /** name text */
        text: {
            type: String,
            required: false,
            default: null
        },
        /** URL of an external website to link to */
        link: {
            type: String,
            default: ""
        },
        /** Path to an external image file */
        logo: {
            type: String,
            default: ""
        },
        /** Shown on hovering the name logo */
        toolTip: {
            type: String,
            default: ""
        }
    }
};
</script>

<template>
    <a
        :id="'mp-menu-logo-' + idAppendix"
        :href="link ? link : '#'"
        :target="link ? '_blank' : '_self'"
        :title="toolTip"
        :class="['mp-menu-logo', { 'logo-only': text === null }]"
    >

        <img
            v-if="logo"
            :src="logo"
            :alt="toolTip || text"
            :class="{'logoOnly': text === null}"
        >
        <h1
            v-if="text !== null"
            v-html="$t(text)"
        />
    </a>
</template>

<style lang="scss" scoped>
@import "~variables";

.mp-menu-logo {
    padding: 0 $padding 0 $padding;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    margin-left: 20px;
    gap: 0.5rem;

    img {
        max-height: 30px;
        flex-shrink: 0;
        margin-right: 0.5rem;

        &.logoOnly {
            max-width: 80%;
            max-height: 80px;
            justify-content: center;
        }
    }

    h1 {
        color: $dark_blue;
        font-size: $font_size_huge;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 1;
        text-align: left;
    }
}

.mp-menu-logo.logo-only {
    justify-content: center;

    img.logoOnly {
        margin-right: 0;
    }
}

@include media-breakpoint-up(sm)  {
    .mp-menu-logo {

        img {
            max-height: 40px;
        }
    }
}

</style>
