import * as terrain from "../../src/layer/terrain";

describe("terrain.js", function () {
    let attr, map, cesiumTerrainProviderSpy;

    beforeEach(() => {
        global.Cesium = {};
        global.Cesium.CesiumTerrainProvider = jest.fn();
        global.Cesium.EllipsoidTerrainProvider = jest.fn();
        attr = {
            id: "12883",
            name: "Gelaende",
            url: "https://url/Gelaende",
            typ: "Terrain3D",
            cesiumTerrainProviderOptions: {
                requestVertexNormals: true
            }
        };
        map = {
            getCesiumScene: () => {
                return {};
            }
        };
        cesiumTerrainProviderSpy = jest.spyOn(global.Cesium, "CesiumTerrainProvider");
    });

    afterEach(() => {
        global.Cesium = null;
        jest.clearAllMocks();
    });

    function checkAttributes (layer, attrs) {
        expect(layer.get("name")).toEqual(attrs.name);
        expect(layer.get("typ")).toEqual(attrs.typ);
        expect(layer.get("id")).toEqual(attrs.id);
    }

    describe("createLayer", function () {
        it("creates a wrapper for terrain layer without map and not selected", function () {
            const layer = terrain.createLayer(attr);

            checkAttributes(layer, attr);
        });
        it("creates a wrapper for terrain layer with map and not selected", function () {
            attr.isSelected = false;
            const layer = terrain.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(cesiumTerrainProviderSpy).toHaveBeenCalledTimes(0);
        });
        it("creates a wrapper for terrain layer with map and selected", function () {
            attr.isSelected = true;
            const layer = terrain.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(cesiumTerrainProviderSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe("setVisible", function () {
        it("calls setVisible without map shall not fail", function () {
            const layer = terrain.createLayer(attr, map);

            layer.setVisible(true, attr);

            checkAttributes(layer, attr);
            expect(cesiumTerrainProviderSpy).toHaveBeenCalledTimes(0);
        });
        it("calls setVisible without map and attributes shall not fail", function () {
            const layer = terrain.createLayer(attr, map);

            layer.setVisible(true);

            checkAttributes(layer, attr);
            expect(cesiumTerrainProviderSpy).toHaveBeenCalledTimes(0);
        });
        it("sets the terrain layer visible by creating a CesiumTerrainProvider", function () {
            const layer = terrain.createLayer(attr, map);

            layer.setVisible(true, attr, map);

            checkAttributes(layer, attr);
            expect(cesiumTerrainProviderSpy).toHaveBeenCalledTimes(1);
        });
        it("sets the terrain layer not visible by creating a EllipsoidTerrainProvider", function () {
            const cesiumEllipsoidTerrainProviderSpy = jest.spyOn(global.Cesium, "EllipsoidTerrainProvider"),
                layer = terrain.createLayer(attr, map);

            layer.setVisible(false, attr, map);

            checkAttributes(layer, attr);
            expect(cesiumTerrainProviderSpy).toHaveBeenCalledTimes(0);
            expect(cesiumEllipsoidTerrainProviderSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe("get", function () {
        it("calls get for attributes", function () {
            const layer = terrain.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(layer.get(null)).toEqual(undefined);
            expect(layer.get(undefined)).toEqual(undefined);
            expect(layer.get("")).toEqual(undefined);
        });
    });
});

