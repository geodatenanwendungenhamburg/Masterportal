import {getRenderPixel} from "ol/render";
import getPosition from "@shared/modules/layerSwiper/utils/getPosition";
import layerCollection from "@core/layers/js/layerCollection";

/**
 * The actions for the LayerSwiper.
 * @module modules/layerSwiper/store/actionsLayerSwiper
 */
const actions = {
    /**
     * Sets the position of the layerSwiper to state according to the x- or y-coordinate of the mousedown event
     * or adjusts it based on the direction of the key pressed by the state defined value.
     * @param {Object} context - The Vuex context object.
     * @param {Object} context.state - The Vuex state object.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {KeyboardEvent|MouseEvent} event - The DOM event.
     * @returns {void}
     */
    moveSwiper ({state, commit, dispatch}, event) {
        let position;

        if (state.splitDirection === "horizontal") {
            position = getPosition(event, state.valueY, state.currentTimeSliderObject.keyboardMovement, "vertical");
            commit("setLayerSwiperValueY", position);
            commit("setLayerSwiperStyleTop", position);
        }
        else {
            position = getPosition(event, state.valueX, state.currentTimeSliderObject.keyboardMovement, "horizontal");
            commit("setLayerSwiperValueX", position);
            commit("setLayerSwiperStyleLeft", position);
        }
        dispatch("updateMap");
    },

    /**
     * Updates the map so that the layer is displayed clipped again.
     * @param {Object} context - The Vuex context object.
     * @param {Object} context.state - The Vuex state object.
     * @param {Object} context.rootGetters - The Vuex root getters object.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @returns {void}
     */
    async updateMap ({state, rootGetters, dispatch}) {
        const targetLayer = layerCollection.getLayerById(state.targetLayerId),
            sourceLayer = layerCollection.getLayerById(state.sourceLayerId);

        if (!rootGetters["Modules/WmsTime/TimeSlider/playing"]) {
            await mapCollection.getMap(rootGetters["Maps/mode"]).render();
        }

        if (targetLayer && !targetLayer?._onPrerenderListener && !targetLayer?._onPostrenderListener) {
            targetLayer._onPrerenderListener = renderEvent => {
                dispatch("drawLayer", renderEvent);
            };

            targetLayer._onPostrenderListener = ({context}) => {
                context.restore();
            };

            targetLayer.getLayer().on("prerender", targetLayer._onPrerenderListener);
            targetLayer.getLayer().on("postrender", targetLayer._onPostrenderListener);
        }

        if (sourceLayer && !sourceLayer?._onPrerenderListener && !sourceLayer?._onPostrenderListener) {
            sourceLayer._onPrerenderListener = renderEvent => {
                dispatch("drawLayer", renderEvent);
            };

            sourceLayer._onPostrenderListener = ({context}) => {
                context.restore();
            };

            sourceLayer.getLayer().on("prerender", sourceLayer._onPrerenderListener);
            sourceLayer.getLayer().on("postrender", sourceLayer._onPostrenderListener);
        }
    },

    /**
 * Manipulates the width of each layer according to the position of the layerSwiper and the side of the layer.
 * @param {Object} context - The Vuex context object.
 * @param {Object} context.state - The Vuex state object.
 * @param {Object} context.rootGetters - The Vuex root getters object.
 * @param {ol.render.Event} renderEvent - The event object triggered on prerender.
 * @returns {void}
 */
    drawLayer ({state, rootGetters}, renderEvent) {
        if (!state.sourceLayerId && !state.targetLayerId) {
            return;
        }

        const {context} = renderEvent,
            mapSize = mapCollection.getMap(rootGetters["Maps/mode"]).getSize(),
            isSecondLayer = renderEvent.target.get("id").endsWith(rootGetters["Modules/WmsTime/layerAppendix"]);

        context.save();
        context.beginPath();

        if (state.splitDirection === "horizontal") {
            if (isSecondLayer) {
                context.moveTo(...getRenderPixel(renderEvent, [0, state.valueY]));
                context.lineTo(...getRenderPixel(renderEvent, [mapSize[0], state.valueY]));
                context.lineTo(...getRenderPixel(renderEvent, [mapSize[0], mapSize[1]]));
                context.lineTo(...getRenderPixel(renderEvent, [0, mapSize[1]]));
            }
            else {
                context.moveTo(...getRenderPixel(renderEvent, [0, 0]));
                context.lineTo(...getRenderPixel(renderEvent, [mapSize[0], 0]));
                context.lineTo(...getRenderPixel(renderEvent, [mapSize[0], state.valueY]));
                context.lineTo(...getRenderPixel(renderEvent, [0, state.valueY]));
            }
        }
        else if (state.splitDirection === "vertical") {
            if (isSecondLayer) {
                context.moveTo(...getRenderPixel(renderEvent, [state.valueX, 0]));
                context.lineTo(...getRenderPixel(renderEvent, [mapSize[0], 0]));
                context.lineTo(...getRenderPixel(renderEvent, [mapSize[0], mapSize[1]]));
                context.lineTo(...getRenderPixel(renderEvent, [state.valueX, mapSize[1]]));
            }
            else {
                context.moveTo(...getRenderPixel(renderEvent, [0, 0]));
                context.lineTo(...getRenderPixel(renderEvent, [state.valueX, 0]));
                context.lineTo(...getRenderPixel(renderEvent, [state.valueX, mapSize[1]]));
                context.lineTo(...getRenderPixel(renderEvent, [0, mapSize[1]]));
            }
        }
        context.closePath();
        context.clip();
    }
};

export default actions;
