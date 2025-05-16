<script>
export default {
    name: "ToolFilter",
    data () {
        return {
            filterText: ""
        };
    },
    methods: {
        async filterSubmit () {
            // Reset filter, if filter text is empty
            if (!this.filterText.trim()) {
                this.$store.dispatch("Modules/BimViewer/ToolFilter/resetHighlighting");

                return;
            }

            const matchedObjects = await this.$store.dispatch("Modules/BimViewer/ToolFilter/filterIfcMetaObjects", {
                filterText: this.filterText
            });

            // Show modal - Nothing matched
            if (!matchedObjects.length) {
                this.showModal(matchedObjects.length);
                this.$store.dispatch("Modules/BimViewer/ToolFilter/resetHighlighting");

                return;
            }

            this.$store.dispatch("Modules/BimViewer/ToolFilter/setHighlighting", {
                matchedObjects: matchedObjects
            });

            // Show modal - Matched
            this.showModal(matchedObjects.length);
        },
        // Reset component from outside via ref: <ToolFilter ref="toolFilter"> - this.$refs.toolFilter.filterReset()
        filterReset () {
            this.filterText = "";

            this.$store.dispatch("Modules/BimViewer/ToolFilter/resetHighlighting");
        },
        showModal (count) {
            this.$store.dispatch("Alerting/addSingleAlert", {
                category: "Info",
                displayClass: "info",
                "confirmText": this.$t("modules.bimViewer.tools.searchModalMatchConfirmText"),
                "content": this.$t("modules.bimViewer.tools.searchModalMatchContent", {
                    count: count,
                    filterText: this.filterText
                })
            });
        }
    }
};
</script>

<template>
    <div class="ToolFilter">
        <div class="input-group w-auto">
            <form @submit.prevent="filterSubmit">
                <input
                    v-model="filterText"
                    type="text"
                    class="form-control"
                    :placeholder="$t('modules.bimViewer.tools.searchInputPlaceholder')"
                    :aria-label="$t('modules.bimViewer.tools.searchInputAriaLabel')"
                    aria-describedby="button-addon2"
                    autocomplete="off"
                >

                <button
                    v-if="filterText.length"
                    class="btn btn-reset"
                    type="button"
                    :title="$t('modules.bimViewer.tools.searchButtonResetTitle')"
                    @click="filterReset"
                >
                    <i class="bi bi-x" />
                </button>

                <button
                    class="btn btn-primary"
                    type="submit"
                    :title="$t('modules.bimViewer.tools.searchButtonSubmit')"
                >
                    <i class="bi bi-search" />
                </button>
            </form>
        </div>
    </div>
</template>

<style lang="scss">
@import "~variables";

div.ToolFilter {
    display: flex;

    form {
        display: flex;
        input:focus {
            box-shadow: none;
            outline: none;
        }
    }

    button.btn-reset {
        position: absolute;
        right: 2.8rem;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        font-size: 1.25rem;
        color: $light_red;
        padding: 0;
        cursor: pointer;
        box-shadow: none;
        opacity: 0.6;
    }

    button.btn-reset:hover {
        color: $light_red;
        opacity: 1;
    }
}
</style>
