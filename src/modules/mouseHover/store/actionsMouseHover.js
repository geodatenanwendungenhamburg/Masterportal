import {buffer} from "ol/extent";
import Point from "ol/geom/Point";
import {createGfiFeature} from "@shared/js/utils/getWmsFeaturesByMimeType";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import store from "@appstore";

export default {
    /**
     * Sets the config-params of this MouseHover into state.
     * Adds the overlay and eventListener for the map.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @returns {void}
     */
    initialize ({commit, dispatch, state}) {
        const {numFeaturesToShow, infoText, highlightOnHover} = state,
            map = mapCollection.getMap("2D");
        let featuresAtPixel = [];

        dispatch("setMouseHoverLayers");
        commit("setMouseHoverInfos");
        map.addOverlay(state.overlay);

        if (numFeaturesToShow) {
            commit("setNumFeaturesToShow", numFeaturesToShow);
        }
        if (infoText) {
            commit("setInfoText", infoText);
        }
        map.on("pointermove", (evt) => {
            if (!store.getters.mouseHover || evt.originalEvent.pointerType === "touch") {
                return;
            }
            featuresAtPixel = [];
            commit("setHoverPosition", evt.coordinate);

            if (highlightOnHover) {
                dispatch("Maps/removeHighlightFeature", "decrease", {root: true});
            }

            // works for WebGL layers that are point layers
            map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
                if (layer?.getVisible()) {
                    if (highlightOnHover) {
                        dispatch("highlightFeature", {feature, layer});
                    }
                    if (feature.getProperties().features) {
                        feature.get("features").forEach(clusteredFeature => {
                            featuresAtPixel.push(createGfiFeature(
                                layer,
                                "",
                                clusteredFeature
                            ));
                        });
                    }
                    else {
                        featuresAtPixel.push(createGfiFeature(
                            layer,
                            "",
                            feature
                        ));
                    }
                }
            });
            /** check WebGL Layers
            * use buffered coord instead of pixel for hitTolerance
            * only necessary for WebGL polygon and line layers
            */
            map.getLayers().getArray()
                .filter(layer => layer.get("renderer") === "webgl" && !layer.get("isPointLayer")) // point features are already caught by map.forEachFeatureAtPixel loop
                .forEach(layer => {
                    if (layer.get("gfiAttributes") && layer.get("gfiAttributes") !== "ignore") {
                        /**
             * use OL resolution based buffer to adjust the hitTolerance (in m) for lower zoom levels
             */
                        const resolution = mapCollection.getMapView("2D").getResolution(),
                            hitBox = buffer(
                                new Point(evt.coordinate).getExtent(),
                                (layer.get("hitTolerance") || 1) * Math.sqrt(resolution)
                            );

                        if (layer.get("typ") === "VectorTile" && layer.get("renderer") === "webgl") {
                            const topLeft = map.getPixelFromCoordinate([hitBox[0], hitBox[3]]),
                                bottomRight = map.getPixelFromCoordinate([hitBox[2], hitBox[1]]),
                                features = [];

                            for (let x = topLeft[0]; x <= bottomRight[0]; x++) {
                                for (let y = topLeft[1]; y <= bottomRight[1]; y++) {
                                    map.forEachFeatureAtPixel([x, y], (feature, candidateLayer) => {
                                        if (candidateLayer === layer && !features.includes(feature)) {
                                            features.push(feature);
                                        }
                                    }, {
                                        layerFilter: l => l === layer
                                    });
                                }
                            }

                            features.forEach(feature => {
                                featuresAtPixel.push(createGfiFeature(
                                    layer,
                                    "",
                                    feature
                                ));
                            });
                        }
                        else {
                            layer.getSource()?.forEachFeatureIntersectingExtent(hitBox, feature => {
                                featuresAtPixel.push(createGfiFeature(
                                    layer,
                                    "",
                                    feature
                                ));
                            });
                        }
                    }
                });
            state.overlay.setPosition(evt.coordinate);
            state.overlay.setElement(document.querySelector("#mousehover-overlay"));
            commit("setInfoBox", null);

            if (featuresAtPixel.length > 0) {
                dispatch("filterInfos", featuresAtPixel);
            }
        });
    },

    /**
     * Sets the layers with a mouseHoverField to the state
     * @param {Object} param.commit the commit
     * @param {Object} param.rootGetters the rootGetters
     * @returns {void}
     */
    setMouseHoverLayers ({commit, rootGetters}) {
        commit("setMouseHoverLayers", rootGetters.allLayerConfigs.filter(layer => {
            return layer?.mouseHoverField && layer.mouseHoverField !== "";
        }));
    },
    highlightFeature ({dispatch, state}, {feature, layer}) {
        const {highlightVectorRulesPointLine, highlightVectorRulesPolygon} = state,
            layerId = layer.get("id"),
            featureGeometryType = feature.getGeometry().getType(),
            featureId = feature.getId(),
            styleObj = featureGeometryType.toLowerCase().indexOf("polygon") > -1 ?
                highlightVectorRulesPolygon ?? state.highlightVectorRulesPolygon :
                highlightVectorRulesPointLine ?? state.highlightVectorRulesPointLine,
            highlightObject = {
                type: featureGeometryType === "Point" || featureGeometryType === "MultiPoint" ? "increase" : "highlightPolygon",
                id: featureId,
                layer: layer,
                feature: feature,
                scale: styleObj.image?.scale
            },
            rawLayer = rawLayerList.getLayerWhere({id: layerId});

        if (featureGeometryType === "LineString" || featureGeometryType === "MultiLineString") {
            highlightObject.type = "highlightLine";
        }
        layer.id = layerId;
        highlightObject.zoomLevel = styleObj.zoomLevel;
        if (rawLayer && rawLayer.styleId) {
            highlightObject.styleId = rawLayer.styleId;
        }
        else if (layer && layer.styleId) {
            highlightObject.styleId = layer.styleId;
        }

        highlightObject.highlightStyle = {
            fill: styleObj.fill,
            stroke: styleObj.stroke,
            image: styleObj.image
        };

        dispatch("Maps/highlightFeature", highlightObject, {root: true});
    },
    /**
     * Filters the infos from each feature that should be displayed.
     * @param {Object} param.commit the commit
     * @param {Object} param.state the state
     * @param {Array} features array of hovered Features
     * @returns {void}
     */
    filterInfos ({commit, state}, features) {
        const infoBox = [];

        if (features.length > 0) {
            features.forEach(feature => {
                const configInfosForFeature = state.mouseHoverInfos.find(info => info.id === feature.getLayerId());

                if (configInfosForFeature) {
                    const featureProperties = feature.getProperties(),
                        featureInfos = typeof configInfosForFeature.mouseHoverField === "string" ? configInfosForFeature.mouseHoverField : configInfosForFeature.mouseHoverField.filter(key => Object.keys(featureProperties).includes(key)),
                        featureDetails = [];

                    if (Array.isArray(featureInfos)) {
                        featureInfos.forEach(info => {
                            featureDetails.push(featureProperties[info]);
                        });
                    }
                    else {
                        featureDetails.push(featureProperties[featureInfos]);
                    }
                    infoBox.push(featureDetails);
                    commit("setPleaseZoom", features.length > state.numFeaturesToShow);
                    commit("setInfoBox", infoBox.slice(0, state.numFeaturesToShow));
                }
            });
        }
    }
};
