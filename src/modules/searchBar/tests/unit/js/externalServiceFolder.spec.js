import {expect} from "chai";
import sinon from "sinon";
import {addServiceLayersToExternalFolder} from "../../../js/externalServiceFolder.js";

describe("src/modules/searchBar/js/externalServiceFolder.js", () => {
    let dispatchStub, rootGetters;

    beforeEach(() => {
        dispatchStub = sinon.stub();
        rootGetters = {allFolders: []};
    });

    afterEach(() => {
        sinon.restore();
    });

    /**
     * Returns default parameter object for addServiceLayersToExternalFolder.
     * @param {Object} overrides Property overrides
     * @returns {Object} Parameters
     */
    function makeParams (overrides = {}) {
        return {
            rootGetters,
            dispatch: dispatchStub,
            serviceType: "WMS",
            serviceTitle: "My Service",
            layerEntries: [{name: "Road Network", sourceProps: {layers: "roads"}}],
            baseUrl: "https://example.com/wms",
            fileIdentifier: "abc123",
            cswUrl: "https://csw.example.com",
            resourceIndex: 0,
            ...overrides
        };
    }

    describe("folder creation", () => {
        it("should create a new folder when none exists and add one dispatch call per layer", async () => {
            dispatchStub.resolves(true);

            await addServiceLayersToExternalFolder(makeParams());

            // 1 dispatch for folder creation + 1 for the layer entry
            expect(dispatchStub.callCount).to.equal(2);

            const folderCall = dispatchStub.firstCall;

            expect(folderCall.args[0]).to.equal("addLayerToLayerConfig");
            expect(folderCall.args[1].layerConfig.name).to.equal("My Service");
            expect(folderCall.args[1].layerConfig.type).to.equal("folder");
            expect(folderCall.args[1].layerConfig.isExternal).to.be.true;
        });

        it("should reuse an existing folder and only dispatch for layer entries", async () => {
            rootGetters.allFolders = [{
                id: "folder-existing",
                type: "folder",
                isExternal: true,
                name: "My Service"
            }];
            dispatchStub.resolves(true);

            await addServiceLayersToExternalFolder(makeParams());

            // folder already exists — only one dispatch call for the layer
            expect(dispatchStub.callCount).to.equal(1);
        });

        it("should use the hostname as folder name when serviceTitle is empty", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({serviceTitle: ""});

            await addServiceLayersToExternalFolder(params);

            const {layerConfig} = dispatchStub.firstCall.args[1];

            expect(layerConfig.name).to.equal("example.com");
        });
    });

    describe("layer config structure", () => {
        it("should include url, typ, metaID, cswUrl, and isExternal in the layer config", async () => {
            dispatchStub.resolves(true);

            await addServiceLayersToExternalFolder(makeParams());

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.url).to.equal("https://example.com/wms");
            expect(layerConfig.typ).to.equal("WMS");
            expect(layerConfig.metaID).to.equal("abc123");
            expect(layerConfig.cswUrl).to.equal("https://csw.example.com");
            expect(layerConfig.isExternal).to.be.true;
            expect(layerConfig.type).to.equal("layer");
        });

        it("should include sourceProps from the layer entry in the config", async () => {
            dispatchStub.resolves(true);

            await addServiceLayersToExternalFolder(makeParams());

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.layers).to.equal("roads");
        });
    });

    describe("single layer activation", () => {
        it("should set visibility:true and showInLayerTree:true for a single-layer service", async () => {
            dispatchStub.resolves(true);

            await addServiceLayersToExternalFolder(makeParams());

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.visibility).to.be.true;
            expect(layerConfig.showInLayerTree).to.be.true;
        });

        it("should set visibility:false and showInLayerTree:false for multi-layer services", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({
                layerEntries: [
                    {name: "Roads", sourceProps: {layers: "roads"}},
                    {name: "Rivers", sourceProps: {layers: "rivers"}}
                ]
            });

            await addServiceLayersToExternalFolder(params);

            // Check both layer configs (last call = second layer)
            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.visibility).to.be.false;
            expect(layerConfig.showInLayerTree).to.be.false;
        });
    });

    describe("additionalLayerProps", () => {
        it("should merge additionalLayerProps into each layer config", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({
                additionalLayerProps: {bbox: false, loadingStrategy: "all"}
            });

            await addServiceLayersToExternalFolder(params);

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.bbox).to.be.false;
            expect(layerConfig.loadingStrategy).to.equal("all");
        });

        it("should allow sourceProps to override additionalLayerProps", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({
                layerEntries: [{name: "Topo", sourceProps: {layers: "topo", format: "image/png"}}],
                additionalLayerProps: {format: "image/jpeg"}
            });

            await addServiceLayersToExternalFolder(params);

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.format).to.equal("image/png");
        });
    });

    describe("service-type fallbacks", () => {
        it("should set WFS featureType from layer name when absent from sourceProps", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({
                serviceType: "WFS",
                layerEntries: [{name: "Buildings", sourceProps: {}}]
            });

            await addServiceLayersToExternalFolder(params);

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.featureType).to.equal("Buildings");
        });

        it("should set OAF collection from layer name when absent from sourceProps", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({
                serviceType: "OAF",
                layerEntries: [{name: "Parcels", sourceProps: {}}]
            });

            await addServiceLayersToExternalFolder(params);

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.collection).to.equal("Parcels");
        });

        it("should not override WFS featureType already provided by sourceProps", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({
                serviceType: "WFS",
                layerEntries: [{name: "Label Name", sourceProps: {featureType: "ns:buildings"}}]
            });

            await addServiceLayersToExternalFolder(params);

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.featureType).to.equal("ns:buildings");
        });
    });

    describe("edge cases", () => {
        it("should return false when layerEntries is empty", async () => {
            dispatchStub.resolves(true);

            const result = await addServiceLayersToExternalFolder(makeParams({layerEntries: []}));

            expect(result).to.be.false;
        });

        it("should return false when folder creation dispatch fails and no folder exists", async () => {
            dispatchStub.resolves(false);

            const result = await addServiceLayersToExternalFolder(makeParams());

            expect(result).to.be.false;
        });

        it("should use resourceIndex in the generated layer id", async () => {
            dispatchStub.resolves(true);
            const params = makeParams({resourceIndex: 3});

            await addServiceLayersToExternalFolder(params);

            const {layerConfig} = dispatchStub.lastCall.args[1];

            expect(layerConfig.id).to.include("-3-");
        });
    });
});
