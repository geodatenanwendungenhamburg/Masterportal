<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

/**
 * A generic confirmation modal component asking for user confirmation.
 * @module shared/modules/buttons/ElevatedButton
 *
 * Example usage:
 *
 * <button @click="showConfirmModal = true">Open modal</button>
 *
 * <ConfirmModal
 *     :show-modal="showConfirmModal"
 *     modal-title="Update item?"
 *     modal-content="This can't be undone. Are you shure?"
 *     button-confirm-label="Update"
 *     button-cancel-label="Cancel"
 *     @clicked-confirm="showConfirmModal = false"
 *     @clicked-cancel="showConfirmModal = false"
 * />
 *
 * @vue-props {string} modalTitle - Modal title, overwrite with slot "title" if HTML is required.
 * @vue-props {string} modalContent - Modal content, overwrite with slot "default" if HTML is required.
 * @vue-props {string} buttonConfirmLabel - Label for the confirm button.
 * @vue-props {string|null} buttonConfirmIcon - Icon for the confirm button.
 * @vue-props {boolean} buttonConfirmHidden - Whether the confirm button is hidden.
 * @vue-props {string} buttonCancelLabel - Label for the cancel button.
 * @vue-props {string|null} buttonCancelIcon - Icon for the cancel button.
 * @vue-props {boolean} buttonCancelHidden - Whether the cancel button is hidden.
 * @vue-props {boolean} buttonCloseHidden - Whether the close (X) button is hidden.
 * @vue-props {string} modalClass - Additional CSS class for the modal.
 * @vue-props {string} modalStyle - Additional inline styles for the modal.
 * @vue-props {string} modalContentClass - Additional CSS class for the modal content.
 * @vue-props {string} modalContentStyle - Additional inline styles for the modal content.
 * @vue-props {boolean} showModal - Whether the modal is visible.
 *
 * @vue-emits confirmModalHidden - Emitted when the modal has been fully hidden.
 * @vue-emits clickedConfirm - Emitted when the confirm button is clicked.
 * @vue-emits clickedCancel - Emitted when the cancel button is clicked.
 */
export default {
    name: "ConfirmModal",
    components: {
        FlatButton,
        IconButton
    },
    props: {
        modalTitle: {
            type: String,
            default: ""
        },
        modalContent: {
            type: String,
            default: ""
        },
        buttonConfirmLabel: {
            type: String,
            default: "OK"
        },
        buttonConfirmIcon: {
            type: [String, null],
            default: "bi-check-lg"
        },
        buttonConfirmHidden: {
            type: Boolean,
            default: false
        },
        buttonCancelLabel: {
            type: String,
            default: "Cancel"
        },
        buttonCancelIcon: {
            type: [String, null],
            default: null
        },
        buttonCancelHidden: {
            type: Boolean,
            default: false
        },
        buttonCloseHidden: {
            type: Boolean,
            default: false
        },
        modalClass: {
            type: String,
            default: ""
        },
        modalStyle: {
            type: String,
            default: ""
        },
        modalContentClass: {
            type: String,
            default: ""
        },
        modalContentStyle: {
            type: String,
            default: ""
        },
        showModal: {
            type: Boolean,
            default: false
        }
    },
    emits: [
        "confirmModalHidden",
        "clickedConfirm",
        "clickedCancel"
    ],
    watch: {
        showModal (isVisible) {
            if (!isVisible) {
                this.$emit("confirmModalHidden");
            }
            else {
                this.$nextTick(() => {
                    this.$refs?.discard?.focus();
                });
            }
        }
    },
    mounted () {
        document.getElementsByTagName("body")[0].appendChild(this.$el);

        document.addEventListener("keydown", this.handleKeydown);
    },
    beforeUnmount () {
        document.removeEventListener("keydown", this.handleKeydown);

        if (this.$el && this.$el.parentNode) {
            this.$el.parentNode.removeChild(this.$el);
        }
    },
    methods: {
        handleClickConfirm () {
            this.$emit("clickedConfirm");
        },
        handleClickCancel () {
            this.$emit("clickedCancel");
        },
        handleKeydown (event) {
            if (!this.showModal) {
                return;
            }

            if (event.key === "Escape") {
                this.handleClickCancel();
            }

            if (event.key === "Tab") {
                this.trapFocus(event);
            }
        },
        trapFocus (event) {
            const modal = this.$refs.discard;

            if (!modal) {
                return;
            }

            const focusableSelectors = [
                    "a[href]",
                    "area[href]",
                    "input:not([disabled])",
                    "select:not([disabled])",
                    "textarea:not([disabled])",
                    "button:not([disabled])",
                    "iframe",
                    "object",
                    "embed",
                    "[tabindex]:not([tabindex=\"-1\"])",
                    "[contenteditable]"
                ],
                focusableEls = modal.querySelectorAll(focusableSelectors.join(",")),
                focusable = Array.prototype.slice.call(focusableEls).filter(el => el.offsetParent !== null);

            if (focusable.length === 0) {
                return;
            }

            const first = focusable[0],
                last = focusable[focusable.length - 1],
                active = document.activeElement;

            if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
            else if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            }
        }
    }
};
</script>

