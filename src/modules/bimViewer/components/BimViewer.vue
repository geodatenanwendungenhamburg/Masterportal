<script>
import RightSidebar from "./sidebar/RightSidebar.vue";
import ToolArea from "./tools/ToolArea.vue";
import {mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersBimViewer";
import mutations from "../store/mutationsBimViewer";
import LeftSidebar from "./sidebar/LeftSidebar.vue";

export default {
    name: "BimViewer",
    components: {
        LeftSidebar,
        ToolArea,
        RightSidebar
    },
    data () {
        return {
            selectedSceneIndex: 0,
            hideCube: false,
            sidebarLeftOpen: false,
            sidebarRightOpen: false
        };
    },
    computed: {
        ...mapGetters("Modules/BimViewer", Object.keys(getters)),
        useTools () {
            return this.$store.getters["Modules/BimViewer/useTools"];
        },
        allSceneConfigs () {
            return this.$store.getters["Modules/BimViewer/sceneConfigs"];
        },
        toggleRightSidebar () {
            return this.$store.getters["Modules/BimViewer/toggleRightSidebar"];
        },
        currentlyLoadedModels () {
            return this.$store.getters["Modules/BimViewer/currentlyLoadedModels"];
        },
        totalNumberOfModels () {
            return this.$store.getters["Modules/BimViewer/totalNumberOfModels"];
        },
        modelLoadingIndicator () {
            return this.$t("modules.bimViewer.modelLoadingIndicator", {
                currentlyLoadedModels: this.currentlyLoadedModels,
                totalNumberOfModels: this.totalNumberOfModels
            });
        },
        rightSidebarToggleStatus () {
            return this.$store.getters["Modules/BimViewer/toggleRightSidebar"];
        }
    },
    watch: {
        rightSidebarToggleStatus (visible) {
            this.setSidebarRightVisibility(visible);
        }
    },
    async mounted () {
        await this.$store.dispatch("Modules/BimViewer/initializeBimViewer");

        this.applyTranslationKey(this.name);

        const urlParams = new URLSearchParams(window.location.search);

        // Allow to hide the NavCube with URL parameter ?cube=false
        if (urlParams.get("cube") && urlParams.get("cube") === "false") {
            this.hideCube = true;
        }

        await this.$store.dispatch("Modules/BimViewer/loadSceneConfigs");

        this.setScene(this.selectedSceneIndex);
    },
    activated () {
        this.setMasterportalMainMenuOverflowHidden(true);
    },
    deactivated () {
        this.setMasterportalMainMenuOverflowHidden(false);
    },
    methods: {
        ...mapMutations("Modules/BimViewer", Object.keys(mutations)),
        setMasterportalMainMenuOverflowHidden (shouldBeHidden) {
            const domElement = document?.querySelector("#mp-menu-mainMenu");

            if (domElement) {
                domElement.style["overflow-y"] = shouldBeHidden
                    ? "hidden"
                    : "scroll";
            }
        },
        setScene (index) {
            if (typeof this.$refs.viewerCanvas === "undefined") {
                return;
            }

            this.$store.dispatch("Modules/BimViewer/setScene", {
                domElements: {
                    viewerCanvas: this.$refs.viewerCanvas,
                    cubeCanvas: this.$refs.cubeCanvas,
                    treeViewContainerElement: this.$refs.treeViewContainer,
                    bimViewer: this.$refs.bimViewer
                },
                sceneConfig: this.allSceneConfigs[index]
            });

            this.$refs.toolArea.$refs.toolMeasurements.setActive(false);

            this.setCanvasStyleToPreventOverflow();
        },
        setCanvasStyleToPreventOverflow () {
            const
                canvases = document.querySelectorAll("canvas"),
                overlayingCubeCanvas = canvases[canvases.length - 1];

            if (overlayingCubeCanvas.className === "") {
                overlayingCubeCanvas.style.setProperty("max-width", "100vw", "important");
                overlayingCubeCanvas.style.setProperty("max-height", "100vh", "important");
            }
        },
        setSidebarLeftVisibility (visible) {
            this.sidebarLeftOpen = visible;
        },
        setSidebarRightVisibility (visible) {
            this.sidebarRightOpen = visible;
        }
    }
};
</script>

<template lang="html">
    <div id="bim-viewer">
        <ToolArea
            v-if="useTools"
            ref="toolArea"
            :sidebar-visibility-right="sidebarRightOpen"
            @sceneSelected="setScene"
            @toggleSidebarLeft="setSidebarLeftVisibility"
            @toggleSidebarRight="setSidebarRightVisibility"
        />

        <div
            ref="bimViewer"
            class="bim-viewer-content"
            :class="{'sidebar-open': toggleRightSidebar}"
        >
            <LeftSidebar
                v-show="sidebarLeftOpen"
                v-slot="{data}"
            >
                <div
                    :id="`treeview-${data.treeviewHierarchyType ?? ''}-pane`"
                    ref="treeViewContainer"
                    class="treeViewContainer"
                />
            </LeftSidebar>

            <div class="mainContent">
                <div class="viewerArea">
                    <canvas
                        ref="viewerCanvas"
                        class="viewer"
                        aria-hidden="true"
                        tabindex="0"
                    />

                    <div
                        :class="{
                            'navCubeContainer': true,
                            'hideCube': hideCube
                        }"
                    >
                        <canvas
                            ref="cubeCanvas"
                            class="navCube"
                        />

                        <strong
                            v-if="currentlyLoadedModels < totalNumberOfModels"
                            class="modelLoadingIndicator"
                        >
                            {{ modelLoadingIndicator }}
                        </strong>
                    </div>
                </div>
            </div>

            <RightSidebar v-if="sidebarRightOpen" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
