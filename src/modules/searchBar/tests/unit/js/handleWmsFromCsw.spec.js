import {expect} from "chai";
import sinon from "sinon";
import axios from "axios";
import {WMSCapabilities} from "ol/format.js";
import handleWmsFromCsw from "../../../js/handleWmsFromCsw.js";

describe("src/modules/searchBar/js/handleWmsFromCsw.js", () => {
    afterEach(() => {
        sinon.restore();
    });

    /**
     * Creates a minimal capabilities object matching the structure returned by the OL WMS parser.
     * @param {Object} opts Options
     * @param {String} opts.serviceTitle Title shown in capabilities
     * @param {Object} opts.rootLayer Root layer definition (with optional nested Layer array)
     * @returns {Object} Capabilities object
     */
    function makeCapabilities ({serviceTitle = "Test WMS", rootLayer = null} = {}) {
        return {
            Service: {Title: serviceTitle},
            Capability: {Layer: rootLayer}
        };
    }

    beforeEach(() => {
        sinon.stub(axios, "get").resolves({data: "<WMS_Capabilities/>"});
    });

    describe("layer discovery", () => {
        it("should return serviceTitle and a single named layer", async () => {
            sinon.stub(WMSCapabilities.prototype, "read").returns(makeCapabilities({
                serviceTitle: "Demo WMS",
                rootLayer: {Name: "layer1", Title: "Layer One", Layer: []}
            }));

            const result = await handleWmsFromCsw("https://example.com/wms");

            expect(result.serviceTitle).to.equal("Demo WMS");
            expect(result.layersAdded).to.be.true;
            expect(result.serviceUnavailable).to.be.false;
            expect(result.layerNames).to.deep.equal(["layer1"]);
            expect(result.layerTitleEntries).to.deep.equal([{name: "layer1", title: "Layer One"}]);
        });

        it("should recursively collect layers from nested structure", async () => {
            sinon.stub(WMSCapabilities.prototype, "read").returns(makeCapabilities({
                rootLayer: {
                    Title: "Root (no Name)",
                    Layer: [
                        {Name: "group1", Title: "Group 1", Layer: [
                            {Name: "child1", Title: "Child One"},
                            {Name: "child2", Title: "Child Two"}
                        ]},
                        {Name: "standalone", Title: "Standalone"}
                    ]
                }
            }));

            const result = await handleWmsFromCsw("https://example.com/wms");

            expect(result.layerNames).to.have.members(["group1", "child1", "child2", "standalone"]);
        });

        it("should handle a single nested Layer object (not array)", async () => {
            sinon.stub(WMSCapabilities.prototype, "read").returns(makeCapabilities({
                rootLayer: {
                    Title: "Root",
                    Layer: {Name: "single_child", Title: "Single Child"}
                }
            }));

            const result = await handleWmsFromCsw("https://example.com/wms");

            expect(result.layerNames).to.deep.equal(["single_child"]);
        });

        it("should return layersAdded:false and empty arrays when capabilities has no layers", async () => {
            sinon.stub(WMSCapabilities.prototype, "read").returns(makeCapabilities({
                rootLayer: {Title: "Root only, no Name, no children"}
            }));

            const result = await handleWmsFromCsw("https://example.com/wms");

            expect(result.layersAdded).to.be.false;
            expect(result.layerNames).to.deep.equal([]);
            expect(result.layerTitleEntries).to.deep.equal([]);
        });

        it("should return layersAdded:false when rootLayer is null", async () => {
            sinon.stub(WMSCapabilities.prototype, "read").returns(makeCapabilities({
                rootLayer: null
            }));

            const result = await handleWmsFromCsw("https://example.com/wms");

            expect(result.layersAdded).to.be.false;
            expect(result.layerNames).to.deep.equal([]);
        });
    });

    describe("error handling", () => {
        it("should return serviceUnavailable:true and empty result when axios throws", async () => {
            axios.get.restore();
            sinon.stub(axios, "get").rejects(new Error("Network Error"));

            const result = await handleWmsFromCsw("https://example.com/wms");

            expect(result.serviceUnavailable).to.be.true;
            expect(result.layersAdded).to.be.false;
            expect(result.serviceTitle).to.equal("");
            expect(result.layerNames).to.deep.equal([]);
        });

        it("should return serviceUnavailable:true when WMSCapabilities parser throws", async () => {
            sinon.stub(WMSCapabilities.prototype, "read").throws(new Error("Parse error"));

            const result = await handleWmsFromCsw("https://example.com/wms");

            expect(result.serviceUnavailable).to.be.true;
            expect(result.layersAdded).to.be.false;
        });
    });
});
