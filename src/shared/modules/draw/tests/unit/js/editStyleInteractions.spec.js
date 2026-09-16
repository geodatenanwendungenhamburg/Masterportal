import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import Style from "ol/style/Style.js";

import {
    getFeatureEditType,
    extractEditableState,
    applyStyleChange
} from "@shared/modules/draw/js/editStyleInteractions.js";

describe("src/shared/modules/draw/js/editStyleInteractions.js", () => {
    describe("getFeatureEditType", () => {
        it("should return null for null feature", () => {
            expect(getFeatureEditType(null)).to.be.null;
        });

        it("should return null for feature without drawState or legacy drawType", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            expect(getFeatureEditType(feature)).to.be.null;
        });

        it("should return 'text' for writeText drawState", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {drawType: {id: "writeText", geometry: "Point"}, text: "Hello"}
            });

            expect(getFeatureEditType(feature)).to.equal("text");
        });

        it("should return 'icon' for symbol features with non-simple icon", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawSymbol", geometry: "Point"},
                    symbol: {value: "https://example.com/icon.svg", scale: 1}
                }
            });

            expect(getFeatureEditType(feature)).to.equal("icon");
        });

        it("should return 'point' for simple point features", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawSymbol", geometry: "Point"},
                    symbol: {value: "simple_point", scale: 1}
                }
            });

            expect(getFeatureEditType(feature)).to.equal("point");
        });

        it("should return 'point' for Point geometry without symbol", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {drawType: {id: "drawSymbol", geometry: "Point"}}
            });

            expect(getFeatureEditType(feature)).to.equal("point");
        });

        it("should return 'line' for LineString geometry", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {drawType: {id: "drawLine", geometry: "LineString"}}
            });

            expect(getFeatureEditType(feature)).to.equal("line");
        });

        it("should return 'line' for MultiLineString geometry", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {drawType: {id: "drawLine", geometry: "MultiLineString"}}
            });

            expect(getFeatureEditType(feature)).to.equal("line");
        });

        it("should return 'polygon' for Polygon geometry", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {drawType: {id: "drawArea", geometry: "Polygon"}}
            });

            expect(getFeatureEditType(feature)).to.equal("polygon");
        });

        it("should return 'polygon' for Square geometry", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {drawType: {id: "drawSquare", geometry: "Square"}}
            });

            expect(getFeatureEditType(feature)).to.equal("polygon");
        });

        it("should return 'circle' for Circle geometry", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {drawType: {id: "drawCircle", geometry: "Circle"}}
            });

            expect(getFeatureEditType(feature)).to.equal("circle");
        });

        it("should return 'text' for legacy drawType = 'writeText'", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("drawType", "writeText");

            expect(getFeatureEditType(feature)).to.equal("text");
        });
    });

    describe("extractEditableState", () => {
        it("should return null for null feature", () => {
            expect(extractEditableState(null)).to.be.null;
        });

        it("should return null for feature without drawState and without legacy drawType", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            expect(extractEditableState(feature)).to.be.null;
        });

        it("should extract text state from drawState", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "writeText", geometry: "Point"},
                    text: "Hello",
                    fontSize: 20,
                    font: "Calibri",
                    color: [255, 0, 0, 0.8],
                    strokeWidth: 1,
                    zIndex: 3
                }
            });

            const state = extractEditableState(feature);

            expect(state.editType).to.equal("text");
            expect(state.text).to.equal("Hello");
            expect(state.fontSize).to.equal(20);
            expect(state.font).to.equal("Calibri");
            expect(state.fillColor).to.equal("#ff0000");
            expect(state.fillTransparency).to.equal(20);
            expect(state.strokeWidth).to.equal(1);
            expect(state.zIndex).to.equal(3);
        });

        it("should extract icon state from drawState", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawSymbol", geometry: "Point"},
                    symbol: {value: "https://example.com/icon.svg", scale: 2},
                    strokeWidth: 1,
                    zIndex: 0
                }
            });

            const state = extractEditableState(feature);

            expect(state.editType).to.equal("icon");
            expect(state.iconScale).to.equal(2);
        });

        it("should extract point state from drawState", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawSymbol", geometry: "Point"},
                    color: [55, 126, 184, 0.5],
                    colorContour: [0, 0, 0, 1],
                    pointSize: 20,
                    strokeWidth: 2,
                    zIndex: 1
                }
            });

            const state = extractEditableState(feature);

            expect(state.editType).to.equal("point");
            expect(state.fillColor).to.equal("#377eb8");
            expect(state.fillTransparency).to.equal(50);
            expect(state.strokeColor).to.equal("#000000");
            expect(state.pointSize).to.equal(20);
            expect(state.strokeWidth).to.equal(2);
        });

        it("should extract line state from drawState", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawLine", geometry: "LineString"},
                    colorContour: [200, 0, 0, 0.7],
                    strokeWidth: 3,
                    zIndex: 2
                }
            });

            const state = extractEditableState(feature);

            expect(state.editType).to.equal("line");
            expect(state.strokeColor).to.equal("#c80000");
            expect(state.strokeTransparency).to.equal(30);
            expect(state.strokeWidth).to.equal(3);
        });

        it("should extract polygon state from drawState", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawArea", geometry: "Polygon"},
                    color: [0, 128, 255, 0.4],
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 2,
                    zIndex: 4
                }
            });

            const state = extractEditableState(feature);

            expect(state.editType).to.equal("polygon");
            expect(state.fillColor).to.equal("#0080ff");
            expect(state.fillTransparency).to.equal(60);
            expect(state.strokeColor).to.equal("#000000");
            expect(state.strokeWidth).to.equal(2);
        });

        it("should extract legacy text state from flat properties", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("drawType", "writeText");
            feature.set("textContent", "Legacy text");
            feature.set("textFontSize", 24);
            feature.set("textFont", "Times New Roman");
            feature.set("textFillColor", [0, 0, 255, 0.5]);

            const state = extractEditableState(feature);

            expect(state.editType).to.equal("text");
            expect(state.text).to.equal("Legacy text");
            expect(state.fontSize).to.equal(24);
            expect(state.font).to.equal("Times New Roman");
            expect(state.fillColor).to.equal("#0000ff");
            expect(state.fillTransparency).to.equal(50);
        });
    });

    describe("applyStyleChange", () => {
        it("should do nothing for null feature", () => {
            expect(() => applyStyleChange(null, {strokeWidth: 5})).to.not.throw();
        });

        it("should update strokeWidth on a polygon feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawArea", geometry: "Polygon"},
                    color: [0, 128, 255, 0.5],
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 2,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {strokeWidth: 5});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.strokeWidth).to.equal(5);
            expect(feature.getStyle()).to.be.instanceOf(Style);
            expect(feature.getStyle().getStroke().getWidth()).to.equal(5);
        });

        it("should update fillColor on a polygon feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawArea", geometry: "Polygon"},
                    color: [0, 128, 255, 0.5],
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 1,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {fillColor: "#ff0000"});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.color[0]).to.equal(255);
            expect(attrs.drawState.color[1]).to.equal(0);
            expect(attrs.drawState.color[2]).to.equal(0);
            expect(attrs.drawState.color[3]).to.equal(0.5);
        });

        it("should update fillTransparency on a polygon feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawArea", geometry: "Polygon"},
                    color: [0, 128, 255, 0.5],
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 1,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {fillTransparency: 80});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.color[3]).to.be.closeTo(0.2, 0.01);
        });

        it("should update text on a text feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "writeText", geometry: "Point"},
                    text: "Old text",
                    fontSize: 16,
                    font: "Arial",
                    color: [0, 0, 0, 1],
                    strokeWidth: 1,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {text: "New text"});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.text).to.equal("New text");
            expect(feature.getStyle().getText().getText()).to.equal("New text");
        });

        it("should update fontSize on a text feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "writeText", geometry: "Point"},
                    text: "Hello",
                    fontSize: 16,
                    font: "Arial",
                    color: [0, 0, 0, 1],
                    strokeWidth: 1,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {fontSize: 24});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.fontSize).to.equal(24);
            expect(feature.getStyle().getText().getFont()).to.equal("24px Arial");
        });

        it("should update iconScale on an icon feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawSymbol", geometry: "Point"},
                    symbol: {value: "https://example.com/icon.svg", scale: 1},
                    strokeWidth: 1,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {iconScale: 3});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.symbol.scale).to.equal(3);
            expect(feature.getStyle().getImage().getScale()).to.equal(3);
        });

        it("should update pointSize on a simple point feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawSymbol", geometry: "Point"},
                    color: [55, 126, 184, 1],
                    colorContour: [0, 0, 0, 1],
                    pointSize: 16,
                    strokeWidth: 1,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {pointSize: 32});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.pointSize).to.equal(32);
            expect(feature.getStyle().getImage().getRadius()).to.equal(16);
        });

        it("should update strokeColor on a line feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawLine", geometry: "LineString"},
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 2,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {strokeColor: "#ff0000"});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.colorContour[0]).to.equal(255);
            expect(attrs.drawState.colorContour[1]).to.equal(0);
            expect(attrs.drawState.colorContour[2]).to.equal(0);
        });

        it("should update strokeTransparency on a line feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("masterportal_attributes", {
                drawState: {
                    drawType: {id: "drawLine", geometry: "LineString"},
                    colorContour: [0, 0, 0, 1],
                    strokeWidth: 2,
                    zIndex: 0
                }
            });

            applyStyleChange(feature, {strokeTransparency: 50});

            const attrs = feature.get("masterportal_attributes");

            expect(attrs.drawState.colorContour[3]).to.be.closeTo(0.5, 0.01);
        });

        it("should handle legacy text features without drawState", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            feature.set("drawType", "writeText");
            feature.set("textContent", "Old");
            feature.set("textFontSize", 16);
            feature.set("textFont", "Arial");
            feature.set("textFillColor", [0, 0, 0, 1]);

            applyStyleChange(feature, {text: "Updated"});

            expect(feature.get("textContent")).to.equal("Updated");
        });
    });
});
