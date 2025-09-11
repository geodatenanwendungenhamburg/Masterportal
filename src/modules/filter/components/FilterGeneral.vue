<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersFilter.js";
import mutations from "../store/mutationsFilter.js";
import LayerFilterSnippet from "./LayerFilterSnippet.vue";
import MapHandler from "../utils/mapHandler.js";
import FilterApi from "../js/interfaces/filter.api.js";
import {compileLayers} from "../utils/compileLayers.js";
import openlayerFunctions from "../utils/openlayerFunctions.js";
import FilterList from "./FilterList.vue";
import isObject from "@shared/js/utils/isObject.js";
import {isRule} from "../utils/isRule.js";
import GeometryFilter from "./GeometryFilter.vue";
import {getFeaturesOfAdditionalGeometries} from "../utils/getFeaturesOfAdditionalGeometries.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import getFeature from "@shared/js/api/wfs/getFeature.js";
import {WFS} from "ol/format.js";
import UrlHandler from "../utils/urlHandler.js";
import Cluster from "ol/source/Cluster.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import {Toast} from "bootstrap";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {hasUnfixedRules} from "../utils/hasUnfixedRules.js";
import SnippetTag from "@modules/filter/components/SnippetTag.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

/**
 * Filter General
 * @module modules/FilterGeneral
 * @vue-data {Object} mapHandler - The MapHandler Object.
 * @vue-data {Array} layerConfigs - List of layer configurations.
 * @vue-data {Array} selectedLayerGroups - List of selected layer groups.
 * @vue-data {Array} preparedLayerGroups - List of prepared layer groups.
 * @vue-data {Array} flattenPreparedLayerGroups - List of prepared, flattened layer groups.
 * @vue-data {Object} layerLoaded - The loaded layer.
 * @vue-data {String} layerFilterSnippetPostKey - The layer filter snippet post key.
 */
