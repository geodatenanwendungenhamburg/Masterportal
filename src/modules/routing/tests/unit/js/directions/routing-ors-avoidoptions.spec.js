import store from "@appstore/index.js";
import {expect} from "chai";
import routingOrsAvoidOption from "@modules/routing/js/avoidoptions/routing-ors-avoidoptions.js";

describe.skip("should routingOrsAvoidOptions", () => {
    it("should lowercase preferences from configJson", async () => {
        // todo please fix this test without importing app-store
        store.getters["Modules/Routing/directionsSettings"] = {
            customAvoidFeatures: {
                CYCLING: ["UNPAVEDROADS", "STEPS"]
            }
        };
        const result = routingOrsAvoidOption("UNPAVEDROADS", "CYCLING");

        expect(result).to.eql("unpavedroads");
    });
    it("should lowercase preferences without configJson", async () => {
        const result = routingOrsAvoidOption("STEPS", "CYCLING");

        expect(result).to.eql("steps");
    });
});
