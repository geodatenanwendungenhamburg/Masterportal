import {getVersion} from "../../src/lib/wfsUtil";

describe("wfsUtil.js", function () {
    describe("getVersion", function () {
        it("should return the right version from option or rawlayers", function () {
            expect(getVersion({version: "1.0.0"}, {version: "1.0.0"})).toEqual("1.0.0");
            expect(getVersion({version: "1.1.0"}, {version: "1.0.0"})).toEqual("1.0.0");
            expect(getVersion({version: "2.0.0"}, {version: "1.0.0"})).toEqual("1.0.0");
            expect(getVersion({version: "1.0.0"}, {version: "1.1.0"})).toEqual("1.1.0");
            expect(getVersion({version: "1.1.0"}, {version: "1.1.0"})).toEqual("1.1.0");
            expect(getVersion({version: "2.0.0"}, {version: "1.1.0"})).toEqual("1.1.0");
            expect(getVersion({version: "1.0.0"}, {version: "2.0.0"})).toEqual("2.0.0");
            expect(getVersion({version: "1.1.0"}, {version: "2.0.0"})).toEqual("2.0.0");
            expect(getVersion({version: "2.0.0"}, {version: "2.0.0"})).toEqual("2.0.0");
            expect(getVersion({}, {version: "2.0.0"})).toEqual("2.0.0");
            expect(getVersion({version: "2.0.0"}, {})).toEqual("2.0.0");
        });

        it("should return the right version 1.1.0", function () {
            console.warn = jest.fn();
            expect(getVersion({}, {})).toEqual("1.1.0");
            expect(getVersion({version: "2.1.1"}, {})).toEqual("1.1.0");
            expect(getVersion({}, {version: "2.1.1"})).toEqual("1.1.0");
            expect(getVersion({version: "2.1.1"}, {version: "2.1.1"})).toEqual("1.1.0");
            expect(console.warn).toHaveBeenCalled();
        });
    });
});
