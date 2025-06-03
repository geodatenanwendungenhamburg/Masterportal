import {expect} from "chai";
import generateUniqueModelId from "../../utils/generateUniqueModelId";

describe("src/modules/bimViewer/utils/generateUniqueModelId.js", () => {
    it("returns the id if it is not taken", () => {
        const
            taken = [],
            result = generateUniqueModelId("my-id", taken);

        expect(result).to.equal("my-id");
    });

    it("returns the id with (2) if it is taken once", () => {
        const
            taken = [
                "my-id"
            ],
            result = generateUniqueModelId("my-id", taken);

        expect(result).to.equal("my-id (2)");
    });

    it("returns the id with (3) if (2) is also taken", () => {
        const
            taken = [
                "my-id",
                "my-id (2)"
            ],
            result = generateUniqueModelId("my-id", taken);

        expect(result).to.equal("my-id (3)");
    });

    it("returns the next available id if several are taken", () => {
        const
            taken = [
                "my-id",
                "my-id (2)",
                "my-id (3)",
                "my-id (4)"
            ],
            result = generateUniqueModelId("my-id", taken);

        expect(result).to.equal("my-id (5)");
    });

    it("works with ids that have similar names", () => {
        const
            taken = [
                "my-id",
                "my-id (2)",
                "my-id (3)",
                "my-id-2"
            ],
            result = generateUniqueModelId("my-id", taken);

        expect(result).to.equal("my-id (4)");
    });

    it("does not increment if a higher number is missing", () => {
        const
            taken = [
                "my-id",
                "my-id (2)",
                "my-id (4)"
            ],
            result = generateUniqueModelId("my-id", taken);

        expect(result).to.equal("my-id (3)");
    });
});
