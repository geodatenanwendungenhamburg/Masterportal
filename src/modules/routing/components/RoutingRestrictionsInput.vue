<script>
import {mapGetters, mapActions} from "vuex";

/**
 * RoutingRestrictionsInput
 * @module modules/routing/components/RoutingRestrictionsInput
 * @vue-data {Boolean} showRestrictions - Shows hgv restrictions input fields.
 */
export default {
    name: "RoutingRestrictionsInput",
    data () {
        return {
            showRestrictions: false
        };
    },
    computed: {
        ...mapGetters("Modules/Routing/Directions", ["routingRestrictionsInputData"]),
        ...mapGetters("Modules/Routing/Isochrones", ["isochronesRestrictionsInputData"]),
        ...mapGetters("Modules/Routing", ["activeRoutingToolOption"])

    },
    methods: {
        ...mapActions("Modules/Routing/Directions", ["findDirections"]),

        /**
         * Selects correct store dependent on which module is used
         * @returns {Object} RestrictionsInputData either from stateDirections or stateIsochrones
         */
        inputData () {
            if (this.activeRoutingToolOption === "DIRECTIONS") {
                return this.routingRestrictionsInputData;
            }
            return this.isochronesRestrictionsInputData;
        },
        /**
         * Checks user-input and sets min/max values if the input is exceeding the predefined treshold
         * @param {String} field sort of input field
         * @param {Number} min minimum value
         * @param {Number} max maximum value
         * @returns {void}
         */
        validateInput (field, min, max) {
            let value = parseFloat(this.inputData()[field]);

            if (value > max) {
                value = max;
            }
            if (value < min) {
                value = min;
            }

            if (this.activeRoutingToolOption === "DIRECTIONS") {
                switch (field) {
                    case "length":
                        this.routingRestrictionsInputData.length = value;
                        break;
                    case "width":
                        this.routingRestrictionsInputData.width = value;
                        break;
                    case "height":
                        this.routingRestrictionsInputData.height = value;
                        break;
                    case "weight":
                        this.routingRestrictionsInputData.weight = value;
                        break;
                    case "axleload":
                        this.routingRestrictionsInputData.axleload = value;
                        break;
                    default:
                        console.error("Field not found for: ${field}");
                }
            }
            else if (this.activeRoutingToolOption === "ISOCHRONES") {
                switch (field) {
                    case "length":
                        this.isochronesRestrictionsInputData.length = value;
                        break;
                    case "width":
                        this.isochronesRestrictionsInputData.width = value;
                        break;
                    case "height":
                        this.isochronesRestrictionsInputData.height = value;
                        break;
                    case "weight":
                        this.isochronesRestrictionsInputData.weight = value;
                        break;
                    case "axleload":
                        this.isochronesRestrictionsInputData.axleload = value;
                        break;
                    default:
                        console.error("Field not found for: ${field}");
                }
            }
        }
    }
};
</script>

