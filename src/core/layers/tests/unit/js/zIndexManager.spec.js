import {expect} from "chai";
import sinon from "sinon";
import zIndexManager from "@core/layers/js/zIndexManager.js";

describe("src/core/layers/js/zIndexManager.js", () => {
    afterEach(() => {
        sinon.restore();
        zIndexManager.resetInitialZIndex();
    });

    describe("maxZIndexOfLayerConfigsByParentKey", () => {
        it("returns -1 if no layer configs exist for parentKey", () => {
            const rootGetters = {allLayerConfigsByParentKey: () => []};

            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey("baselayer", rootGetters)).to.equal(-1);
        });

        it("returns -1 if no layer configs have a numeric zIndex", () => {
            const rootGetters = {allLayerConfigsByParentKey: () => [{id: "1"}, {id: "2", zIndex: "notANumber"}]};

            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey("baselayer", rootGetters)).to.equal(-1);
        });

        it("returns the max zIndex of all layer configs", () => {
            const rootGetters = {allLayerConfigsByParentKey: () => [{id: "1", zIndex: 3}, {id: "2", zIndex: 7}, {id: "3", zIndex: 1}]};

            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey("baselayer", rootGetters)).to.equal(7);
        });
    });

    describe("determineZIndex", () => {
        it("returns null if layer config is not found", () => {
            const rootGetters = {layerConfigById: () => null};

            expect(zIndexManager.determineZIndex("unknownId", rootGetters)).to.be.null;
        });

        it("returns existing zIndex if layer config already has one", () => {
            const rootGetters = {layerConfigById: () => ({id: "1", zIndex: 5})};

            expect(zIndexManager.determineZIndex("1", rootGetters)).to.equal(5);
        });

        it("returns maxZIndex + 1 for a subject layer", () => {
            const rootGetters = {
                layerConfigById: () => ({id: "1"}),
                allLayerConfigsByParentKey: (key) => key === "subjectlayer" ? [{id: "2", zIndex: 4}] : []
            };

            expect(zIndexManager.determineZIndex("1", rootGetters)).to.equal(5);
        });

        it("returns maxZIndex + 1 for a baselayer", () => {
            const rootGetters = {
                layerConfigById: () => ({id: "1", baselayer: true}),
                allLayerConfigsByParentKey: (key) => key === "baselayer" ? [{id: "2", zIndex: 2}] : []
            };

            expect(zIndexManager.determineZIndex("1", rootGetters)).to.equal(3);
        });

        it("falls back to other parentKey if primary has no zIndexes", () => {
            const rootGetters = {
                layerConfigById: () => ({id: "1"}),
                allLayerConfigsByParentKey: (key) => key === "baselayer" ? [{id: "2", zIndex: 10}] : []
            };

            expect(zIndexManager.determineZIndex("1", rootGetters)).to.equal(11);
        });

        it("uses rootGetters.maxZIndexOfLayerConfigsByParentKey getter if available", () => {
            const mockGetter = sinon.stub().returns(8);
            const rootGetters = {
                layerConfigById: () => ({id: "1"}),
                maxZIndexOfLayerConfigsByParentKey: mockGetter
            };

            expect(zIndexManager.determineZIndex("1", rootGetters)).to.equal(9);
            expect(mockGetter.calledWith("subjectlayer")).to.be.true;
        });
    });

    describe("getZIndexForLayer", () => {
        it("returns 0 if layer config is not found", () => {
            const rootGetters = {layerConfigById: () => null};

            expect(zIndexManager.getZIndexForLayer("unknownId", false, rootGetters)).to.equal(0);
        });

        it("returns existing zIndex if layer config already has one", () => {
            const rootGetters = {layerConfigById: () => ({id: "1", zIndex: 9})};

            expect(zIndexManager.getZIndexForLayer("1", false, rootGetters)).to.equal(9);
        });

        it("returns maxZIndex + 1 for a subject layer", () => {
            const rootGetters = {
                layerConfigById: () => ({id: "1"}),
                allLayerConfigsByParentKey: (key) => key === "subjectlayer" ? [{id: "2", zIndex: 6}] : []
            };

            expect(zIndexManager.getZIndexForLayer("1", false, rootGetters)).to.equal(7);
        });

        it("returns maxZIndex + 1 for a baselayer", () => {
            const rootGetters = {
                layerConfigById: () => ({id: "1"}),
                allLayerConfigsByParentKey: (key) => key === "baselayer" ? [{id: "2", zIndex: 3}] : []
            };

            expect(zIndexManager.getZIndexForLayer("1", true, rootGetters)).to.equal(4);
        });

        it("falls back to other parentKey if primary has no zIndexes", () => {
            const rootGetters = {
                layerConfigById: () => ({id: "1"}),
                allLayerConfigsByParentKey: (key) => key === "subjectlayer" ? [{id: "2", zIndex: 5}] : []
            };

            expect(zIndexManager.getZIndexForLayer("1", true, rootGetters)).to.equal(6);
        });
    });

    describe("getTopBaselayer", () => {
        it("returns null for empty array", () => {
            expect(zIndexManager.getTopBaselayer([])).to.be.null;
        });

        it("returns null for null/undefined", () => {
            expect(zIndexManager.getTopBaselayer(null)).to.be.null;
        });

        it("returns the single element directly", () => {
            const layer = {id: "1", zIndex: 3};

            expect(zIndexManager.getTopBaselayer([layer])).to.equal(layer);
        });

        it("returns the layer with the highest zIndex", () => {
            const layer1 = {id: "1", zIndex: 2},
                layer2 = {id: "2", zIndex: 5},
                layer3 = {id: "3", zIndex: 1};

            expect(zIndexManager.getTopBaselayer([layer1, layer2, layer3])).to.equal(layer2);
        });

        it("returns null if zIndexes are not numbers (NaN)", () => {
            const layers = [{id: "1", zIndex: undefined}, {id: "2", zIndex: undefined}];

            expect(zIndexManager.getTopBaselayer(layers)).to.be.null;
        });
    });

    describe("updateLayerConfigZIndex", () => {
        it("increments zIndex only for layers above maxZIndex", () => {
            const layerContainer = [
                {id: "1", zIndex: 1},
                {id: "2", zIndex: 3},
                {id: "3", zIndex: 5}
            ];

            zIndexManager.updateLayerConfigZIndex({}, {layerContainer, maxZIndex: 3});

            expect(layerContainer.find(l => l.id === "1").zIndex).to.equal(1);
            expect(layerContainer.find(l => l.id === "2").zIndex).to.equal(3);
            expect(layerContainer.find(l => l.id === "3").zIndex).to.equal(6);
        });
    });

    describe("updateAllZIndexes", () => {
        it("reassigns zIndexes starting from 1 in treeOrder", () => {
            const baselayer1 = {id: "b1", zIndex: 10},
                baselayer2 = {id: "b2", zIndex: 20},
                subjectlayer1 = {id: "s1", zIndex: 5};

            const getters = {
                allLayerConfigsByParentKey: (key) => {
                    if (key === "baselayer") {
                        return [baselayer1, baselayer2];
                    }
                    if (key === "subjectlayer") {
                        return [subjectlayer1];
                    }
                    return [];
                }
            };

            zIndexManager.updateAllZIndexes({getters});

            expect(baselayer1.zIndex).to.equal(1);
            expect(baselayer2.zIndex).to.equal(2);
            expect(subjectlayer1.zIndex).to.equal(3);
        });
    });

    describe("getNextInitialZIndex / resetInitialZIndex", () => {
        it("returns incrementing values starting from 1", () => {
            expect(zIndexManager.getNextInitialZIndex()).to.equal(1);
            expect(zIndexManager.getNextInitialZIndex()).to.equal(2);
            expect(zIndexManager.getNextInitialZIndex()).to.equal(3);
        });

        it("resets counter back to 1", () => {
            zIndexManager.getNextInitialZIndex();
            zIndexManager.getNextInitialZIndex();
            zIndexManager.resetInitialZIndex();

            expect(zIndexManager.getNextInitialZIndex()).to.equal(1);
        });
    });
});
