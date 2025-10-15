import {Vector as VectorLayer} from "ol/layer";
import {Draw, Modify, Select, Translate} from "ol/interaction";
import VectorSource from "ol/source/Vector";
import {platformModifierKeyOnly, primaryAction, click} from "ol/events/condition";
import addFeaturePropertiesToFeature from "../js/addFeaturePropertiesToFeature";
import prepareFeaturePropertiesModule from "../js/prepareFeatureProperties";
import layerCollection from "@core/layers/js/layerCollection";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";
import DragBox from "ol/interaction/DragBox";
import store from "@appstore";
import {handleMultipolygon, buildMultipolygon, splitOuterFeatures} from "../js/handleMultipolygon";
import {nextTick} from "vue";

let drawInteraction,
    featureToDelete,
    drawLayer,
    modifyInteraction,
    modifyFeature,
    modifyFeatureArray = [],
    modifyFeatureSaveId,
    modifyFeatureSaveIdArray = [],
    selectInteraction,
    lassoInteraction,
    boxInteraction,
    translateInteraction,
    selectedFeatures;

const actions = {
    /**
     * Clears all map interactions and resets related variables.
     * @param {Object} dispatch - The dispatch object.
     * @returns {void}
     */
    clearInteractions ({dispatch, state}) {
        const map = mapCollection.getMap("2D");

        if (drawInteraction) {
            dispatch("Maps/removeInteraction", drawInteraction, {root: true});
        }
        if (modifyInteraction) {
            dispatch("Maps/removeInteraction", modifyInteraction, {root: true});
        }
        if (selectInteraction) {
            dispatch("Maps/removeInteraction", selectInteraction, {root: true});
        }
        if (translateInteraction) {
            dispatch("Maps/removeInteraction", translateInteraction, {root: true});
        }
        map.removeLayer(drawLayer);

        drawInteraction = undefined;
        modifyInteraction = undefined;
        selectInteraction?.getFeatures().clear();
        selectInteraction = undefined;
        boxInteraction?.setActive(false);
        lassoInteraction?.setActive(false);

        lassoInteraction = undefined;
        boxInteraction = undefined;
        translateInteraction = undefined;
        drawLayer = undefined;
        state.anyInputValue = {};
    },
    /**
     * Prepares Buttons and Fetches Layer Features on module startup. Buttons will be disabled until fetch is complete to ensure requirements are met before any transactions are possible.
     * @param {Function} context.dispatch - The dispatch function to trigger actions.
     * @param {Function} context.getters - The getters function to access state values.
     * @param {Function} context.commit - The commit function to trigger mutations.
     * @returns {void}
     */
    prepareEditButton ({dispatch, getters, commit}) {
        dispatch("clearInteractions");

        commit("setButtonsDisabled", true);

        store.watch(() => getters.featureProperties, featureProperties => {
            if (featureProperties.length) {
                commit("setButtonsDisabled", false);
            }
        }, {deep: true});
    },
    /**
     * Prepares everything so that the user can interact with features or draw features
     * to be able to send a transaction to the service.
     *
     * @param {Object} context - The context object.
     * @param {Function} context.dispatch - The dispatch function to trigger actions.
     * @param {Function} context.getters - The getters function to access state values.
     * @param {Function} context.rootGetters - The root getters function to access state values.
     * @param {Function} context.commit - The commit function to trigger mutations.
     * @param {("LineString"|"Point"|"Polygon"|"MultiPolygon"|"delete"|"update"|"multiUpdate")} interaction Identifier of the selected interaction.
     * @returns {void}
     */
    async prepareInteraction ({dispatch, getters, rootGetters, commit}, interaction) {
        dispatch("clearInteractions");
        const {currentLayerId, currentLayerIndex, layerInformation, featureProperties, toggleLayer} = getters,
            sourceLayer = layerCollection.getLayerById(currentLayerId).layer,
            shouldValidateForm = featureProperties.find(featProp => featProp.type !== "geometry" && featProp.required);

        switch (interaction) {
            case "LineString":
            case "Point":
            case "Polygon":
            case "MultiPolygon":
                commit("setSelectedUpdate", "insert");
                dispatch("handleDrawInteraction", {
                    sourceLayer,
                    interaction,
                    featureProperties,
                    currentLayerIndex,
                    layerInformation,
                    rootGetters,
                    toggleLayer,
                    currentLayerId,
                    shouldValidateForm
                });
                break;
            case "update":
                commit("setSelectedUpdate", "singleUpdate");
                dispatch("handleUpdateInteraction", {
                    sourceLayer,
                    featureProperties,
                    shouldValidateForm
                });
                break;
            case "multiUpdate":
                commit("setSelectedUpdate", "multiUpdate");
                dispatch("handleMultiUpdateInteraction", {
                    sourceLayer,
                    featureProperties
                });
                break;
            case "delete":
                dispatch("handleDeleteInteraction", {
                    sourceLayer
                });
                break;
            default:
                break;
        }
    },
    /**
     * Handles draw interaction for a single feature.
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    async handleDrawInteraction (context, payload) {
        const {commit, dispatch} = context,
            {sourceLayer, interaction, featureProperties, rootGetters, toggleLayer, currentLayerId, shouldValidateForm, layerInformation, currentLayerIndex} = payload,
            {style} = layerInformation[currentLayerIndex];
        let drawOptions = {};

        drawLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: "module/wfsTransaction/wfsTransaction/vectorLayer", id: "module/wfsTransaction/wfsTransaction/vectorLayer"}, {root: true});

        drawLayer = new VectorLayer({
            id: "module/wfsTransaction/wfsTransaction/vectorLayer",
            name: "module/wfsTransaction/wfsTransaction/vectorLayer",
            source: new VectorSource(),
            alwaysOnTop: true,
            zIndex: 10
        });

        dispatch("Maps/addLayer", drawLayer, {root: true});

        drawOptions = {
            source: drawLayer.getSource(),
            type: interaction,
            stopClick: true,
            geometryName: featureProperties.find(({type}) => type === "geometry")?.key
        };

        if (interaction === "Point") {
            drawOptions.style = style;
        }

        drawInteraction = new Draw(drawOptions);

        modifyInteraction = new Modify({
            source: drawLayer.getSource(),
            condition: event => primaryAction(event) && !platformModifierKeyOnly(event)
        });

        translateInteraction = new Translate({
            layers: [drawLayer],
            condition: event => primaryAction(event) && platformModifierKeyOnly(event)
        });
        drawLayer.setStyle(style);

        if (toggleLayer) {
            sourceLayer?.setVisible(false);
        }

        drawInteraction.on("drawend", async (event) => {
            if (interaction === "MultiPolygon") {
                await nextTick();
                const currentFeatures = await drawLayer?.getSource()?.getFeatures();

                await handleMultipolygon(currentFeatures, drawLayer);
                commit("setSelectedInteraction", "insert");
            }

            if (interaction !== "MultiPolygon") {
                commit("setSelectedInteraction", "insert");

                sourceLayer.getSource().addFeature(event.feature);
                drawLayer.getSource().clear();

                dispatch("validateMinMaxScale", {dispatch, rootGetters, currentLayerId});
                dispatch("Maps/removeInteraction", drawInteraction, {root: true});
            }
            dispatch("Maps/addInteraction", modifyInteraction, {root: true});
            dispatch("Maps/addInteraction", translateInteraction, {root: true});
        });

        dispatch("Maps/addInteraction", drawInteraction, {root: true});
        if (shouldValidateForm) {
            dispatch("validateForm", featureProperties);
        }
    },
    /**
     * Handles update interaction for a single feature.
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    handleUpdateInteraction (context, payload) {
        const {commit, dispatch} = context,
            {sourceLayer, featureProperties, shouldValidateForm} = payload;
        let lastSelectedFeature, selectedFeature, target;

        selectInteraction = new Select({
            layers: [sourceLayer]
        });

        selectedFeatures = selectInteraction.getFeatures();

        selectedFeatures.on("add", (event) => {
            if (featureProperties.length === 0) {
                dispatch("clearInteractions");
                return;
            }
            commit("setSelectedInteraction", "selectedUpdate");

            selectedFeature = event.element;
            target = event.target;

            if (lastSelectedFeature && lastSelectedFeature !== selectedFeature) {
                lastSelectedFeature.set("selected", false);
            }

            selectedFeature.set("selected", true);

            modifyFeature = selectedFeature.clone();
            modifyFeatureSaveId = selectedFeature.getId();
            modifyFeature.setId(modifyFeatureSaveId);

            dispatch("addModifyAndTranslateInteractions", {dispatch, target});

            commit("setFeatureProperties", featureProperties.map(property => ({
                ...property,
                value: modifyFeature ? modifyFeature.get(property.key) : event.element.get(property.key),
                valid: true
            })));
            if (shouldValidateForm) {
                dispatch("validateForm", featureProperties);
                commit("setIsFormDisabled", false);
            }
            lastSelectedFeature = selectedFeature;
        });

        dispatch("Maps/addInteraction", selectInteraction, {root: true});
    },
    /**
     * Handles multi update interaction for multiple features.
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    handleMultiUpdateInteraction (context, payload) {
        const {commit, dispatch, state} = context,
            {sourceLayer, featureProperties} = payload;
        let selectedFeature, target, removedFeature, index;

        // === SINGLE CLICK SELECTION ===
        selectInteraction = new Select({
            condition: click,
            multi: true,
            layers: [sourceLayer],
            addCondition: click,
            removeCondition: click
        });

        selectedFeatures = selectInteraction.getFeatures();

        dispatch("handleSelectInteraction", {
            interactionToActivate: selectInteraction,
            interactionsToDeactivate: [lassoInteraction, boxInteraction]
        });

        commit("setSelectedInteraction", "selectedUpdate");
        // feature selection
        selectedFeatures.on("add", (event) => {
            target = event.target;
            selectedFeature = event.element;

            selectedFeature.set("selected", true);

            selectedFeatures.getArray().forEach((newSelectedFeature) => {
                dispatch("processSelectedFeature", {newSelectedFeature, featureProperties, target});
            });
        });
        // feature deselection
        selectedFeatures.on("remove", (event) => {
            removedFeature = event.element;

            removedFeature.set("selected", false);
            index = modifyFeatureArray.findIndex(feature => feature.getId() === removedFeature.getId());

            if (index !== -1) {
                modifyFeatureArray.splice(index, 1);
                modifyFeatureSaveIdArray.splice(index, 1);
                state.featurePropertiesBatch.splice(index, 1);
            }

        });
        dispatch("Maps/addInteraction", selectInteraction, {root: true});
    },
    /**
    * Handles lasso selection.
    * @param {Object} context the vuex context
    * @param {Object} context.dispatch the dispatch
    * @param {Object} context.getters the getters
    * @returns {void}
     */
    handleLassoInteraction ({dispatch, getters}) {
        const lassoSource = new VectorSource(),
            lassoLayer = new VectorLayer({source: lassoSource}),
            {currentLayerId} = getters,
            sourceLayer = layerCollection.getLayerById(currentLayerId)?.layer;
        let lassoGeometry, lassoFeatures;

        lassoInteraction = new Draw({
            source: lassoSource,
            multi: true,
            type: "Polygon",
            freehand: true
        });

        dispatch("Maps/addLayer", lassoLayer, {root: true});

        dispatch("handleSelectInteraction", {
            interactionToActivate: lassoInteraction,
            interactionsToDeactivate: [selectInteraction, boxInteraction]
        });

        selectedFeatures = selectInteraction.getFeatures();

        lassoInteraction.on("drawend", (event) => {

            if (!event.feature) {
                console.warn("No feature drawn in the event.");
                return;
            }

            lassoGeometry = event.feature.getGeometry();

            lassoFeatures = sourceLayer.getSource().getFeatures().filter(feature => lassoGeometry.intersectsExtent(feature.getGeometry().getExtent()));

            lassoFeatures.forEach(feature => {
                if (!selectedFeatures.getArray().includes(feature)) {
                    selectedFeatures.push(feature);
                }
            });
            setTimeout(() => {
                lassoSource.clear(); // This removes the visible drawn polygon
            }, 150);
        });
        dispatch("Maps/addInteraction", lassoInteraction, {root: true});
    },
    /**
     * Handles rectangle selection.
     * @param {Object} context the vuex context
     * @param {Object} context.dispatch the dispatch
     * @param {Object} context.getters the getters
     * @returns {void}
     */
    handleBoxInteraction ({dispatch, getters}) {
        const boxSource = new VectorSource(),
            boxLayer = new VectorLayer({source: boxSource}),
            {currentLayerId} = getters,
            sourceLayer = layerCollection.getLayerById(currentLayerId)?.layer;


        boxInteraction = new DragBox({
            layers: [sourceLayer]
        });

        dispatch("Maps/addLayer", boxLayer, {root: true});

        dispatch("handleSelectInteraction", {
            interactionToActivate: boxInteraction,
            interactionsToDeactivate: [selectInteraction, lassoInteraction]
        });

        selectedFeatures = selectInteraction.getFeatures();

        boxInteraction.on("boxend", () => {

            const boxExtent = boxInteraction.getGeometry().getExtent(),

                boxFeatures = sourceLayer.getSource().getFeatures().filter(feature => boxExtent && feature.getGeometry().intersectsExtent(boxExtent));

            boxFeatures.forEach(feature => {
                if (!selectedFeatures.getArray().includes(feature)) {
                    selectedFeatures.push(feature);
                }
            });
        });

        boxInteraction.on("boxstart", () => {
            boxSource.clear();
        });

        dispatch("Maps/addInteraction", boxInteraction, {root: true});
    },
    /**
     * Activates click interaction and disables other interactions.
     * @returns {void}
     */
    handleClickInteraction () {
        selectInteraction.setActive(true);
        if (boxInteraction) {
            boxInteraction.setActive(false);
        }
        if (lassoInteraction) {
            lassoInteraction.setActive(false);
        }
    },
    /**
     * Activates one interaction and disables other interactions.
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.interactionToActivate - The interaction which is set to active.
     * @param {Array} payload.interactionsToDeactivate - The interactions which are set to inactive.
     * @returns {void}
     */
    handleSelectInteraction (context, payload) {
        const {interactionToActivate, interactionsToDeactivate} = payload;

        interactionToActivate.setActive(true);
        interactionsToDeactivate.forEach(interaction => {
            interaction?.setActive(false);
        });
    },
    /**
     *
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    processSelectedFeature (context, payload) {
        const {commit, state} = context,
            {newSelectedFeature, featureProperties} = payload;
        let updatedFeatureProperties;

        commit("setSelectedInteraction", "selectedUpdate");
        modifyFeatureSaveId = newSelectedFeature.getId();
        modifyFeature = newSelectedFeature.clone();
        modifyFeature.setId(modifyFeatureSaveId);

        if (!modifyFeatureArray.some(feature => feature.getId() === modifyFeature.getId())) {
            modifyFeatureArray.push(modifyFeature);
            modifyFeatureSaveIdArray.push(modifyFeatureSaveId);

            updatedFeatureProperties = featureProperties.map(property => ({
                ...property,
                value: modifyFeatureArray[modifyFeatureArray.length - 1]?.get(property.key)
            }));

            commit("setFeatureProperties", updatedFeatureProperties);

            if (!state.featurePropertiesBatch.includes(updatedFeatureProperties)) {
                state.featurePropertiesBatch.push(updatedFeatureProperties);
            }
        }
    },

    /**
     * Handles delete interaction.
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    handleDeleteInteraction (context, payload) {
        const {commit, dispatch} = context,
            {sourceLayer} = payload;

        commit("setSelectedInteraction", "delete");
        selectInteraction = new Select({layers: [sourceLayer]});

        selectInteraction.on("select", (event) => {
            featureToDelete = event.selected[0];
            commit("setShowConfirmModal", true);
            dispatch("Maps/removeInteraction", selectInteraction, {root: true});
        });

        dispatch("Maps/addInteraction", selectInteraction, {root: true});
        featureToDelete = null;
    },

    /**
     * Adds modify and translate interactions to the selected features.
     * modify - allows moving the feature with the mouse without any special key
     * translate - adds the different icon for the mouse when moving the feature
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    addModifyAndTranslateInteractions (context, payload) {
        const {dispatch} = context,
            {target} = payload;

        modifyInteraction = new Modify({
            features: target,
            condition: e => primaryAction(e) && !platformModifierKeyOnly(e)
        });

        translateInteraction = new Translate({
            features: target,
            condition: e => primaryAction(e) && platformModifierKeyOnly(e)
        });

        dispatch("Maps/addInteraction", modifyInteraction, {root: true});
        dispatch("Maps/addInteraction", translateInteraction, {root: true});
    },

    /**
     * Handle Multipolygon Creation and Editing inside the Edit Menu
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
    */
    async handleMultipolygonCreation (context, payload) {
        const {dispatch} = context,
            {target} = payload;

        if (target.getArray()?.[0]?.get("geom")?.getType() !== "MultiPolygon") {
            dispatch("Maps/removeInteraction", selectInteraction, {root: true});
        }
        else {
            drawLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: "tool/wfsTransaction/vectorLayer"}, {root: true});
            splitOuterFeatures([target.element], drawLayer);
            selectInteraction.getFeatures().clear();
            payload.sourceLayer.setVisible(false);
            if (drawLayer.getSource().getFeatures().length > 0) {
                drawLayer.getSource().getFeatures().forEach(feature => {
                    selectInteraction.getFeatures().push(feature);
                });
            }
            const drawOptions = {
                    source: drawLayer.getSource(),
                    type: "MultiPolygon",
                    geometryName: payload.featureProperties.find(({type}) => type === "geometry")?.key
                },
                editOptions = {
                    layers: [drawLayer],
                    condition: e => primaryAction(e) && platformModifierKeyOnly(e)
                },
                modifyOptions = {
                    source: drawLayer.getSource(),
                    condition: e => primaryAction(e) && !platformModifierKeyOnly(e)
                },
                style = selectInteraction.getStyle();

            drawLayer.setStyle(style);
            modifyInteraction = new Modify(modifyOptions);
            translateInteraction = new Translate(editOptions);
            drawInteraction = new Draw(drawOptions);
            drawInteraction.on("drawstart", () => {
                drawLayer.setStyle(payload.layerInformation[payload.currentLayerIndex].style);
            });
            drawInteraction.on("drawend", async () => {
                await nextTick();
                const features = await drawLayer.getSource().getFeatures();

                await nextTick();
                await handleMultipolygon(features, drawLayer);
                drawLayer.setStyle(style);
            });
            dispatch("Maps/addInteraction", drawInteraction, {root: true});
        }
    },
    /**
     * Validates if the current map scale is within the min and max scale range of the specified layer.
     * If the scale is out of range, it clears the draw layer source and triggers an error alert.
     *
     * @param {Object} context - The context object.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    validateMinMaxScale (context, payload) {
        const {dispatch, rootGetters} = context,
            {currentLayerId} = payload,
            currentLayer = layerCollection.getLayerById(currentLayerId),
            mapScale = rootGetters["Maps/scale"];

        if ((currentLayer.get("minScale") && mapScale < currentLayer.get("minScale")) ||
            (currentLayer.get("maxScale") && mapScale > currentLayer.get("maxScale"))) {
            drawLayer.getSource().once("change", () => drawLayer.getSource().clear());
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.wfst.error.geometryOutOfRange"),
                mustBeConfirmed: false
            }, {root: true});
        }
    },
    /**
     * Resets all values from selected layer, all interaction, any modified feature.
     * @param {Object} context - The context object.
     * @param {Object} dispatch - The dispatch object.
     * @returns {void}
     */
    reset ({commit, dispatch, getters}) {
        const sourceLayer = layerCollection.getLayerById(getters.currentLayerId)?.layer,
            layerSelected = Array.isArray(getters.featureProperties);

        dispatch("resetCommon", true);

        commit("setFeatureProperties",
            layerSelected
                ? getters.featureProperties.map(property => ({...property, value: null}))
                : getters.featureProperties
        );
        commit("setFeaturePropertiesBatch", []);
        if (modifyFeature) {
            sourceLayer
                ?.getSource().getFeatures()
                .find(feature => feature.getId() === modifyFeature.getId())
                ?.setGeometry(modifyFeature.getGeometry());
            sourceLayer?.getSource().refresh();
            modifyFeature = undefined;
            modifyFeatureSaveId = undefined;

            modifyFeatureArray = [];
            modifyFeatureSaveIdArray = [];
        }
    },
    /**
     * Resets all values from selected layer after canceling the transaction.
     * @param {Object} dispatch - The dispatch object.
     * @returns {void}
     */
    resetCancel ({dispatch}) {
        dispatch("resetCommon", false);
    },
    /**
     * Helper function to reset common values.
     * @param {Object} context - The context object.
     * @returns {void}
     */
    resetCommon (context) {
        const {commit, dispatch, getters} = context,
            sourceLayer = layerCollection.getLayerById(getters.currentLayerId)?.layer,
            layerSelected = Array.isArray(getters.featureProperties);

        commit("setSelectedInteraction", null);
        commit("setSelectedUpdate", null);
        dispatch("clearInteractions");
        if (layerSelected) {
            sourceLayer?.getSource().refresh();
            sourceLayer?.setVisible(true);
        }
    },
    /**
     * Checks whether all required values have been set and a feature is present
     * and either dispatches an alert or sends a transaction.
     * @param {Object} dispatch - The dispatch object.
     * @param {Object} getters - The getters object.
     * @returns {void}
     */
    async save ({dispatch, getters, commit}) {
        let featureWithProperties = null,
            multiPolygonGeometry;
        const polygonFeature = modifyFeature ? modifyFeature : drawLayer.getSource().getFeatures()?.[0],
            {currentLayerIndex, featureProperties, layerInformation, selectedInteraction} = getters,
            error = getters.savingErrorMessage(polygonFeature),
            multiPolygonFeatures = modifyFeature
                ? modifyFeature
                : drawLayer?.getSource()?.getFeatures().filter(feature => feature.getGeometry().getType() === "MultiPolygon"),
            currentLayerId = layerInformation[currentLayerIndex].id,
            geometryFeature = modifyFeature
                ? layerCollection.getLayerById(currentLayerId).getLayerSource().getFeatures()
                    .find((workFeature) => workFeature.getId() === modifyFeatureSaveId)
                : polygonFeature;

        commit("setButtonsDisabled", true);
        if (error.length > 0) {
            dispatch("Alerting/addSingleAlert", {
                category: "Info",
                displayClass: "info",
                content: error,
                mustBeConfirmed: false
            }, {root: true});
            return;
        }

        if (multiPolygonFeatures.length !== 0 && drawLayer) {
            if (multiPolygonFeatures.length > 1) {
                multiPolygonGeometry = buildMultipolygon(multiPolygonFeatures, drawLayer);
                multiPolygonGeometry.setId(modifyFeatureSaveId);
            }
            else {
                multiPolygonGeometry = multiPolygonFeatures[0];
                multiPolygonGeometry.setId(modifyFeatureSaveId);
            }
        }

        featureWithProperties = await addFeaturePropertiesToFeature(
            {
                id: polygonFeature.getId() || modifyFeatureSaveId,
                geometryName: featureProperties.find(({type}) => type === "geometry")?.key,
                geometry: multiPolygonFeatures && multiPolygonGeometry ? multiPolygonGeometry.getGeometry() : geometryFeature.getGeometry()
            },
            featureProperties,
            selectedInteraction === "selectedUpdate",
            layerInformation[currentLayerIndex].featurePrefix
        );

        await dispatch(
            "sendTransaction",
            featureWithProperties
        );
        commit("setButtonsDisabled", false);
        dispatch("reset");
    },

    /**
     * Checks whether all required values have been set and a feature is present
     * and either dispatches an alert or sends a transaction -it does it in the loop for all features.
     * @param {Object} dispatch - The dispatch object.
     * @param {Object} getters - The getters object.
     * @returns {void}
     */
    async saveMulti ({dispatch, getters, commit}) {
        const {
                currentLayerIndex,
                featurePropertiesBatch,
                layerInformation,
                selectedInteraction,
                multiUpdate
            } = getters,
            currentLayerId = layerInformation[currentLayerIndex].id,
            layer = layerInformation[currentLayerIndex],
            features = modifyFeatureArray ? modifyFeatureArray : drawLayer.getSource().getFeatures(),
            LayerConfigAttributes = multiUpdate.find(item => item.layerId === layer.id).configAttributes;
        let geometryFeature,
            index = 0,
            currentIndex;

        commit("setButtonsDisabled", true);
        for (const feature of features) {

            const error = getters.savingErrorMessage(feature);

            if (error.length > 0) {
                dispatch("Alerting/addSingleAlert", {
                    category: "Info",
                    displayClass: "info",
                    content: error,
                    mustBeConfirmed: false
                }, {root: true});
                continue;
            }

            currentIndex = index;
            if (modifyFeatureArray[currentIndex]) {
                const currentId = modifyFeatureSaveIdArray[currentIndex];

                if (currentId !== -1) {
                    geometryFeature = layerCollection
                        .getLayerById(currentLayerId)
                        .getLayerSource()
                        .getFeatures()
                        .find(workFeature => workFeature.getId() === currentId);
                }
            }
            else {
                geometryFeature = feature;
            }
            if (index < featurePropertiesBatch.length) {

                const featureWithProperties = await addFeaturePropertiesToFeature(
                    {
                        id: feature.getId() || modifyFeatureSaveIdArray[index],
                        geometryName: feature.getGeometryName(),
                        geometry: geometryFeature.getGeometry()
                    },
                    featurePropertiesBatch[currentIndex],
                    selectedInteraction === "selectedUpdate",
                    layerInformation[currentLayerIndex].featurePrefix,
                    LayerConfigAttributes
                );

                await dispatch("sendTransaction", featureWithProperties);
            }
            else {
                console.warn(`No properties found for feature at index ${index}`);
            }
            index++;
        }
        commit("setButtonsDisabled", false);
        dispatch("reset");
    },
    /**
     * Sends a transaction to the API and processes the response.
     * Either a message is displayed to the user in case of an error, depending on the response,
     * or the layer is refreshed and the stored feature is displayed.
     * @param {Object} context the vuex context
     * @param {Object} context.dispatch the dispatch
     * @param {Object} context.getters the getters
     * @param {Object} context.rootGetters the root getters
     * @param {module:ol/Feature} feature Feature to by inserted / updated / deleted.
     * @returns {Promise} Promise containing the feature to be added, updated or deleted if transaction was successful. If transaction fails it returns null
     */
    async sendTransaction ({dispatch, getters, rootGetters}, feature) {
        const {currentLayerIndex, layerInformation, selectedInteraction, featurePropertiesBatch, multiUpdate} = getters,
            layer = layerInformation[currentLayerIndex],
            selectedFeature = feature && featureToDelete !== null ? feature : featureToDelete,
            url = layer.url,
            regex = /:$/,
            transactionMethod = ["LineString", "Point", "Polygon"].includes(selectedInteraction)
                ? "insert"
                : selectedInteraction,
            messageKey = `success.${transactionMethod}`,
            transaction = i18next.t("common:modules.wfst.transaction." + messageKey);

        let response, configValues, changes, combinedValues, LayerConfigAttributes, LayerControlAttributes;

        layer.featurePrefix = layer.featurePrefix.replace(regex, "");

        try {
            response = await wfs.sendTransaction(rootGetters["Maps/projectionCode"], selectedFeature, url, layer, selectedInteraction);
        }
        catch (e) {
            await dispatch("Alerting/addSingleAlert", {
                category: "Info",
                displayClass: "info",
                content: i18next.t(`Error: ${e.message}`),
                mustBeConfirmed: false
            }, {root: true});
            response = null;
        }
        finally {
            let additionalInfo = "";

            if (featurePropertiesBatch.length > 0) {
                LayerConfigAttributes = multiUpdate.find(item => item.layerId === layer.id).configAttributes;
                LayerControlAttributes = multiUpdate.find(item => item.layerId === layer.id).controlAttributes;

                additionalInfo = "</br></br>" + featurePropertiesBatch.length + i18next.t("common:modules.wfst.transaction.success.batchInfo", {layer: i18next.$t(layer.name)}) + "<ul>" +
                    featurePropertiesBatch
                        .map(batchItem => {
                            configValues = LayerConfigAttributes
                                .map(attr => batchItem.find(item => item.key === attr)?.value)
                                .filter(value => value !== undefined);

                            changes = LayerControlAttributes
                                .map(attr => {
                                    const controlItem = batchItem.find(item => item.key === attr);

                                    if (controlItem) {
                                        return `${controlItem.key} "${controlItem.value}"`;
                                    }
                                    return null;
                                })
                                .filter(item => item !== null);
                            combinedValues = changes.join(", ");

                            return combinedValues ? `<li>${configValues}: ${combinedValues}</li>` : "";
                        })
                        .join("") +
                    "</ul>";
            }
            if (selectedInteraction !== "selectedUpdate") {
                layerCollection.getLayerById(layer.id).getLayerSource().refresh();
            }

            if (response !== null) {
                dispatch("Alerting/addSingleAlert", {
                    category: "success",
                    content: i18next.t("common:modules.wfst.transaction.success.baseSuccess", {transaction: transaction}) + additionalInfo
                }, {root: true});
            }
            if (selectedInteraction !== "selectedUpdate") {
                await dispatch("reset");
            }
        }
        return response;
    },
    /**
     * Validates the user-input sets the error messages.
     * @param {Object} commit - The commit object.
     * @param {Object} property property that is validated based on it's type
     * @returns {void}
     */
    validateInput ({commit}, property) {
        if (property.type === "number") {
            const isNotEmpty = property.value.length > 0,
                hasNumbersOrPartialNumbers = !Number.isNaN(Number(property.value)),
                isNumberValid = isNotEmpty && hasNumbersOrPartialNumbers;

            commit("setFeatureProperty", {...property, valid: isNumberValid});
        }
        else if (property.type === "text") {
            const hasTextAndNumberAndHasSpecials = (/^[A-Za-z0-9 [\]öäüÖÄÜß,/\\.-]*$/).test(property.value),
                hasOnlyNumbers = (/^[0-9]*$/).test(property.value),
                isTextValid = hasTextAndNumberAndHasSpecials && !hasOnlyNumbers;

            commit("setFeatureProperty", {...property, valid: isTextValid});
        }
        else if (property.type === "date") {
            const dateEpoch = Date.parse(property.value),
                year2100 = 4133894400000,
                isDateValid = year2100 > dateEpoch;

            commit("setFeatureProperty", {...property, valid: isDateValid});
        }
    },
    /**
     * Validates whole form based on the list of received properties.
     * @param {Object} context the vuex context
     * @param {Object} context.commit the commit
     * @param {Object} featureProperties a list of properties
     * @returns {void}
     */
    validateForm ({commit}, featureProperties) {
        const isFormInvalid = featureProperties.find(f => f.type !== "geometry" && f.required && f.valid !== true);

        commit("setIsFormDisabled", Boolean(isFormInvalid));
    },
    /**
     * Sets actual feature property based on the user action on an input.
     * @param {Object} feature of a feature with it's key, type and value
     * @param {Object} context the vuex context
     * @param {Object} context.dispatch context.dispatch the dispatch
     * @param {Object} context.commit - context.commit the commit
     * @param {Object} context.getters - context.getters the getters
     * @returns {void}
     */
    updateFeatureProperty ({dispatch, commit, getters: {featureProperties}}, feature) {
        if (feature.required) {
            dispatch("validateInput", feature);
            dispatch("validateForm", featureProperties);
        }
        else {
            commit("setFeatureProperty", {...feature, key: feature.key, value: feature.value});
        }
    },
    /**
     * Sets the feature property
     * @param {Object} context the vuex context
     * @param {Object} context.dispatch context.dispatch the dispatch
     * @param {Object} context.commit - context.commit the commit
     * @param {Object} payload property key, type, value
     * @returns {void}
     * @returns {void}
     */
    setFeatureProperty ({commit, dispatch}, {key, type, value}) {
        if (type === "number" && !Number.isFinite(parseFloat(value))) {
            dispatch("Alerting/addSingleAlert", {
                category: "Info",
                displayClass: "info",
                content: i18next.t("common:modules.wfst.error.onlyNumbersAllowed"),
                mustBeConfirmed: false
            }, {root: true});
            return;
        }
        commit("setFeatureProperty", {key, value});
    },
    /**
     * Sets the feature property in the batch
     * @param {Object} context the vuex context
     * @param {Object} context.dispatch context.dispatch the dispatch
     * @param {Object} context.commit - context.commit the commit
     * @param {Object} payload property key, type, value
     * @returns {void}
     */
    setFeaturesBatchProperty ({commit, dispatch, state}, {key, type, value}) {
        if (type === "number" && !Number.isFinite(parseFloat(value))) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.wfst.error.onlyNumbersAllowed"),
                mustBeConfirmed: false
            }, {root: true});
            return;
        }
        if (value !== "") {
            state.anyInputValue[key] = value;
        }
        else {
            delete state.anyInputValue[key];
        }
        commit("setFeaturesBatchProperty", {key, value});
    },
    /**
     * Sets all feature properties based on actual layer
     * @param {Object} commit - The commit object.
     * @param {Object} getters - The getters object.
     * @returns {void}
     */
    async setFeatureProperties ({commit, getters: {currentLayerIndex, layerInformation, useProxy}}) {
        if (currentLayerIndex === -1) {
            commit("setFeatureProperties", i18next.t("common:modules.wfst.error.allLayersNotSelected"));
            return;
        }
        const layer = layerInformation[currentLayerIndex];

        if (!Object.prototype.hasOwnProperty.call(layer, "featurePrefix")) {
            commit("setFeatureProperties", i18next.t("common:modules.wfst.error.layerNotConfiguredCorrectly"));
            return;
        }
        if (!layer.visibility) {
            commit("setFeatureProperties", i18next.t("common:modules.wfst.error.layerNotSelected"));
            return;
        }
        commit("setFeatureProperties", await prepareFeaturePropertiesModule.prepareFeatureProperties(layer, useProxy));
    }
};

export default actions;
