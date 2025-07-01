<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import {Tooltip} from "bootstrap";
import Alerting from "./modules/alerting/components/AlertingItem.vue";
import BaselayerSwitcher from "./modules/baselayerSwitcher/components/BaselayerSwitcher.vue";
import ControlBar from "./modules/controls/components/ControlBar.vue";
import initializeLayers from "./core/layers/js/layerProcessor.js";
import {initializeMaps} from "./core/maps/js/maps.js";
import {startProcessUrlParams} from "./core/urlParams/js/urlParams.js";
import mapCollection from "./core/maps/js/mapCollection.js";
import MenuContainer from "./modules/menu/components/MenuContainer.vue";
import MenuToggleButton from "./modules/menu/components/MenuToggleButton.vue";
import addonsPlugin from "./plugins/addons.js";

export default {
    name: "App",
    components: {
        Alerting,
        BaselayerSwitcher,
        ControlBar,
        MenuContainer,
        MenuToggleButton
    },
    data () {
        return {
            addonsLoaded: false,
            cleanupResize: null
        };
    },
    computed: {
        ...mapGetters([
            "allConfigsLoaded",
            "configJs",
            "deviceMode",
            "mapViewSettings",
            "uiStyle",
            "visibleLayerConfigs"
        ]),
        ...mapGetters("Menu", [
            "mainExpanded",
            "mainMenu",
            "secondaryExpanded",
            "secondaryMenu"
        ]),
        ...mapGetters("Modules", [
            "componentMap"
        ])
    },
    watch: {
        async allConfigsLoaded (value) {
            if (value) {
                await addonsPlugin.loadAddons(this.$.appContext.app, Config.addons);
                this.addonsLoaded = true;
                this.extendLayers();
                this.initializeVectorStyle();
                initializeMaps(this.mapViewSettings, this.configJs);
                initializeLayers(this.visibleLayerConfigs);
                startProcessUrlParams();
                this.initializeOther();

                // Wait until next tick to ensure that the menu components is rendered
                await this.$nextTick();

                // Check if login module is available after configs are loaded
                if (this.$store?.getters?.isModuleAvailable?.("login")) {
                    // Start periodic check to verify if user token is still valid
                    await this.setUpTokenRefreshInterval();
                }

            }
        }
    },
    created () {
        this.setGlobalVariables();
        this.initializeUrlParams();
        this.loadConfigsToTheVuexState();
        this.checkVueObservation();
        this.regulateDeviceMode();
        new Tooltip(document.body, {
            selector: "[data-bs-toggle='tooltip']"
        });
    },
    unmounted () {
        if (this.cleanupResize) {
            this.cleanupResize();
        }

    },
    methods: {
        ...mapMutations([
            "setDeviceMode"
        ]),
        ...mapActions([
            "extendLayers",
            "initializeOther",
            "initializeVectorStyle",
            "loadConfigJs",
            "loadConfigJson",
            "loadRestServicesJson",
            "loadServicesJson",
            "initializeUrlParams"
        ]),
        ...mapActions("Modules/Login", ["checkLoggedIn", "setUpTokenRefreshInterval"]),

        /**
         * Sets global variables.
         * Note: Should be as few as possible.
         * @returns {void}
         */
        setGlobalVariables () {
            window.mapCollection = mapCollection;
            window.moduleCollection = {};
        },

        /**
         * Load configs to the vuex state.
         * @returns {void}
         */
        loadConfigsToTheVuexState () {
            this.loadConfigJs(Config);
            this.loadServicesJson();
            this.loadConfigJson();
            this.loadRestServicesJson();
        },

        /**
        * Logs an error, if map3D is observed by vue. Only in mode 'development'.
        * NOTICE: this only works when 3D is enabled once!
        *
        * If the map3D is observed, and more information is needed:
        * Log of the observables in vue:
        * node_modules\vue\dist\vue.runtime.esm.js
        * function defineReactive$$1
        * line 1012: console.log(obj, key, val);
        * @returns {void}
        */
        checkVueObservation () {

            if (import.meta.env.VITE_NODE_ENV === "development") {
                setInterval(() => {
                    const map3d = mapCollection.getMap("3D");

                    if (map3d?.__ob__) {
                        console.error("map3d is observed by vue:", map3d, " This leads to extreme performance problems, and the cause must be eliminated. This can have several causes: the map3D is in vuex-state or is available via getter. Layers are in the state or in the getters and reference the map3D.");
                    }
                }, 5000);
            }
        },

        /**
         * Regulates the device mode with an window event listener
         * A distinction is made between mobile and desktop.
         * @returns {void}
         */
        regulateDeviceMode () {
            const MOBILE = "Mobile",
                DESKTOP = "Desktop",
                breakpoint = "(max-width: 768px)",
                mediaQuery = window.matchMedia(breakpoint);

           this.setDeviceMode(mediaQuery.matches ? MOBILE : DESKTOP);
           window.addEventListener("resize", () => this.onResize(mobile, desktop));

            this.mediaQueryHandler = (event) => {
                this.setDeviceMode(event.matches ? MOBILE : DESKTOP);
            };

            mediaQuery.addEventListener("change", this.mediaQueryHandler);

            this.cleanupResize = () => {
                mediaQuery.removeEventListener("change", this.mediaQueryHandler);
            };
        }
    }
};
</script>

