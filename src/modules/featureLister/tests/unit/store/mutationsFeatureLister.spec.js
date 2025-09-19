import {expect} from "chai";
import sinon from "sinon";
import mutations from "@modules/featureLister/store/mutationsFeatureLister.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import tabStatus from "../../../constantsTabStatus.js";

describe("src/modules/featureLister/store/mutationsFeatureLister", () => {
    let state, features, layer;

    beforeEach(() => {
        features = [{name: "erstesFeature", getId: () => "123", getGeometry: () => "Point"}, {name: "zweitesFeature", getId: () => "456", getGeometry: () => "LineString"}, {name: "drittesFeature", getId: () => "789", getGeometry: () => "Polygon"}];
        layer = {
            name: "ersterLayer",
            id: "1",
            getLayerSource: () => {
                return {
                    getFeatures: () => features
                };
            },
            getLayer: () => {
                return {
                    values_: []
                };
            }
        };
        state = {
            layer,
            setGfiFeaturesOfLayer: null,
            nestedFeatures: false,
            selectedFeatureIndex: null,
            layerListView: tabStatus.ACTIVE,
            featureListView: tabStatus.DISABLED,
            featureDetailView: tabStatus.DISABLED
        };
        sinon.stub(layerCollection, "getLayerById").returns(layer);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("setGfiFeaturesOfLayer", () => {
        it("sets the gfiFeatures of a layer to state - no clustering", () => {
            mutations.setGfiFeaturesOfLayer(state);
            expect(state.gfiFeaturesOfLayer.length).to.be.equals(3);
            expect(state.nestedFeatures).to.be.false;
            for (let i = 0; i < state.gfiFeaturesOfLayer.length; i++) {
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getAttributesToShow");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getDocument");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getFeatures");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getGfiUrl");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getId");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getLayerId");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getMimeType");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getOlFeature");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getProperties");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getTheme");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getTitle");
            }
        });
        it("sets the gfiFeatures of a layer to state - with clustering", () => {
            const clusteredFeatures = [
                    {name: "cluster1",
                        getId: () => "5.1", getGeometry: () => "ClusterGeometry"},
                    {name: "cluster2",
                        getId: () => "5.2", getGeometry: () => "ClusterGeometry"}
                ],
                clustered = {
                    values_: {
                        features: clusteredFeatures
                    }
                };

            features.push(clustered);

            mutations.setGfiFeaturesOfLayer(state);
            expect(state.gfiFeaturesOfLayer.length).to.be.equals(5);
            expect(state.nestedFeatures).to.be.true;
            for (let i = 0; i < state.gfiFeaturesOfLayer.length; i++) {
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getAttributesToShow");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getDocument");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getFeatures");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getGfiUrl");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getId");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getLayerId");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getMimeType");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getOlFeature");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getProperties");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getTheme");
                expect(state.gfiFeaturesOfLayer[i]).to.have.property("getTitle");
            }
        });
    });

    describe("resetToThemeChooser", () => {
        it("resets the state to display the themeChooser tab", () => {
            state.selectedRow = {id: 1};
            state.layerListView = tabStatus.ENABLED;
            state.featureListView = tabStatus.ACTIVE;
            state.featureDetailView = tabStatus.DISABLED;
            state.selectedArea = [[500000, 5900000], [501000, 5900000], [501000, 5899000], [500000, 5899000], [500000, 5900000]];

            mutations.resetToThemeChooser(state);
            expect(state.selectedRow).to.eql(null);
            expect(state.layer).to.eql(null);
            expect(state.selectedArea).to.eql(null);
            expect(state.layerListView).to.eql(tabStatus.ACTIVE);
            expect(state.featureListView).to.eql(tabStatus.DISABLED);
            expect(state.featureDetailView).to.eql(tabStatus.DISABLED);
        });
    });
});
