import {expect} from "chai";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import InterfaceOafExtern from "@modules/filter/js/interfaces/interface.oaf.extern.js";
import sinon from "sinon";


describe("src/modules/filter/interfaces/utils/interface.oaf.extern.js", () => {
    let interfaceOafExtern = null;

    beforeEach(() => {
        interfaceOafExtern = new InterfaceOafExtern({
            getCurrentExtent: false
        });
    });

    describe("constructor", () => {
        it("should create an instance of InterfaceOafExtern with correct attributes", () => {
            expect(interfaceOafExtern).to.be.an.instanceof(InterfaceOafExtern);
            expect(interfaceOafExtern.axiosControllers).to.deep.equal({});
            expect(interfaceOafExtern.getCurrentExtent).to.be.false;
        });
    });

    describe("callEmptySuccess", () => {
        it("should call onsuccess function with correct argument", () => {
            interfaceOafExtern.callEmptySuccess(
                argument => {
                    expect(argument).to.deep.equal({
                        service: 1,
                        filterId: 2,
                        snippetId: 3,
                        paging: {
                            page: 66,
                            total: 100
                        },
                        items: []
                    });
                },
                {
                    service: 1,
                    filterId: 2,
                    snippetId: 3
                },
                66
            );
        });
    });

    describe("getFilter", () => {
        it("should build filter string for INTERSECTS operator with date format", () => {
            const rules = [{
                    operator: "INTERSECTS",
                    attrName: "foo",
                    value: ["2020-01-01", "2020-12-31"],
                    format: "YYYY-MM-DD"
                }],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("T_INTERSECTS(foo,INTERVAL('2020-01-01','2020-12-31'))");
        });

        it("should build filter string for EQ operator with date format YYYY-MM-DD and valid date", () => {
            const rules = [{
                    operator: "EQ",
                    attrName: "foo",
                    value: "2023-05-01",
                    format: "YYYY-MM-DD"
                }],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("T_EQUALS(foo,DATE('2023-05-01'))");
        });

        it("should build filter string for EQ operator with string", () => {
            const rules = [{operator: "EQ", attrName: "foo", value: "bar"}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo='bar'");
        });

        it("should build filter string for EQ operator with array", () => {
            const rules = [{operator: "EQ", attrName: "foo", value: ["bar", 2]}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo IN ('bar',2)");
        });

        it("should build filter string for EQ operator with number", () => {
            const rules = [{operator: "EQ", attrName: "foo", value: 42}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo=42");
        });

        it("should build filter string for NE operator with string", () => {
            const rules = [{operator: "NE", attrName: "foo", value: "bar"}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("NOT foo='bar'");
        });

        it("should build filter string for BETWEEN operator", () => {
            const rules = [{operator: "BETWEEN", attrName: "foo", value: [1, 2]}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo BETWEEN 1 AND 2");
        });

        it("should build filter string for STARTSWITH operator", () => {
            const rules = [{operator: "STARTSWITH", attrName: "foo", value: "bar"}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo LIKE 'bar%'");
        });

        it("should build filter string for ENDWITH operator", () => {
            const rules = [{operator: "ENDSWITH", attrName: "foo", value: "bar"}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo LIKE '%bar'");
        });

        it("should build filter string for IN operator", () => {
            const rules = [{operator: "IN", attrName: "foo", value: "bar"}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo LIKE '%bar%'");
        });

        it("should build filter string for GT operator", () => {
            const rules = [{operator: "GT", attrName: "foo", value: 5}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo>5");
        });

        it("should build filter string for GE operator", () => {
            const rules = [{operator: "GE", attrName: "foo", value: 5}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo>=5");
        });

        it("should build filter string for LT operator", () => {
            const rules = [{operator: "LT", attrName: "foo", value: 5}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo<5");
        });

        it("should build filter string for LE operator", () => {
            const rules = [{operator: "LE", attrName: "foo", value: 5}],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo<=5");
        });

        it("should append geometry filter if geometryName and filterGeometry are provided", () => {
            const stub = sinon.stub(getOAFFeature, "getOAFGeometryFilter").returns("GEOM_FILTER"),
                rules = [],
                result = interfaceOafExtern.getFilter(rules, "geom", {foo: "bar"});

            expect(result).to.equal("GEOM_FILTER");
            stub.restore();
        });

        it("should ignore rules if ignoreRules is true", () => {
            const rules = [{operator: "EQ", attrName: "foo", value: "bar"}],
                result = interfaceOafExtern.getFilter(rules, undefined, undefined, true);

            expect(result).to.equal("");
        });

        it("should build filter string with two rules joined by AND", () => {
            const rules = [
                    {operator: "EQ", attrName: "foo", value: "bar"},
                    {operator: "GT", attrName: "baz", value: 10}
                ],
                result = interfaceOafExtern.getFilter(rules);

            expect(result).to.equal("foo='bar' AND baz>10");
        });
    });

    describe("stop", () => {
        it("should abort the controller and call onsuccess if controller exists", () => {
            const onsuccess = sinon.spy(),
                onerror = sinon.spy(),
                filterId = 123,
                abortSpy = sinon.spy(),
                fakeController = {abort: abortSpy};

            Object.setPrototypeOf(fakeController, AbortController.prototype);
            interfaceOafExtern.axiosControllers[filterId] = fakeController;

            interfaceOafExtern.stop(filterId, onsuccess, onerror);

            expect(abortSpy.calledOnce).to.be.true;
            expect(onsuccess.calledOnce).to.be.true;
            expect(onerror.notCalled).to.be.true;
        });
    });

    describe("filter", () => {
        let filterQuestion, onsuccess, onerror, getOAFFeatureStream, readAllOAFToGeoJSONStub;

        beforeEach(() => {
            filterQuestion = {
                filterId: 1,
                service: {
                    url: "test-url",
                    collection: "test-collection",
                    limit: 10,
                    srsName: "EPSG:4326"
                },
                rules: [{operator: "EQ", attrName: "foo", value: "bar"}],
                commands: {
                    searchInMapExtent: false,
                    geometryName: undefined,
                    filterGeometry: undefined
                },
                snippetId: 42
            };
            onsuccess = sinon.spy();
            onerror = sinon.spy();
            getOAFFeatureStream = sinon.stub(getOAFFeature, "getOAFFeatureStream");
            readAllOAFToGeoJSONStub = sinon.stub(getOAFFeature, "readAllOAFToGeoJSON").returns([{id: 1}, {id: 2}]);
        });

        afterEach(() => {
            getOAFFeatureStream.restore();
            readAllOAFToGeoJSONStub.restore();
        });

        it("should call onsuccess with items if features are returned", () => {
            getOAFFeatureStream.resolves([{feature: 1}, {feature: 2}]);

            interfaceOafExtern.filter(filterQuestion, successResult => {
                if (successResult.paging.page === 100) {
                    expect(successResult).to.deep.include({
                        service: filterQuestion.service,
                        filterId: filterQuestion.filterId,
                        snippetId: filterQuestion.snippetId,
                        paging: {page: 100, total: 100},
                        items: [{id: 1}, {id: 2}]
                    });
                }
                else {
                    expect(successResult.items).to.be.an("array").that.is.empty;
                }
            }, onerror);
        });

        it.skip("should call onerror if getOAFFeatureGet rejects", () => {
            getOAFFeatureStream.rejects("Fehler");
            interfaceOafExtern.filter(filterQuestion, onsuccess, error => {
                expect(error).to.equal("Fehler");
            });
        });

        it("should use bbox if searchInMapExtent is true", () => {
            interfaceOafExtern = new InterfaceOafExtern({getCurrentExtent: () => [1, 2, 3, 4]});
            filterQuestion.commands.searchInMapExtent = true;
            getOAFFeatureStream.resolves([{feature: 1}]);
            interfaceOafExtern.filter(filterQuestion, onsuccess, onerror);

            expect(getOAFFeatureStream.firstCall.args[1]).to.have.property("bbox", "1,2,3,4");
        });
    });
});
