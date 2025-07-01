<script>
import {mapActions} from "vuex";
import scaleOutOfRangeMixin from "../js/scaleOutOfRangeMixin.js";

/**
 * Searchbar - single item of a search suggestion.
 * @module modules/searchBar/components/SearchBarSuggestionListItem
 * @vue-props {Object} searchSuggestion - A single search suggestion.
 */
export default {
    name: "SearchBarSuggestionListItem",
    mixins: [scaleOutOfRangeMixin("searchSuggestion")],
    props: {
        searchSuggestion: {
            type: Object,
            required: true
        }
    },
    methods: {
        ...mapActions("Modules/SearchBar", [
            "activateActions",
            "removeHighlight3DTile"
        ]),
        handleClick () {
            this.removeHighlight3DTile();
            this.activateActions({searchResult: this.searchSuggestion, actionType: "onClick"});
        }
    }
};
</script>

<template lang="html">
    <div id="search-bar-suggestion-list-item">
        <div class="d-flex flex-row bd-highlight bold">
            <span
                class="layer-checkbox-tooltip"
                :data-bs-toggle="scaleIsOutOfRange ? 'tooltip' : null"
                data-bs-placement="bottom"
                data-bs-custom-class="custom-tooltip"
                :title="scaleIsOutOfRange ? tooltipText : ''"
            >
                <button
                    type="button"
                    class="btn btn-light d-flex"
                    :disabled="scaleIsOutOfRange"
                    :title="searchSuggestion.toolTip ? $t(searchSuggestion.toolTip) : $t(searchSuggestion.name)"
                    :aria-label="searchSuggestion.toolTip ? $t(searchSuggestion.toolTip) : $t(searchSuggestion.name)"
                    @click="handleClick"
                    @keydown.enter="activateActions({searchResult: searchSuggestion, actionType: 'onClick'})"
                    @mouseover="activateActions({searchResult: searchSuggestion, actionType: 'onHover'})"
                    @focus="activateActions({searchResult: searchSuggestion, actionType: 'onHover'})"
                >
                    <span class="btn-title">
                        {{ $t(searchSuggestion.name) }}
                    </span>
                </button>
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.btn {
    align-items: center;
    justify-content: left;
    white-space: nowrap;
    min-height: 2.5rem;
    width: 100%;

    .btn-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>
