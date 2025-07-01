import {expect} from "chai";
import sinon from "sinon";
import layerCollection from "@core/layers/js/layerCollection.js";
import store from "@appstore/index.js";
import {nextTick} from "vue";
import MapHandler from "@modules/filter/utils/mapHandler.js";
import Layer2dVectorTile from "@core/layers/js/layer2dVectorTile.js";

describe("src/modules/filter/utils/mapHandler.js", () => {
    let lastError = false,
        onerror = null;

    /**
     * Creates a MapHandler instance with default handlers, which can be overridden or extended
     * by the provided extra handlers.
     *
     * @param {function(Error): void} onError - Callback function to handle errors.
     * @param {Object} [extraHandlers={}] - Additional or overriding handler functions for the MapHandler.
     * @param {function} [extraHandlers.getLayerByLayerId] - Function to get a layer by its layer ID.
     * @param {function} [extraHandlers.showFeaturesByIds] - Function to show features by their IDs.
     * @param {function} [extraHandlers.zoomToFilteredFeatures] - Function to zoom to filtered features.
     * @param {function} [extraHandlers.zoomToExtent] - Function to zoom to a specific extent.
     * @param {function} [extraHandlers.getLayers] - Function to retrieve all layers.
     * @param {function} [extraHandlers.setParserAttributeByLayerId] - Function to set parser attributes by layer ID.
     * @returns {MapHandler} A new MapHandler instance with the provided handlers.
     */
    function createMapHandler (onError, extraHandlers = {}) {
        const defaultHandlers = {
            getLayerByLayerId: () => false,
            showFeaturesByIds: () => false,
            zoomToFilteredFeatures: () => false,
            zoomToExtent: () => false,
            getLayers: () => false,
            setParserAttributeByLayerId: () => false
        };

        return new MapHandler(
            {...defaultHandlers, ...extraHandlers},
            onError
        );
    }

    /**
     * Creates a stub for the layerCollection.getLayerById function, returning a default
     * layer object which can be overridden.
     *
     * @param {Object} [overrides={}] - Optional object to override default stub values.
     * @param {Object} [overrides.layer] - Overrides for the layer object.
     * @param {function} [overrides.getLayerSource] - Override for the getLayerSource function.
     * @returns {sinon.SinonStub} A Sinon stub for layerCollection.getLayerById.
     */
    function stubGetLayerById (overrides = {}) {
        const defaultStub = {
            layer: {
                getVisible: () => false,
                getSource: () => ({
                    once: (eventname, handler) => handler && handler(),
                    getFeatures: () => [{id: 1}]
                })
            },
            getLayerSource: () => false
        };

        return sinon.stub(layerCollection, "getLayerById").returns({
            ...defaultStub,
            ...overrides,
            layer: {
                ...defaultStub.layer,
                ...overrides.layer || {}
            }
        });
    }

    beforeEach(() => {
        lastError = false;
        onerror = {
            call: error => {
                lastError = error;
            }
        };
        store.getters = {
            layerConfigById: () => {
                return {
                    "id": "filterId",
                    "type": "layer",
                    "showInLayerTree": false,
                    "visibility": true
                };
            },
            determineZIndex: () => 1
        };
    });
    afterEach(() => {
        sinon.restore();
    });
    describe("constructor", () => {
        it("should pipe an error if function getLayerByLayerId is missing with the given handlers", () => {
            new MapHandler({}, onerror.call);

            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should pipe an error if function showFeaturesByIds is missing with the given handlers", () => {
            new MapHandler({
                getLayerByLayerId: () => false
            }, onerror.call);

            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should pipe an error if function zoomToFilteredFeatures is missing with the given handlers", () => {
            new MapHandler({
                getLayerByLayerId: () => false,
                showFeaturesByIds: () => false
            }, onerror.call);

            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should pipe an error if function getLayers is missing with the given handlers", () => {
            new MapHandler({
                getLayerByLayerId: () => false,
                showFeaturesByIds: () => false,
                zoomToFilteredFeatures: () => false,
                zoomToExtent: () => false
            }, onerror.call);

            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should pipe an error if function getLayers is missing with the given handlers", () => {
            new MapHandler({
                getLayerByLayerId: () => false,
                showFeaturesByIds: () => false,
                zoomToFilteredFeatures: () => false,
                zoomToExtent: () => false
            }, onerror.call);

            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should pipe an error if function setParserAttributeByLayerId is missing with the given handlers", () => {
            new MapHandler({
                getLayerByLayerId: () => false,
                showFeaturesByIds: () => false,
                zoomToFilteredFeatures: () => false,
                zoomToExtent: () => false,
                getLayers: () => false
            }, onerror.call);

            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should set empty internal structure for layers", () => {
            const map = createMapHandler(onerror.call, {changeLayerVisibility: () => false});

            expect(lastError).to.not.be.an.instanceof(Error);
            expect(map.layers).to.be.an("object").and.to.be.empty;
        });
        it("should set empty internal structure for filteredIds", () => {
            const map = createMapHandler(onerror.call, {changeLayerVisibility: () => false});

            expect(lastError).to.not.be.an.instanceof(Error);
            expect(map.filteredIds).to.be.an("object").and.to.be.empty;
        });
    });
    describe("initializeLayer", () => {
        it("should try to add the layer by layer id if the current layer does not include the wanted layer", () => {
            const map = createMapHandler(onerror.call, {
                changeLayerVisibility: () => false,
                getLayers: () => {
                    return {};
                }});

            map.initializeLayer("filterId", "layerId", false, onerror.call);

            nextTick(() => {
                expect(lastError).to.be.an.instanceof(Error);
            });
        });
        it("should set the internal layers and filteredIds for the given filter id and layer id", () => {
            let called_layerId = false;
            const called_key = [],
                called_value = [],
                map = createMapHandler(onerror.call, {
                    getLayerByLayerId: () => "layerModel",
                    changeLayerVisibility: () => false,
                    getLayers: () => {
                        return {
                            getArray: () => [{
                                getVisible: () => true,
                                get: () => "layerId"
                            }]
                        };
                    },
                    setParserAttributeByLayerId: (layerId, key, value) => {
                        called_layerId = layerId;
                        called_key.push(key);
                        called_value.push(value);
                    }});

            map.initializeLayer("filterId", "layerId", false, onerror.call);
            nextTick(() => {
                expect(lastError).to.not.be.an.instanceof(Error);
                expect(map.layers.filterId).to.equal("layerModel");
                expect(map.filteredIds.filterId).to.be.an("array").and.to.be.empty;
                expect(called_layerId).to.equal("layerId");
                expect(called_key).to.deep.equal(["loadingStrategy", "loadThingsOnlyInCurrentExtent"]);
                expect(called_value).to.deep.equal(["all", false]);
            });
        });
        it("should set doNotLoadInitially to true if extern is set", () => {
            let called_layerId = false,
                called_key = false,
                called_value = false;
            const map = createMapHandler(onerror.call, {
                changeLayerVisibility: () => false,
                getLayers: () => {
                    return {};
                },
                setParserAttributeByLayerId: (layerId, key, value) => {
                    called_layerId = layerId;
                    called_key = key;
                    called_value = value;
                }});

            map.initializeLayer("filterId", "layerId", true, onerror.call);

            nextTick(() => {
                expect(lastError).to.be.an.instanceof(Error);
                expect(called_layerId).to.equal("layerId");
                expect(called_key).to.equal("doNotLoadInitially");
                expect(called_value).to.be.true;
            });
        });
    });
    describe("getAmountOfFilteredItemsByFilterId", () => {
        it("should return the number of features", () => {
            const map = createMapHandler(onerror.call, {});

            map.filteredIds.filterId = [1, 2, 3];
            expect(map.getAmountOfFilteredItemsByFilterId("filterId")).to.equal(3);
        });
        it("should return the number of features without duplicates", () => {
            const map = createMapHandler(onerror.call, {createLayerIfNotExists: () => false});

            map.filteredIds.filterId = [1, 2, 3, 2, 1];
            expect(map.getAmountOfFilteredItemsByFilterId("filterId")).to.equal(3);
        });
    });
    describe("isLayerActivated", () => {
        it("should return true if the layer is visible", () => {
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                visibility: true
            };
            expect(map.isLayerActivated("filterId")).to.be.true;
        });
    });
    describe("activateLayer", () => {
        it("should not call onActivated if no layer model was found", () => {
            let called_onActivated = false;
            const map = createMapHandler(onerror.call, {});

            map.activateLayer("filterId", () => {
                called_onActivated = true;
            });
            expect(called_onActivated).to.be.false;
        });
        it("should set featuresloadend event once, set showInLayerTree to true if layer is not activated yet", () => {
            let called_onceEvent = false;
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                type: "WFS",
                id: "filterId"
            };
            stubGetLayerById({
                layer: {
                    getSource: () => ({
                        once: eventname => {
                            called_onceEvent = eventname;
                        },
                        getFeatures: () => []
                    })
                }
            });
            map.activateLayer("filterId");

            nextTick(() => {
                expect(called_onceEvent).to.equal("featuresloadend");
                expect(store.getters.layerConfigById("filterId").showInLayerTree).to.be.true;
            });
        });
        it("should call onActivated with once event if the layer is not activated yet", () => {
            let called_onActivated = false;
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                type: "WFS",
                id: "filterId"
            };
            stubGetLayerById({
                layer: {
                    getSource: () => ({
                        once: (eventname, handler) => handler(),
                        getFeatures: () => []
                    })
                }
            });

            map.activateLayer("filterId", () => {
                called_onActivated = true;
            });
            nextTick(() => {
                expect(called_onActivated).to.be.true;
            });
        });
        it("should call onActivated and set showInLayerTree to true if layer is activated but not visible on the map yet", () => {
            let called_onActivated = false;
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                type: "WFS",
                id: "filterId",
                isVisibleInMap: "false"
            };
            stubGetLayerById({
                layer: {
                    getSource: () => ({
                        once: (eventname, handler) => handler(),
                        getFeatures: () => [{id: 1}]
                    })
                }
            });

            map.activateLayer("filterId", () => {
                called_onActivated = true;
            });

            nextTick(() => {
                expect(called_onActivated).to.be.true;
                expect(store.getters.layerConfigById("filterId").showInLayerTree).to.be.true;
            });
        });
        it("should call onActivated if layer is activated and visible on map, should not set showInLayerTreeto true", () => {
            let called_onActivated = false;
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                type: "WFS",
                id: "filterId",
                isVisibleInMap: "true"
            };
            stubGetLayerById({
                layer: {
                    getSource: () => ({
                        once: (eventname, handler) => handler(),
                        getFeatures: () => [{id: 1}]
                    })
                }
            });

            map.activateLayer("filterId", () => {
                called_onActivated = true;
            });

            nextTick(() => {
                expect(called_onActivated).to.be.true;
                expect(store.getters.layerConfigById("filterId").showInLayerTree).to.be.false;
            });
        });
    });
    describe("deactivateLayer", () => {
        it("should set isSelected and isVisible to false", () => {
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                type: "WFS",
                id: "filterId",
                isVisibleInMap: "true"
            };

            map.deactivateLayer("filterId");
            nextTick(() =>{
                expect(store.getters.layerConfigById("filterId").visibility).to.be.false;
            });
        });
    });
    describe("clearLayer", () => {
        it("should empty the array with filteredIds and call showFeaturesByIds to empty the map if extern is false", () => {
            let called_ids = false;
            const map = createMapHandler(onerror.call, {
                showFeaturesByIds: (layerId, ids) => {
                    called_ids = ids;
                }
            });

            map.layers.filterId = {
                id: "filterId"
            };
            stubGetLayerById({
                layer: {
                    getSource: () => ({
                        once: (eventname, handler) => handler(),
                        getFeatures: () => [{id: 1}]
                    })
                },
                getLayerSource: () => false
            });
            map.filteredIds.filterId = [1, 2, 3];

            map.clearLayer("filterId", false);

            nextTick(() => {
                expect(map.filteredIds.filterId).to.be.an("array").and.to.be.empty;
                expect(called_ids).to.be.an("array").and.to.be.empty;
            });
        });
        it("should empty the array with filteredIds and call the layerSource to clear the map, if extern is true", () => {
            let called_clear = false;
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                id: "filterId"
            };
            stubGetLayerById({
                layer: {
                    getSource: () => ({
                        once: (eventname, handler) => handler(),
                        getFeatures: () => [{id: 1}]
                    })
                },
                getLayerSource: () => ({
                    clear: () => {
                        called_clear = true;
                    }
                })
            });

            map.filteredIds.filterId = [1, 2, 3];

            map.clearLayer("filterId", true);

            nextTick(() => {
                expect(map.filteredIds.filterId).to.be.an("array").and.to.be.empty;
                expect(called_clear).to.be.true;
            });
        });
    });
    describe("addItemsToLayer", () => {
        it("should not try to set features to the map if filterId is unknown for filteredIds", () => {
            let called_showFeaturesByIds = false;
            const map = createMapHandler(onerror.call, {
                showFeaturesByIds: () => {
                    called_showFeaturesByIds = true;
                }
            });

            map.addItemsToLayer();

            expect(called_showFeaturesByIds).to.be.false;
        });
        it("should not try to set features to the map if items are not given as an array", () => {
            let called_showFeaturesByIds = false;
            const map = createMapHandler(onerror.call, {
                showFeaturesByIds: () => {
                    called_showFeaturesByIds = true;
                }
            });

            map.filteredIds.filterId = [];
            map.addItemsToLayer("filterId");

            expect(called_showFeaturesByIds).to.be.false;
        });
        it("should not try to set features to the map if there is not layer found for filterId", () => {
            let called_showFeaturesByIds = false;
            const map = createMapHandler(onerror.call, {
                showFeaturesByIds: () => {
                    called_showFeaturesByIds = true;
                }
            });

            map.layers.filterId = false;
            map.filteredIds.filterId = [];
            map.addItemsToLayer("filterId", []);

            expect(called_showFeaturesByIds).to.be.false;
        });
        it("should push items to filteredIds but with the unique id of the feature and not the ol feature id", () => {
            let called_showFeaturesByIds = false;
            const map = createMapHandler(onerror.call, {
                showFeaturesByIds: (layerId, ids) => {
                    called_showFeaturesByIds = ids;
                },
                createLayerIfNotExists: () => false
            });

            sinon.stub(layerCollection, "getLayerById").returns(
                sinon.createStubInstance(Layer2dVectorTile)
            );
            map.getLayerModelByFilterId = () => {
                return {
                    typ: "VectorTile"
                };
            };
            map.layers.filterId = {
                get: () => false
            };
            map.filteredIds.filterId = [];
            map.addItemsToLayer("filterId", [
                {getProperties: () => 10},
                {getProperties: () => 20},
                {getProperties: () => 30}
            ], false);
            expect(map.filteredIds.filterId).to.deep.equal({"10": true, "20": true, "30": true});
            expect(called_showFeaturesByIds).to.deep.equal({"10": true, "20": true, "30": true});
        });
        it("should push items to filteredIds and try to set them on the map if extern is false", () => {
            let called_showFeaturesByIds = false;
            const map = createMapHandler(onerror.call, {
                showFeaturesByIds: (layerId, ids) => {
                    called_showFeaturesByIds = ids;
                }
            });

            map.layers.filterId = {
                get: () => false
            };
            map.filteredIds.filterId = [];
            map.addItemsToLayer("filterId", [
                {getId: () => 10},
                {getId: () => 20},
                {getId: () => 30}
            ], false);

            nextTick(() => {
                expect(map.filteredIds.filterId).to.deep.equal([10, 20, 30]);
                expect(called_showFeaturesByIds).to.deep.equal([10, 20, 30]);
            });
        });
        it("should add items to layerSource if extern is true", () => {
            let called_items = false;
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                id: "filterId"
            };
            stubGetLayerById({
                layer: {
                    getSource: () => ({
                        addFeatures: items => {
                            called_items = items;
                        }
                    })
                }
            });
            map.filteredIds.filterId = [];
            map.addItemsToLayer("filterId", [
                {getId: () => 10},
                {getId: () => 20},
                {getId: () => 30}
            ], true);

            expect(map.filteredIds.filterId).to.deep.equal([10, 20, 30]);
            expect(called_items).to.be.an("array").and.not.to.be.empty;
        });
    });
    describe("zoomToFilteredFeature", () => {
        it("should not pass an error or start zoomToFilteredFeatures if isZooming is flagged", () => {
            let called_zoomToFilteredFeatures = false;
            const map = createMapHandler(onerror.call, {
                zoomToFilteredFeatures: () => {
                    called_zoomToFilteredFeatures = true;
                },
                changeLayerVisibility: () => false
            });

            map.isZooming = true;

            map.zoomToFilteredFeature("filterId", "minScale", onerror.call);
            expect(lastError).to.not.be.an.instanceof(Error);
            expect(called_zoomToFilteredFeatures).to.be.false;
            expect(map.isZooming).to.be.true;
        });
        it("should pass an error if minScale is not a number", () => {
            let called_zoomToFilteredFeatures = false;
            const map = createMapHandler(onerror.call, {
                zoomToFilteredFeatures: () => {
                    called_zoomToFilteredFeatures = true;
                }
            });

            map.zoomToFilteredFeature("filterId", "minScale", onerror.call);
            expect(lastError).to.be.an.instanceof(Error);
            expect(called_zoomToFilteredFeatures).to.be.false;
            expect(map.isZooming).to.be.false;
        });
        it("should try to zoom", () => {
            let called_zoomToFilteredFeatures = false;
            const map = createMapHandler(onerror.call, {
                zoomToFilteredFeatures: () => {
                    called_zoomToFilteredFeatures = true;
                },
                changeLayerVisibility: () => false
            });

            map.layers.filterId = {
                get: () => false
            };
            map.filteredIds.filterId = ["1", "2"];

            map.zoomToFilteredFeature("filterId", 0, onerror.call);

            expect(lastError).to.not.be.an.instanceof(Error);
            expect(called_zoomToFilteredFeatures).to.be.true;
            expect(map.isZooming).to.be.true;
        });
        it("should try to zoom with the expected parameters", () => {
            let called_minScale = false,
                called_filteredFeatureIds = false,
                called_layerId = false,
                called_callback = false;
            const map = createMapHandler(onerror.call, {
                zoomToFilteredFeatures: (minScale, filteredFeatureIds, layerId, callback) => {
                    called_minScale = minScale;
                    called_filteredFeatureIds = filteredFeatureIds;
                    called_layerId = layerId;
                    called_callback = callback;
                },
                changeLayerVisibility: () => false
            });

            map.layers.filterId = {
                id: "layerId"
            };
            map.filteredIds.filterId = [1, 2, 3];

            expect(map.isZooming).to.be.false;

            map.zoomToFilteredFeature("filterId", 10, onerror.call);

            expect(lastError).to.not.be.an.instanceof(Error);
            expect(called_minScale).to.equal(10);
            expect(called_filteredFeatureIds).to.deep.equal([1, 2, 3]);
            expect(called_layerId).to.equal("layerId");
            expect(map.isZooming).to.be.true;

            expect(called_callback).to.be.a("function");
            called_callback();
            expect(map.isZooming).to.be.false;
        });
    });
    describe("zoomToGeometry", () => {
        it("should not pass an error or start zoomToExtent if isZooming is flagged", () => {
            let called_zoomToExtent = false;
            const map = createMapHandler(onerror.call, {
                zoomToExtent: () => {
                    called_zoomToExtent = true;
                },
                changeLayerVisibility: () => false
            });

            map.isZooming = true;

            map.zoomToGeometry("geometry", "minScale", onerror.call);
            expect(lastError).to.not.be.an.instanceof(Error);
            expect(called_zoomToExtent).to.be.false;
            expect(map.isZooming).to.be.true;
        });
        it("should pass an error if minScale is not a number", () => {
            let called_zoomToExtent = false;
            const map = createMapHandler(onerror.call, {
                zoomToExtent: () => {
                    called_zoomToExtent = true;
                }
            });

            map.zoomToGeometry("geometry", "minScale", onerror.call);
            expect(lastError).to.be.an.instanceof(Error);
            expect(called_zoomToExtent).to.be.false;
            expect(map.isZooming).to.be.false;
        });
        it("should pass an error if geometry has no function getExtent", () => {
            let called_zoomToExtent = false;
            const map = createMapHandler(onerror.call, {
                zoomToExtent: () => {
                    called_zoomToExtent = true;
                }
            });

            map.zoomToGeometry({getExtent: false}, "minScale", onerror.call);
            expect(lastError).to.be.an.instanceof(Error);
            expect(called_zoomToExtent).to.be.false;
            expect(map.isZooming).to.be.false;
        });
        it("should try to zoom", () => {
            let called_zoomToExtent = false;
            const map = createMapHandler(onerror.call, {
                zoomToExtent: () => {
                    called_zoomToExtent = true;
                },
                changeLayerVisibility: () => false
            });

            map.zoomToGeometry({getExtent: () => false}, 0, onerror.call);

            expect(lastError).to.not.be.an.instanceof(Error);
            expect(called_zoomToExtent).to.be.true;
            expect(map.isZooming).to.be.true;
        });
        it("should try to zoom with the expected parameters", () => {
            let called_extent = false,
                called_minScale = false,
                called_callback = false;
            const map = createMapHandler(onerror.call, {
                zoomToExtent: (extent, minScale, callback) => {
                    called_extent = extent;
                    called_minScale = minScale;
                    called_callback = callback;
                },
                changeLayerVisibility: () => false
            });

            expect(map.isZooming).to.be.false;

            map.zoomToGeometry({getExtent: () => "extent"}, 10, onerror.call);

            expect(lastError).to.not.be.an.instanceof(Error);
            expect(called_extent).to.equal("extent");
            expect(called_minScale).to.equal(10);
            expect(map.isZooming).to.be.true;

            expect(called_callback).to.be.a("function");
            called_callback();
            expect(map.isZooming).to.be.false;
        });
    });
    describe("setObserverAutoInterval", () => {
        it("should set the given handler as observer", () => {
            let last_observer = false;
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                setObserverAutoInterval: observer => {
                    last_observer = observer;
                }
            };

            map.setObserverAutoInterval("filterId", "handler");
            expect(last_observer).to.equal("handler");
        });
    });
    describe("hasAutoRefreshInterval", () => {
        it("should return false if the layer has no autoRefresh set", () => {
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                id: "filterId"
            };

            expect(map.hasAutoRefreshInterval("filterId", "handler")).to.be.false;
        });
        it("should return true if the layer has an autoRefresh set", () => {
            const map = createMapHandler(onerror.call, {});

            map.layers.filterId = {
                id: "filterId",
                autoRefresh: 10000
            };

            expect(map.hasAutoRefreshInterval("filterId", "handler")).to.be.true;
        });
    });
});
