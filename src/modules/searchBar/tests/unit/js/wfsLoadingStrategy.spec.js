import {expect} from "chai";
import sinon from "sinon";
import axios from "axios";
import {createWfsLoadingStrategyService, WFS_LARGE_LAYER_THRESHOLD} from "../../../js/wfsLoadingStrategy.js";

const gmdNs = "http://www.isotc211.org/2005/gmd";
const gcoNs = "http://www.isotc211.org/2005/gco";

/**
 * Builds a CSW record XML string with an optional EX_GeographicBoundingBox.
 * @param {Object} [bbox] Bounding box values.
 * @param {Number} [bbox.west] West bound longitude.
 * @param {Number} [bbox.east] East bound longitude.
 * @param {Number} [bbox.south] South bound latitude.
 * @param {Number} [bbox.north] North bound latitude.
 * @returns {Document} Parsed XML document.
 */
function makeResponseXml (bbox = null) {
    const bboxXml = bbox ? `
        <gmd:EX_GeographicBoundingBox>
            <gmd:westBoundLongitude><gco:Decimal>${bbox.west}</gco:Decimal></gmd:westBoundLongitude>
            <gmd:eastBoundLongitude><gco:Decimal>${bbox.east}</gco:Decimal></gmd:eastBoundLongitude>
            <gmd:southBoundLatitude><gco:Decimal>${bbox.south}</gco:Decimal></gmd:southBoundLatitude>
            <gmd:northBoundLatitude><gco:Decimal>${bbox.north}</gco:Decimal></gmd:northBoundLatitude>
        </gmd:EX_GeographicBoundingBox>` : "";

    const xml = `<?xml version="1.0"?>
<gmd:MD_Metadata xmlns:gmd="${gmdNs}" xmlns:gco="${gcoNs}">
    <gmd:identificationInfo>${bboxXml}</gmd:identificationInfo>
</gmd:MD_Metadata>`;

    return new DOMParser().parseFromString(xml, "application/xml");
}

/**
 * Builds a WFS FeatureCollection hits response XML string.
 * @param {Number} count Feature count.
 * @param {String} [attr="numberOfFeatures"] Attribute name to use.
 * @returns {Document} Parsed XML document.
 */
function makeHitsXml (count, attr = "numberOfFeatures") {
    const xml = `<?xml version="1.0"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs"
    ${attr}="${count}" timeStamp="2026-01-01"/>`;

    return new DOMParser().parseFromString(xml, "application/xml");
}

