import {expect} from "chai";
import {buildColors, getTypeSpecificProperties} from "@shared/modules/draw/js/handleDrawEvent.js";

describe("src/shared/modules/draw/js/handleDrawEvent.js", () => {
    describe("buildColors", () => {
        it("should return only colorContour for line types", () => {
            const layout = {
                    strokeColor: [0, 0, 0],
                    fillColor: [55, 126, 184],
                    fillTransparency: 50
                },
                result = buildColors(layout, true);

            expect(result).to.have.property("colorContour");
            expect(result.colorContour).to.deep.equal([0, 0, 0, 0.5]);
            expect(result).to.not.have.property("color");
            expect(result).to.not.have.property("opacity");
        });

        it("should return colorContour, color, and opacity for non-line types", () => {
            const layout = {
                    strokeColor: [0, 0, 0],
                    fillColor: [55, 126, 184],
                    fillTransparency: 50
                },
                result = buildColors(layout, false);

            expect(result.colorContour).to.deep.equal([0, 0, 0, 1]);
            expect(result.color).to.deep.equal([55, 126, 184, 0.5]);
            expect(result.opacity).to.equal(0.5);
        });

        it("should handle zero transparency correctly", () => {
            const layout = {
                    strokeColor: [255, 0, 0],
                    fillColor: [0, 255, 0],
                    fillTransparency: 0
                },
                resultLine = buildColors(layout, true),
                resultFill = buildColors(layout, false);

            expect(resultLine.colorContour).to.deep.equal([255, 0, 0, 1]);
            expect(resultFill.color).to.deep.equal([0, 255, 0, 1]);
            expect(resultFill.opacity).to.equal(0);
        });

        it("should handle full transparency correctly", () => {
            const layout = {
                    strokeColor: [255, 0, 0],
                    fillColor: [0, 255, 0],
                    fillTransparency: 100
                },
                resultLine = buildColors(layout, true),
                resultFill = buildColors(layout, false);

            expect(resultLine.colorContour).to.deep.equal([255, 0, 0, 0]);
            expect(resultFill.color).to.deep.equal([0, 255, 0, 0]);
            expect(resultFill.opacity).to.equal(1);
        });

        it("should not mutate the original layout arrays", () => {
            const layout = {
                strokeColor: [0, 0, 0],
                fillColor: [55, 126, 184],
                fillTransparency: 50
            };

            buildColors(layout, true);
            expect(layout.strokeColor).to.deep.equal([0, 0, 0]);

            buildColors(layout, false);
            expect(layout.strokeColor).to.deep.equal([0, 0, 0]);
            expect(layout.fillColor).to.deep.equal([55, 126, 184]);
        });
    });

    describe("getTypeSpecificProperties", () => {
        let stateDrawCopy;

        beforeEach(() => {
            stateDrawCopy = {
                currentLayout: {
                    lineLength: 42,
                    font: "Arial",
                    fontSize: 10,
                    text: "test text"
                },
                circleOptions: {
                    innerRadius: 100,
                    outerRadius: 500
                },
                currentLayoutOuterCircle: {
                    strokeColor: [200, 0, 0],
                    fillColor: [0, 0, 0],
                    fillTransparency: 100
                },
                selectedSymbol: null
            };
        });

        it("should return lineLength for 'line' type", () => {
            const result = getTypeSpecificProperties("line", stateDrawCopy);

            expect(result).to.deep.equal({lineLength: 42});
        });

        it("should return circleRadius for 'circle' type", () => {
            const result = getTypeSpecificProperties("circle", stateDrawCopy);

            expect(result).to.deep.equal({circleRadius: 100});
        });

        it("should return inner and outer circle properties for 'doubleCircle' type", () => {
            const result = getTypeSpecificProperties("doubleCircle", stateDrawCopy);

            expect(result.circleRadius).to.equal(100);
            expect(result.circleOuterRadius).to.equal(500);
            expect(result.outerColorContour).to.deep.equal([200, 0, 0, 1]);
            expect(result.outerColorFill).to.deep.equal([0, 0, 0, 0]);
        });

        it("should not mutate the original outer circle layout arrays", () => {
            getTypeSpecificProperties("doubleCircle", stateDrawCopy);

            expect(stateDrawCopy.currentLayoutOuterCircle.strokeColor).to.deep.equal([200, 0, 0]);
            expect(stateDrawCopy.currentLayoutOuterCircle.fillColor).to.deep.equal([0, 0, 0]);
        });

        it("should return font, fontSize, text, textAlign, and textBaseline for 'writeText' type", () => {
            const result = getTypeSpecificProperties("writeText", stateDrawCopy);

            expect(result).to.deep.equal({
                font: "Arial",
                fontSize: 10,
                text: "test text",
                textAlign: "center",
                textBaseline: "middle"
            });
        });

        it("should return empty object for 'point' type without selectedSymbol", () => {
            const result = getTypeSpecificProperties("point", stateDrawCopy);

            expect(result).to.deep.equal({});
        });

        it("should return empty object for 'pen' type", () => {
            const result = getTypeSpecificProperties("pen", stateDrawCopy);

            expect(result).to.deep.equal({});
        });

        it("should return empty object for 'box' type", () => {
            const result = getTypeSpecificProperties("box", stateDrawCopy);

            expect(result).to.deep.equal({});
        });

        it("should return empty object for 'polygon' type", () => {
            const result = getTypeSpecificProperties("polygon", stateDrawCopy);

            expect(result).to.deep.equal({});
        });

        it("should return empty object for 'square' type", () => {
            const result = getTypeSpecificProperties("square", stateDrawCopy);

            expect(result).to.deep.equal({});
        });

        it("should return empty object for unknown type without selectedSymbol", () => {
            stateDrawCopy.selectedSymbol = null;
            const result = getTypeSpecificProperties("unknownType", stateDrawCopy);

            expect(result).to.deep.equal({});
        });

        it("should return symbol properties for unknown type with selectedSymbol", () => {
            stateDrawCopy.selectedSymbol = {
                value: "my_icon.png",
                scale: 2,
                type: "image"
            };
            const result = getTypeSpecificProperties("unknownType", stateDrawCopy);

            expect(result.symbol).to.deep.equal({value: "my_icon.png", scale: 2});
            expect(result.pointSize).to.be.undefined;
        });

        it("should return pointSize 16 for unknown type with simple_point symbol", () => {
            stateDrawCopy.selectedSymbol = {
                value: "simple_point",
                scale: 1,
                type: "simple_point"
            };
            stateDrawCopy.currentLayout.fillColor = [55, 126, 184];
            const result = getTypeSpecificProperties("unknownType", stateDrawCopy);

            expect(result.pointSize).to.equal(16);
            expect(result.symbol).to.deep.equal({value: "simple_point", scale: 1});
            expect(result.color).to.deep.equal([55, 126, 184, 1]);
            expect(result.colorContour).to.deep.equal([55, 126, 184, 1]);
            expect(result.strokeWidth).to.equal(0);
        });

        it("should default symbol scale to 1 if not provided", () => {
            stateDrawCopy.selectedSymbol = {
                value: "my_icon.png",
                type: "image"
            };
            const result = getTypeSpecificProperties("unknownType", stateDrawCopy);

            expect(result.symbol.scale).to.equal(1);
        });

        it("should return empty object for undefined selectedDrawType without selectedSymbol", () => {
            const result = getTypeSpecificProperties(undefined, stateDrawCopy);

            expect(result).to.deep.equal({});
        });
    });
});
