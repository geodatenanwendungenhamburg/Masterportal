<script>
import {mapActions} from "vuex";
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolMeasurements",
    components: {
        IconButton
    },
    data () {
        return {
            toolDistanceMeasurementsActive: false
        };
    },
    methods: {
        ...mapActions({
            toggleMeasurements: "Modules/BimViewer/ToolMeasurements/toggle",
            clearMeasurements: "Modules/BimViewer/ToolMeasurements/clear",
            resetObjectInfo: "Modules/BimViewer/ToolObjectInfo/reset"
        }),
        setActive (isActive) {
            if (typeof isActive !== "boolean") {
                throw new Error("setActive expects a boolean value");
            }

            this.toggleMeasurements({isActive});
            this.toolDistanceMeasurementsActive = isActive;

            if (isActive === true) {
                this.resetObjectInfo();
            }
        }
    }
};
</script>

<template>
    <div class="ToolMeasurements">
        <div class="buttonContainer">
            <IconButton
                :aria="$t('modules.bimViewer.tools.distanceMeasurementsToggle')"
                :title="$t('modules.bimViewer.tools.distanceMeasurementsToggle')"
                :class="['btn', toolDistanceMeasurementsActive ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
                icon="bi-rulers"
                :interaction="() => setActive(!toolDistanceMeasurementsActive)"
            />

            <button
                v-if="toolDistanceMeasurementsActive"
                :class="['btn', 'resetButton', !toolDistanceMeasurementsActive ? 'btn-primary btn-primary bim-btn-highlight' : 'btn-primary']"
                :title="$t('modules.bimViewer.tools.distanceMeasurementsClear')"
                @click="clearMeasurements"
            >
                <i class="bi bi-arrow-counterclockwise" />
            </button>
        </div>
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.ToolMeasurements {
        display: flex;
        align-items: center;

        .buttonContainer {
            position: relative;
            display: inline-block;

            .resetButton {
                position: absolute;
                bottom: -0.625rem;
                right: -0.3125rem;
                border: none;
                background-color: $light_red;
                color: $white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.2rem;
                cursor: pointer;

                i {
                    line-height: 1;
                }
            }

            .resetButton:hover {
                background-color: $light_red;
            }

            .btn-primary:hover,
            .bim-btn-highlight,
            .bim-btn-highlight:hover {
                color: $white;
                background-color: $secondary;
            }
        }
    }
}
</style>
