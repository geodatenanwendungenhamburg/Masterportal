import {expect} from "chai";
import sinon from "sinon";
import makeDraw from "../../../js/measureDraw.js";
import source from "../../../js/measureSource.js";

describe("src/modules/measure/js/measureDraw.js", () => {
    let context,
        addFeatureStub,
        setIsDrawingStub,
        setFeatureIdStub,
        setTooltipCoordStub,
        drawInteraction,
        sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        addFeatureStub = sandbox.stub();
        setIsDrawingStub = sandbox.stub();
        setFeatureIdStub = sandbox.stub();
        setTooltipCoordStub = sandbox.stub();

        context = {
            state: {
                color: [255, 127, 0, 1.0]
            }
        };
    });

    afterEach(() => {
        if (drawInteraction) {
            drawInteraction.dispose();
            drawInteraction = null;
        }
        sandbox.restore();
        source.clear();
    });

    describe("makeDraw", () => {
        it("should create a Draw interaction for LineString", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            expect(drawInteraction).to.exist;
            expect(drawInteraction.constructor.name).to.equal("Draw");
        });

        it("should create a Draw interaction for Polygon", () => {
            drawInteraction = makeDraw(
                context,
                "Polygon",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            expect(drawInteraction).to.exist;
            expect(drawInteraction.constructor.name).to.equal("Draw");
        });

        it("should use the provided source", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const interactionSource = drawInteraction.source_;

            expect(interactionSource).to.equal(source);
        });

        it("should use the correct geometry type", () => {
            drawInteraction = makeDraw(
                context,
                "Polygon",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            expect(drawInteraction.type_).to.equal("Polygon");
        });

        it("should apply custom style from state color", () => {
            context.state.color = [255, 0, 0, 0.5];

            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            expect(drawInteraction.overlay_).to.exist;
        });
    });

    describe("drawstart event", () => {
        it("should call addFeature with sketch feature on drawstart", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            expect(addFeatureStub.calledOnce).to.be.true;
            expect(addFeatureStub.firstCall.args[0]).to.equal(mockFeature);
        });

        it("should set isBeingDrawn property to true on sketch", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const setStub = sandbox.stub();
            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: setStub,
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            expect(setStub.calledWith("isBeingDrawn", true)).to.be.true;
        });

        it("should call setFeatureId with feature ol_uid", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const mockFeature = {
                ol_uid: "unique_feature_id",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            expect(setFeatureIdStub.calledOnce).to.be.true;
            expect(setFeatureIdStub.firstCall.args[0]).to.equal("unique_feature_id");
        });

        it("should call setIsDrawing with true", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            expect(setIsDrawingStub.calledOnce).to.be.true;
            expect(setIsDrawingStub.firstCall.args[0]).to.be.true;
        });

        it("should register change listener on LineString geometry", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const onStub = sandbox.stub();
            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: onStub,
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            expect(onStub.calledWith("change")).to.be.true;
        });

        it("should register change listener on Polygon geometry", () => {
            drawInteraction = makeDraw(
                context,
                "Polygon",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const onStub = sandbox.stub();
            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "Polygon",
                    on: onStub,
                    un: sandbox.stub(),
                    getCoordinates: () => [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            expect(onStub.calledWith("change")).to.be.true;
        });
    });

    describe("geometry change listener - LineString", () => {
        it("should call setTooltipCoord with last coordinate for LineString", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            let changeListener = null;
            const onStub = sandbox.stub().callsFake((event, listener) => {
                if (event === "change") {
                    changeListener = listener;
                }
            });

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: onStub,
                    un: sandbox.stub(),
                    getLastCoordinate: () => [150, 250]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            // Simulate geometry change
            if (changeListener) {
                changeListener({
                    target: {
                        getLastCoordinate: () => [150, 250]
                    }
                });
            }

            expect(setTooltipCoordStub.calledWith([150, 250])).to.be.true;
        });

        it("should call addFeature on geometry change for LineString", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            let changeListener = null;
            const onStub = sandbox.stub().callsFake((event, listener) => {
                if (event === "change") {
                    changeListener = listener;
                }
            });

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: onStub,
                    un: sandbox.stub(),
                    getLastCoordinate: () => [150, 250]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            addFeatureStub.resetHistory();

            // Simulate geometry change
            if (changeListener) {
                changeListener({
                    target: {
                        getLastCoordinate: () => [150, 250]
                    }
                });
            }

            expect(addFeatureStub.calledOnce).to.be.true;
        });
    });

    describe("geometry change listener - Polygon", () => {
        it("should call setTooltipCoord with second-to-last coordinate for Polygon", () => {
            drawInteraction = makeDraw(
                context,
                "Polygon",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            let changeListener = null;
            const onStub = sandbox.stub().callsFake((event, listener) => {
                if (event === "change") {
                    changeListener = listener;
                }
            });

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "Polygon",
                    on: onStub,
                    un: sandbox.stub(),
                    getCoordinates: () => [[[0, 0], [100, 0], [100, 100], [50, 75], [0, 0]]]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            // Simulate geometry change
            if (changeListener) {
                changeListener({
                    target: {
                        getCoordinates: () => [[[0, 0], [100, 0], [100, 100], [50, 75], [0, 0]]]
                    }
                });
            }

            expect(setTooltipCoordStub.calledWith([50, 75])).to.be.true;
        });

        it("should call addFeature on geometry change for Polygon", () => {
            drawInteraction = makeDraw(
                context,
                "Polygon",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            let changeListener = null;
            const onStub = sandbox.stub().callsFake((event, listener) => {
                if (event === "change") {
                    changeListener = listener;
                }
            });

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "Polygon",
                    on: onStub,
                    un: sandbox.stub(),
                    getCoordinates: () => [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            addFeatureStub.resetHistory();

            // Simulate geometry change
            if (changeListener) {
                changeListener({
                    target: {
                        getCoordinates: () => [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]
                    }
                });
            }

            expect(addFeatureStub.calledOnce).to.be.true;
        });
    });

    describe("drawend event", () => {
        it("should unregister change listener on drawend", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const unStub = sandbox.stub();
            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: unStub,
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            drawInteraction.dispatchEvent({
                type: "drawend",
                feature: mockFeature
            });

            expect(unStub.calledWith("change")).to.be.true;
        });

        it("should set isBeingDrawn to false on drawend", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const setStub = sandbox.stub();
            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: setStub,
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            setStub.resetHistory();

            drawInteraction.dispatchEvent({
                type: "drawend",
                feature: mockFeature
            });

            expect(setStub.calledWith("isBeingDrawn", false)).to.be.true;
        });

        it("should set styleId on feature on drawend", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const setStub = sandbox.stub();
            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: setStub,
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            drawInteraction.dispatchEvent({
                type: "drawend",
                feature: mockFeature
            });

            const styleIdCall = setStub.getCalls().find(call => call.args[0] === "styleId");

            expect(styleIdCall).to.exist;
            expect(styleIdCall.args[1]).to.match(/__measureStyle_draw_\d+/);
        });

        it("should call setIsDrawing with false on drawend", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            setIsDrawingStub.resetHistory();

            drawInteraction.dispatchEvent({
                type: "drawend",
                feature: mockFeature
            });

            expect(setIsDrawingStub.calledOnce).to.be.true;
            expect(setIsDrawingStub.firstCall.args[0]).to.be.false;
        });

        it("should increment styleId counter for multiple features", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            /**
             *
             */
            function createMockFeature (id) {
                const setStub = sandbox.stub();

                return {
                    ol_uid: id,
                    get: sandbox.stub(),
                    set: setStub,
                    setStub,
                    getGeometry: sandbox.stub().returns({
                        getType: () => "LineString",
                        on: sandbox.stub(),
                        un: sandbox.stub(),
                        getLastCoordinate: () => [100, 200]
                    })
                };
            }

            const feature1 = createMockFeature("feature_1");
            const feature2 = createMockFeature("feature_2");

            // Draw first feature
            drawInteraction.dispatchEvent({type: "drawstart", feature: feature1});
            drawInteraction.dispatchEvent({type: "drawend", feature: feature1});

            // Draw second feature
            drawInteraction.dispatchEvent({type: "drawstart", feature: feature2});
            drawInteraction.dispatchEvent({type: "drawend", feature: feature2});

            const styleId1Call = feature1.setStub.getCalls().find(call => call.args[0] === "styleId");
            const styleId2Call = feature2.setStub.getCalls().find(call => call.args[0] === "styleId");

            expect(styleId1Call.args[1]).to.not.equal(styleId2Call.args[1]);
        });
    });

    describe("edge cases", () => {
        it("should handle drawend event properly", () => {
            drawInteraction = makeDraw(
                context,
                "LineString",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "LineString",
                    on: sandbox.stub(),
                    un: sandbox.stub(),
                    getLastCoordinate: () => [100, 200]
                })
            };

            drawInteraction.dispatchEvent({type: "drawstart", feature: mockFeature});
            drawInteraction.dispatchEvent({type: "drawend", feature: mockFeature});

            expect(setIsDrawingStub.calledWith(false)).to.be.true;
        });

        it("should handle empty polygon coordinates", () => {
            drawInteraction = makeDraw(
                context,
                "Polygon",
                addFeatureStub,
                setIsDrawingStub,
                setFeatureIdStub,
                setTooltipCoordStub
            );

            let changeListener = null;
            const onStub = sandbox.stub().callsFake((event, listener) => {
                if (event === "change") {
                    changeListener = listener;
                }
            });

            const mockFeature = {
                ol_uid: "test_feature_1",
                get: sandbox.stub(),
                set: sandbox.stub(),
                getGeometry: sandbox.stub().returns({
                    getType: () => "Polygon",
                    on: onStub,
                    un: sandbox.stub(),
                    getCoordinates: () => [[]]
                })
            };

            drawInteraction.dispatchEvent({
                type: "drawstart",
                feature: mockFeature
            });

            // Should not throw error
            expect(() => {
                if (changeListener) {
                    changeListener({
                        target: {
                            getCoordinates: () => [[]]
                        }
                    });
                }
            }).to.not.throw();
        });
    });
});
