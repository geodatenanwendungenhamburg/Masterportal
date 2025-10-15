<script>
import {mapGetters, mapMutations} from "vuex";
import SearchBarSuggestionListItem from "./SearchBarSuggestionListItem.vue";

/**
 * Searchbar result list to show the categorized overview or single search results.
 * @module modules/searchBar/components/SearchBarSuggestionList
 * @vue-props {Object} limitedSortedSearchResults - Results the limited and sorted search results.
 * @vue-data {Array} currentShowAllList - Array of the single search results to show from the 'show all' button.
 */
export default {
    name: "SearchBarSuggestionList",
    components: {
        SearchBarSuggestionListItem
    },
    props: {
        limitedSortedSearchResults: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            currentShowAllList: []
        };
    },
    computed: {
        ...mapGetters("Modules/SearchBar", [
            "minCharacters",
            "showSearchResultsInTree",
            "searchInput",
            "searchResults",
            "searchResultsActive",
            "showAllResults",
            "currentSide",
            "showAllResultsSearchInterfaceInstances"
        ]),
        ...mapGetters("Menu", [
            "menuBySide"
        ]),
        ...mapGetters([
            "portalConfig"
        ])
    },
    methods: {
        ...mapMutations("Modules/SearchBar", [
            "setCurrentAvailableCategories",
            "setPlaceholder",
            "setShowAllResults",
            "setShowAllResultsSearchInterfaceInstances"
        ]),
        ...mapMutations("Menu", [
            "setNavigationCurrentComponentBySide",
            "setNavigationHistoryBySide",
            "setCurrentComponent",
            "setCurrentComponentBySide"
        ]),
        /**
         * Prepares the all results list of one category and adapts the navigation history
         * @param {String} categoryItem the category of the results
         * @returns {void}
         */
        prepareShowAllResults (categoryItem) {
            const side = this.currentSide,
                interfaceToAdd = {id: this.limitedSortedSearchResults.results.categoryProvider[categoryItem], searchCategory: categoryItem},
                exists = this.showAllResultsSearchInterfaceInstances.find(searchInterface => searchInterface.id === interfaceToAdd.id);

            if (!exists) {
                const currentInterfaces = [...this.showAllResultsSearchInterfaceInstances];

                currentInterfaces.push(interfaceToAdd);
                this.setShowAllResultsSearchInterfaceInstances(currentInterfaces);
            }
            if (this.menuBySide(side)) {
                const name = i18next.t("common:modules.searchBar.searchResults") + " - " + categoryItem;

                this.setNavigationCurrentComponentBySide({side: side, newComponent: {props: {name}, type: "searchBar"}});
                this.setPlaceholder(i18next.t("common:modules.searchBar.placeholder.searchFor") + " " + categoryItem);
                this.setCurrentComponentBySide({side: side, type: "searchBar"});
                this.setNavigationHistoryBySide({side: side, newHistory: [{type: "root", props: []}, {type: "searchBar", props: {name}}, {type: "searchBar", props: {name: "modules.searchBar.searchResultList"}}]});
            }
            this.setCurrentAvailableCategories(categoryItem);
            this.currentShowAllList = this.limitedSortedSearchResults.currentShowAllList.filter(value => {
                return value.category === categoryItem;
            });

            this.setShowAllResults(true);
        },
        /**
         * Returns the first search result object belonging to the given category.
         * Useful for accessing category-specific properties such as `imagePath` or `icon`.
         *
         * @param {String} category - The category name to search for.
         * @returns {Object|undefined} The first search result matching the category, or `undefined` if none is found.
         */
        getFirstByCategory (category) {
            const results = this.limitedSortedSearchResults.results;

            return Object.values(results).find(
                (item) => item?.category === category
            );
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="searchInput?.length >= minCharacters && searchResultsActive && searchResults?.length > 0 && !showSearchResultsInTree"
        class="suggestions-container"
    >
        <div
            v-for="categoryItem in limitedSortedSearchResults.results.availableCategories"
            id="search-bar-suggestion-list"
            :key="categoryItem"
        >
            <h5
                id="search-bar-suggestion-heading"
                class="bold mb-4 mt-4"
                :title="$t('common:modules.searchBar.searchResultsFrom') + limitedSortedSearchResults.results.categoryProvider[categoryItem] + '-' + $t('common:modules.searchBar.search')"
            >
                <img
                    v-if="getFirstByCategory(categoryItem)?.imagePath"
                    alt="search result image"
                    class="search-bar-suggestion-image"
                    :src="getFirstByCategory(categoryItem).imagePath"
                >
                <i
                    v-if="!getFirstByCategory(categoryItem)?.imagePath"
                    :class="limitedSortedSearchResults.results[categoryItem + 'Icon']"
                />

                {{ categoryItem +": " + limitedSortedSearchResults.results[categoryItem+"Count"] + "    " + $t("common:modules.searchBar.searchResults") }}
            </h5>
            <div
                v-for="(item, index) in showAllResults===false ? limitedSortedSearchResults.results : limitedSortedSearchResults.currentShowAllList"
                :key="item.id + '-' + index"
            >
                <p
                    v-if="item.category===categoryItem"
                    :id="'suggestion_searchInputLi' + index"
                    class="mb-0"
                >
                    <SearchBarSuggestionListItem
                        :search-suggestion="item"
                    />
                </p>
            </div>
            <div class="showAllSection">
                <button
                    type="button"
                    class="btn btn-light d-flex text-left"
                    :title="$t('common:modules.searchBar.showAllResults')"
                    @click="prepareShowAllResults(categoryItem)"
                >
                    {{ $t("common:modules.searchBar.showAll") }}
                    <span class="bi-chevron-right" />
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
button {
    span {
        margin-top: .1rem;
        margin-left: .25rem;
    }
}
.suggestions-container {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 70vH;
}
.showAllSection {
    display: flex;
    justify-content: right;
    align-items: right;
}
.search-bar-suggestion-image{
    float: left;
    max-width: 21px;
    max-height: 21px;
    width: auto;
    height: auto;
    object-fit: contain;
    margin-right: 0.5rem;
}
</style>
