import {expect} from "chai";
import sinon from "sinon";
import store from "@appstore/index.js";
import Layer2dRasterWmsTime from "@core/layers/js/layer2dRasterWmsTime.js";
import axios from "axios";

describe("src/core/js/layers/layer2dRasterWmsTime.js", () => {
    let attributes,
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
            errorStub.restore();
            const dimensionRange = "./resources/example.json",
                wmsTimeLayer = new Layer2dRasterWmsTime(attributes);
            let filteredDimensionRangeList = [];

            sinon.stub(wmsTimeLayer, "loadDimensionRangeJson").returns([
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z"
            ]);

            filteredDimensionRangeList = await wmsTimeLayer.filterDimensions(timeRange, dimensionRange);

            expect(filteredDimensionRangeList).to.be.an("array");
            expect(filteredDimensionRangeList).to.deep.equals([
                "2025-05-01T00:00:00.000Z",
                "2025-07-01T00:00:00.000Z",
                "2025-09-01T00:00:00.000Z"
            ]);
            expect(error.called).to.be.false;
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
});
