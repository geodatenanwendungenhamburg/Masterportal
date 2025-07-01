<script>

/**
* Snippet Tag
* @module modules/SnippetTag
* @vue-prop {Number} filterId - The filter ID.
* @vue-prop {Object} rule - Rule object containing snippetId and value.
* @vue-event {Number, Number} deleteRule - Emits snippet and filter ID of rule to delete.
* @vue-event {Number, Number, Number} deleteValue - Emits snippet and filter ID of value to delete.
*/
export default {
    name: "SnippetTag",
    props: {
        filterId: {
            type: Number,
            required: false,
            default: undefined
        },
        rule: {
            type: Object,
            required: false,
            default: () => ({})
        }
    },
    emits: ["deleteRule", "deleteValue"],
    computed: {
        /**
         * Gets the value tags to display from the rule.
         * @returns {Array} An array of value tags.
         */
        valueTags () {
            if (Object.prototype.hasOwnProperty.call(this.rule, "tagTitle")) {
                return [this.rule.tagTitle];
            }
            else if (Array.isArray(this.rule.appliedPassiveValues) && this.rule.appliedPassiveValues.length > 0) {
                return this.rule.appliedPassiveValues;
            }
            else if (!Array.isArray(this.rule.value)) {
                return [this.rule.value];
            }
            return this.rule.value;
        }
    },
    methods: {
        /**
         * Triggers the functions to reset the snippet and change the rules.
         * @param {String} value The value to be removed.
         * @returns {void}
         */
        removeTag (value) {
            if (this.valueTags.length >= 2) {
                this.$emit("deleteValue", this.rule.snippetId, this.filterId, value);
                return;
            }
            this.$emit("deleteRule", this.rule.snippetId, this.filterId);
        }
    }
};
</script>

<template>
    <div
        v-for="value in valueTags"
        :key="value"
        class="snippetTagContainer"
    >
        <button
            type="button"
            class="btn-tags text-start"
            title="löschen"
            @click="removeTag(value)"
            @keydown.enter="removeTag(value)"
        >
            <div>
                <span
                    v-if="rule.attrLabel"
                    class="ps-2 snippetTagLabel"
                >
                    {{ rule.attrLabel }}:
                </span>
                <span class="snippetTagValue">{{ value }}</span>
                <i class="align-middle bi bi bi-x" />
            </div>
        </button>
    </div>
</template>

<style lang="scss" scoped>
    .snippetTagContainer {
        margin: 0 0 2px 2px;
        float: left;

        button {
            padding: 5px 6px 2px;
            font-size: $font-size-base;
            background-color: $light_blue;
            border: none;
            border-radius: 20px;
            display: flex;
            align-items: center;

            .snippetTagLabel {
                font-size: $font-size-sm;
                color: $dark_grey;
            }

            &:hover {
                opacity: 1;
                background-color: $dark_blue;
                color: $white;
                cursor: pointer;

                .snippetTagLabel {
                    color: $white;
                }
            }
        }
    }
    .snippetTagContainer .snippetTagValue {
        padding-right: 5px;
    }
</style>
