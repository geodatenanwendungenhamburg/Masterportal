<script>
import {mapActions} from "vuex";
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolFilter",
    components: {IconButton},
    data () {
        return {
            filterText: "",
            searchVisible: false,
            inputWidth: 120
        };
    },
    computed: {
        placeholderText () {
            return this.$t("modules.bimViewer.tools.searchInputPlaceholder");
        }
    },
    watch: {
        filterText () {
            this.updateInputWidth();
        }
    },
    mounted () {
        this.updateInputWidth();
    },
    methods: {
        ...mapActions("Modules/BimViewer/ToolFilter", [
            "resetHighlighting",
            "filterIfcMetaObjects",
            "setHighlighting"
        ]),
        ...mapActions("Alerting", [
            "addSingleAlert"
        ]),
        async filterSubmit () {
            // Reset filter, if filter text is empty
            if (!this.filterText.trim()) {
                await this.resetHighlighting();

                return;
            }

            const matchedObjects = await this.filterIfcMetaObjects({
                filterText: this.filterText
            });

            // show modal - Nothing matched
            if (!matchedObjects.length) {
                this.showModal(matchedObjects.length);
                await this.resetHighlighting();
                return;
            }

            await this.setHighlighting({
                matchedObjects: matchedObjects
            });

            // Show modal - Matched
            this.showModal(matchedObjects.length);
        },
        // Reset component from outside via ref: <ToolFilter ref="toolFilter"> - this.$refs.toolFilter.filterReset()
        filterReset () {
            this.filterText = "";
            this.resetHighlighting();
            this.hideSearchInput();
        },
        showModal (count) {
            this.addSingleAlert({
                category: "Info",
                displayClass: "info",
                confirmText: this.$t("modules.bimViewer.tools.searchModalMatchConfirmText"),
                content: this.$t("modules.bimViewer.tools.searchModalMatchContent", {
                    count: count,
                    filterText: this.filterText
                })
            });
        },
        hideSearchInput () {
            this.searchVisible = false;
        },
        toggleSearchInput () {
            this.searchVisible = !this.searchVisible;
            this.filterText = "";

            if (!this.searchVisible) {
                this.resetHighlighting();
            }

            this.$nextTick(() => {
                if (this.searchVisible && this.$refs.inputGroup) {
                    const input = this.$refs.inputGroup.querySelector("input");

                    if (input) {
                        input.focus();
                    }
                }

                this.updateInputWidth();
            });
        },
        updateInputWidth () {
            this.$nextTick(() => {
                if (this.$refs.inputMirror && this.$refs.filterInput) {
                    const
                        mirror = this.$refs.inputMirror,
                        width = mirror.offsetWidth + 24;

                    this.inputWidth = Math.max(120, width);
                    this.$refs.filterInput.style.width = `${this.inputWidth}px`;
                }
            });
        }
    }
};
</script>

<template>
    <div class="ToolFilter">
        <IconButton
            icon="bi-search"
            :class-array="['btn-primary', { 'bim-btn-highlight': searchVisible }]"
            :title="$t('modules.bimViewer.tools.searchButtonSubmit')"
            :aria="$t('modules.bimViewer.tools.searchButtonSubmit')"
            :interaction="() => toggleSearchInput()"
            @keydown.enter="toggleSearchInput"
        />

        <div
            v-if="searchVisible"
            ref="inputGroup"
            class="inputGroup w-auto"
        >
            <span
                ref="inputMirror"
                class="inputMirror"
                aria-hidden="true"
            >
                {{ filterText || placeholderText }}
            </span>

            <input
                ref="filterInput"
                v-model="filterText"
                type="text"
                class="form-control"
                :placeholder="placeholderText"
                :aria-label="$t('modules.bimViewer.tools.searchInputAriaLabel')"
                aria-describedby="button-addon2"
                autocomplete="off"
                @keydown.enter="filterSubmit"
            >

            <button
                ref="filterSubmitButton"
                class="btn buttonAsIcon btn-submit"
                tabindex="0"
                :title="$t('modules.bimViewer.tools.searchButtonSubmit')"
                :aria="$t('modules.bimViewer.tools.searchButtonSubmit')"
                @click="filterSubmit"
                @keydown.enter="filterSubmit"
            >
                <i class="bi bi-search" />
            </button>

            <button
                v-if="filterText.length"
                ref="filterResetButton"
                class="btn buttonAsIcon btn-reset"
                tabindex="0"
                type="button"
                :title="$t('modules.bimViewer.tools.searchButtonResetTitle')"
                :aria="$t('modules.bimViewer.tools.searchButtonResetTitle')"
                @click="filterReset"
                @keydown.enter="filterReset"
            >
                <i class="bi bi-x" />
            </button>
        </div>
    </div>
</template>

<style lang="scss">
@import "~variables";
#bim-viewer {
    div.ToolFilter {
        display: flex;
        position: relative;

        div.inputGroup {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 999;
            background: white;
            box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.15);
            border-radius: 0.25rem;
            padding: 0.2rem 0;
            margin-top: 0.25rem;
            min-width: 9rem;

            span.inputMirror {
                position: absolute;
                top: -62.4375rem;
                left: 0;
                visibility: hidden;
                white-space: pre;
                font-family: inherit;
                font-size: inherit;
                font-weight: inherit;
                letter-spacing: inherit;
                padding: 0.375rem 0.75rem;
            }

            input {
                border: none;
                box-shadow: none;
                margin-right: 0.5rem;
            }

            button.buttonAsIcon {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                border: none;
                background: transparent;
                font-size: 1.25rem;
                padding: 0;
                cursor: pointer;
                box-shadow: none;
                opacity: 0.6;
            }

            button.btn-reset {
                right: 0.3rem;
                color: $light_red;
            }

            button.btn-reset:focus {
                outline: 0.12rem solid black;
            }

            button.btn-reset:hover {
                color: $light_red;
                opacity: 1;
            }

            button.btn-submit {
                right: 1.7rem;
                color: $secondary;
            }

            button.btn-submit:focus {
                outline: 0.12rem solid black;
            }

            button.btn-submit:hover {
                color: $secondary;
                opacity: 1;
            }
        }
    }
}
</style>
