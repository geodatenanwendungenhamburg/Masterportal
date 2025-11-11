import {expect} from "chai";
import getFeature from "@shared/js/api/wfs/getFeature.js";

describe("src/api/wfs/js", () => {
    describe("getFeatureGET", () => {
        it("should throw an error if the first parameter is not a string", () => {
            expect(() => getFeature.getFeatureGET(undefined)).to.throw();
            expect(() => getFeature.getFeatureGET(null)).to.throw();
            expect(() => getFeature.getFeatureGET(1234)).to.throw();
            expect(() => getFeature.getFeatureGET(true)).to.throw();
            expect(() => getFeature.getFeatureGET(false)).to.throw();
            expect(() => getFeature.getFeatureGET([])).to.throw();
            expect(() => getFeature.getFeatureGET({})).to.throw();
        });
        it("should throw an error if the second parameter is not an object", () => {
            expect(() => getFeature.getFeatureGET("url", undefined)).to.throw();
            expect(() => getFeature.getFeatureGET("url", null)).to.throw();
            expect(() => getFeature.getFeatureGET("url", 1234)).to.throw();
            expect(() => getFeature.getFeatureGET("url", "string")).to.throw();
            expect(() => getFeature.getFeatureGET("url", 1234)).to.throw();
            expect(() => getFeature.getFeatureGET("url", false)).to.throw();
            expect(() => getFeature.getFeatureGET("url", [])).to.throw();
        });
        it("should throw an error if the second parameter is an object without a version as string", () => {
            expect(() => getFeature.getFeatureGET("url", {})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: undefined})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: null})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: 1234})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: true})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: false})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: []})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: {}})).to.throw();
        });
        it("should throw an error if the second parameter is an object without featureType as string or array", () => {
            expect(() => getFeature.getFeatureGET("url", {version: "version", featureType: undefined})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: "version", featureType: null})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: "version", featureType: 1234})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: "version", featureType: true})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: "version", featureType: false})).to.throw();
            expect(() => getFeature.getFeatureGET("url", {version: "version", featureType: {}})).to.throw();
        });
        it("should not throw an error but stick it to the third parameter if third parameter is a function", () => {
            let lastError = null;

            expect(() => getFeature.getFeatureGET(undefined, undefined, error => {
                lastError = error;
            })).to.not.throw();
            expect(lastError).to.be.an.instanceOf(Error);
        });
    });

    describe("getFeaturePOST", () => {
        it("should throw an error if the first parameter is not a string", () => {
            expect(() => getFeature.getFeaturePOST(undefined)).to.throw();
            expect(() => getFeature.getFeaturePOST(null)).to.throw();
            expect(() => getFeature.getFeaturePOST(1234)).to.throw();
            expect(() => getFeature.getFeaturePOST(true)).to.throw();
            expect(() => getFeature.getFeaturePOST(false)).to.throw();
            expect(() => getFeature.getFeaturePOST([])).to.throw();
            expect(() => getFeature.getFeaturePOST({})).to.throw();
        });
        it("should throw an error if the second parameter is not an object", () => {
            expect(() => getFeature.getFeaturePOST("url", undefined)).to.throw();
            expect(() => getFeature.getFeaturePOST("url", null)).to.throw();
            expect(() => getFeature.getFeaturePOST("url", 1234)).to.throw();
            expect(() => getFeature.getFeaturePOST("url", "string")).to.throw();
            expect(() => getFeature.getFeaturePOST("url", 1234)).to.throw();
            expect(() => getFeature.getFeaturePOST("url", false)).to.throw();
            expect(() => getFeature.getFeaturePOST("url", [])).to.throw();
        });
        it("should throw an error if the second parameter is an object without featureType as string or array", () => {
            expect(() => getFeature.getFeaturePOST("url", {featureTypes: undefined})).to.throw();
            expect(() => getFeature.getFeaturePOST("url", {featureTypes: null})).to.throw();
            expect(() => getFeature.getFeaturePOST("url", {featureTypes: 1234})).to.throw();
            expect(() => getFeature.getFeaturePOST("url", {featureTypes: true})).to.throw();
            expect(() => getFeature.getFeaturePOST("url", {featureTypes: false})).to.throw();
            expect(() => getFeature.getFeaturePOST("url", {featureTypes: {}})).to.throw();
        });
        it("should not throw an error but stick it to the third parameter if third parameter is a function", () => {
            let lastError = null;

            expect(() => getFeature.getFeaturePOST(undefined, undefined, error => {
                lastError = error;
            })).to.not.throw();
            expect(lastError).to.be.an.instanceOf(Error);
        });
    });
});
