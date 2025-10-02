import {expect} from "chai";
import sinon from "sinon";
import {RoutingGeosearchResult} from "@modules/routing/js/classes/routing-geosearch-result.js";
import {fetchRoutingGazetteerGeosearch} from "@modules/routing/js/geosearch/routing-gazetteer-geosearch.js";
import {vi} from "vitest";

vi.mock("@masterportal/masterportalapi/src/searchAddress.js", () => ({
    search: vi.fn(() => Promise.resolve([
        {geometry: {type: "Point", coordinates: [511114.73, 5397800.69]}, name: "Gottschalkring 1"},
        {geometry: {type: "Point", coordinates: [515643.21, 5404093.73]}, name: "An der Marienanlage 11"}
    ]))
}));

describe("src/modules/routing/js/geosearch/routing-gazeteer-geosearch.js", () => {
    beforeEach(() => {

        sinon.stub(i18next, "t").callsFake((...args) => args);
    });
    afterEach(() => {
        sinon.restore();
        vi.unstubAllGlobals();
    });
    describe("should fetchRoutingGazeteerGeosearch", () => {
        it("should process result correct", async () => {
            const result = await fetchRoutingGazetteerGeosearch("testsearch"),
                expectedResult = [
                    new RoutingGeosearchResult([511114.73, 5397800.69], "Gottschalkring 1", "25832"),
                    new RoutingGeosearchResult([515643.21, 5404093.73], "An der Marienanlage 11", "25832")
                ];

            expect(result).deep.to.eql(expectedResult);
        });
    });
});
