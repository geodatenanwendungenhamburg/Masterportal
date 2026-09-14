import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import GeometryCollection from "ol/geom/GeometryCollection.js";
import LineString from "ol/geom/LineString.js";
import MultiLineString from "ol/geom/MultiLineString.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import {
    createSelectInteractions,
    setupDeleteInteraction,
    deleteAllFeatures,
    getLastCoordinate,
    performUndo,
    performRedo,
    handleDeleteAll,
    applyTextEditToFeature,
    setTooltipPosition,
    toggleLayerVisibility,
    isDeleteAllMode
} from "@shared/modules/draw/js/editInteractions.js";

describe("src/shared/modules/draw/js/editInteractions.js", () => {
    let source,
        layer;

    beforeEach(() => {
        source = new VectorSource();
        layer = new VectorLayer({source});
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("createSelectInteractions", () => {
        it("should return an array with two select interactions", () => {
            const interactions = createSelectInteractions(layer);

            expect(interactions).to.be.an("array");
            expect(interactions).to.have.lengthOf(2);
        });
    });

    describe("setupDeleteInteraction", () => {
        it("should remove existing select interactions and create new ones", () => {
            const removeInteraction = sinon.spy(),
                addInteraction = sinon.spy(),
                oldInteraction = {fake: true},
                result = setupDeleteInteraction({
                    currentSelectInteractions: [oldInteraction],
                    layer,
                    source,
                    addInteraction,
                    removeInteraction
                });

            expect(removeInteraction.calledOnce).to.be.true;
            expect(removeInteraction.firstCall.args[0]).to.deep.equal(oldInteraction);
            expect(addInteraction.calledTwice).to.be.true;
            expect(result).to.be.an("array");
            expect(result).to.have.lengthOf(2);
        });

        it("should handle empty currentSelectInteractions", () => {
            const removeInteraction = sinon.spy(),
                addInteraction = sinon.spy(),
                result = setupDeleteInteraction({
                    currentSelectInteractions: [],
                    layer,
                    source,
                    addInteraction,
                    removeInteraction
                });

            expect(removeInteraction.notCalled).to.be.true;
            expect(addInteraction.calledTwice).to.be.true;
            expect(result).to.have.lengthOf(2);
        });
    });

    describe("deleteAllFeatures", () => {
        it("should push all features to undo stack and clear the source", () => {
            const feature1 = new Feature(),
                feature2 = new Feature(),
                undoFeatures = [];

            source.addFeatures([feature1, feature2]);
            deleteAllFeatures(source, undoFeatures);

            expect(undoFeatures).to.have.lengthOf(1);
            expect(undoFeatures[0]).to.have.lengthOf(2);
            expect(source.getFeatures()).to.have.lengthOf(0);
        });

        it("should push an empty array when source has no features", () => {
            const undoFeatures = [];

            deleteAllFeatures(source, undoFeatures);

            expect(undoFeatures).to.have.lengthOf(1);
            expect(undoFeatures[0]).to.have.lengthOf(0);
            expect(source.getFeatures()).to.have.lengthOf(0);
        });
    });

    describe("performUndo", () => {
        it("should remove a drawn feature from source on undo", () => {
            const feature = new Feature(),
                undoFeatures = [{feature, mode: "draw"}],
                redoFeatures = [];

            source.addFeature(feature);
            performUndo(undoFeatures, redoFeatures, source, sinon.spy());

            expect(source.getFeatures()).to.have.lengthOf(0);
            expect(redoFeatures).to.have.lengthOf(1);
            expect(redoFeatures[0].mode).to.equal("draw");
        });

        it("should add a deleted feature back to source on undo", () => {
            const feature = new Feature(),
                undoFeatures = [{feature, mode: "delete"}],
                redoFeatures = [];

            performUndo(undoFeatures, redoFeatures, source, sinon.spy());

            expect(source.getFeatures()).to.have.lengthOf(1);
            expect(redoFeatures).to.have.lengthOf(1);
        });

        it("should do nothing with empty undo stack", () => {
            const undoFeatures = [],
                redoFeatures = [],
                deleteAllHandler = sinon.spy();

            performUndo(undoFeatures, redoFeatures, source, deleteAllHandler);

            expect(redoFeatures).to.have.lengthOf(0);
            expect(deleteAllHandler.notCalled).to.be.true;
        });
    });

    describe("performRedo", () => {
        it("should add a drawn feature back to source on redo", () => {
            const feature = new Feature(),
                redoFeatures = [{feature, mode: "draw"}],
                undoFeatures = [];

            performRedo(redoFeatures, undoFeatures, source, sinon.spy());

            expect(source.getFeatures()).to.have.lengthOf(1);
            expect(undoFeatures).to.have.lengthOf(1);
        });

        it("should remove a deleted feature from source on redo", () => {
            const feature = new Feature(),
                redoFeatures = [{feature, mode: "delete"}],
                undoFeatures = [];

            source.addFeature(feature);
            performRedo(redoFeatures, undoFeatures, source, sinon.spy());

            expect(source.getFeatures()).to.have.lengthOf(0);
            expect(undoFeatures).to.have.lengthOf(1);
        });

        it("should do nothing with empty redo stack", () => {
            const redoFeatures = [],
                undoFeatures = [],
                deleteAllHandler = sinon.spy();

            performRedo(redoFeatures, undoFeatures, source, deleteAllHandler);

            expect(undoFeatures).to.have.lengthOf(0);
            expect(deleteAllHandler.notCalled).to.be.true;
        });
    });

    describe("handleDeleteAll", () => {
        it("should restore features on undo", () => {
            const feature1 = new Feature(),
                feature2 = new Feature(),
                features = [[feature1, feature2]],
                undoFeatures = [],
                redoFeatures = [];

            handleDeleteAll("undo", features, source, undoFeatures, redoFeatures);

            expect(source.getFeatures()).to.have.lengthOf(2);
            expect(redoFeatures).to.have.lengthOf(1);
            expect(redoFeatures[0]).to.deep.equal([feature1, feature2]);
        });

        it("should remove features on redo", () => {
            const feature1 = new Feature(),
                feature2 = new Feature(),
                features = [[feature1, feature2]],
                undoFeatures = [],
                redoFeatures = [];

            source.addFeatures([feature1, feature2]);
            handleDeleteAll("redo", features, source, undoFeatures, redoFeatures);

            expect(source.getFeatures()).to.have.lengthOf(0);
            expect(undoFeatures).to.have.lengthOf(1);
            expect(undoFeatures[0]).to.deep.equal([feature1, feature2]);
        });
    });

    describe("applyTextEditToFeature", () => {
        it("should do nothing if feature is null", () => {
            expect(() => applyTextEditToFeature({
                feature: null,
                text: "test",
                fontSize: 16,
                font: "Arial",
                fillColor: "#000000",
                fillTransparency: 0
            })).to.not.throw();
        });

        it("should set text attributes on the feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            applyTextEditToFeature({
                feature,
                text: "Hello",
                fontSize: 20,
                font: "Arial",
                fillColor: "#ff0000",
                fillTransparency: 0
            });

            expect(feature.get("textContent")).to.equal("Hello");
            expect(feature.get("textFontSize")).to.equal(20);
            expect(feature.get("textFont")).to.equal("Arial");
        });

        it("should calculate alpha correctly from fillTransparency", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            applyTextEditToFeature({
                feature,
                text: "Test",
                fontSize: 16,
                font: "Arial",
                fillColor: "#000000",
                fillTransparency: 50
            });

            const colorArray = feature.get("textFillColor");

            expect(colorArray[3]).to.equal(0.5);
        });

        it("should set style on the feature", () => {
            const feature = new Feature({geometry: new Point([0, 0])});

            applyTextEditToFeature({
                feature,
                text: "Styled",
                fontSize: 24,
                font: "Times New Roman",
                fillColor: "#00ff00",
                fillTransparency: 0
            });

            const style = feature.getStyle();

            expect(style).to.not.be.null;
            expect(style.getText().getText()).to.equal("Styled");
            expect(style.getText().getFont()).to.equal("24px Times New Roman");
        });
    });

    describe("toggleLayerVisibility", () => {
        it("should toggle visibility from true to false", () => {
            const result = toggleLayerVisibility(layer);

            expect(result).to.be.false;
            expect(layer.getVisible()).to.be.false;
        });

        it("should toggle visibility from false to true", () => {
            layer.setVisible(false);
            const result = toggleLayerVisibility(layer);

            expect(result).to.be.true;
            expect(layer.getVisible()).to.be.true;
        });

        it("should return true if layer is null", () => {
            const result = toggleLayerVisibility(null);

            expect(result).to.be.true;
        });
    });

    describe("isDeleteAllMode", () => {
        it("should return true for an array", () => {
            expect(isDeleteAllMode([{}, {}])).to.be.true;
        });

        it("should return false for an object", () => {
            expect(isDeleteAllMode({mode: "draw"})).to.be.false;
        });

        it("should return false for null", () => {
            expect(isDeleteAllMode(null)).to.be.false;
        });
    });

    describe("getLastCoordinate", () => {
        it("should return the last coordinate of a LineString", () => {
            const geometry = new LineString([[0, 0], [10, 20], [30, 40]]);

            expect(getLastCoordinate(geometry)).to.deep.equal([30, 40]);
        });

        it("should return the last coordinate of the outer ring of a Polygon", () => {
            const geometry = new Polygon([[[0, 0], [10, 0], [10, 10], [0, 0]]]);

            expect(getLastCoordinate(geometry)).to.deep.equal([0, 0]);
        });

        it("should return a flat coordinate for a MultiPolygon instead of a nested array", () => {
            const geometry = new MultiPolygon([
                [[[0, 0], [10, 0], [10, 10], [0, 0]]],
                [[[20, 20], [30, 20], [30, 30], [20, 20]]]
            ]);

            expect(getLastCoordinate(geometry)).to.deep.equal([20, 20]);
        });

        it("should return a flat coordinate for a MultiLineString instead of a nested array", () => {
            const geometry = new MultiLineString([
                [[0, 0], [10, 10]],
                [[20, 20], [30, 30]]
            ]);

            expect(getLastCoordinate(geometry)).to.deep.equal([30, 30]);
        });

        it("should drop the third value of geometries with an XYZ layout", () => {
            const geometry = new MultiPolygon([
                [[[0, 0, 5], [10, 0, 5], [10, 10, 5], [0, 0, 5]]]
            ], "XYZ");

            expect(getLastCoordinate(geometry)).to.deep.equal([0, 0]);
        });

        it("should return null for an empty geometry", () => {
            expect(getLastCoordinate(new MultiPolygon([]))).to.be.null;
        });

        it("should return null for a geometry without flat coordinates", () => {
            const geometry = new GeometryCollection([new Point([10, 20])]);

            expect(getLastCoordinate(geometry)).to.be.null;
        });

        it("should return null if a coordinate value is not finite", () => {
            const geometry = new LineString([[0, 0], [NaN, 40]]);

            expect(getLastCoordinate(geometry)).to.be.null;
        });
    });

    describe("setTooltipPosition", () => {
        let tooltipElement,
            tooltipOverlay;

        beforeEach(() => {
            tooltipElement = {style: {display: "block"}};
            tooltipOverlay = {setPosition: sinon.spy()};
        });

        it("should set the given coordinate as position and keep the tooltip visible", () => {
            setTooltipPosition([10, 20], tooltipElement, tooltipOverlay);

            expect(tooltipOverlay.setPosition.calledOnceWithExactly([10, 20])).to.be.true;
            expect(tooltipElement.style.display).to.equal("block");
        });

        it("should reset the position and hide the tooltip if no coordinate is given", () => {
            setTooltipPosition(null, tooltipElement, tooltipOverlay);

            expect(tooltipOverlay.setPosition.calledOnceWithExactly(undefined)).to.be.true;
            expect(tooltipElement.style.display).to.equal("none");
        });
    });
});