export default {
    name: "FilterGeneral",
    components: {
        AccordionItem,
        FlatButton,
        SnippetTag,
        GeometryFilter,
        LayerFilterSnippet,
        FilterList,
        IconButton
    },
    data () {
        return {
            mapHandler: new MapHandler({
                getLayerByLayerId: openlayerFunctions.getLayerByLayerId,
                showFeaturesByIds: openlayerFunctions.showFeaturesByIds,
                zoomToFilteredFeatures: openlayerFunctions.zoomToFilteredFeatures,
                zoomToExtent: openlayerFunctions.zoomToExtent,
                changeLayerVisibility: openlayerFunctions.changeLayerVisibility,
                setParserAttributeByLayerId: openlayerFunctions.setParserAttributeByLayerId,
                getLayers: openlayerFunctions.getLayers
            }),
            preparedLayerGroups: [],
            layerRules: [],
            flattenPreparedLayerGroups: [],
            layerLoaded: {},
            layerFilterSnippetPostKey: "",
            urlHandler: new UrlHandler(this.mapHandler),
            alreadyWatching: null,
            mapMoveListeners: {},
            mapMoveRegistered: false,
            isFilterActive: false,
            isFilterShown: false,
            isGeometryFilterActive: false
        };
    },
    computed: {
        ...mapGetters("Modules/Filter", Object.keys(getters)),
        ...mapGetters({appStoreUrlParams: "urlParams"}),

        amountOfFilteredItems () {
            return Object.values(this.totalResults).reduce((a, b) => a + b, 0);
        },

        currentURL () {
            const url = new URL(window.location.href);

            url.searchParams.set("MENU", "{\""
                + (this.menuSide === "mainMenu" ? "main" : "secondary")
                + "\":{\"currentComponent\":\"filter\"}}"
            );
            url.searchParams.set(this.type.toUpperCase(), this.urlParams);
            return url;
        },

        console: () => console,
        filters () {
            return this.layerConfigs.layers.filter(layer => {
                return isObject(layer);
            });
        }
    },
    watch: {
        rulesOfFilters: {
            handler (val) {
                this.generateLayerRules(val);
                this.isFilterActive = this.layerRules.length > 0;
            },
            deep: true
        }
    },
    mounted () {
        const selectedFilterIds = [];

        getFeaturesOfAdditionalGeometries(this.geometrySelectorOptions.additionalGeometries).then(additionalGeometries => {
            if (!Array.isArray(additionalGeometries) || !additionalGeometries.length) {
                return;
            }

            this.setAdditionalGeometries({additionalGeometries});
        });

        if (this.layerConfigs?.length === 0) {
            this.setLayerConfigs(compileLayers(this.layerGroups, this.layers, FilterApi));
            if (Array.isArray(this.layerConfigs?.layers) && this.layerConfigs.layers.length > 0) {
                this.layerConfigs.layers.forEach(config => {
                    if (typeof config?.active === "boolean" && config.active && typeof config?.filterId !== "undefined") {
                        selectedFilterIds.push(config.filterId);
                    }
                });
            }
        }

        if (Array.isArray(this.layerConfigs.groups) && this.layerConfigs.groups.length > 0) {
            this.layerConfigs.groups.forEach(layerGroup => {
                if (!isObject(layerGroup)) {
                    return;
                }
                this.preparedLayerGroups.push(layerGroup);
                layerGroup.layers.forEach(layer => {
                    this.flattenPreparedLayerGroups.push(layer);
                    if (layer?.active === true && typeof layer?.filterId !== "undefined") {
                        selectedFilterIds.push(layer.filterId);
                    }
                });
            });
        }
        if (selectedFilterIds.length > 0) {
            this.setSelectedAccordions(this.transformLayerConfig([...this.layerConfigs.layers, ...this.flattenPreparedLayerGroups], selectedFilterIds));
        }

        this.urlHandler.readFromUrlParams(this.appStoreUrlParams?.[this.type.toUpperCase()], this.layerConfigs, this.mapHandler, params => {
            this.handleStateForAlreadyActiveLayers(params);
            this.deserializeState({...params, setLateActive: true});
            this.addWatcherToWriteUrl();
        });
        this.addWatcherToWriteUrl();
    },
    beforeUnmount () {
        if (this.mapMoveRegistered) {
            this.unregisterMapMoveListeners();
        }
    },
    methods: {
        ...mapMutations("Modules/Filter", Object.keys(mutations)),
        ...mapActions("Modules/Filter", [
            "initialize",
            "updateRules",
            "deleteAllRules",
            "updateFilterHits",
            "deserializeState",
            "setRulesArray"
        ]),
        ...mapActions("Maps", ["registerListener", "unregisterListener"]),
        hasUnfixedRules,
        isRule,

        /**
         * Check if there are active filter.
         * @param {Object[]} rules The rules of filter.
         * @returns {void}
         */
        checkActiveFilter (rules) {
            if (!Array.isArray(rules) || !rules.length) {
                this.isFilterActive = false;
                return;
            }

            for (let i = 0; i < rules.length; i++) {
                if (rules[i] === null) {
                    this.isFilterActive = false;
                }
                else if (Array.isArray(rules[i]) && rules[i].length) {
                    this.isFilterActive = rules[i].filter(v => v !== false && v !== null && !v?.fixed).length > 0;
                }
                else {
                    this.isFilterActive = false;
                }

                if (this.isFilterActive) {
                    break;
                }
            }
        },
        /**
         * Generates the layer rules.
         * @param {Object[]} rules The rules of filter.
         * @returns {void}
         */
        generateLayerRules (rules) {
            const tmpRules = [];

            [...this.flattenPreparedLayerGroups, ...this.layerConfigs.layers].forEach(layerConfig => {
                if (rules[layerConfig.filterId] && rules[layerConfig.filterId].filter(rule => rule !== false && rule !== null && !rule?.fixed).length) {
                    const rulesToShow = [];

                    rules[layerConfig.filterId].forEach(rule => {
                        if (!this.isRule(rule)) {
                            return;
                        }
                        if (Array.isArray(rule.appliedPassiveValues) && !rule?.appliedPassiveValues?.length) {
                            return;
                        }
                        rulesToShow.push(rule);
                    });
                    if (rulesToShow.length === 0) {
                        return;
                    }
                    tmpRules.push({
                        filterId: layerConfig.filterId,
                        layerTitle: layerConfig.title,
                        rule: rulesToShow
                    });
                }
            });

            this.layerRules = tmpRules;
        },

        /**
         * Handles the state for already activated layers by given params.
         * The given params are set for the matching layer if it is already active but has no features loaded yet.
         * This function edits the given param and removes the rules and
         * accordions out of the arrays for the matching layers and leaves only the others.
         * @param {Object} params The params object. It will be edited if there is any matching layer.
         * @param {Object[]} params.rulesOfFilters The rules array.
         * @param {Object[]} params.selectedAccordions The selected accordions to find the layer for.
         * @returns {void}
         */
        handleStateForAlreadyActiveLayers (params) {
            if (!isObject(params) || !Object.prototype.hasOwnProperty.call(params, "selectedAccordions")
                || !Object.prototype.hasOwnProperty.call(params, "rulesOfFilters")) {
                return;
            }
            let selecetedAccordionsLen = Array.isArray(params?.selectedAccordions) ? params.selectedAccordions.length : 0;

            while (selecetedAccordionsLen--) {
                const accordion = params.selectedAccordions[selecetedAccordionsLen],
                    rulesOfAccordeon = params.rulesOfFilters[accordion?.filterId];
                let layerModel = null,
                    layerConfig = null,
                    layerSource = null;

                layerModel = layerCollection.getLayerById(accordion?.layerId);
                layerConfig = openlayerFunctions.getLayerByLayerId(accordion?.layerId);
                if (!layerModel) {
                    continue;
                }
                layerSource = layerModel.layer.getSource() instanceof Cluster ? layerModel.layer.getSource().getSource() : layerModel.layer.getSource();
                if (!layerSource) {
                    continue;
                }
                if (layerConfig?.visibility && ((
                    typeof layerSource?.getFeatures === "function"
                    && layerSource.getFeatures().length === 0)
                    || (typeof layerModel?.getFeatures === "function"
                    && layerModel.getFeatures().length === 0))) {
                    (layerConfig?.typ === "SensorThings" ? layerModel : layerSource).once("featuresloadend", async () => {
                        const rulesOfFiltersTmp = [...this.rulesOfFilters],
                            selectedAccordionsTmp = [...this.selectedAccordions];

                        rulesOfFiltersTmp[accordion.filterId] = rulesOfAccordeon;
                        selectedAccordionsTmp.push(accordion);
                        await this.setRulesArray({rulesOfFilters: rulesOfFiltersTmp});
                        this.setSelectedAccordions(selectedAccordionsTmp);
                    });
                    params.selectedAccordions.splice(selecetedAccordionsLen, 1);
                    params.rulesOfFilters[accordion.filterId] = null;
                }
            }
        },
        /**
         * Adds a watcher on the Filter module and pass the 'writeUrlParams' function as handler.
         * Only adds a watcher if there is no watcher set - checked by 'alreadyWatching' property.
         * @returns {void}
         */
        addWatcherToWriteUrl () {
            if (this.saveTo === "url") {
                if (typeof this.alreadyWatching === "function") {
                    return;
                }
                this.alreadyWatching = this.$watch("$store.state.Modules.Filter", this.writeUrlParams, {
                    deep: true
                });
            }
        },
        /**
         * Gets the features of the additional geometries by the given layer id.
         * @param {Object[]} additionalGeometries - The additional geometries.
         * @param {String} additionalGeometries[].layerId - The id of the layer.
         * @returns {void}
         */
        async getFeaturesOfAdditionalGeometries (additionalGeometries) {
            if (additionalGeometries) {
                const wfsReader = new WFS();

                for (const additionalGeometry of additionalGeometries) {
                    const rawLayer = rawLayerList.getLayerWhere({id: additionalGeometry.layerId}),
                        features = await getFeature.getFeatureGET(rawLayer.url, {version: rawLayer.version, featureType: rawLayer.featureType});

                    additionalGeometry.features = wfsReader.readFeatures(features);
                }
            }
        },
        /**
         * Update selected layer group.
         * @param {Number} layerGroupIndex index of the layer group
         * @returns {void}
         */
        updateSelectedGroups (layerGroupIndex) {
            const selectedGroups = JSON.parse(JSON.stringify(this.selectedGroups)),
                index = selectedGroups.indexOf(layerGroupIndex);

            if (index >= 0) {
                selectedGroups.splice(index, 1);
            }
            else {
                selectedGroups.push(layerGroupIndex);
            }
            this.setSelectedGroups(selectedGroups);
        },
        /**
         * Update selectedAccordions array in groups.
         * @param {Number} filterId id which should be added or removed
         * @returns {void|undefined} returns undefinied, if filterIds is not an array and not a number.
         */
        updateSelectedAccordions (filterId) {
            const selectedGroups = JSON.parse(JSON.stringify(this.selectedGroups)),
                filterIdsOfAccordions = [],
                collapseButtonGroups = this.preparedLayerGroups.filter(group => group.collapseButtons);
            let selectedAccordionIndex = -1;

            if (!this.multiLayerSelector || collapseButtonGroups.length || this.collapseButtons) {
                this.setSelectedAccordions(
                    this.transformLayerConfig(
                        [...this.layerConfigs.layers, ...this.flattenPreparedLayerGroups],
                        this.toggleFilterSelectionOfCollapseButtonGroup(filterId, collapseButtonGroups, this.selectedAccordions.map(accordion => accordion.filterId))
                    )
                );
                return;
            }

            this.preparedLayerGroups.forEach((layerGroup, groupIdx) => {
                if (layerGroup.layers.some(layer => layer.filterId === filterId) && !this.selectedGroups.includes(groupIdx)) {
                    selectedGroups.push(groupIdx);
                }
            });
            this.setSelectedGroups(selectedGroups);

            selectedAccordionIndex = this.selectedAccordions.findIndex(accordion => accordion.filterId === filterId);

            this.selectedAccordions.forEach(accordion => filterIdsOfAccordions.push(accordion.filterId));
            if (selectedAccordionIndex >= 0) {
                filterIdsOfAccordions.splice(selectedAccordionIndex, 1);
            }
            else {
                filterIdsOfAccordions.push(filterId);
            }
            this.setSelectedAccordions(this.transformLayerConfig([...this.layerConfigs.layers, ...this.flattenPreparedLayerGroups], filterIdsOfAccordions));
        },
        /**
         * Parses the collapseButtonGroups and toggles the filter selection of the collapse button group.
         * This function checks if any filterId from the same collapseButtonGroup is already selected and removes it.
         * @param {String} filterId The filterId to toggle selection for.
         * @param {Object[]} collapseButtonGroups The collapse button groups to check against.
         * @param {String[]} selectedFilterIds The currently selected filter ids.
         * @returns {String[]} The updated selected filter ids array after toggling the selection.
         */
        toggleFilterSelectionOfCollapseButtonGroup (filterId, collapseButtonGroups, selectedFilterIds) {
            const idx = selectedFilterIds.indexOf(filterId);

            if (idx >= 0) {
                selectedFilterIds.splice(idx, 1);
                return selectedFilterIds;
            }

            collapseButtonGroups.forEach(group => {
                let isInCurrentGroup = false;

                group.layers.forEach(layer => {
                    if (layer.filterId === filterId) {
                        isInCurrentGroup = true;
                    }
                });

                if (isInCurrentGroup) {
                    group.layers.forEach(layer => {
                        const otherIdx = selectedFilterIds.indexOf(layer.filterId);

                        if (otherIdx >= 0) {
                            selectedFilterIds.splice(otherIdx, 1);
                        }
                    });
                }
            });

            selectedFilterIds.push(filterId);
            return selectedFilterIds;
        },
        /**
         * Transform given layer config to an lightweight array of layerIds and filterIds.
         * @param {Object[]} configs The layer configs.
         * @param {String[]} filterIds The filter ids.
         * @returns {Object[]} array of lightweight filter objects which includes filterId and layerId.
         */
        transformLayerConfig (configs, filterIds) {
            const layers = [];

            configs.forEach(layerConfig => {
                if (Array.isArray(filterIds) && filterIds.includes(layerConfig.filterId)) {
                    layers.push({
                        layerId: layerConfig.layerId,
                        filterId: layerConfig.filterId
                    });
                }
            });
            return layers;
        },
        /**
         * Check if layer filter should be displayed.
         * @param {String} filterId filterId to check
         * @returns {Boolean} true if should be displayed false if not
         */
        isLayerFilterSelected (filterId) {
            if (!Array.isArray(this.selectedAccordions)) {
                return false;
            }

            let selected = false;

            this.selectedAccordions.forEach(selectedLayer => {
                if (selectedLayer.filterId === filterId) {
                    if (!this.layerLoaded[filterId]) {
                        this.setLayerLoaded(filterId);
                    }
                    selected = true;
                }
            });

            return selected;
        },
        /**
         * Setting the layer loaded true if the layer is clicked from the filter Id
         * @param {String} filterId filterId to check
         * @returns {void}
         */
        setLayerLoaded (filterId) {
            this.layerLoaded[filterId] = true;
        },
        /**
         * Sets the geometry/area to filter in.
         * @param {ol/geom/Geometry|Boolean} geometry The geometry (polygon, cycle, etc.) or false.
         * @returns {void}
         */
        updateFilterGeometry (geometry) {
            this.setFilterGeometry(geometry);
        },
        /**
         * Sets the geometry feature
         * @param {ol/Feature} feature The geometry feature.
         * @returns {void}
         */
        updateGeometryFeature (feature) {
            this.setGeometryFeature(feature);
        },
        /**
         * Sets the geometry selector options
         * @param {Object} options The geometry select options
         * @returns {void}
         */
        updateGeometrySelectorOptions (options) {
            this.setGeometrySelectorOptions(Object.assign({}, this.geometrySelectorOptions, options));
        },
        /**
         * Checks if the geometry selector should be visible.
         * @returns {Boolean} true if the geometry selector should be visible.
         */
        isGeometrySelectorVisible () {
            return isObject(this.geometrySelectorOptions) && this.geometrySelectorOptions.visible !== false;
        },
        /**
         * Resets the jumpToId state property.
         * @returns {void}
         */
        resetJumpToId () {
            this.setJumpToId(undefined);
        },
        /**
         * Writes the given state to the url.
         * @calls urlHandler.getParamsFromState
         * @param {Object} newState The state.
         * @returns {void}
         */
        writeUrlParams (newState) {
            const params = this.urlHandler.getParamsFromState(newState, this.neededUrlParams),
                generatedParams = JSON.stringify(params);

            this.setUrlParams(generatedParams);
        },
        /**
         * Registering a map moveend, loadend and loadstart listener.
         * @returns {void}
         */
        registerMapMoveListeners () {
            this.registerListener({type: "loadstart", listener: this.executeListeners.bind(this), keyForBoundFunctions: this.executeListeners.toString() + "loadstart"});
            this.registerListener({type: "loadend", listener: this.executeListeners.bind(this), keyForBoundFunctions: this.executeListeners.toString() + "loadend"});
            this.registerListener({type: "moveend", listener: this.executeListeners.bind(this), keyForBoundFunctions: this.executeListeners.toString() + "moveend"});
        },
        /**
         * Unregistering this moveend, loadend and loadstart listener.
         * @returns {void}
         */
        unregisterMapMoveListeners () {
            this.unregisterListener({type: "loadstart", listener: this.executeListeners.bind(this), keyForBoundFunctions: this.executeListeners.toString() + "loadstart"});
            this.unregisterListener({type: "loadend", listener: this.executeListeners.bind(this), keyForBoundFunctions: this.executeListeners.toString() + "loadend"});
            this.unregisterListener({type: "moveend", listener: this.executeListeners.bind(this), keyForBoundFunctions: this.executeListeners.toString() + "moveend"});
        },
        /**
         * Adds given listener callback to the mapMoveListeners list.
         * @param {Object} options The payload.
         * @param {Number} options.filterId The filterId to ensure that only one callback is added for the given filterId.
         * @param {Function|Boolean} options.listener The callback to execute on mapmove. Set to false to remove the listener.
         * @returns {void}
         */
        addToMapMoveListeners (options) {
            if (!isObject(options) || !Object.prototype.hasOwnProperty.call(options, "filterId") || !Object.prototype.hasOwnProperty.call(options, "listener")) {
                return;
            }
            this.mapMoveListeners[options.filterId] = options.listener;
            if (!this.mapMoveRegistered) {
                this.mapMoveRegistered = true;
                this.registerMapMoveListeners();
            }
        },
        /**
         * Executes the listener for each LayerFilterSnippet that has registered to mapMoveListeners.
         * @param {Object} evt - Openlayers MapEvent.
         * @returns {void}
         */
        executeListeners (evt) {
            Object.values(this.mapMoveListeners).forEach(mapMoveListener => {
                if (typeof mapMoveListener === "function") {
                    mapMoveListener(evt);
                }
            });
        },

        /**
         * Copies the url to the clipboard.
         * @returns {void}
         */
        copyToClipboard () {
            const toast = new Toast(this.$refs.copyToast);

            toast.show();
            navigator.clipboard.writeText(this.currentURL);
        },

        /**
         * Resets the snippets and rules.
         * @param {Number} id The filter id.
         * @returns {void}
         */
        resetSnippetsAndRules (id) {
            const layerFilterComp = this.$refs[`filter-${id}`];

            if (Array.isArray(layerFilterComp) && typeof layerFilterComp[0]?.resetsSnippetsAndRules === "function") {
                layerFilterComp[0].resetsSnippetsAndRules();
            }
            else if (typeof layerFilterComp?.resetsSnippetsAndRules === "function") {
                layerFilterComp.resetsSnippetsAndRules();
            }
        },

        /**
         * Opens the link in a new window.
         * @param {String} url the link url.
         * @returns {void}
         */
        openLink (url) {
            window.open(url);
        },

        /**
         * Gets tge snippet tag section class.
         * @param {Number} index the index of filter rules.
         * @param {Boolean} val if the filter snippetTag is shown.
         * @returns {String} the string as class.
         */
        getTagClass (index, val) {
            if (index < 2) {
                return "";
            }
            else if (!val) {
                return "d-none";
            }

            return "";
        },

        /**
         * Sets the value of deleted rule snippetId and filterId.
         * @param {Number} snippetId the snippet id.
         * @param {Number} filterId the filter id.
         * @returns {void}
         */
        setDeleteRule (snippetId, filterId) {
            this.setDeletedRuleSnippetId(snippetId);
            this.setDeletedRuleFilterId(filterId);
        },

        /**
         * Triggers onValueDeselect change, which can be watched by other snippets.
         * @param {Number} snippetId The ID of the snippet affected by the change.
         * @param {Number} filterId The ID of the filter affected by the change.
         * @param {Number} value The value that is deselected.
         * @returns {void}
         */
        setDeleteValue (snippetId, filterId, value) {
            this.setOnValueDeselect({filterId, snippetId, value});
        },

        /**
         * Triggers to set all tags deleted.
         * @returns {void}
         */
        triggerDeleteAll () {
            this.setTriggerAllTagsDeleted(!this.triggerAllTagsDeleted);
        },
        /**
         * Sets the isGeometryFilterActive variable true or false.
         * @returns {void}
         */
        toggleGeometryFilter () {
            this.isGeometryFilterActive = !this.isGeometryFilterActive;
        }
    }
};
</script>

