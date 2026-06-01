import {expect} from "chai";
import sinon from "sinon";
import axios from "axios";
import handleWfsFromCsw from "../../../js/handleWfsFromCsw.js";

/**
 * Builds a minimal WFS GetCapabilities XML string.
 * @param {Object} opts Options.
 * @param {String} opts.version WFS version attribute on root element.
 * @param {String} opts.serviceTitle Service title in ServiceIdentification.
 * @param {Object[]} opts.featureTypes Array of {name, title, namespace} objects.
 * @param {String[]} opts.outputFormats Output formats list.
 * @returns {String} XML capabilities string.
 */
function buildWfsCapXml ({version = "1.1.0", serviceTitle = "", featureTypes = [], outputFormats = ["XML"]} = {}) {
    const ftXml = featureTypes.map(ft => `
        <FeatureType>
            <Name${ft.namespace ? ` xmlns:ns="${ft.namespace}"` : ""}>${ft.name}</Name>
            <Title>${ft.title || ft.name}</Title>
        </FeatureType>`).join("");

    const formatsXml = outputFormats.map(f => `<Format>${f}</Format>`).join("");

    return `<?xml version="1.0"?>
<WFS_Capabilities version="${version}"
    xmlns="http://www.opengis.net/wfs"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ServiceIdentification><Title>${serviceTitle}</Title></ServiceIdentification>
    <FeatureTypeList>${ftXml}</FeatureTypeList>
    <OperationsMetadata>
        <Operation name="GetFeature">
            <Parameter name="outputFormat">${formatsXml}</Parameter>
        </Operation>
    </OperationsMetadata>
</WFS_Capabilities>`;
}

describe("src/modules/searchBar/js/handleWfsFromCsw.js", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("successful discovery", () => {
        it("should parse namespaced WFS capabilities with prefixed FeatureType and output format values", async () => {
            const xml = `<?xml version="1.0"?>
<wfs:WFS_Capabilities version="2.0.0"
    xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:ows="http://www.opengis.net/ows/1.1">
    <ows:ServiceIdentification><ows:Title>Namespaced WFS</ows:Title></ows:ServiceIdentification>
    <wfs:FeatureTypeList>
        <wfs:FeatureType>
            <wfs:Name xmlns:ns="https://example.com/ns">ns:roads</wfs:Name>
            <wfs:Title>Roads</wfs:Title>
        </wfs:FeatureType>
    </wfs:FeatureTypeList>
    <ows:OperationsMetadata>
        <ows:Operation name="GetFeature">
            <ows:Parameter name="outputFormat">
                <ows:AllowedValues>
                    <ows:Value>application/gml+xml; version=3.2</ows:Value>
                </ows:AllowedValues>
            </ows:Parameter>
        </ows:Operation>
    </ows:OperationsMetadata>
</wfs:WFS_Capabilities>`;

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.serviceTitle).to.equal("Namespaced WFS");
            expect(result.wfsVersion).to.equal("2.0.0");
            expect(result.wfsOutputFormat).to.equal("application/gml+xml; version=3.2");
            expect(result.featureTypes).to.have.length(1);
            expect(result.featureTypes[0].name).to.equal("ns:roads");
            expect(result.featureTypes[0].title).to.equal("Roads");
            expect(result.serviceUnavailable).to.be.false;
        });

        it("should return featureTypes with name and serviceTitle", async () => {
            const xml = buildWfsCapXml({
                version: "1.1.0",
                serviceTitle: "My WFS",
                featureTypes: [{name: "ns:roads", title: "Roads"}]
            });

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.serviceTitle).to.equal("My WFS");
            expect(result.featureTypes).to.have.length(1);
            expect(result.featureTypes[0].name).to.equal("ns:roads");
            expect(result.featureTypes[0].title).to.equal("Roads");
            expect(result.serviceUnavailable).to.be.false;
        });

        it("should use declared version from capabilities response", async () => {
            const xml = buildWfsCapXml({version: "2.0.0", featureTypes: [{name: "buildings", title: "Buildings"}]});

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.wfsVersion).to.equal("2.0.0");
        });

        it("should prefer GML32 format over plain XML when available", async () => {
            const xml = buildWfsCapXml({
                featureTypes: [{name: "layer", title: "Layer"}],
                outputFormats: ["XML", "GML32", "application/gml+xml; version=3.2"]
            });

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.wfsOutputFormat).to.equal("application/gml+xml; version=3.2");
        });

        it("should deduplicate feature types with the same name", async () => {
            const xml = buildWfsCapXml({
                featureTypes: [
                    {name: "ns:roads", title: "Roads"},
                    {name: "ns:roads", title: "Roads (duplicate)"}
                ]
            });

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.featureTypes).to.have.length(1);
        });

        it("should skip feature types without a name", async () => {
            const xml = buildWfsCapXml({
                featureTypes: [
                    {name: "", title: "Empty name"},
                    {name: "valid_layer", title: "Valid"}
                ]
            });

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.featureTypes).to.have.length(1);
            expect(result.featureTypes[0].name).to.equal("valid_layer");
        });

        it("should also populate featureTypeTitles", async () => {
            const xml = buildWfsCapXml({
                featureTypes: [{name: "buildings", title: "Buildings"}]
            });

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.featureTypeTitles).to.deep.include({name: "buildings", title: "Buildings"});
        });
    });

    describe("version fallback", () => {
        it("should return empty featureTypes and serviceUnavailable:true when all versions fail", async () => {
            sinon.stub(axios, "get").rejects(new Error("Connection refused"));

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.featureTypes).to.deep.equal([]);
            expect(result.serviceUnavailable).to.be.true;
        });

        it("should try next version when first call fails", async () => {
            const xml = buildWfsCapXml({
                version: "1.1.0",
                featureTypes: [{name: "parcels", title: "Parcels"}]
            });
            const stub = sinon.stub(axios, "get");

            stub.onFirstCall().rejects(new Error("2.0.0 not supported"));
            stub.onSecondCall().resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.featureTypes).to.have.length(1);
            expect(result.wfsVersion).to.equal("1.1.0");
            expect(stub.callCount).to.equal(2);
        });
    });

    describe("empty capabilities", () => {
        it("should return empty featureTypes when no FeatureType elements found", async () => {
            const xml = `<?xml version="1.0"?>
<WFS_Capabilities version="1.1.0" xmlns="http://www.opengis.net/wfs">
    <FeatureTypeList></FeatureTypeList>
</WFS_Capabilities>`;

            sinon.stub(axios, "get").resolves({
                data: xml,
                request: {responseXML: new DOMParser().parseFromString(xml, "application/xml")}
            });

            // All three version attempts return empty caps → falls through to final return
            const result = await handleWfsFromCsw("https://example.com/wfs");

            expect(result.featureTypes).to.deep.equal([]);
        });
    });
});
