import {expect} from "chai";
import sinon from "sinon";
import store from "@appstore/index.js";
import Layer2dRasterWms from "@core/layers/js/layer2dRasterWms.js";

describe("src/core/js/layers/layer2dRasterWms.js", () => {
    let attributes,
        warn,
        origGetters;

    beforeAll(() => {
        origGetters = store.getters;
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getResolutions: () => [2000, 1000],
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
        store.getters = {
            isModuleAvailable: () => false
        };
        attributes = {
            id: "id",
            layers: "layer1,layer2",
            name: "wmsTestLayer",
            singleTile: false,
            tilesize: 512,
            transparent: false,
            typ: "WMS"
        };
    });

    afterEach(() => {
        delete Config.overwriteWmsLoadfunction;
        delete Config.login;
        store.getters = origGetters;
    });

    describe("createLayer", () => {
        it("new Layer2dRasterWms should create an layer with no warning", () => {
            const wmsLayer = new Layer2dRasterWms({});

            expect(wmsLayer).not.to.be.undefined;
            expect(warn.notCalled).to.be.true;
        });

        it("new Layer2dRasterWms with attributes should create an layer", () => {
            const wmsLayer = new Layer2dRasterWms(attributes);

            expect(wmsLayer).not.to.be.undefined;
            expect(wmsLayer.getLayer()).not.to.be.undefined;
        });
    });

    describe("getRawLayerAttributes", () => {
        let localAttributes;

        beforeEach(() => {
            localAttributes = {
                crs: "25832",
                cqlFilter: "A=1",
                format: "image/png",
                gutter: 0,
                id: "123456789",
                layers: "layer_names",
                singleTile: false,
                tilesize: 512,
                transparent: true,
                url: "http://test.url",
                version: "1.3.0",
                isSecured: false
            };
        });

        it("should return the raw layer attributes", () => {
            const wmsLayer = new Layer2dRasterWms(localAttributes);

            expect(wmsLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                crs: "25832",
                cqlFilter: "A=1",
                format: "image/png",
                gutter: 0,
                id: "123456789",
                isSecured: false,
                layers: "layer_names",
                singleTile: false,
                tilesize: 512,
                transparent: "true",
                url: "http://test.url",
                version: "1.3.0",
                extent: undefined
            });
        });

        it("should return the raw layer attributes with styles and extent", () => {
            Object.assign(localAttributes, {
                styles: [
                    "geofox_stations"
                ],
                extent: [10, 20, 11, 22]
            });
            const wmsLayer = new Layer2dRasterWms(localAttributes);

            expect(wmsLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                crs: "25832",
                cqlFilter: "A=1",
                format: "image/png",
                gutter: 0,
                id: "123456789",
                isSecured: false,
                layers: "layer_names",
                singleTile: false,
                STYLES: ["geofox_stations"],
                tilesize: 512,
                transparent: "true",
                url: "http://test.url",
                version: "1.3.0",
                extent: [10, 20, 11, 22]
            });
        });
    });

    describe("getLayerParams", () => {
        let localAttributes;

        beforeEach(() => {
            localAttributes = {
                format: "image/png",
                gfiAsNewWindow: false,
                gfiAttributes: "showAll",
                gfiTheme: "default",
                infoFormat: "text/xml",
                layers: "test_layers",
                name: "test_name",
                transparency: 10,
                typ: "wms",
                zIndex: 1,
                featureCount: 5
            };

        });

        it("should return the layer params, , overwriteWmsLoadfunction not set", () => {
            const wmsLayer = new Layer2dRasterWms(localAttributes);

            expect(wmsLayer.getLayerParams(localAttributes)).to.deep.equals({
                format: "image/png",
                gfiAsNewWindow: false,
                gfiAttributes: "showAll",
                gfiTheme: "default",
                gfiTitleAttribute: undefined,
                infoFormat: "text/xml",
                layers: "test_layers",
                name: "test_name",
                opacity: 0.9,
                typ: "wms",
                zIndex: 1,
                featureCount: 5,
                gfiThemeSettings: undefined,
                useFetchForWMS: false
            });
        });

        it("should return the layer params, overwriteWmsLoadfunction is true", () => {
            Config.overwriteWmsLoadfunction = true;

            const wmsLayer = new Layer2dRasterWms(localAttributes);

            expect(wmsLayer.getLayerParams(localAttributes)).to.deep.equals({
                format: "image/png",
                gfiAsNewWindow: false,
                gfiAttributes: "showAll",
                gfiTheme: "default",
                gfiTitleAttribute: undefined,
                infoFormat: "text/xml",
                layers: "test_layers",
                name: "test_name",
                opacity: 0.9,
                typ: "wms",
                zIndex: 1,
                featureCount: 5,
                gfiThemeSettings: undefined,
                useFetchForWMS: true
            });
        });
    });

    describe("getOptions", () => {
        let localAttributes;

        beforeEach(() => {
            localAttributes = {
                origin: [442800, 5809000]
            };
        });

        it("should return the options", () => {
            const wmsLayer = new Layer2dRasterWms(localAttributes);

            expect(wmsLayer.getOptions(localAttributes)).to.deep.equals({
                origin: [442800, 5809000],
                resolutions: [2000, 1000]
            });
        });
    });

    describe("createLegend", () => {
        let fetchStub,
            createObjectURLStub;

        beforeEach(() => {
            attributes = {
                id: "id",
                version: "1.3.0"
            };
            fetchStub = sinon.stub(globalThis, "fetch");
            createObjectURLStub = sinon.stub(globalThis.URL, "createObjectURL");
        });

        afterEach(() => {
            fetchStub.restore();
            createObjectURLStub.restore();
        });

        it("createLegend with legendURL", async () => {
            attributes.legendURL = "https://legendURL";
            const layerWrapper = new Layer2dRasterWms(attributes);

            expect(await layerWrapper.createLegend()).to.be.deep.equals([attributes.legendURL]);
        });

        it("createLegend with ignored legendURL", async () => {
            attributes.legendURL = "ignore";
            const layerWrapper = new Layer2dRasterWms(attributes);

            expect(await layerWrapper.createLegend()).to.be.false;
        });

        it("createLegend with legend as Array", async () => {
            attributes.legend = ["legend"];
            const layerWrapper = new Layer2dRasterWms(attributes);

            expect(await layerWrapper.createLegend()).to.be.deep.equals(attributes.legend);
        });

        it("createLegend with legend true and 2 layer names", async () => {
            attributes.legend = true;
            attributes.url = "https://url";
            attributes.layers = "layer1,layer2";
            const layerWrapper = new Layer2dRasterWms(attributes),
                expectedLegend = ["https://url/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=layer1",
                    "https://url/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=layer2"];

            expect(await layerWrapper.createLegend()).to.be.deep.equals(expectedLegend);
        });

        it("createLegend fetches blob legend for logged-in user when legend URL matches the login interceptor", async () => {
            attributes.legend = true;
            attributes.url = "https://url";
            attributes.layers = "layer1,layer2";
            attributes.isSecured = true;
            Config.login = {
                interceptorUrlRegex: /url/
            };
            store.getters = {
                isModuleAvailable: moduleName => moduleName === "login",
                "Modules/Login/loggedIn": true
            };

            const fakeBlob = new Blob(["legend"], {type: "image/png"});

            fetchStub.resolves({
                ok: true,
                blob: sinon.stub().resolves(fakeBlob)
            });
            createObjectURLStub.onFirstCall().returns("blob:legend-1");
            createObjectURLStub.onSecondCall().returns("blob:legend-2");

            const layerWrapper = new Layer2dRasterWms(attributes),
                legend = await layerWrapper.createLegend();

            expect(fetchStub.calledTwice).to.be.true;
            expect(fetchStub.firstCall.args[1]).to.deep.equals({credentials: "include"});
            expect(createObjectURLStub.calledTwice).to.be.true;
            expect(legend).to.deep.equals(["blob:legend-1", "blob:legend-2"]);
        });

        it("createLegend fetches blob for logged-in user and matching legendURL string", async () => {
            attributes.legendURL = "https://legendURL";
            attributes.isSecured = true;
            Config.login = {
                interceptorUrlRegex: /legendurl/i
            };
            store.getters = {
                isModuleAvailable: moduleName => moduleName === "login",
                "Modules/Login/loggedIn": true
            };

            const fakeBlob = new Blob(["legend"], {type: "image/png"});

            fetchStub.resolves({
                ok: true,
                blob: sinon.stub().resolves(fakeBlob)
            });
            createObjectURLStub.returns("blob:legend-1");

            const layerWrapper = new Layer2dRasterWms(attributes),
                legend = await layerWrapper.createLegend();

            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[0]).to.equals("https://legendURL");
            expect(fetchStub.firstCall.args[1]).to.deep.equals({credentials: "include"});
            expect(createObjectURLStub.calledOnce).to.be.true;
            expect(legend).to.deep.equals(["blob:legend-1"]);
        });

        it("createLegend fetches blob for logged-in user and matching legend array", async () => {
            attributes.legend = ["https://legend-1", "https://legend-2"];
            attributes.isSecured = true;
            Config.login = {
                interceptorUrlRegex: /legend-/i
            };
            store.getters = {
                isModuleAvailable: moduleName => moduleName === "login",
                "Modules/Login/loggedIn": true
            };

            const fakeBlob = new Blob(["legend"], {type: "image/png"});

            fetchStub.resolves({
                ok: true,
                blob: sinon.stub().resolves(fakeBlob)
            });
            createObjectURLStub.onFirstCall().returns("blob:legend-1");
            createObjectURLStub.onSecondCall().returns("blob:legend-2");

            const layerWrapper = new Layer2dRasterWms(attributes),
                legend = await layerWrapper.createLegend();

            expect(fetchStub.calledTwice).to.be.true;
            expect(fetchStub.firstCall.args[1]).to.deep.equals({credentials: "include"});
            expect(createObjectURLStub.calledTwice).to.be.true;
            expect(legend).to.deep.equals(["blob:legend-1", "blob:legend-2"]);
        });

        it("createLegend does not fetch with credentials when URL matches the login interceptor but user is not logged in", async () => {
            attributes.legendURL = "https://legendURL";
            Config.login = {
                interceptorUrlRegex: /legendurl/i
            };
            store.getters = {
                isModuleAvailable: moduleName => moduleName === "login",
                "Modules/Login/loggedIn": false
            };

            const layerWrapper = new Layer2dRasterWms(attributes),
                legend = await layerWrapper.createLegend();

            expect(fetchStub.called).to.be.false;
            expect(legend).to.deep.equals(["https://legendURL"]);
        });

        it("createLegend does not fetch with credentials when login module is available but layer is not secured and URL is not matched", async () => {
            attributes.legendURL = "https://legendURL";
            Config.login = {
                interceptorUrlRegex: /otherdomain/
            };
            store.getters = {
                isModuleAvailable: moduleName => moduleName === "login",
                "Modules/Login/loggedIn": true
            };

            const layerWrapper = new Layer2dRasterWms(attributes),
                legend = await layerWrapper.createLegend();

            expect(fetchStub.called).to.be.false;
            expect(legend).to.deep.equals(["https://legendURL"]);
        });
    });
});
