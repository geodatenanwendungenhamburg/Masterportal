<script>
import NavTab from "../../../../shared/modules/tabs/components/NavTab.vue";
import {mapGetters, mapActions} from "vuex";
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";
import FlatButton from "../../../../shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "LeftSidebar",
    components: {
        FlatButton,
        IconButton,
        NavTab
    },
    data () {
        return {
            activeTab: "models"
        };
    },
    computed: {
        ...mapGetters("Modules/BimViewer", [
            "loadedModels"
        ])
    },
    methods: {
        ...mapActions("Modules/BimViewer", [
            "updateXeokitPluginTreeViewHierarchyType",
            "refreshLoadedModelExtraSettings",
            "destroyModel",
            "setLoadedModelXRayed",
            "setLoadedModelVisible",
            "flyToCompleteModel"
        ]),
        setActiveTab (tab) {
            if (tab !== "models") {
                this.updateXeokitPluginTreeViewHierarchyType(tab);
            }
            else {
                // Required to refresh the "object structure" sidebar icons (visible/xRayed)
                this.refreshLoadedModelExtraSettings();
            }

            this.activeTab = tab;
        },
        deleteAllModels () {
            this.loadedModels.forEach(item => this.destroyModel(item.sceneModel.id));
        },
        setXRayed (modelId, isXRayedParameter) {
            let isXRayed = isXRayedParameter;

            // If it's partially set, a click resets the state to not xRayed.
            isXRayed = ![1, -1].includes(isXRayed);

            this.setLoadedModelXRayed({
                modelId,
                isXRayed: Boolean(isXRayed)}
            );
        },
        setVisible (modelId, isVisibleParameter) {
            let isVisible = isVisibleParameter;

            // If it's partially set, a click resets the state to not invisible.
            isVisible = [0, -1].includes(isVisible);

            this.setLoadedModelVisible({
                modelId,
                isVisible: Boolean(isVisible)
            });
        },
        buttonVisibilityTitle (state) {
            return state === -1
                ? this.$t("modules.bimViewer.modelExplorer.models.buttonToggleVisibilityPartially")
                : this.$t("modules.bimViewer.modelExplorer.models.buttonToggleVisibility");
        },
        buttonXRayedTitle (state) {
            return state === -1
                ? this.$t("modules.bimViewer.modelExplorer.models.buttonToggleTransparencyPartially")
                : this.$t("modules.bimViewer.modelExplorer.models.buttonToggleTransparency");
        }
    }
};
</script>

