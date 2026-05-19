import {expect} from "chai";
import parseCswOnlineResource from "../../../js/parseCswOnlineResource.js";

/**
 * Builds a minimal gmd:CI_OnlineResource DOM element for testing.
 * @param {Object} options Options for the element.
 * @param {String} [options.url] URL value.
 * @param {String} [options.layerName] Layer name value.
 * @param {String} [options.protocolCharString] Protocol as gco:CharacterString.
 * @param {Object} [options.protocolAnchor] Protocol as gmx:Anchor: {href, text}.
 * @returns {Element} gmd:CI_OnlineResource DOM element.
 */
function buildOnlineResource ({url = "", layerName = "", protocolCharString = null, protocolAnchor = null} = {}) {
    const gmdNs = "http://www.isotc211.org/2005/gmd",
        gcoNs = "http://www.isotc211.org/2005/gco",
        gmxNs = "http://www.isotc211.org/2005/gmx",
        doc = document.implementation.createDocument("", "", null),
        root = doc.createElementNS(gmdNs, "gmd:CI_OnlineResource");

    // <gmd:linkage><gmd:URL>
    if (url) {
        const linkage = doc.createElementNS(gmdNs, "gmd:linkage"),
            urlEl = doc.createElementNS(gmdNs, "gmd:URL");

        urlEl.textContent = url;
        linkage.appendChild(urlEl);
        root.appendChild(linkage);
    }

    // <gmd:protocol>
    if (protocolCharString !== null) {
        const protocolEl = doc.createElementNS(gmdNs, "gmd:protocol"),
            charString = doc.createElementNS(gcoNs, "gco:CharacterString");

        charString.textContent = protocolCharString;
        protocolEl.appendChild(charString);
        root.appendChild(protocolEl);
    }
    else if (protocolAnchor !== null) {
        const protocolEl = doc.createElementNS(gmdNs, "gmd:protocol"),
            anchor = doc.createElementNS(gmxNs, "gmx:Anchor");

        anchor.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", protocolAnchor.href || "");
        anchor.textContent = protocolAnchor.text || "";
        protocolEl.appendChild(anchor);
        root.appendChild(protocolEl);
    }

    // <gmd:name><gco:CharacterString>
    if (layerName) {
        const nameEl = doc.createElementNS(gmdNs, "gmd:name"),
            charString = doc.createElementNS(gcoNs, "gco:CharacterString");

        charString.textContent = layerName;
        nameEl.appendChild(charString);
        root.appendChild(nameEl);
    }

    return root;
}

describe("src/modules/searchBar/js/parseCswOnlineResource.js", () => {
    describe("protocol", () => {
        it("should read protocol from gco:CharacterString", () => {
            const el = buildOnlineResource({protocolCharString: "OGC:WMS"});

            expect(parseCswOnlineResource(el).protocol).to.equal("OGC:WMS");
        });

        it("should read protocol from gmx:Anchor xlink:href", () => {
            const el = buildOnlineResource({protocolAnchor: {href: "OGC:WMS", text: ""}});

            expect(parseCswOnlineResource(el).protocol).to.equal("OGC:WMS");
        });

        it("should combine gmx:Anchor xlink:href and text content", () => {
            const el = buildOnlineResource({protocolAnchor: {href: "serviceType/ogc/wms", text: "WMS"}});

            expect(parseCswOnlineResource(el).protocol).to.equal("serviceType/ogc/wms WMS");
        });

        it("should prefer gco:CharacterString over gmx:Anchor when both are present", () => {
            // Build manually to have both children
            const gmdNs = "http://www.isotc211.org/2005/gmd",
                gcoNs = "http://www.isotc211.org/2005/gco",
                gmxNs = "http://www.isotc211.org/2005/gmx",
                doc = document.implementation.createDocument("", "", null),
                root = doc.createElementNS(gmdNs, "gmd:CI_OnlineResource"),
                protocolEl = doc.createElementNS(gmdNs, "gmd:protocol"),
                charString = doc.createElementNS(gcoNs, "gco:CharacterString"),
                anchor = doc.createElementNS(gmxNs, "gmx:Anchor");

            charString.textContent = "OGC:WMS";
            anchor.textContent = "OGC:WFS";
            protocolEl.appendChild(charString);
            protocolEl.appendChild(anchor);
            root.appendChild(protocolEl);
            expect(parseCswOnlineResource(root).protocol).to.equal("OGC:WMS");
        });

        it("should return empty string when no protocol element is present", () => {
            const el = buildOnlineResource({url: "https://example.com/wms"});

            expect(parseCswOnlineResource(el).protocol).to.equal("");
        });
    });

    describe("url and baseUrl", () => {
        it("should parse url and strip query string for baseUrl", () => {
            const el = buildOnlineResource({url: "https://example.com/wms?SERVICE=WMS&REQUEST=GetCapabilities"});
            const result = parseCswOnlineResource(el);

            expect(result.url).to.equal("https://example.com/wms?SERVICE=WMS&REQUEST=GetCapabilities");
            expect(result.baseUrl).to.equal("https://example.com/wms");
        });

        it("should return empty url and baseUrl when linkage is absent", () => {
            const el = buildOnlineResource({protocolCharString: "OGC:WMS"});
            const result = parseCswOnlineResource(el);

            expect(result.url).to.equal("");
            expect(result.baseUrl).to.equal("");
        });
    });

    describe("layerName and urlLayerParam", () => {
        it("should read layerName from gmd:name/gco:CharacterString", () => {
            const el = buildOnlineResource({layerName: "my_layer"});

            expect(parseCswOnlineResource(el).layerName).to.equal("my_layer");
        });

        it("should extract LAYERS param from URL into urlLayerParam", () => {
            const el = buildOnlineResource({url: "https://example.com/wms?LAYERS=roads&FORMAT=image/png"});

            expect(parseCswOnlineResource(el).urlLayerParam).to.equal("roads");
        });

        it("should return empty layerName and urlLayerParam when absent", () => {
            const el = buildOnlineResource({url: "https://example.com/wms"});
            const result = parseCswOnlineResource(el);

            expect(result.layerName).to.equal("");
            expect(result.urlLayerParam).to.equal("");
        });
    });
});