<template lang="html">
    <div
        id="filter"
    >
        <div
            v-if="typeof questionLink === 'string' && questionLink !== ''"
            class="d-flex flex-row-reverse"
        >
            <IconButton
                :class-array="['btn-light']"
                :aria="$t('common:modules.filter.ariaLabel.toolInfo')"
                icon="bi bi-question-circle"
                :interaction="() => openLink(questionLink)"
            />
        </div>
        <div v-if="showCurrentlyActiveFilters && isFilterActive">
            <div class="d-block result">
                <div class="title">
                    <h5 class="float-start">
                        {{ $t("common:modules.filter.activeFilter") }}
                    </h5>
                    <span class="float-end">
                        {{ $t("common:modules.filter.filterResult.unit", {amountOfFilteredItems}) }}
                    </span>
                </div>
                <div
                    v-for="(layerRule, index) in layerRules"
                    :key="'layer-rule-' + index"
                    class="d-inline-block w-100"
                    :class="getTagClass(index, isFilterShown)"
                >
                    <div>
                        {{ layerRule.layerTitle }}
                    </div>
                    <div class="snippetTagsWrapper mt-1">
                        <div
                            v-for="(rule, ruleIndex) in layerRule.rule"
                            :key="'rule-' + ruleIndex"
                            class="ms-2"
                        >
                            <SnippetTag
                                v-if="isRule(rule) && rule.fixed === false"
                                :filter-id="layerRule.filterId"
                                :rule="rule"
                                @delete-rule="setDeleteRule"
                                @delete-value="setDeleteValue"
                            />
                        </div>
                    </div>
                </div>
                <div
                    v-if="layerRules.length > 2"
                    class="show-more"
                    role="button"
                    tabindex="0"
                    @click="isFilterShown = !isFilterShown"
                    @keydown="isFilterShown = !isFilterShown"
                >
                    <span
                        class="bi float-start"
                        :class="isFilterShown ? 'bi-chevron-up' : 'bi-chevron-down'"
                    />
                    {{ !isFilterShown ? $t("common:modules.filter.snippetTags.showMore") : $t("common:modules.filter.snippetTags.showLess") }}
                </div>
                <div class="d-inline-block text-center deleteAll d-flex justify-content-center mt-3">
                    <FlatButton
                        :aria-label="$t('common:modules.filter.filterResetAll')"
                        :text="$t('common:modules.filter.filterResetAll')"
                        :icon="'bi-x-circle'"
                        :interaction="triggerDeleteAll"
                    />
                </div>
            </div>
            <hr>
        </div>
        <AccordionItem
            v-if="isGeometrySelectorVisible()"
            id="geometry-filter-accordion"
            class="ps-3"
            :title="$t('common:modules.filter.geometryFilter.title')"
            font-size="font-size-big"
            @update-accordion-state="toggleGeometryFilter()"
        >
            <GeometryFilter
                :is-active="isGeometryFilterActive"
                :circle-sides="geometrySelectorOptions.circleSides"
                :default-buffer="geometrySelectorOptions.defaultBuffer"
                :geometries="geometrySelectorOptions.geometries"
                :additional-geometries="geometrySelectorOptions.additionalGeometries"
                :invert-geometry="geometrySelectorOptions.invertGeometry"
                :fill-color="geometrySelectorOptions.fillColor"
                :stroke-color="geometrySelectorOptions.strokeColor"
                :stroke-width="geometrySelectorOptions.strokeWidth"
                :filter-geometry="filterGeometry"
                :geometry-feature="geometryFeature"
                :init-selected-geometry-index="-10"
                @update-filter-geometry="updateFilterGeometry"
                @update-geometry-feature="updateGeometryFeature"
                @update-geometry-selector-options="updateGeometrySelectorOptions"
            />
        </AccordionItem>
        <hr
            v-if="isGeometrySelectorVisible()"
            class="dividing-line mb-4"
        >
        <div v-if="Array.isArray(layerGroups) && layerGroups.length">
            <div
                v-for="(layerGroup, key) in layerGroups"
                :key="key"
                class="layerGroupContainer"
            >
                <h5 class="mb-4">
                    {{ layerGroup.title ? layerGroup.title : key }}
                </h5>
                <FilterList
                    v-if="Array.isArray(preparedLayerGroups) && preparedLayerGroups.length"
                    class="layerSelector"
                    :filters="preparedLayerGroups[layerGroups.indexOf(layerGroup)].layers"
                    :collapse-buttons="layerGroup.collapseButtons"
                    :selected-layers="selectedAccordions"
                    :multi-layer-selector="multiLayerSelector"
                    :jump-to-id="jumpToId"
                    :rules-of-filters="rulesOfFilters"
                    @delete-all-rules="(filterId) => resetSnippetsAndRules(filterId)"
                    @reset-jump-to-id="resetJumpToId"
                    @selected-accordions="updateSelectedAccordions"
                    @set-layer-loaded="setLayerLoaded"
                >
                    <template
                        #default="slotProps"
                    >
                        <div
                            :class="['accordion-collapse', 'mt-3', layerGroup.collapseButtons ? 'collapse' : '', isLayerFilterSelected(slotProps.layer.filterId) && layerGroup.collapseButtons ? 'show' : '', layerGroup.collapseButtons ? 'pt-4 card card-body ps-2' : '']"
                            role="tabpanel"
                        >
                            <LayerFilterSnippet
                                v-if="isLayerFilterSelected(slotProps.layer.filterId) || layerLoaded[slotProps.layer.filterId]"
                                :key="slotProps.layer.filterId"
                                :ref="'filter-' + slotProps.layer.filterId"
                                :api="slotProps.layer.api"
                                :is-layer-filter-selected="isLayerFilterSelected"
                                :layer-config="slotProps.layer"
                                :map-handler="mapHandler"
                                :min-scale="minScale"
                                :open-multiple-accordeons="multiLayerSelector"
                                :live-zoom-to-features="liveZoomToFeatures"
                                :filter-hits="filtersHits[slotProps.layer.filterId]"
                                :filter-geometry="filterGeometry"
                                :close-gfi="closeGfi"
                                @update-rules="updateRules"
                                @delete-all-rules="deleteAllRules"
                                @update-filter-hits="updateFilterHits"
                                @register-map-move-listener="addToMapMoveListeners"
                            />
                        </div>
                    </template>
                </FilterList>
                <hr class="dividing-line mb-4">
            </div>
        </div>
        <FilterList
            v-if="(Array.isArray(layerConfigs.layers) && layerConfigs.layers.length) || (Array.isArray(layerConfigs.groups) && layerConfigs.groups.length)"
            class="layerSelector"
            :filters="filters"
            :collapse-buttons="collapseButtons"
            :selected-layers="selectedAccordions"
            :multi-layer-selector="multiLayerSelector"
            :jump-to-id="jumpToId"
            @delete-all-rules="(filterId) => resetSnippetsAndRules(filterId)"
            @reset-jump-to-id="resetJumpToId"
            @selected-accordions="updateSelectedAccordions"
            @set-layer-loaded="setLayerLoaded"
        >
            <template
                #default="slotProps"
            >
                <div
                    :class="['accordion-collapse', 'mt-3', collapseButtons ? 'collapse' : '', isLayerFilterSelected(slotProps.layer.filterId) ? 'show' : '']"
                    role="tabpanel"
                >
                    <LayerFilterSnippet
                        v-if="isLayerFilterSelected(slotProps.layer.filterId) || layerLoaded[slotProps.layer.filterId]"
                        :key="slotProps.layer"
                        :ref="'filter-' + slotProps.layer.filterId"
                        :api="slotProps.layer.api"
                        :is-layer-filter-selected="isLayerFilterSelected"
                        :layer-config="slotProps.layer"
                        :map-handler="mapHandler"
                        :min-scale="minScale"
                        :open-multiple-accordeons="multiLayerSelector"
                        :live-zoom-to-features="liveZoomToFeatures"
                        :filter-hits="filtersHits[slotProps.layer.filterId]"
                        :filter-geometry="filterGeometry"
                        :close-gfi="closeGfi"
                        @update-rules="updateRules"
                        @delete-all-rules="deleteAllRules"
                        @update-filter-hits="updateFilterHits"
                        @register-map-move-listener="addToMapMoveListeners"
                    />
                </div>
            </template>
        </FilterList>
        <div class="link-section">
            <div class="toast-container p-3">
                <div
                    ref="copyToast"
                    class="toast align-items-center"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                >
                    <div class="d-flex">
                        <div class="toast-body">
                            {{ $t("common:modules.shareView.linkCopied") }}
                        </div>
                        <button
                            type="button"
                            class="btn-close me-2 m-auto"
                            data-bs-dismiss="toast"
                            aria-label="Close"
                        />
                    </div>
                </div>
            </div>
            <a
                v-if="typeof linkText === 'string' && linkText !== ''"
                :href="currentURL"
                :title="$t('common:modules.filter.distributionMapLinkTextTitle')"
                class="link-text"
                @click.prevent="copyToClipboard"
            >
                <i
                    class="bi-link"
                    role="img"
                />
                {{ $t(linkText) }}
            </a>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .panel {
        position: relative;
    }
    .dividing-line {
        background-color: $dark_blue;
        height: 1px;
        border: none;
    }
    .link-section {
        position: relative;
        .toast-container {
            min-width: 320px;
            bottom: 10px;
            .toast {
                background: $primary;
            }
        }
        .link-text {
            i {
                font-size: 14px;
            }
        }
    }
    .result {
        box-shadow: 0 1px 5px $shadow;
        margin-bottom: 30px;
        padding: 15px 15px 15px 15px;
        border-radius: 10px;
        .title {
            min-height: 30px;
            span {
                font-family: "MasterPortalFont Bold";
                color: $secondary;
            }
        }
        .w-100 {
            margin-top: 10px;
        }
        .snippetTagsWrapper {
            display: flex;
            align-items: flex-end;
            flex-wrap: wrap;
            row-gap: 5px;
        }
        .show-more {
            span {
                margin-right: 5px;
            }
            &:hover {
                color: $secondary;
            }
        }
        .deleteAll {
            margin-top: 10px;
        }
    }
</style>
