<script>
import SnippetInfo from "./SnippetInfo.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

/**
* Snippet Checkbox Filter In Map Extent
* @module modules/SnippetCheckboxFilterInMapExtent
* @vue-prop {Number} filterId - The filter's id.
* @vue-prop {Array} info - The info for the SnippetInfo.
* @vue-prop {Boolean} preselected - Shows if checkbox is pre-checked.
*
* @vue-data {Boolean} checked - Shows if checkbox is checked.
* @vue-data {String} translationKey - The translation key for the SnippetInfo.
*
* @vue-event {*} commandChanged - Emits the changed command with a value.
*/
export default {
    name: "SnippetCheckboxFilterInMapExtent",
    components: {
        SnippetInfo,
        SwitchInput
    },
    props: {
        filterId: {
            type: Number,
            required: true
        },
        info: {
            type: [String, Boolean],
            required: false,
            default: true
        },
        preselected: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ["commandChanged"],
    data () {
        return {
            translationKey: "snippetCheckbox",
            checked: false
        };
    },
    mounted () {
        if (typeof this.preselected !== "boolean") {
            return;
        }
        this.checked = this.preselected;
    },
    methods: {
        /**
         * Emits the current command to whoever is listening.
         * @param {event} evt the input switch event.
         * @returns {void}
         */
        updateChecked (evt) {
            this.checked = evt?.target?.checked;
            this.$emit("commandChanged", evt?.target?.checked);
        }
    }
};
</script>

<template>
    <div
        class="snippetCheckboxContainer"
    >
        <div class="form-check form-switch d-flex align-items-center">
            <SwitchInput
                id="showExistingItems"
                :checked="checked"
                :label="$t('common:modules.filter.searchInMapExtent')"
                :aria="$t('common:modules.filter.searchInMapExtent')"
                :interaction="updateChecked"
            />
            <div
                v-if="info"
            >
                <SnippetInfo
                    :info="info"
                    :translation-key="translationKey"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

    .snippetCheckboxContainer {
        margin-bottom: 10px;
        height: auto;
        position: relative;
    }
    .snippetCheckboxContainer .left {
        input[type=radio], input[type=checkbox] {
            margin: 0 5px 0 0;
        }
        /*float: left;*/
        input {
            float: left;
            width: 15px;
            margin-right: 5px;
        }
        label {
            float: left;
            /*margin-bottom: 0;*/
            cursor: pointer;
        }
    }
</style>
