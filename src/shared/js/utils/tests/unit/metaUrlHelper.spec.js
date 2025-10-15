import {expect} from "chai";
import {buildMetaURLs} from "@shared/js/utils/metaUrlHelper.js";

describe("src/shared/js/utils/metaUrlHelper.js", () => {
    describe("buildMetaURLs", () => {
        it("should return an empty array if no metaId is given", () => {
            expect(buildMetaURLs(null, {})).to.be.an("array").and.to.be.empty;
            expect(buildMetaURLs("", {})).to.be.an("array").and.to.be.empty;
            expect(buildMetaURLs(undefined, {})).to.be.an("array").and.to.be.empty;
        });

        it("should build URL using layerInfo.showDocUrl if available", () => {
            const metaId = "123",
                result = buildMetaURLs(metaId, {
                    layerInfo: {showDocUrl: "http://example.com/doc?id="}
                });

            expect(result).to.deep.equal(["http://example.com/doc?id=123"]);
        });

        it("should build URL using restServiceById if showDocUrl is not given", () => {
            const metaId = "abc",
                result = buildMetaURLs(metaId, {
                    metaDataCatalogueId: "catalogue1",
                    restServiceById: id => id === "catalogue1"
                        ? {url: "http://service.com/meta?id="}
                        : undefined
                });

            expect(result).to.deep.equal(["http://service.com/meta?id=abc"]);
        });

        it("should avoid duplicates in the returned URLs", () => {
            const metaId = "xyz",
                opts = {
                    layerInfo: {showDocUrl: "http://example.com/doc?id="}
                },

                result = buildMetaURLs(metaId, opts).concat(buildMetaURLs(metaId, opts));

            expect([...new Set(result)]).to.have.lengthOf(1);
        });
    });
});
