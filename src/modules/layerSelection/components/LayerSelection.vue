<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import layerTypes from "@core/layers/js/layerTypes.js";
import sortBy from "@shared/js/utils/sortBy.js";
import LayerCheckBox from "../../layerTree/components/LayerCheckBox.vue";
import SearchBar from "../../searchBar/components/SearchBar.vue";
import LayerSelectionTreeNode from "./LayerSelectionTreeNode.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {layerExistsInTree, filterQueryableTree, filterTreeByQueryAndQueryable, filterRecursive, getVisibleLayers} from "@shared/js/utils/layerTreeFilterUtils.js";
import {treeSubjectsKey} from "../../../shared/js/utils/constants.js";

/**
 * Layer Selection
 * @module modules/LayerSelection
 * @vue-data {Number} currentComponentSide - The layer id for the select all checkbox.
 * @vue-data {Number} selectAllConfId - The layer id for the select all checkbox.
 * @vue-data {Array} selectAllConfigs - The layer configurations for select all checkbox.
 */
export default {
    name: "LayerSelection",
    components: {
        LayerCheckBox,
        SearchBar,
        LayerSelectionTreeNode,
        IconButton
    },
    data () {
        return {
            selectAllConfId: -1,
            selectAllConfigs: [],
            activeCategory: null,
            deactivateShowAllCheckbox: false,
            rootFolderCount: 0,
            filteredLayerConfs: [],
            fullRootLayerConfig: []
        };
    },
    computed: {
        ...mapGetters("Modules/SearchBar", ["addLayerButtonSearchActive", "currentSide", "showAllResults", "showSearchResultsInTree", "searchInput"]),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters(["activeOrFirstCategory", "allCategories", "portalConfig", "folderById", "layerConfig", "filterInLayerSelection"]),
        ...mapGetters("Modules/LayerSelection", ["visible", "subjectDataLayerConfs", "baselayerConfs", "lastFolderNames", "layerInfoVisible", "highlightLayerId", "menuSide"]),
        /**
         * @return {Array} The layer configurations for the select all checkbox.
         */
        categorySwitcher () {
            return this.portalConfig?.tree?.categories;
        },
        /**
         * @return {string|null|false} False: to hide the headline; null: using i18n text; none empty string to show that one
         */
        categoryBackgroundsHeaderText () {
            if (this.portalConfig?.tree?.hideBackgroundsHeader === true) {
                return false;
            }

            if (this.portalConfig?.tree?.backgroundsHeaderText
                && typeof this.portalConfig.tree.backgroundsHeaderText === "string"
                && this.portalConfig.tree.backgroundsHeaderText > ""
            ) {
                return this.portalConfig.tree.backgroundsHeaderText;
            }

            return null;
        },
        /**
         *  @return {string|null|false} False: to hide the headline; null: using i18n text; none empty string to show that one
         */
        datalayerHeaderText () {
            if (this.portalConfig?.tree?.hideDatalayerHeader === true) {
                return false;
            }

            if (this.portalConfig?.tree?.datalayerHeaderText
                && typeof this.portalConfig.tree.datalayerHeaderText === "string"
                && this.portalConfig.tree.datalayerHeaderText > ""
            ) {
                return this.portalConfig.tree.datalayerHeaderText;
            }

            return null;
        },
        /**
         * Returns true if the folder navigation is at root level.
         * @return {Boolean}
         */
        isAtRootLevel () {
            return this.lastFolderNames.length === 1;
        }
    },

    /**
     * Watches the layerConfig for changes and updates the subjectDataLayerConfs accordingly.
     * Ensures the theme tree reflects the current layer configuration, respecting folder navigation.
     * @param {Object} newVal - The new value of layerConfig from the store.
     * @returns {void}
     */
    watch: {
        searchInput () {
            this.filterLayers();
        },
        lastFolderNames: {
            handler (newVal, oldVal) {
                const newLast = newVal[newVal.length - 1],
                    oldLast = oldVal[oldVal.length - 1];

                if (newLast !== oldLast) {
                    this.filterLayers();
                }
            }
        },
        layerConfig: {
            handler (newVal) {
                if (newVal && newVal[treeSubjectsKey] && Array.isArray(newVal[treeSubjectsKey].elements)) {
                    const rootLayerConfig = newVal[treeSubjectsKey].elements,
                        currentFolderCount = rootLayerConfig.filter(conf => conf.type === "folder").length;

                    if (currentFolderCount !== this.rootFolderCount) {
                        this.rootFolderCount = currentFolderCount;
                        let updatedSubjectDataLayerConfs = rootLayerConfig;

                        if (this.lastFolderNames.length > 0) {
                            let currentFolder = rootLayerConfig;

                            this.lastFolderNames.forEach(folderName => {
                                if (folderName !== "root") {
                                    const nextFolder = currentFolder.find(conf => conf.type === "folder" && conf.name === folderName);

                                    if (nextFolder && Array.isArray(nextFolder.elements)) {
                                        currentFolder = nextFolder.elements;
                                    }
                                    else {
                                        console.warn(`[LayerSelection Watcher] Folder "${folderName}" not found or empty during navigation update.`);
                                        currentFolder = [];
                                    }
                                }
                            });
                            updatedSubjectDataLayerConfs = Array.isArray(currentFolder) ? [...currentFolder] : [];
                        }

                        updatedSubjectDataLayerConfs = sortBy(updatedSubjectDataLayerConfs, conf => conf.type !== "folder");

                        this.setSubjectDataLayerConfs(updatedSubjectDataLayerConfs);

                        this.selectAllConfId = -1;
                        this.selectAllConfigs = [];
                        this.$nextTick(() => {
                            this.provideSelectAllProps();
                        });

                    }
                }
            },
            deep: true
        }
    },

    mounted () {
        if (this.layerConfig?.[treeSubjectsKey]?.elements) {
            this.rootFolderCount = this.layerConfig[treeSubjectsKey].elements.filter(conf => conf.type === "folder").length;
        }
    },

    unmounted () {
        if (!this.layerInfoVisible) {
            this.reset();
        }
        this.setHighlightLayerId(null);
    },
    created () {
        this.originalSubjectDataLayerConfs = this.subjectDataLayerConfs;
        this.activeCategory = this.activeOrFirstCategory?.key;
        this.setLayerInfoVisible(false);
        this.filterLayers();
    },
    methods: {
        ...mapActions(["changeCategory"]),
        ...mapActions("Modules/LayerSelection", ["navigateBack", "navigateForward", "reset"]),
        ...mapMutations("Modules/LayerSelection", ["setLayerInfoVisible", "setHighlightLayerId", "setSubjectDataLayerConfs"]),

        /**
         * Sorts the configs by type: first folder, then layer.
         * @param {Array} configs list of layer and folder configs
         * @returns {Array} the sorted configs
         */
        sort (configs) {
            return sortBy(configs, (conf) => [
                conf.type !== "folder",
                this.portalConfig.tree.type === "auto" ? conf.name.toLowerCase() : undefined
            ]);
        },

        /**
         * Filters the layer configurations based on the search input.
         * Ensures the highlighted layer is always included in the filtered results.
         * @returns {void}
         */
        filterLayers () {
            if (!this.fullRootLayerConfig?.length && this.layerConfig?.[treeSubjectsKey]?.elements) {
                this.fullRootLayerConfig = this.layerConfig[treeSubjectsKey].elements;
            }

            const
                sourceTree = this.fullRootLayerConfig.length > 0
                    ? this.fullRootLayerConfig
                    : this.originalSubjectDataLayerConfs,

                filteredTree = filterRecursive(
                    sourceTree,
                    this.searchInput.trim().toLowerCase()
                );

            let currentFolder = filteredTree,
                visibleLayers = [],
                highlightConf = null,
                highlightExists = false;


            if (this.lastFolderNames.length > 1) {
                for (const folderName of this.lastFolderNames.slice(1)) {
                    const nextFolder = currentFolder.find(n => n.type === "folder" && n.name === folderName);

                    currentFolder = nextFolder?.elements || [];
                }
            }

            visibleLayers = getVisibleLayers(currentFolder);
            highlightConf = this.originalSubjectDataLayerConfs.find(layer => layer.id === this.highlightLayerId);
            highlightExists = layerExistsInTree(visibleLayers, this.highlightLayerId);

            if (highlightConf && !highlightExists) {
                visibleLayers.push(highlightConf);
            }

            this.filteredLayerConfs = visibleLayers;
            this.provideSelectAllProps();
        },
        /**
         * Navigates backwards in folder-menu.
         * @param {Number} level level to go back to
         * @returns {void}
         */
        navigateStepsBack (level) {
            const end = this.lastFolderNames.length - level - 1;

            for (let index = 0; index < end; index++) {
                this.navigateBack();
            }

            this.filterLayers();

            this.$nextTick(() => {
                this.selectAllConfId = -1;
                this.selectAllConfigs = [];
                this.provideSelectAllProps();
            });
        },
        /**
         * Listener for click on folder.
         * @param {String} lastFolderName name to show in menu to navigate back to
         * @param {Array} subjectDataLayerConfs configs to show
         * @returns {void}
         */
        folderClicked (lastFolderName, subjectDataLayerConfs) {
            const sortedConfs = this.sort(subjectDataLayerConfs);

            this.navigateForward({lastFolderName, subjectDataLayerConfs: sortedConfs});

            this.filterLayers();

            this.$nextTick(() => {
                this.selectAllConfId = -1;
                this.selectAllConfigs = [];
                this.provideSelectAllProps();
            });
        },
        /**
         * Returns true, if configuration shall be controlled by SelectAllCheckBox.
         * @param {Object} conf layer or folder configuration
         * @returns {Boolean} true, if configuration shall be controlled by SelectAllCheckBox
         */
        isControlledBySelectAll (conf) {
            return conf.type === "layer" && (this.mode === "2D" ? !layerTypes.getLayerTypes3d().includes(conf.typ?.toUpperCase()) : true);
        },
        /**
         * Provides data for SelectAllCheckBox props.
         * @returns {void}
         */
        provideSelectAllProps () {
            const visibleLayers = this.filteredLayerConfs.filter(conf => this.isControlledBySelectAll(conf));

            this.selectAllConfigs = visibleLayers;
            this.selectAllConfId = visibleLayers[0]?.id || -1;

            if (visibleLayers[0]) {
                this.toggleShowAllCheckbox(visibleLayers[0]);
            }
        },
        /**
         * Changes category after selection.
         * @param {String} value key of the category
         * @returns {void}
         */
        categorySelected (value) {
            if (typeof value === "string") {
                const category = this.allCategories.find(aCategory => aCategory.key === value);

                this.allCategories.forEach(aCategory => {
                    aCategory.active = false;
                });
                category.active = true;
                this.changeCategory(category);
            }
        },
        /**
         * Filters baselayers for mode '2D' or '3D'.
         * @returns {Array} list of filtered baselayers
         */
        filterBaseLayer () {
            if (this.mode === "3D") {
                return this.baselayerConfs.filter(conf => !layerTypes.getLayerTypesNotVisibleIn3d().includes(conf.typ?.toUpperCase()));
            }
            return this.baselayerConfs;
        },
        /**
         * Filters subjectData layers.
         * @returns {Array} list of filtered layers
         */
        filterSubjectDataLayer () {
            return this.subjectDataLayerConfs.filter(conf => !conf.isExternal);
        },

        /**
         * Filters external subjectData layers.
         * @returns {Array} list of filtered layers
         */
        filterExternalSubjectDataLayer () {
            const externalLayers = this.subjectDataLayerConfs.filter(conf => conf.isExternal),
                query = this.searchInput.toLowerCase();

            if (this.filterInLayerSelection !== true) {
                return externalLayers;
            }

            if (query) {
                return filterTreeByQueryAndQueryable(externalLayers, query);
            }

            return filterQueryableTree(externalLayers);
        },

        /**
         * Toggles the state of the show-all checkbox based on the configuration provided.
         * @param {Object} conf The configuration object containing necessary properties.
         * @return {void}
         */
        toggleShowAllCheckbox (conf) {
            if (conf.parentId) {
                const lastFolder = this.folderById(conf.parentId);

                this.deactivateShowAllCheckbox = lastFolder.deactivateShowAllCheckbox === true;
            }
        }
    }
};
</script>

