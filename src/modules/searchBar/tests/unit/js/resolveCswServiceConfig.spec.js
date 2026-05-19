import {expect} from "chai";
import sinon from "sinon";
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
});