#bim-viewer {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;

    div.ToolArea {
        flex-shrink: 0;
    }

    div.bim-viewer-content {
        display: flex;
        flex-direction: row;
        flex: 1;
        overflow: hidden;
        margin-top: 1rem;
        border-top: solid 1px #DDD;
        border-bottom: solid 1px #DDD;

        .mainContent {
            display: flex;
            flex-direction: column;
            flex: 1;

            div.viewerArea {
                flex: 1;
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 95%;
                justify-content: center;
                overflow: hidden;

                :focus-visible {
                    outline: none;
                }

                canvas.viewer {
                    width: 100%;
                    height: 100%;
                }

                div.navCubeContainer {
                    display: flex;
                    align-items: center;
                    margin-top: -9rem;

                    canvas.navCube {
                        width: 9rem;
                        height: 9rem;
                        z-index: 2;
                    }

                    strong.modelLoadingIndicator {
                        background-color: #FFF;
                        display: block;
                        padding: 0.5rem;
                        border-radius: 0.25rem;
                    }

                    &.hideCube {
                        display: none;
                    }
                }
            }
        }

        #viewerSpinner {
            z-index: 9000;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            margin: auto;
        }

        :deep(div.xeokit-annotation-markers) {
            background-color: red;
            position: absolute;
            width: 1rem;
            height: 1rem;
            border-radius: 1rem;
            border: 0.13rem solid #ffffff;
            z-index: 0 !important;
            box-shadow: 1px 1px 15px 1px rgb(168, 167, 167);
        }

        :deep(div.xeokit-annotation-label) {
            position: absolute;
            max-width: 18.75rem;
            min-height: 3.13rem;
            padding: 0.5rem 0.75rem;
            background: #ffffff;
            color: #000000;
            border-radius: 0.5rem;
            border: #ffffff solid 0.13rem;
            box-shadow: 0.31rem 0.31rem 0.94rem 0.06rem #000000;
            z-index: 1000000;
            visibility: hidden;
            transform: translate(-1.38rem, -0.5rem);
            max-height: 250px;
            overflow-y: auto;

            div.xeokit-annotation-title,
            a.xeokit-annotation-title{
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 0.25rem;
            }

            a.xeokit-annotation-title {
                display: flex;
                align-items: baseline;
                color: #003063;
                gap: 0.5rem;

                div.xeokit-annotation-point {
                    border-radius: 1rem;
                    width: 0.87rem;
                    height: 0.87rem;
                }
            }

            div.xeokit-annotation-desc {
                font-size: 14px;
            }

            a.xeokit-annotation-more-link {
                display: inline-block;
                margin-top: 0.75rem;
                font-size: 12px;
            }
        }
    }
}
</style>
