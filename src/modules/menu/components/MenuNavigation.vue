<script>
import {mapGetters} from "vuex";
import {mapActions as mapPiniaActions, mapState} from "pinia";
import {useMenuStore} from "../menu-store/menuStore.js";

/**
 * Menu Navigation
 * @module modules/MenuNavigation
 * @vue-prop {String} side - Defines in which menu the component is being rendered.
 * @vue-computed {String} previousNavigation - The previous navigation entry.
 * @vue-computed {String} currentTitle - The current components name.
 */
export default {
    name: "MenuNavigation",
    props: {
        /** Defines in which menu the component is being rendered */
        side: {
            type: String,
            required: true,
            validator: value => value === "mainMenu" || value === "secondaryMenu"
        }
    },
    computed: {
        ...mapState(useMenuStore, ["previousNavigationEntryText", "currentComponent", "showHeaderIcon", "secondaryMenuEnabled"]),
        ...mapGetters(["isMobile"]),

        currentMenuComponent () {
            return this.currentComponent(this.side) || {};
        },

        previousNavigation () {
            return this.previousNavigationEntryText(this.side);
        },

        currentTitle () {
            const component = this.currentMenuComponent,
                  key = component?.props?.name || `common:modules.${component?.type}.name`;

            return this.$t(key);
        },

        currentIcon () {
            return this.currentMenuComponent?.props?.icon;
        },

        showIcon () {
            return this.showHeaderIcon(this.side);
        },

        isSecondaryGfiWithoutMenu () {
            return this.side === "secondaryMenu"
                && !this.secondaryMenuEnabled
                && this.currentMenuComponent.type === "getFeatureInfo";
        },

        /**
         * Hides invalid back navigation in GFI if no secondary menu exists.
         * @returns {Boolean} Whether the back navigation should be displayed.
         */
        showPreviousNavigation () {
            if (!this.previousNavigation) {
                return false;
            }

            const pointsToMenuRoot = this.previousNavigation === this.$t("common:modules.menu.name"),
                  hideSecondaryGfiBack = this.isSecondaryGfiWithoutMenu && pointsToMenuRoot;

            return !hideSecondaryGfiBack;
        },

        /**
         * Determines if the close button should be displayed.
         * Always show for secondary menu GFI even without back navigation.
         * @returns {Boolean} Whether the close button should be displayed.
         */
        showCloseButton () {
            return !this.isMobile && (this.showPreviousNavigation || this.isSecondaryGfiWithoutMenu);
        }
    },
    methods: {
        ...mapPiniaActions(useMenuStore, ["navigateBack", "resetMenu"])
    }
};
</script>

<template>
    <div
        v-if="showPreviousNavigation || showCloseButton"
        :id="'mp-menu-navigation-' + side"
    >
        <div
            class="mp-menu-navigation"
        >
            <a
                v-if="showPreviousNavigation"
                :id="'mp-navigation-' + side"
                class="pt-2 mp-menu-navigation-link"
                href="#"
                @click.prevent="navigateBack({side})"
                @keypress="navigateBack({side})"
            >
                <h6 class="mp-menu-navigation-link-text mb-1"><p class="bi-chevron-left me-2" />{{ previousNavigation }}</h6>
            </a>
            <button
                v-if="showCloseButton"
                :id="'mp-menu-navigation-reset-button-' + side"
                type="button"
                class="btn-close mp-menu-navigation-reset-button ms-auto"
                :aria-label="$t('common:modules.menu.ariaLabelClose')"
                @click="resetMenu(side)"
            />
        </div>
        <h4
            v-if="currentTitle !== 'none'"
            class="mp-menu-navigation-moduletitle mb-4"
        >
            <i
                v-if="showIcon && (currentIcon !== null)"
                :class="[
                    currentIcon, 'col-2'
                ]"
                role="img"
            />
            {{ currentTitle }}
        </h4>
    </div>
</template>

<style lang="scss" scoped>


.mp-menu-navigation{
    display: flex;
    justify-content: space-between;

    &-link {
        display: flex;
        color: $black;

        &-text{
        display: flex;
    }
    }
}

.mp-menu-navigation-moduletitle{
    display: flex;

    i {
        max-width: 35px;
        font-size: 1.3rem;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 2px;
        padding-bottom: 2px;
        vertical-align: middle;
    }
}

</style>
