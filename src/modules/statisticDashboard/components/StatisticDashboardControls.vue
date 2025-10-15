<script>
import DifferenceModal from "./StatisticDashboardDifference.vue";
import isObject from "@shared/js/utils/isObject";
import {mapGetters, mapMutations} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {Dropdown} from "bootstrap";
import Multiselect from "vue-multiselect";
import sortBy from "@shared/js/utils/sortBy";
import StatisticDashboardFilterRegions from "./StatisticDashboardFilterRegions.vue";
import StatisticSwitcher from "./StatisticDashboardSwitcher.vue";

export default {
    name: "StatisticDashboardControls",
    components: {
        DifferenceModal,
        IconButton,
        Multiselect,
        StatisticDashboardFilterRegions,
        StatisticSwitcher
    },
    props: {
        areCategoriesGrouped: {
            type: Boolean,
            required: false,
            default: false
        },
        descriptions: {
            type: Array,
            required: false,
            default: () => []
        },
        categories: {
            type: Array,
            required: false,
            default: () => []
        },
        regions: {
            type: Object,
            required: false,
            default: () => {
                return {};
            }
        },
        referenceData: {
            type: Object,
            required: true
        },
        enableButtons: {
            type: Boolean,
            default: false
        },
        selectedLevel: {
            type: Object,
            required: false,
            default: () => {
                return {};
            }
        },
        statistics: {
            type: [Array, Boolean],
            required: false,
            default: false
        },
        timeStepsFilter: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    emits: ["showChartTable", "setTableSubtitle", "changeCategory", "changeFilterSettings", "resetStatistics", "resetFilter", "showChartsInGrid"],
    data () {
        return {
            currentDescriptionIndex: 0,
            differenceModalContainer: null,
            referenceLabel: undefined,
            buttonGroupControls: [{
                name: "Tabelle",
                icon: "bi bi-table pe-2"
            },
            {
                name: "Diagramm",
                icon: "bi bi-bar-chart pe-2"
            }],
            switchValue: "",
            referenceTag: undefined,
            indexSelectedStatistics: 0,
            sortedCategories: [],
            sortedStatisticNames: [],
            sortedSelectedStatistics: [],
            sortedDates: [],
            openStates: {
                categoryfilter: false,
                statisticfilter: false,
                timefilter: false
            }
        };
    },
    computed: {
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters("Modules/StatisticDashboard", [
            "chartTableToggle",
            "chosenStatisticName",
            "flattenedRegions",
            "isFeatureLoaded",
            "selectedCategories",
            "selectedDates",
            "selectedDatesValues",
            "selectedStatistics",
            "selectedReferenceValueTag",
            "selectedReferenceData",
            "selectedRegions",
            "selectedRegionsValues",
            "selectedDatesValues",
            "selectedRegionsValues"
        ]),

        /**
         * Checks if there is at least one description
         * @returns {Boolean} True if there is one otherwise false.
         */
        hasDescription () {
            if (this.descriptions.length === 0) {
                return false;
            }
            return true;
        },
        /**
         * Gets the title of the current description.
         * @returns {void}
         */
        titleDescription () {
            return this.descriptions[this.currentDescriptionIndex].title;
        },
        /**
         * Gets the content of the current description.
         * @returns {void}
         */
        contentDescription () {
            return this.descriptions[this.currentDescriptionIndex].content;
        },
        precheckedViewSwitcher () {
            if (this.chartTableToggle === "table") {
                return this.buttonGroupControls[0].name;
            }
            return this.buttonGroupControls[1].name;
        },
        isStatisticsSelected () {
            return this.selectedDatesValues.length > 0 && this.selectedRegionsValues.length > 0 && Object.keys(this.selectedStatistics)?.length > 1;
        },
        /**
         * Gets the reference subtitle.
         * @returns {String} The subtitle of reference.
         */
        referenceSubTitle () {
            if (typeof this.selectedReferenceData === "undefined") {
                return "";
            }

            let value = "";

            if (this.selectedReferenceData?.type === "region") {
                value = this.selectedReferenceData.value;

                return i18next.t("common:modules.statisticDashboard.reference.region", {value});
            }

            value = this.selectedReferenceData?.value?.label;

            return i18next.t("common:modules.statisticDashboard.reference.year", {value});
        },
        showStatisticnameInChart () {
            return this.isStatisticsSelected && typeof this.chosenStatisticName === "string" && this.chosenStatisticName !== "" && this.chartTableToggle === "chart";
        },
        showStatisticnameInTable () {
            return this.isStatisticsSelected && this.chartTableToggle === "table";
        }
    },
    watch: {
        switchValue () {
            this.$emit("showChartTable");
        },
        /**
         * Resets the statistics if no category is selected and emits the names of the selected categories or an empty array.
         * @param {Object[]} newValue - The selected categories.
         * @returns {void}
         */
        selectedCategories: {
            handler (newValue) {
                if (newValue.length === 0) {
                    this.setSelectedStatistics({});
                }
                this.$emit("changeCategory", newValue);
                this.sortedCategories = this.getCategoriesSorted(this.categories, newValue);
            },
            deep: true
        },
        selectedReferenceData (val) {
            this.differenceModalContainer?.hide();
            this.handleReferenceTag(val);
            this.$emit("setTableSubtitle", this.referenceSubTitle);
        },
        selectedReferenceValueTag (val) {
            if (typeof this.referenceTag !== "undefined") {
                if (this.referenceTag.split(":").length - 1 === 1) {
                    this.referenceTag = this.referenceTag.split(":")[0];
                }
                if (typeof val === "number" && !isNaN(val)) {
                    this.referenceTag = this.referenceTag + ": " + val;
                }
            }
        },
        statistics: {
            handler (val) {
                this.sortedStatisticNames = this.getSortedStatisticNames(val, this.selectedStatistics);
                this.sortedSelectedStatistics = this.getSelectedStatisticNames(this.selectedStatistics);
            },
            deep: true
        },

        selectedStatistics: {
            handler (newValue) {
                this.emitFilterSettings(newValue, this.selectedRegionsValues, this.selectedDatesValues);
                this.sortedStatisticNames = this.getSortedStatisticNames(this.statistics, this.selectedStatistics);
                this.sortedSelectedStatistics = this.getSelectedStatisticNames(this.selectedStatistics);
            },
            deep: true
        },
        selectedDates: {
            handler () {
                this.emitFilterSettings(this.selectedStatistics, this.selectedRegionsValues, this.selectedDatesValues);
                this.sortedDates = this.getSortedDates(this.timeStepsFilter, this.selectedDates);
            },
            deep: true
        },
        selectedRegions: {
            handler () {
                this.emitFilterSettings(this.selectedStatistics, this.selectedRegionsValues, this.selectedDatesValues);
            },
            deep: true
        }
    },
    mounted () {
        const container = document.getElementById("difference-modal-container");

        this.emitFilterSettings(this.selectedStatistics, this.selectedRegionsValues, this.selectedDatesValues);
        this.sortedCategories = this.getCategoriesSorted(this.categories, this.selectedCategories);
        this.sortedStatisticNames = this.getSortedStatisticNames(this.statistics, this.selectedStatistics);
        this.sortedSelectedStatistics = this.getSelectedStatisticNames(this.selectedStatistics);
        this.sortedDates = this.getSortedDates(this.timeStepsFilter, this.selectedDates);

        if (container) {
            this.differenceModalContainer = new Dropdown(container);
        }

        if (typeof this.selectedReferenceValueTag !== "undefined") {
            this.referenceTag = this.selectedReferenceValueTag;
        }
        else if (this.selectedReferenceData) {
            this.handleReferenceTag(this.selectedReferenceData);
        }
    },
    beforeUnmount () {
        this.setSelectedReferenceValueTag(this.referenceTag);
    },
    methods: {
        ...mapMutations("Modules/StatisticDashboard", [
            "setChartTableToggle",
            "setChosenStatisticName",
            "setData",
            "setIsFeatureLoaded",
            "setSelectedCategories",
            "setSelectedDates",
            "setSelectedReferenceData",
            "setSelectedReferenceValueTag",
            "setSelectedRegions",
            "setSelectedStatistics"
        ]),
        /**
         * Checks if all filter settings are selected.
         * @param {Object[]} statistics - The selected statistics.
         * @param {String[]} regions - The names of the selected regions.
         * @param {Object[]} dates - The selected dates.
         * @return {Boolean} true, if all filter settings selected.
         */
        allFilterSettingsSelected (statistics, regions, dates) {
            return isObject(statistics) && Object.keys(statistics).length > 0 && regions.length > 0 && dates.length > 0;
        },
        /**
         * Adds the given statistics.
         * @param {Object[]} statistics - The statistics to add.
         * @returns {void}
         */
        addStatisticsToSelect (statistics) {
            this.setSelectedStatistics({});
            [...statistics].forEach((statistic, selectIdx) => {
                statistic.selectedOrder = selectIdx;
                this.selectedStatistics[statistic?.key] = statistic;
            });
        },
        /**
         * Emits the filter settings if all are selected.
         * @param {Object[]} statistics - The selected statistics.
         * @param {String[]} regions - The names of the selected regions.
         * @param {Object[]} dates - The selected dates.
         * @return {void}
         */
        emitFilterSettings (statistics, regions, dates) {
            if (this.allFilterSettingsSelected(statistics, regions, dates)) {
                this.setIsFeatureLoaded(false);
                this.$emit("changeFilterSettings", regions, dates, this.selectedReferenceData);
            }
            else {
                this.$emit("resetStatistics");
            }
        },
        /**
         * Handles the referenceTag value for given property.
         * @param {String|Object} val The value to handle.
         * @returns {void}
         */
        handleReferenceTag (val) {
            if (typeof val?.value === "string") {
                this.referenceTag = val.value + ": ";
            }
            if (isObject(val?.value) && typeof val.value.label === "string") {
                this.referenceTag = val.value.label;
            }
            else if (typeof val === "undefined") {
                this.referenceTag = undefined;
            }
        },
        /**
         * Sets the description index one higher.
         * If the index reaches the end of the descriptions,it is set back to the beginning.
         * @returns {void}
         */
        nextDescription () {
            if (this.currentDescriptionIndex < this.descriptions.length - 1) {
                this.currentDescriptionIndex++;
            }
            else {
                this.currentDescriptionIndex = 0;
            }
        },
        /**
         * Sets the description index one lower.
         * If the index reaches the beginning of the descriptions, it is set to the end again.
         * @returns {void}
         */
        prevDescription () {
            if (this.currentDescriptionIndex > 0) {
                this.currentDescriptionIndex--;
            }
            else {
                this.currentDescriptionIndex = this.descriptions.length - 1;
            }
        },
        /**
         * Sets chart or table view
         * @param {String} value - The name of clicked button.
         * @returns {void}
         */
        handleView (value) {
            this.switchValue = value;
        },

        /**
         * Gets the categories sorted.
         * @param {Object[]} categories The categories.
         * @param {Object[]} selectedCategories The selected categories.
         * @returns {Object[]} a sorted list of categories with selected ones first.
         */
        getCategoriesSorted (categories, selectedCategories) {
            if (!Array.isArray(categories) || !Array.isArray(selectedCategories)) {
                return [];
            }
            const nonSelectedCategories = [{name: i18next.t("common:modules.statisticDashboard.button.all")}, ...categories].filter(category => !selectedCategories.some(selectedCategory => selectedCategory.name === category.name)),
                result = [...selectedCategories, ...nonSelectedCategories];

            return result;
        },
        /**
         * Gets the selected statistic names by given selected statistics object.
         * @param {Object} selectedStatistics The selected statistic object.
         * @returns {Object[]} the selected statistics as array of objects.
         */
        getSelectedStatisticNames (selectedStatistics) {
            if (!isObject(selectedStatistics)) {
                return [];
            }
            return Object.keys(selectedStatistics).map(key => {
                return {
                    key: key,
                    name: selectedStatistics[key]?.name,
                    category: selectedStatistics[key]?.category
                };
            });
        },
        /**
         * Gets the dates sorted with the selected ones first.
         * @param {Object[]} timeStepsFilter The timesteps filter array.
         * @param {Object[]} selectedDates The selected dates.
         * @returns {Object[]} the sorted array.
         */
        getSortedDates (timeStepsFilter, selectedDates) {
            if (!timeStepsFilter.length) {
                return [];
            }
            if (!Array.isArray(selectedDates) || !selectedDates.length) {
                return timeStepsFilter;
            }
            const notSelectedDates = timeStepsFilter.filter(timeStep => !selectedDates.some(selectedStep => selectedStep.label === timeStep.label)),
                sortedDates = [...selectedDates, ...notSelectedDates];

            return sortedDates;
        },
        /**
         * Gets the statistic names sorted.
         * @param {Object[]} statistics All statistics.
         * @param {Object} selectedStatisticsObject The selected statistics object.
         * @returns {Object[]} a list of all statistics sorted by selected ones first.
         */
        getSortedStatisticNames (statistics, selectedStatisticsObject) {
            if (!Array.isArray(statistics) || !isObject(selectedStatisticsObject)) {
                return [];
            }
            const allStatistics = [],
                selectedStatistics = [],
                selectedStatisticsKeys = Object.keys(selectedStatisticsObject).sort((a, b) => selectedStatisticsObject[a].selectedOrder - selectedStatisticsObject[b].selectedOrder);
            let notSelectedStatistics = [],
                result = [];

            statistics.forEach(stat => {
                Object.keys(stat).forEach(key => {
                    allStatistics.push({
                        key: key,
                        name: stat[key]?.name,
                        category: stat[key]?.category
                    });
                });
            });

            notSelectedStatistics = allStatistics.filter(statistic => !Object.prototype.hasOwnProperty.call(selectedStatisticsObject, statistic.key));
            selectedStatisticsKeys.forEach(key => selectedStatistics.push(allStatistics.find(stat => stat.key === key)));
            result = sortBy([...selectedStatistics, ...notSelectedStatistics], "name");

            return result;
        },
        /**
         * Toggles the open state of a multiselect component referenced by `refName`.
         * If the dropdown is open, it will be closed (deactivated), otherwise it will be opened (activated).
         * After opening, the search input inside the multiselect is focused.
         *
         * @param {string} refName - The reference name of the multiselect component.
         * @returns {void}
         */
        toggle (refName) {
            const multiselectRef = this.$refs[refName];

            if (!multiselectRef) {
                return;
            }

            if (this.openStates[refName]) {
                multiselectRef.deactivate();
            }
            else {
                multiselectRef.activate();
                this.$nextTick(() => {
                    const input = multiselectRef.$refs.search;

                    if (input) {
                        input.focus();
                    }
                });
            }
        },
        /**
         * Sets the open state of the multiselect referenced by `refName` to true.
         * Called when the multiselect is opened.
         *
         * @param {string} refName - The reference name of the multiselect component.
         * @returns {void}
         */
        onOpen (refName) {
            this.openStates[refName] = true;
        },
        /**
         * Sets the open state of the multiselect referenced by `refName` to false.
         * Called when the multiselect is closed.
         *
         * @param {string} refName - The reference name of the multiselect component.
         * @returns {void}
         */
        onClose (refName) {
            this.openStates[refName] = false;
        },
        /**
         * Removes the reference data
         * @returns {void}
         */
        removeReference () {
            this.setSelectedReferenceData(undefined);
        },
        /**
         * Removes the statistics if their category is deselected.
         * If the category "alle" is still selected, no statistics will be removed.
         * @param {Object} category - The deselected category.
         * @returns {void}
         */
        removeSelectedStatsByCategory (category) {
            const selectedStatisticsCopy = {...this.selectedStatistics},
                isCategoryAllSelected = this.selectedCategories.filter(selectedCategory => selectedCategory.name === i18next.t("common:modules.statisticDashboard.button.all")).length,
                statsToDelete = this.sortedSelectedStatistics.filter(statistic => statistic.category === category.name);

            if (category.name !== i18next.t("common:modules.statisticDashboard.button.all") && isCategoryAllSelected) {
                return;
            }

            statsToDelete.forEach(statistic => {
                delete selectedStatisticsCopy[statistic.key];
            });
            this.setSelectedStatistics(selectedStatisticsCopy);
        },
        /**
         * Sets indexSelectedStatistics after clicking previous arrow.
         * @param {Number} index - The current indexSelectedStatistics.
         * @param {Object} selectedStatistics - The selected statistics.
         * @returns {void}
         */
        prevStatistic (index, selectedStatistics) {
            if (!isObject(selectedStatistics) || !Object.keys(selectedStatistics).length) {
                return;
            }

            this.indexSelectedStatistics = index - 1 >= 0 ? index - 1 : Object.keys(selectedStatistics).length + index - 1;
            this.setChosenStatisticName(selectedStatistics[Object.keys(selectedStatistics)[this.indexSelectedStatistics]]?.name);
        },
        /**
         * Sets indexSelectedStatistics after clicking next arrow.
         * @param {Number} index - The current indexSelectedStatistics.
         * @param {Object} selectedStatistics - The selected statistics.
         * @returns {void}
         */
        nextStatistic (index, selectedStatistics) {
            if (!isObject(selectedStatistics) || !Object.keys(selectedStatistics).length) {
                return;
            }

            this.indexSelectedStatistics = index + 1 < Object.keys(selectedStatistics).length ? index + 1 : index - Object.keys(selectedStatistics).length + 1;
            this.setChosenStatisticName(selectedStatistics[Object.keys(selectedStatistics)[this.indexSelectedStatistics]]?.name);
        },
        /**
         * Toggles the dropdown if button is clicked.
         * @param {Object} event the click event.
         * @returns {void}
         */
        toggleDropdown (element) {
            const button = element.target.closest(".difference-button").firstChild,
                dropdown = new Dropdown(button);

            dropdown.toggle();
        }
    }
};
</script>

<template>
    <div class="d-flex flex-row flex-wrap align-items-center justify-content-between mb-3 dashboard-controls">
        <!-- Descriptions -->
        <div
            v-if="hasDescription"
            class="flex-grow-1 pb-1 description"
        >
            <div class="hstack gap-1">
                <button
                    class="p-2 fs-5 lh-1 border-0 bg-transparent description-icons"
                    @click="prevDescription"
                    @keydown="prevDescription"
                >
                    <i class="bi bi-chevron-left" />
                </button>
                <p class="pe-2 fs-6 description-content">
                    {{ titleDescription }}<br>{{ contentDescription }}
                </p>
                <button
                    class="p-2 fs-5 lh-1 border-0 bg-transparent description-icons"
                    @click="nextDescription"
                    @keydown="nextDescription"
                >
                    <i class="bi bi-chevron-right" />
                </button>
            </div>
        </div>
        <div
            v-else
            class="flex-grow-1 pb-1 descriptions-placeholder"
        >
            <div
                class="gap-1 empty"
            />
        </div>
        <!-- Controls -->
        <div class="container">
            <h5 class="mb-0">
                {{ $t("common:modules.statisticDashboard.headings.filter") }}
            </h5>
            <div class="btn-toolbar d-flex align-items-center">
                <div
                    class="difference-button btn-group pe-2"
                >
                    <button
                        class="btn btn-primary drop dropdown-toggle btn-sm rounded px-3 py-2"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        data-bs-auto-close="outside"
                    >
                        <i class="bi bi-bar-chart me-1" />
                        {{ $t("common:modules.statisticDashboard.button.statistics") }}
                        <span
                            v-if="getSelectedStatisticNames(selectedStatistics).length !== 0"
                            class="mx-1 filter badge text-bg-secondary"
                        >
                            {{ getSelectedStatisticNames(selectedStatistics).length }}
                        </span>
                        <i class="toolbar-button-icon bi bi-caret-down-fill" />
                    </button>
                    <div
                        class="dropdown-menu p-4"
                    >
                        <div class="menu col-md-12">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="row justify-content-between">
                                        <h5 class="col col-md-11">
                                            {{ $t("common:modules.statisticDashboard.headings.addStatisticalData") }}
                                        </h5>
                                        <button
                                            type="button"
                                            class="col col-md-1 btn-close ms-2"
                                            aria-label="Close"
                                            @click="toggleDropdown($event)"
                                        />
                                    </div>
                                    <div
                                        class="col-sm-12"
                                    >
                                        <label
                                            class="col-form-label-sm"
                                            for="categoryfilter"
                                        >
                                            {{ $t("common:modules.statisticDashboard.label.category") }}</label>
                                        <div
                                            role="button"
                                            tabindex="0"
                                            @click.stop="toggle('categoryfilterRef')"
                                            @mousedown.prevent
                                            @keydown.enter.stop.prevent="toggle('categoryfilterRef')"
                                            @keydown.space.stop.prevent="toggle('categoryfilterRef')"
                                        >
                                            <Multiselect
                                                id="categoryfilter"
                                                ref="categoryfilterRef"
                                                :model-value="selectedCategories"
                                                :options="sortedCategories"
                                                :searchable="true"
                                                :close-on-select="false"
                                                :clear-on-select="false"
                                                :show-labels="false"
                                                :allow-empty="true"
                                                :multiple="true"
                                                :group-values="areCategoriesGrouped ? 'categories' : ''"
                                                :group-label="areCategoriesGrouped ? 'name' : ''"
                                                :group-select="false"
                                                :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
                                                track-by="name"
                                                label="name"
                                                @open="onOpen('categoryfilterRef')"
                                                @close="onClose('categoryfilterRef')"
                                                @update:model-value="setSelectedCategories"
                                                @remove="removeSelectedStatsByCategory"
                                            >
                                                <template #clear>
                                                    <div class="multiselect__clear">
                                                        <i class="bi bi-search" />
                                                    </div>
                                                </template>
                                                <template #tag="{ option, remove }">
                                                    <button
                                                        class="multiselect__tag"
                                                        :class="option"
                                                        @click="remove(option)"
                                                        @keypress="remove(option)"
                                                    >
                                                        {{ option.name }}
                                                        <i class="bi bi-x" />
                                                    </button>
                                                </template>
                                                <template #caret>
                                                    <div
                                                        class="multiselect__select"
                                                    />
                                                </template>
                                            </Multiselect>
                                        </div>
                                        <div class="col-sm-12">
                                            <label
                                                class="col-form-label-sm"
                                                for="dropdownButton"
                                            >
                                                {{ $t("common:modules.statisticDashboard.label.statistics") }}
                                            </label>
                                            <div
                                                role="button"
                                                tabindex="0"
                                                @click.stop="toggle('statisticfilterRef')"
                                                @mousedown.prevent
                                                @keydown.enter.stop.prevent="toggle('statisticfilterRef')"
                                                @keydown.space.stop.prevent="toggle('statisticfilterRef')"
                                            >
                                                <Multiselect
                                                    id="statisticfilter"
                                                    ref="statisticfilterRef"
                                                    :model-value="sortedSelectedStatistics"
                                                    :options="sortedStatisticNames"
                                                    :searchable="true"
                                                    :close-on-select="false"
                                                    :clear-on-select="false"
                                                    :show-labels="false"
                                                    :allow-empty="true"
                                                    :multiple="true"
                                                    :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
                                                    :limit="3"
                                                    :limit-text="count => count + ' ' + $t('common:modules.statisticDashboard.label.more')"
                                                    track-by="key"
                                                    label="name"
                                                    @open="onOpen('statisticfilterRef')"
                                                    @close="onClose('statisticfilterRef')"
                                                    @update:model-value="addStatisticsToSelect"
                                                >
                                                    <template #clear>
                                                        <div class="multiselect__clear">
                                                            <i class="bi bi-search" />
                                                        </div>
                                                    </template>
                                                    <template #tag="{ option, remove }">
                                                        <button
                                                            class="multiselect__tag"
                                                            :class="option"
                                                            @click="remove(option)"
                                                            @keypress="remove(option)"
                                                        >
                                                            {{ option.name }}
                                                            <i class="bi bi-x" />
                                                        </button>
                                                    </template>
                                                    <template #caret>
                                                        <div
                                                            class="multiselect__select"
                                                        />
                                                    </template>
                                                </Multiselect>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="difference-button btn-group pe-2">
                    <button
                        class="btn btn-primary drop dropdown-toggle btn-sm rounded px-3 py-2"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        data-bs-auto-close="outside"
                    >
                        <i class="bi bi-geo-fill me-1" />
                        {{ $t("common:modules.statisticDashboard.button.geographical") }}
                        <span
                            v-if="selectedRegions.length !== 0"
                            class="mx-1 filter badge text-bg-secondary"
                        >
                            {{ selectedRegions.length }}
                        </span>
                        <i class="toolbar-button-icon bi bi-caret-down-fill" />
                    </button>
                    <div class="dropdown-menu p-4">
                        <div class="col-md-12">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="row justify-content-between">
                                        <h5 class="col col-md-11">
                                            {{ $t("common:modules.statisticDashboard.headings.addArea") }}
                                        </h5>
                                        <button
                                            type="button"
                                            class="col col-md-1 btn-close ms-2"
                                            aria-label="Close"
                                            @click="toggleDropdown($event)"
                                        />
                                    </div>
                                    <StatisticDashboardFilterRegions
                                        :regions="flattenedRegions"
                                        :selected-level="selectedLevel"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="difference-button btn-group pe-2">
                    <button
                        class="btn btn-primary drop dropdown-toggle btn-sm rounded px-3 py-2"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        data-bs-auto-close="outside"
                    >
                        <i class="bi bi-calendar me-1" />
                        {{ $t("common:modules.statisticDashboard.button.timeBased") }}
                        <span
                            v-if="selectedDates.length !== 0"
                            class="mx-1 badge text-bg-secondary"
                        >
                            {{ selectedDates.length }}
                        </span>
                        <i class="toolbar-button-icon bi bi-caret-down-fill" />
                    </button>
                    <div class="dropdown-menu p-4">
                        <div class="col-md-12">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="row justify-content-between">
                                        <h5 class="col col-md-11">
                                            {{ $t("common:modules.statisticDashboard.headings.addTime") }}
                                        </h5>
                                        <button
                                            type="button"
                                            class="col col-md-1 btn-close ms-2"
                                            aria-label="Close"
                                            @click="toggleDropdown($event)"
                                        />
                                    </div>
                                    <div
                                        class="col-sm-12"
                                    >
                                        <label
                                            class="col-form-label-sm"
                                            for="timefilter"
                                        >
                                            {{ $t("common:modules.statisticDashboard.label.year") }}</label>
                                        <div
                                            role="button"
                                            tabindex="0"
                                            @click.stop="toggle('timefilterRef')"
                                            @mousedown.prevent
                                            @keydown.enter.stop.prevent="toggle('timefilterRef')"
                                            @keydown.space.stop.prevent="toggle('timefilterRef')"
                                        >
                                            <Multiselect
                                                id="timefilter"
                                                ref="timefilterRef"
                                                :model-value="selectedDates"
                                                :multiple="true"
                                                :options="sortedDates"
                                                :searchable="true"
                                                :close-on-select="false"
                                                :clear-on-select="false"
                                                :show-labels="false"
                                                :limit="3"
                                                :limit-text="count => count + ' ' + $t('common:modules.statisticDashboard.label.more')"
                                                :allow-empty="true"
                                                :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
                                                label="label"
                                                track-by="label"
                                                @open="onOpen('timefilterRef')"
                                                @close="onClose('timefilterRef')"
                                                @update:model-value="setSelectedDates"
                                            >
                                                <template #clear>
                                                    <div class="multiselect__clear">
                                                        <i class="bi bi-search" />
                                                    </div>
                                                </template>
                                                <template #tag="{ option, remove }">
                                                    <button
                                                        class="multiselect__tag"
                                                        :class="option"
                                                        @click="remove(option)"
                                                        @keypress="remove(option)"
                                                    >
                                                        {{ option.label }}
                                                        <i class="bi bi-x" />
                                                    </button>
                                                </template>
                                                <template #caret>
                                                    <div
                                                        class="multiselect__select"
                                                    />
                                                </template>
                                            </Multiselect>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <IconButton
                    :class-array="['delete-button', 'btn-secondary', 'btn-sm']"
                    :aria="$t('common:modules.statisticDashboard.button.reset')"
                    icon="bi bi-trash"
                    :label="$t('common:modules.statisticDashboard.button.reset')"
                    :interaction="() => $emit('resetFilter')"
                />
                <div class="vertical-divider my-0 ms-3 me-4" />
                <div
                    class="col col-md-auto mt-0 p-0 pe-2"
                >
                    <div
                        class="difference-button mt-0 float-right text-right"
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="enableButtons ? $t('common:modules.statisticDashboard.reference.description') : ''"
                    >
                        <button
                            :aria-label="$t('common:modules.statisticDashboard.button.difference')"
                            icon="bi bi-intersect"
                            class="btn btn-secondary btn-sm px-3 py-2 dropdown-toggle text-right rounded"
                            :class="[typeof referenceTag === 'string' ? 'activated' : '']"
                            :disabled="!enableButtons"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            data-bs-auto-close="outside"
                        >
                            <i
                                class="bi bi-intersect pe-2"
                            />
                            {{ $t('common:modules.statisticDashboard.button.difference') }}
                            <span
                                v-if="typeof referenceTag === 'string'"
                                class="mx-1 badge text-bg-primary"
                            >
                                1
                            </span>
                            <i class="toolbar-button-icon bi bi-caret-down-fill" />
                        </button>
                        <div
                            id="difference-modal-container"
                            class="dropdown-menu p-4"
                        >
                            <DifferenceModal
                                class="difference-modal"
                                :reference-data="referenceData"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <hr class="my-2">
        </div>
        <StatisticSwitcher
            :buttons="buttonGroupControls"
            :pre-checked-value="precheckedViewSwitcher"
            class="col col-md btn-table-diagram mt-2 mb-2 p-0"
            group="dataViews"
            @show-view="handleView"
        />
        <div
            v-if="showStatisticnameInChart"
            class="back-overview"
            role="button"
            tabindex="0"
            @click="$emit('showChartsInGrid', true)"
            @keydown="$emit('showChartsInGrid', true)"
        >
            <button
                class="p-2 fs-5 lh-1 border-0 bg-transparent"
            >
                <i class="bi bi-chevron-left" />
            </button>
            <span>
                {{ $t('common:modules.statisticDashboard.backToOverview') }}
            </span>
        </div>
        <div
            v-if="showStatisticnameInTable"
            class="container static-name mb-3"
        >
            <div class="row justify-content-center align-items-center mt-5">
                <IconButton
                    class="slider-control col col-1 btn-light bg-transparent"
                    :aria="$t('common:modules.statisticDashboard.button.arrowLeft')"
                    icon="bi bi-chevron-left"
                    :interaction="() => prevStatistic(indexSelectedStatistics, selectedStatistics)"
                />
                <div class="statistic-name col col-auto">
                    <span>{{ chosenStatisticName }}</span>
                    <span
                        v-if="referenceSubTitle !== ''"
                        class="text-center"
                    >
                        <span> - {{ $t('common:modules.statisticDashboard.reference.difference') }}</span>
                        <br>
                        <span class="statistic-name-subtitle col col-auto">{{ referenceSubTitle }}</span>
                    </span>
                </div>
                <IconButton
                    class="slider-control col col-1 btn-light bg-transparent"
                    :aria="$t('common:modules.statisticDashboard.button.arrowRight')"
                    icon="bi bi-chevron-right"
                    :interaction="() => nextStatistic(indexSelectedStatistics, selectedStatistics)"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.dashboard-controls {
    .description {
        margin-top: 25px;
        .description-content {
            width: 350px;
        }
        .description-icons {
            opacity: 0.5;
        }
        .description-icons:hover {
            opacity: 1;
        }
    }
    .descriptions-placeholder {
         margin-top: 10px;
        .empty {
            width: 350px;
        }
    }
}

.btn-table-diagram {
    margin-top: 25px;
}

.difference-button {
    display: inline-block;
}

.toolbar-button-icon {
    font-size: $font_size_sm;
}

.vertical-divider {
    border-left: 1px solid $dark_grey;
    height: 35px;
}

.dropdown-menu {
    width: calc(60 * 47vw / 100);
    --bs-dropdown-zindex: 1100;
}

.btn-light {
    background-color: $light_grey;
    color: $light_grey_inactive_contrast;
    border-color: $light_grey;
}
.btn-light:hover {
    background-color: $primary;
    color: $black;
    border-color: $primary;
}

.btn {
    &.activated {
        background-color: $dark_blue;
        &:hover {
            background-color: $primary;
            color: $black;
            .badge {
            background-color: $secondary;
            color: $white;
            }
        }
    }
}

.drop .dropdown-toggle[aria-expanded="true"] {
    background-color: $dark_blue;
    color: $white;
}

.badge {
    background-color: $primary;
    color: $black;
    --bs-badge-padding-y: 0.2rem;
    --bs-badge-padding-x: 0.7rem;
 }

.btn-wrapper {
    width: 90px;
 }

.statistic-name {
    font-family: $font_family_accent;
    font-size: $font_size_big;
}

.statistic-name-subtitle {
    font-family: $font_family_accent;
    font-size: $font_size_sm;
    display: block;
}
.back-overview {
    margin-top: 20px;
    font-size: 12px;
    cursor: pointer;
}
</style>
<style lang="scss">
@import "~variables";

.static-dashboard .multiselect, .static-dashboard .multiselect__tags {
    font-family: inherit;
    font-size: 11px;
}

.static-dashboard .multiselect__strong{
    font-family: "MasterPortalFont Bold";
}

.static-dashboard .multiselect__tags {
    padding-left: 25px;
}

.static-dashboard .multiselect__tag {
    background: $light_blue;
    padding: 4px 10px 4px 10px;
    border-radius: 50px;
    border: none;
}

.static-dashboard .difference-modal .multiselect__tag {
    padding: 4px 26px 4px 10px;
    border-radius: 10px;
}
.static-dashboard .multiselect__tag:hover {
    background: $dark_blue;
    color: $white;
}
.static-dashboard .multiselect .multiselect__tag i::before {
    vertical-align: middle;
}

.static-dashboard .multiselect__clear {
    position: absolute;
    font-size: 12px;
    top: 12px;
    left: 9px;
}

.static-dashboard .multiselect__option--selected.multiselect__option--highlight,
.static-dashboard .multiselect__option--selected.multiselect__option--highlight:after,
.static-dashboard .multiselect__option:after,
.static-dashboard .multiselect__option--selected,
.static-dashboard .multiselect__option--selected:after,
.static-dashboard .multiselect__tag {
  color: $black;
  font-weight: normal;
}

.static-dashboard .multiselect__option--highlight,
.static-dashboard .multiselect__option--highlight:after {
    background: $secondary;
}

.static-dashboard .multiselect__select {
    height: 30px;
}
</style>
