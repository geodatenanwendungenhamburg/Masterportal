import {expect} from "chai";
import routingOrsAvoidOption from "@modules/routing/js/avoidoptions/routing-ors-avoidoptions.js";

describe("should routingOrsAvoidOptions", () => {
    it("should lowercase preferences from configJson", async () => {
        const result = routingOrsAvoidOption("UNPAVEDROADS", "CYCLING");

        expect(result).to.eql("unpavedroads");
    });
    it("should lowercase preferences without configJson", async () => {
        const result = routingOrsAvoidOption("STEPS", "CYCLING");

        expect(result).to.eql("steps");
    });
});
