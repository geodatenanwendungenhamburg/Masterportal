import {expect} from "chai";
import sinon from "sinon";
import UrlHandler from "@modules/filter/utils/urlHandler.js";
import MapHandler from "@modules/filter/utils/mapHandler.js";

describe("src/modules/filter/utils/mapHandler.js", () => {
    const urlHandler = new UrlHandler();

    describe("getParamsFromState", () => {
        it("should return an empty object if first param is not an object", () => {
            expect(urlHandler.getParamsFromState(undefined)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState(null)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState([])).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState(true)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState(false)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState(1234)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState("string")).to.be.an("object").that.is.empty;
        });
        it("should return an empty object if second param is not an array", () => {
            expect(urlHandler.getParamsFromState({}, undefined)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState({}, null)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState({}, {})).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState({}, true)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState({}, false)).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState({}, "string")).to.be.an("object").that.is.empty;
            expect(urlHandler.getParamsFromState({}, 1234)).to.be.an("object").that.is.empty;
        });
        it("should return an object with matching attributes", () => {
            const stateObject = {
                    foo: "foo",
                    bar: "bar",
                    fow: "fow"
                },
                neededParams = ["foo", "fow"],
                expected = {
                    foo: "foo",
                    fow: "fow"
                };

            expect(urlHandler.getParamsFromState(stateObject, neededParams)).to.deep.equal(expected);
        });
        it("should return an empty object if no matches found", () => {
            const stateObject = {
                    foo: "foo",
                    bar: "bar",
                    fow: "fow"
                },
                neededParams = [];

            expect(urlHandler.getParamsFromState(stateObject, neededParams)).to.be.an("object").that.is.empty;
        });
    });
    describe("parseJsonString", () => {
        it("should return undefined if value is not a string", () => {
            expect(urlHandler.parseJsonString(undefined, "warn")).to.equal(undefined);
            expect(urlHandler.parseJsonString({}, "warn")).to.equal(undefined);
        });

        it("should parse a valid JSON string", () => {
            expect(urlHandler.parseJsonString("{\"foo\":\"bar\"}", "warn")).to.deep.equal({foo: "bar"});
        });

        it("should return fallback and warn for invalid JSON", () => {
            const warnStub = sinon.stub(console, "warn");

            expect(urlHandler.parseJsonString("{", "warn", {})).to.deep.equal({});
            expect(warnStub.calledOnce).to.be.true;

            warnStub.restore();
        });
    });
    describe("getFilterUrlParamsFromAppStore", () => {
        it("should return parsed FILTER when present", () => {
            const expected = {foo: "bar", baz: 1};

            expect(urlHandler.getFilterUrlParamsFromAppStore({
                FILTER: JSON.stringify(expected),
                MENU: JSON.stringify({
                    any: {currentComponent: "filter", attributes: {shouldNot: "beUsed"}}
                })
            })).to.deep.equal(expected);
        });

        it("should return filter attributes from MENU if FILTER is missing", () => {
            const expected = {a: 1, b: "x"};

            expect(urlHandler.getFilterUrlParamsFromAppStore({
                MENU: JSON.stringify({
                    foo: {currentComponent: "not-filter", attributes: {noop: true}},
                    bar: {currentComponent: "filter", attributes: expected}
                })
            })).to.deep.equal(expected);
        });

        it("should return empty object if MENU is missing or has no filter entry", () => {
            expect(urlHandler.getFilterUrlParamsFromAppStore({})).to.deep.equal({});
            expect(urlHandler.getFilterUrlParamsFromAppStore({
                MENU: JSON.stringify({
                    foo: {currentComponent: "a", attributes: {x: 1}}
                })
            })).to.deep.equal({});
        });
    });
    describe("createFilterUrl", () => {
        it("should create a filter url for main menu", () => {
            const url = urlHandler.createFilterUrl("https://example.com/?foo=bar", "mainMenu", "FILTER", "{\"x\":1}");

            expect(url.searchParams.get("MENU")).to.equal("{\"main\":{\"currentComponent\":\"filter\"}}");
            expect(url.searchParams.get("FILTER")).to.equal("{\"x\":1}");
        });

        it("should create a filter url for secondary menu", () => {
            const url = urlHandler.createFilterUrl("https://example.com/", "secondaryMenu", "FILTER", "{}");

            expect(url.searchParams.get("MENU")).to.equal("{\"secondary\":{\"currentComponent\":\"filter\"}}");
            expect(url.searchParams.get("FILTER")).to.equal("{}");
        });
    });
    describe("readFromUrlParams", () => {
        it("should parse the string into an object and return it", () => {
            const str = JSON.stringify({"rulesOfFilters": "foo", "bar": "bar"}),
                expected = {
                    rulesOfFilters: "foo",
                    bar: "bar"
                };

            urlHandler.readFromUrlParams(str, undefined, undefined, params => {
                expect(params).to.deep.equal(expected);
            });
        });
        it("should parse the string into an array and return it", () => {
            const str = JSON.stringify(["foo", "bar", {}]),
                transformOldUrlStub = sinon.stub(urlHandler, "transformOldUrl");

            urlHandler.readFromUrlParams(str);
            expect(transformOldUrlStub.called).to.be.true;
        });
    });
    describe("transformOldUrl", () => {
        it("should return the basic template without any data if first param is not an array", () => {
            const expected = {
                rulesOfFilters: [],
                selectedAccordions: []
            };

            urlHandler.transformOldUrl(undefined, undefined, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
            urlHandler.transformOldUrl(null, undefined, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
            urlHandler.transformOldUrl({}, undefined, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
            urlHandler.transformOldUrl(true, undefined, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
            urlHandler.transformOldUrl(false, undefined, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
            urlHandler.transformOldUrl("string", undefined, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
        });
        it("should return the basic template without any data if first param is an empty array", () => {
            const expected = {
                rulesOfFilters: [],
                selectedAccordions: []
            };

            urlHandler.transformOldUrl([], undefined, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
        });
        it("should return the basic template without any data if no matching filter is found", () => {
            const matchingFilterStub = sinon.stub(urlHandler, "getMatchingFilterFromGroupsOrLayers"),
                expected = {
                    rulesOfFilters: [],
                    selectedAccordions: []
                };

            matchingFilterStub.returns({index: -1});

            urlHandler.transformOldUrl([{"foooo": "fpp"}], {}, undefined, result => {
                expect(result).to.deep.equal(expected);
            });
        });
        it("should return the template filled with data from the given param", () => {
            const matchingFilterStub = sinon.stub(urlHandler, "getMatchingFilterFromGroupsOrLayers"),
                getPreparedRuleStub = sinon.stub(urlHandler, "getPreparedRule"),
                expected = {
                    rulesOfFilters: [[{foo: "foo", snippetId: 0}]],
                    selectedAccordions: [{layerId: 0, filterId: 0}]
                },
                mapHandler = new MapHandler();

            /**
             * Testing function.
             * @param {Object} result From the onsuccess function.
             * @returns {void}
             */
            function onsuccess (result) {
                expect(result).to.deep.equal(expected);
            }

            sinon.stub(mapHandler, "initializeLayer");
            getPreparedRuleStub.returns({
                snippetId: 0,
                foo: "foo"
            });
            matchingFilterStub.returns({
                index: 0,
                filter: {
                    layerId: 0,
                    snippets: [
                        {foo: "foo"}
                    ],
                    api: {
                        setServiceByLayerModel: () => sinon.stub(),
                        getAttrTypes: sinon.stub().callsFake(() => {
                            onsuccess({
                                rulesOfFilters: [[{foo: "foo", snippetId: 0}]],
                                selectedAccordions: [{layerId: 0, filterId: 0}]
                            });
                        })
                    }
                }
            });


            urlHandler.transformOldUrl([{rules: [{foo: "foo"}]}], {}, mapHandler, onsuccess);
        });
    });
    describe("setResultValues", () => {
        it("should not update last param if first param is not an object", () => {
            const result = {foo: "bar"},
                expected = {foo: "bar"};

            urlHandler.setResultValues(undefined, undefined, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues(null, undefined, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues([], undefined, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues("string", undefined, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues(1234, undefined, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues(true, undefined, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues(false, undefined, undefined, result);
            expect(result).to.deep.equal(expected);
        });
        it("should not update last param if second param is not an object", () => {
            const result = {foo: "bar"},
                expected = {foo: "bar"};

            urlHandler.setResultValues({}, undefined, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, null, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, [], undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, "string", undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, 1234, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, true, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, false, undefined, result);
            expect(result).to.deep.equal(expected);
        });
        it("should not update last param if third param is not an object", () => {
            const result = {foo: "bar"},
                expected = {foo: "bar"};

            urlHandler.setResultValues({}, {}, undefined, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, null, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, [], result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, "string", result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, 1234, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, true, result);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, false, result);
            expect(result).to.deep.equal(expected);
        });
        it("should not update last param if last param is not an object", () => {
            const result = {foo: "bar"},
                expected = {foo: "bar"};

            urlHandler.setResultValues({}, {}, {}, undefined);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, {}, null);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, {}, []);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, {}, "string");
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, {}, 1234);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, {}, true);
            expect(result).to.deep.equal(expected);
            urlHandler.setResultValues({}, {}, {}, false);
            expect(result).to.deep.equal(expected);
        });
        it("should update last param", () => {
            const result = {
                    rulesOfFilters: [],
                    selectedAccordions: []
                },
                expected = {
                    rulesOfFilters: [[{
                        attrName: "wow",
                        snippetId: 0,
                        fixed: false,
                        startup: false,
                        operator: "BETWEEN",
                        value: [
                            6,
                            2506
                        ]
                    }]],
                    selectedAccordions: [{
                        layerId: 0,
                        filterId: 0
                    }]
                },
                oldFilterObject = {
                    name: "woo",
                    isSelected: true,
                    layerId: 0,
                    rules: [
                        {
                            attrName: "wow",
                            snippetId: 0,
                            values: [
                                6,
                                2506
                            ]
                        }
                    ]
                },
                matchingFilter = {
                    index: 0,
                    filter: {
                        snippets: [
                            {
                                attrName: "wow"
                            }
                        ]
                    }
                },
                attrTypes = {
                    wow: "dropdown"
                };

            sinon.stub(urlHandler, "getPreparedRule").returns({
                fixed: false,
                startup: false,
                operator: "BETWEEN",
                value: [
                    6,
                    2506
                ]
            });
            urlHandler.setResultValues(oldFilterObject, matchingFilter, attrTypes, result);
            expect(result).to.deep.equal(expected);
        });
    });
    describe("getMatchingFilterFromGroupsOrLayers", () => {
        it("should return template object without changed informations", () => {
            const expected = {
                filter: null,
                index: null
            };

            expect(urlHandler.getMatchingFilterFromGroupsOrLayers()).to.deep.equal(expected);
        });
        it("should return an object with informations if in groups found", () => {
            const expected = {
                filter: {
                    title: "foo"
                },
                index: 0
            };

            expect(urlHandler.getMatchingFilterFromGroupsOrLayers(
                {name: "foo"},
                [{layers: [{title: "foo"}]}]
            )).to.deep.equal(expected);
        });
        it("should return an object with informations if in layers found", () => {
            const expected = {
                filter: {
                    title: "foo"
                },
                index: 0
            };

            expect(urlHandler.getMatchingFilterFromGroupsOrLayers(
                {name: "foo"},
                undefined,
                [{title: "foo"}]
            )).to.deep.equal(expected);
        });
    });
    describe("getPreparedRule", () => {
        it("should return a prepared rule", () => {
            const expected = {
                attrName: "boo",
                snippetId: 0,
                fixed: false,
                startup: false,
                operator: "IN",
                value: "bow",
                values: "bow"
            };

            expect(urlHandler.getPreparedRule(
                {
                    attrName: "boo",
                    values: "bow"
                },
                {
                    attrName: "boo",
                    operator: "IN"
                },
                0
            )).to.deep.equal(expected);
        });
    });
});
