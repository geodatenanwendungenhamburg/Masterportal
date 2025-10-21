<script>
import SpinnerItem from "../../../modules/spinner/components/SpinnerItem.vue";

export default {
    name: "ButtonGroup",
    components: {
        SpinnerItem
    },
    props: {
        /** The format is like:
         * [{name: "button1", icon: "bi-icon"}]
        */
        buttons: {
            type: Array,
            required: true
        },
        group: {
            type: String,
            required: true
        },
        isLoadSpinnerEnable: {
            type: Boolean,
            required: false,
            default: false
        },
        selectedValue: {
            type: String,
            required: false,
            default: undefined
        },
        subText: {
            type: Array,
            required: false,
            default: undefined
        },
        isGroup: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    data () {
        return {
            precheckedIndex: 0,
            showLoadSpinner: false
        };
    },
    watch: {
        /**
         * Watcher for setting the loading spinner.
         * @returns {void}
         */
        selectedValue (val) {
            this.precheckedIndex = this.getPrecheckedIndex(this.buttons, val);

            if (!this.isLoadSpinnerEnable) {
                return;
            }

            this.showLoadSpinner = true;

            setTimeout(() => {
                this.showLoadSpinner = false;
            }, 1000);
        }
    },
    methods: {
        /**
         * Gets the prechecked index
         * @param {Object[]} buttons - the buttons object in array
         * @param {String} precheckedValue - the prechecked value
         * @returns {Number} the prechecked index
         */
        getPrecheckedIndex (buttons, precheckedValue) {
            if (!Array.isArray(buttons) || typeof precheckedValue !== "string") {
                return 0;
            }

            const index = buttons.findIndex((button) => button?.name === precheckedValue);

            return index !== -1 ? index : 0;
        }
    }
};

</script>
<template>
    <div class="switchRadioButtons mt-0">
        <div
            :class="isGroup ? 'btn-group' : 'non-group btn-toolbar d-flex align-items-center'"
            role="group"
            aria-label="First group"
        >
            <div
                v-for="(button, idx) in buttons"
                :key="idx"
                :class="isGroup ? 'button-wrapper' : 'btn-group pe-2'"
            >
                <input
                    :id="`btnradio${idx}${button.name}`"
                    type="radio"
                    class="btn-check"
                    :name="group"
                    autocomplete="off"
                    :checked="idx === precheckedIndex"
                >
                <label
                    :class="isGroup ? 'btn px-3' : ''"
                    class="text-nowrap py-2"
                    :for="`btnradio${idx}${button.name}`"
                    role="button"
                    tabindex="0"
                    @click="$emit('setSelectedButton', button.name)"
                    @keydown="$emit('setSelectedButton', button.name)"
                >
                    <span
                        v-if="subText"
                        class="subtext"
                    >
                        {{ subText[idx] }}
                    </span>
                    <span
                        v-if="showLoadSpinner && selectedValue === button.name"
                        class="loading"
                    >
                        <SpinnerItem />
                    </span>
                    <i
                        v-if="button.icon"
                        :class="`${button.icon} pe-2`"
                    />{{ button.name }}
                </label>
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>

.btn {
    border-radius: 0px;
    background-color: $light_grey;
    color: $light_grey_inactive_contrast;

    .subtext {
        display: block;
        font-size: 10px;
    }
}

.btn-check:checked + .btn {
    background: $secondary;
    color: $white;
    border-color: $secondary;
    position: relative;

    .loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        text-align: center;
        align-content: center;
    }
}

.btn:hover {
    background: $primary;
    border-color: $primary;
}

.button-wrapper {
    &:first-child {
        .btn {
            border-top-left-radius: 20px;
            border-bottom-left-radius: 20px;
        }
    }
    &:last-child {
        .btn {
            border-top-right-radius: 20px;
            border-bottom-right-radius: 20px;
        }
    }
}

.non-group {
    .btn-check {
       + label {
            display: block;
            font-size: 0.9rem;
           i {
            width: 30px;
            height: 30px;
            display: block;
            border-radius: 15px;
            margin-bottom: 3px;
            font-size: 15px;
            padding: 5px 0 10px 7px;
            margin-left: auto;
            margin-right: auto;
            &:hover {
                background-color: $primary;
            }
           }
        }
        &:checked {
            + label {
                i {
                    color: $white;
                    background-color: $form-check-input-checked-bg-color;
                    padding: 5px 0 10px 7px;
                }
            }
        }
    }
}
</style>
