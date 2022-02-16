import OpenLayersVectorTileLayer from "ol/layer/VectorTile";
import OpenLayersVectorTileSource from "ol/source/VectorTile";
import OpenLayersTileGrid from "ol/tilegrid/TileGrid";

import * as vectorTile from "../../src/layer/vectorTile";
import { registerProjections } from "../../src/crs";
import defaults from "../../src/defaults";

jest.mock("../../src/rawLayerList.js", () => {
    const original = jest.requireActual("../../src/rawLayerList.js");

    original.initializeLayerList = jest.fn();
    return original;
});

describe("vectorTile.js", function () {

    beforeAll(() => registerProjections());

    const tileGridParams = {
        extent: [0, 0, 1, 1],
        tileSize: 512,
        minZoom: 0
    }

    describe("createTileGrid", function( ){
        it("creates a ol/tilegrid/TileGrid with default values for not required parameters", function() {
            const tileGrid = vectorTile.createTileGrid(tileGridParams);

            expect(tileGrid).toBeInstanceOf(OpenLayersTileGrid);
            expect(tileGrid.getExtent()).toEqual(tileGridParams.extent);
            expect(tileGrid.getResolutions()).toEqual(defaults.options.map(x => x.resolution));
            expect(tileGrid.getTileSize()).toEqual(new Array(2).fill(tileGridParams.tileSize));
            expect(tileGrid.getMinZoom()).toBe(tileGrid.minZoom);
            expect(tileGrid.getOrigin()).toEqual([tileGridParams.extent[0], tileGridParams.extent[3]]);
        })
    })

    describe("createLayerSource", function () {
        it("creates a layerSource", function () {
            const tileGrid = vectorTile.createTileGrid(tileGridParams)
            const sourceParams = {
                tileGrid: tileGrid,
                tileSize: tileGrid.getTileSize(),
                zDirection: 1,
                minZoom: 0,
                maxZoom: 22
            }
            const source = vectorTile.createLayerSource("https://foo.example.org", sourceParams);

            expect(source).toBeInstanceOf(OpenLayersVectorTileSource);
        });
    });

    describe("createLayer", function () {
        it("creates a vector Tile Layer", function () {
            const layerParams = {
                name: "VT Test",
                id: "VT_01"
            };
            const layer = vectorTile.createLayer(layerParams);

            expect(layer).toBeInstanceOf(OpenLayersVectorTileLayer);
            expect(layer.getSource()).toBeInstanceOf(OpenLayersVectorTileSource);
            expect(layer.get("name")).toEqual("VT Test");
            expect(layer.get("id")).toEqual("VT_01");
        });
    });
});