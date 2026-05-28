import {expect} from "chai";
import sinon from "sinon";
import axios from "axios";
import handleOafFromCsw from "../../../js/handleOafFromCsw.js";

describe("src/modules/searchBar/js/handleOafFromCsw.js", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("successful discovery with landing page", () => {
        it("should extract serviceTitle from landing page and collections from /collections link", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {
                    title: "My OAF Service",
                    links: [{rel: "data", href: "https://example.com/oaf/collections"}]
                }})
                .onSecondCall().resolves({data: {
                    collections: [
                        {id: "buildings", title: "Buildings"},
                        {id: "streets", title: "Streets"}
                    ]
                }});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.serviceTitle).to.equal("My OAF Service");
            expect(result.layersAdded).to.be.true;
            expect(result.layerTitleEntries).to.deep.equal([
                {name: "buildings", title: "Buildings"},
                {name: "streets", title: "Streets"}
            ]);
            expect(result.layerNames).to.deep.equal(["buildings", "streets"]);
        });

        it("should resolve collections URL from rel='collections' link", async () => {
            const getStub = sinon.stub(axios, "get");

            getStub.onFirstCall().resolves({data: {
                title: "Service",
                links: [{rel: "collections", href: "https://example.com/oaf/v2/collections"}]
            }});
            getStub.onSecondCall().resolves({data: {
                collections: [{id: "parcels", title: "Parcels"}]
            }});

            await handleOafFromCsw("https://example.com/oaf");

            expect(getStub.secondCall.args[0]).to.equal("https://example.com/oaf/v2/collections");
        });

        it("should fall back to /collections when no rel=data or rel=collections link exists", async () => {
            const getStub = sinon.stub(axios, "get");

            getStub.onFirstCall().resolves({data: {title: "S", links: [{rel: "self", href: "https://example.com/oaf"}]}});
            getStub.onSecondCall().resolves({data: {collections: [{id: "zones", title: "Zones"}]}});

            await handleOafFromCsw("https://example.com/oaf");

            expect(getStub.secondCall.args[0]).to.equal("https://example.com/oaf/collections");
        });

        it("should fall back to /collections when the landing page has no links array", async () => {
            const getStub = sinon.stub(axios, "get");

            getStub.onFirstCall().resolves({data: {title: "S"}});
            getStub.onSecondCall().resolves({data: {collections: [{id: "rivers", title: "Rivers"}]}});

            await handleOafFromCsw("https://example.com/oaf");

            expect(getStub.secondCall.args[0]).to.equal("https://example.com/oaf/collections");
        });
    });

    describe("serviceTitle resolution", () => {
        it("should use collections-level title when landing page has no title", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {}})
                .onSecondCall().resolves({data: {
                    title: "Collections Title",
                    collections: [{id: "a", title: "A"}]
                }});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.serviceTitle).to.equal("Collections Title");
        });

        it("should prefer landing page title over collections title", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {title: "Landing Title", links: []}})
                .onSecondCall().resolves({data: {
                    title: "Collections Title",
                    collections: [{id: "a", title: "A"}]
                }});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.serviceTitle).to.equal("Landing Title");
        });
    });

    describe("collections response shapes", () => {
        it("should handle a flat array as collections response", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {}})
                .onSecondCall().resolves({data: [
                    {id: "flood_zones", title: "Flood Zones"}
                ]});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.layerTitleEntries).to.deep.equal([
                {name: "flood_zones", title: "Flood Zones"}
            ]);
        });

        it("should fall back to collection.name when collection.id is absent", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {}})
                .onSecondCall().resolves({data: {
                    collections: [{name: "legacy_layer", title: "Legacy"}]
                }});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.layerTitleEntries[0].name).to.equal("legacy_layer");
        });

        it("should fall back to collection id when title is absent", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {}})
                .onSecondCall().resolves({data: {
                    collections: [{id: "no_title_collection"}]
                }});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.layerTitleEntries[0].title).to.equal("no_title_collection");
        });

        it("should filter out entries that have neither id nor name", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().resolves({data: {}})
                .onSecondCall().resolves({data: {
                    collections: [
                        {id: "valid", title: "Valid"},
                        {title: "No id or name"}
                    ]
                }});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.layerTitleEntries).to.have.length(1);
            expect(result.layerTitleEntries[0].name).to.equal("valid");
        });
    });

    describe("error resilience", () => {
        it("should continue to /collections when landing page request fails", async () => {
            sinon.stub(axios, "get")
                .onFirstCall().rejects(new Error("404 Not Found"))
                .onSecondCall().resolves({data: {
                    collections: [{id: "zones", title: "Zones"}]
                }});

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.layersAdded).to.be.true;
            expect(result.layerTitleEntries[0].name).to.equal("zones");
        });

        it("should return serviceUnavailable:true when the collections request also fails", async () => {
            sinon.stub(axios, "get").rejects(new Error("500 Server Error"));

            const result = await handleOafFromCsw("https://example.com/oaf");

            expect(result.serviceUnavailable).to.be.true;
            expect(result.layersAdded).to.be.false;
            expect(result.layerTitleEntries).to.deep.equal([]);
            expect(result.layerNames).to.deep.equal([]);
        });
    });
});
