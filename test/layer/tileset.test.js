import Tileset from "../../src/layer/tileset";

describe("tileset.js", function () {
    const consoleWarn = console.warn;
    let attr, map, cesium3DTilesetSpy;

    beforeEach(() => {
        global.Cesium = {};
        global.Cesium.Cesium3DTileset = jest.fn();
        attr = {
            id: "4002",
            name: "Gebäude LoD2",
            url: "https://geoportal-hamburg.de/gdi3d/datasource-data/LoD2",
            typ: "TileSet3D",
            cesium3DTilesetOptions: {
                maximumScreenSpaceError: 6
            }
        };
        map = {
            getCesiumScene: () => {
                return {
                    primitives: {
                        contains: jest.fn(),
                        add: jest.fn(),
                        remove: jest.fn()
                    }
                };
            }
        };
        cesium3DTilesetSpy = jest.spyOn(global.Cesium, "Cesium3DTileset");
        console.warn = jest.fn();
    });

    afterEach(() => {
        global.Cesium = null;
        jest.clearAllMocks();
        console.warn = consoleWarn;
    });

    function checkAttributes (layer, attrs) {
        expect(layer.get("name")).toEqual(attrs.name);
        expect(layer.get("typ")).toEqual(attrs.typ);
        expect(layer.get("id")).toEqual(attrs.id);
        expect(layer.tileset.layerReferenceId).toEqual(attrs.id);
    }

    describe("createLayer", function () {
        it("creates tileset layer without map and not selected", function () {
            const layer = new Tileset(attr);

            checkAttributes(layer, attr);
            expect(layer.tileSet).toEqual(undefined);
            expect(cesium3DTilesetSpy).toHaveBeenCalledTimes(1);
        });
        it("creates tileset layer with map and selected", function () {
            attr.isSelected = true;
            const layer = new Tileset(attr, map);

            checkAttributes(layer, attr);
            expect(layer.tileset.show).toEqual(true);
            expect(cesium3DTilesetSpy).toHaveBeenCalledTimes(1);
        });
        it("creates 2 tileset layers  with map and selected and checks attributes", function () {
            const attr2 = {
                    id: "4003",
                    name: "name",
                    url: "https://url",
                    typ: "TileSet3D"
                },
                layer = new Tileset(attr, map),
                layer2 = new Tileset(attr2, map);

            checkAttributes(layer, attr);
            checkAttributes(layer2, attr2);
            expect(cesium3DTilesetSpy).toHaveBeenCalledTimes(2);
        });
    });
    describe("setVisible", function () {
        it("calls setVisible without map shall not fail", function () {
            const layer = new Tileset(attr, map);

            expect(layer.tileset.show).toEqual(undefined);
            layer.setVisible(true);

            checkAttributes(layer, attr);
            expect(layer.tileset.show).toEqual(undefined);
            expect(cesium3DTilesetSpy).toHaveBeenCalledTimes(1);
        });
        it("sets the tileset layer visible", function () {
            const layer = new Tileset(attr, map);

            layer.setVisible(true, map);
            checkAttributes(layer, attr);
            expect(layer.tileset.show).toEqual(true);
            expect(cesium3DTilesetSpy).toHaveBeenCalledTimes(1);
        });
        it("sets the tileset layer not visible", function () {
            const layer = new Tileset(attr, map);

            layer.setVisible(false, map);
            checkAttributes(layer, attr);
            expect(layer.tileset.show).toEqual(false);
            expect(cesium3DTilesetSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe("get", function () {
        it("calls get for attributes", function () {
            const layer = new Tileset(attr, map);

            checkAttributes(layer, attr);
            expect(layer.get(null)).toEqual(undefined);
            expect(layer.get(undefined)).toEqual(undefined);
            expect(layer.get("")).toEqual(undefined);
        });
    });
});
