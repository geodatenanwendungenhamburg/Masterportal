import {expect} from "chai";
import {
    isQueryableLayer,
    filterQueryableTree,
    filterTreeByQueryAndQueryable
} from "../../layerTreeFilterUtils";

describe("Layer Filtering Utilities", () => {

    describe("isQueryableLayer", () => {
        it("should return true for objects with type 'layer'", () => {
            expect(isQueryableLayer({type: "layer"})).to.be.true;
        });

        it("should return false for objects with type 'folder'", () => {
            expect(isQueryableLayer({type: "folder"})).to.be.false;
        });

        it("should return false for objects with no type", () => {
            expect(isQueryableLayer({})).to.be.false;
        });

        it("should return false if passed null or undefined", () => {
            expect(isQueryableLayer(null)).to.be.false;
            expect(isQueryableLayer(undefined)).to.be.false;
        });
    });

    describe("filterQueryableTree", () => {
        it("should return only layers with type 'layer'", () => {
            const input = [
                    {type: "layer", name: "Layer A"},
                    {type: "folder", elements: []},
                    {type: "layer", name: "Layer B"},
                    {type: "notalayer"}
                ],
                result = filterQueryableTree(input);

            expect(result).to.deep.equal([
                {type: "layer", name: "Layer A"},
                {type: "layer", name: "Layer B"}
            ]);
        });

        it("should preserve folder structure if folders contain queryable layers", () => {
            const input = [
                    {
                        type: "folder",
                        name: "Folder 1",
                        elements: [
                            {type: "layer", name: "Layer 1"},
                            {type: "notalayer"}
                        ]
                    }
                ],
                result = filterQueryableTree(input);

            expect(result).to.deep.equal([
                {
                    type: "folder",
                    name: "Folder 1",
                    elements: [
                        {type: "layer", name: "Layer 1"}
                    ]
                }
            ]);
        });

        it("should remove empty folders", () => {
            const input = [
                    {
                        type: "folder",
                        name: "Empty Folder",
                        elements: [
                            {type: "notalayer"}
                        ]
                    }
                ],
                result = filterQueryableTree(input);

            expect(result).to.deep.equal([]);
        });
    });

    describe("filterTreeByQueryAndQueryable", () => {
        /**
         * Creates a layer configuration object.
         * @param {string} name - The name of the layer.
         * @param {string} [description] - The optional description of the layer.
         * @returns {Object} A layer object with type 'layer', name, and description.
         */
        function layer (name, description) {
            return {type: "layer", name, description};
        }

        /**
         * Creates a folder configuration object.
         * @param {string} name - The name of the folder.
         * @param {Array} elements - The list of child layer or folder configurations.
         * @returns {Object} A folder object with type 'folder', name, and elements.
         */
        function folder (name, elements) {
            return {type: "folder", name, elements};
        }

        it("should return layers matching the query in name or description", () => {
            const input = [
                    layer("Layer A", "First layer"),
                    layer("Another Layer", "Description"),
                    layer("No match", "Unrelated")
                ],
                result = filterTreeByQueryAndQueryable(input, "layer");

            expect(result).to.deep.equal([
                layer("Layer A", "First layer"),
                layer("Another Layer", "Description")
            ]);
        });

        it("should return folders if their name matches the query", () => {
            const input = [
                    folder("Matching Folder", [])
                ],
                result = filterTreeByQueryAndQueryable(input, "matching");

            expect(result).to.deep.equal([
                {type: "folder", name: "Matching Folder", elements: []}
            ]);
        });

        it("should return folders if their children match", () => {
            const input = [
                    folder("Top Folder", [
                        layer("Child Layer", "Some description"),
                        layer("Other Layer", "Unrelated")
                    ])
                ],
                result = filterTreeByQueryAndQueryable(input, "child");

            expect(result).to.deep.equal([
                {
                    type: "folder",
                    name: "Top Folder",
                    elements: [layer("Child Layer", "Some description")]
                }
            ]);
        });

        it("should filter out folders and layers not matching the query", () => {
            const input = [
                    folder("Folder", [
                        layer("Not Relevant", "No match")
                    ])
                ],
                result = filterTreeByQueryAndQueryable(input, "nothing");

            expect(result).to.deep.equal([]);
        });

        it("should handle nested folders with matches", () => {
            const input = [
                    folder("Outer Folder", [
                        folder("Inner Folder", [
                            layer("Target Layer", "Match this")
                        ])
                    ])
                ],
                result = filterTreeByQueryAndQueryable(input, "target");

            expect(result).to.deep.equal([
                folder("Outer Folder", [
                    folder("Inner Folder", [
                        layer("Target Layer", "Match this")
                    ])
                ])
            ]);
        });
    });
});
