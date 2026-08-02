import Cluster from "ol/source/Cluster.js";
import {expect} from "chai";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import webgl from "@core/layers/js/webglRenderer.js";
import store from "@appstore/index.js";
import {oaf} from "@masterportal/masterportalapi/src/index.js";
import Layer2dVectorOaf from "@core/layers/js/layer2dVectorOaf.js";
import Layer2dVector from "@core/layers/js/layer2dVector.js";

describe("src/core/js/layers/layer2dVectorOaf.js", () => {
    let attributes,
        warn,
        origGetters;

    beforeAll(() => {
        origGetters = store.getters;
    });

    beforeAll(() => {
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);

        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        // Set prototype of Layer2dVectorOaf to Layer2dVector to avoid errors in tests
        Object.setPrototypeOf(Layer2dVectorOaf.prototype, Layer2dVector.prototype);
        attributes = {
            id: "id",
            name: "oafTestLayer",
            typ: "OAF",
            url: "https://oaf.de"
        };
    });


    afterEach(() => {
        store.getters = origGetters;
    });

    describe("createLayer", () => {
        beforeEach(() => {
            const styleObj = {
                styleId: "styleId",
                rules: []
            };

            sinon.stub(styleList, "returnStyleObject").returns(styleObj);
        });
        it("new Layer2dVectorWfs should create an layer with no warning", () => {
            const oafLayer = new Layer2dVectorOaf({});

            expect(oafLayer).not.to.be.undefined;
            expect(warn.notCalled).to.be.true;
        });

        it("createLayer shall create an ol.VectorLayer with source and style and OAF-format", function () {
            const oafLayer = new Layer2dVectorOaf(attributes),
                layer = oafLayer.getLayer();

            expect(layer).to.be.an.instanceof(VectorLayer);
            expect(layer.getSource()).to.be.an.instanceof(VectorSource);
            expect(typeof layer.getStyleFunction()).to.be.equals("function");
            expect(layer.get("id")).to.be.equals(attributes.id);
            expect(layer.get("name")).to.be.equals(attributes.name);
            expect(layer.get("gfiTheme")).to.be.equals(attributes.gfiTheme);
        });

        it("createLayer shall create an ol.VectorLayer with cluster-source", function () {
            attributes.clusterDistance = 60;
            const oafLayer = new Layer2dVectorOaf(attributes),
                layer = oafLayer.getLayer();

            expect(layer).to.be.an.instanceof(VectorLayer);
            expect(layer.getSource()).to.be.an.instanceof(Cluster);
            expect(layer.getSource().getDistance()).to.be.equals(attributes.clusterDistance);
            expect(typeof layer.getStyleFunction()).to.be.equals("function");
        });
    });

    describe("getRawLayerAttributes", () => {
        let localAttributes;

        beforeEach(() => {
            localAttributes = {
                bbox: [1, 2, 3, 4],
                bboxCrs: "EPSG:25832",
                clusterDistance: 10,
                collection: "collection",
                datetime: "time",
                id: "1234",
                limit: 10,
                offset: 10,
                params: "params",
                url: "exmpale.url"
            };
        });

        it("should return the raw layer attributes, should not use bbox from datasets", () => {
            localAttributes.datasets = [
                {
                    bbox: "8 53,10 53"
                }
            ];
            const oafLayer = new Layer2dVectorOaf(localAttributes);

            expect(oafLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                bbox: [1, 2, 3, 4],
                bboxCrs: "EPSG:25832",
                clusterDistance: 10,
                collection: "collection",
                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                datetime: "time",
                id: "1234",
                limit: 10,
                offset: 10,
                params: "params",
                url: "exmpale.url"
            });
        });
        it("should return maps extent as bbox and crs as bboxCrs", () => {
            localAttributes.bbox = undefined;
            localAttributes.bboxCrs = undefined;
            store.getters = {
                "Maps/extent": [9, 5, 1, 7]
            };

            const oafLayer = new Layer2dVectorOaf(localAttributes);

            expect(oafLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                bbox: [9, 5, 1, 7],
                bboxCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                clusterDistance: 10,
                collection: "collection",
                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                datetime: "time",
                id: "1234",
                limit: 10,
                offset: 10,
                params: "params",
                url: "exmpale.url"
            });
        });
        it("should return bbox from datasets", () => {
            localAttributes.bbox = undefined;
            localAttributes.datasets = [
                {
                    bbox: "8 53,10 53"
                }
            ];

            const oafLayer = new Layer2dVectorOaf(localAttributes);

            expect(oafLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                bbox: "8 53,10 53",
                bboxCrs: "EPSG:25832",
                clusterDistance: 10,
                collection: "collection",
                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                datetime: "time",
                id: "1234",
                limit: 10,
                offset: 10,
                params: "params",
                url: "exmpale.url"
            });
        });
    });

    describe("getOptions", () => {
        let options;

        beforeEach(() => {
            options = [
                "clusterGeometryFunction",
                "doNotLoadInitially",
                "featuresFilter",
                "loadingParams",
                "loadingStrategy",
                "onLoadingError",
                "style"
            ];
        });

        it("should return the options that includes the correct keys", () => {
            const oafLayer = new Layer2dVectorOaf(attributes);

            expect(Object.keys(oafLayer.getOptions(attributes))).to.deep.equals(options);
        });
    });

    describe("getStyleFunction", () => {
        it("reateStyle and getStyleFunction shall return a function", function () {
            sinon.stub(styleList, "returnStyleObject").returns(true);
            attributes.styleId = "styleId";
            let styleFunction = null;
            const oafLayer = new Layer2dVectorOaf(attributes);

            oafLayer.createStyle(attributes);
            styleFunction = oafLayer.getStyleFunction();

            expect(styleFunction).not.to.be.null;
            expect(typeof styleFunction).to.be.equals("function");
        });
    });

    describe("Use WebGL renderer", () => {
        it("Should create the layer with WebGL methods, if renderer: \"webgl\" is set", function () {
            const vectorLayer = new Layer2dVectorOaf({...attributes, renderer: "webgl"}),
                layer = vectorLayer.getLayer();

            expect(vectorLayer.isDisposed).to.equal(webgl.isDisposed);
            expect(vectorLayer.setIsSelected).to.equal(webgl.setIsSelected);
            expect(vectorLayer.hideAllFeatures).to.equal(webgl.hideAllFeatures);
            expect(vectorLayer.showAllFeatures).to.equal(webgl.showAllFeatures);
            expect(vectorLayer.showFeaturesByIds).to.equal(webgl.showFeaturesByIds);
            expect(vectorLayer.setStyle).to.equal(webgl.setStyle);
            expect(vectorLayer.source).to.equal(layer.getSource());
            expect(layer.get("isPointLayer")).to.not.be.undefined;
        });
    });
    describe("updateLayerValues", () => {
        it("OAF: call loadFeaturesManually in updateLayerValues", () => {
            const loadFeaturesManuallySpy = sinon.stub(Layer2dVectorOaf.prototype, "loadFeaturesManually"),
                oafLayer = new Layer2dVectorOaf(attributes);

            store.getters = {
                "Maps/mode": "3D"
            };
            oafLayer.updateLayerValues({
                foo: "bla"
            });

            expect(loadFeaturesManuallySpy.calledOnce).to.be.true;
            expect(loadFeaturesManuallySpy.args[0][0]).to.be.deep.equal({
                foo: "bla"
            });
        });
    });

    describe("loadFeaturesManually", () => {
        it("shall call loadFeaturesManually in API", () => {
            const loadFeaturesManuallySpy = sinon.stub(oaf, "loadFeaturesManually"),
                oafLayer = new Layer2dVectorOaf(attributes);

            oafLayer.loadFeaturesManually({
                limit: 100,
                bbox: [1, 2, 3, 4]
            });

            expect(loadFeaturesManuallySpy.calledOnce).to.be.true;
            expect(loadFeaturesManuallySpy.args[0][0]).to.be.deep.equals({
                bbox: [1, 2, 3, 4],
                bboxCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                clusterDistance: undefined,
                collection: undefined,
                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                datetime: undefined,
                id: undefined,
                limit: 100,
                offset: undefined,
                params: undefined,
                url: undefined
            }
            );
        });
        it("shall call loadFeaturesManually in API and shall set bbox to undefined in 3D", () => {
            const loadFeaturesManuallySpy = sinon.stub(oaf, "loadFeaturesManually"),
                oafLayer = new Layer2dVectorOaf(attributes);

            store.getters = {
                "Maps/mode": "3D",
                "Maps/extent": [9, 5, 1, 7]
            };
            oafLayer.loadFeaturesManually({
                limit: 100,
                bbox: [1, 2, 3, 4]
            });

            expect(loadFeaturesManuallySpy.calledOnce).to.be.true;
            expect(loadFeaturesManuallySpy.args[0][0]).to.be.deep.equals({
                bbox: undefined,
                bboxCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                clusterDistance: undefined,
                collection: undefined,
                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                datetime: undefined,
                id: undefined,
                limit: 100,
                offset: undefined,
                params: undefined,
                url: undefined
            }
            );
        });
    });


    describe("createLegend", () => {
        beforeEach(() => {
            const styleObj = {
                styleId: "styleId",
                rules: [
                    {
                        name: "rule"
                    }
                ]
            };

            attributes = {
                id: "id",
                version: "1.3.0"
            };
            sinon.stub(styleList, "returnStyleObject").returns(styleObj);
        });

        it("createLegend with legendURL", async () => {
            attributes.legend = "legendUrl1";
            const layerWrapper = new Layer2dVectorOaf(attributes);

            expect(await layerWrapper.createLegend()).to.be.deep.equals([attributes.legend]);
        });

        it("createLegend with legendURL as array", async () => {
            attributes.legend = ["legendUrl1"];
            const layerWrapper = new Layer2dVectorOaf(attributes);

            expect(await layerWrapper.createLegend()).to.be.deep.equals(attributes.legend);
        });

        it("createLegend with styleObject and legend true", async () => {
            attributes.legend = true;
            const legendInformation = [
                    {
                        label: "legend Information",
                        graphic: "legend.png"
                    }
                ],
                getSimpleGeometryStyleStub = sinon.stub(createStyle, "getSimpleGeometryStyle").returns({legendInfos: legendInformation});
            const layerWrapper = new Layer2dVectorOaf(attributes);

            expect(await layerWrapper.createLegend()).to.deep.equals(legendInformation);
            expect(getSimpleGeometryStyleStub.calledOnce).to.be.true;
        });

        it("createLegend shall use 'styleGeometryType' attribute as geometry type", async () => {
            attributes.legend = true;
            attributes.styleGeometryType = "Polygon";
            const getSimpleGeometryStyleStub = sinon.stub(createStyle, "getSimpleGeometryStyle").returns({legendInfos: []});
            const layerWrapper = new Layer2dVectorOaf(attributes);

            await layerWrapper.createLegend();

            expect(getSimpleGeometryStyleStub.calledOnce).to.be.true;
            expect(getSimpleGeometryStyleStub.args[0][0]).to.deep.equals("Polygon");
        });

        it("createLegend shall strip 'Multi' prefix from 'styleGeometryType'", async () => {
            attributes.legend = true;
            attributes.styleGeometryType = "MultiPolygon";
            const getSimpleGeometryStyleStub = sinon.stub(createStyle, "getSimpleGeometryStyle").returns({legendInfos: []});
            const layerWrapper = new Layer2dVectorOaf(attributes);

            await layerWrapper.createLegend();

            expect(getSimpleGeometryStyleStub.calledOnce).to.be.true;
            expect(getSimpleGeometryStyleStub.args[0][0]).to.deep.equals("Polygon");
        });

        it("createLegend shall use 'geometryType' attribute when 'styleGeometryType' is not set", async () => {
            attributes.legend = true;
            attributes.geometryType = "LineString";
            const getSimpleGeometryStyleStub = sinon.stub(createStyle, "getSimpleGeometryStyle").returns({legendInfos: []});
            const layerWrapper = new Layer2dVectorOaf(attributes);

            await layerWrapper.createLegend();

            expect(getSimpleGeometryStyleStub.calledOnce).to.be.true;
            expect(getSimpleGeometryStyleStub.args[0][0]).to.deep.equals("LineString");
        });

        it("createLegend shall give 'styleGeometryType' priority over 'geometryType'", async () => {
            attributes.legend = true;
            attributes.styleGeometryType = "Polygon";
            attributes.geometryType = "LineString";
            const getSimpleGeometryStyleStub = sinon.stub(createStyle, "getSimpleGeometryStyle").returns({legendInfos: []});
            const layerWrapper = new Layer2dVectorOaf(attributes);

            await layerWrapper.createLegend();

            expect(getSimpleGeometryStyleStub.calledOnce).to.be.true;
            expect(getSimpleGeometryStyleStub.args[0][0]).to.deep.equals("Polygon");
        });

        it("createLegend shall use the first feature's geometry type when no type is configured", async () => {
            attributes.legend = true;
            const getSimpleGeometryStyleStub = sinon.stub(createStyle, "getSimpleGeometryStyle").returns({legendInfos: []});
            const layerWrapper = new Layer2dVectorOaf(attributes),
                mockFeature = {getGeometry: () => ({getType: () => "MultiLineString"})};

            sinon.stub(layerWrapper.getLayer().getSource(), "getFeatures").returns([mockFeature]);
            await layerWrapper.createLegend();

            expect(getSimpleGeometryStyleStub.calledOnce).to.be.true;
            expect(getSimpleGeometryStyleStub.args[0][0]).to.deep.equals("LineString");
        });

        it("createLegend shall fall back to 'Point' when no geometry type is configured and no features are loaded", async () => {
            attributes.legend = true;
            const getSimpleGeometryStyleStub = sinon.stub(createStyle, "getSimpleGeometryStyle").returns({legendInfos: []});
            const layerWrapper = new Layer2dVectorOaf(attributes);

            await layerWrapper.createLegend();

            expect(getSimpleGeometryStyleStub.calledOnce).to.be.true;
            expect(getSimpleGeometryStyleStub.args[0][0]).to.deep.equals("Point");
        });
    });
});
