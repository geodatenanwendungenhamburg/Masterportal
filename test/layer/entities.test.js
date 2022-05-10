import * as entities from "../../src/layer/entities";

describe("entities.js", function () {
    let attr,
        map,
        dataSources = [],
        dataSourcesContent,
        dataSourceValues,
        cesiumCustomDataSourceSpy,
        cesiumHeadingPitchRollSpy;

    beforeEach(() => {
        dataSourcesContent = {};
        dataSourceValues = [];
        global.Cesium = {};
        global.Cesium.Cartesian3 = {};
        global.Cesium.Transforms = {};
        global.Cesium.Cartesian3.fromDegrees = jest.fn();
        global.Cesium.HeadingPitchRoll = jest.fn();
        global.Cesium.Transforms.headingPitchRollQuaternion = jest.fn();
        global.Cesium.CustomDataSource = function CustomDataSource (name) {
            this.name = name;
            this.entities = {
                values: dataSourceValues,
                add: (toAdd) => {
                    dataSourceValues.push(toAdd);
                    this.length++;
                    return toAdd;
                },
                contains: (value) => dataSourceValues.includes(value)
            };
            this.length = 0;
            this.forEach = () => dataSourceValues.forEach;
        };
        attr = {
            id: "4003",
            name: "EntitiesLayer",
            typ: "Entities3D",
            entities: [
                {
                    "url": "https://daten-hamburg.de/gdi3d/datasource-data/Simple_Building.glb",
                    "attributes": {
                        "name": "einfaches Haus in Planten und Blomen"
                    },
                    "latitude": 53.5631,
                    "longitude": 9.9800,
                    "height": 16,
                    "heading": 0,
                    "pitch": 0,
                    "roll": 0,
                    "scale": 5,
                    "allowPicking": true,
                    "show": true
                }
            ]
        };
        dataSources = {
            getByName: (name) => {
                return dataSourcesContent[name] ? [dataSourcesContent[name]] : [];
            },
            add: (dataSource) => {
                dataSourcesContent[dataSource.name] = dataSource;
            }
        };
        map = {
            getDataSources: () => {
                return dataSources;
            }
        };
        cesiumCustomDataSourceSpy = jest.spyOn(global.Cesium, "CustomDataSource");
        cesiumHeadingPitchRollSpy = jest.spyOn(global.Cesium.Transforms, "headingPitchRollQuaternion");
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
            attr.isSelected = false;
            const layer = entities.createLayer(attr);

            checkAttributes(layer, attr);
        });
        it("creates a wrapper for entities layer with map and not selected", function () {
            attr.isSelected = false;
            attr.entities[0].show = false;
            const layer = entities.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourceValues[0].show).toEqual(false);
            expect(Object.keys(dataSourcesContent).length).toEqual(1);
            expect(cesiumCustomDataSourceSpy).toHaveBeenCalledTimes(1);
            expect(cesiumHeadingPitchRollSpy).toHaveBeenCalledTimes(1);
        });
        it("creates a wrapper for terrain layer with map and selected and show not set", function () {
            attr.isSelected = true;
            attr.entities[0].show = undefined;
            const layer = entities.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourceValues[0].show).toEqual(true);
            expect(Object.keys(dataSourcesContent).length).toEqual(1);
            expect(cesiumCustomDataSourceSpy).toHaveBeenCalledTimes(1);
            expect(cesiumHeadingPitchRollSpy).toHaveBeenCalledTimes(1);
        });
        it("creates a wrapper for terrain layer with map and selected and show is true", function () {
            attr.isSelected = true;
            attr.entities[0].show = true;
            const layer = entities.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourceValues[0].show).toEqual(true);
            expect(Object.keys(dataSourcesContent).length).toEqual(1);
            expect(cesiumCustomDataSourceSpy).toHaveBeenCalledTimes(1);
            expect(cesiumHeadingPitchRollSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe("setVisible", function () {
        let consoleWarnOrig;

        beforeEach(() => {
            consoleWarnOrig = console.warn;
            console.warn = jest.fn();
        });

        afterEach(() => {
            console.warn = consoleWarnOrig;
        });

        it("call setVisible without map shall not fail and shall do nothing", function () {
            attr.isSelected = false;
            attr.entities[0].show = false;
            const layer = entities.createLayer(attr, map);

            entities.setVisible(true, attr);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourceValues[0].show).toEqual(false);
        });
        it("call setVisible without map and rawLayer shall not fail and shall do nothing", function () {
            attr.isSelected = false;
            attr.entities[0].show = false;
            const layer = entities.createLayer(attr, map);

            entities.setVisible(true, null);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourceValues[0].show).toEqual(false);
        });
        it("call setVisible shall set show to true", function () {
            attr.isSelected = false;
            attr.entities[0].show = false;
            const layer = entities.createLayer(attr, map);

            expect(dataSourceValues[0].show).toEqual(false);

            layer.setVisible(true, attr, map);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourcesContent[attr.id].show).toEqual(true);
        });
        it("call setVisible shall only warn, if no dataSource found", function () {
            attr.isSelected = false;
            attr.entities[0].show = false;
            const layer = entities.createLayer(attr, map);

            checkAttributes(layer, attr);

            attr.id = "notExist";
            entities.setVisible(true, attr, map);

            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourcesContent[attr.id]).toEqual(undefined);
            expect(console.warn).toHaveBeenCalledTimes(1);
        });
    });
    describe("get", function () {
        it("calls get for attributes", function () {
            const layer = entities.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(layer.get(null)).toEqual(undefined);
            expect(layer.get(undefined)).toEqual(undefined);
            expect(layer.get("")).toEqual(undefined);
        });
    });
    describe("addEntities", function () {
        let consoleWarnOrig;

        beforeEach(() => {
            consoleWarnOrig = console.warn;
            console.warn = jest.fn();
        });

        afterEach(() => {
            console.warn = consoleWarnOrig;
        });

        it("addEntities without map shall not fail", function () {
            const layer = entities.createLayer(attr, map);

            layer.addEntities(attr);
        });
        it("addEntities without rawLayer shall not fail", function () {
            const layer = entities.createLayer(attr, map);

            layer.addEntities(null, map);
            expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it("addEntities shall add entity twice", function () {
            attr.isSelected = false;
            attr.entities[0].show = false;
            const layer = entities.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);

            layer.addEntities(attr, map);
            expect(dataSourceValues.length).toEqual(2);
            expect(dataSourceValues[0].show).toEqual(false);
            expect(dataSourceValues[1].show).toEqual(false);
        });
        it("addEntities shall add entity and set Visible", function () {
            attr.isSelected = true;
            attr.entities[0].show = true;
            const layer = entities.createLayer(attr, map);

            checkAttributes(layer, attr);
            expect(dataSourceValues.length).toEqual(1);
            expect(dataSourceValues[0].show).toEqual(true);

            layer.addEntities(attr, map);
            expect(dataSourceValues.length).toEqual(2);
            expect(dataSourceValues[0].show).toEqual(true);
            expect(dataSourceValues[1].show).toEqual(true);
        });
    });
});