<template lang="html">
    <div
        id="modal-confirm"
        :class="{showing: showModal}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirm-title"
        aria-describedby="modal-confirm-content"
    >
        <div class="modal-backdrop" />

        <div class="modal-outer-wrapper">
            <div
                ref="discard"
                class="modal-inner-wrapper"
                tabindex="0"
                :style="modalStyle"
                :class="modalClass"
            >
                <div class="modal-title-wrapper">
                    <div
                        id="modal-confirm-title"
                        class="modal-title"
                    >
                        <template v-if="$slots.title">
                            <slot name="title" />
                        </template>

                        <template v-else-if="modalTitle">
                            {{ modalTitle }}
                        </template>
                    </div>

                    <IconButton
                        v-if="!buttonCloseHidden"
                        class="discard-icon-button"
                        :class-array="['btn-light', 'bootstrap-icon']"
                        :title="buttonCancelLabel"
                        :aria="buttonCancelLabel"
                        icon="bi-x"
                        :interaction="() => handleClickCancel()"
                    />
                </div>

                <div
                    v-if="$slots.default || modalContent"
                    id="modal-confirm-content"
                    :style="modalContentStyle"
                    :class="[
                        'modal-content',
                        modalContentClass
                    ]"
                >
                    <template v-if="$slots.default">
                        <slot name="default" />
                    </template>

                    <template v-else-if="modalContent">
                        <p>
                            {{ modalContent }}
                        </p>
                    </template>
                </div>

                <div
                    v-if="!buttonCancelHidden || !buttonConfirmHidden"
                    :class="[
                        'modal-actions',
                        !$slots.default && !modalContent ? 'without-content-slot' : ''
                    ]"
                >
                    <FlatButton
                        v-if="!buttonCancelHidden"
                        :text="buttonCancelLabel"
                        :icon="buttonCancelIcon"
                        :secondary="true"
                        :interaction="() => handleClickCancel()"
                    />

                    <FlatButton
                        v-if="!buttonConfirmHidden"
                        :text="buttonConfirmLabel"
                        :icon="buttonConfirmIcon"
                        :interaction="() => handleClickConfirm()"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

    div#modal-confirm {
        display: none;

        &.showing {
            display: block;
        }

        div.modal-backdrop {
            background-color:rgba(0, 0, 0, 0.4);
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
        }

        div.modal-outer-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            text-align: center;
            z-index: 10000;
            background-color: rgb(1, 1, 1, 0);
            border: none;
            cursor: default;

            &:before {
                content: '';
                display: inline-block;
                height: 100%;
                vertical-align: middle;
                margin-right: -0.25rem;
            }

            div.modal-inner-wrapper {
                text-align: left;
                background-color: $white;
                display: inline-block;
                vertical-align: middle;
                max-width: 90%;
                position: relative;
                padding: .3125rem;
                border-radius: 0.3em;

                div.modal-title-wrapper {
                    display: flex;
                    justify-content: space-between;

                    div.modal-title {
                        font-weight: bold;
                        padding: 1.5rem 1.5rem 0.375rem 1.5rem;
                    }
                }

                div.modal-content {
                    max-height: 80vh;
                    overflow: auto;
                    padding: 0.75rem 1.5rem;
                }

                div.modal-actions {
                    display: flex;
                    justify-content: end;
                    margin: 0 1rem;
                    padding-bottom: 1rem;
                    gap: 1rem;

                    &.without-content-slot {
                        padding-top: 1rem;
                    }

                    button.flat-button {
                        &.custom-mb-3 {
                            margin-bottom: 0;
                        }

                        &:focus-visible {
                            border-color: var(--bs-btn-active-border-color);
                        }
                    }
                }
            }
        }
    }
</style>
