import {expect} from "chai";
import {
    isQueryableLayer,
    filterQueryableTree,
    filterTreeByQueryAndQueryable,
    filterRecursive
} from "../../layerTreeFilterUtils.js";

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
    describe("filterRecursive", () => {

        /**
     * Helper to create a layer object.
     * @param {string} name - Layer name.
     * @param {Object} [extra] - Additional properties.
     * @returns {Object} Returns a layer configuration object.
     */
        function layer (name, extra = {}) {
            return {type: "layer", name, ...extra};
        }

        /**
     * Helper to create a folder object.
     * @param {string} name - Folder name.
     * @param {Array} elements - Child elements.
     * @returns {Object} Returns a folder configuration object.
     */
        function folder (name, elements = []) {
            return {type: "folder", name, elements};
        }

        it("should return an empty array if input is not an array", () => {
            expect(filterRecursive(null)).to.deep.equal([]);
            expect(filterRecursive(undefined)).to.deep.equal([]);
            expect(filterRecursive("string")).to.deep.equal([]);
            expect(filterRecursive({})).to.deep.equal([]);
        });

        it("should return all layers if query is empty", () => {
            const input = [
                    layer("Layer 1"),
                    folder("Folder 1", [
                        layer("Layer 2")
                    ])
                ],

                result = filterRecursive(input, "");

            expect(result).to.deep.equal(input);
        });

        it("should return only layers matching the query", () => {
            const input = [
                    layer("First Layer"),
                    layer("Second Layer"),
                    layer("Unrelated")
                ],

                result = filterRecursive(input, "second");

            expect(result).to.deep.equal([
                layer("Second Layer")
            ]);
        });

        it("should include folders only if they contain matching layers", () => {
            const input = [
                    folder("Top Folder", [
                        layer("Keep Me"),
                        layer("Skip Me")
                    ]),
                    folder("Empty Folder", [
                        layer("No Match")
                    ])
                ],

                result = filterRecursive(input, "keep");

            expect(result).to.deep.equal([
                folder("Top Folder", [
                    layer("Keep Me")
                ])
            ]);
        });

        it("should match query case-insensitively", () => {
            const input = [layer("My Layer")],
                result = filterRecursive(input, "my layer");

            expect(result).to.deep.equal([layer("My Layer")]);
        });

        it("should handle nested folder structures", () => {
            const input = [
                    folder("Outer Folder", [
                        folder("Inner Folder", [
                            layer("Target Layer"),
                            layer("Other Layer")
                        ]),
                        layer("Outer Layer")
                    ])
                ],

                result = filterRecursive(input, "target");

            expect(result).to.deep.equal([
                folder("Outer Folder", [
                    folder("Inner Folder", [
                        layer("Target Layer")
                    ])
                ])
            ]);
        });

        it("should return empty array if no layers match", () => {
            const input = [
                    folder("Folder A", [
                        layer("One"),
                        layer("Two")
                    ])
                ],

                result = filterRecursive(input, "xyz");

            expect(result).to.deep.equal([]);
        });
    });
});
