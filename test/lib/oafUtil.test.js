import {getOutputFormat, getParsedResponse, getParamsUrl} from "../../src/lib/oafUtil";

describe("oafUtil.js", function () {
    describe("getOutputFormat", function () {
        it("should return the xml format", function () {
            expect(getOutputFormat("xml")).toEqual("xml");
        });

        it("should return the json format", function () {
            expect(getOutputFormat("")).toEqual("json");
            expect(getOutputFormat(undefined)).toEqual("json");
            expect(getOutputFormat("csv")).toEqual("json");
            expect(getOutputFormat("html")).toEqual("json");
            expect(getOutputFormat(true)).toEqual("json");
        });
    });

    describe("getParsedResponse", function () {
        const responseString = "<sf:FeatureCollection xmlns:sf=\"http://www.opengis.net/ogcapi-features-1/1.0/sf\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/ogcapi-features-1/1.0/sf http://schemas.opengis.net/ogcapi/features/part1/1.0/xml/core-sf.xsd https://registry.gdi-de.org/id/de.hh.up http://lgvfds03.fhhnet.stadt.hamburg.de/oaf_intranet/datasets/schulen/collections/staatliche_schulen/appschema\"><sf:featureMember><de.hh.up:staatliche_schulen xmlns:de.hh.up=\"https://registry.gdi-de.org/id/de.hh.up\" xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"DE.HH.UP_STAATLICHE_SCHULEN_435766\"><de.hh.up:adresse_ort>22307 Hamburg</de.hh.up:adresse_ort></de.hh.up:staatliche_schulen></sf:featureMember></sf:FeatureCollection>",
            parsedString = getParsedResponse(responseString, "xml");

        it("should return original response", function () {
            expect(getParsedResponse(responseString, "json")).toEqual(responseString);
            expect(getParsedResponse(responseString, "csv")).toEqual(responseString);
            expect(getParsedResponse(responseString, "html")).toEqual(responseString);
            expect(getParsedResponse(responseString, undefined)).toEqual(responseString);
        });

        it("should return parsed response", function () {
            expect(parsedString).toContain("wfs:");
            expect(parsedString).toContain("gml:");
            expect(parsedString).toEqual(expect.not.stringContaining("sf:"));
            expect(parsedString).toEqual(expect.not.stringContaining("http://www.opengis.net/gml/3.2"));
        });
    });

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
