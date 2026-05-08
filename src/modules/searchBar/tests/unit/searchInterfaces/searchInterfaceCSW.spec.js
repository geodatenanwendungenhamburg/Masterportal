import crs from "@masterportal/masterportalapi/src/crs.js";
import {expect} from "chai";
import sinon from "sinon";

import SearchInterface from "@modules/searchBar/searchInterfaces/searchInterface.js";
import SearchInterfaceCSW from "@modules/searchBar/searchInterfaces/searchInterfaceCSW.js";
import getCswRecords from "@shared/js/api/getCswRecords.js";
import store from "@appstore/index.js";
import {reset} from "@shared/js/utils/uniqueId.js";

describe("src/modules/searchBar/searchInterfaces/searchInterfaceCSW.js", () => {
    let searchInterface,
        checkConfigSpy,
        definition;

    beforeAll(() => {
        checkConfigSpy = sinon.spy(SearchInterface.prototype, "checkConfig");

        store.getters = {
            "Maps/projection": {getCode: () => "EPSG:25832"}
        };

        mapCollection.clear();
        mapCollection.addMap({
            id: "ol",
            mode: "2D",
            getView: () => ({getProjection: () => ({getCode: () => "EPSG:25832"})})
        }, "2D");

        definition = {url: "https://example.com/csw", version: "2.0.2", maxRecords: 5};
        searchInterface = new SearchInterfaceCSW({definitions: [definition]});
    });

    beforeEach(() => {
        reset();
        sinon.stub(crs, "transformToMapProjection").callsFake((map, fromCrs, coords) => coords);
    });

    afterEach(() => {
        searchInterface.clearSearchResults();
        sinon.restore();
    });

    describe("prototype", () => {
        it("should be an instance of SearchInterface", () => {
            expect(searchInterface).to.be.an.instanceof(SearchInterface);
        });

        it("should call checkConfig with supported event names", () => {
            expect(checkConfigSpy.called).to.be.true;
            expect(checkConfigSpy.firstCall.args[1]).to.deep.equal(["showLayerInfo", "zoomToResult", "addLayerFromCswRecord"]);
        });

        it("should set the default resultEvents", () => {
            expect(searchInterface.resultEvents).to.deep.equal({
                onClick: ["addLayerFromCswRecord", "zoomToResult"],
                buttons: ["showLayerInfo"]
            });
        });

        it("should set the default searchInterfaceId to 'csw'", () => {
            expect(searchInterface.searchInterfaceId).to.equal("csw");
        });

        it("should use the provided definitions", () => {
            expect(searchInterface.definitions).to.deep.equal([definition]);
        });

        it("should use 'request' paging type", () => {
            expect(searchInterface.paging).to.equal("request");
        });

        it("should use a custom searchInterfaceId if provided", () => {
            const si = new SearchInterfaceCSW({definitions: [], searchInterfaceId: "csw_bw"});

            expect(si.searchInterfaceId).to.equal("csw_bw");
        });
    });

    describe("buildGetRecordsXml", () => {
        it("should delegate to getCswRecords.buildGetRecordsXml with definition settings", () => {
            const buildSpy = sinon.spy(getCswRecords, "buildGetRecordsXml"),
                result = searchInterface.buildGetRecordsXml(definition, "Hamburg", 1);

            expect(buildSpy.calledOnce).to.be.true;
            expect(buildSpy.firstCall.args[0]).to.equal("Hamburg");
            expect(buildSpy.firstCall.args[1]).to.include({
                version: "2.0.2",
                maxRecords: 5,
                startPosition: 1
            });
            expect(result).to.be.a("string");
            expect(result).to.include("Hamburg");
        });

        it("should use default version and maxRecords when not set in definition", () => {
            const buildSpy = sinon.spy(getCswRecords, "buildGetRecordsXml");

            searchInterface.buildGetRecordsXml({url: "https://example.com/csw"}, "test", 1);
            expect(buildSpy.firstCall.args[1]).to.include({version: "2.0.2", maxRecords: 10});
        });
    });

    describe("normalizeResults", () => {
        it("should normalize an array of records into search result objects", () => {
            const records = [
                    {fileIdentifier: "id-1", title: "Layer One", abstract: "Abstract one", boundingBox: null},
                    {fileIdentifier: "id-2", title: "Layer Two", abstract: "", boundingBox: null}
                ],
                results = searchInterface.normalizeResults(records, definition);

            expect(results).to.have.lengthOf(2);
            expect(results[0].name).to.equal("Layer One");
            expect(results[0].icon).to.equal("bi-list-ul");
            expect(results[1].name).to.equal("Layer Two");
        });

        it("should skip records without a title", () => {
            const records = [
                    {fileIdentifier: "id-1", title: "", abstract: "", boundingBox: null},
                    {fileIdentifier: "id-2", title: "Valid Layer", abstract: "", boundingBox: null}
                ],
                results = searchInterface.normalizeResults(records, definition);

            expect(results).to.have.lengthOf(1);
            expect(results[0].name).to.equal("Valid Layer");
        });

        it("should return empty array for empty input", () => {
            expect(searchInterface.normalizeResults([], definition)).to.deep.equal([]);
        });
    });

    describe("createPossibleActions", () => {
        it("should always include showLayerInfo and addLayerFromCswRecord", () => {
            const record = {fileIdentifier: "meta-123", title: "Test", abstract: "", boundingBox: null},
                actions = searchInterface.createPossibleActions(record, definition);

            expect(actions.showLayerInfo).to.deep.include({layerId: "meta-123"});
            expect(actions.showLayerInfo.source).to.include({metaID: "meta-123", typ: "WMS"});
            expect(actions.showLayerInfo.source.datasets).to.deep.equal([{
                md_id: "meta-123",
                csw_url: definition.url,
                md_name: "Test"
            }]);
            expect(actions.addLayerFromCswRecord).to.deep.equal({
                fileIdentifier: "meta-123",
                recordTitle: "Test",
                cswUrl: definition.url
            });
        });

        it("should include zoomToResult with transformed extent when boundingBox is present", () => {
            const record = {
                    fileIdentifier: "meta-456",
                    title: "BBox Layer",
                    abstract: "",
                    boundingBox: {west: 9.0, east: 10.5, south: 53.0, north: 54.0}
                },
                actions = searchInterface.createPossibleActions(record, definition);

            expect(actions.zoomToResult).to.exist;
            expect(actions.zoomToResult.coordinates).to.have.lengthOf(4);
        });

        it("should not include zoomToResult when boundingBox is null", () => {
            const record = {fileIdentifier: "meta-789", title: "No BBox", abstract: "", boundingBox: null},
                actions = searchInterface.createPossibleActions(record, definition);

            expect(actions.zoomToResult).to.be.undefined;
        });
    });

    describe("search", () => {
        it("should call requestSearch with POST and XML content type for each definition", async () => {
            const requestStub = sinon.stub(SearchInterface.prototype, "requestSearch").resolves(
                    `<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
                      <csw:SearchResults numberOfRecordsMatched="0" numberOfRecordsReturned="0" nextRecord="0"/>
                    </csw:GetRecordsResponse>`
                ),
                si = new SearchInterfaceCSW({definitions: [definition]});

            await si.search("Hamburg");
            expect(requestStub.calledOnce).to.be.true;
            expect(requestStub.firstCall.args[0]).to.equal(definition.url);
            expect(requestStub.firstCall.args[1]).to.equal("POST");
            expect(requestStub.firstCall.args[3]).to.equal("application/xml; charset=UTF-8");
        });

        it("should push normalized hits to searchResults", async () => {
            const gmdNs = "http://www.isotc211.org/2005/gmd",
                gcoNs = "http://www.isotc211.org/2005/gco",
                mockXml = `<?xml version="1.0"?>
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
  <csw:SearchResults numberOfRecordsMatched="1" numberOfRecordsReturned="1" nextRecord="0">
    <gmd:MD_Metadata xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
      <gmd:fileIdentifier><gco:CharacterString>abc-1</gco:CharacterString></gmd:fileIdentifier>
      <gmd:identificationInfo>
        <gmd:MD_DataIdentification>
          <gmd:citation>
            <gmd:CI_Citation>
              <gmd:title><gco:CharacterString>Hamburg Layer</gco:CharacterString></gmd:title>
            </gmd:CI_Citation>
          </gmd:citation>
          <gmd:abstract><gco:CharacterString>An abstract</gco:CharacterString></gmd:abstract>
        </gmd:MD_DataIdentification>
      </gmd:identificationInfo>
    </gmd:MD_Metadata>
  </csw:SearchResults>
</csw:GetRecordsResponse>`;

            sinon.stub(SearchInterface.prototype, "requestSearch").resolves(mockXml);
            reset();

            const si = new SearchInterfaceCSW({definitions: [definition]});

            await si.search("Hamburg");
            expect(si.searchResults).to.have.lengthOf(1);
            expect(si.searchResults[0].name).to.equal("Hamburg Layer");
        });

        it("should log a warning on request failure and continue", async () => {
            const warnSpy = sinon.spy(console, "warn"),
                si = new SearchInterfaceCSW({
                    definitions: [
                        {url: "https://failing.com/csw"},
                        {url: "https://example.com/csw"}
                    ]
                });

            sinon.stub(SearchInterface.prototype, "requestSearch")
                .onFirstCall().rejects(new Error("Network error"))
                .onSecondCall().resolves(
                    `<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">
                      <csw:SearchResults numberOfRecordsMatched="0" numberOfRecordsReturned="0" nextRecord="0"/>
                    </csw:GetRecordsResponse>`
                );

            await si.search("test");
            expect(warnSpy.calledOnce).to.be.true;
            expect(warnSpy.firstCall.args[0]).to.include("SearchInterfaceCSW");
        });
    });
});