<template>
    <div
        id="routing-restrictions"
        class="d-flex flex-column"
    >
        <button
            class="d-flex btn-icon"
            @click="showRestrictions = !showRestrictions"
            @keydown.enter="showRestrictions = !showRestrictions"
        >
            <i
                :class="showRestrictions? 'bi-chevron-down' : 'bi-chevron-right'"
            />
            <b>{{ $t('common:modules.routing.restrictions.header') }}</b>
        </button>
        <div
            v-if="showRestrictions"
            class="grid-container"
        >
            <div class="grid-column">
                <div class="flex-container">
                    <div
                        class="form-group-row"
                        data-bs-toggle="tooltip"
                        :data-bs-title="$t('common:modules.routing.restrictions.lengthTooltip')"
                        data-bs-trigger="hover focus"
                    >
                        <label
                            for="lengthInput"
                            class="col-form-label"
                        >
                            {{ $t('common:modules.routing.restrictions.length') }}
                        </label>
                        <input
                            id="lengthInput"
                            v-model="inputData().length"
                            type="number"
                            step="0.1"
                            class="form-control"
                            autocomplete="off"
                            @focus="isFocused = true"
                            @blur="isFocused = false"
                            @change="activeRoutingToolOption === 'DIRECTIONS' ? findDirections() : null"
                            @input="validateInput('length', 0.0, 30.0)"
                        >
                        <span class="scale-unit">m</span>
                    </div>
                    <div
                        class="form-group-row"
                        data-bs-toggle="tooltip"
                        :data-bs-title="$t('common:modules.routing.restrictions.widthTooltip')"
                        data-bs-trigger="hover focus"
                    >
                        <label
                            for="widthInput"
                            class="col-form-label"
                        >
                            {{ $t('common:modules.routing.restrictions.width') }}
                        </label>
                        <input
                            id="widthInput"
                            v-model="inputData().width"
                            type="number"
                            step="0.1"
                            class="form-control"
                            autocomplete="off"
                            @focus="isFocused = true"
                            @blur="isFocused = false"
                            @change="activeRoutingToolOption === 'DIRECTIONS' ? findDirections() : null"
                            @input="validateInput('width', 0.0, 3.5)"
                        >
                        <span class="scale-unit">m</span>
                    </div>
                    <div
                        class="form-group-row"
                        data-bs-toggle="tooltip"
                        :data-bs-title="$t('common:modules.routing.restrictions.heightTooltip')"
                        data-bs-trigger="hover focus"
                    >
                        <label
                            for="heightInput"
                            class="col-form-label"
                        >
                            {{ $t('common:modules.routing.restrictions.height') }}
                        </label>
                        <input
                            id="heightInput"
                            v-model="inputData().height"
                            type="number"
                            step="0.1"
                            class="form-control"
                            autocomplete="off"
                            @focus="isFocused = true"
                            @blur="isFocused = false"
                            @change="activeRoutingToolOption === 'DIRECTIONS' ? findDirections() : null"
                            @input="validateInput('height', 0.0, 5.0)"
                        >
                        <span class="scale-unit">m</span>
                    </div>
                </div>
            </div>
            <div class="grid-column">
                <div
                    class="form-group-row"
                    data-bs-toggle="tooltip"
                    :data-bs-title="$t('common:modules.routing.restrictions.weightTooltip')"
                    data-bs-trigger="hover focus"
                >
                    <label
                        for="weightInput"
                        class="col-form-label"
                    >
                        {{ $t('common:modules.routing.restrictions.weight') }}
                    </label>
                    <input
                        id="weightInput"
                        v-model="inputData().weight"
                        type="number"
                        class="form-control"
                        autocomplete="off"
                        @focus="isFocused = true"
                        @blur="isFocused = false"
                        @change="activeRoutingToolOption === 'DIRECTIONS' ? findDirections() : null"
                        @input="validateInput('weight', 0, 65)"
                    >
                    <span class="scale-unit">t</span>
                </div>
                <div
                    class="form-group-row"
                    data-bs-toggle="tooltip"
                    :data-bs-title="$t('common:modules.routing.restrictions.axleloadTooltip')"
                    data-bs-trigger="hover focus"
                >
                    <label
                        for="axleloadInput"
                        class="col-form-label"
                    >
                        {{ $t('common:modules.routing.restrictions.axleload') }}
                    </label>
                    <input
                        id="axleloadInput"
                        v-model="inputData().axleload"
                        type="number"
                        class="form-control"
                        autocomplete="off"
                        @focus="isFocused = true"
                        @blur="isFocused = false"
                        @change="activeRoutingToolOption === 'DIRECTIONS' ? findDirections() : null"
                        @input="validateInput('axleload', 0, 19)"
                    >
                    <span class="scale-unit">t</span>
                </div>
                <div class="form-group-row">
                    <label
                        for="hazmatInput"
                        class="col-form-label"
                    >
                        {{ $t('common:modules.routing.restrictions.hazmat') }}
                    </label>
                    <div>
                        <input
                            id="hazmatInput"
                            v-model="inputData().hazmat"
                            type="checkbox"
                            autocomplete="off"
                            @focus="isFocused = true"
                            @blur="isFocused = false"
                            @change="activeRoutingToolOption === 'DIRECTIONS' ? findDirections() : null"
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>


#hazmatInput {
    margin-top: 10px;
    margin-right: 11px;
}

.btn-up-down {
    margin-left: 5px;
}

.btn-icon {
    background-color: rgba(0, 0, 0, 0);
    border: none;
    padding: 5px 0;
}

.form-control {
    width: 5rem;
}

.form-group-row {
    display: flex;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
    grid-gap: 3rem;
    margin-bottom: 5%;
}

.input-icon {
    margin-left: -37px;
}

.scale-unit {
    padding-left: 0.5rem;
    margin-top: 5px;
}

label {
    width: 300px;
    margin-bottom: 0;
}

input:focus-within {
    font-weight: bold;
}
</style>
