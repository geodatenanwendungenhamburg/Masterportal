import {expect} from "chai";
import axios from "axios";
import * as sinon from "sinon";
import {nextTick} from "vue";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";

import actions from "@core/maps/store/actionsMapsZoomTo.js";
import featureProvider from "../../../js/zoomToGetAndFilterFeatures.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorLayer from "ol/layer/Vector.js";

const fs = require("fs"),
    exampleFeatureCollection = fs.readFileSync("./src/core/maps/tests/unit/resources/featureCollection.xml", "utf8"),
    id = "someId";

/**
 * Fakes the return of a successful axios get request.
 *
 * @returns {Promise<{data: string, status: number}>} Status code and a FeatureCollection in XML.
 */
function axiosFake () {
    return new Promise(resolve => resolve({status: 200, statusText: "OK", data: exampleFeatureCollection}));
}

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
    describe("zoomToFeatures", () => {
        let consoleErrorSpy,
            consoleWarnSpy,
            dispatch,
            rootGetters,
            param;

        beforeEach(() => {
            consoleErrorSpy = sinon.spy();
            consoleWarnSpy = sinon.spy();
            dispatch = sinon.spy();
            sinon.stub(console, "error").callsFake(consoleErrorSpy);
            sinon.stub(console, "warn").callsFake(consoleWarnSpy);

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
                expect(dispatch.firstCall.args[1].get("alwaysOnTop")).to.be.true;

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

                afterEach(() => {
                    sinon.restore();
                    rawLayerList.getLayerList().length = 0;
                });
                it("should resolve with a reason if a config is given but no url parameter", () => {
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.zoomTo = [{id: "zoomToFeatureId"}];
                    actions.zoomToFeatures({dispatch, rootGetters}, param)
                        .then(reason => {
                            expect(consoleWarnSpy.notCalled).to.be.true;
                            expect(consoleErrorSpy.notCalled).to.be.true;
                            expect(reason).to.equal("zoomTo: No url parameters were given by the user.");
                        });
                });

                it("should throw an error and dispatch an alert if an error occurs while fetching the features", async () => {
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.configJs = [{
                        id: "zoomToGeometry",
                        layerId: id,
                        property: "flaechenid",
                        allowedValues: [18, 26, 42]
                    }];
                    param.zoomToGeometry = "18,25";
                    // NOTE: These sinon functions are needed here again to be able to add new behaviour to the axios.get method
                    sinon.restore();
                    sinon.stub(axios, "get").callsFake(() => new Promise((_, reject) => reject("Custom testing error!")));
                    sinon.stub(console, "error").callsFake(consoleErrorSpy);
                    sinon.stub(console, "warn").callsFake(consoleWarnSpy);
                    await actions.zoomToFeatures({dispatch, rootGetters}, param);

                    nextTick(() => {
                        expect(consoleErrorSpy.notCalled).to.be.true;
                        expect(dispatch.calledOnce).to.be.true;
                        expect(dispatch.firstCall.args.length).to.equal(3);
                        expect(dispatch.firstCall.args).to.eql(["Alerting/addSingleAlert", "Custom testing error!", {root: true}]);
                        expect(consoleWarnSpy.calledOnce).to.be.true;
                        expect(consoleWarnSpy.firstCall.args.length).to.equal(1);
                        expect(consoleWarnSpy.firstCall.args[0]).to.equal("zoomTo: No features were found for the given layer.");
                    });
                });

                it("should add features to the map for one working config (zoomToFeatureId) and dispatch an alert for a configuration with an invalid id if both are present", async () => {
                    sinon.stub(createStyle, "createStyle").returns(true);
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.configJs = [{id: "somethingWrong"}, {
                        id: "zoomToFeatureId",
                        layerId: id,
                        property: "flaechenid",
                        styleId: "stylish"
                    }];
                    param.somethingWrong = "values";
                    param.zoomToFeatureId = [18, 26];
                    await actions.zoomToFeatures({dispatch, rootGetters}, param);

                    nextTick(() => {
                        expect(consoleWarnSpy.notCalled).to.be.true;
                        expect(consoleErrorSpy.notCalled).to.be.true;
                        expect(dispatch.calledThrice).to.be.true;
                        expect(dispatch.firstCall.args.length).to.equal(3);
                        expect(dispatch.firstCall.args[0]).to.equal("Maps/addLayerOnTop");
                        expect(dispatch.firstCall.args[1] instanceof VectorLayer).to.be.true;
                        expect(dispatch.firstCall.args[1].getSource().getFeatures().length).to.equal(2);
                        expect(dispatch.firstCall.args[2]).to.eql({root: true});
                        expect(dispatch.secondCall.args.length).to.equal(3);
                        expect(dispatch.secondCall.args).to.eql(["Alerting/addSingleAlert", "utils.parametricURL.zoomTo", {root: true}]);
                        expect(dispatch.thirdCall.args.length).to.equal(3);
                        expect(dispatch.thirdCall.args[0]).to.equal("Maps/zoomToExtent");
                        expect(dispatch.thirdCall.args[1] instanceof Object).to.be.true;
                        expect(Object.prototype.hasOwnProperty.call(dispatch.thirdCall.args[1], "extent")).to.be.true;
                        expect(dispatch.thirdCall.args[1].extent.length).to.equal(4);
                        expect(dispatch.thirdCall.args[1].extent.every(val => typeof val === "number")).to.be.true;
                        expect(dispatch.thirdCall.args[2]).to.eql({root: true});
                    });
                });
                it("should add features to the map for one config of zoomToFeatureId", async () => {
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.configJs = [{
                        id: "zoomToFeatureId",
                        layerId: id,
                        property: "flaechenid",
                        styleId: "stylish"
                    }];
                    param.zoomToFeatureId = [18, 26];
                    await actions.zoomToFeatures({dispatch, rootGetters}, param);

                    nextTick(() => {
                        expect(consoleWarnSpy.notCalled).to.be.true;
                        expect(consoleErrorSpy.notCalled).to.be.true;
                        expect(dispatch.calledTwice).to.be.true;
                        expect(dispatch.firstCall.args.length).to.equal(3);
                        expect(dispatch.firstCall.args[0]).to.equal("Maps/addLayerOnTop");
                        expect(dispatch.firstCall.args[1] instanceof VectorLayer).to.be.true;
                        expect(dispatch.firstCall.args[1].getSource().getFeatures().length).to.equal(2);
                        expect(dispatch.firstCall.args[2]).to.eql({root: true});
                        expect(dispatch.secondCall.args.length).to.equal(3);
                        expect(dispatch.secondCall.args[0]).to.equal("Maps/zoomToExtent");
                        expect(dispatch.secondCall.args[1] instanceof Object).to.be.true;
                        expect(Object.prototype.hasOwnProperty.call(dispatch.secondCall.args[1], "extent")).to.be.true;
                        expect(dispatch.secondCall.args[1].extent.length).to.equal(4);
                        expect(dispatch.secondCall.args[1].extent.every(val => typeof val === "number")).to.be.true;
                        expect(dispatch.secondCall.args[2]).to.eql({root: true});
                    });
                });
                it("should zoom to the feature extent but not add the features for one config of zoomToFeatureId with addFeatures set to false", async () => {
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.configJs = [{
                        id: "zoomToFeatureId",
                        layerId: id,
                        property: "flaechenid",
                        styleId: "stylish",
                        addFeatures: false
                    }];
                    param.zoomToFeatureId = [18, 26];
                    await actions.zoomToFeatures({dispatch, rootGetters}, param);

                    nextTick(() => {
                        expect(consoleWarnSpy.notCalled).to.be.true;
                        expect(consoleErrorSpy.notCalled).to.be.true;
                        expect(dispatch.calledOnce).to.be.true;
                        expect(dispatch.firstCall.args.length).to.equal(3);
                        expect(dispatch.firstCall.args[0]).to.equal("Maps/zoomToExtent");
                        expect(dispatch.firstCall.args[1] instanceof Object).to.be.true;
                        expect(Object.prototype.hasOwnProperty.call(dispatch.firstCall.args[1], "extent")).to.be.true;
                        expect(dispatch.firstCall.args[1].extent.length).to.equal(4);
                        expect(dispatch.firstCall.args[1].extent.every(val => typeof val === "number")).to.be.true;
                        expect(dispatch.firstCall.args[2]).to.eql({root: true});
                    });
                });
                it("should add features to the map for one config of zoomToGeometry", async () => {
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.configJs = [{
                        id: "zoomToGeometry",
                        layerId: id,
                        property: "flaechenid",
                        allowedValues: [18, 26, 42]
                    }];
                    param.zoomToGeometry = "18,25";
                    await actions.zoomToFeatures({dispatch, rootGetters}, param);

                    nextTick(() => {
                        expect(consoleWarnSpy.notCalled).to.be.true;
                        expect(consoleErrorSpy.notCalled).to.be.true;
                        expect(dispatch.calledTwice).to.be.true;
                        expect(dispatch.firstCall.args.length).to.equal(3);
                        expect(dispatch.firstCall.args[0]).to.equal("Maps/addLayerOnTop");
                        expect(dispatch.firstCall.args[1] instanceof VectorLayer).to.be.true;
                        expect(dispatch.firstCall.args[1].getSource().getFeatures().length).to.equal(1);
                        expect(dispatch.firstCall.args[2]).to.eql({root: true});
                        expect(dispatch.secondCall.args.length).to.equal(3);
                        expect(dispatch.secondCall.args[0]).to.equal("Maps/zoomToExtent");
                        expect(dispatch.secondCall.args[1] instanceof Object).to.be.true;
                        expect(Object.prototype.hasOwnProperty.call(dispatch.secondCall.args[1], "extent")).to.be.true;
                        expect(dispatch.secondCall.args[1].extent.length).to.equal(4);
                        expect(dispatch.secondCall.args[1].extent.every(val => typeof val === "number")).to.be.true;
                        expect(dispatch.secondCall.args[2]).to.eql({root: true});
                    });
                });
                it("should zoom to the feature extent but not add the features for one config of zoomToGeometry with addFeatures set to false", async () => {
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.configJs = [{
                        id: "zoomToGeometry",
                        layerId: id,
                        property: "flaechenid",
                        allowedValues: [18, 26, 42],
                        addFeatures: false
                    }];
                    param.zoomToGeometry = "18,25";
                    await actions.zoomToFeatures({dispatch, rootGetters}, param);

                    nextTick(() => {
                        expect(consoleWarnSpy.notCalled).to.be.true;
                        expect(consoleErrorSpy.notCalled).to.be.true;
                        expect(dispatch.calledOnce).to.be.true;
                        expect(dispatch.firstCall.args.length).to.equal(3);
                        expect(dispatch.firstCall.args[0]).to.equal("Maps/zoomToExtent");
                        expect(dispatch.firstCall.args[1] instanceof Object).to.be.true;
                        expect(Object.prototype.hasOwnProperty.call(dispatch.firstCall.args[1], "extent")).to.be.true;
                        expect(dispatch.firstCall.args[1].extent.length).to.equal(4);
                        expect(dispatch.firstCall.args[1].extent.every(val => typeof val === "number")).to.be.true;
                        expect(dispatch.firstCall.args[2]).to.eql({root: true});
                    });
                });
                it("should add features to the map for one config of zoomToFeatureId and one of zoomToGeometry", async () => {
                    sinon.stub(axios, "get").callsFake(axiosFake);
                    rootGetters.configJs = [
                        {
                            id: "zoomToFeatureId",
                            layerId: id,
                            property: "flaechenid",
                            styleId: "stylish"
                        },
                        {
                            id: "zoomToGeometry",
                            layerId: id,
                            property: "flaechenid",
                            allowedValues: [18, 26, 42]
                        }
                    ];
                    param.zoomToFeatureId = [18];
                    param.zoomToGeometry = "24,42";
                    await actions.zoomToFeatures({dispatch, rootGetters}, param);

                    nextTick(() => {
                        expect(consoleWarnSpy.notCalled).to.be.true;
                        expect(consoleErrorSpy.notCalled).to.be.true;
                        expect(dispatch.calledThrice).to.be.true;
                        expect(dispatch.firstCall.args.length).to.equal(3);
                        expect(dispatch.firstCall.args[0]).to.equal("Maps/addLayerOnTop");
                        expect(dispatch.firstCall.args[1] instanceof VectorLayer).to.be.true;
                        expect(dispatch.firstCall.args[1].getSource().getFeatures().length).to.equal(1);
                        expect(dispatch.firstCall.args[2]).to.eql({root: true});
                        expect(dispatch.secondCall.args.length).to.equal(3);
                        expect(dispatch.secondCall.args[0]).to.equal("Maps/addLayerOnTop");
                        expect(dispatch.secondCall.args[1] instanceof VectorLayer).to.be.true;
                        expect(dispatch.secondCall.args[1].getSource().getFeatures().length).to.equal(1);
                        expect(dispatch.secondCall.args[2]).to.eql({root: true});
                        expect(dispatch.thirdCall.args.length).to.equal(3);
                        expect(dispatch.thirdCall.args[0]).to.equal("Maps/zoomToExtent");
                        expect(dispatch.thirdCall.args[1] instanceof Object).to.be.true;
                        expect(Object.prototype.hasOwnProperty.call(dispatch.thirdCall.args[1], "extent")).to.be.true;
                        expect(dispatch.thirdCall.args[1].extent.length).to.equal(4);
                        expect(dispatch.thirdCall.args[1].extent.every(val => typeof val === "number")).to.be.true;
                        expect(dispatch.thirdCall.args[2]).to.eql({root: true});
                    });
                });
            });
        });
    });
});
