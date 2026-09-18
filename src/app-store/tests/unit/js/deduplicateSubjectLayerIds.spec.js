import {expect} from "chai";
import deduplicateSubjectLayerIds from "@appstore/js/deduplicateSubjectLayerIds.js";

describe("src/app-store/js/deduplicateSubjectLayerIds.js", () => {
    it("keeps the first layer occurrence and preserves other layers", () => {
        const subjectLayer = {
                elements: [
                    {
                        name: "Folder A",
                        type: "folder",
                        elements: [{id: "150"}, {id: "151"}]
                    },
                    {
                        name: "Folder B",
                        type: "folder",
                        elements: [{id: "150"}, {id: "152"}]
                    }
                ]
            },
            result = deduplicateSubjectLayerIds(subjectLayer),
            folders = result.subjectLayer.elements;

        expect(folders[0].elements.map(layer => layer.id)).to.deep.equal(["150", "151"]);
        expect(folders[1].elements.map(layer => layer.id)).to.deep.equal(["152"]);
        expect(result.duplicateIds).to.deep.equal(["150"]);
    });

    it("keeps different ids of the same WMS", () => {
        const result = deduplicateSubjectLayerIds({
            elements: [
                {id: "150", typ: "WMS", url: "https://example.com/wms", layers: "layer-a"},
                {id: "151", typ: "WMS", url: "https://example.com/wms", layers: "layer-b"}
            ]
        });

        expect(result.subjectLayer.elements.map(layer => layer.id)).to.deep.equal(["150", "151"]);
        expect(result.duplicateIds).to.be.empty;
    });

    it("deduplicates identical ordered grouped layer ids", () => {
        const result = deduplicateSubjectLayerIds({
            elements: [
                {id: ["3302", "4561"], name: "First group"},
                {id: ["3302", "4561"], name: "Duplicate group"}
            ]
        });

        expect(result.subjectLayer.elements.map(layer => layer.name)).to.deep.equal(["First group"]);
        expect(result.duplicateIds).to.deep.equal(["[\"3302\",\"4561\"]"]);
    });

    it("keeps grouped layer ids with different order or values", () => {
        const result = deduplicateSubjectLayerIds({
            elements: [
                {id: ["3302", "4561"]},
                {id: ["4561", "3302"]},
                {id: ["3302", "9999"]}
            ]
        });

        expect(result.subjectLayer.elements.map(layer => layer.id)).to.deep.equal([
            ["3302", "4561"],
            ["4561", "3302"],
            ["3302", "9999"]
        ]);
        expect(result.duplicateIds).to.be.empty;
    });

    it("removes folders made empty by duplicate removal but keeps existing empty folders", () => {
        const result = deduplicateSubjectLayerIds({
            elements: [
                {id: "150"},
                {
                    name: "Existing empty folder",
                    type: "folder",
                    elements: []
                },
                {
                    name: "Duplicate only folder",
                    type: "folder",
                    elements: [{id: "150"}]
                }
            ]
        });

        expect(result.subjectLayer.elements.filter(element => element.id).map(element => element.id)).to.deep.equal(["150"]);
        expect(result.subjectLayer.elements.filter(element => element.type === "folder").map(element => element.name))
            .to.deep.equal(["Existing empty folder"]);
    });

    it("prunes folders recursively after nested duplicate removal", () => {
        const result = deduplicateSubjectLayerIds({
            elements: [
                {
                    name: "Folder A",
                    type: "folder",
                    elements: [{id: "150"}]
                },
                {
                    name: "Folder B",
                    type: "folder",
                    elements: [{
                        name: "Subfolder",
                        type: "folder",
                        elements: [{id: "150"}]
                    }]
                },
                {
                    name: "Existing empty folder",
                    type: "folder",
                    elements: []
                }
            ]
        });

        expect(result.subjectLayer.elements.map(element => element.name)).to.deep.equal([
            "Folder A",
            "Existing empty folder"
        ]);
        expect(result.duplicateIds).to.deep.equal(["150"]);
    });

    it("returns the input and no warnings for an invalid subject layer", () => {
        const subjectLayer = {name: "Subject layer"},
            result = deduplicateSubjectLayerIds(subjectLayer);

        expect(result.subjectLayer).to.deep.equal(subjectLayer);
        expect(result.duplicateIds).to.be.empty;
    });
});
