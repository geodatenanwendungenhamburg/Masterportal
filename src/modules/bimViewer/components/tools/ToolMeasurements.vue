<script>
export default {
    name: "ToolMeasurements",
    data () {
        return {
            toolDistanceMeasurementsActive: false
        };
    },
    methods: {
        setActive (isActive) {
            this.$store.dispatch("Modules/BimViewer/ToolMeasurements/toggle", {
                isActive
            });

            this.toolDistanceMeasurementsActive = isActive;

            if (isActive === true) {
                this.$store.dispatch("Modules/BimViewer/ToolObjectInfo/reset");
            }
        },
        clear () {
            this.$store.dispatch("Modules/BimViewer/ToolMeasurements/clear");
        }
    }
};
</script>

<template>
    <div class="ToolMeasurements">
        <div class="buttonContainer">
            <button
                :class="['btn', toolDistanceMeasurementsActive ? 'bim-btn-highlight' : 'btn-primary']"
                :title="$t('modules.bimViewer.tools.distanceMeasurementsToggle')"
                @click="setActive(!toolDistanceMeasurementsActive)"
            >
                <i class="bi bi-rulers" />
            </button>

            <button
                v-if="toolDistanceMeasurementsActive"
                :class="['btn', 'resetButton' , !toolDistanceMeasurementsActive ? 'bim-btn-highlight' : 'btn-primary']"
                :title="$t('modules.bimViewer.tools.distanceMeasurementsClear')"
                @click="clear()"
            >
                <i class="bi bi-arrow-counterclockwise" />
            </button>
        </div>
    </div>
</template>

<style lang="scss">
div.ToolMeasurements {
    display: flex;
    align-items: center;

    .buttonContainer {
        position: relative;
        display: inline-block;

        .resetButton {
            position: absolute;
            bottom: -10px;
            right: -5px;
            border: none;
            background-color: rgb(238, 35, 35);
            color: white;
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
            background-color:rgb(221, 6, 6);
        }
    }
}
</style>
