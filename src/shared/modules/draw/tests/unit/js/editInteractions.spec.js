import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import {
    createSelectInteractions,
    setupDeleteInteraction,
    deleteAllFeatures,
    performUndo,
    performRedo,
    handleDeleteAll,
    applyTextEditToFeature,
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
});
