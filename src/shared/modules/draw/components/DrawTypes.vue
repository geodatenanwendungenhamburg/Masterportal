<script>
import drawInteraction from "@masterportal/masterportalapi/src/maps/interactions/drawInteraction.js";
import {mapActions, mapGetters, mapState, mapMutations} from "vuex";
import IconButton from "../../buttons/components/IconButton.vue";
import {nextTick} from "vue";
import {createTooltipOverlay} from "../js/createTooltipOverlay.js";
import Style from "ol/style/Style.js";
import Icon from "ol/style/Icon.js";

/**
 * Shared component that provides buttons for two-level selection of geometries and symbols.
 * @module shared/modules/draw/DrawTypes
 * @vue-prop {Object} [circleOptions={innerRadius: 100, interactive: true, outerRadius: 500, unit: "m"}] - The circle Options.
 * @vue-prop {Object} currentLayout - The current layout for the styling.
 * @vue-prop {Object} [currentLayoutOuterCircle={}] - The current layout for styling the outer circle. Only used for double circle.
 * @vue-prop {Object} [drawIcons={box: "bi-square", circle: "bi-circle", doubleCircle: "bi-record-circle", geometries: "bi-hexagon-fill", line: "bi-slash-lg", pen: "bi-pencil-fill", point: "bi-circle-fill", polygon: "bi-octagon", symbols: "bi-circle-square"}] - The icons for draw buttons.
 * @vue-prop {String[]} [drawTypes=["pen", "geometries", "symbols"]] - The drawing types.
 * @vue-prop {Object[]} [drawTypeLabels=[{type: "pen", label: "Free form"}, {type: "geometries", label: "Rectangle"}] - The drawing type labels.
 * @vue-prop {String} [selectedDrawType=""] - The selected draw type.
 * @vue-prop {String} [selectedDrawTypeMain=""] - The selected draw type main.
 * @vue-prop {String} [selectedInteraction="draw"] - The selected interaction.
 * @vue-prop {Function} setSelectedDrawType - Setter for selected draw type.
 * @vue-prop {Function} [setSelectedDrawTypeMain=null] - Setter for selected draw type main.
 * @vue-prop {Function} [setSelectedInteraction=null] - Setter for selected interaction.
 * @vue-prop {ol/source/Vector} source - The vector source for drawings.
 * @vue-prop {Boolean} [shouldEmitEvents =false] - Flag to indicate if in modeler3D mode.
 * @vue-data {ol/interaction/Draw} currentDrawInteraction - The current draw interaction.
 */