<template>
    <div class="LeftSidebar">
        <ul
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                :id="'tab-models'"
                class="text-nowrap"
                :active="activeTab === 'models'"
                :target="'#tab-content-models'"
                :label="'modules.bimViewer.modelExplorer.tabModels'"
                :interaction="() => setActiveTab('models')"
            />

            <NavTab
                :id="'tab-containment'"
                class="text-nowrap"
                :active="activeTab === 'containment'"
                :target="'#tab-content-containment'"
                :label="'modules.bimViewer.modelExplorer.tabContainment'"
                :interaction="() => setActiveTab('containment')"
            />

            <NavTab
                :id="'tab-storeys'"
                class="text-nowrap"
                :active="activeTab === 'storeys'"
                :target="'#tab-content-storeys'"
                :label="'modules.bimViewer.modelExplorer.tabStoreys'"
                :interaction="() => setActiveTab('storeys')"
            />

            <NavTab
                :id="'tab-types'"
                class="text-nowrap"
                :active="activeTab === 'types'"
                :target="'#tab-content-types'"
                :label="'modules.bimViewer.modelExplorer.tabTypes'"
                :interaction="() => setActiveTab('types')"
            />
        </ul>

        <template v-if="activeTab === 'models'">
            <div
                id="tab-content-models"
                class="modelContainer"
            >
                <div v-if="!loadedModels?.length">
                    {{ $t("modules.bimViewer.modelExplorer.noModelsLoaded") }}
                </div>

                <template v-else>
                    <div
                        v-for="loadedModelItem in loadedModels"
                        :key="`model_${loadedModelItem.sceneModel.id}`"
                        class="modelItem"
                    >
                        <div
                            class="link"
                            role="button"
                            tabindex="0"
                            :title="$t('modules.bimViewer.modelExplorer.models.fitModel')"
                            :aria-label="$t('modules.bimViewer.modelExplorer.models.fitModel')"
                            @click="flyToCompleteModel(loadedModelItem.sceneModel.id)"
                            @keydown.enter="flyToCompleteModel(loadedModelItem.sceneModel.id)"
                        >
                            {{ loadedModelItem.sceneModel.id }}
                        </div>

                        <div class="actions">
                            <IconButton
                                :class-array="[
                                    'btn-light',
                                    'bootstrap-icon',
                                    loadedModelItem.extraSettings.visible === -1 ? 'partially-active' : ''
                                ]"
                                :titel="buttonVisibilityTitle(loadedModelItem.extraSettings.visible)"
                                :aria="buttonVisibilityTitle(loadedModelItem.extraSettings.visible)"
                                :icon="[0, -1].includes(loadedModelItem.extraSettings.visible) ? 'bi-eye-slash': 'bi-eye'"
                                :interaction="() => setVisible(
                                    loadedModelItem.sceneModel.id,
                                    loadedModelItem.extraSettings.visible
                                )"
                            />

                            <IconButton
                                :class-array="[
                                    'btn-light',
                                    'bootstrap-icon',
                                    loadedModelItem.extraSettings.xRayed === -1 ? 'partially-active' : ''
                                ]"
                                :titel="buttonXRayedTitle(loadedModelItem.extraSettings.xRayed)"
                                :aria="buttonXRayedTitle(loadedModelItem.extraSettings.xRayed)"
                                :icon="[0].includes(loadedModelItem.extraSettings.xRayed) ? 'bi-border-all': 'bi-border'"
                                :interaction="() => setXRayed(
                                    loadedModelItem.sceneModel.id,
                                    loadedModelItem.extraSettings.xRayed
                                )"
                            />

                            <IconButton
                                :class-array="['btn-light', 'bootstrap-icon']"
                                :titel="$t('modules.bimViewer.modelExplorer.models.buttonDeleteModel')"
                                :aria="$t('modules.bimViewer.modelExplorer.models.buttonDeleteModel')"
                                :icon="'bi-trash'"
                                :interaction="() => destroyModel(loadedModelItem.sceneModel.id)"
                            />
                        </div>
                    </div>

                    <FlatButton
                        :text="$t('modules.bimViewer.modelExplorer.models.buttonClearScene')"
                        :interaction="() => deleteAllModels()"
                    />
                </template>
            </div>
        </template>

        <div
            v-show="activeTab !=='models'"
            :id="`tab-content-${activeTab}`"
            ref="treeViewContainer"
            class="treeViewContainer"
        >
            <div v-if="!loadedModels?.length">
                {{ $t("modules.bimViewer.modelExplorer.noModelsLoaded") }}
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.LeftSidebar {
        display: flex;
        flex-direction: column;
        flex: 0.5;
        padding: 0 1rem 0 0;
        box-shadow: 0.1875rem 0.1875rem 1rem $shadow;

    div.modelContainer {
        margin: 1rem 0 0 0.5rem;
        overflow-y: auto;

            div.modelItem {
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.5rem;
                border-bottom: solid 0.0625rem #DDD;
                padding-bottom: 1rem;

                div.link {
                    overflow-wrap: anywhere;

                    &:hover {
                        background-color: $accent_hover;
                    }
                }

                div.actions {
                    display: flex;

                    button {
                        &.partially-active {
                            border: 0.125rem dashed $light_grey_inactive;
                        }
                    }
                }

                &:last-of-type {
                    margin-bottom: 1rem;
                }
            }
        }

        div.treeViewContainer {
            height: 100%;
            pointer-events: all;
            overflow: auto;
            color: black;
            margin: 1rem 0 0 0.5rem;

            ul {
                list-style: none;
                padding-left: 0.75em;
                pointer-events: none;

                &:first-child {
                    padding-left: 1.5rem;
                }

                li {
                    position: relative;
                    width: 100%;
                    pointer-events: none;
                    padding: 0.1875rem 0;
                    vertical-align: middle;

                    &.xrayed-node {
                        > span {
                            color: $light_grey_inactive;
                        }
                    }

                    &.highlighted-node {
                        > span {
                            font-weight: bold;
                        }
                    }

                    a {
                        background-color: $light_grey;
                        border-radius: 50%;
                        color: $black;
                        display: inline-block;
                        height: 1.5em;
                        left: -1.5em;
                        position: absolute;
                        text-align: center;
                        text-decoration: none;
                        width: 1.5em;
                        pointer-events: all;

                        &.plus, &.minus {
                            pointer-events: all;
                        }

                        &:active {
                            top: 0.0625rem;
                            pointer-events: all;
                        }

                        &:hover {
                            background-color: $accent_hover;
                        }
                    }

                    span {
                        display: inline;
                        padding-left: 0.125rem;
                        pointer-events: all;
                        height: 1.437rem;

                        &:hover {
                            background-color: $accent_hover;
                            cursor: pointer;
                            padding-left: 0.125rem;
                            pointer-events: all;
                        }
                    }
                }
            }
        }
    }
}
</style>
