<script>
import drawInteraction from "@masterportal/masterportalapi/src/maps/interactions/drawInteraction.js";
import handleDrawEvent from "../js/handleDrawEvent.js";
import {mapActions, mapGetters} from "vuex";
import IconButton from "../../buttons/components/IconButton.vue";
import {nextTick} from "vue";
import {createDrawInteractionContext, initializeTooltipElement, registerPointerMoveTooltip, isMeasurementDrawType, isStaticCircleDrawType, applyImageSymbolStyle, discardNextDrawnFeature} from "../js/drawInteractionHelpers.js";
import {registerMeasurementChangeListener, unregisterMeasurementChangeListener, shouldDiscardEmptyTextFeature, handleCircleMeasurementDrawEnd} from "../js/drawInteractionEventHandlers.js";
import {clearDrawInteractionListenerKeys, clearMeasurementListenerState, clearPointerListenerAndOverlay} from "../js/drawInteractionLifecycleHelpers.js";

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
 * @vue-prop {String[]} [drawTypesGeometrie=["line", "box", "polygon", "circle", "doubleCircle", "square"]] - The available geometry draw types (used for label resolution).
 * @vue-prop {String[]} [drawTypesMain=["pen", "writeText", "geometries", "symbols"]] - The top-level draw type categories (used for label resolution).
 * @vue-prop {String[]} [drawTypesSymbols=[]] - The available symbol draw types (used for label resolution).
 * @vue-prop {Object[]} [iconList=[]] - The list of symbol icon definitions from the config.
 * @vue-prop {Object} [tooltipStyle={}] - Optional inline style map for measurement tooltip.
 * @vue-prop {Boolean} [buttonsDisabled=false] - Whether all draw type buttons are disabled.
 * @vue-prop {function(string): void} setSelectedDrawType - Setter for selected draw type.
 * @vue-prop {function(string): void} [setSelectedDrawTypeMain=null] - Setter for selected draw type main.
 * @vue-prop {function(string): void} [setSelectedInteraction=null] - Setter for selected interaction.
 * @vue-prop {ol/source/Vector} source - The vector source for drawings.
 * @vue-prop {Boolean} [shouldEmitEvents=false] - Flag to indicate if in modeler3D mode.
 * @vue-prop {function(string): void} [addDrawTypeSymbol] - Adds a symbol draw type to the store.
 * @vue-prop {function(number): void} [incrementIdCounter] - Increments the feature id counter in the store.
 * @vue-prop {function(number): void} [setLineLength] - Sets the current drawn line length in the store.
 * @vue-prop {Function} [setSelectedSymbol] - Sets the currently selected symbol in the store.
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
        },
        buttonVariant: {
            type: String,
            default () {
                return "btn-primary";
            }
        },
        drawTypesGeometrie: {
            type: Array,
            default () {
                return ["line", "box", "polygon", "circle", "doubleCircle", "square"];
            }
        },
        drawTypesMain: {
            type: Array,
            default () {
                return ["pen", "writeText", "geometries", "symbols"];
            }
        },
        drawTypesSymbols: {
            type: Array,
            default () {
                return [];
            }
        },
        iconList: {
            type: Array,
            default () {
                return [];
            }
        },
        tooltipStyle: {
            type: Object,
            default () {
                return {};
            }
        },
        buttonsDisabled: {
            type: Boolean,
            default: false
        },
        addDrawTypeSymbol: {
            type: Function,
            default () {
                return () => { /* noop */ };
            }
        },
        incrementIdCounter: {
            type: Function,
            default () {
                return () => { /* noop */ };
            }
        },
        setLineLength: {
            type: Function,
            default () {
                return () => { /* noop */ };
            }
        },
        setSelectedSymbol: {
            type: Function,
            default () {
                return () => { /* noop */ };
            }
        }
    },
    emits: ["drawstart", "drawend", "start-drawing", "stop-drawing", "circle-radius"],
    data () {
        return {
            currentDrawInteraction: null,
            tooltipElement: null,
            pointerMoveKey: null,
            tooltipOverlay: null,
            onGeometryChange: null,
            activeMeasurementGeometry: null,
            drawStartKey: null,
            drawEndKey: null
        };
    },
    computed: {
        ...mapGetters("Maps", ["projection"])
    },
    watch: {
        circleOptions: {
            deep: true,
            handler () {
                this.refreshCircleDrawInteraction();
            }
        },
        currentLayout (currentLayout) {
            drawInteraction.setStyleObject(currentLayout);

            if (this.selectedDrawType === "writeText" && this.currentDrawInteraction) {
                this.currentDrawInteraction.getOverlay().setStyle(drawInteraction.getTextStyle() ?? []);
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
                    this.cleanDrawInteractionListeners();
                    this.removeInteraction(this.currentDrawInteraction);
                    this.currentDrawInteraction = null;
                }
            }
        },
        source (newSource, oldSource) {
            if (newSource !== oldSource && this.selectedDrawType !== "") {
                this.cleanDrawInteractionListeners();
                this.removeInteraction(this.currentDrawInteraction);
                this.regulateDrawInteraction(this.selectedDrawType);
            }
        }
    },
    mounted () {
        drawInteraction.setStyleObject(this.currentLayout);
        if (Object.keys(this.currentLayoutOuterCircle).length > 0) {
            drawInteraction.setStyleObject(this.currentLayoutOuterCircle, true);
        }

        this.startDrawingInitial();
        this.iconList?.forEach(symbol => {
            this.addDrawTypeSymbol(symbol.id);
        });
    },
    unmounted () {
        this.cleanDrawInteractionListeners();
        this.removeInteraction(this.currentDrawInteraction);
        if (this.tooltipElement) {
            this.tooltipElement.style.display = "none";
        }
        this.cleanListenerAndOverlay();
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),

        /**
         * Removes registered draw interaction listeners and measurement geometry listener.
         *
         * This prevents stale callbacks when interactions are removed or replaced before
         * their natural `drawend` lifecycle is reached.
         * @returns {void}
         */
        cleanDrawInteractionListeners () {
            Object.assign(this, clearDrawInteractionListenerKeys(this.drawStartKey, this.drawEndKey));
            Object.assign(this, clearMeasurementListenerState(this.activeMeasurementGeometry, this.onGeometryChange));
        },

        /**
         * Recreates the current draw interaction when circle options change.
         * @returns {void}
         */
        refreshCircleDrawInteraction () {
            if (isStaticCircleDrawType(this.selectedDrawType) && this.currentDrawInteraction !== null) {
                this.cleanDrawInteractionListeners();
                this.removeInteraction(this.currentDrawInteraction);
                this.regulateDrawInteraction(this.selectedDrawType);
            }
        },

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
         * Switches the active draw mode and synchronizes interaction-related UI and state.
         *
         * Behavior:
         * - Ensures the global interaction mode is set to "draw" when a setter is provided.
         * - Updates the main draw type group selection (`selectedDrawTypeMain`) for top-level
         *   categories and resets the concrete sub-type selection before recreation.
         * - Removes the currently active draw interaction and hides the tooltip, if present.
         * - Toggles off the current draw type when the same type is selected again and clears
         *   the selected symbol.
         * - Otherwise creates and activates a new draw interaction for the requested type.
         * - In event-emitting mode (`shouldEmitEvents`), emits `stop-drawing` before switching
         *   and `start-drawing` after the switch while keeping selected draw type in sync.
         *
         * @param {String} drawType The draw type to activate or toggle off.
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

            this.cleanDrawInteractionListeners();
            this.removeInteraction(this.currentDrawInteraction);
            if (this.tooltipElement) {
                this.tooltipElement.style.display = "none";
            }

            if (this.selectedDrawType === drawType) {
                this.setSelectedDrawType("");
                this.setSelectedSymbol(null);
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
         * Removes tooltip-related listeners and overlays from the map.
         * @returns {void}
         */
        cleanListenerAndOverlay () {
            Object.assign(this, clearPointerListenerAndOverlay(this.pointerMoveKey, this.tooltipOverlay));
        },

        /**
         * Stores and resets the tooltip state for the active draw interaction.
         * @param {HTMLElement} tooltipElement The tooltip element.
         * @param {ol/Overlay} tooltipOverlay The tooltip overlay.
         * @returns {void}
         */
        initializeTooltipOverlay (tooltipElement, tooltipOverlay) {
            this.tooltipElement = tooltipElement;
            this.tooltipOverlay = tooltipOverlay;
            initializeTooltipElement(tooltipElement);
        },

        /**
         * Registers the drawstart handler for the current interaction.
         * @param {String} drawType The current draw type.
         * @param {HTMLElement} tooltipElement The tooltip element.
         * @param {?Object} symbol The symbol matching the draw type.
         * @returns {void}
         */
        registerDrawStartHandler (drawType, tooltipElement, symbol) {
            this.drawStartKey = this.currentDrawInteraction.on("drawstart", (evt) => {
                this.$emit("drawstart", evt);

                if (isMeasurementDrawType(drawType)) {
                    this.handleMeasurementDrawStart(drawType, evt, tooltipElement);
                }
                else if (symbol && symbol.type === "image") {
                    applyImageSymbolStyle(evt.feature, symbol);
                }

                if (drawType === "square" && this.currentLayout.squareMethod === "defined") {
                    this.currentDrawInteraction.finishDrawing();
                }
            });
        },

        /**
         * Prepares tooltip updates for measurement-based draw types.
         * @param {String} drawType The current draw type.
         * @param {Object} evt The drawstart event.
         * @param {HTMLElement} tooltipElement The tooltip element.
         * @returns {void}
         */
        handleMeasurementDrawStart (drawType, evt, tooltipElement) {
            tooltipElement.style.display = "block";
            const geometry = evt.feature.getGeometry();

            this.onGeometryChange = registerMeasurementChangeListener(
                drawType,
                geometry,
                tooltipElement,
                key => this.$t(key),
                this.setLineLength,
                radius => this.$emit("circle-radius", radius)
            );

            this.activeMeasurementGeometry = geometry;
        },

        /**
         * Registers the drawend handler for the current interaction.
         * @param {String} drawType The current draw type.
         * @param {HTMLElement} tooltipElement The tooltip element.
         * @param {ol/Overlay} tooltipOverlay The tooltip overlay.
         * @returns {void}
         */
        registerDrawEndHandler (drawType, tooltipElement, tooltipOverlay) {
            this.drawEndKey = this.currentDrawInteraction.on("drawend", (evt) => {
                tooltipElement.style.display = "none";

                if (shouldDiscardEmptyTextFeature(drawType, this.currentLayout)) {
                    discardNextDrawnFeature(this.source);
                    return;
                }

                this.$emit("drawend", evt);

                if (isMeasurementDrawType(drawType)) {
                    this.handleMeasurementDrawEnd(drawType, evt, tooltipElement, tooltipOverlay);
                }
                if (this.drawLayout) {
                    this.handleDrawLayoutCompletion(drawType, evt);
                }
            });
        },

        /**
         * Cleans up measurement listeners and circle-specific tooltip state after draw end.
         * @param {String} drawType The current draw type.
         * @param {Object} evt The drawend event.
         * @param {HTMLElement} tooltipElement The tooltip element.
         * @param {ol/Overlay} tooltipOverlay The tooltip overlay.
         * @returns {void}
         */
        handleMeasurementDrawEnd (drawType, evt, tooltipElement, tooltipOverlay) {
            const geometry = evt.feature.getGeometry();

            unregisterMeasurementChangeListener(geometry, this.onGeometryChange);
            this.onGeometryChange = null;
            this.activeMeasurementGeometry = null;

            if (drawType === "circle") {
                handleCircleMeasurementDrawEnd(
                    geometry,
                    tooltipElement,
                    tooltipOverlay,
                    radius => this.$emit("circle-radius", radius)
                );
            }
        },

        /**
         * Finalizes layout-specific handling after a feature has been drawn.
         * @param {String} drawType The current draw type.
         * @param {Object} evt The drawend event.
         * @returns {void}
         */
        handleDrawLayoutCompletion (drawType, evt) {
            handleDrawEvent(evt);
            if (drawType === "doubleCircle") {
                this.incrementIdCounter(2);
            }
            else {
                this.incrementIdCounter(1);
            }
        },

        /**
         * Adds the current draw interaction to the map and updates the selection state.
         * @param {String} drawType The current draw type.
         * @returns {void}
         */
        activateDrawInteraction (drawType) {
            this.addInteraction(this.currentDrawInteraction);
            this.setSelectedDrawType(drawType);
        },

        /**
         * Creates and activates a new draw interaction for the requested draw type.
         *
         * Flow:
         * - Clears previous tooltip listener/overlay state to avoid stale map bindings.
         * - Builds a fresh interaction context (interaction, map, matching symbol, tooltip
         *   element, tooltip overlay).
         * - Stores the new interaction and tooltip references on the component instance.
         * - Registers pointer-move tooltip updates on the map.
         * - Synchronizes the selected symbol in store state (`null` when no symbol matches).
         * - Wires `drawstart` and `drawend` handlers for measurement updates and feature
         *   finalization.
         * - Applies static circle setup for circle-based draw types.
         * - Adds the interaction to the map and updates selected draw type state.
         *
         * If interaction creation returns `null`, no handlers are registered and no
         * interaction is activated.
         *
         * @param {String} drawType The draw type to initialize.
         * @returns {void}
         */
        regulateDrawInteraction (drawType) {
            this.cleanListenerAndOverlay();

            const {currentDrawInteraction, map, symbol, tooltipElement, tooltipOverlay} = createDrawInteractionContext(drawType, this.source, this.iconList, this.tooltipStyle);

            this.currentDrawInteraction = currentDrawInteraction;
            this.initializeTooltipOverlay(tooltipElement, tooltipOverlay);
            this.pointerMoveKey = registerPointerMoveTooltip(map, tooltipOverlay);
            this.setSelectedSymbol(symbol || null);

            if (currentDrawInteraction !== null) {
                this.registerDrawStartHandler(drawType, tooltipElement, symbol);
                this.registerDrawEndHandler(drawType, tooltipElement, tooltipOverlay);
                if (isStaticCircleDrawType(drawType)) {
                    this.regulateStaticCircleInteraction(drawType);
                }

                this.activateDrawInteraction(drawType);
            }
        },

        /**
         * Regulate the draw interactions for static circles.
         * @param {String} drawType The current draw type.
         * @returns {void}
         */
        regulateStaticCircleInteraction (drawType) {
            const options = {...this.circleOptions};

            drawInteraction.drawCircle(this.currentDrawInteraction, drawType, this.projection, this.source, options);
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
         * @returns {String} - Translation of drawType or ID if symbol from iconList in config.
         */
        getDrawTypeName (id) {
            const symbol = this.iconList?.find(symbolId => symbolId.id === id);

            if (symbol) {
                return symbol.id;
            }

            return this.$t(`common:shared.modules.draw.drawTypes.${id}`);
        },

        /**
         * Sets focus to the first enabled button in this DrawTypes group.
         * @public
         * @returns {void}
         */
        focus () {
            const buttons = this.$refs.drawButtons;

            if (Array.isArray(buttons)) {
                const firstEnabled = buttons.find(btn => !btn.$props.disabled);

                firstEnabled?.focus();
            }
        }

    }
};
</script>

<template>
    <IconButton
        v-for="drawType in drawTypes"
        :id="'draw-' + drawType"
        ref="drawButtons"
        :key="drawType"
        :aria="getDrawTypeName(drawType)"
        :class-array="[
            buttonVariant,
            'icon-button-size',
            $attrs,
            selectedDrawType === drawType || selectedDrawTypeMain === drawType ? 'active': ''
        ]"
        :disabled="buttonsDisabled"
        :interaction="(event) => regulateInteraction(drawType)"
        :icon="drawIcons[drawType] || 'bi-circle-square'"
        :label="getButtonLabel(drawType)"
        class="d-flex align-items-center"
    />
</template>

<style lang="scss">

div.draw-tooltip {
    background-color: $white;
    color: $black;
    padding: 2px 4px;
    border: 1px solid $black;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    box-shadow: 0px 4px 6px $tool_box_shadow;
    pointer-events: none;
}

</style>

<style lang="scss" scoped>
:deep(.btn-primary.active) {
    background-color: $dark_blue;
    border-color: $dark_blue;
    color: $white;
}
</style>

