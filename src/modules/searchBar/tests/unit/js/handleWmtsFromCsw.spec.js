import {expect} from "chai";
import sinon from "sinon";
import axios from "axios";
import {WMTSCapabilities} from "ol/format.js";
import mapCollection from "@core/maps/js/mapCollection.js";
import handleWmtsFromCsw from "../../../js/handleWmtsFromCsw.js";

describe("src/modules/searchBar/js/handleWmtsFromCsw.js", () => {
    beforeEach(() => {
        sinon.stub(axios, "get").resolves({data: "<Capabilities/>"});
        sinon.stub(mapCollection, "getMapView").returns({
            getProjection: () => ({getCode: () => "EPSG:25832"})
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    /**
     * Creates a minimal capabilities object matching the structure returned by the OL WMTS parser.
     * @param {Object} opts Options
     * @param {string} opts.serviceTitle Title shown in capabilities
     * @param {Object[]} opts.layers Layer entries
     * @param {Object[]} opts.tileMatrixSets TileMatrixSet definitions
     * @returns {Object} Capabilities object
     */
    function makeCapabilities ({serviceTitle = "Test WMTS", layers = [], tileMatrixSets = []} = {}) {
        return {
            ServiceIdentification: {Title: serviceTitle},
            Contents: {Layer: layers, TileMatrixSet: tileMatrixSets}
        };
    }

    /**
     * Creates a minimal layer entry from capabilities.
     * @param {string} id Layer identifier
     * @param {string} title Layer title
     * @param {string[]} tileMatrixSetIds TileMatrixSet identifiers to link
     * @param {string[]} formats Supported formats
     * @returns {Object} Layer entry
     */
    function makeLayer (id, title, tileMatrixSetIds = [], formats = []) {
        return {
            Identifier: id,
            Title: title,
            Format: formats,
            TileMatrixSetLink: tileMatrixSetIds.map(tsId => ({TileMatrixSet: tsId}))
        };
    }

    /**
     * Creates a minimal TileMatrixSet entry.
     * @param {string} id Identifier
     * @param {string} crs SupportedCRS value (e.g. urn:ogc:def:crs:EPSG::3857)
     * @returns {Object} TileMatrixSet entry
     */
    function makeTileMatrixSet (id, crs) {
        return {Identifier: id, SupportedCRS: crs};
    }

    describe("service title and layer discovery", () => {
        it("should return serviceTitle, layersAdded, and layerNames from capabilities", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities({
                serviceTitle: "Demo WMTS",
                layers: [makeLayer("topo", "Topo Map", ["grid_3857"], ["image/png"])],
                tileMatrixSets: [makeTileMatrixSet("grid_3857", "urn:ogc:def:crs:EPSG::3857")]
            }));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.serviceTitle).to.equal("Demo WMTS");
            expect(result.layersAdded).to.be.true;
            expect(result.layerNames).to.deep.equal(["topo"]);
            expect(result.layerTitleEntries[0].title).to.equal("Topo Map");
        });

        it("should return layersAdded:false and empty arrays when capabilities has no layers", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities());

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.layersAdded).to.be.false;
            expect(result.layerNames).to.deep.equal([]);
            expect(result.layerTitleEntries).to.deep.equal([]);
        });
    });

    describe("capabilitiesUrl construction", () => {
        it("should call axios with SERVICE=WMTS and REQUEST=GetCapabilities in URL", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities());

            await handleWmtsFromCsw("https://example.com/wmts");

            const calledUrl = axios.get.firstCall.args[0];

            expect(calledUrl).to.include("SERVICE=WMTS");
            expect(calledUrl).to.include("REQUEST=GetCapabilities");
        });

        it("should include capabilitiesUrl in the result", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities());

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.capabilitiesUrl).to.include("SERVICE=WMTS");
            expect(result.capabilitiesUrl).to.include("REQUEST=GetCapabilities");
        });

        it("should preserve existing query parameters in the base URL", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities());

            const result = await handleWmtsFromCsw("https://example.com/wmts?VERSION=1.0.0");

            expect(result.capabilitiesUrl).to.include("VERSION=1.0.0");
            expect(result.capabilitiesUrl).to.include("SERVICE=WMTS");
        });
    });

    describe("TileMatrixSet selection", () => {
        it("should prefer the tile matrix set matching the current map projection (EPSG:25832)", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities({
                layers: [makeLayer("img", "Image", ["grid_25832", "grid_3857"])],
                tileMatrixSets: [
                    makeTileMatrixSet("grid_25832", "urn:ogc:def:crs:EPSG::25832"),
                    makeTileMatrixSet("grid_3857", "urn:ogc:def:crs:EPSG::3857")
                ]
            }));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.layerTitleEntries[0].tileMatrixSet).to.equal("grid_25832");
        });

        it("should fall back to EPSG:3857 when map projection has no matching tile matrix set", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities({
                layers: [makeLayer("img", "Image", ["grid_4326", "grid_3857"])],
                tileMatrixSets: [
                    makeTileMatrixSet("grid_4326", "urn:ogc:def:crs:EPSG::4326"),
                    makeTileMatrixSet("grid_3857", "urn:ogc:def:crs:EPSG::3857")
                ]
            }));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.layerTitleEntries[0].tileMatrixSet).to.equal("grid_3857");
        });

        it("should fall back to EPSG:4326 when EPSG:3857 is also unavailable", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities({
                layers: [makeLayer("img", "Image", ["grid_4326"])],
                tileMatrixSets: [
                    makeTileMatrixSet("grid_4326", "urn:ogc:def:crs:EPSG::4326")
                ]
            }));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.layerTitleEntries[0].tileMatrixSet).to.equal("grid_4326");
        });

        it("should return empty string when no usable CRS is found", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities({
                layers: [makeLayer("img", "Image", ["grid_5514"])],
                tileMatrixSets: [
                    // Czech Krovak projection — not registered in OL by default
                    makeTileMatrixSet("grid_5514", "urn:ogc:def:crs:EPSG::5514")
                ]
            }));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.layerTitleEntries[0].tileMatrixSet).to.equal("");
        });
    });

    describe("format selection", () => {
        it("should use format from the tile ResourceURL when present", async () => {
            const layer = makeLayer("topo", "Topo", ["grid_3857"], ["image/jpeg"]);

            layer.ResourceURL = [{
                resourceType: "tile",
                format: "image/png",
                template: "https://example.com/{TileMatrix}/{TileCol}/{TileRow}"
            }];
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities({
                layers: [layer],
                tileMatrixSets: [makeTileMatrixSet("grid_3857", "urn:ogc:def:crs:EPSG::3857")]
            }));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.layerTitleEntries[0].format).to.equal("image/png");
        });

        it("should fall back to the first Format array entry when no ResourceURL is present", async () => {
            sinon.stub(WMTSCapabilities.prototype, "read").returns(makeCapabilities({
                layers: [makeLayer("topo", "Topo", ["grid_3857"], ["image/jpeg"])],
                tileMatrixSets: [makeTileMatrixSet("grid_3857", "urn:ogc:def:crs:EPSG::3857")]
            }));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.layerTitleEntries[0].format).to.equal("image/jpeg");
        });
    });

    describe("service unavailable", () => {
        it("should return serviceUnavailable:true when the axios request throws", async () => {
            axios.get.rejects(new Error("Network Error"));

            const result = await handleWmtsFromCsw("https://example.com/wmts");

            expect(result.serviceUnavailable).to.be.true;
            expect(result.layersAdded).to.be.false;
            expect(result.layerTitleEntries).to.deep.equal([]);
            expect(result.capabilitiesUrl).to.include("SERVICE=WMTS");
        });
    });
});
