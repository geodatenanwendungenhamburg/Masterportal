<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import LayerPreview from "@shared/modules/layerPreview/components/LayerPreview.vue";

export default {
    name: "BaselayerSwitcher",
    components: {
        LayerPreview
    },
    computed: {
        ...mapGetters([
            "isMobile",
            "visibleBaselayerConfigs",
            "allBaselayerConfigs",
            "layerConfigsByAttributes"
        ]),
        ...mapGetters("Modules/BaselayerSwitcher", [
            "active",
            "activatedExpandable",
            "baselayers",
            "configPaths",
            "singleBaseLayer",
            "topBaselayer",
            "type"
        ])
    },
    watch: {
        visibleBaselayerConfigs: {
            handler (newVal) {
                const baselayerConfigs = Object.values(this.allBaselayerConfigs),
                    zIndex = [];
                let maxZIndex = null,
                    topLayer = null;

                newVal.forEach((val) => {
                    zIndex.push(val.zIndex);
                });

                maxZIndex = Math.max(...zIndex);
                topLayer = newVal.filter(layer =>layer.zIndex === maxZIndex);

                if (topLayer[0]?.id !== undefined) {
                    const baselayers = [];

                    baselayerConfigs.forEach((layer) => {
                        if (layer.id !== topLayer[0].id) {
                            baselayers.push(layer);
                        }
                    });
                    this.setTopBaselayer(topLayer[0]);
                    this.setBaselayers(baselayers);
                }
                else {
                    this.setTopBaselayer(null);
                    this.setBaselayers(baselayerConfigs);
                }
                this.setActivatedExpandable(false);
            },
            deep: true
        }
    },
    created () {
        this.initializeModule({configPaths: this.configPaths, type: this.type});
        const baselayerConfigs = [],
            baselayers = this.layerConfigsByAttributes({
                baselayer: true,
                showInLayerTree: true
            });

        if (baselayers.length > 1) {
            const zIndex = [];
            let max = null,
                layerWithMaxZIndex = null;

            baselayers.forEach((layer) => {
                zIndex.push(layer.zIndex);
            });

            max = Math.max(...zIndex);
            layerWithMaxZIndex = baselayers.filter(layer => layer.zIndex === max);

            if (layerWithMaxZIndex[0]) {
                this.setTopBaselayer(layerWithMaxZIndex[0]);
            }
        }
        else if (baselayers.length === 0) {
            this.setTopBaselayer(null);
        }
        else {
            this.setTopBaselayer(baselayers[0]);
        }

        Object.values(this.allBaselayerConfigs).forEach(layer => {
            if (layer.id !== this.topBaselayer?.id) {
                baselayerConfigs.push(layer);
            }
        });
        this.setBaselayers(baselayerConfigs);

        document.addEventListener("click", event => {
            const baselayerSwitcher = this.$refs["baselayer-switcher"],
                isClickInside = baselayerSwitcher ? baselayerSwitcher.contains(event.target) : false;

            if (!isClickInside) {
                this.setActivatedExpandable(false);
            }
        });
    },
    methods: {
        ...mapMutations("Modules/BaselayerSwitcher", [
            "setActivatedExpandable",
            "setBaselayers",
            "setTopBaselayer"
        ]),
        ...mapActions(["initializeModule"]),
        ...mapActions("Modules/BaselayerSwitcher", ["updateLayerVisibilityAndZIndex"]),


        switchActiveBaselayer (layer) {
            this.updateLayerVisibilityAndZIndex(layer.id);

            const selectableBackroundLayers = this.baselayers,
                index = selectableBackroundLayers.map(backgroundLayer => {
                    return backgroundLayer.id;
                }).indexOf(layer.id);

            selectableBackroundLayers.splice(index, 1);
            if (this.topBaselayer !== null) {
                selectableBackroundLayers.push(this.topBaselayer);
                if (this.singleBaseLayer) {
                    this.layerConfigsByAttributes({
                        id: this.topBaselayer.id
                    }).forEach(toplayer => {
                        toplayer.visibility = false;
                    });
                }
            }
            this.setBaselayers(selectableBackroundLayers);

            this.setTopBaselayer(layer);
            this.setActivatedExpandable(false);
        }
    }
};

</script>

<template>
    <div
        v-if="baselayers.length > 0 && active"
        id="baselayer-switcher"
        ref="baselayer-switcher"
        class="btn-group-vertical my-5 btn-group-background-switcher shadow"
        role="group"
    >
        <ul>
            <li
                v-for="(layer) in baselayers"
                :key="layer.id"
            >
                <button
                    v-if="activatedExpandable === true"
                    id="bs-expanded"
                    class="btn btn-light preview"
                    @click="switchActiveBaselayer(layer)"
                >
                    <LayerPreview
                        :id="'layer-tree-layer-preview-' + layer.id"
                        :layer-id="layer.id"
                        :center="layer.preview?.center"
                        :zoom-level="layer.preview?.zoomLevel"
                        :radius="layer.preview?.radius"
                        :checkable="layer.preview?.checkable"
                        :custom-class="layer.preview?.customClass"
                    />
                </button>
            </li>
            <button
                v-if="topBaselayer === null"
                id="bs-placeholder"
                class="btn btn-light preview top placeholder-button"
                @click="setActivatedExpandable(!activatedExpandable)"
            >
                <i class="bi-map" />
            </button>
            <button
                v-else
                id="bs-topBaselayer"
                class="btn btn-light preview top"
                @click="setActivatedExpandable(!activatedExpandable)"
            >
                <LayerPreview
                    :id="'layer-tree-layer-preview-' + topBaselayer.id"
                    :layer-id="topBaselayer.id"
                    :center="topBaselayer.preview?.center"
                    :zoom-level="topBaselayer.preview?.zoomLevel"
                    :radius="topBaselayer.preview?.radius"
                    :checkable="topBaselayer.preview?.checkable"
                    :custom-class="topBaselayer.preview?.customClass"
                />
            </button>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #baselayer-switcher {
        display: block;
        pointer-events: all;
        max-height: 80vh;
        overflow: scroll;
         /* Hide scrollbar for IE, Edge and Firefox */
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    /* Hide scrollbar for Chrome, Safari and Opera */
    #baselayer-switcher::-webkit-scrollbar {
        display: none;
    }
    .btn-group-background-switcher {
        background-color: $white;
        border: solid $white 1px;
        border-radius: 35px;
        position: absolute;
        bottom: 0;
        align-self: start;

        @media (max-width: 767px) {
            left: 20px;
        }
    }

    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }
    .preview {
        padding: 0px;
        margin: 5px;
        min-width: 52px;
        min-height: 52px;
        border: 2px solid rgba(66, 66, 66, 0.3);
    }

    .preview:hover, .preview:focus{
        border: 2px solid rgba(66, 66, 66, 0.8);
    }

    .placeholder-button {
        color: $black;
        padding-top: 6px;
        font-size: 30px;
    }

    .top {
        border: 2px solid rgba(66, 66, 66, 0.8);
    }

    .top:hover, .top:focus {
        border: 2px solid rgba(66, 66, 66, 0.8);
    }

</style>
