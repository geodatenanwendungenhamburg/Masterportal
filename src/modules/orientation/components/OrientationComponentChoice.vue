<script>
import RadioButtonGroup from "@shared/modules/buttons/components/RadioButtonGroup.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
export default {
    name: "OrientationComponentChoice",
    components: {
        RadioButtonGroup,
        FlatButton
    },
    data () {
        return {
            selectedMode: "currentPosition"
        };
    },
    computed: {
        radioOptions () {
            return [
                {
                    label: this.$t("common:modules.orientation.currentPositionLabel"),
                    value: "currentPosition"
                },
                {
                    label: this.$t("common:modules.orientation.customPositionLabel"),
                    value: "customPosition"
                }
            ];
        }
    },
    methods: {
        handleNext () {
            // Emit to parent or navigate
            this.$emit("next", this.selectedMode);
        }
    }
};

</script>

<template>
    <div>
        <p class="choice-text">
            {{ $t("common:modules.orientation.choiceText") }}
        </p>
        <RadioButtonGroup
            v-model="selectedMode"
            :options="radioOptions"
            name="locationMode"
        />
        <FlatButton
            class="next-button"
            :text="$t('common:modules.orientation.nextButton')"
            @click="handleNext"
        />
    </div>
</template>

<style lang="scss" scoped>
.next-button {
    margin-top: 1.5rem;
}
</style>
