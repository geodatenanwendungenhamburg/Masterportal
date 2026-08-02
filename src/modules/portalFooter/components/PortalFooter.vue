<script>
import {mapActions, mapGetters} from "vuex";
import ScaleLine from "./ScaleLine.vue";

/**
 * Footer that is displayed below the map. Links can be displayed here.
 * @module modules/PortalFooter
 * @vue-computed {Number} aliasLength - Returns the alias length for relevant device mode.
 */
export default {
    name: "PortalFooter",
    components: {
        ScaleLine
    },
    computed: {
        ...mapGetters(["isMobile", "uiStyle"]),
        ...mapGetters("Modules/PortalFooter", [
            "configPaths",
            "scaleLine",
            "seperator",
            "type",
            "urls"
        ]),
        ...mapGetters("Menu", [
            "mainExpanded",
            "secondaryExpanded",
            "mainMenu",
            "secondaryMenu"
        ]),
        ...mapGetters("Modules/About", [
            "hideImprintInFooter"
        ]),
        /**
         * Returns the alias length for relevant device mode.
         * @returns {Number} The alias length for the relevant device mode.
         */
        aliasLength () {
            if (this.isMobile) {
                return this.urls.filter(url => url.alias_mobile).length;
            }

            return this.urls.filter(url => url.alias).length;
        },
        /**
         * Returns the menu where the about module is configured in.
          * @returns {String|null} The menu where the about module is in.
         */
        aboutModuleSide () {
            if (this.mainMenu.sections.flat().find(m => {
                return m.type === "about";
            })) {
                return "mainMenu";
            }
            else if (this.secondaryMenu.sections.flat().find(m => {
                return m.type === "about";
            })) {
                return "secondaryMenu";
            }
            return null;
        }
    },
    mounted () {
        this.initializeModule({configPaths: this.configPaths, type: this.type});
    },
    methods: {
        ...mapActions(["initializeModule"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapActions("Menu", ["toggleMenu"]),
        /**
         * Opens the about module if it is configured and scrolls to the imprint section.
         * @returns {void}
         */
        openImprint () {
            if (this.aboutModuleSide === "mainMenu" && !this.mainExpanded) {
                this.toggleMenu("mainMenu");
            }
            else if (this.aboutModuleSide === "secondaryMenu" && !this.secondaryExpanded) {
                this.toggleMenu("secondaryMenu");
            }

            this.changeCurrentComponent({type: "about", side: this.aboutModuleSide, props: {name: this.$t("common:modules.about.name")}});

            // timeout is needed to scroll to the correct position of the imprint
            setTimeout(() => {
                document.getElementById("imprint").scrollIntoView({behavior: "smooth", block: "start"});
            }, 500);
        },
        /**
         * Returns true, if isMobile and alias_mobile is filled at url or not mobile.
         * @param {String} url entry of configured urls
         * @returns {boolean} true, if url should be shown
         */
        showUrl (url) {
            return !this.isMobile || (typeof url?.alias_mobile === "string" && url.alias_mobile.length > 0);
        }
    }
};
</script>

<template lang="html">
    <footer
        id="module-portal-footer"
        class="portal-footer px-2 py-1"
        :class="{ 'portal-footer--with-menu': uiStyle !== 'SIMPLE' }"
    >
        <a
            v-if="aboutModuleSide && !hideImprintInFooter"
            class="imprintLink"
            role="button"
            tabindex="0"
            @click="openImprint"
            @keydown="openImprint"
        >
            {{ $t("common:modules.about.imprintTitle") }}
        </a>
        <div class="footer-links">
            <template
                v-for="(url, index) in urls"
                :key="`portal-footer-url-${index}`"
            >
                <span v-if="showUrl(url)">
                    {{ $t(url.bezeichnung) }}
                    <a
                        :href="url.url"
                        target="_blank"
                        class="p-0 footerUrl"
                    >
                        {{ $t(isMobile ? $t(url.alias_mobile) : $t(url.alias)) }}
                    </a>
                    <span
                        v-if="index < aliasLength - 1"
                        class="d-md-inline-block px-2"
                    >
                        <b
                            v-html="seperator"
                        />
                    </span>
                </span>
            </template>
        </div>
        <span
            class="spacer"
        />
        <ScaleLine
            v-if="scaleLine"
        />
    </footer>
</template>

<style lang="scss" scoped>

    .portal-footer {
        background-color: $menu-background-color;
        box-shadow: 0 -6px 12px $shadow;
        font-family: $font_family_narrow;
        font-size: 12px;
        flex-wrap: nowrap;
        margin-top: auto;
        pointer-events: auto;
        position: relative;
        width: 100%;
        display: flex;

        a[target=_blank]{
            color: $secondary;
            padding: .2rem;
            &:hover{
                @include primary_action_hover;
            }
        }

        .spacer {
            flex-grow: 1;
        }

        .imprintLink {
            padding-right: 1rem;
            color: $secondary;
            &:hover{
                @include primary_action_hover;
            }
        }

        .footer-links {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
        }
    }

    @include media-breakpoint-up(sm)  {
        .portal-footer.portal-footer--with-menu {
            left: 54px; // width of the Menucollapse-Button...
            width: calc( 100% + 108px); // 2x Menucollapse-Button...
        }
    }

    @include media-breakpoint-up(md)  {
        .portal-footer.portal-footer--with-menu {
            left: 47.25px; // width of the Menucollapse-Button...
            width: calc( 100% + 94.5px); // 2x Menucollapse-Button...
        }
    }

</style>
