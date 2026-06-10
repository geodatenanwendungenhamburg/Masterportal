import {expect} from "chai";
import sinon from "sinon";

import {
    mappingLayoutConfig,
    filterMappingLayoutByDrawType,
    normalizeLayoutValue,
    calculateTrianglePosition
} from "@shared/modules/draw/js/drawLayoutUtils.js";

describe("src/shared/modules/draw/js/drawLayoutUtils.js", () => {
    describe("mappingLayoutConfig", () => {
        it("should contain fillColor, strokeColor, strokeWidth, and fillTransparency keys", () => {
            expect(mappingLayoutConfig).to.have.property("fillColor");
            expect(mappingLayoutConfig).to.have.property("strokeColor");
            expect(mappingLayoutConfig).to.have.property("strokeWidth");
            expect(mappingLayoutConfig).to.have.property("fillTransparency");
        });

        it("should have drawTypes array and icon string for each entry", () => {
            Object.keys(mappingLayoutConfig).forEach(key => {
                expect(mappingLayoutConfig[key]).to.have.property("drawTypes").that.is.an("array");
                expect(mappingLayoutConfig[key]).to.have.property("icon").that.is.a("string");
            });
        });

        it("should include 'circle' in fillColor drawTypes", () => {
            expect(mappingLayoutConfig.fillColor.drawTypes).to.include("circle");
        });

        it("should include 'line' in strokeColor drawTypes", () => {
            expect(mappingLayoutConfig.strokeColor.drawTypes).to.include("line");
        });

        it("should not include 'line' in fillColor drawTypes", () => {
            expect(mappingLayoutConfig.fillColor.drawTypes).to.not.include("line");
        });
    });

    describe("filterMappingLayoutByDrawType", () => {
        it("should return only entries whose drawTypes include the selected draw type", () => {
            const result = filterMappingLayoutByDrawType(mappingLayoutConfig, "pen");

            expect(result).to.have.property("strokeColor");
            expect(result).to.have.property("strokeWidth");
            expect(result).to.have.property("fillTransparency");
            expect(result).to.not.have.property("fillColor");
        });

        it("should return fillColor for 'circle' draw type", () => {
            const result = filterMappingLayoutByDrawType(mappingLayoutConfig, "circle");

            expect(result).to.have.property("fillColor");
            expect(result).to.have.property("strokeColor");
            expect(result).to.have.property("strokeWidth");
            expect(result).to.have.property("fillTransparency");
        });

        it("should return an empty object for an unknown draw type", () => {
            const result = filterMappingLayoutByDrawType(mappingLayoutConfig, "unknown");

            expect(result).to.be.an("object").that.is.empty;
        });

        it("should return an empty object if mappingLayout is empty", () => {
            const result = filterMappingLayoutByDrawType({}, "circle");

            expect(result).to.be.an("object").that.is.empty;
        });

        it("should handle entries with missing drawTypes gracefully", () => {
            const layout = {broken: {icon: "bi-x"}};
            const result = filterMappingLayoutByDrawType(layout, "circle");

            expect(result).to.be.an("object").that.is.empty;
        });

        it("should include extrudedHeight entry when present and matching", () => {
            const layout = {
                ...mappingLayoutConfig,
                extrudedHeight: {drawTypes: ["polygon", "rectangle"], icon: "bi-box-arrow-up"}
            };
            const result = filterMappingLayoutByDrawType(layout, "polygon");

            expect(result).to.have.property("extrudedHeight");
        });

        it("should not include extrudedHeight for non-matching draw type", () => {
            const layout = {
                ...mappingLayoutConfig,
                extrudedHeight: {drawTypes: ["polygon", "rectangle"], icon: "bi-box-arrow-up"}
            };
            const result = filterMappingLayoutByDrawType(layout, "line");

            expect(result).to.not.have.property("extrudedHeight");
        });
    });

    describe("normalizeLayoutValue", () => {
        it("should convert fillColor hex value to RGB array", () => {
            const result = normalizeLayoutValue("fillColor", "#ff00aa");

            expect(result).to.deep.equal([255, 0, 170]);
        });

        it("should convert strokeColor hex value to RGB array", () => {
            const result = normalizeLayoutValue("strokeColor", "#000000");

            expect(result).to.deep.equal([0, 0, 0]);
        });

        it("should return text value as-is", () => {
            const result = normalizeLayoutValue("text", "Hello World");

            expect(result).to.equal("Hello World");
        });

        it("should return font value as-is", () => {
            const result = normalizeLayoutValue("font", "Times New Roman");

            expect(result).to.equal("Times New Roman");
        });

        it("should parse fontSize as integer", () => {
            const result = normalizeLayoutValue("fontSize", "24");

            expect(result).to.equal(24);
        });

        it("should parse fontSize string with decimals as integer (truncated)", () => {
            const result = normalizeLayoutValue("fontSize", "24.7");

            expect(result).to.equal(24);
        });

        it("should parse strokeWidth as float", () => {
            const result = normalizeLayoutValue("strokeWidth", "2.5");

            expect(result).to.equal(2.5);
        });

        it("should parse fillTransparency as float", () => {
            const result = normalizeLayoutValue("fillTransparency", "50");

            expect(result).to.equal(50);
        });

        it("should parse extrudedHeight as float", () => {
            const result = normalizeLayoutValue("extrudedHeight", "33.3");

            expect(result).to.equal(33.3);
        });

        it("should return NaN for non-numeric string with numeric key", () => {
            const result = normalizeLayoutValue("strokeWidth", "abc");

            expect(result).to.be.NaN;
        });

        it("should return empty string for text key with empty string value", () => {
            const result = normalizeLayoutValue("text", "");

            expect(result).to.equal("");
        });
    });

    describe("calculateTrianglePosition", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("should return null if button element is not found", () => {
            sinon.stub(document, "getElementById").returns(null);

            const result = calculateTrianglePosition("draw-pen", "main-drawtypes-container");

            expect(result).to.be.null;
        });

        it("should return null if container element is not found", () => {
            const stub = sinon.stub(document, "getElementById");

            stub.withArgs("main-drawtypes-container").returns(null);
            stub.withArgs("draw-pen").returns({getBoundingClientRect: () => ({x: 100, width: 40})});

            const result = calculateTrianglePosition("draw-pen", "main-drawtypes-container");

            expect(result).to.be.null;
        });

        it("should calculate the center position of the button relative to the container", () => {
            const stub = sinon.stub(document, "getElementById");

            stub.withArgs("main-drawtypes-container").returns({
                getBoundingClientRect: () => ({x: 50})
            });
            stub.withArgs("draw-pen").returns({
                getBoundingClientRect: () => ({x: 100, width: 40})
            });

            const result = calculateTrianglePosition("draw-pen", "main-drawtypes-container");

            // (100 + 40/2) - 50 = 70
            expect(result).to.equal(70);
        });

        it("should return 0 when button center aligns with container start", () => {
            const stub = sinon.stub(document, "getElementById");

            stub.withArgs("container").returns({
                getBoundingClientRect: () => ({x: 120})
            });
            stub.withArgs("btn").returns({
                getBoundingClientRect: () => ({x: 100, width: 40})
            });

            const result = calculateTrianglePosition("btn", "container");

            // (100 + 40/2) - 120 = 0
            expect(result).to.equal(0);
        });
    });
});
