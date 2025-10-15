<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import InputText from "@shared/modules/inputs/components/InputText.vue";

/**
 * RoutingRestrictionsInput
 * @module modules/routing/components/RoutingRestrictionsInput
 * @vue-data {Boolean} showRestrictions - Shows hgv restrictions input fields.
 */
export default {
    name: "RoutingRestrictionsInput",
    components: {
        InputText
    },
    data () {
        return {
            showRestrictions: false,
            isValid: {
                length: true,
                width: true,
                height: true,
                weight: true,
                axleload: true
            },
            min: {
                length: 0,
                width: 0,
                height: 0,
                weight: 0,
                axleload: 0
            },
            max: {
                length: 30,
                width: 3.5,
                height: 5,
                weight: 65,
                axleload: 19
            },
            length: 0,
            width: 0,
            height: 0,
            weight: 0,
            axleload: 0
        };
    },
    computed: {
        ...mapGetters("Modules/Routing/Directions", ["routingRestrictionsInputData", "routingRestrictionIsValid"]),
        ...mapGetters("Modules/Routing/Isochrones", ["isochronesRestrictionsInputData"]),
        ...mapGetters("Modules/Routing", ["activeRoutingToolOption"]),

        /**
         * Selects correct store dependent on which module is used
         * @returns {Object} RestrictionsInputData either from stateDirections or stateIsochrones
         */
        inputData () {
            if (this.activeRoutingToolOption === "DIRECTIONS") {
                return this.routingRestrictionsInputData;
            }
            return this.isochronesRestrictionsInputData;
        }
    },
    watch: {
        length () {
            this.validateInput("length", this.length, this.min.length, this.max.length);
        },
        width () {
            this.validateInput("width", this.width, this.min.width, this.max.width);
        },
        height () {
            this.validateInput("height", this.height, this.min.height, this.max.height);
        },
        weight () {
            this.validateInput("weight", this.weight, this.min.weight, this.max.weight);
        },
        axleload () {
            this.validateInput("axleload", this.axleload, this.min.axleload, this.max.axleload);
        }
    },
    mounted () {
        this.length = this.inputData.length;
        this.width = this.inputData.width;
        this.height = this.inputData.height;
        this.weight = this.inputData.weight;
        this.axleload = this.inputData.axleload;
    },
    methods: {
        ...mapActions("Modules/Routing/Directions", [
            "findDirections",
            "removeDirectionsWaypointsDrawInteraction",
            "createDirectionsWaypointsDrawInteraction"
        ]),
        ...mapMutations("Modules/Routing/Directions", [
            "setRoutingRestrictionIsValid"
        ]),
        ...mapMutations("Modules/Routing/Isochrones", [
            "setIsochronesRestrictionIsValid"
        ]),

        /**
         * Checks user-input and sets min/max values if the input is exceeding the predefined treshold
         * @param {String} field sort of input field
         * @param {Number} min minimum value
         * @param {Number} max maximum value
         * @returns {void}
         */
        validateInput (name, field, min, max) {
            const value = parseFloat(field);

            if (value >= min && value <= max) {
                if (this.activeRoutingToolOption === "DIRECTIONS") {
                    this.setRoutingRestrictionIsValid({"name": name, "value": true});
                }
                else {
                    this.setIsochronesRestrictionIsValid({"name": name, "value": true});

                }

                if (this.activeRoutingToolOption === "DIRECTIONS") {
                    this.routingRestrictionsInputData[name] = value;
                    this.isValid[name] = true;
                }
                else if (this.activeRoutingToolOption === "ISOCHRONES") {
                    this.isochronesRestrictionsInputData[name] = value;
                    this.isValid[name] = true;
                }
                return true;
            }

            if (this.activeRoutingToolOption === "DIRECTIONS") {
                this.setRoutingRestrictionIsValid({"name": name, "value": false});
            }
            else {
                this.setIsochronesRestrictionIsValid({"name": name, "value": false});

            }
            this.isValid[name] = false;
            return false;
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
                <div class="form-floating mb-3 w-100 mt-3">
                    <InputText
                        :id="'routing-restrictions-length-input'"
                        v-model="length"
                        :type="'number'"
                        :class-obj="['w-100 form-control' + (isValid.length ? ' is-valid': ' is-invalid')]"
                        :min="min.length"
                        :max="max.length"
                        :step="0.1"
                        :label="$t('common:modules.routing.restrictions.length')"
                        :placeholder="$t('common:modules.routing.restrictions.placeholder')"
                        :error-message="$t('common:modules.routing.restrictions.tooltip', {min: min.length, max: max.length})"
                        @change="activeRoutingToolOption === 'DIRECTIONS'? findDirections() : null"
                    />
                </div>
                <div class="form-floating mb-3 w-100 mt-3">
                    <InputText
                        :id="'routing-restrictions-width-input'"
                        v-model="width"
                        :type="'number'"
                        :class-obj="['w-100 form-control' + (isValid.width ? ' is-valid': ' is-invalid')]"
                        :min="min.width"
                        :max="max.width"
                        :step="0.1"
                        :label="$t('common:modules.routing.restrictions.width')"
                        :placeholder="$t('common:modules.routing.restrictions.placeholder')"
                        :error-message="$t('common:modules.routing.restrictions.tooltip', {min: min.width, max: max.width})"
                        @change="activeRoutingToolOption === 'DIRECTIONS'? findDirections() : null"
                    />
                </div>
                <div class="form-floating mb-3 w-100 mt-3">
                    <InputText
                        :id="'routing-restrictions-height-input'"
                        v-model="height"
                        :type="'number'"
                        :class-obj="['w-100 form-control' + (isValid.height ? ' is-valid': ' is-invalid')]"
                        :min="min.height"
                        :max="max.height"
                        :step="0.1"
                        :label="$t('common:modules.routing.restrictions.height')"
                        :placeholder="$t('common:modules.routing.restrictions.placeholder')"
                        :error-message="$t('common:modules.routing.restrictions.tooltip', {min: min.height, max: max.height})"
                        @change="activeRoutingToolOption === 'DIRECTIONS'? findDirections() : null"
                    />
                </div>
            </div>
            <div class="grid-column">
                <div class="form-floating mb-3 w-100 mt-3">
                    <InputText
                        :id="'routing-restrictions-weight-input'"
                        v-model="weight"
                        :type="'number'"
                        :class-obj="['w-100 form-control' + (isValid.weight ? ' is-valid': ' is-invalid')]"
                        :min="min.weight"
                        :max="max.weight"
                        :step="0.1"
                        :label="$t('common:modules.routing.restrictions.weight')"
                        :placeholder="$t('common:modules.routing.restrictions.placeholder')"
                        :error-message="$t('common:modules.routing.restrictions.tooltip', {min: min.weight, max: max.weight})"
                        @change="activeRoutingToolOption === 'DIRECTIONS'? findDirections() : null"
                    />
                </div>
                <div class="form-floating mb-3 w- mt-3">
                    <InputText
                        :id="'routing-restrictions-axleload-input'"
                        v-model="axleload"
                        :type="'number'"
                        :class-obj="['w-100 form-control' + (isValid.axleload ? ' is-valid': ' is-invalid')]"
                        :min="min.axleload"
                        :max="max.axleload"
                        :step="0.1"
                        :label="$t('common:modules.routing.restrictions.axleload')"
                        :placeholder="$t('common:modules.routing.restrictions.placeholder')"
                        :error-message="$t('common:modules.routing.restrictions.tooltip', {min: min.axleload, max: max.axleload})"
                        @change="activeRoutingToolOption === 'DIRECTIONS'? findDirections() : null"
                    />
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
                            v-model="inputData.hazmat"
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
@import "~variables";

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
    width: 100%;
    margin-bottom: 0;
}
</style>