<template>
    <div
        v-if="visible"
        :id="'layer-selection'"
        class="w-100 layer-selection"
        aria-label=""
    >
        <SearchBar
            v-if="addLayerButtonSearchActive === true || showSearchResultsInTree === true"
        />
        <div class="layer-selection-navigation d-flex">
            <div
                v-if="showAllResults === false"
                class="layer-selection-navigation"
            >
                <h5
                    v-if="(filterBaseLayer().length > 0 && categoryBackgroundsHeaderText !== false)"
                    class="layer-selection-subheadline"
                >
                    {{ categoryBackgroundsHeaderText ?? $t("common:modules.layerSelection.backgrounds") }}
                </h5>
                <div class="d-flex justify-content-start layer-selection-navigation-baselayer">
                    <template
                        v-for="(bgConf, index) in filterBaseLayer()"
                        :key="index"
                    >
                        <div class="col baselayer">
                            <LayerCheckBox
                                :conf="bgConf"
                                :is-layer-tree="false"
                            />
                        </div>
                    </template>
                </div>
                <hr
                    v-if="filterBaseLayer().length > 0"
                    class="m-2"
                >

                <div class="align-items-left justify-content-center layer-selection-navigation-dataLayer">
                    <div class="layer-selection-category-head">
                        <h5
                            v-if="isAtRootLevel && datalayerHeaderText !== false"
                            class="layer-selection-subheadline"
                        >
                            {{ datalayerHeaderText ?? $t("common:modules.layerSelection.datalayer") }}
                        </h5>

                        <div
                            v-if="activeOrFirstCategory && categorySwitcher && isAtRootLevel"
                            class="btn d-flex mb-auto layer-selection-category-div-btn"
                        >
                            <IconButton
                                id="layer-selection-category-btn"
                                :class-array="['btn-light']"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseCategory"
                                :icon="'bi bi-filter-left'"
                                :aria="`${$t('common:modules.layerTree.categories')}: ${$t('common:modules.layerTree.iconSubMenu')}`"
                            />
                        </div>
                    </div>

                    <div
                        v-if="activeOrFirstCategory && categorySwitcher && isAtRootLevel"
                        id="collapseCategory"
                        class="collapse"
                    >
                        <div class="layer-selection-category-list">
                            <h6>{{ $t('common:modules.layerTree.categoriesListHead') }}</h6>
                            <div
                                v-for="category in allCategories"
                                :key="category.key"
                                class="grid-item"
                            >
                                <span class="subItem">
                                    <input
                                        :id="'collapse-category-sub-menu-' + category.key"
                                        type="radio"
                                        name="category"
                                        :value="category.key"
                                        class="form-check-input"
                                        :checked="activeCategory === category.key? true : false"
                                        @click="categorySelected($event.target.value)"
                                        @keydown.enter="categorySelected($event.target.value)"
                                    >
                                </span>
                                <span class="subItem">
                                    <label
                                        :for="'collapse-category-sub-menu-' + category.key"
                                    > {{ $t(category.name) }}
                                    </label>
                                </span>
                            </div>
                        </div>
                    </div>

                    <nav
                        v-if="lastFolderNames.length > 1"
                        aria-label="breadcrumb"
                        class="position-sticky top-0 bg-white py-3"
                    >
                        <ol
                            class="breadcrumb mb-0"
                        >
                            <li
                                v-for="(lastFolderName, index) in lastFolderNames"
                                :key="index"
                                :class="['breadcrumb-item', index === (lastFolderNames.length -1) ? 'active': '']"
                            >
                                <a
                                    v-if="index < (lastFolderNames.length -1)"
                                    class="mp-menu-navigation"
                                    href="#"
                                    @click="navigateStepsBack(index)"
                                    @keypress="navigateStepsBack(index)"
                                >
                                    <h6 class="mp-menu-navigation-link bold">{{ lastFolderName === "root" ? $t("common:modules.layerSelection.datalayer") : $t(lastFolderName) }}</h6>
                                </a>
                                <h6
                                    v-else
                                    class="mp-menu-navigation-link bold no-link"
                                >
                                    {{ $t(lastFolderName) }}
                                </h6>
                            </li>
                        </ol>
                    </nav>
                    <template
                        v-for="(conf, idx) in filteredLayerConfs"
                        :key="idx"
                    >
                        <LayerSelectionTreeNode
                            :conf="conf"
                            :show-select-all-check-box="selectAllConfId === conf.id && !deactivateShowAllCheckbox"
                            :select-all-configs="selectAllConfigs"
                            @show-node="folderClicked"
                        />
                    </template>

                    <div v-if="filterExternalSubjectDataLayer().length > 0">
                        <hr
                            v-if="lastFolderNames.length === 1"
                            class="m-2"
                        >
                        <h5
                            v-if="lastFolderNames.length === 1"
                            class="layer-selection-subheadline"
                        >
                            {{ $t("common:modules.layerSelection.externalSubjectLayer") }}
                        </h5>
                        <template
                            v-for="(conf, idx) in filterExternalSubjectDataLayer()"
                            :key="idx"
                        >
                            <LayerSelectionTreeNode
                                :conf="conf"
                                :show-select-all-check-box="selectAllConfId === conf.id && !deactivateShowAllCheckbox"
                                :select-all-configs="selectAllConfigs"
                                @show-node="folderClicked"
                            />
                        </template>
                    </div>
                    <small
                        v-if="filterInLayerSelection && searchInput.trim() !== '' && filteredLayerConfs.length === 0 && filterExternalSubjectDataLayer().length === 0"
                        class="form-text text-muted"
                    >
                        {{ $t('common:modules.layerSelection.noResults', { filterText: searchInput }) }}
                    </small>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.breadcrumb-item + .breadcrumb-item::before{
    font-weight: bold;
    line-height: 1.2rem;
}

