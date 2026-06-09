import {expect} from "chai";
import sinon from "sinon";
import undoRedoFeatures, {isDeleteAllMode} from "@shared/modules/draw/js/undoRedoFeatures.js";

describe("src/shared/modules/draw/js/undoRedoFeatures.js", () => {
    let source,
        stack,
        deleteAllHandler;

    beforeEach(() => {
        source = {
            addFeature: sinon.spy(),
            removeFeature: sinon.spy()
        };
        stack = [];
        deleteAllHandler = sinon.spy();
    });

    describe("isDeleteAllMode", () => {
        it("should return true if the entry is an array", () => {
            expect(isDeleteAllMode([{}, {}])).to.be.true;
        });

        it("should return true for an empty array", () => {
            expect(isDeleteAllMode([])).to.be.true;
        });

        it("should return false if the entry is an object", () => {
            expect(isDeleteAllMode({mode: "draw", feature: {}})).to.be.false;
        });

        it("should return false for undefined", () => {
            expect(isDeleteAllMode(undefined)).to.be.false;
        });

        it("should return false for null", () => {
            expect(isDeleteAllMode(null)).to.be.false;
        });

        it("should return false for a string", () => {
            expect(isDeleteAllMode("feature")).to.be.false;
        });
    });

    describe("undoRedoFeatures", () => {
        it("should do nothing if features array is empty", () => {
            const features = [];

            undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

            expect(stack).to.have.lengthOf(0);
            expect(source.addFeature.notCalled).to.be.true;
            expect(source.removeFeature.notCalled).to.be.true;
            expect(deleteAllHandler.notCalled).to.be.true;
        });

        it("should call deleteAllHandler for deleteAll entries", () => {
            const features = [["feat1", "feat2"]];

            undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

            expect(deleteAllHandler.calledOnce).to.be.true;
            expect(deleteAllHandler.firstCall.args[0]).to.equal("undo");
            expect(deleteAllHandler.firstCall.args[1]).to.deep.equal(features);
            expect(deleteAllHandler.firstCall.args[2]).to.equal(source);
        });

        it("should not pop features when delegating to deleteAllHandler", () => {
            const features = [["feat1", "feat2"]];

            undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

            expect(features).to.have.lengthOf(1);
        });

        describe("draw mode", () => {
            it("should remove feature from source on undo", () => {
                const mockFeature = {id: "f1"},
                    features = [{feature: mockFeature, mode: "draw"}];

                undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

                expect(source.removeFeature.calledOnceWith(mockFeature)).to.be.true;
                expect(source.addFeature.notCalled).to.be.true;
                expect(features).to.have.lengthOf(0);
                expect(stack).to.have.lengthOf(1);
                expect(stack[0].mode).to.equal("draw");
            });

            it("should add feature to source on redo", () => {
                const mockFeature = {id: "f1"},
                    features = [{feature: mockFeature, mode: "draw"}];

                undoRedoFeatures(features, stack, "redo", source, deleteAllHandler);

                expect(source.addFeature.calledOnceWith(mockFeature)).to.be.true;
                expect(source.removeFeature.notCalled).to.be.true;
                expect(features).to.have.lengthOf(0);
                expect(stack).to.have.lengthOf(1);
                expect(stack[0].mode).to.equal("draw");
            });

            it("should only process the last entry in the features stack", () => {
                const feat1 = {id: "f1"},
                    feat2 = {id: "f2"},
                    features = [
                        {feature: feat1, mode: "draw"},
                        {feature: feat2, mode: "draw"}
                    ];

                undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

                expect(source.removeFeature.calledOnceWith(feat2)).to.be.true;
                expect(features).to.have.lengthOf(1);
                expect(features[0].feature).to.equal(feat1);
            });
        });

        describe("delete mode", () => {
            it("should add feature to source on undo", () => {
                const mockFeature = {id: "f1"},
                    features = [{feature: mockFeature, mode: "delete"}];

                undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

                expect(source.addFeature.calledOnceWith(mockFeature)).to.be.true;
                expect(source.removeFeature.notCalled).to.be.true;
                expect(features).to.have.lengthOf(0);
                expect(stack[0].mode).to.equal("delete");
            });

            it("should remove feature from source on redo", () => {
                const mockFeature = {id: "f1"},
                    features = [{feature: mockFeature, mode: "delete"}];

                undoRedoFeatures(features, stack, "redo", source, deleteAllHandler);

                expect(source.removeFeature.calledOnceWith(mockFeature)).to.be.true;
                expect(source.addFeature.notCalled).to.be.true;
                expect(features).to.have.lengthOf(0);
                expect(stack[0].mode).to.equal("delete");
            });
        });

        describe("modify mode", () => {
            let mockFeature,
                originalGeometry,
                modifiedGeometry;

            beforeEach(() => {
                originalGeometry = {type: "original"};
                modifiedGeometry = {type: "modified"};
                mockFeature = {
                    id: "f1",
                    setGeometry: sinon.spy(),
                    changed: sinon.spy()
                };
            });

            it("should restore original geometry on undo", () => {
                const features = [{
                    feature: mockFeature,
                    mode: "modify",
                    originalGeometry,
                    modifiedGeometry
                }];

                undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

                expect(source.removeFeature.calledOnceWith(mockFeature)).to.be.true;
                expect(mockFeature.setGeometry.calledOnceWith(originalGeometry)).to.be.true;
                expect(source.addFeature.calledOnceWith(mockFeature)).to.be.true;
                expect(features).to.have.lengthOf(0);
                expect(stack[0].mode).to.equal("modify");
                expect(stack[0].originalGeometry).to.equal(originalGeometry);
                expect(stack[0].modifiedGeometry).to.equal(modifiedGeometry);
            });

            it("should apply modified geometry on redo", () => {
                const features = [{
                    feature: mockFeature,
                    mode: "modify",
                    originalGeometry,
                    modifiedGeometry
                }];

                undoRedoFeatures(features, stack, "redo", source, deleteAllHandler);

                expect(mockFeature.setGeometry.calledOnceWith(modifiedGeometry)).to.be.true;
                expect(mockFeature.changed.calledOnce).to.be.true;
                expect(features).to.have.lengthOf(0);
                expect(stack[0].mode).to.equal("modify");
            });

            it("should not add/remove feature from source on redo", () => {
                const features = [{
                    feature: mockFeature,
                    mode: "modify",
                    originalGeometry,
                    modifiedGeometry
                }];

                undoRedoFeatures(features, stack, "redo", source, deleteAllHandler);

                expect(source.removeFeature.notCalled).to.be.true;
                expect(source.addFeature.notCalled).to.be.true;
            });
        });

        describe("drawGroup mode", () => {
            it("should remove all grouped features from source on undo", () => {
                const feat1 = {id: "f1"},
                    feat2 = {id: "f2"},
                    features = [{features: [feat1, feat2], mode: "drawGroup"}];

                undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

                expect(source.removeFeature.calledTwice).to.be.true;
                expect(source.removeFeature.firstCall.args[0]).to.equal(feat1);
                expect(source.removeFeature.secondCall.args[0]).to.equal(feat2);
                expect(features).to.have.lengthOf(0);
                expect(stack).to.have.lengthOf(1);
            });

            it("should add all grouped features to source on redo", () => {
                const feat1 = {id: "f1"},
                    feat2 = {id: "f2"},
                    features = [{features: [feat1, feat2], mode: "drawGroup"}];

                undoRedoFeatures(features, stack, "redo", source, deleteAllHandler);

                expect(source.addFeature.calledTwice).to.be.true;
                expect(source.addFeature.firstCall.args[0]).to.equal(feat1);
                expect(source.addFeature.secondCall.args[0]).to.equal(feat2);
                expect(features).to.have.lengthOf(0);
                expect(stack).to.have.lengthOf(1);
            });

            it("should push the entire entry onto the stack", () => {
                const entry = {features: [{id: "f1"}], mode: "drawGroup"},
                    features = [entry];

                undoRedoFeatures(features, stack, "undo", source, deleteAllHandler);

                expect(stack[0]).to.equal(entry);
            });
        });
    });
});
