import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/featureLister/store/actionsFeatureLister.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import createLayerAddToTreeModule from "@shared/js/utils/createLayerAddToTree.js";
import tabStatus from "../../../constantsTabStatus.js";
import spatialSelection from "../../../js/getSpatialSelection.js";

describe("src/modules/featureLister/store/actionsFeatureLister", () => {
    let commit, dispatch, rootGetters;
    const highlightVectorRulesPolygon = {
            "fill": {
                "color": [255, 0, 255, 0.9]
            },
            "stroke": {
                "width": 4,
                "color": [0, 0, 204, 0.9]
            },
            "zoomLevel": 5
        },
        highlightVectorRulesPointLine = {
            "stroke": {
                "width": 8,
                "color": [255, 0, 255, 0.9]
            },
            "image": {
                "scale": 2
            },
            "zoomLevel": 5
        };

    document.body.innerHTML =
        "<div id=\"parent\">" +
        "   <div id=\"featureLister\">" +
        "       <p id=\"tool-feature-lister-list\" >Liste der Feature</p>" +
        "   </div>" +
        "   <ul class=\"feature-lister-navtabs\">" +
        "       <li id=\"tool-feature-lister-themeChooser\" >Liste der Layer</li>" +
        "       <li id=\"tool-feature-lister-list\" >Liste der Feature</li>" +
        "       <li id=\"tool-feature-lister-details\" >Detailansicht</li>" +
        "   </ul>" +
        "</div>";

    beforeEach(() => {
        const state = {
            geometry: {getType: () => {
                "Point";
            }},
            source: {getFeatures: () => [{name: "feature", id: "1", getId: () => "1", getGeometry: () => state.geometry}]}
        };

        commit = sinon.spy();
        dispatch = sinon.spy();
        sinon.stub(layerCollection, "getOlLayers").returns(
            [
                {name: "ersterLayer", values_: {id: "123"}, getSource: () => state.source, features: [{getAttributesToShow: () => "TestAttributes"}], geometryType: "Point"},
                {name: "zweiterLayer", values_: {id: "456"}, features: [{getAttributesToShow: () => "TestAttributes"}], geometryType: "Point"},
                {name: "dritterLayer", values_: {id: "789"}, features: [{getAttributesToShow: () => "TestAttributes"}], geometryType: "Point"}
            ]
        );

    });
    afterEach(() => {
        sinon.restore();
    });

    describe.skip("clickOnFeature", () => {
        it("handles the click event when clicking in a point-feature in the feature list view", () => {
            const row = {
                    id: "1"
                },
                geometry = {
                    getType: () => "Point",
                    getCoordinates: () => [1, 2]
                },
                state = {
                    shownFeatures: 20,
                    features: [{erstesFeature: "first", getGeometry: () => "Point"}, {zweitesFeature: "second", getGeometry: () => geometry}, {drittesFeature: "third"}],
                    layer: {
                        id: "layerId",
                        geometryType: "Point",
                        features: [{erstesFeature: "first"}, {zweitesFeature: "second"}, {drittesFeature: "third"}]
                    },
                    highlightVectorRulesPointLine
                },
                getters = {
                    selectedFeature: () => state.features[1],
                    getGeometryType: "Point"
                },
                createLayerAddToTreeStub = sinon.spy(createLayerAddToTreeModule, "createLayerAddToTree");

            rootGetters = {treeHighlightedFeatures: {active: true}};

            actions.clickOnFeature({state, commit, dispatch, getters, rootGetters}, row);
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedRow");
            expect(commit.firstCall.args[1]).to.eql(row);
            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.eql("switchToDetails");
            expect(dispatch.secondCall.args[0]).to.eql("Maps/zoomToCoordinates");
            expect(dispatch.secondCall.args[1]).to.deep.eql({center: [1, 2]});
            expect(dispatch.thirdCall.args[0]).to.eql("Maps/setZoom");
            expect(dispatch.thirdCall.args[1]).to.deep.eql(5);
            expect(createLayerAddToTreeStub.calledOnce).to.be.true;
            expect(createLayerAddToTreeStub.firstCall.args[0]).to.be.deep.equals(state.layer.id);
            expect(createLayerAddToTreeStub.firstCall.args[1]).to.be.deep.equals([state.features[1]]);
        });
        it("handles the click event when clicking in a polygon-feature in the feature list view, treeHighlightedFeatures not active", () => {
            const row = {
                    id: "1"
                },
                geometry = {
                    getType: () => "Polygon",
                    getExtent: () => [1, 2, 3, 4]
                },
                state = {
                    shownFeatures: 20,
                    features: [{erstesFeature: "first", getGeometry: () => "Point"}, {zweitesFeature: "second", getGeometry: () => geometry}, {drittesFeature: "third"}],
                    layer: {
                        id: "layerId",
                        geometryType: "Polygon",
                        features: [{erstesFeature: "first"}, {zweitesFeature: "second"}, {drittesFeature: "third"}]
                    },
                    highlightVectorRulesPolygon
                },
                getters = {
                    selectedFeature: () => state.features[1],
                    getGeometryType: "Polygon"
                },
                createLayerAddToTreeStub = sinon.spy(createLayerAddToTreeModule, "createLayerAddToTree");

            rootGetters = {treeHighlightedFeatures: {active: false}};

            actions.clickOnFeature({state, commit, dispatch, getters, rootGetters}, row);
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedRow");
            expect(commit.firstCall.args[1]).to.eql(row);
            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.eql("switchToDetails");
            expect(dispatch.secondCall.args[0]).to.eql("Maps/zoomToCoordinates");
            expect(dispatch.secondCall.args[1]).to.deep.eql({center: [2, 3]});
            expect(dispatch.thirdCall.args[0]).to.eql("Maps/setZoom");
            expect(dispatch.thirdCall.args[1]).to.deep.eql(5);
            expect(createLayerAddToTreeStub.notCalled).to.be.true;
        });
    });

    describe("hoverOverFeature", () => {
        const feature1 = {erstesFeature: "first", getId: () => "1", getGeometry: () => ({
                getType: () => "Point",
                flatCoordinates: [1, 2]
            })},
            feature2 = {zweitesFeature: "second", getId: () => "2", getGeometry: () => ({
                getType: () => "Polygon"
            })},
            feature3 = {drittesFeature: "third", getId: () => "3", getGeometry: () => ({
                getType: () => "LineString",
                flatCoordinates: [5, 6, 7, 5]
            })},
            features = [feature1, feature2, feature3],
            state = {
                shownFeatures: 2
            },
            row1 = {
                id: "1"
            },
            row2 = {
                id: "2"
            },
            row3 = {
                id: "3"
            },
            getters = {
                selectedFeature: (id) => features.find(feature => feature.getId() === id)
            };

        it("handles the hover event when hovering over a point feature in the feature list view", () => {
            actions.hoverOverFeature({state, dispatch, getters}, row1);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/placingPointMarker");
            expect(dispatch.firstCall.args[1]).to.deep.equal(feature1.getGeometry().flatCoordinates);
        });
        it("handles the hover event when hovering over a polygon feature in the feature list view", () => {
            actions.hoverOverFeature({state, dispatch, getters}, row2);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/placingPolygonMarker");
        });
        it("handles the hover event when hovering over a linestring feature in the feature list view", () => {
            actions.hoverOverFeature({state, dispatch, getters}, row3);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/placingPointMarker");
            expect(dispatch.firstCall.args[1]).to.deep.equal([feature3.getGeometry().flatCoordinates[0], feature3.getGeometry().flatCoordinates[1]]);
        });
    });

    describe("highlightSelectedFeatures", () => {
        let geometryType = "Point",
            feature, state, getters;

        beforeEach(() => {
            feature = {
                getGeometry: () => {
                    return {
                        getType: () => geometryType

                    };
                },
                getId: () => "featureID"
            };
            state = {
                layer: {
                    name: "ersterLayer",
                    id: "123",
                    styleId: "123",
                    geometryType: geometryType
                },
                highlightVectorRulesPolygon,
                highlightVectorRulesPointLine
            };
            getters = {
                getGeometryType: geometryType,
                selectedFeature: () => feature
            };
            rootGetters = {
                layerConfigById: sinon.stub().returns({styleId: "123"})
            };
        });

        it("highlights a point feature depending on its geometryType", () => {
            actions.highlightSelectedFeatures({state, dispatch, getters, rootGetters}, [feature]);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/highlightFeature");
            expect(dispatch.firstCall.args[1].type).to.equal("increase");
            expect(dispatch.firstCall.args[1].styleId).to.equal("123");
        });
        it("highlights a MultiPoint feature depending on its geometryType", () => {
            geometryType = "MultiPoint";
            actions.highlightSelectedFeatures({state, dispatch, getters, rootGetters}, [feature]);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/highlightFeature");
            expect(dispatch.firstCall.args[1].type).to.equal("increase");
            expect(dispatch.firstCall.args[1].styleId).to.equal("123");
        });
        it("highlights a polygon feature depending on its geometryType", () => {
            geometryType = "Polygon";
            actions.highlightSelectedFeatures({state, dispatch, getters, rootGetters}, [feature]);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/highlightFeature");
            expect(dispatch.firstCall.args[1].type).to.equal("highlightPolygon");
            expect(dispatch.firstCall.args[1].styleId).to.equal("123");
        });
        it("highlights a line feature depending on its geometryType", () => {
            geometryType = "LineString";
            actions.highlightSelectedFeatures({state, dispatch, getters, rootGetters}, [feature]);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/highlightFeature");
            expect(dispatch.firstCall.args[1].type).to.equal("highlightLine");
            expect(dispatch.firstCall.args[1].styleId).to.equal("123");
        });
    });

    describe("filterGfiFeaturesOfLayer", () => {
        let getSpatialSelectionStub, layer, features, state, rootState;

        beforeEach(() => {
            layer = {name: "ersterLayer", id: "123", typ: "TEST"};
            features = [{id: "1"}, {id: "2"}, {id: "3"}];
            state = {
                selectedArea: {
                    type: "Polygon",
                    coordinates: [
                        [564000, 5938000],
                        [565000, 5939000],
                        [564500, 5938500],
                        [564000, 5938000]
                    ]},
                maxFeatures: 10,
                layer: layer,
                gfiFeaturesOfLayer: [{erstesFeature: "first"}, {zweitesFeature: "second"}, {drittesFeature: "third"}]
            };
            rootState = {
                Maps: {
                    projection: {
                        getCode: () => "EPSG:25832"
                    }
                }
            };
            rootGetters = {
                visibleLayerConfigs: [layer]
            };
            getSpatialSelectionStub = sinon.stub(spatialSelection, "getSpatialSelection").resolves(features);
        });
        afterEach(() => {
            getSpatialSelectionStub.restore();
        });

        it("filters the features of a layer", async () => {
            await actions.filterGfiFeaturesOfLayer({state, commit, dispatch, rootGetters, rootState});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setGfiFeaturesOfLayer");
            expect(commit.firstCall.args[1]).to.deep.equal(features);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("highlightSelectedFeatures");
            expect(dispatch.firstCall.args[1]).to.equal(features);
        });
    });

    describe("switchToList", () => {
        const layer = {name: "ersterLayer", id: "123", features: [{values_: {features: [1, 2]}}], geometryType: "Point"},
            state = {
                selectedArea: null,
                maxFeatures: 10,
                layer: layer,
                gfiFeaturesOfLayer: [{erstesFeature: "first"}, {zweitesFeature: "second"}, {drittesFeature: "third"}]
            },
            dispatchStub = sinon.stub();

        dispatchStub.withArgs("processGfiFeatures").resolves();

        it("switches to the feature list view", async () => {
            await actions.switchToList({state, rootGetters, commit, dispatch}, layer);

            expect(dispatch.calledOnce).to.be.true;
            expect(commit.callCount).to.equal(5);
            expect(commit.firstCall.args[0]).to.equal("setFeatureCount");
            expect(commit.secondCall.args[0]).to.equal("setShownFeatures");
            expect(commit.secondCall.args[1]).to.equal(3);
        });
    });

    describe("switchBackToList", () => {
        it("switches to back to list", () => {
            const state = {
                layer: {}
            };

            actions.switchBackToList({state, commit});
            expect(commit.calledThrice).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setLayerListView");
            expect(commit.firstCall.args[1]).to.equal(tabStatus.ENABLED);
            expect(commit.secondCall.args[0]).to.equal("setFeatureDetailView");
            expect(commit.secondCall.args[1]).to.equal(tabStatus.ENABLED);
            expect(commit.thirdCall.args[0]).to.equal("setFeatureListView");
            expect(commit.thirdCall.args[1]).to.equal(tabStatus.ACTIVE);
        });
    });


    describe("switchToThemes", () => {
        it("switches to the themes tab", () => {

            actions.switchToThemes({commit, dispatch});
            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/removeHighlightFeature");
            expect(dispatch.firstCall.args[1]).to.equal("decrease");
            expect(dispatch.secondCall.args[0]).to.equal("Maps/removePointMarker");
            expect(dispatch.thirdCall.args[0]).to.equal("Maps/removePolygonMarker");
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("resetToThemeChooser");
        });
    });

    describe("switchToDetails", () => {
        it("switches to the details tab", () => {
            const state = {
                selectedRow: {
                    id: "1"
                }
            };

            actions.switchToDetails({state, commit});
            expect(commit.firstCall.args[0]).to.equal("setLayerListView");
            expect(commit.firstCall.args[1]).to.equal(tabStatus.ENABLED);
            expect(commit.secondCall.args[0]).to.equal("setFeatureListView");
            expect(commit.secondCall.args[1]).to.equal(tabStatus.ENABLED);
            expect(commit.thirdCall.args[0]).to.equal("setFeatureDetailView");
            expect(commit.thirdCall.args[1]).to.equal(tabStatus.ACTIVE);
        });
    });

    describe("showMore", () => {
        const state = {
            shownFeatures: 20,
            featureCount: 100
        };

        it("adds ten more features to the list view if the total featureCount is big enough", () => {
            actions.showMore({state, commit, dispatch});
            expect(commit.firstCall.args[0]).to.equal("setShownFeatures");
            expect(commit.firstCall.args[1]).to.equal(30);
        });
        it("adds as many features as neccessary to meet the total featureCount", () => {
            state.featureCount = 25;

            actions.showMore({state, commit, dispatch});
            expect(commit.firstCall.args[0]).to.equal("setShownFeatures");
            expect(commit.firstCall.args[1]).to.equal(25);
        });
    });

});
