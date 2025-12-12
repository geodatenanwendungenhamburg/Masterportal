import {expect} from "chai";
import * as sinon from "sinon";

import actions from "@core/maps/store/actionsMapsZoomTo.js";
import featureProvider from "../../../js/zoomToGetAndFilterFeatures.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorLayer from "ol/layer/Vector.js";

/**
 * Fake function to replace createStyledFeatures for testing.
 * Returns OL Feature objects with minimal geometry.
 * @param {Feature[]} features
 * @returns {Feature[]} Array of styled features.
 */
function fakeCreateStyledFeatures (features) {
    return features.map((f, i) => new Feature({
        geometry: new Point([i, i]),
        name: `feature${i}`
    }));
}

/**
 * Fake function to replace calculateExtent for testing.
 * @returns {number[]} Returns a dummy extent
 */
function fakeCalculateExtent () {
    return [0, 0, 5, 5];
}

describe("src/core/maps/store/actionsMapsZoomTo.js", () => {
    let dispatch, rootGetters, param, consoleWarnSpy, consoleErrorSpy;

    beforeEach(() => {
        dispatch = sinon.spy();
        rootGetters = {zoomTo: []};
        param = {};
        consoleWarnSpy = sinon.stub(console, "warn");
        consoleErrorSpy = sinon.stub(console, "error");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should returns false if no config is given", async () => {
        rootGetters.zoomTo = null;
        const result = await actions.zoomToFeatures({dispatch, rootGetters}, param);

        expect(result).to.be.false;
        expect(dispatch.notCalled).to.be.true;
    });

    it("should warns if config exists but no URL param", async () => {
        rootGetters.zoomTo = [{id: "zoomToFeatureId"}];

        await actions.zoomToFeatures({dispatch, rootGetters}, param);

        expect(consoleWarnSpy.calledOnce).to.be.true;
        expect(dispatch.notCalled).to.be.true;
    });

    it("should adds features and zooms if feature request succeeds", async () => {
        let extent = null;

        rootGetters.zoomTo = [
            {id: "zoomToFeatureId", layerId: "layer1", styleId: "style"}
        ];
        param.ZOOMTOFEATUREID = ["1", "2"];

        sinon.stub(featureProvider, "getAndFilterFeatures").resolves([
            new Feature({geometry: new Point([0, 0])}),
            new Feature({geometry: new Point([1, 1])})
        ]);

        await actions.zoomToFeatures(
            {dispatch, rootGetters},
            param,
            fakeCreateStyledFeatures,
            fakeCalculateExtent
        );

        expect(dispatch.firstCall.args[0]).to.equal("Maps/addLayer");
        expect(dispatch.firstCall.args[1]).to.be.instanceOf(VectorLayer);

        const addedFeatures = dispatch.firstCall.args[1].getSource().getFeatures();

        expect(addedFeatures.length).to.equal(2);

        expect(dispatch.firstCall.args[2]).to.eql({root: true});

        expect(dispatch.secondCall.args[0]).to.equal("Maps/zoomToExtent");
        expect(dispatch.secondCall.args[1]).to.have.property("extent");

        extent = dispatch.secondCall.args[1].extent;

        expect(extent).to.have.lengthOf(4);
        expect(extent.every(n => typeof n === "number")).to.be.true;
        expect(dispatch.secondCall.args[2]).to.eql({root: true});

        expect(consoleWarnSpy.notCalled).to.be.true;
        expect(consoleErrorSpy.notCalled).to.be.true;
    });

    it("should dispatches alert if feature request fails", async () => {
        rootGetters.zoomTo = [
            {id: "zoomToFeatureId", layerId: "layer1", property: "prop"}
        ];
        param.ZOOMTOFEATUREID = ["1"];

        sinon.stub(featureProvider, "getAndFilterFeatures")
            .rejects(new Error("Error!"));

        await actions.zoomToFeatures({dispatch, rootGetters}, param);

        expect(dispatch.callCount).to.equal(1);
        expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");

        const err = dispatch.firstCall.args[1];

        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.equal("Error!");

        expect(dispatch.firstCall.args[2]).to.eql({root: true});
    });

    it("should handles mixed valid + invalid configs", async () => {
        rootGetters.zoomTo = [
            {id: "invalidConfig", layerId: "badLayer"},
            {id: "zoomToFeatureId", layerId: "layer1", property: "prop"}
        ];

        param.INVALIDCONFIG = ["x"];
        param.ZOOMTOFEATUREID = ["1"];

        sinon.stub(featureProvider, "getAndFilterFeatures").callsFake(layerId => {
            if (layerId === "layer1") {
                return Promise.resolve([new Feature({geometry: new Point([0, 0])})]);
            }
            return Promise.reject(new Error("Invalid config!"));
        });

        await actions.zoomToFeatures(
            {dispatch, rootGetters},
            param,
            fakeCreateStyledFeatures,
            fakeCalculateExtent
        );

        expect(dispatch.getCall(0).args[0]).to.equal("Maps/addLayer");
        expect(dispatch.getCall(0).args[1]).to.be.instanceOf(VectorLayer);
        expect(dispatch.getCall(1).args[0]).to.equal("Alerting/addSingleAlert");
        expect(dispatch.getCall(1).args[1]).to.be.instanceOf(Error);
        expect(dispatch.getCall(2).args[0]).to.equal("Maps/zoomToExtent");
        const extent = dispatch.getCall(2).args[1].extent;

        expect(extent).to.have.lengthOf(4);
        expect(dispatch.getCall(2).args[2]).to.eql({root: true});
    });
    it("should handles multiple valid zoomTo configs and zooms for each", async () => {
        rootGetters.zoomTo = [
            {id: "zoomToA", layerId: "layerA"},
            {id: "zoomToB", layerId: "layerB"}
        ];

        param.ZOOMTOA = ["1"];
        param.ZOOMTOB = ["2"];

        sinon.stub(featureProvider, "getAndFilterFeatures").callsFake(layerId => {
            if (layerId === "layerA") {
                return Promise.resolve([new Feature({geometry: new Point([10, 10])})]);
            }
            if (layerId === "layerB") {
                return Promise.resolve([new Feature({geometry: new Point([20, 20])})]);
            }
            return Promise.reject(new Error("Unexpected layer!"));
        });

        await actions.zoomToFeatures(
            {dispatch, rootGetters},
            param,
            fakeCreateStyledFeatures,
            fakeCalculateExtent
        );

        expect(dispatch.getCall(0).args[0]).to.equal("Maps/addLayer");
        expect(dispatch.getCall(1).args[0]).to.equal("Maps/addLayer");
        expect(dispatch.getCall(2).args[0]).to.equal("Maps/zoomToExtent");
        expect(dispatch.getCall(2).args[2]).to.eql({root: true});
    });

    it("should warns and does nothing if provider returns an empty feature array", async () => {
        rootGetters.zoomTo = [
            {id: "zoomToFeatureId", layerId: "layerX"}
        ];
        param.ZOOMTOFEATUREID = ["123"];

        sinon.stub(featureProvider, "getAndFilterFeatures").resolves([]);

        await actions.zoomToFeatures({dispatch, rootGetters}, param);

        expect(consoleWarnSpy.calledOnce).to.be.true;
        expect(dispatch.notCalled).to.be.true;
    });

    it("should dispatches alert if getAndFilterFeatures promise is rejected", async () => {
        rootGetters.zoomTo = [
            {id: "zoomToFeatureId", layerId: "layer1"}
        ];
        param.ZOOMTOFEATUREID = ["1"];

        sinon.stub(featureProvider, "getAndFilterFeatures").rejects(new Error("Feature fetch failed"));

        await actions.zoomToFeatures({dispatch, rootGetters}, param);
        expect(dispatch.calledWith("Alerting/addSingleAlert")).to.be.true;

        const alertArgs = dispatch.getCalls().find(c => c.args[0] === "Alerting/addSingleAlert").args[1];

        expect(alertArgs).to.be.instanceOf(Error);
        expect(alertArgs.message).to.equal("Feature fetch failed");
        expect(dispatch.calledWith("Maps/addLayer")).to.be.false;
    });
    it("should resolve with a reason if a config is given but no url parameter", async () => {
        rootGetters.zoomTo = [{id: "zoomToFeatureId"}];

        await actions.zoomToFeatures({dispatch, rootGetters}, param);

        expect(consoleWarnSpy.calledOnce).to.be.true;
        expect(dispatch.notCalled).to.be.true;
    });

    it("should throw an error and dispatch an alert if an error occurs while fetching the features", async () => {
        rootGetters.zoomTo = [
            {id: "zoomToFeatureId", layerId: "layer1"}
        ];
        param.ZOOMTOFEATUREID = ["1"];

        sinon.stub(featureProvider, "getAndFilterFeatures").rejects(new Error("Custom testing error!"));

        await actions.zoomToFeatures({dispatch, rootGetters}, param);

        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");
        const err = dispatch.firstCall.args[1];

        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.equal("Custom testing error!");
        expect(dispatch.firstCall.args[2]).to.eql({root: true});
        expect(consoleWarnSpy.calledOnce).to.be.true;
        expect(consoleWarnSpy.firstCall.args[0]).to.equal("zoomTo: No features were found for the given layer.");
    });

    it("should add features to the map for one working config (zoomToFeatureId) and dispatch an alert for a configuration with an invalid id if both are present", async () => {
        rootGetters.zoomTo = [
            {id: "somethingWrong", layerId: "badLayer"},
            {id: "zoomToFeatureId", layerId: "layer1"}
        ];
        param.SOMETHINGWRONG = ["x"];
        param.ZOOMTOFEATUREID = ["1"];

        sinon.stub(featureProvider, "getAndFilterFeatures").callsFake(layerId => {
            if (layerId === "layer1") {
                return Promise.resolve([new Feature({geometry: new Point([0, 0])})]);
            }
            return Promise.reject(new Error("utils.parametricURL.zoomTo"));
        });

        await actions.zoomToFeatures({dispatch, rootGetters}, param, fakeCreateStyledFeatures, fakeCalculateExtent);

        expect(dispatch.getCall(0).args[0]).to.equal("Maps/addLayer");
        expect(dispatch.getCall(1).args[0]).to.equal("Alerting/addSingleAlert");
        expect(dispatch.getCall(1).args[1]).to.be.instanceOf(Error);
        expect(dispatch.getCall(2).args[0]).to.equal("Maps/zoomToExtent");
    });

    it("should add features to the map for one config of zoomToFeatureId", async () => {
        rootGetters.zoomTo = [{id: "zoomToFeatureId", layerId: "layer1"}];
        param.ZOOMTOFEATUREID = ["1"];

        sinon.stub(featureProvider, "getAndFilterFeatures").resolves([new Feature({geometry: new Point([0, 0])})]);

        await actions.zoomToFeatures({dispatch, rootGetters}, param, fakeCreateStyledFeatures, fakeCalculateExtent);

        expect(dispatch.firstCall.args[0]).to.equal("Maps/addLayer");
        expect(dispatch.secondCall.args[0]).to.equal("Maps/zoomToExtent");
    });

    it("should zoom to the feature extent but not add the features for one config of zoomToFeatureId with addFeatures set to false", async () => {
        rootGetters.zoomTo = [{id: "zoomToFeatureId", layerId: "layer1", addFeatures: false}];
        param.ZOOMTOFEATUREID = ["1"];

        sinon.stub(featureProvider, "getAndFilterFeatures").resolves([new Feature({geometry: new Point([0, 0])})]);

        await actions.zoomToFeatures({dispatch, rootGetters}, param, fakeCreateStyledFeatures, fakeCalculateExtent);

        expect(dispatch.firstCall.args[0]).to.equal("Maps/zoomToExtent");
        expect(dispatch.calledOnce).to.be.true;
    });

    it("should add features to the map for one config of zoomToGeometry", async () => {
        rootGetters.zoomTo = [{
            id: "zoomToGeometry",
            layerId: "layer1",
            allowedValues: ["18", "25", "30"],
            property: "flaechenid"
        }];

        param.ZOOMTOGEOMETRY = "18, 25";

        sinon.stub(featureProvider, "getAndFilterFeatures").resolves([
            new Feature({
                geometry: new Point([0, 0]),
                flaechenid: "18"
            })
        ]);

        await actions.zoomToFeatures({dispatch, rootGetters}, param, fakeCreateStyledFeatures, fakeCalculateExtent);

        expect(dispatch.firstCall.args[0]).to.equal("Maps/addLayer");
        expect(dispatch.secondCall.args[0]).to.equal("Maps/zoomToExtent");
    });

    it("should zoom to the feature extent but not add the features for one config of zoomToGeometry with addFeatures set to false", async () => {
        rootGetters.zoomTo = [{
            id: "zoomToGeometry",
            layerId: "layer1",
            addFeatures: false,
            allowedValues: ["1", "2", "3"],
            property: "flaechenid"
        }];
        param.ZOOMTOGEOMETRY = "1";

        sinon.stub(featureProvider, "getAndFilterFeatures").resolves([
            new Feature({
                geometry: new Point([0, 0]),
                flaechenid: "1"
            })
        ]);

        await actions.zoomToFeatures({dispatch, rootGetters}, param, fakeCreateStyledFeatures, fakeCalculateExtent);

        expect(dispatch.firstCall.args[0]).to.equal("Maps/zoomToExtent");
        expect(dispatch.calledOnce).to.be.true;
    });
});
