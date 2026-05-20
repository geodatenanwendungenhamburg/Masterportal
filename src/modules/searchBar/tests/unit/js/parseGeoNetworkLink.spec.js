import {expect} from "chai";
import sinon from "sinon";
import * as detectServiceTypeModule from "../../../js/detectServiceType.js";
import parseGeoNetworkLink from "../../../js/parseGeoNetworkLink.js";

describe("src/modules/searchBar/js/parseGeoNetworkLink.js", () => {
    let detectStub;

    beforeEach(() => {
        detectStub = sinon.stub(detectServiceTypeModule, "default");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should return null for a null input", () => {
        expect(parseGeoNetworkLink(null)).to.be.null;
    });

    it("should return null for a link without a url", () => {
        detectStub.returns(null);
        expect(parseGeoNetworkLink({protocol: "OGC:WMS", url: ""})).to.be.null;
    });

    it("should return null when detectServiceType returns null", () => {
        detectStub.returns(null);
        const result = parseGeoNetworkLink({protocol: "ATOM", url: "https://example.com/download"});

        expect(result).to.be.null;
    });

    it("should return a parsedResource for a WMS link", () => {
        detectStub.returns("WMS");
        const result = parseGeoNetworkLink({
            protocol: "OGC:WMS",
            url: "https://example.com/wms",
            name: "my_layer"
        });

        expect(result).to.deep.equal({
            protocol: "OGC:WMS",
            url: "https://example.com/wms",
            layerName: "my_layer",
            urlLayerParam: "",
            baseUrl: "https://example.com/wms"
        });
    });

    it("should return a parsedResource for a WFS link", () => {
        detectStub.returns("WFS");
        const result = parseGeoNetworkLink({
            protocol: "OGC:WFS",
            url: "https://example.com/wfs",
            name: "ns:FeatureType"
        });

        expect(result).to.deep.equal({
            protocol: "OGC:WFS",
            url: "https://example.com/wfs",
            layerName: "ns:FeatureType",
            urlLayerParam: "",
            baseUrl: "https://example.com/wfs"
        });
    });

    it("should extract LAYERS query param as urlLayerParam", () => {
        detectStub.returns("WMS");
        const result = parseGeoNetworkLink({
            protocol: "OGC:WMS",
            url: "https://example.com/wms?LAYERS=roads&STYLES=",
            name: ""
        });

        expect(result.urlLayerParam).to.equal("roads");
        expect(result.baseUrl).to.equal("https://example.com/wms");
    });

    it("should use empty string for layerName when link.name is absent", () => {
        detectStub.returns("WMS");
        const result = parseGeoNetworkLink({
            protocol: "OGC:WMS",
            url: "https://example.com/wms"
        });

        expect(result.layerName).to.equal("");
    });
});