describe("src/modules/searchBar/js/wfsLoadingStrategy.js", () => {
    let dispatch, mapCollectionMock;

    beforeEach(() => {
        dispatch = sinon.stub().resolves();
        mapCollectionMock = {
            getMap: sinon.stub().returns({
                getView: () => ({
                    getProjection: () => ({getCode: () => "EPSG:4326"})
                })
            })
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("WFS_LARGE_LAYER_THRESHOLD", () => {
        it("should export the threshold constant with value 1000", () => {
            expect(WFS_LARGE_LAYER_THRESHOLD).to.equal(1000);
        });
    });

    describe("getWfsHits", () => {
        it("should return feature count from numberOfFeatures attribute", async () => {
            const hitsDoc = makeHitsXml(500, "numberOfFeatures");

            sinon.stub(axios, "get").resolves({
                data: "",
                request: {responseXML: hitsDoc}
            });

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const count = await service.getWfsHits("ns:buildings");

            expect(count).to.equal(500);
        });

        it("should return feature count from numberMatched attribute (WFS 2.0)", async () => {
            const hitsDoc = makeHitsXml(2500, "numberMatched");

            sinon.stub(axios, "get").resolves({
                data: "",
                request: {responseXML: hitsDoc}
            });

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "2.0.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const count = await service.getWfsHits("ns:roads");

            expect(count).to.equal(2500);
        });

        it("should return null when axios throws", async () => {
            sinon.stub(axios, "get").rejects(new Error("Network error"));

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const count = await service.getWfsHits("ns:buildings");

            expect(count).to.be.null;
        });

        it("should return null when hits attribute is missing", async () => {
            const xml = `<?xml version="1.0"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" timeStamp="2026-01-01"/>`;
            const doc = new DOMParser().parseFromString(xml, "application/xml");

            sinon.stub(axios, "get").resolves({data: "", request: {responseXML: doc}});

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const count = await service.getWfsHits("ns:buildings");

            expect(count).to.be.null;
        });
    });

    describe("alertLargeLayer", () => {
        it("should dispatch an info alert for a single large layer", () => {
            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            service.alertLargeLayer({featureCount: 5000, layerName: "buildings"});

            const alertCall = dispatch.getCalls().find(c => c.args[0] === "Alerting/addSingleAlert");

            expect(alertCall).to.exist;
            expect(alertCall.args[1].category).to.equal("info");
        });

        it("should dispatch a zoom action when bounding box is present in record XML", () => {
            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml({west: 9.0, east: 10.0, south: 53.0, north: 54.0}),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            service.alertLargeLayer({featureCount: 5000, layerName: "buildings"});

            const zoomCall = dispatch.getCalls().find(c => c.args[0] === "Maps/zoomToCoordinates");

            expect(zoomCall).to.exist;
            expect(zoomCall.args[1]).to.have.property("zoom", 7);
        });

        it("should zoom only once even when called multiple times", () => {
            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml({west: 9.0, east: 10.0, south: 53.0, north: 54.0}),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            service.alertLargeLayer({featureCount: 5000, layerName: "buildings"});
            service.alertLargeLayer({featureCount: 3000, layerName: "roads"});

            const zoomCalls = dispatch.getCalls().filter(c => c.args[0] === "Maps/zoomToCoordinates");

            expect(zoomCalls).to.have.length(1);
        });

        it("should not zoom when bounding box is absent from record XML", () => {
            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            service.alertLargeLayer({featureCount: 5000, layerName: "buildings"});

            const zoomCall = dispatch.getCalls().find(c => c.args[0] === "Maps/zoomToCoordinates");

            expect(zoomCall).to.not.exist;
        });
    });

    describe("applyDiscoveredWfsLoadingStrategies", () => {
        it("should set loadingStrategy:all for small layers (count <= threshold)", async () => {
            const hitsDoc = makeHitsXml(100);

            sinon.stub(axios, "get").resolves({data: "", request: {responseXML: hitsDoc}});

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const entries = [{name: "Small Layer", sourceProps: {featureType: "ns:small"}}];

            await service.applyDiscoveredWfsLoadingStrategies(entries);

            expect(entries[0].sourceProps.loadingStrategy).to.equal("all");
        });

        it("should set loadingStrategy:bbox for large layers (count > threshold)", async () => {
            const hitsDoc = makeHitsXml(5000);

            sinon.stub(axios, "get").resolves({data: "", request: {responseXML: hitsDoc}});

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const entries = [{name: "Large Layer", sourceProps: {featureType: "ns:large"}}];

            await service.applyDiscoveredWfsLoadingStrategies(entries);

            expect(entries[0].sourceProps.loadingStrategy).to.equal("bbox");
        });

        it("should set loadingStrategy:all when hits request returns null", async () => {
            sinon.stub(axios, "get").rejects(new Error("Network error"));

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const entries = [{name: "Unknown Size", sourceProps: {featureType: "ns:unknown"}}];

            await service.applyDiscoveredWfsLoadingStrategies(entries);

            expect(entries[0].sourceProps.loadingStrategy).to.equal("all");
        });

        it("should skip entries without a featureType in sourceProps", async () => {
            sinon.stub(axios, "get");

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const entries = [{name: "No Type", sourceProps: {}}];

            await service.applyDiscoveredWfsLoadingStrategies(entries);

            expect(axios.get.called).to.be.false;
            expect(entries[0].sourceProps.loadingStrategy).to.be.undefined;
        });

        it("should dispatch a single alert for multiple large layers", async () => {
            const hitsDoc = makeHitsXml(2000);

            sinon.stub(axios, "get").resolves({data: "", request: {responseXML: hitsDoc}});

            const service = createWfsLoadingStrategyService({
                baseUrl: "https://example.com/wfs",
                wfsVersion: "1.1.0",
                responseXml: makeResponseXml(),
                gmdNs,
                gcoNs,
                mapCollection: mapCollectionMock,
                dispatch
            });

            const entries = [
                {name: "Layer A", sourceProps: {featureType: "ns:layerA"}},
                {name: "Layer B", sourceProps: {featureType: "ns:layerB"}}
            ];

            await service.applyDiscoveredWfsLoadingStrategies(entries);

            const alertCalls = dispatch.getCalls().filter(c => c.args[0] === "Alerting/addSingleAlert");

            expect(alertCalls).to.have.length(1);
        });
    });
});
