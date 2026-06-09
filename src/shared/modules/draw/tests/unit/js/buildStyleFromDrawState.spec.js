import {expect} from "chai";
import Style from "ol/style/Style.js";

import buildStyleFromDrawState, {buildOuterCircleStyle} from "@shared/modules/draw/js/buildStyleFromDrawState.js";

describe("src/shared/modules/draw/js/buildStyleFromDrawState.js", () => {
    describe("buildStyleFromDrawState", () => {
        it("should return null if drawState is null", () => {
            expect(buildStyleFromDrawState(null)).to.be.null;
        });

        it("should return null if drawState is undefined", () => {
            expect(buildStyleFromDrawState(undefined)).to.be.null;
        });

        it("should return null if geometry type is unknown", () => {
            const result = buildStyleFromDrawState({drawType: {geometry: "Unknown"}});

            expect(result).to.be.null;
        });

        describe("Point - text", () => {
            it("should build a text style for writeText features", () => {
                const drawState = {
                        drawType: {id: "writeText", geometry: "Point"},
                        text: "Hello World",
                        fontSize: 20,
                        font: "Arial",
                        color: [255, 0, 0, 1],
                        zIndex: 5
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getText().getText()).to.equal("Hello World");
                expect(style.getText().getFont()).to.equal("20px Arial");
                expect(style.getText().getFill().getColor()).to.deep.equal([255, 0, 0, 1]);
                expect(style.getZIndex()).to.equal(5);
            });

            it("should use defaults for missing text properties", () => {
                const drawState = {
                        drawType: {id: "writeText", geometry: "Point"},
                        text: "Test"
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style.getText().getFont()).to.equal("16px Arial");
                expect(style.getText().getFill().getColor()).to.deep.equal([0, 0, 0, 1]);
            });

            it("should set textAlign and textBaseline", () => {
                const drawState = {
                        drawType: {id: "writeText", geometry: "Point"},
                        text: "Aligned",
                        textAlign: "center",
                        textBaseline: "top"
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style.getText().getTextAlign()).to.equal("center");
                expect(style.getText().getTextBaseline()).to.equal("top");
            });
        });

        describe("Point - icon/symbol", () => {
            it("should build an icon style for symbol features with full URL", () => {
                const drawState = {
                        drawType: {id: "drawSymbol", geometry: "Point"},
                        symbol: {value: "https://example.com/icon.svg", scale: 2},
                        zIndex: 3
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getImage().getSrc()).to.equal("https://example.com/icon.svg");
                expect(style.getImage().getScale()).to.equal(2);
                expect(style.getZIndex()).to.equal(3);
            });

            it("should prepend imgPath for relative symbol values", () => {
                const drawState = {
                        drawType: {id: "drawSymbol", geometry: "Point"},
                        symbol: {value: "icon.svg", scale: 1},
                        imgPath: "https://cdn.example.com/img/"
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style.getImage().getSrc()).to.equal("https://cdn.example.com/img/icon.svg");
            });

            it("should default scale to 1 if not provided", () => {
                const drawState = {
                        drawType: {id: "drawSymbol", geometry: "Point"},
                        symbol: {value: "https://example.com/icon.svg"},
                        imgPath: ""
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style.getImage().getScale()).to.equal(1);
            });
        });

        describe("Point - simple point", () => {
            it("should build a circle marker style for simple points", () => {
                const drawState = {
                        drawType: {id: "drawSymbol", geometry: "Point"},
                        color: [55, 126, 184, 1],
                        colorContour: [0, 0, 0, 1],
                        pointSize: 20,
                        strokeWidth: 2,
                        zIndex: 1
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getImage().getRadius()).to.equal(10);
                expect(style.getImage().getFill().getColor()).to.deep.equal([55, 126, 184, 1]);
                expect(style.getZIndex()).to.equal(1);
            });

            it("should use defaults for missing point properties", () => {
                const drawState = {
                        drawType: {id: "drawSymbol", geometry: "Point"},
                        symbol: {value: "simple_point"}
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style.getImage().getRadius()).to.equal(8);
            });
        });

        describe("LineString", () => {
            it("should build a stroke-only style for lines", () => {
                const drawState = {
                        drawType: {id: "drawLine", geometry: "LineString"},
                        colorContour: [200, 0, 0, 0.8],
                        strokeWidth: 3,
                        zIndex: 2
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getStroke().getColor()).to.deep.equal([200, 0, 0, 0.8]);
                expect(style.getStroke().getWidth()).to.equal(3);
                expect(style.getFill()).to.be.null;
                expect(style.getZIndex()).to.equal(2);
            });

            it("should handle MultiLineString geometry", () => {
                const drawState = {
                        drawType: {id: "drawLine", geometry: "MultiLineString"},
                        colorContour: [0, 0, 0, 1],
                        strokeWidth: 1
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getStroke()).to.not.be.null;
            });
        });

        describe("Polygon", () => {
            it("should build a fill+stroke style for polygons", () => {
                const drawState = {
                        drawType: {id: "drawArea", geometry: "Polygon"},
                        color: [55, 126, 184, 0.5],
                        colorContour: [0, 0, 0, 1],
                        strokeWidth: 2,
                        zIndex: 4
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getStroke().getColor()).to.deep.equal([0, 0, 0, 1]);
                expect(style.getStroke().getWidth()).to.equal(2);
                expect(style.getFill().getColor()).to.deep.equal([55, 126, 184, 0.5]);
                expect(style.getZIndex()).to.equal(4);
            });

            it("should handle MultiPolygon geometry", () => {
                const drawState = {
                        drawType: {id: "drawArea", geometry: "MultiPolygon"},
                        color: [0, 0, 0, 0.3],
                        colorContour: [0, 0, 0, 1],
                        strokeWidth: 1
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getFill()).to.not.be.null;
                expect(style.getStroke()).to.not.be.null;
            });
        });

        describe("Circle", () => {
            it("should build a fill+stroke style for circles", () => {
                const drawState = {
                        drawType: {id: "drawCircle", geometry: "Circle"},
                        color: [100, 200, 50, 0.4],
                        colorContour: [0, 0, 0, 1],
                        strokeWidth: 2,
                        circleRadius: 500,
                        zIndex: 6
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getStroke().getColor()).to.deep.equal([0, 0, 0, 1]);
                expect(style.getFill().getColor()).to.deep.equal([100, 200, 50, 0.4]);
                expect(style.getZIndex()).to.equal(6);
            });
        });

        describe("Square", () => {
            it("should build a polygon-like style for squares", () => {
                const drawState = {
                        drawType: {id: "drawSquare", geometry: "Square"},
                        color: [0, 255, 0, 0.5],
                        colorContour: [0, 0, 0, 1],
                        strokeWidth: 1,
                        zIndex: 1
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style).to.be.instanceOf(Style);
                expect(style.getFill().getColor()).to.deep.equal([0, 255, 0, 0.5]);
                expect(style.getStroke().getWidth()).to.equal(1);
            });
        });

        describe("defaults", () => {
            it("should default strokeWidth to 1", () => {
                const drawState = {
                        drawType: {id: "drawLine", geometry: "LineString"},
                        colorContour: [0, 0, 0, 1]
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style.getStroke().getWidth()).to.equal(1);
            });

            it("should default zIndex to 0", () => {
                const drawState = {
                        drawType: {id: "drawArea", geometry: "Polygon"},
                        color: [0, 0, 0, 0.5],
                        colorContour: [0, 0, 0, 1]
                    },
                    style = buildStyleFromDrawState(drawState);

                expect(style.getZIndex()).to.equal(0);
            });
        });
    });

    describe("buildOuterCircleStyle", () => {
        it("should return null if drawState is null", () => {
            expect(buildOuterCircleStyle(null)).to.be.null;
        });

        it("should return null if circleOuterRadius is not set", () => {
            const drawState = {
                drawType: {id: "drawCircle", geometry: "Circle"},
                colorContour: [0, 0, 0, 1]
            };

            expect(buildOuterCircleStyle(drawState)).to.be.null;
        });

        it("should build an outer circle style when circleOuterRadius is set", () => {
            const drawState = {
                    drawType: {id: "drawCircle", geometry: "Circle"},
                    circleOuterRadius: 1000,
                    outerColorContour: [200, 0, 0, 1],
                    outerColorFill: [200, 0, 0, 0.1],
                    strokeWidth: 2,
                    zIndex: 7
                },
                style = buildOuterCircleStyle(drawState);

            expect(style).to.be.instanceOf(Style);
            expect(style.getStroke().getColor()).to.deep.equal([200, 0, 0, 1]);
            expect(style.getStroke().getWidth()).to.equal(2);
            expect(style.getFill().getColor()).to.deep.equal([200, 0, 0, 0.1]);
            expect(style.getZIndex()).to.equal(7);
        });

        it("should fall back to colorContour if outerColorContour is not set", () => {
            const drawState = {
                    drawType: {id: "drawCircle", geometry: "Circle"},
                    circleOuterRadius: 500,
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 1
                },
                style = buildOuterCircleStyle(drawState);

            expect(style.getStroke().getColor()).to.deep.equal([0, 0, 0, 1]);
        });
    });
});
