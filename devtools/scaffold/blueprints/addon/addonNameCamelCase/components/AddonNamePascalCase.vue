<script>
import {mapGetters, mapMutations} from "vuex";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "AddonNamePascalCase",
    components: {
        SpinnerItem
    },
    computed: {
        ...mapGetters("Modules/AddonNamePascalCase", [
            "showLoadingSpinner"
        ]),
        loadingSpinnerText () {
            return this.$t("additional:modules.addonNameCamelCase.loadingSpinnerText.general");
        }
    },
    /**
     * KeepAlive: This addon uses the Masterportal module caching feature,
     * see docs/Dev/vueComponents/ModuleCaching.md
     * The mounted hook is only called once, when the component is created the first time.
     * The activated and deactivated hooks are called, when the component is
     * shown or closed via "menu" link.
     */
    async mounted () {
        // this.setShowLoadingSpinner(true);
    },
    activated () {
        // Handle KeepAlive visibility. Triggered if component is activated
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
    },
    methods: {
        ...mapMutations("Modules/AddonNamePascalCase", [
            "setShowLoadingSpinner"
        ])
    }
};
</script>

<template lang="html">
    <div id="addonNameCamelCase">
        <div
            v-if="showLoadingSpinner"
            class="loadingSpinner"
        >
            <SpinnerItem
                custom-class="spinner"
                class="ms-3"
            />

            <p v-if="loadingSpinnerText">
                {{ loadingSpinnerText }}
            </p>
        </div>

        <template v-else>
            <p>
                AddonNamePascalCase Addon.
            </p>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #addonNameCamelCase{
        div.loadingSpinner {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.7);
            z-index: 2;

            div.spinner {
                width: 4rem;
                height: 4rem;
            }

            p {
                background-color: white;
                white-space: pre-line;
                padding: 1.5rem;
            }
        }
    }
</style>
