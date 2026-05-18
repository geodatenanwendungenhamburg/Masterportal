import {expect} from "chai";
import getCswRecords from "../../getCswRecords.js";

const {buildGetRecordsXml, parseGetRecordsResponse} = getCswRecords,
    gmdNs = "http://www.isotc211.org/2005/gmd",
    gcoNs = "http://www.isotc211.org/2005/gco";

/**
 * Builds a CSW GetRecordsResponse XML string for testing.
 * @param {object} searchResultsAttrs - Attributes for the SearchResults element.
 * @param {string} records - XML string of record elements.
 * @returns {string} The XML string.
 */
function buildXml (searchResultsAttrs, records) {
    const attrs = Object.entries(searchResultsAttrs).map(([k, v]) => `${k}="${v}"`).join(" ");

    return `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
  <csw:SearchResults ${attrs}>
    ${records}
  </csw:SearchResults>
</csw:GetRecordsResponse>`;
}

/**
 * Builds a gmd:MD_Metadata XML record string for testing.
 * @param {object} opts - Record options.
 * @param {string} [opts.fileIdentifier=""] - The file identifier.
 * @param {string} [opts.title=""] - The record title.
 * @param {string} [opts.abstract=""] - The record abstract.
 * @param {object|null} [opts.bbox=null] - Bounding box with west/east/south/north.
 * @returns {string} The XML string.
 */
function buildRecord ({fileIdentifier = "", title = "", abstract = "", bbox = null}) {
    const bboxXml = bbox ? `
        <${gmdNs.split("/").pop()}:extent xmlns:gmd="${gmdNs}">
          <gmd:EX_Extent xmlns:gmd="${gmdNs}">
            <gmd:geographicElement>
              <gmd:EX_GeographicBoundingBox xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
                <gmd:westBoundLongitude><gco:Decimal>${bbox.west}</gco:Decimal></gmd:westBoundLongitude>
                <gmd:eastBoundLongitude><gco:Decimal>${bbox.east}</gco:Decimal></gmd:eastBoundLongitude>
                <gmd:southBoundLatitude><gco:Decimal>${bbox.south}</gco:Decimal></gmd:southBoundLatitude>
                <gmd:northBoundLatitude><gco:Decimal>${bbox.north}</gco:Decimal></gmd:northBoundLatitude>
              </gmd:EX_GeographicBoundingBox>
            </gmd:geographicElement>
          </gmd:EX_Extent>
        </gmd:extent>` : "";

    return `<gmd:MD_Metadata xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
      <gmd:fileIdentifier><gco:CharacterString>${fileIdentifier}</gco:CharacterString></gmd:fileIdentifier>
      <gmd:identificationInfo>
        <gmd:MD_DataIdentification>
          <gmd:citation>
            <gmd:CI_Citation>
              <gmd:title><gco:CharacterString>${title}</gco:CharacterString></gmd:title>
            </gmd:CI_Citation>
          </gmd:citation>
          <gmd:abstract><gco:CharacterString>${abstract}</gco:CharacterString></gmd:abstract>
          ${bboxXml}
        </gmd:MD_DataIdentification>
      </gmd:identificationInfo>
    </gmd:MD_Metadata>`;
}