export default {
    name: "DrawTypes",
    components: {
        IconButton
    },
    props: {
        circleOptions: {
            type: Object,
            default () {
                return {
                    innerRadius: 0,
                    interactive: true,
                    outerRadius: 0,
                    unit: "m"
                };
            }
        },
        currentLayout: {
            type: Object,
            required: true
        },
        currentLayoutOuterCircle: {
            type: Object,
            default () {
                return {};
            }
        },
        drawIcons: {
            type: Object,
            default () {
                return {
                    box: "bi-square",
                    circle: "bi-circle",
                    doubleCircle: "bi-record-circle",
                    geometries: "bi-hexagon-fill",
                    line: "bi-slash-lg",
                    pen: "bi-pencil-fill",
                    point: "bi-circle-fill",
                    polygon: "bi-octagon",
                    symbols: "bi-circle-square"
                };
            }
        },
        drawTypes: {
            type: Array,
            default () {
                return ["pen", "geometries", "symbols"];
            }
        },
        drawTypeLabels: {
            type: Array,
            default () {
                return [];
            }
        },
        selectedDrawType: {
            type: String,
            default () {
                return "";
            }
        },
        selectedDrawTypeMain: {
            type: String,
            default () {
                return "";
            }
        },
        selectedInteraction: {
            type: String,
            default () {
                return "draw";
            }
        },
        setSelectedDrawType: {
            type: Function,
            required: true
        },
        setSelectedDrawTypeMain: {
            type: Function,
            default () {
                return null;
            }
        },
        setSelectedInteraction: {
            type: Function,
            default () {
                return null;
            }
        },
        source: {
            type: Object,
            required: true
        },
        shouldEmitEvents: {
            type: Boolean,
            default: false
        },
        textLabels: {
            type: Boolean,
            default: false
        },
        drawLayout: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    emits: ["drawstart", "drawend", "start-drawing", "stop-drawing", "circle-radius"],
    data () {
        return {
            currentDrawInteraction: null
        };
    },
    computed: {
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters("Modules/Draw", ["symbolList"]),
        ...mapState("Modules/Draw", ["drawTypesGeometrie", "drawTypesMain", "drawTypesSymbols", "buttonsDisabled", "drawSymbolImgPath"])
    },
    watch: {
        "circleOptions.interactive" () {
            if (this.selectedDrawType === "circle" || this.selectedDrawType === "doubleCircle") {
                if (this.currentDrawInteraction !== null) {
                    this.removeInteraction(this.currentDrawInteraction);
                    this.regulateDrawInteraction(this.selectedDrawType);
                }
            }
        },
        currentLayout (currentLayout) {
            drawInteraction.setStyleObject(currentLayout);

            if (this.selectedDrawType === "writeText") {
                drawInteraction.setStyleObject(currentLayout);
            }
        },
        currentLayoutOuterCircle (currentLayoutOuterCircle) {
            drawInteraction.setStyleObject(currentLayoutOuterCircle, true);
        },
        selectedInteraction (selectedInteraction) {
            if (selectedInteraction !== "draw") {
                if (typeof this.setSelectedDrawTypeMain === "function") {
                    this.setSelectedDrawTypeMain("");
                    this.setSelectedDrawType("");
                    this.removeInteraction(this.currentDrawInteraction);
                    this.currentDrawInteraction = null;
                }
            }
        }
    },
    mounted () {
        drawInteraction.setStyleObject(this.currentLayout);
        if (Object.keys(this.currentLayoutOuterCircle).length > 0) {
            drawInteraction.setStyleObject(this.currentLayoutOuterCircle, true);
        }

        this.startDrawingInitial();
        this.symbolList.forEach(symbol => {
            this.addDrawTypeSymbol(symbol.id);
        });
    },
    unmounted () {
        this.removeInteraction(this.currentDrawInteraction);
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/Draw", ["setCircleOptions", "addDrawTypeSymbol"]),

        /**
         * Start drawing initial, if a selectedDrawType is specified.
         * @returns {void}
         */
        startDrawingInitial () {
            if (this.selectedDrawType !== "") {
                if (this.selectedDrawTypeMain === "") {
                    const selectedDrawType = this.selectedDrawType;

                    this.setSelectedDrawType("");

                    nextTick(() => {
                        this.regulateInteraction(selectedDrawType);
                    });
                }
                else if (this.selectedDrawType === this.selectedDrawTypeMain) {
                    this.regulateDrawInteraction(this.selectedDrawType);
                }
            }
        },

        /**
         * Regulate the interaction.
         * @param {String} drawType The current draw type.
         * @returns {void}
         */
        regulateInteraction (drawType) {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("draw");
            }

            if (typeof this.setSelectedDrawTypeMain === "function" && this.drawTypes.includes(drawType)) {
                this.setSelectedDrawTypeMain(this.selectedDrawTypeMain !== drawType ? drawType : "");
                this.setSelectedDrawType("");
            }

            this.removeInteraction(this.currentDrawInteraction);

            if (this.selectedDrawType === drawType) {
                this.setSelectedDrawType("");
            }
            else {
                this.regulateDrawInteraction(drawType);
            }

            if (this.shouldEmitEvents) {
                this.$emit("stop-drawing");

                if (this.selectedDrawType !== drawType) {
                    this.setSelectedDrawType(drawType);
                }

                this.$emit("start-drawing");
            }
            else if (this.selectedDrawType !== drawType) {
                this.setSelectedDrawType(drawType);
            }
        },

        /**
         * Regulate the draw interaction for valid draw types.
         * @param {String} drawType The current draw type.
         * @returns {void}
         */
        regulateDrawInteraction (drawType) {
            this.currentDrawInteraction = drawInteraction.createDrawInteraction(drawType, this.source, this.symbolList);
            let onGeometryChange;
            const {tooltipOverlay, tooltipElement} = createTooltipOverlay(),
                map = mapCollection.getMap("2D"),
                symbol = this.symbolList.find(val => val.id === drawType);

            tooltipElement.innerHTML = "";
            tooltipElement.style.display = "none";

            map.addOverlay(tooltipOverlay);
            map.on("pointermove", (event) => {
                if (event.dragging) {
                    return;
                }

                const coordinate = event.coordinate;

                tooltipOverlay.setPosition(coordinate);
            });

            if (this.currentDrawInteraction !== null) {
                this.currentDrawInteraction.on("drawstart", (evt) => {
                    this.$emit("drawstart", evt);

                    if (["circle", "box", "line", "polygon", "square"].includes(drawType)) {
                        tooltipElement.style.display = "block";
                        const geometry = evt.feature.getGeometry();


                        onGeometryChange = () => {
                            if (drawType === "circle") {
                                let radius = geometry.getRadius();

                                radius = Math.round(radius);
                                this.setCircleOptions({innerRadius: radius});
                                const formattedRadius = radius.toLocaleString("de-DE");

                                tooltipElement.innerHTML = `${this.$t("common:shared.modules.draw.drawSettingsCircle.radii.radius")}: ${formattedRadius}m`;
                                this.$emit("circle-radius", radius);
                            }
                            if (drawType === "box" || drawType === "polygon" || drawType === "square") {

                                const coordinates = geometry.getCoordinates()[0],
                                    width = Math.abs(coordinates[1][0] - coordinates[0][0]),
                                    height = Math.abs(coordinates[2][1] - coordinates[1][1]),
                                    area = Math.round(geometry.getArea()),
                                    formattedWidth = Math.round(width).toLocaleString("de-DE"),
                                    formattedHeight = Math.round(height).toLocaleString("de-DE"),
                                    formattedArea = area.toLocaleString("de-DE");

                                if (drawType === "box" || drawType === "square") {
                                    tooltipElement.innerHTML = `${this.$t("common:shared.modules.draw.drawLayout.area")}: ${formattedArea}m²<br>${this.$t("common:shared.modules.draw.drawLayout.width")}: ${formattedWidth}m<br>${this.$t("common:shared.modules.draw.drawLayout.height")}: ${formattedHeight}m`;
                                }
                                else {
                                    tooltipElement.innerHTML = `${this.$t("common:shared.modules.draw.drawLayout.area")}: ${formattedArea}m²`;
                                }

                            }
                            if (drawType === "line") {
                                const length = geometry.getLength();

                                tooltipElement.innerHTML = `${this.$t("common:shared.modules.draw.drawLayout.length")}: ${Math.round(length)}m`;

                            }
                        };

                        geometry.on("change", onGeometryChange);

                    }
                    else if (symbol && symbol.type === "image") {
                        const iconSrc = symbol.value.startsWith("/")
                            ? symbol.value
                            : `${this.drawSymbolImgPath}${symbol.value}`;

                        evt.feature.setStyle(new Style({
                            image: new Icon({
                                src: iconSrc,
                                scale: symbol.scale || 1,
                                anchor: [0.5, 1]
                            })
                        }));
                    }
                });
                this.currentDrawInteraction.on("drawend", (evt) => {
                    tooltipElement.style.display = "none";
                    this.$emit("drawend", evt);

                    if (["circle", "box", "line", "polygon"].includes(drawType)) {
                        const geometry = evt.feature.getGeometry();

                        if (drawType === "circle") {
                            let radius = geometry.getRadius();

                            radius = Math.round(radius);

                            this.$emit("circle-radius", radius);
                            tooltipElement.innerHTML = "";
                            tooltipOverlay.setPosition(undefined);
                            geometry.un("change", onGeometryChange);
                        }
                    }
                });
                if (drawType === "circle" || drawType === "doubleCircle") {
                    this.regulateStaticCircleInteraction(drawType);
                }

                this.addInteraction(this.currentDrawInteraction);
                this.setSelectedDrawType(drawType);
            }
        },

        /**
         * Regulate the draw interactions for static circles.
         * @param {String} drawType The current draw type.
         * @returns {void}
         */
        regulateStaticCircleInteraction (drawType) {
            drawInteraction.drawCircle(this.currentDrawInteraction, drawType, this.projection, this.source, this.circleOptions);
        },

        /**
         * Returns the label of the button type.
         * @param {String} drawType - The type of the button.
         * @returns {String} - The Label of the button.
         */
        getButtonLabel (drawType) {
            if (this.textLabels) {
                if (!drawType || typeof drawType !== "string") {
                    return "";
                }
                const labelEntry = this.drawTypeLabels.find(label => label.type === drawType),
                    drawTypesGeometrie = this.drawTypesGeometrie,
                    drawTypesMain = this.drawTypesMain,
                    drawTypesSymbols = this.drawTypesSymbols,
                    allDrawTypes = [...drawTypesGeometrie, ...drawTypesMain, ...drawTypesSymbols];

                if (labelEntry && labelEntry.label) {
                    return this.$t(labelEntry.label) || "";
                }
                if (allDrawTypes.includes(drawType)) {
                    return this.getDrawTypeName(drawType);
                }
                return "";
            }
            if (this.drawTypeLabels.length === 0 || typeof drawType !== "string" || drawType === "") {
                return "";
            }

            let label = "";

            for (let i = 0; i < this.drawTypeLabels.length; i++) {
                if (this.drawTypeLabels[i].type === drawType) {
                    label = this.drawTypeLabels[i].label;
                    break;
                }
            }

            return this.$t(label);
        },
        /**
         * Returns name of a drawType.
         * @param {String} id - ID of drawType.
         * @returns {String} - Translation of drawType or ID if symbol from symbolList in config.
         */
        getDrawTypeName (id) {
            const symbol = this.symbolList.find(symbolId => symbolId.id === id);

            if (symbol) {
                return symbol.id;
            }

            return this.$t(`common:shared.modules.draw.drawTypes.${id}`);
        }

    }
};
</script>

<template>
    <IconButton
        v-for="drawType in drawTypes"
        :id="'draw-' + drawType"
        :key="drawType"
        :aria="getDrawTypeName(drawType)"
        :class-array="[
            'btn-secondary',
            'icon-button-size',
            $attrs,
            selectedDrawType === drawType || selectedDrawTypeMain === drawType ? 'active': ''
        ]"
        :disabled="buttonsDisabled"
        :interaction="(event) => regulateInteraction(drawType)"
        :icon="drawIcons[drawType] || 'bi-circle-square'"
        :label="getButtonLabel(drawType)"
        class="d-flex align-items-center"
        :draw-layout="drawLayout"
    />
</template>

<style lang="scss">

div.draw-tooltip {
    background-color: $white;;
    color: $black;
    padding: 2px 4px;
    border: 1px solid $black;;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    box-shadow: 0px 4px 6px $tool_box_shadow;
    pointer-events: none;
}

</style>

