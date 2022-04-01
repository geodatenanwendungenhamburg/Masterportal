import {getParamsUrl} from "../../src/lib/oafUtil";

describe("oafUtil.js", function () {
    describe("getParamsUrl", function () {
        const params = {
            "anzahl_schueler": ">1000",
            "bezirk": "Bergedorf"
        };

        it("should return the parsed paramsUrl", function () {
            expect(getParamsUrl(params)).toEqual("&anzahl_schueler=>1000&bezirk=Bergedorf");
        });

        it("should return an empty string", function () {
            expect(getParamsUrl("string")).toEqual("");
            expect(getParamsUrl(0)).toEqual("");
            expect(getParamsUrl(null)).toEqual("");
            expect(getParamsUrl(undefined)).toEqual("");
            expect(getParamsUrl(true)).toEqual("");
            expect(getParamsUrl([])).toEqual("");
            expect(getParamsUrl({})).toEqual("");
        });
    });
});
