import OpenLayersVectorTileLayer from "ol/layer/VectorTile";
import OpenLayersVectorTileSource from "ol/source/VectorTile";
import OpenLayersTileGrid from "ol/tilegrid/TileGrid";

import {Feature} from "ol";
import Polygon from "ol/geom/Polygon";

import * as vectorTile from "../../src/layer/vectorTile";
import {registerProjections} from "../../src/crs";
import defaults from "../../src/defaults";

jest.mock("../../src/rawLayerList.js", () => {
    const original = jest.requireActual("../../src/rawLayerList.js");

    original.initializeLayerList = jest.fn();
    return original;
});

describe("vectorTile.js", function () {

    beforeAll(() => registerProjections());

    const layerParams = {
            name: "VT Test",
            id: "VT_01",
            url: "https://example.org"
        },
        tileGridParams = {
            extent: [0, 0, 1, 1],
            tileSize: 512,
            minZoom: 0
        },

        vtStyle = {
            "version": 8,
            "sources": {
                "test": {
                    "type": "vector"
                }
            },
            "layers": [
                {
                    "type": "fill",
                    "source": "test",
                    "source-layer": "Background",
                    "paint": {"fill-color": "rgb(255,253,238)", "fill-opacity": 1}
                }
            ]
        },

        feature = new Feature({
            geometry: new Polygon([[0, 0], [0, 1], [1, 1], [0, 0]]),
            layer: "Background"
        });

    describe("createTileGrid", function () {
        it("creates a ol/tilegrid/TileGrid with default values for not required parameters", function () {
            const tileGrid = vectorTile.createTileGrid(tileGridParams);

            expect(tileGrid).toBeInstanceOf(OpenLayersTileGrid);
            expect(tileGrid.getExtent()).toEqual(tileGridParams.extent);
            expect(tileGrid.getResolutions()).toEqual(defaults.options.map(x => x.resolution));
            expect(tileGrid.getTileSize()).toEqual(new Array(2).fill(tileGridParams.tileSize));
            expect(tileGrid.getMinZoom()).toBe(tileGrid.minZoom);
            expect(tileGrid.getOrigin()).toEqual([tileGridParams.extent[0], tileGridParams.extent[3]]);
        });
    });

    describe("createLayerSource", function () {
        it("creates a layerSource", function () {
            const tileGrid = vectorTile.createTileGrid(tileGridParams),
                sourceParams = {
                    tileGrid: tileGrid,
                    tileSize: tileGrid.getTileSize(),
                    zDirection: 1,
                    minZoom: 0,
                    maxZoom: 22
                },
                source = vectorTile.createLayerSource("https://foo.example.org", sourceParams);

            expect(source).toBeInstanceOf(OpenLayersVectorTileSource);
        });
    });

    describe("createLayer", function () {
        it("creates a vector Tile Layer", function () {
            const layer = vectorTile.createLayer(layerParams);

            expect(layer).toBeInstanceOf(OpenLayersVectorTileLayer);
            expect(layer.getSource()).toBeInstanceOf(OpenLayersVectorTileSource);
            expect(layer.get("name")).toEqual("VT Test");
            expect(layer.get("id")).toEqual("VT_01");
        });

        it("should log an error when required param is missing", function () {
            const spyConsole = jest.spyOn(console, "error").mockImplementation(() => ""),
                layer = vectorTile.createLayer({
                    name: "VT Test",
                    id: "VT_01"
                });

            expect(layer).toBeUndefined();
            expect(console.error).toHaveBeenCalled();
            expect(spyConsole.mock.calls[0][0]).toContain("Cancelled creation of layer \"VT_01\"(VT Test) because of missing required parameters");
            spyConsole.mockRestore();
        });

        it("should apply default values for all not required ones", function () {
            const defaultValues = { // defaults defined in services.json.md
                    zDirection: 1,
                    epsg: "EPSG:25832", // default value from config.json.md/MapView. Should be the default CRS
                    extent: [ // If not set, the portal's coordinate reference system's extent is used
                        // Note: this should be the extent of the projection but is the extent of EPSG:3857
                        //       this is because in masterportalAPI is no definition of the extent of the
                        //       default projection which is EPSG:25832
                        -20015077.371242613,
                        -20015077.371242613,
                        20015077.371242613,
                        20015077.371242613
                    ],
                    origin: [ // if not set, the portal's coordinate reference system's top-left corner is used.
                        // Note: this should be the top left corner of the projection extent but is top left
                        //       corner of extent of EPSG:3857 this is because in masterportalAPI is no
                        //       definition of the extent of the default projection which is EPSG:25832
                        -20015077.371242613,
                        20015077.371242613
                    ],
                    resolutions: [ // If not used, the portal's resolutions are used. (Missing default resolution definition? used default resolutions from masterportal-api)
                        66.14579761460263,
                        26.458319045841044,
                        15.874991427504629,
                        10.583327618336419,
                        5.2916638091682096,
                        2.6458319045841048,
                        1.3229159522920524,
                        0.6614579761460262,
                        0.2645831904584105,
                        0.1322915952292052
                    ],
                    tileSize: 512
                },
                layer = vectorTile.createLayer(layerParams),
                source = layer.getSource(),
                tileGrid = source.getTileGrid();

            expect(layer.getExtent()).toEqual(defaultValues.extent);

            expect(source.getProjection().getCode()).toEqual(defaultValues.epsg);

            expect(tileGrid.getExtent()).toEqual(defaultValues.extent);
            expect(tileGrid.getOrigin()).toEqual(defaultValues.origin);
            expect(tileGrid.getResolutions()).toEqual(defaultValues.resolutions);
            expect(tileGrid.getTileSize()).toEqual(new Array(2).fill(defaultValues.tileSize));
        });
    });

    describe("setStyle", function () {
        it("should apply a given style", function () {
            const layer = vectorTile.createLayer(layerParams);

            let featureStyle = null;

            vectorTile.setStyle(layer, vtStyle);

            expect(typeof layer.getStyle()).toBe("function");

            featureStyle = layer.getStyle()(feature, 1.3229159522920524);

            expect(featureStyle[0].getFill().getColor()).toBe("rgba(255,253,238,1)");
        });
    });
});
