<script>
import {mapMutations} from "vuex";
import {mainMenu, secondaryMenu} from "@shared/js/utils/constants.js";
import {clampAndApplyWidth, dimensionValidator} from "@shared/modules/resize/js/resizeHandleHelper.js";

const handleSigns = {
          right: [1, 0],
          left: [-1, 0]
      },
      minDistanceBetweenMenus = 300;

export default {
    name: "ResizeHandle",
    props: {
        /**
         * Position of the handle element.
         */
        handlePosition: {
            type: String,
            default: "right",
            validator: value => ["right", "left"].includes(value)
        },
        minWidth: {
            type: Number,
            default: 0,
            validator: dimensionValidator
        },
        maxWidth: {
            type: Number,
            default: 1,
            validator: dimensionValidator
        },
        /**
         * Draggable element given directly.
         */
        targetElement: {
            type: String,
            default: ""
        },
        /**
         * Query Selector looking upwards for the resizable element.
         */
        targetSelector: {
            type: String,
            default: "parentNode"
        },
        /**
         * Defines which menu the resize handle belongs to.
         */
        side: {
            type: String,
            required: true,
            validator (value) {
                return value === mainMenu || value === secondaryMenu;
            }
        }
    },
    emits: ["endResizing", "leftScreen", "resizing", "startResizing"],
    data: () => ({
        boundOnMouseMove: null,
        boundOnMouseUp: null,
        boundOnWindowBlur: null,
        boundOnVisibilityChange: null,
        deltaCursorPosition: {x: 0, y: 0},
        initialCursorPosition: {x: 0, y: 0},
        isResizing: false,
        initialDimensions: {width: 0},
        touchStarted: false, // Flag to avoid ghost click event
        touchDevice: false,
        timeoutReference: null
    }),
    computed: {
        /**
         * @returns {Object} Event data containing cursor position, dimensions, and configuration for resize events.
         */
        eventData () {
            return {
                cursorClass: "ew-resize",
                deltaCursorPosition: this.deltaCursorPosition,
                handleElement: this.handleElement,
                handlePosition: this.handlePosition,
                initialCursorPosition: this.initialCursorPosition,
                initialDimensions: this.initialDimensions,
                minWidth: this.minWidth,
                maxWidth: this.maxWidth
            };
        },
        /**
         * @returns {HTMLElement | null} Resizable DOM element, if found.
         */
        handleElement () {
            if (this.targetElement !== "") {
                return document.querySelector(this.targetElement);
            }
            if (this.targetSelector === "parentNode") {
                return this.$el.parentNode;
            }
            const element = this.$el.closest(this.targetSelector);

            if (element === null) {
                console.warn("ResizeHandle: No target element found. Please verify your markup and selector. Currently defined target element selector:", this.targetSelector);
            }
            return element;
        },
        resizeEventNames () {
            return this.touchDevice
                ? {move: "touchmove", end: "touchend", cancel: "touchcancel"}
                : {move: "mousemove", end: "mouseup", cancel: null};
        }
    },
    watch: {
        /**
         * Adds or removes event listeners related to resizing.
         * @param {Boolean} newValue New value of isResizing.
         * @returns {void}
         */
        isResizing (newValue) {
            const {move, end, cancel} = this.resizeEventNames;

            if (newValue) {
                this.handleElement.classList.add("resize-handle-is-resizing");
                document.addEventListener(move, this.boundOnMouseMove);
                document.addEventListener(end, this.boundOnMouseUp);
                if (cancel) {
                    document.addEventListener(cancel, this.boundOnMouseUp);
                }
                window.addEventListener("blur", this.boundOnWindowBlur);
                document.addEventListener("visibilitychange", this.boundOnVisibilityChange);
                this.$emit("startResizing", this.eventData);
                document.querySelector("body").classList.add("resize-handle-is-resizing");
                return;
            }
            this.handleElement.classList.remove("resize-handle-is-resizing");
            document.removeEventListener(move, this.boundOnMouseMove);
            document.removeEventListener(end, this.boundOnMouseUp);
            if (cancel) {
                document.removeEventListener(cancel, this.boundOnMouseUp);
            }
            window.removeEventListener("blur", this.boundOnWindowBlur);
            document.removeEventListener("visibilitychange", this.boundOnVisibilityChange);
            this.$emit("endResizing", this.eventData);
            document.querySelector("body").classList.remove("resize-handle-is-resizing");
        }
    },
    mounted () {
        if (this.$el.parentNode !== null) {
            this.saveInitialDimensions();
            this.setNewSize();
        }
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnWindowBlur = this.onWindowBlur.bind(this);
        this.boundOnVisibilityChange = this.onVisibilityChange.bind(this);
    },
    beforeUnmount () {
        const {move, end, cancel} = this.resizeEventNames;

        document.removeEventListener(move, this.boundOnMouseMove);
        document.removeEventListener(end, this.boundOnMouseUp);
        if (cancel) {
            document.removeEventListener(cancel, this.boundOnMouseUp);
        }
        window.removeEventListener("blur", this.boundOnWindowBlur);
        document.removeEventListener("visibilitychange", this.boundOnVisibilityChange);
    },
    methods: {
        ...mapMutations("Modules/ResizeHandle", ["setMainMenuWidth", "setSecondaryMenuWidth"]),

        moveHandle (key) {
            if (key === "ArrowLeft" || key === "ArrowRight") {
                const disposition = (key === "ArrowLeft" ? 1 : -1) * (this.side === mainMenu ? -1 : 1) * 10;

                clampAndApplyWidth(
                    this,
                    this.handleElement.offsetWidth + disposition,
                    minDistanceBetweenMenus
                );
            }
        },
        onMouseDown (event) {
            if (event.button !== 0) {
                return;
            }
            if (this.touchStarted) {
                return;
            }
            this.touchDevice = false;
            this.startResizing(event);
        },
        /**
         * Tracks cursor movement during resizing and updates width.
         * Stops if cursor leaves the window.
         * @param {MouseEvent | TouchEvent} event Event triggering the resizing of the window.
         * @returns {void}
         */
        onMouseMove (event) {
            const clientX = event.touches ? event.touches[0].clientX : event.clientX,
                  clientY = event.touches ? event.touches[0].clientY : event.clientY,
                  deltaX = clientX - this.initialCursorPosition.x,
                  deltaY = clientY - this.initialCursorPosition.y;

            if (!event.touches && event.buttons === 0) {
                this.onMouseUp();
                return;
            }

            if (clientX < 0 || clientX > window.innerWidth || clientY < 0 || clientY > window.innerHeight) {
                this.$emit("leftScreen", this.eventData);
                this.isResizing = false;
            }

            this.deltaCursorPosition.x = Math.round(deltaX);
            this.deltaCursorPosition.y = Math.round(deltaY);

            this.setNewSize();

            this.$emit("resizing", this.eventData);
        },
        onMouseUp () {
            this.isResizing = false;
        },
        onWindowBlur () {
            if (!this.isResizing) {
                return;
            }
            this.onMouseUp();
        },
        onVisibilityChange () {
            if (!this.isResizing || document.visibilityState === "visible") {
                return;
            }
            this.onMouseUp();
        },
        onTouchStart (event) {
            this.setTouchStarted();
            this.touchDevice = true;
            this.startResizing(event);
        },
        /**
         * Saves initial cursor position. Used to calculate the cursor move distance while resizing.
         * @param {MouseEvent|TouchEvent} event mousedown or touchstart event.
         * @returns {void}
         */
        saveInitialCursorCoordinates (event) {
            this.initialCursorPosition.x = event.touches ? event.touches[0].clientX : event.clientX;
            this.initialCursorPosition.y = event.touches ? event.touches[0].clientY : event.clientY;
        },
        /**
         * Saves initial element width. Used to calculate the new width while resizing.
         * @returns {void}
         */
        saveInitialDimensions () {
            this.initialDimensions.width = this.handleElement.offsetWidth < this.minWidth ? this.minWidth : this.handleElement.offsetWidth;
            this.handleElement.style.width = this.initialDimensions.width;
        },
        /**
         * Applies new width to the resizable element.
         * Handle position (left/right) determines resize direction.
         * @returns {void}
         */
        setNewSize () {
            clampAndApplyWidth(
                this,
                this.initialDimensions.width + handleSigns[this.handlePosition][0] * this.deltaCursorPosition.x,
                minDistanceBetweenMenus
            );
        },
        /**
         * When using the mousedown event, a ghost click is triggered.
         * To prevent weird behaviour, a reference is saved to prevent additional clicks for a fixed time period.
         * @returns {void}
         */
        setTouchStarted () {
            this.touchStarted = true;
            clearTimeout(this.timeoutReference);
            this.timeoutReference = setTimeout(() => {
                this.touchStarted = false;
            }, 400);
        },
        startResizing (event) {
            event.preventDefault();
            if (this.handleElement === null) {
                return;
            }
            this.saveInitialCursorCoordinates(event);
            this.saveInitialDimensions();
            this.isResizing = true;
        }
    }
};
</script>

<template>
    <button
        id="resize-handle"
        class="btn resize-handle"
        :class="[
            {'resize-handle-is-resizing': isResizing},
            'resize-handle-type-' + handlePosition,
            'resize-handle-cursor-ew-resize'
        ]"
        @focus="moveHandle"
        @keydown="moveHandle($event.key)"
        @mousedown="onMouseDown"
        @touchstart="onTouchStart"
    >
        <!-- TODO @focus with info element? -->
        <slot />
    </button>
</template>

<style lang="scss">
$handle_size: 6px;

.resize-handle {
    position: absolute;
    width: $handle_size;
    height: $handle_size;
    background-color: $white;
    padding: 3px;
    border: none;

    &-is-resizing * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none !important;
        transition: unset !important;
        user-select: none;
    }
    &-type {
        &-left {
            left: 0;
            height: 100%;
        }
        &-right {
            right: 0;
            height: 100%;
        }
    }
}

.resize-handle:focus, .resize-handle:hover, .resize-handle:active, .resize-handle:focus-within {
    background-color: $gray-400 !important;
    padding: 3px;
    border: none;
}

button:not(:disabled).resize-handle-cursor {
        &-ew-resize {
            cursor: ew-resize;
        }
}
</style>
