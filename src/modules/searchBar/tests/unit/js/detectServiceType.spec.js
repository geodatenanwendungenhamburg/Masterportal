import {expect} from "chai";
import detectServiceType from "../../../js/detectServiceType.js";

describe("src/modules/searchBar/js/detectServiceType.js", () => {
    describe("WMS detection via protocol", () => {
        it("should detect WMS from OGC:WMS protocol", () => {
            expect(detectServiceType("OGC:WMS", "")).to.equal("WMS");
        });

        it("should detect WMS from WWW:LINK-1.0-http--ogc-wms protocol", () => {
            expect(detectServiceType("WWW:LINK-1.0-http--ogc-wms", "")).to.equal("WMS");
        });

        it("should detect WMS from 'OGC Web Map Service' protocol", () => {
            expect(detectServiceType("OGC Web Map Service", "")).to.equal("WMS");
        });

        it("should detect WMS from 'serviceType/ogc/wms' protocol", () => {
            expect(detectServiceType("serviceType/ogc/wms", "")).to.equal("WMS");
        });

        it("should be case-insensitive for protocol matching", () => {
            expect(detectServiceType("ogc:wms", "")).to.equal("WMS");
            expect(detectServiceType("Ogc Web Map Service", "")).to.equal("WMS");
        });
    });

    describe("WFS detection via protocol", () => {
        it("should detect WFS from OGC:WFS protocol", () => {
            expect(detectServiceType("OGC:WFS", "")).to.equal("WFS");
        });

        it("should detect WFS from WWW:LINK-1.0-http--ogc-wfs protocol", () => {
            expect(detectServiceType("WWW:LINK-1.0-http--ogc-wfs", "")).to.equal("WFS");
        });

        it("should detect WFS from 'OGC Web Feature Service' protocol", () => {
            expect(detectServiceType("OGC Web Feature Service", "")).to.equal("WFS");
        });

        it("should detect WFS from 'serviceType/ogc/wfs' protocol", () => {
            expect(detectServiceType("serviceType/ogc/wfs", "")).to.equal("WFS");
        });
    });

    describe("WMS detection via URL hint", () => {
        it("should detect WMS from SERVICE=WMS in URL", () => {
            expect(detectServiceType("", "https://example.com/ows?SERVICE=WMS&REQUEST=GetCapabilities")).to.equal("WMS");
        });

        it("should detect WMS from /WMS in URL path", () => {
            expect(detectServiceType("", "https://example.com/path/WMS/service")).to.equal("WMS");
        });

        it("should detect WMS from _WMS in URL", () => {
            expect(detectServiceType("", "https://example.com/my_WMS_service")).to.equal("WMS");
        });

        it("should detect WMS from WMS_ in URL", () => {
            expect(detectServiceType("", "https://example.com/WMS_endpoint")).to.equal("WMS");
        });
    });

    describe("WFS detection via URL hint", () => {
        it("should detect WFS from SERVICE=WFS in URL", () => {
            expect(detectServiceType("", "https://example.com/ows?SERVICE=WFS")).to.equal("WFS");
        });

        it("should detect WFS from /WFS in URL path", () => {
            expect(detectServiceType("", "https://example.com/path/WFS/service")).to.equal("WFS");
        });

        it("should detect WFS from _WFS in URL", () => {
            expect(detectServiceType("", "https://example.com/my_WFS_service")).to.equal("WFS");
        });

        it("should detect WFS from WFS_ in URL", () => {
            expect(detectServiceType("", "https://example.com/WFS_endpoint")).to.equal("WFS");
        });
    });

    describe("unknown service", () => {
        it("should return null for an unknown protocol and URL", () => {
            expect(detectServiceType("ATOM", "https://example.com/download")).to.be.null;
        });

        it("should return null for empty protocol and URL", () => {
            expect(detectServiceType("", "")).to.be.null;
        });

        it("should return null for null inputs", () => {
            expect(detectServiceType(null, null)).to.be.null;
        });
    });
});
