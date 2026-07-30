import VectorSource from "ol/source/Vector.js";
import {Vector as VectorLayer} from "ol/layer.js";
import {GeoJSON} from "ol/format.js";
import Feature from "ol/Feature.js";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import RelateOp from "jsts/org/locationtech/jts/operation/relate/RelateOp.js";
import OverlayOp from "jsts/org/locationtech/jts/operation/overlay/OverlayOp.js";
import {ResultType} from "./enums.js";
import * as setters from "./settersBufferAnalysis.js";
import * as initializers from "./initializersBufferAnalysis.js";
import layerCollection from "@core/layers/js/layerCollection.js";

const actions = {
    ...initializers,
    ...setters,
    /**
     * Triggers several actions to check for intersections.
     * Includes checks between created buffers and features of selected target layer
     * Also checks again for intersections between buffers and intersection polygons
     * Finally adds new intersection features to map
     *
     * @return {void}
     */
    checkIntersection ({dispatch, getters: {selectedTargetLayer, bufferLayer}}) {
        dispatch("Maps/areLayerFeaturesLoaded", selectedTargetLayer.id, {root: true}).then(() => {
            const bufferFeatures = bufferLayer.getSource().getFeatures();

            dispatch("checkIntersectionWithBuffers", bufferFeatures)
                .then(dispatch("checkIntersectionsWithIntersections", bufferFeatures))
                .then(dispatch("convertIntersectionsToPolygons"))
                .then(dispatch("addNewFeaturesToMap"));
        });
    },
    /**
     * Creates and shows buffers associated to features of selected source layer
     *
     * @return {void}
     */
    showBuffer ({dispatch, commit, getters: {selectedSourceLayer, jstsParser, bufferRadius, bufferStyle}}) {
        const layer = layerCollection.getLayerById(selectedSourceLayer.id),
            features = layer?.getLayerSource().getFeatures() || [],
            vectorSource = new VectorSource(),
            bufferLayer = new VectorLayer({
                id: "buffer_layer",
                source: vectorSource,
                alwaysOnTop: true,
                zIndex: 10
            });

        commit("setBufferLayer", bufferLayer);
        features.forEach(feature => {
            const jstsGeom = jstsParser.read(feature.getGeometry()),
                buffered = BufferOp.bufferOp(jstsGeom, bufferRadius),
                newFeature = new Feature({
                    geometry: jstsParser.write(buffered),
                    name: "Buffers"
                });

            newFeature.setStyle(bufferStyle);
            newFeature.set("originFeature", feature);
            vectorSource.addFeature(newFeature);
        });
        dispatch("Maps/addLayer", bufferLayer, {root: true});
    },
    /**
     * Removes a layer from the map based on its OpenLayers unique ID (ol_uid)
     * @param {module:ol/layer/Vector} layer The layer to be removed.
     */
    removeGeneratedLayer ({rootState}, layer) {
        mapCollection.getMap(rootState.Maps.mode).getLayers().forEach(l => {
            if (l?.ol_uid === layer.ol_uid) {
                mapCollection.getMap(rootState.Maps.mode).removeLayer(l);
            }
        });
    },
    /**
     * Removes generated result layer and buffer layer
     * Also unsets the intersections and result features arrays
     *
     * @return {void}
     */
    removeGeneratedLayers ({commit, dispatch, getters: {bufferLayer, resultLayer}}) {
        if (bufferLayer?.ol_uid) {
            dispatch("removeGeneratedLayer", bufferLayer);
        }
        if (resultLayer?.ol_uid) {
            dispatch("removeGeneratedLayer", resultLayer);
        }
        commit("setResultLayer", {});
        commit("setBufferLayer", {});
        commit("setIntersections", []);
        commit("setResultFeatures", []);
    },
    /**
     * Resets the module to default settings
     * Also restores the opacity for selected source and target layers
     *
     * @return {void}
     */
    resetModule ({commit, dispatch, getters: {selectedSourceLayer, selectedTargetLayer}}) {
        if (selectedSourceLayer) {
            selectedSourceLayer.opacity = 1;
            selectedSourceLayer.visibility = false;
        }

        if (selectedTargetLayer) {
            selectedTargetLayer.opacity = 1;
            selectedTargetLayer.visibility = false;
        }
        dispatch("applySelectedSourceLayer", null);
        dispatch("applySelectedTargetLayer", null);
        dispatch("removeGeneratedLayers");
        commit("setSavedUrl", null);
        commit("setInputBufferRadius", 0);
    },
    /**
     * Checks intersections between buffers and features of the selected target layer
     * Also triggers the actions to create intersection polygons and to add the new intersection result features
     *
     * @param {Array} bufferFeatures - array with buffer features
     *
     * @return {void}
     */
    checkIntersectionWithBuffers ({commit, dispatch, getters: {selectedTargetLayer, jstsParser, resultType}}, bufferFeatures) {
        const layer = layerCollection.getLayerById(selectedTargetLayer.id),
            targetFeatures = layer?.getLayerSource().getFeatures() || [];

        targetFeatures.forEach(targetFeature => {
            const targetGeometry = targetFeature.getGeometry(),
                foundIntersection = bufferFeatures.some(bufferFeature => {
                    const sourceGeometry = bufferFeature.getGeometry(),
                        // check if buffer origin feature is the same as the target feature
                        sameFeature = bufferFeature.get("originFeature").getId() === targetFeature.getId(),
                        sourcePoly = jstsParser.read(sourceGeometry),
                        targetPoly = jstsParser.read(targetGeometry);

                    if (targetGeometry.getType() === "Point" &&
                        sourceGeometry.intersectsCoordinate(targetGeometry.getCoordinates()) &&
                        !sameFeature) {
                        return true;
                    }

                    if (sourcePoly && targetPoly && RelateOp.intersects(sourcePoly, targetPoly) && !sameFeature) {
                        dispatch("generateIntersectionPolygon", {
                            properties: targetFeature.getProperties(),
                            sourcePoly,
                            targetPoly
                        });
                        return resultType !== ResultType.WITHIN;
                    }

                    return false;
                });

            // only add target feature due to selected result type
            if (!foundIntersection && resultType === ResultType.OUTSIDE ||
                foundIntersection && resultType === ResultType.WITHIN) {
                commit("addResultFeature", targetFeature);
            }
        });
    },
    /**
     * Calculates based on selected result type the intersection/difference between source and target polygon
     * and adds the calculated polygon to the intersections array.
     * Also transfers the given properties to the new polygon.
     *
     * @param {Object} payload - payload for the action
     * @param {Polygon} payload.sourcePoly - source polygon
     * @param {Polygon} payload.targetPoly - target polygon
     * @param {Object} [payload.properties = {}] - properties to be transferred
     *
     * @returns {void}
     */
    generateIntersectionPolygon ({commit, getters: {resultType}}, {sourcePoly, targetPoly, properties = {}}) {
        const subsetPoly = resultType === ResultType.WITHIN ? OverlayOp.intersection(sourcePoly, targetPoly) : OverlayOp.difference(targetPoly, sourcePoly);

        subsetPoly.properties = properties;
        commit("addIntersectionPolygon", subsetPoly);
    },
    /**
     * Checks intersections between buffers and already calculated intersections
     * Also triggers the action to create a new intersection polygon and removes the previous calculated intersection
     *
     * @param {Array} bufferFeatures - array with features
     *
     * @return {void}
     */
    checkIntersectionsWithIntersections ({dispatch, getters: {intersections, jstsParser}}, bufferFeatures) {
        bufferFeatures.forEach(buffer => {
            intersections.forEach((intersection) => {
                const sourceGeometry = buffer.getGeometry(),
                    sourcePoly = jstsParser.read(sourceGeometry);

                if (RelateOp.intersects(sourcePoly, intersection)) {
                    dispatch("generateIntersectionPolygon", {properties: intersection.properties, sourcePoly, targetPoly: intersection});
                }
            });
        });
    },
    /**
     * Converts intersection polygons to Open layers features
     *
     * @return {void}
     */
    convertIntersectionsToPolygons ({commit, getters: {intersections, geoJSONWriter}}) {
        if (intersections.length) {
            intersections.forEach(intersection => {
                const geojsonFormat = new GeoJSON(),
                    newFeature = geojsonFormat.readFeature({
                        type: "Feature",
                        properties: intersection.properties,
                        geometry: geoJSONWriter.write(intersection)
                    });

                commit("addResultFeature", newFeature);
            });
        }
    },
    /**
     * Creates a new layer for the result features and adds it to the map
     * Style and GFI config is transferred from target layer
     *
     * @return {void}
     */
    addNewFeaturesToMap ({commit,
        dispatch,
        getters: {
            resultFeatures,
            selectedTargetLayer,
            selectedSourceLayer,
            bufferLayer
        }}) {
        if (resultFeatures.length) {
            const vectorSource = new VectorSource(),
                gfiAttributes = selectedTargetLayer.gfiAttributes,
                resultLayer = new VectorLayer({
                    id: "result_layer",
                    source: vectorSource,
                    style: selectedTargetLayer.style,
                    alwaysOnTop: true
                });

            commit("setResultLayer", resultLayer);

            vectorSource.addFeatures(resultFeatures);
            resultLayer.set("gfiAttributes", gfiAttributes);
            dispatch("Maps/addLayer", resultLayer, {root: true});
        }
        const targetOlLayer = layerCollection.getLayerById(selectedTargetLayer.id),
            sourceOlLayer = layerCollection.getLayerById(selectedSourceLayer.id);

        targetOlLayer.layer.setOpacity(targetOlLayer.layer.getOpacity() * 0.5);
        sourceOlLayer.layer.setOpacity(sourceOlLayer.layer.getOpacity() * 0.5);
        bufferLayer.setOpacity(0.5);
    },
    /**
     * Applies values from previous saved buffer analysis
     * that was copied into the URL.
     * @return {void}
     */
    applyValuesFromSavedUrlBuffer ({rootState, state, dispatch, commit}) {
        const menuString = rootState.urlParams?.MENU;
        const initOpen = rootState.urlParams?.ISINITOPEN;
        const initValues = rootState.urlParams?.INITVALUES;

        try {
            if (menuString) {
                let menu;

                if (typeof menuString === "string") {
                    menu = JSON.parse(menuString);
                }
                else {
                    menu = menuString;
                }

                const secondary = menu?.secondary;
                const attrs = secondary?.attributes;

                if (attrs && secondary?.currentComponent === "bufferAnalysis") {
                    const sourceLayer = state.selectOptions.find(l => l.id === attrs.source);
                    const targetLayer = state.selectOptions.find(l => l.id === attrs.target);
                    const radius = Number(attrs.radius);
                    const result = Number(attrs.result);

                    if (sourceLayer) {
                        dispatch("applySelectedSourceLayer", sourceLayer);
                    }
                    if (radius) {
                        commit("setInputBufferRadius", radius);
                        dispatch("applyBufferRadius", radius);
                    }
                    if (result !== undefined) {
                        commit("setResultType", result);
                    }
                    if (targetLayer) {
                        dispatch("applySelectedTargetLayer", targetLayer);
                    }

                    return;
                }
            }

            // Legacy format
            if (initOpen === "bufferAnalysis" && initValues) {
                const parsed = JSON.parse(initValues);

                const sourceLayer = state.selectOptions.find(l => l.id === parsed.applySelectedSourceLayer);
                const targetLayer = state.selectOptions.find(l => l.id === parsed.applySelectedTargetLayer);
                const radius = Number(parsed.applyBufferRadius);
                const result = Number(parsed.setResultType);

                if (sourceLayer) {
                    dispatch("applySelectedSourceLayer", sourceLayer);
                }
                if (radius) {
                    commit("setInputBufferRadius", radius);
                    dispatch("applyBufferRadius", radius);
                }
                if (result !== undefined) {
                    commit("setResultType", result);
                }
                if (targetLayer) {
                    dispatch("applySelectedTargetLayer", targetLayer);
                }
            }
        }
        catch (err) {
            console.error("Failed to apply bufferAnalysis values from URL:", err);
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.bufferAnalysis.error")
            }, {root: true});
        }
    }
};

export default actions;
