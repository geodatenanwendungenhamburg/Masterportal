<script>
/**
 * RoutingElevationProfile
 * @module modules/routing/components/RoutingElevationProfile
 * @vue-data {Boolean} collapseProfile - shows if profile is collapsed.
 * @vue-data {Array} distances - distances data (x-axis).
 * @vue-data {Array} elevations - elevation data (y-axis).
 * @vue-data {String} ascent - ascent values.
 * @vue-data {String} descent - descent values.
 */
import {mapGetters} from "vuex";
import {Chart} from "chart.js";
import {toRaw} from "vue";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";

export default {
    name: "RoutingElevationProfile",
    data () {
        return {
            collapseProfile: false,
            distances: [],
            elevations: [],
            ascent: "",
            descent: "",
            chart: {}
        };
    },
    computed: {
        ...mapGetters("Modules/Routing/Directions", ["routingDirections", "directionsElevationSource"]),
        ...mapGetters("Modules/Routing/TSR", ["tsrDirections", "tsrElevationSource"]),
        ...mapGetters("Modules/Routing", ["activeRoutingToolOption", "directionsSettings", "tsrSettings"]),

        /**
         * get directions according to the active routing tool option
         * @returns {*} - routing Directions
         */
        directions () {
            if (this.activeRoutingToolOption === "TSR") {
                return this.tsrDirections;
            }
            return this.routingDirections;
        },
        /**
         *  get layer source according to the active routing tool option
         * @returns {*} - layer source
         */
        layerSource () {
            if (this.activeRoutingToolOption === "TSR") {
                return toRaw(this.tsrElevationSource);
            }
            return toRaw(this.directionsElevationSource);
        }
    },
    mounted () {
        // extract distances data (x-axis)
        this.distances = this.directions.elevationProfile.data.map((x) => x[0]);

        // extract elevation data (y-axis)
        this.elevations = this.directions.elevationProfile.data.map((x) => x[1]);

        // extract ascent and descent vaulues of elevation profile
        this.ascent = Math.round(this.directions.elevationProfile.ascent).toLocaleString();
        this.descent = Math.round(this.directions.elevationProfile.descent).toLocaleString();

        const canvas = this.$refs.elevationProfile;

        this.chart = this.drawChart(canvas);

        // add event listener - if leaving elevation profile with mouse, remove point on map
        canvas.addEventListener("mouseleave", () => {
            const source = this.layerSource;

            source.removeFeature(source.getFeatures()[0]);
        });
    },
    methods: {
        /**
         * Draws chart in canvas
         * @param {Object} canvas element to draw chart inside
         * @returns {void}
         */
        drawChart (canvas) {
            // create chart for elevation profile
            let borderColor = "",
                backgroundColor = "";

            if (this.activeRoutingToolOption === "DIRECTIONS") {
                borderColor = this.directionsSettings.styleElevationProfile.profileColor;
                backgroundColor = this.directionsSettings.styleElevationProfile.profileFillColor;
            }
            else if (this.activeRoutingToolOption === "TSR") {
                borderColor = this.tsrSettings.styleElevationProfile.profileColor;
                backgroundColor = this.tsrSettings.styleElevationProfile.profileFillColor;
            }
            const chart = new Chart(canvas, {
                type: "line",
                data: {
                    labels: this.distances,
                    datasets: [{
                        data: this.elevations,
                        borderWidth: 2,
                        borderColor: borderColor,
                        backgroundColor: backgroundColor,
                        pointStyle: false,
                        fill: true,
                        cubicInterpolationMode: "monotone"
                    }]
                },
                options: {
                    interaction: {
                        intersect: false,
                        mode: "index"
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: this.$t("common:modules.routing.elevationProfile.yAxis")
                            }
                        },
                        x: {
                            display: false,
                            title: {
                                display: true,
                                text: this.$t("common:modules.routing.elevationProfile.xAxis")
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: this.$t("common:modules.routing.elevationProfile.titleChart")
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: this.labelToolTip,
                                title: this.titleToolTip
                            }
                        }
                    },
                    onHover: this.onHover
                },
                plugins: [{
                    afterDraw: this.drawVerticalLine
                }]
            });

            return chart;
        },
        /**
         * Returns the height for the tooltip
         * @param {Object} context of the mouseover
         * @returns {String} height
         */
        labelToolTip (context) {
            return `${context.parsed.y} m`;
        },
        /**
         * Returns the distance for the tooltip
         * @param {Object} context of the mouseover
         * @returns {String} distance
         */
        titleToolTip (context) {
            const currentDistance = Number(context[0].label);

            if (currentDistance < 1000) {
                return this.$t("common:modules.routing.elevationProfile.titleTooltipMeters", {distance: currentDistance.toFixed(2)});
            }

            return this.$t("common:modules.routing.elevationProfile.titleTooltipKilometers", {distance: (currentDistance / 1000).toFixed(2)});
        },
        /**
         * Shows current point on map while hovering over elevation profile
         * @param {Object} e chart event
         * @param {Object} hoverData information of mouse hover data
         * @returns {void}
         */
        onHover (e, hoverData) {
            const source = this.layerSource;

            // add current elevation point in route while hovering over corresponding data
            if (hoverData.length) {
                const index = hoverData[0].index,
                    point = this.directions.lineString[index];

                if (source.getFeatures().length === 0) {
                    const feature = new Feature({
                        geometry: new Point(point)
                    });

                    source.addFeature(feature);
                }
                else {
                    source.getFeatures()[0].getGeometry().setCoordinates(point);
                }
            }
        },
        /**
         * Draws a vertical line in chart on cursor position
         * @param {Object} chart chart object
         * @returns {void}
         */
        drawVerticalLine (chart) {
            let strokeColor = "";

            if (this.activeRoutingToolOption === "DIRECTIONS") {
                strokeColor = this.directionsSettings.styleElevationProfile.elevationPointLineColor;
            }
            else if (this.activeRoutingToolOption === "TSR") {
                strokeColor = this.tsrSettings.styleElevationProfile.elevationPointLineColor;
            }
            if (chart.tooltip?._active?.length) {
                const x = chart.tooltip._active[0].element.x,
                    yAxis = chart.scales.y,
                    ctx = chart.ctx;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, yAxis.top);
                ctx.lineTo(x, yAxis.bottom);
                ctx.lineWidth = 1;
                ctx.strokeStyle = strokeColor;
                ctx.stroke();
                ctx.restore();
            }
        },
        /**
         * Controls collapsing of chart
         * @returns {void}
         */
        collapse () {
            if (!this.collapseProfile) {
                this.$refs.elevationProfile.style.display = "none";
                this.$refs.ascentDescent.style.display = "none";
            }
            else {
                this.$refs.elevationProfile.style.display = "block";
                this.$refs.ascentDescent.style.display = "block";
            }

            this.collapseProfile = !this.collapseProfile;
        }
    }
};
</script>

<template>
    <button
        class="d-flex btn-icon"
        @click="collapse()"
    >
        <i
            :class="collapseProfile? 'bi-chevron-right' : 'bi-chevron-down'"
        />
        <b>{{ $t('common:modules.routing.elevationProfile.titleCollapse') }}</b>
    </button>
    <div>
        <canvas
            id="elevation-profile"
            ref="elevationProfile"
        />
    </div>
    <div
        id="ascent-descent-data"
        ref="ascentDescent"
    >
        <div class="d-flex justify-content-around">
            <span>
                <i class="bi bi-arrow-up" />
                {{ ascent }} m
            </span>
            <span>
                <i class="bi bi-arrow-down" />
                {{ descent }} m
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.btn-icon {
    background-color: $white;
    border: none;
    width: 100%;
    justify-content: flex-start;
    padding: 5px 0;
}
</style>
