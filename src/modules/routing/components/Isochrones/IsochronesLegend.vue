<script>
import {mapGetters} from "vuex";

/**
 * IsochronesLegend
 * @module modules/routing/components/Isochrones/IsochronesLegend
 */
export default {
    name: "IsochronesLegend",
    computed: {
        ...mapGetters("Modules/Routing", ["isochronesSettings"]),
        ...mapGetters("Modules/Routing/Isochrones", ["routingIsochrones"])
    }
};
</script>

<template>
    <span class="d-flex mb-2">{{ $t('common:modules.routing.isochrones.legend.title') }}</span>
    <div>
        <table
            id="isochrones-legend-table"
            class="table"
        >
            <thead>
                <tr>
                    <th scope="col">
                        {{ $t('common:modules.routing.isochrones.legend.color') }}
                    </th>
                    <th
                        v-if="routingIsochrones.getAreas()[0].getOptimization() === 'TIME'"
                        scope="col"
                    >
                        {{ $t('common:modules.routing.isochrones.legend.time') }} [min]
                    </th>
                    <th
                        v-else
                        scope="col"
                    >
                        {{ $t('common:modules.routing.isochrones.legend.distance') }} [km]
                    </th>
                    <th
                        v-if="isochronesSettings.attributes.includes('area')"
                        scope="col"
                    >
                        {{ $t('common:modules.routing.isochrones.legend.area') }} [{{ isochronesSettings.areaUnit }}²]
                    </th>
                    <th
                        v-if="isochronesSettings.attributes.includes('total_pop')"
                        scope="col"
                    >
                        {{ $t('common:modules.routing.isochrones.legend.population') }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(area, index) of routingIsochrones.getAreas()"
                    :key="'result-area-' + index"
                >
                    <td>
                        <div
                            class="legend-container px-2"
                            :style="{backgroundColor: area.getColorRgbString()}"
                        />
                    </td>
                    <td>
                        <span>{{ area.getDisplayValue() }}</span>
                    </td>
                    <td v-if="isochronesSettings.attributes.includes('area')">
                        <span>{{ Math.round(area.getArea()).toLocaleString() }}</span>
                    </td>
                    <td v-if="isochronesSettings.attributes.includes('total_pop')">
                        <span>{{ area.getPopulation().toLocaleString() }}</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
.legend-container {
    height: 25px;
    width: 50px;
    text-align: center;
    opacity: 0.8;
}
</style>
