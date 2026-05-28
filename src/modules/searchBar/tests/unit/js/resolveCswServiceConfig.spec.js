import {expect} from "chai";
import sinon from "sinon";
import axios from "axios";
import {WMTSCapabilities} from "ol/format.js";
import mapCollection from "@core/maps/js/mapCollection.js";
import * as detectServiceTypeModule from "../../../js/detectServiceType.js";
import resolveCswServiceConfig from "../../../js/resolveCswServiceConfig.js";

describe("src/modules/searchBar/js/resolveCswServiceConfig.js", () => {
    let detectStub;

    beforeEach(() => {
        detectStub = sinon.stub(detectServiceTypeModule, "default");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("technicalLayerName validation", () => {
        it("should use a clean technical layer name as effectiveLayerName", async () => {
            detectStub.returns("WMS");
            const result = await resolveCswServiceConfig({
                protocol: "OGC:WMS",
                url: "https://example.com/wms",
                layerName: "my_layer",
                urlLayerParam: "",
                baseUrl: "https://example.com/wms"
            });

            expect(result.effectiveLayerName).to.equal("my_layer");
        });

        it("should accept a layer name with parentheses as a valid technical name", async () => {
            detectStub.returns("WMS");
            const result = await resolveCswServiceConfig({
                protocol: "OGC:WMS",
                url: "https://example.com/wms",
                layerName: "xplan:BP_Plan(Bebauungsplan)",
                urlLayerParam: "",
                baseUrl: "https://example.com/wms"
            });

            // Names without spaces are accepted regardless of other characters
            expect(result.effectiveLayerName).to.equal("xplan:BP_Plan(Bebauungsplan)");
        });

        it("should reject a layer name containing spaces", async () => {
            detectStub.returns("WMS");
            const result = await resolveCswServiceConfig({
                protocol: "OGC:WMS",
                url: "https://example.com/wms",
                layerName: "WMS GetCapabilities Anfrage",
                urlLayerParam: "fallback_layer",
                baseUrl: "https://example.com/wms"
            });

            expect(result.effectiveLayerName).to.equal("fallback_layer");
        });

        it("should fall back to urlLayerParam when layerName is rejected", async () => {
            detectStub.returns("WMS");
            const result = await resolveCswServiceConfig({
                protocol: "OGC:WMS",
                url: "https://example.com/wms?LAYERS=roads",
                layerName: "Layer with spaces",
                urlLayerParam: "roads",
                baseUrl: "https://example.com/wms"
            });

            expect(result.effectiveLayerName).to.equal("roads");
        });
    });

    describe("unknown service type", () => {
        it("should return typ=null and empty defaults when service type is unknown", async () => {
            detectStub.returns(null);
            const result = await resolveCswServiceConfig({
                protocol: "ATOM",
                url: "https://example.com/download",
                layerName: "",
                urlLayerParam: "",
                baseUrl: "https://example.com/download"
            });

            expect(result.typ).to.be.null;
            expect(result.discoveredLayerEntries).to.deep.equal([]);
        });
    });

    describe("OAF service type", () => {
        it("should map discovered OAF collections to collection source property", async () => {
            detectStub.returns("OAF");
            // Stub axios so that the real handleOafFromCsw resolves quickly with the expected data.
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {title: "Test OAF", links: []}})
                .onSecondCall().resolves({data: {collections: [{id: "buildings", title: "Buildings"}]}});

            const result = await resolveCswServiceConfig({
                protocol: "OGC:API-FEATURES",
                url: "https://example.com/oaf",
                layerName: "",
                urlLayerParam: "",
                baseUrl: "https://example.com/oaf"
            });

            expect(result.typ).to.equal("OAF");
            expect(result.discoveredLayerEntries).to.deep.equal([
                {
                    name: "Buildings",
                    sourceProps: {collection: "buildings"}
                }
            ]);
        });
    });

    describe("WMTS service type", () => {
        /**
         * Stubs WMTS capabilities parsing and HTTP request for test setup.
         * @param {Object[]} layerTitleEntries Entries used to build mocked layers.
         * @returns {void}
         */
        function stubWmtsCapabilities (layerTitleEntries) {
            sinon.stub(mapCollection, "getMapView").returns({
                getProjection: () => ({getCode: () => "EPSG:25832"})
            });
            sinon.stub(axios, "get").resolves({data: "<Capabilities/>"});

            const layers = layerTitleEntries.map(e => ({
                Identifier: e.name,
                Title: e.title,
                Format: e.format ? [e.format] : [],
                TileMatrixSetLink: e.tileMatrixSet ? [{TileMatrixSet: e.tileMatrixSet}] : []
            }));
            const tileMatrixSets = layerTitleEntries
                .filter(e => e.tileMatrixSet)
                .map(e => ({Identifier: e.tileMatrixSet, SupportedCRS: "urn:ogc:def:crs:EPSG::3857"}));

            sinon.stub(WMTSCapabilities.prototype, "read").returns({
                ServiceIdentification: {Title: "Demo WMTS"},
                Contents: {Layer: layers, TileMatrixSet: tileMatrixSets}
            });
        }

        it("should discover WMTS layers and populate discoveredLayerEntries with format and tileMatrixSet", async () => {
            detectStub.returns("WMTS");
            stubWmtsCapabilities([{name: "topo", title: "Topo Map", format: "image/png", tileMatrixSet: "grid_3857"}]);

            const result = await resolveCswServiceConfig({
                protocol: "OGC:WMTS",
                url: "https://example.com/wmts",
                layerName: "",
                urlLayerParam: "",
                baseUrl: "https://example.com/wmts"
            });

            expect(result.typ).to.equal("WMTS");
            expect(result.wmtsCapabilitiesUrl).to.include("SERVICE=WMTS");
            expect(result.discoveredLayerEntries).to.deep.equal([{
                name: "Topo Map",
                sourceProps: {layers: "topo", format: "image/png", tileMatrixSet: "grid_3857"}
            }]);
        });

        it("should resolve a known layerName against WMTS layers and set wmtsFormat and wmtsTileMatrixSet", async () => {
            detectStub.returns("WMTS");
            stubWmtsCapabilities([{name: "topo", title: "Topo Map", format: "image/png", tileMatrixSet: "grid_3857"}]);

            const result = await resolveCswServiceConfig({
                protocol: "OGC:WMTS",
                url: "https://example.com/wmts",
                layerName: "topo",
                urlLayerParam: "",
                baseUrl: "https://example.com/wmts"
            });

            expect(result.effectiveLayerName).to.equal("topo");
            expect(result.wmtsFormat).to.equal("image/png");
            expect(result.wmtsTileMatrixSet).to.equal("grid_3857");
            expect(result.discoveredLayerEntries).to.deep.equal([]);
        });

        it("should return serviceUnavailable:true when the WMTS axios request fails", async () => {
            detectStub.returns("WMTS");
            sinon.stub(mapCollection, "getMapView").returns({getProjection: () => ({getCode: () => "EPSG:25832"})});
            sinon.stub(axios, "get").rejects(new Error("Network Error"));

            const result = await resolveCswServiceConfig({
                protocol: "OGC:WMTS",
                url: "https://example.com/wmts",
                layerName: "",
                urlLayerParam: "",
                baseUrl: "https://example.com/wmts"
            });

            expect(result.serviceUnavailable).to.be.true;
            expect(result.discoveredLayerEntries).to.deep.equal([]);
        });
    });

    describe("normalizeOafUrl via OAF branch", () => {
        it("should strip /collections/{id} from OAF URL and use it as effectiveLayerName", async () => {
            detectStub.returns("OAF");
            // Stub axios so handleOafFromCsw resolves quickly; we only test URL normalisation here.
            sinon.stub(axios, "get").resolves({data: {collections: []}});

            const result = await resolveCswServiceConfig({
                protocol: "OGC:API-FEATURES",
                url: "https://example.com/oaf/collections/buildings",
                layerName: "",
                urlLayerParam: "",
                baseUrl: "https://example.com/oaf/collections/buildings"
            });

            expect(result.baseUrl).to.equal("https://example.com/oaf");
            expect(result.effectiveLayerName).to.equal("buildings");
        });

        it("should strip /collections/{id}/items suffix and query parameters from OAF URL", async () => {
            detectStub.returns("OAF");
            sinon.stub(axios, "get").resolves({data: {collections: []}});

            const result = await resolveCswServiceConfig({
                protocol: "OGC:API-FEATURES",
                url: "https://example.com/oaf/collections/streets/items?limit=10",
                layerName: "",
                urlLayerParam: "",
                baseUrl: "https://example.com/oaf/collections/streets/items?limit=10"
            });

            expect(result.baseUrl).to.equal("https://example.com/oaf");
            expect(result.effectiveLayerName).to.equal("streets");
        });

        it("should keep a clean OAF root URL unchanged", async () => {
            detectStub.returns("OAF");
            sinon.stub(axios, "get").resolves({data: {collections: [{id: "zones", title: "Zones"}]}});

            const result = await resolveCswServiceConfig({
                protocol: "OGC:API-FEATURES",
                url: "https://example.com/oaf",
                layerName: "",
                urlLayerParam: "",
                baseUrl: "https://example.com/oaf"
            });

            expect(result.baseUrl).to.equal("https://example.com/oaf");
        });
    });
});
