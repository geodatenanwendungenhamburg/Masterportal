import {expect} from "chai";
import {deleteParams} from "@shared/js/utils/deleteUrlParams.js";

describe("src/utils/deleteUrlParams.js", () => {
    describe("deleteParams", () => {

        it("should delete parameter", function () {
            const url = new URL("https://test/test?parametername=test");

            deleteParams(url, ["parametername"]);
            expect(url.href).to.equal("https://test/test");
        });

        it("should delete uppercase parameter", function () {
            const url = new URL("https://test/test?PARAMETERNAME=test");

            deleteParams(url, ["parametername"]);
            expect(url.href).to.equal("https://test/test");
        });

        it("should delete camel case parameter", function () {
            const url = new URL("https://test/test?ParameterName=test");

            deleteParams(url, ["parametername"]);
            expect(url.href).to.equal("https://test/test");
        });

        it("should keep other parameter", function () {
            const url = new URL("https://test/test?parametername=test&otherparameter=other");

            deleteParams(url, ["parametername"]);
            expect(url.href).to.equal("https://test/test?otherparameter=other");
        });
    });
});