.layer-selection {
    background-color: $menu-background-color;
    left: 0px;
    height: calc(100% - 50px);
    padding-top: 0;
    @media (max-height: 670px) {
        height: calc(100% - 85px);
    }
}

.layer-selection-category-head {
    display: flex;
}

.layer-selection-category-div-btn {
    position: relative;
    bottom: 0.8rem;
    margin-left: auto;
    height: 3rem;
    cursor: inherit;
}

.layer-selection-category-list {
    margin: 0 0 0.5rem 2rem;

    > h6 {
        margin-bottom: 1rem;
    }
    > .grid-item {
        margin: 0.8rem 0 0 0;
        text-align: left;

        > .subItem {
            margin: 0 0.4rem 0 0;
            vertical-align: text-bottom;
        }
    }
}

.layer-selection-navigation {
    height: 90%;
    flex-direction: column;
}

.layer-selection-navigation-baselayer {
    overflow-x: auto;
}
@include media-breakpoint-down(md) {
    .layer-selection-navigation-baselayer {
        max-height: 120px;
    }
}
.layer-selection-navigation-dataLayer {
    @include media-breakpoint-down(md) {
        max-height: calc(100% - 120px);
    }
}

.layer-selection-subheadline {
    margin: 0px 0 15px 0;
}

.mp-menu-navigation{
    color: $black;
    display: flex;
}
.mp-menu-navigation-link{
    display: flex;
}

@include media-breakpoint-up(sm)  {
    .layer-selection-navigation-baselayer {
        overflow-x: auto;
    }
}
.baselayer {
    min-width: 35%;
}
</style>