<template>
    <div
        id="masterportal-container"
        class="masterportal-container"
    >
        <div v-if="allConfigsLoaded && addonsLoaded">
            <Alerting />
        </div>
        <MenuContainer
            v-if="allConfigsLoaded && addonsLoaded && mainMenu && uiStyle !== 'SIMPLE'"
            side="mainMenu"
        />
        <MenuToggleButton
            v-if="allConfigsLoaded && addonsLoaded && mainMenu && uiStyle !== 'SIMPLE'"
            side="mainMenu"
        />
        <template v-if="allConfigsLoaded && addonsLoaded">
            <div
                class="elements-positioned-over-map"
            >
                <component :is="componentMap.mouseHover" />
                <component :is="componentMap.wmsTime" />
                <BaselayerSwitcher v-if="uiStyle !== 'SIMPLE'" />
                <component
                    :is="componentMap.layerPills"
                    v-if="uiStyle !== 'SIMPLE'"
                />
                <component :is="componentMap.portalFooter" />
            </div>
            <div
                class="controls-element"
            >
                <ControlBar
                    class="controls"
                />
            </div>
        </template>
        <MenuToggleButton
            v-if="allConfigsLoaded && addonsLoaded && secondaryMenu && uiStyle !== 'SIMPLE'"
            side="secondaryMenu"
        />
        <MenuContainer
            v-if="allConfigsLoaded && addonsLoaded && secondaryMenu && uiStyle !== 'SIMPLE'"
            side="secondaryMenu"
        />
        <div
            id="map-wrapper"
            class="mp-map"
            tabindex="0"
        >
            <div
                id="map"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.masterportal-container {
    display: flex;
    flex-direction: row;
    position: relative;
    height: 100%;
    width: 100%;
    font-family: $font_family_default;
    font-size: $font-size-base;

    .mp-map {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
        position: absolute;

        #map {
            position: relative;
            height: 100%;
            width: 100%;
        }
    }
}

@include media-breakpoint-up(sm)  {
    .masterportal-container {
        overflow: hidden;
    }
}
.overlay-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
  height: 100%;
}
.elements-positioned-over-map {
    @extend .overlay-block;
    width: 100%;
    z-index: 1;
}
.controls-element{
    @extend .overlay-block;
    z-index: 3;

    .controls {
        flex-grow: 1;
        z-index: 3;
    }
}

</style>

<style lang="scss">
// fix warning: Specifying overflow: visible on img, video and canvas tags may cause them to produce visual content outside of the element bounds.
// See https://github.com/WICG/shared-element-transitions/blob/main/debugging_overflow_on_images.md .
.ol-viewport {
    > div > canvas {
        overflow: clip;
        overflow-clip-margin: content-box;
    }
}

.ol-layer {
    canvas {
        overflow: clip;
        overflow-clip-margin: content-box;
    }
}
</style>
