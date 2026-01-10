<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import layerTypes from "@core/layers/js/layerTypes.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

/**
 * Layer Pills: show enabled toplayers as Buttons on top of the map. Adds Ability to remove Layers and call Layerinformation without using Layertree or open Menu.
 * @module modules/LayerPills
 */
export default {
    name: "LayerPills",
    components: {IconButton},
    data () {
        return {
            showAllLayers: false,
            showToggleButton: false,
            resizeObserver: null
        };
    },
    computed: {
        ...mapGetters(["isMobile", "visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Modules/LayerPills", [
            "active",
            "configPaths",
            "mobileOnly",
            "type",
            "visibleSubjectDataLayers",
            "hidden"
        ]),
        ...mapGetters("Modules/LayerTree", ["layerTreeSortedLayerConfigs"]),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Menu", ["currentSecondaryMenuWidth", "currentMainMenuWidth"]),
        /**
         * combinedMenuState keeps track of the state of menu, i.e. whether the menus are expanded and their current width.
         * Enables the use of a single watcher on all four variables.
         */
        combinedMenuWidthState () {
            return {
                currentMainMenuWidth: this.currentMainMenuWidth,
                currentSecondaryMenuWidth: this.currentSecondaryMenuWidth
            };
        },
        /**
         * Returns all visible subject data layers in the correct display order
         * for the LayerPills component.
         * The order is primarily defined by the LayerTree configuration
         * (`layerTreeSortedLayerConfigs`). Layers that are visible but not part
         * of the LayerTree (e.g. `showInLayerTree: false`) are appended afterwards
         * to maintain backward compatibility.
         * @returns {Array<Object>} Sorted list of visible layer configuration objects
         */
        sortedVisibleLayerPills () {
            const treeLayers = this.layerTreeSortedLayerConfigs(false),
                visible = this.visibleSubjectDataLayerConfigs;

            return [
                ...treeLayers.filter(l => visible.some(v => v.id === l.id)),
                ...visible.filter(v => !treeLayers.some(l => l.id === v.id))
            ];
        }
    },
    watch: {
        /**
         * Detects changes in visible Layers
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler () {
                this.setVisibleLayers(this.sortedVisibleLayerPills, this.mode);
            },
            deep: true
        },
        /**
        * Detects changes in mapMode
        * @param {String} value 2D or 3D Map mode.
        * @returns {void}
        */
        mode (value) {
            const sortedByTree = this.layerTreeSortedLayerConfigs(false).filter(
                l => this.visibleSubjectDataLayerConfigs.some(n => n.id === l.id)
            );

            this.setVisibleLayers(sortedByTree, value);
        },
        /**
         * Detects changes to the menu state and width to update the layerPills accordingly.
         * Animation of menus opening or closing make the timeout necessary.
         * @returns {void}
         */
        combinedMenuWidthState: {
            handler () {
                if (this.active) {
                    this.setToggleButtonVisibility();
                }
            }
        }
    },
    created () {
        this.initializeModule({configPaths: this.configPaths, type: this.type});
        const layers = this.layerTreeSortedLayerConfigs(false);

        if (layers) {
            const sortedByTree = this.layerTreeSortedLayerConfigs(false).filter(
                l => this.visibleSubjectDataLayerConfigs.some(n => n.id === l.id)
            );

            this.setVisibleLayers(sortedByTree, this.mode);
        }
    },
    mounted () {
        this.setupResizeObserver();
    },
    beforeUnmount () {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        ...mapMutations("Modules/LayerPills", ["setVisibleSubjectDataLayers", "setActive"]),
        ...mapMutations(["setVisibleSubjectDataLayerConfigs"]),
        ...mapActions(["initializeModule", "replaceByIdInLayerConfig"]),
        ...mapActions("Modules/LayerInformation", ["startLayerInformation"]),

        /**
         * Initializes and registers a ResizeObserver for the layer pills container.
         * Ensures that the observer is created only once and only after the container
         * element is available in the DOM. The observer recalculates the visibility
         * of the toggle button whenever the container size changes.
         *
         * @returns {void}
         */
        setupResizeObserver () {
            if (
                !this.resizeObserver &&
                this.$refs.layerPillsContainer &&
                typeof ResizeObserver !== "undefined"
            ) {
                this.resizeObserver = new ResizeObserver(() => {
                    this.setToggleButtonVisibility();
                });
                this.resizeObserver.observe(this.$refs.layerPillsContainer);
            }
        },

        /**
         * Sets the Layers to be shown as Buttons
         * @param {Array} visibleLayers list of visibleLayers.
         * @param {String} mapMode 2D or 3D Map mode.
         * @returns {void}
         */
        setVisibleLayers (visibleLayers, mapMode) {
            if (!visibleLayers) {
                return;
            }

            if (mapMode === "2D") {
                const layerTypes3d = layerTypes.getLayerTypes3d(),
                    visible2DLayers = visibleLayers.filter(layer => !layerTypes3d.includes(layer.typ?.toUpperCase()));

                this.setVisibleSubjectDataLayers(visible2DLayers);
            }
            else {
                this.setVisibleSubjectDataLayers(visibleLayers);
            }
            this.setToggleButtonVisibility();
        },
        toggleLayerVisibility () {
            this.showAllLayers = !this.showAllLayers;
        },
        /**
         * Removes Layer from List of Buttons
         * @param {Object} layer Layer to be removed.
         * @returns {void}
         */
        removeLayerFromVisibleLayers (layer) {
            this.replaceByIdInLayerConfig({
                layerConfigs: [{
                    id: layer.id,
                    layer: {
                        id: layer.id,
                        visibility: false
                    }
                }]
            });
        },
        /**
         * starts the Module layerInformation for given Layer
         * @param {Object} layerConf Configuration-Object of the layer.
         * @returns {void}
         */
        showLayerInformationInMenu (layerConf) {
            if (layerConf.datasets) {
                this.startLayerInformation(layerConf);
            }
        },
        /**
         * Updates the visibility state of the toggle button based on the width available and the amount of layerpills present.
         * @returns {void}
         */
        setToggleButtonVisibility () {
            this.$nextTick(() => {
                this.setupResizeObserver();
                const container = this.$refs.layerPillsContainer,
                    pills = container?.querySelectorAll(".nav-item"),
                    pillWidth = pills?.[0]
                        ? (pills[0].offsetWidth + 10) * this.visibleSubjectDataLayers.length
                        : 0,
                    containerWidth = container?.querySelector(".nav-pills")
                        ? container.querySelector(".nav-pills").getBoundingClientRect().width
                        : 0;

                if (!container || !pills || !pills[0]) {
                    this.showToggleButton = false;
                    return;
                }
                this.showToggleButton = pillWidth > containerWidth;
            });
        }
    }
};

</script>

<template>
    <div
        v-if="visibleSubjectDataLayers.length > 0 && active && !hidden"
        id="layer-pills"
        ref="layerPillsContainer"
        class="layer-pills-container"
        :class="[
            {'mobileOnly': mobileOnly}
        ]"
    >
        <TransitionGroup
            name="list"
            tag="ul"
            class="nav nav-pills"
            :class="{ collapsed: !showAllLayers }"
            @after-enter="setToggleButtonVisibility"
            @after-leave="setToggleButtonVisibility"
        >
            <li
                v-for="(layer) in visibleSubjectDataLayers"
                :key="layer.id"
                class="nav-item shadow"
            >
                <button
                    class="nav-link"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-custom-class="custom-tooltip"
                    :title="$t(layer.name)"
                    :class="layer.datasets ? 'nav-link-hover' : ''"
                    @click="showLayerInformationInMenu(layer)"
                    @keydown="showLayerInformationInMenu(layer)"
                >
                    {{ $t(layer.name) }}
                </button>
                <IconButton
                    :aria="$t('common:modules.layerPills.remove')"
                    :class-array="['btn-light', 'layerpillsbutton', 'close-button']"
                    :icon="'bi-x-lg'"
                    :interaction="() => removeLayerFromVisibleLayers(layer)"
                />
            </li>
        </TransitionGroup>
        <div
            key="more-pill"
            class="nav-item shadow layer-pills-toggle-button"
        >
            <button
                v-if="showToggleButton"
                class="nav-link"
                @click="toggleLayerVisibility"
            >
                <i
                    v-if="showAllLayers"
                    class="bi bi-chevron-up"
                />
                <i
                    v-else
                    class="bi bi-three-dots"
                />
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .layer-pills-container {
        position: relative;
        top: 15px;
        display: flex;
        justify-content: left;
        pointer-events: all;
        margin: 0 auto 0 auto;
        border-radius: 19px;
        overflow-y: auto;
        z-index: 0;
    }

    .nav-pills {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        scroll-snap-type: x mandatory;
    }

    .nav-pills.collapsed {
        max-height: 40px;
        overflow: hidden;
        flex-wrap: wrap;
    }

    .nav-item {
        background-color: $white;
        border-radius: 25px;
        margin: 2px 5px;
        display: flex;
        align-items: center;
        max-height: fit-content;
        scroll-snap-align: start;
    }

    .layer-pills-toggle-button {
        height: 35px;
        margin-right: 30px;
        button {
            background: white;
            border-radius: 19px;
            padding: 0px;
            height: 100%;
            width: 100%;
            padding-inline: 1rem
        }
    }

    .nav-link {
        color: $black;
        margin: 2px 5px;
        padding: 0 0 0 1rem;
        width: 110px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
    }
    .nav-link-hover:hover {
        cursor: pointer;
    }

    .custom-tooltip {
        font-size: 20px;
    }

    .layerpillsbutton {
        width: 2rem;
        height: 2rem;
        font-size: 1.2rem;
        position: relative;
    }

    .mobileOnly {
        display: none;
    }

    @media (max-width: 767px) {
        .nav-pills {
            display: flex;
            flex-wrap: wrap;
            flex: unset;
            overflow-x: auto;
            scrollbar-width: none; /* for firefox */
            width: 320px;
        }

        .nav-pills::-webkit-scrollbar {
            display: none; /* for chrome */
        }

        .mobileOnly {
            display: flex;
        }

    }

    @media (max-width: 400px) {
        .layer-pills-container {
            max-width: 100%;
            overflow-x: hidden;
            padding-inline: 0.25rem;
        }
    }

    .layer-pills-container::-webkit-scrollbar {
    display: none;
    }
</style>