describe("src/shared/js/api/getCswRecords.js", () => {
    describe("buildGetRecordsXml", () => {
        describe("CSW 2.0.2", () => {
            it("should build a valid CSW 2.0.2 GetRecords XML with defaults", () => {
                const xml = buildGetRecordsXml("Hamburger Straßen");

                expect(xml).to.include("xmlns:csw=\"http://www.opengis.net/cat/csw/2.0.2\"");
                expect(xml).to.include("xmlns:ogc=\"http://www.opengis.net/ogc\"");
                expect(xml).to.include("version=\"2.0.2\"");
                expect(xml).to.include("maxRecords=\"10\"");
                expect(xml).to.include("startPosition=\"1\"");
                expect(xml).to.include("<csw:ElementSetName>summary</csw:ElementSetName>");
                expect(xml).to.include("<ogc:PropertyName>AnyText</ogc:PropertyName>");
                expect(xml).to.include("<ogc:Literal>*Hamburger Stra&#xdf;en*</ogc:Literal>");
                expect(xml).to.include("wildCard=\"*\"");
                expect(xml).to.include("outputSchema=\"http://www.isotc211.org/2005/gmd\"");
            });

            it("should respect maxRecords, startPosition and elementSetName options", () => {
                const xml = buildGetRecordsXml("test", {maxRecords: 20, startPosition: 11, elementSetName: "full"});

                expect(xml).to.include("maxRecords=\"20\"");
                expect(xml).to.include("startPosition=\"11\"");
                expect(xml).to.include("<csw:ElementSetName>full</csw:ElementSetName>");
            });

            it("should escape XML special characters in search input", () => {
                const xml = buildGetRecordsXml("O'Brien & <Co>");

                expect(xml).to.include("&amp;");
                expect(xml).to.include("&lt;");
                expect(xml).to.include("&gt;");
                expect(xml).to.include("&apos;");
            });

            it("should encode non-ASCII characters as XML numeric character references", () => {
                const xml = buildGetRecordsXml("Schleifmühle");

                expect(xml).to.not.include("ü");
                expect(xml).to.include("&#xfc;");
            });

            it("should not include fes namespace for CSW 2.0.2", () => {
                const xml = buildGetRecordsXml("test");

                expect(xml).to.not.include("fes:");
            });
        });

        describe("CSW 3.0", () => {
            it("should build a valid CSW 3.0 GetRecords XML", () => {
                const xml = buildGetRecordsXml("Hamburg", {version: "3.0"});

                expect(xml).to.include("xmlns:csw=\"http://www.opengis.net/cat/csw/3.0\"");
                expect(xml).to.include("xmlns:fes=\"http://www.opengis.net/fes/2.0\"");
                expect(xml).to.include("version=\"3.0.0\"");
                expect(xml).to.include("<fes:ValueReference>anyText</fes:ValueReference>");
                expect(xml).to.include("<fes:Literal>*Hamburg*</fes:Literal>");
            });

            it("should not include ogc namespace for CSW 3.0", () => {
                const xml = buildGetRecordsXml("test", {version: "3.0"});

                expect(xml).to.not.include("ogc:");
            });
        });

        it("should fall back to CSW 2.0.2 for unknown version", () => {
            const xml = buildGetRecordsXml("test", {version: "unknown"});

            expect(xml).to.include("version=\"2.0.2\"");
            expect(xml).to.include("<ogc:PropertyName>AnyText</ogc:PropertyName>");
            expect(xml).to.include("<ogc:Literal>*test*</ogc:Literal>");
        });

        it("should wrap filter in ogc:And with a single serviceTypeFilter entry", () => {
            const xml = buildGetRecordsXml("test", {serviceTypeFilter: ["view"]});

            expect(xml).to.include("<ogc:And>");
            expect(xml).to.include("<ogc:PropertyIsEqualTo>");
            expect(xml).to.include("<ogc:PropertyName>ServiceType</ogc:PropertyName>");
            expect(xml).to.include("<ogc:Literal>view</ogc:Literal>");
            expect(xml).to.include("</ogc:And>");
            expect(xml).not.to.include("<ogc:Or>");
        });

        it("should wrap filter in ogc:And+ogc:Or with multiple serviceTypeFilter entries", () => {
            const xml = buildGetRecordsXml("test", {serviceTypeFilter: ["view", "download"]});

            expect(xml).to.include("<ogc:And>");
            expect(xml).to.include("<ogc:Or>");
            expect(xml).to.include("<ogc:Literal>view</ogc:Literal>");
            expect(xml).to.include("<ogc:Literal>download</ogc:Literal>");
            expect(xml).to.include("</ogc:Or>");
            expect(xml).to.include("</ogc:And>");
        });

        it("should not add ogc:And when serviceTypeFilter is null", () => {
            const xml = buildGetRecordsXml("test", {serviceTypeFilter: null});

            expect(xml).not.to.include("<ogc:And>");
            expect(xml).not.to.include("ServiceType");
        });

        it("should not add ogc:And when serviceTypeFilter is an empty array", () => {
            const xml = buildGetRecordsXml("test", {serviceTypeFilter: []});

            expect(xml).not.to.include("<ogc:And>");
            expect(xml).not.to.include("ServiceType");
        });
    });

    describe("parseGetRecordsResponse", () => {
        it("should parse numberOfRecordsMatched and numberOfRecordsReturned correctly", () => {
            const xml = buildXml({numberOfRecordsMatched: "42", numberOfRecordsReturned: "10", nextRecord: "11"}, ""),
                result = parseGetRecordsResponse(xml);

            expect(result.numberOfRecordsMatched).to.equal(42);
            expect(result.numberOfRecordsReturned).to.equal(10);
            expect(result.nextRecord).to.equal(11);
        });

        it("should parse a record with title, abstract and fileIdentifier", () => {
            const xml = buildXml(
                    {numberOfRecordsMatched: "1", numberOfRecordsReturned: "1", nextRecord: "0"},
                    buildRecord({fileIdentifier: "abc-123", title: "Test Layer", abstract: "A test abstract"})
                ),
                result = parseGetRecordsResponse(xml);

            expect(result.records).to.have.lengthOf(1);
            expect(result.records[0].fileIdentifier).to.equal("abc-123");
            expect(result.records[0].title).to.equal("Test Layer");
            expect(result.records[0].abstract).to.equal("A test abstract");
        });

        it("should parse the bounding box when present", () => {
            const xml = buildXml(
                    {numberOfRecordsMatched: "1", numberOfRecordsReturned: "1", nextRecord: "0"},
                    buildRecord({fileIdentifier: "xyz", title: "BBox Layer", bbox: {west: 8.0, east: 15.0, south: 47.0, north: 55.0}})
                ),
                result = parseGetRecordsResponse(xml);

            expect(result.records[0].boundingBox).to.deep.equal({west: 8.0, east: 15.0, south: 47.0, north: 55.0});
        });

        it("should return null boundingBox when bounding box is absent", () => {
            const xml = buildXml(
                    {numberOfRecordsMatched: "1", numberOfRecordsReturned: "1", nextRecord: "0"},
                    buildRecord({fileIdentifier: "no-bbox", title: "No BBox"})
                ),
                result = parseGetRecordsResponse(xml);

            expect(result.records[0].boundingBox).to.be.null;
        });

        it("should return empty records array when no MD_Metadata elements are present", () => {
            const xml = buildXml({numberOfRecordsMatched: "0", numberOfRecordsReturned: "0", nextRecord: "0"}, ""),
                result = parseGetRecordsResponse(xml);

            expect(result.records).to.deep.equal([]);
            expect(result.numberOfRecordsMatched).to.equal(0);
        });

        it("should return empty result and warn when XML is invalid", () => {
            const result = parseGetRecordsResponse("this is not xml at all <>");

            expect(result.records).to.deep.equal([]);
            expect(result.numberOfRecordsMatched).to.equal(0);
        });

        it("should return empty result and warn when SearchResults element is missing", () => {
            const result = parseGetRecordsResponse("<?xml version=\"1.0\"?><root><SomethingElse/></root>");

            expect(result.records).to.deep.equal([]);
            expect(result.numberOfRecordsMatched).to.equal(0);
        });
    });
});
