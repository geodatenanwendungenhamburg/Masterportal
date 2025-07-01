import Feature from "ol/Feature.js";
import initialState from "./stateWfst.js";
import {defaultInteractionConfig} from "../constantsWfst.js";
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import deepCopy from "@shared/js/utils/deepCopy.js";

const getters = {
    ...generateSimpleGetters(initialState),
    /**
     * Interaction configuration regarding which interactions
     * are allowed by the currently selected layer.
     *
     * @param {Object} state Local vuex state.
     * @param {Object} getters Local vuex getters.
     * @param {String} getters.currentLayerId Id of the currently selected layer
     * @returns {Object} The interaction configuration for the currently selected layer.
     */
    currentInteractionConfig (state, {currentLayerId}) {
        const configuration = deepCopy(defaultInteractionConfig);

        ["LineString", "Point", "Polygon", "MultiPolygon", "update", "multiUpdate", "delete"].forEach(val => {
            const isGeometryConfiguration = ["LineString", "Point", "Polygon", "MultiPolygon"].includes(val);
            let interactionConfiguration,
                layerConfiguration = null;

            if (isGeometryConfiguration) {
                interactionConfiguration = state[(val.endsWith("String") ? val.replace("String", "") : val).toLowerCase() + "Button"];
            }
            else {
                interactionConfiguration = state[val];
            }
            if (!interactionConfiguration) {
                return;
            }
            if (typeof interactionConfiguration === "string") {
                configuration[val].text = interactionConfiguration;
                configuration[val].available = true;
                return;
            }
            if (typeof interactionConfiguration === "boolean") {
                configuration[val].available = true;
                return;
            }
            layerConfiguration = interactionConfiguration.find(({layerId}) => layerId === currentLayerId);
            if (layerConfiguration === undefined) {
                return;
            }
            configuration[val].available = layerConfiguration.available;
            if (layerConfiguration.text !== undefined) {
                configuration[val].text = layerConfiguration.text ? layerConfiguration.text : configuration[val].text;
            }
            configuration[val].icon = layerConfiguration.icon ? layerConfiguration.icon : configuration[val].icon;
            if (isGeometryConfiguration) {
                configuration[val].multi = layerConfiguration.multi ? layerConfiguration.multi : false;
            }
        });
        return configuration;
    },
    /**
     * Gets current layer id
     *
     * @param {Object} state Local vuex state.
     * @returns {String} Layer id.
     */
    currentLayerId (state) {
        return state.layerInformation[state.currentLayerIndex]?.id;
    },
    /**
     * Gets select disabled status
     *
     * @param {Number} currentLayerIndex Layer Index
     * @param {Boolean} showInteractionsButtons Interaction Button status
     * @returns {String} Layer id.
     */
    layerSelectDisabled ({currentLayerIndex}, {showInteractionsButtons}) {
        return currentLayerIndex === -1 || !showInteractionsButtons;
    },
    /**
     * Returns a function which checks whether a feature is given
     * and an actual OL Feature as well whether all the required
     * values have been set by the user.
     *
     * @param {Object} state Local vuex state.
     * @returns {String} Validity function.
     */
    savingErrorMessage: state => feature => {
        const requiredPropertiesWithNoValue = state.featureProperties
            .filter(property => property.type !== "geometry"
                    && property.required
                    && [null, undefined, ""].includes(property.value)
            );

        if (!(feature instanceof Feature)) {
            return i18next.t("common:modules.wfst.error.noFeature");
        }
        if (requiredPropertiesWithNoValue.length > 0) {
            return i18next.t("common:modules.wfst.error.requiredPropertiesNotSet", {properties: requiredPropertiesWithNoValue.map(({label}) => label).join(", ")});
        }
        return "";
    },
    /**
     * Gets select interaction status
     *
     * @param {Object} state Local vuex state.
     * @returns {Boolean} Interaction Button status
     */
    showInteractionsButtons (state) {
        return [null, "delete", "update", "multiUpdate"].includes(state.selectedInteraction);
    }
};

export default getters;
