<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import layerTypes from "@core/layers/js/layerTypes";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

/**
 * Layer Pills: show enabled toplayers as Buttons on top of the map. Adds Ability to remove Layers and call Layerinformation without using Layertree or open Menu.
 * @module modules/LayerPills
 * @vue-data {Object} scrolled - the horizontal Scrollposition of the Element.
 * @vue-data {Object} showRightButton - indicates if Button on the right to scroll horizontally is to be shown.
 */
export default {
    name: "LayerPills",
    components: {IconButton},
    data () {
        return {
            scrolled: 0,
            showRightbutton: false,
            showAllLayers: false,
            showMorePill: true,
            showToggleButton: false
        };
    },
    computed: {
        ...mapGetters(["isMobile", "visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Modules/LayerPills", [
            "active",
            "configPaths",
            "mobileOnly",
            "type",
            "visibleSubjectDataLayers"
        ]),
        ...mapGetters("Maps", ["mode"])
    },
    watch: {
        /**
         * Detects changes in visible Layers
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler (newVal, oldVal) {
                let newValue = {},
                    oldValue = {};

                if (oldVal.length !== newVal.length) {
                    newValue = newVal.filter(x => !oldVal.includes(x));
                    if (newValue.length === 0) {
                        oldValue = oldVal.filter(x => !newVal.includes(x));
                    }
                }

                if (Object.keys(newValue).length > 0) {
                    this.setVisibleLayers(newVal, this.mode, newValue);
                }
                if (Object.keys(oldValue).length > 0) {
                    this.setVisibleLayers(newVal, this.mode, newValue);
                }
            },
            deep: true
        },
        /**
        * Detects changes in mapMode
        * @param {String} value 2D or 3D Map mode.
        * @returns {void}
        */
        mode (value) {
            this.setVisibleLayers(this.visibleSubjectDataLayerConfigs, value);
        }
    },
    created () {
        this.initializeModule({configPaths: this.configPaths, type: this.type});
        this.setVisibleLayers(this.visibleSubjectDataLayerConfigs, this.mode);
    },
    mounted () {
        this.setResizeObserver();
    },
    methods: {
        ...mapMutations("Modules/LayerPills", ["setVisibleSubjectDataLayers", "setActive"]),
        ...mapMutations(["setVisibleSubjectDataLayerConfigs"]),
        ...mapActions(["initializeModule", "replaceByIdInLayerConfig"]),
        ...mapActions("Modules/LayerInformation", ["startLayerInformation"]),

        /**
         * Sets the Layers to be shown as Buttons
         * @param {Array} visibleLayers list of visibleLayers.
         * @param {String} mapMode 2D or 3D Map mode.
         * @param {Object} newValues added Layers.
         * @returns {void}
         */
        setVisibleLayers (visibleLayers, mapMode, newValues = []) {
            if (visibleLayers) {
                if (mapMode === "2D") {
                    const layerTypes3d = layerTypes.getLayerTypes3d(),
                        visible2DLayers = visibleLayers.filter(layer => {
                            return !layerTypes3d.includes(layer.typ?.toUpperCase());
                        });

                    if (Object.keys(newValues).length !== 0) {
                        const layers = this.visibleSubjectDataLayers;

                        newValues.forEach((val) => {
                            layers.unshift(val);
                        });

                        this.setVisibleSubjectDataLayers(layers);
                    }
                    else {
                        this.setVisibleSubjectDataLayers(visible2DLayers);
                    }
                }
                else {
                    this.setVisibleSubjectDataLayers(visibleLayers);
                }
            }
            this.setToggleButtonVisibility();
        },
        toggleLayerVisibility () {
            this.showAllLayers = !this.showAllLayers;
        },
        /**
         * Removes Layer from List of Buttons
         * @param {String} layer Layer to be removed.
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
         * Scrolls Element horizontally the width of one Button to the given direction
         * @param {String} direction Direction to be scrolled to.
         * @returns {void}
         */
        moveLayerPills (direction) {
            const value = direction === "right" ? 158 : -158;

            this.scrolled = this.$el.scrollLeft;
            if (!(this.scrolled === 0 && direction === "left") || !(this.scrollEnd && direction === "right")) {
                this.$el.scrollBy({
                    left: value,
                    behavior: "smooth"
                });

                this.scrolled = this.scrolled + value < 0 ? 0 : this.scrolled + value;

                // await transition...
                setTimeout(() => {
                    this.setRightButton();
                }, 310);
            }

        },
        /**
         * sets the showRightbutton-value depending on available width and width of element.
         * @returns {void}
         */
        setRightButton () {
            const containerWidth = this.$el.offsetWidth,
                scrollWidth = this.$el.scrollWidth;

            if (containerWidth && scrollWidth) {
                if (containerWidth >= scrollWidth) {
                    this.showRightbutton = false;
                }
                else {
                    this.showRightbutton = true;
                }
                this.showRightbutton = !(scrollWidth - this.$el.scrollLeft === containerWidth);

            }
        },
        /**
         * sets an Observer to the width of the element to react on resizing.
         * @returns {void}
         */
        setResizeObserver () {
            const resizeObserver = new ResizeObserver(this.setRightButton);

            if (this.active && this.visibleSubjectDataLayers.length > 0) {
                resizeObserver.observe(this.$el);
            }
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
         * Updates the visibility state of the toggle button based on the multiline status of the pills list.
         * Checks if the pills list spans multiple lines and sets the toggle button accordingly.
         * @returns {void}
         */
        setToggleButtonVisibility () {
            this.$nextTick(() => {
                const container = this.$refs.layerPillsContainer,
                    pills = container?.querySelectorAll(".nav-item");

                if (container && pills) {
                    const firstPillTop = pills[0]?.offsetTop || 0;
                    let spansMultipleRows = false;

                    Array.from(pills).forEach((pill) => {
                        if (pill.offsetTop !== firstPillTop) {
                            spansMultipleRows = true;
                        }
                    });

                    this.showToggleButton = spansMultipleRows;
                }
            });
        }
    }
};

</script>

<template>
    <div
        v-if="visibleSubjectDataLayers.length > 0 && active"
        id="layer-pills"
        ref="layerPillsContainer"
        class="layer-pills-container"
        :class="[
            {'mobileOnly': mobileOnly}
        ]"
    >
        <IconButton
            v-if="!isMobile"
            :id="'layerpills-left-button'"
            :aria="$t('modules.layerPill.previous')"
            :class-array="['btn-primary', 'layerpills-left-button', 'shadow']"
            :icon="'bi-chevron-left'"
            :style="scrolled !== 0 ? '' : 'visibility:hidden'"
            :interaction="() => moveLayerPills('left')"
        />
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
        <IconButton
            v-if="!isMobile"
            :id="'layerpills-right-button'"
            :aria="$t('modules.layerPill.next')"
            :class-array="['btn-primary', 'layerpills-right-button', 'shadow']"
            :icon="'bi-chevron-right'"
            :style="showRightbutton ? '' : 'visibility:hidden'"
            :interaction="() => moveLayerPills('right')"
        />
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";
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

    .list-enter-active, .list-leave-active {
      transition: width 0.3s ease;
    }
    .list-enter-to, .list-leave-from {
        width: 148px;
        transition: width 0.3s ease;
    }
    .list-enter-from, .list-leave-to{
        width: 0;
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

    .layerpills-right-button {
        flex-shrink: 0;
        z-index: 3;
        right: 0px;
    }

    .layerpills-left-button {
        flex-shrink: 0;
        z-index: 3;
        left: 0px;
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
