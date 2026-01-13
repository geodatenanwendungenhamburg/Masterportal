import {expect} from "chai";
import sinon from "sinon";
import store from "@appstore/index.js";
import Layer2dRasterWmsTime from "@core/layers/js/layer2dRasterWmsTime.js";
import axios from "axios";

describe("src/core/js/layers/layer2dRasterWmsTime.js", () => {
    let attributes,
        commitStub,
        origGetters,
        origDispatch,
        origCommit,
        error,
        errorStub,
        warnSpy;


    before(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            addInteraction: sinon.stub(),
            removeInteraction: sinon.stub(),
            addLayer: sinon.spy(),
            getLayers: () => {
                return {
                    getArray: () => [{
                        getVisible: () => true,
                        get: () => "layerId"
                    }],
                    getLength: sinon.spy(),
                    forEach: sinon.spy()
                };
            },
            getView: () => {
                return {
                    getResolutions: () => [2000, 1000]
                };
            }
        };

        mapCollection.addMap(map, "2D");
        origGetters = store.getters;
        origDispatch = store.dispatch;
        origCommit = store.commit;
    });

    beforeEach(() => {
        error = sinon.spy();
        warnSpy = sinon.spy();
        errorStub = sinon.stub(console, "error").callsFake(error);
        sinon.stub(console, "warn").callsFake(warnSpy);
        commitStub = sinon.stub(store, "commit");
        sinon.stub(Layer2dRasterWmsTime.prototype, "requestCapabilities").returns(new Promise(resolve => resolve({status: 200, statusText: "OK", data: {}})));
        attributes = {
            name: "wmsTimeTestLayer",
            id: "id",
            typ: "WMS",
            tilesize: 512,
            singleTile: false,
            minScale: "0",
            maxScale: "2500000",
            layers: "layer1,layer2",
            transparent: 100,
            visibility: false,
            time: {
                default: "1997"
            }
        };
        store.getters = {
            isModuleAvailable: sinon.stub().returns(false),
            "Modules/WmsTime/layerSwiper": () => {
                true;
            },
            "Modules/WmsTime/timeSlider": () => {
                true;
            }
        };
    });

    afterEach(() => {
        sinon.restore();
        store.getters = origGetters;
        store.dispatch = origDispatch;
        store.commit = origCommit;
    });

    it("createLayer shall create an ol/Layer with source", function () {
        const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
            layer = wmsTimeLayer.getLayer();

        expect(layer).not.to.be.undefined;
        expect(layer.getSource()).not.to.be.undefined;
    });

    it("getLayerParams: should return the layer params", () => {
        Config.overwriteWmsLoadfunction = true;

        const localAttributes = {
                format: "image/png",
                gfiAsNewWindow: undefined,
                gfiAttributes: "showAll",
                gfiTheme: "default",
                infoFormat: "text/xml",
                layers: "layer_1",
                name: "Layer 1",
                transparency: 0,
                typ: "WMS",
                zIndex: 2,
                featureCount: 1,
                gfiThemeSettings: undefined,
                useFetchForWMS: true
            },
            wmsLayer = new Layer2dRasterWmsTime(localAttributes),
            layerParams = wmsLayer.getLayerParams(localAttributes);

        expect(layerParams.format).to.be.equals(localAttributes.format);
        expect(layerParams.gfiAsNewWindow).to.be.equals(localAttributes.gfiAsNewWindow);
        expect(layerParams.gfiAttributes).to.be.equals(localAttributes.gfiAttributes);
        expect(layerParams.gfiTheme).to.be.equals(localAttributes.gfiTheme);
        expect(layerParams.infoFormat).to.be.equals(localAttributes.infoFormat);
        expect(layerParams.layers).to.be.equals(localAttributes.layers);
        expect(layerParams.name).to.be.equals(localAttributes.name);
        expect(layerParams.opacity).to.be.equals(1);
        expect(layerParams.typ).to.be.equals(localAttributes.typ);
        expect(layerParams.zIndex).to.be.equals(localAttributes.zIndex);
        expect(layerParams.featureCount).to.be.equals(localAttributes.featureCount);
        expect(layerParams.gfiThemeSettings).to.be.equals(localAttributes.gfiThemeSettings);
        expect(layerParams.useFetchForWMS).to.be.equals(localAttributes.useFetchForWMS);
        expect(layerParams.visible).to.be.false;
    });

    it("getRawLayerAttributes: should return the raw layer attributes", () => {
        const localAttributes = {
                crs: "25832",
                format: "image/png",
                gutter: 0,
                id: "123456789",
                layers: "layer_names",
                singleTile: false,
                tilesize: 512,
                transparent: 100,
                url: "http://test.url",
                version: "1.3.0"
            },
            wmsLayer = new Layer2dRasterWmsTime(localAttributes),
            rawAttributes = wmsLayer.getRawLayerAttributes(localAttributes);

        expect(rawAttributes.id).to.be.equals(localAttributes.id);
        expect(rawAttributes.url).to.be.equals(localAttributes.url);
        expect(rawAttributes.crs).to.be.equals(localAttributes.crs);
        expect(rawAttributes.format).to.be.equals(localAttributes.format);
        expect(rawAttributes.gutter).to.be.equals(localAttributes.gutter);
        expect(rawAttributes.layers).to.be.equals(localAttributes.layers);
        expect(rawAttributes.singleTile).to.be.equals(localAttributes.singleTile);
        expect(rawAttributes.tilesize).to.be.equals(localAttributes.tilesize);
        expect(rawAttributes.transparent).to.be.equals("100");
        expect(rawAttributes.version).to.be.equals(localAttributes.version);
        expect(rawAttributes.TIME).to.be.a("Promise");
    });

    it("extractExtentValues - extract an object that contains the time range", function () {
        const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
            extent = {
                value: "2006/2018/P2Y"
            };

        expect(wmsTimeLayer.extractExtentValues(extent)).deep.equals({
            timeRange: ["2006", "2008", "2010", "2012", "2014", "2016", "2018"],
            step: {
                year: "2"
            }
        });
    });

    describe("createCapabilitiesUrl", () => {
        it("test params", () => {
            const wmsTimeUrl = "https://geodienste.hamburg.de/HH_WMS-T_Satellitenbilder_Sentinel-2",
                version = "1.1.1",
                layers = "layer1",
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                createdUrl = wmsTimeLayer.createCapabilitiesUrl(wmsTimeUrl, version, layers);

            expect(createdUrl.origin).to.eql("https://geodienste.hamburg.de");
            expect(createdUrl.pathname).to.eql("/HH_WMS-T_Satellitenbilder_Sentinel-2");
            expect(createdUrl.searchParams.get("service")).to.eql("WMS");
            expect(createdUrl.searchParams.get("version")).to.eql(version);
            expect(createdUrl.searchParams.get("layers")).to.eql(layers);
            expect(createdUrl.searchParams.get("request")).to.eql("GetCapabilities");
        });

        it("createUrl should respect questionmark in url", () => {
            const wmsTimeUrl = "https://mapservice.regensburg.de/cgi-bin/mapserv?map=wfs.map",
                version = "1.1.1",
                layers = "layer1,layer2",
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                createdUrl = wmsTimeLayer.createCapabilitiesUrl(wmsTimeUrl, version, layers);

            expect(createdUrl.origin).to.eql("https://mapservice.regensburg.de");
            expect(createdUrl.pathname).to.eql("/cgi-bin/mapserv");
            expect(createdUrl.searchParams.get("map")).to.eql("wfs.map");
            expect(createdUrl.searchParams.get("service")).to.eql("WMS");
            expect(createdUrl.searchParams.get("version")).to.eql(version);
            expect(createdUrl.searchParams.get("layers")).to.eql(layers);
            expect(createdUrl.searchParams.get("request")).to.eql("GetCapabilities");
        });
    });

    describe("createDimensionRangeList", () => {
        it("should return an array with time values", () => {
            const dimensionRange = {
                    min: "2025-01-01T00:00:00.000Z",
                    max: "2025-12-01T00:00:00.000Z",
                    resolution: "P2M"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime({...attributes, dimensionRange}),
                dimensionRangeList = wmsTimeLayer.createDimensionRangeList(dimensionRange);

            expect(dimensionRangeList).to.be.an("array");
            expect(dimensionRangeList).to.deep.equals([
                "2025-01-01T00:00:00.000Z",
                "2025-03-01T00:00:00.000Z",
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z",
                "2025-11-01T00:00:00.000Z"
            ]);
        });

        it("should return an empty array, if the maxmaximum value has not been specified", () => {
            const dimensionRange = {
                    min: "2025-01-01T00:00:00.000Z",
                    resolution: "P2M"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime({...attributes, dimensionRange}),
                dimensionRangeList = wmsTimeLayer.createDimensionRangeList(dimensionRange);

            expect(dimensionRangeList).to.be.an("array").that.is.empty;
            expect(warnSpy.calledOnce).to.be.true;
        });

        it("should return an empty array, if the min value has not been specified", () => {
            const dimensionRange = {
                    max: "2025-12-01T00:00:00.000Z",
                    resolution: "P2M"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime({...attributes, dimensionRange}),
                dimensionRangeList = wmsTimeLayer.createDimensionRangeList(dimensionRange);

            expect(dimensionRangeList).to.be.an("array").that.is.empty;
            expect(warnSpy.calledOnce).to.be.true;
        });
        it("should return an empty array, if the resolution value has not been specified", () => {
            const dimensionRange = {
                    min: "2025-01-01T00:00:00.000Z",
                    max: "2025-12-01T00:00:00.000Z"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime({...attributes, dimensionRange}),
                dimensionRangeList = wmsTimeLayer.createDimensionRangeList(dimensionRange);

            expect(dimensionRangeList).to.be.an("array").that.is.empty;
            expect(warnSpy.calledOnce).to.be.true;
        });
    });

    describe("createTimeRange", () => {
        it("create an array with the time range", function () {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                min = "2006",
                max = "2018",
                step = {
                    years: "2"
                };

            expect(wmsTimeLayer.createTimeRange(min, max, step)).to.be.an("array");
            expect(wmsTimeLayer.createTimeRange(min, max, step)).includes("2006", "2008", "2010", "2012", "2014", "2016", "2018");
        });

        it("create an array with the time range", function () {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                min = "2006",
                max = "2018",
                step = {
                    years: "2"
                };

            expect(wmsTimeLayer.createTimeRange(min, max, step)).to.be.an("array");
            expect(wmsTimeLayer.createTimeRange(min, max, step)).includes("2006", "2008", "2010", "2012", "2014", "2016", "2018");
        });
    });

    describe("determineDefault", () => {
        it("configuredDefault is contained in timeRange", () => {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                timeRange = [
                    "2021-12-25",
                    "2022-03-25",
                    "2022-06-23",
                    "2022-08-20",
                    "2022-10-26",
                    "2023-02-08",
                    "2023-06-13",
                    "2023-09-16"
                ],
                extentDefault = "2023-09-16",
                configuredDefault = "2022-06-23",
                result = wmsTimeLayer.determineDefault(timeRange, extentDefault, configuredDefault);

            expect(result).to.be.equals(configuredDefault);
        });

        it("configuredDefault is 'current' return greatest date in timeRange", () => {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                timeRange = [
                    "2021-12-25",
                    "2022-03-25",
                    "2022-06-23",
                    "2022-08-20",
                    "2022-10-26",
                    "2023-02-08",
                    "2023-06-13",
                    "2023-09-16"
                ],
                extentDefault = "2023-09-16",
                configuredDefault = "current",
                result = wmsTimeLayer.determineDefault(timeRange, extentDefault, configuredDefault);

            expect(result).to.be.equals("2023-09-16");
        });

        it("configuredDefault is -5 return the element at this position", () => {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                timeRange = [
                    "2021-12-25",
                    "2022-03-25",
                    "2022-06-23",
                    "2022-08-20",
                    "2022-10-26",
                    "2023-02-08",
                    "2023-06-13",
                    "2023-09-16"
                ],
                extentDefault = "2023-09-16",
                configuredDefault = -5,
                result = wmsTimeLayer.determineDefault(timeRange, extentDefault, configuredDefault);

            expect(result).to.be.equals("2022-08-20");
        });

        it("configuredDefault is 0 return the first element", () => {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                timeRange = [
                    "2021-12-25",
                    "2022-03-25",
                    "2022-06-23",
                    "2022-08-20",
                    "2022-10-26",
                    "2023-02-08",
                    "2023-06-13",
                    "2023-09-16"
                ],
                extentDefault = "2023-09-16",
                configuredDefault = 0,
                result = wmsTimeLayer.determineDefault(timeRange, extentDefault, configuredDefault);

            expect(result).to.be.equals("2021-12-25");
        });

        it("should return timRange[0] and print a console.warn, if configuredDefault isn't include in timeRange", () => {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                timeRange = [
                    "2021-12-25",
                    "2022-03-25",
                    "2022-06-23",
                    "2022-08-20",
                    "2022-10-26",
                    "2023-02-08",
                    "2023-06-13",
                    "2023-09-16"
                ],
                extentDefault = undefined,
                configuredDefault = "2020-12-25",
                result = wmsTimeLayer.determineDefault(timeRange, extentDefault, configuredDefault);

            expect(result).to.be.equals("2021-12-25");
            expect(warnSpy.calledOnce).to.be.true;
        });
    });

    it("extractExtentValues if they are in dimension", function () {
        const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
            dimension = {
                name: "time",
                units: "ISO8601",
                value: "2006/2018/P2Y"
            };

        expect(wmsTimeLayer.extractExtentValues(dimension)).deep.equals({
            timeRange: ["2006", "2008", "2010", "2012", "2014", "2016", "2018"],
            step: {
                year: "2"
            }
        });
    });

    describe("filterDimensionRangeList", () => {
        it("should return the filtered dimension range list", () => {
            const dimensionRangeList = [
                    "2025-01-01T00:00:00.000Z",
                    "2025-03-01T00:00:00.000Z",
                    "2025-05-01T00:00:00.000Z",
                    "2025-07-01T00:00:00.000Z",
                    "2025-09-01T00:00:00.000Z",
                    "2025-11-01T00:00:00.000Z"
                ],
                timeRange = [
                    "2025-01-01T00:00:00.000Z",
                    "2025-02-01T00:00:00.000Z",
                    "2025-03-01T00:00:00.000Z",
                    "2025-04-01T00:00:00.000Z",
                    "2025-05-01T00:00:00.000Z",
                    "2025-06-01T00:00:00.000Z",
                    "2025-07-01T00:00:00.000Z",
                    "2025-08-01T00:00:00.000Z",
                    "2025-09-01T00:00:00.000Z",
                    "2025-10-01T00:00:00.000Z",
                    "2025-11-01T00:00:00.000Z",
                    "2025-12-01T00:00:00.000Z"
                ],
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = wmsTimeLayer.filterDimensionRangeList(dimensionRangeList, timeRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals([
                "2025-01-01T00:00:00.000Z",
                "2025-03-01T00:00:00.000Z",
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z",
                "2025-11-01T00:00:00.000Z"
            ]);
            expect(warnSpy.called).to.be.false;
        });

        it("should return the filtered dimension range list, excluding values that are not in the time range.", () => {
            const dimensionRangeList = [
                    "2024-01-01T00:00:00.000Z",
                    "2024-03-01T00:00:00.000Z",
                    "2025-05-01T00:00:00.000Z",
                    "2025-07-01T00:00:00.000Z",
                    "2025-09-01T00:00:00.000Z",
                    "2026-11-01T00:00:00.000Z"
                ],
                timeRange = [
                    "2025-01-01T00:00:00.000Z",
                    "2025-02-01T00:00:00.000Z",
                    "2025-03-01T00:00:00.000Z",
                    "2025-04-01T00:00:00.000Z",
                    "2025-05-01T00:00:00.000Z",
                    "2025-06-01T00:00:00.000Z",
                    "2025-07-01T00:00:00.000Z",
                    "2025-08-01T00:00:00.000Z",
                    "2025-09-01T00:00:00.000Z",
                    "2025-10-01T00:00:00.000Z",
                    "2025-11-01T00:00:00.000Z",
                    "2025-12-01T00:00:00.000Z"
                ],
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = wmsTimeLayer.filterDimensionRangeList(dimensionRangeList, timeRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals([
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z"
            ]);
            expect(warnSpy.calledThrice).to.be.true;
        });
    });

    describe("filterDimensions", () => {
        let timeRange = [];

        beforeEach(() => {
            timeRange = [
                "2025-01-01T00:00:00.000Z",
                "2025-02-01T00:00:00.000Z",
                "2025-03-01T00:00:00.000Z",
                "2025-04-01T00:00:00.000Z",
                "2025-05-01T00:00:00.000Z",
                "2025-06-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-08-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z",
                "2025-10-01T00:00:00.000Z",
                "2025-11-01T00:00:00.000Z",
                "2025-12-01T00:00:00.000Z"
            ];
        });

        it("should returns the timeRange, if the input dimensionRange is undefined.", async () => {
            const dimensionRange = undefined,
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = await wmsTimeLayer.filterDimensions(timeRange, dimensionRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals(timeRange);
            expect(error.calledOnce).to.be.false;
        });

        it("should return the filtered dimension range list, if the input dimensionRange is a URL as string.", async () => {
            sinon.stub(Layer2dRasterWmsTime.prototype, "loadDimensionRangeJson").returns(new Promise(resolve => resolve([
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z"
            ])));

            const dimensionRange = "./resources/example.json",
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes);
            let filteredDimensionRangeList = [];

            filteredDimensionRangeList = await wmsTimeLayer.filterDimensions(timeRange, dimensionRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals([
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z"
            ]);
        });

        it("should return the filtered dimension range list, if the input dimensionRange is an object. ", async () => {
            const dimensionRange = {
                    "min": "2025-01-01T00:00:00.000Z",
                    "max": "2025-12-01T00:00:00.000Z",
                    "resolution": "P3M"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = await wmsTimeLayer.filterDimensions(timeRange, dimensionRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals([
                "2025-01-01T00:00:00.000Z",
                "2025-04-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-10-01T00:00:00.000Z"
            ]);
            expect(error.called).to.be.false;
        });

        it("should return the filtered dimension range list, if the input dimensionRange is an array. ", async () => {
            const dimensionRange = [
                    "2025-05-01T00:00:00.000Z",
                    "2025-07-01T00:00:00.000Z",
                    "2025-09-01T00:00:00.000Z"
                ],
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = await wmsTimeLayer.filterDimensions(timeRange, dimensionRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals([
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z"
            ]);
            expect(error.called).to.be.false;
        });

        it("should returns the timeRange and throw an error, if the input dimensionRange is an empty array. ", async () => {
            const dimensionRange = [],
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = await wmsTimeLayer.filterDimensions(timeRange, dimensionRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals(timeRange);
            expect(error.calledOnce).to.be.true;
        });
    });

    describe("filterWithDimensionRegex", () => {
        let timeRange = [];

        beforeEach(() => {
            timeRange = [
                "2025-01-01T00:00:00.000Z",
                "2025-02-01T00:00:00.000Z",
                "2025-03-01T00:00:00.000Z",
                "2025-04-01T00:00:00.000Z",
                "2025-05-01T00:00:00.000Z",
                "2025-06-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-08-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z",
                "2025-10-01T00:00:00.000Z",
                "2025-11-01T00:00:00.000Z",
                "2025-12-01T00:00:00.000Z"
            ];
        });

        it("should filter timeRange by regex", () => {
            const dimensionRegex = "\\d{1,4}\\-\\d*[02468]\\-\\d{1,2}T\\d{1,2}:\\d{1,2}:\\d{1,2}.\\d{1,3}Z",
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = wmsTimeLayer.filterWithDimensionRegex(dimensionRegex, timeRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals([
                "2025-02-01T00:00:00.000Z",
                "2025-04-01T00:00:00.000Z",
                "2025-06-01T00:00:00.000Z",
                "2025-08-01T00:00:00.000Z",
                "2025-10-01T00:00:00.000Z",
                "2025-12-01T00:00:00.000Z"
            ]);
            expect(warnSpy.called).to.be.false;
        });

        it("should print a warning if no value was found with the regex and return the time Range.", () => {
            const dimensionRegex = "\\d{8}\\-\\d*[02468]\\-\\d{1,2}T\\d{1,2}:\\d{1,2}:\\d{1,2}.\\d{1,3}Z",
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                filteredDimensionRangeList = wmsTimeLayer.filterWithDimensionRegex(dimensionRegex, timeRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals(timeRange);
            expect(warnSpy.calledOnce).to.be.true;
        });
    });

    describe("loadDimensionRangeJson", () => {
        it("should start an axios get request", async () => {
            const dimensionRange = "./resources/example.json",
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                axiosGetStub = sinon.stub(axios, "get").returns(Promise.resolve({
                    data: {
                        dimensionrange: [
                            "2025-05-01T00:00:00.000Z",
                            "2025-07-01T00:00:00.000Z",
                            "2025-09-01T00:00:00.000Z"
                        ]
                    }
                }));

            await wmsTimeLayer.loadDimensionRangeJson(dimensionRange);

            expect(axiosGetStub.calledOnce).to.be.true;
            expect(axiosGetStub.firstCall.args[0]).to.equals(dimensionRange);
        });
    });

    describe("prepareTimeSliderObject", () => {
        it("should return the configured default value for input time and trigger addTimeSliderObject action without static dimensions", () => {
            const time = {
                    default: "2003",
                    dimensionName: "time",
                    extentName: "time"
                },
                filteredTimeRange = ["2001", "2002", "2003", "2004", "2005"],
                timeSource = {
                    default: "2005",
                    name: "time",
                    nearestValue: "0",
                    units: "ISO8601",
                    value: "2001/2025/P1Y"
                },
                staticDimensions = [],
                step = {
                    year: "1"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                defaultValue = wmsTimeLayer.prepareTimeSliderObject(time, filteredTimeRange, timeSource, staticDimensions, step, attributes);

            expect(defaultValue).to.equals("2003");
            expect(commitStub.calledOnce).to.be.true;
            expect(commitStub.firstCall.args[0]).to.equals("Modules/WmsTime/addTimeSliderObject");
            expect(commitStub.firstCall.args[1]).to.deep.equals(
                {
                    keyboardMovement: undefined,
                    defaultValue: "2003",
                    defaultValueEnd: null,
                    dualRangeSlider: false,
                    step: {
                        year: "1"
                    },
                    timeRange: ["2001", "2002", "2003", "2004", "2005"],
                    staticDimensions: {},
                    layerId: "id"
                }
            );
        });

        it("should return the default value from service for input time and trigger addTimeSliderObject action without static dimensions", () => {
            const time = {
                    dimensionName: "time",
                    extentName: "time"
                },
                filteredTimeRange = ["2001", "2002", "2003", "2004", "2005"],
                timeSource = {
                    default: "2005",
                    name: "time",
                    nearestValue: "0",
                    units: "ISO8601",
                    value: "2001/2025/P1Y"
                },
                staticDimensions = [],
                step = {
                    year: "1"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                defaultValue = wmsTimeLayer.prepareTimeSliderObject(time, filteredTimeRange, timeSource, staticDimensions, step, attributes);

            expect(defaultValue).to.equals("2005");
            expect(commitStub.calledOnce).to.be.true;
            expect(commitStub.firstCall.args[0]).to.equals("Modules/WmsTime/addTimeSliderObject");
            expect(commitStub.firstCall.args[1]).to.deep.equals(
                {
                    keyboardMovement: undefined,
                    defaultValue: "2005",
                    defaultValueEnd: null,
                    dualRangeSlider: false,
                    step: {
                        year: "1"
                    },
                    timeRange: ["2001", "2002", "2003", "2004", "2005"],
                    staticDimensions: {},
                    layerId: "id"
                }
            );
        });

        it("should return the default value from service for input time and trigger addTimeSliderObject action with static dimensions", () => {
            const time = {
                    dimensionName: "time",
                    extentName: "time"
                },
                filteredTimeRange = ["2001", "2002", "2003", "2004", "2005"],
                timeSource = {
                    default: "2005",
                    name: "time",
                    nearestValue: "0",
                    units: "ISO8601",
                    value: "2001/2025/P1Y"
                },
                staticDimensions = [
                    {
                        default: "2.0",
                        name: "elevation",
                        unitSymbol: "m",
                        units: "EPSG:5030",
                        value: "2.0,50.0,100.0,150.0,200.0,250.0,300.0,350.0,400.0,450.0,500.0"
                    },
                    {
                        default: "2026-01-09T06:00:00.000Z",
                        name: "REFERENCE_TIME",
                        units: "ISO8601",
                        value: "2026-01-08T00:00:00.000Z,2026-01-08T06:00:00.000Z,2026-01-08T12:00:00.000Z,2026-01-08T18:00:00.000Z,2026-01-09T00:00:00.000Z,2026-01-09T06:00:00.000Z"
                    }
                ],
                step = {
                    year: "1"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                defaultValue = wmsTimeLayer.prepareTimeSliderObject(time, filteredTimeRange, timeSource, staticDimensions, step, attributes);

            expect(defaultValue).to.equals("2005");
            expect(commitStub.calledOnce).to.be.true;
            expect(commitStub.firstCall.args[0]).to.equals("Modules/WmsTime/addTimeSliderObject");
            expect(commitStub.firstCall.args[1]).to.deep.equals(
                {
                    keyboardMovement: undefined,
                    defaultValue: "2005",
                    defaultValueEnd: null,
                    dualRangeSlider: false,
                    step: {
                        year: "1"
                    },
                    timeRange: ["2001", "2002", "2003", "2004", "2005"],
                    staticDimensions: {
                        "ELEVATION": "2.0",
                        "REFERENCE_TIME": "2026-01-08T00:00:00.000Z"
                    },
                    layerId: "id"
                }
            );
        });

        it("should return the default value from service for input time and trigger addTimeSliderObject action with dualRangeSlider", () => {
            const time = {
                    dimensionName: "time",
                    extentName: "time",
                    dualRangeSlider: true
                },
                filteredTimeRange = ["2001", "2002", "2003", "2004", "2005"],
                timeSource = {
                    default: "2005",
                    name: "time",
                    nearestValue: "0",
                    units: "ISO8601",
                    value: "2001/2025/P1Y"
                },
                staticDimensions = [],
                step = {
                    year: "1"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                defaultValue = wmsTimeLayer.prepareTimeSliderObject(time, filteredTimeRange, timeSource, staticDimensions, step, attributes);

            expect(defaultValue).to.equals("2005");
            expect(commitStub.calledOnce).to.be.true;
            expect(commitStub.firstCall.args[0]).to.equals("Modules/WmsTime/addTimeSliderObject");
            expect(commitStub.firstCall.args[1]).to.deep.equals(
                {
                    keyboardMovement: undefined,
                    defaultValue: "2005",
                    defaultValueEnd: null,
                    dualRangeSlider: true,
                    step: {
                        year: "1"
                    },
                    timeRange: ["2001", "2002", "2003", "2004", "2005"],
                    staticDimensions: {},
                    layerId: "id"
                }
            );
        });

        it("should trigger addTimeSliderObject action with dualRangeSlider default values (start and end)", () => {
            const time = {
                    dimensionName: "time",
                    extentName: "time",
                    dualRangeSlider: true,
                    default: [1, 3]
                },
                filteredTimeRange = ["2001", "2002", "2003", "2004", "2005"],
                timeSource = {
                    default: "2005",
                    name: "time",
                    nearestValue: "0",
                    units: "ISO8601",
                    value: "2001/2025/P1Y"
                },
                staticDimensions = [],
                step = {
                    year: "1"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                defaultValue = wmsTimeLayer.prepareTimeSliderObject(time, filteredTimeRange, timeSource, staticDimensions, step, attributes);

            expect(defaultValue).to.equals("2002");
            expect(commitStub.calledOnce).to.be.true;
            expect(commitStub.firstCall.args[0]).to.equals("Modules/WmsTime/addTimeSliderObject");
            expect(commitStub.firstCall.args[1]).to.deep.equals(
                {
                    keyboardMovement: undefined,
                    defaultValue: "2002",
                    defaultValueEnd: "2004",
                    dualRangeSlider: true,
                    step: {
                        year: "1"
                    },
                    timeRange: ["2001", "2002", "2003", "2004", "2005"],
                    staticDimensions: {},
                    layerId: "id"
                }
            );
        });

        it("should return the first value of default value array from service for input time and trigger addTimeSliderObject action", () => {
            const time = {
                    dimensionName: "time",
                    extentName: "time",
                    dualRangeSlider: false,
                    default: [1, 3]
                },
                filteredTimeRange = ["2001", "2002", "2003", "2004", "2005"],
                timeSource = {
                    default: "2005",
                    name: "time",
                    nearestValue: "0",
                    units: "ISO8601",
                    value: "2001/2025/P1Y"
                },
                staticDimensions = [],
                step = {
                    year: "1"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                defaultValue = wmsTimeLayer.prepareTimeSliderObject(time, filteredTimeRange, timeSource, staticDimensions, step, attributes);

            expect(defaultValue).to.equals("2002");
            expect(commitStub.calledOnce).to.be.true;
            expect(commitStub.firstCall.args[0]).to.equals("Modules/WmsTime/addTimeSliderObject");
            expect(commitStub.firstCall.args[1]).to.deep.equals(
                {
                    keyboardMovement: undefined,
                    defaultValue: "2002",
                    defaultValueEnd: null,
                    dualRangeSlider: false,
                    step: {
                        year: "1"
                    },
                    timeRange: ["2001", "2002", "2003", "2004", "2005"],
                    staticDimensions: {},
                    layerId: "id"
                }
            );
        });
    });

    describe("retrieveStaticDimensions", () => {
        it("should return the static dimensions attributes from layer node", () => {
            const staticDimensionsNames = ["elevation", "REFERENCE_TIME"],
                layerNode = new DOMParser().parseFromString("<Layer queryable='1' opaque='0'>"
                    + "<Dimension name='time' default='current' units='ISO8601'>2026-01-08T00:00:00.000Z/2026-01-14T06:00:00.000Z/PT1H</Dimension>"
                    + "<Dimension name='elevation' default='2.0' units='EPSG:5030' unitSymbol='m'>2.0,50.0,100.0,150.0,200.0,250.0,300.0,350.0,400.0,450.0,500.0</Dimension>"
                    + "<Dimension name='REFERENCE_TIME' default='2026-01-09T06:00:00.000Z' units='ISO8601'>2026-01-08T00:00:00.000Z,2026-01-08T06:00:00.000Z,2026-01-08T12:00:00.000Z,2026-01-08T18:00:00.000Z,2026-01-09T00:00:00.000Z,2026-01-09T06:00:00.000Z</Dimension>"
                    + "</Layer>", "text/xml").documentElement,
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes);

            expect(wmsTimeLayer.retrieveStaticDimensions(staticDimensionsNames, layerNode)).to.deep.equals(
                [
                    {
                        value: "2.0,50.0,100.0,150.0,200.0,250.0,300.0,350.0,400.0,450.0,500.0",
                        name: "elevation",
                        default: "2.0",
                        units: "EPSG:5030",
                        unitSymbol: "m"
                    },
                    {
                        name: "REFERENCE_TIME",
                        default: "2026-01-09T06:00:00.000Z",
                        units: "ISO8601",
                        value: "2026-01-08T00:00:00.000Z,2026-01-08T06:00:00.000Z,2026-01-08T12:00:00.000Z,2026-01-08T18:00:00.000Z,2026-01-09T00:00:00.000Z,2026-01-09T06:00:00.000Z"
                    }
                ]
            );
        });

        it("should return the an empty array, if input param staticDimensions is empty", () => {
            const staticDimensionsNames = [],
                layerNode = new DOMParser().parseFromString("<Layer queryable='1' opaque='0'>"
                    + "<Dimension name='time' default='current' units='ISO8601'>2026-01-08T00:00:00.000Z/2026-01-14T06:00:00.000Z/PT1H</Dimension>"
                    + "<Dimension name='elevation' default='2.0' units='EPSG:5030' unitSymbol='m'>2.0,50.0,100.0,150.0,200.0,250.0,300.0,350.0,400.0,450.0,500.0</Dimension>"
                    + "<Dimension name='REFERENCE_TIME' default='2026-01-09T06:00:00.000Z' units='ISO8601'>2026-01-08T00:00:00.000Z,2026-01-08T06:00:00.000Z,2026-01-08T12:00:00.000Z,2026-01-08T18:00:00.000Z,2026-01-09T00:00:00.000Z,2026-01-09T06:00:00.000Z</Dimension>"
                    + "</Layer>", "text/xml").documentElement,
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes);

            expect(wmsTimeLayer.retrieveStaticDimensions(staticDimensionsNames, layerNode)).to.be.an("array").that.is.empty;
        });

        it("should return the an empty array and print a console.warn, if the static dimension doesn't exist in the layernode", () => {
            const staticDimensionsNames = ["elevation"],
                layerNode = new DOMParser().parseFromString("<Layer queryable='1' opaque='0'>"
                    + "<Dimension name='time' default='current' units='ISO8601'>2026-01-08T00:00:00.000Z/2026-01-14T06:00:00.000Z/PT1H</Dimension>"
                    + "</Layer>", "text/xml").documentElement,
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes);

            expect(wmsTimeLayer.retrieveStaticDimensions(staticDimensionsNames, layerNode)).to.be.an("array").that.is.empty;
            expect(warnSpy.calledOnce).to.be.true;
        });
    });

    describe("retrieveTimeData ", () => {
        it("should return dimension, extent and staticDimensions time data", () => {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                xmlCapabilities = "<WMS_Capabilities xmlns:inspire_vs='http://inspire.ec.europa.eu/schemas/inspire_vs/1.0' xmlns:inspire_common='http://inspire.ec.europa.eu/schemas/common/1.0' xmlns='http://www.opengis.net/wms' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' version='1.3.0' updateSequence='23709' xsi:schemaLocation='http://www.opengis.net/wms https://maps.dwd.de/geoserver/schemas/wms/1.3.0/capabilities_1_3_0.xsd http://inspire.ec.europa.eu/schemas/inspire_vs/1.0 https://inspire.ec.europa.eu/schemas/inspire_vs/1.0/inspire_vs.xsd'>"
                    + "<Capability>"
                    + "<Layer queryable='1' opaque='0'>"
                    + "<Name>Icon-eu_reg00625_fd_gl_T</Name>"
                    + "<Dimension name='time' default='current' units='ISO8601'>2026-01-08T00:00:00.000Z/2026-01-14T06:00:00.000Z/PT1H</Dimension>"
                    + "<Dimension name='elevation' default='2.0' units='EPSG:5030' unitSymbol='m'>2.0,50.0,100.0,150.0,200.0,250.0,300.0,350.0,400.0,450.0,500.0</Dimension>"
                    + "<Dimension name='REFERENCE_TIME' default='2026-01-09T06:00:00.000Z' units='ISO8601'>2026-01-08T00:00:00.000Z,2026-01-08T06:00:00.000Z,2026-01-08T12:00:00.000Z,2026-01-08T18:00:00.000Z,2026-01-09T00:00:00.000Z,2026-01-09T06:00:00.000Z</Dimension>"
                    + "</Layer>"
                    + "</Capability>"
                    + "</WMS_Capabilities>",
                layerName = "Icon-eu_reg00625_fd_gl_T",
                timeSpecification = {
                    dimensionName: "time",
                    extentName: "time",
                    staticDimensions: {
                        elevation: true,
                        REFERENCE_TIME: true
                    }
                };

            expect(wmsTimeLayer.retrieveTimeData(xmlCapabilities, layerName, timeSpecification)).to.deep.equals(
                {
                    dimension: {
                        default: "current",
                        name: "time",
                        units: "ISO8601",
                        value: "2026-01-08T00:00:00.000Z/2026-01-14T06:00:00.000Z/PT1H"
                    },
                    extent: null,
                    staticDimensions: [
                        {
                            default: "2.0",
                            name: "elevation",
                            unitSymbol: "m",
                            units: "EPSG:5030",
                            value: "2.0,50.0,100.0,150.0,200.0,250.0,300.0,350.0,400.0,450.0,500.0"
                        },
                        {
                            default: "2026-01-09T06:00:00.000Z",
                            name: "REFERENCE_TIME",
                            units: "ISO8601",
                            value: "2026-01-08T00:00:00.000Z,2026-01-08T06:00:00.000Z,2026-01-08T12:00:00.000Z,2026-01-08T18:00:00.000Z,2026-01-09T00:00:00.000Z,2026-01-09T06:00:00.000Z"
                        }
                    ]
                }
            );
        });

        it("should return dimension, extent and staticDimension as empty array, if no staticDimensions are configured", () => {
            const wmsTimeLayer = new Layer2dRasterWmsTime(attributes),
                xmlCapabilities = "<WMS_Capabilities xmlns:inspire_vs='http://inspire.ec.europa.eu/schemas/inspire_vs/1.0' xmlns:inspire_common='http://inspire.ec.europa.eu/schemas/common/1.0' xmlns='http://www.opengis.net/wms' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' version='1.3.0' updateSequence='23709' xsi:schemaLocation='http://www.opengis.net/wms https://maps.dwd.de/geoserver/schemas/wms/1.3.0/capabilities_1_3_0.xsd http://inspire.ec.europa.eu/schemas/inspire_vs/1.0 https://inspire.ec.europa.eu/schemas/inspire_vs/1.0/inspire_vs.xsd'>"
                    + "<Capability>"
                    + "<Layer queryable='1' opaque='0'>"
                    + "<Name>Icon-eu_reg00625_fd_gl_T</Name>"
                    + "<Dimension name='time' default='current' units='ISO8601'>2026-01-08T00:00:00.000Z/2026-01-14T06:00:00.000Z/PT1H</Dimension>"
                    + "<Dimension name='elevation' default='2.0' units='EPSG:5030' unitSymbol='m'>2.0,50.0,100.0,150.0,200.0,250.0,300.0,350.0,400.0,450.0,500.0</Dimension>"
                    + "<Dimension name='REFERENCE_TIME' default='2026-01-09T06:00:00.000Z' units='ISO8601'>2026-01-08T00:00:00.000Z,2026-01-08T06:00:00.000Z,2026-01-08T12:00:00.000Z,2026-01-08T18:00:00.000Z,2026-01-09T00:00:00.000Z,2026-01-09T06:00:00.000Z</Dimension>"
                    + "</Layer>"
                    + "</Capability>"
                    + "</WMS_Capabilities>",
                layerName = "Icon-eu_reg00625_fd_gl_T",
                timeSpecification = {
                    dimensionName: "time",
                    extentName: "time"
                };

            expect(wmsTimeLayer.retrieveTimeData(xmlCapabilities, layerName, timeSpecification)).to.deep.equals(
                {
                    dimension: {
                        default: "current",
                        name: "time",
                        units: "ISO8601",
                        value: "2026-01-08T00:00:00.000Z/2026-01-14T06:00:00.000Z/PT1H"
                    },
                    extent: null,
                    staticDimensions: []
                }
            );
        });
    });

    describe("updateTime", () => {
        it("should update the params TIME and staticDimension in layerSource", () => {
            const id = "Icon-eu_reg00625_fd_gl_T_3",
                newValue = "2026-01-12T11:00:00.000Z",
                newValueEnd = null,
                staticDimensions = {
                    elevation: "2.0",
                    REFERENCE_TIME: "2026-01-11T00:00:00.000Z"
                },
                wmsTimeLayer = new Layer2dRasterWmsTime({...attributes, id}),
                updateParamsSpy = sinon.spy(wmsTimeLayer.getLayerSource(), "updateParams"),
                setVisibleSpy = sinon.spy(wmsTimeLayer.getLayer(), "setVisible");

            wmsTimeLayer.updateTime(id, newValue, newValueEnd, staticDimensions);

            expect(updateParamsSpy.calledOnce).to.be.true;
            expect(updateParamsSpy.firstCall.args[0]).to.deep.equals(
                {
                    TIME: "2026-01-12T11:00:00.000Z",
                    elevation: "2.0",
                    REFERENCE_TIME: "2026-01-11T00:00:00.000Z"
                }
            );
            expect(setVisibleSpy.calledOnce).to.be.true;
            expect(setVisibleSpy.firstCall.args[0]).to.be.true;
        });

        it("should update the params TIME without staticDimension in layerSource, if staticDimensions were not passed", () => {
            const id = "Icon-eu_reg00625_fd_gl_T_3",
                newValue = "2026-01-12T11:00:00.000Z",
                wmsTimeLayer = new Layer2dRasterWmsTime({...attributes, id}),
                updateParamsSpy = sinon.spy(wmsTimeLayer.getLayerSource(), "updateParams"),
                setVisibleSpy = sinon.spy(wmsTimeLayer.getLayer(), "setVisible");

            wmsTimeLayer.updateTime(id, newValue);

            expect(updateParamsSpy.calledOnce).to.be.true;
            expect(updateParamsSpy.firstCall.args[0]).to.deep.equals(
                {
                    TIME: "2026-01-12T11:00:00.000Z"
                }
            );
            expect(setVisibleSpy.calledOnce).to.be.true;
            expect(setVisibleSpy.firstCall.args[0]).to.be.true;
        });

        it("should update the params TIME without staticDimension in layerSource and with TIME end value", () => {
            const id = "Icon-eu_reg00625_fd_gl_T_3",
                newValue = "2026-01-12T11:00:00.000Z",
                newValueEnd = "2026-01-13T12:00:00.000Z",
                wmsTimeLayer = new Layer2dRasterWmsTime({...attributes, id}),
                updateParamsSpy = sinon.spy(wmsTimeLayer.getLayerSource(), "updateParams"),
                setVisibleSpy = sinon.spy(wmsTimeLayer.getLayer(), "setVisible");

            wmsTimeLayer.updateTime(id, newValue, newValueEnd);

            expect(updateParamsSpy.calledOnce).to.be.true;
            expect(updateParamsSpy.firstCall.args[0]).to.deep.equals(
                {
                    TIME: "2026-01-12T11:00:00.000Z/2026-01-13T12:00:00.000Z"
                }
            );
            expect(setVisibleSpy.calledOnce).to.be.true;
            expect(setVisibleSpy.firstCall.args[0]).to.be.true;
        });
    });
});
