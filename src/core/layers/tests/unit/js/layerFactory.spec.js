import {expect} from "chai";
import Map from "ol/Map.js";
import sinon from "sinon";
import View from "ol/View.js";
import store from "@appstore/index.js";

import layerFactory from "@core/layers/js/layerFactory.js";

describe("src/core/js/layers/layerFactory.js", () => {
    let layerConfig,
        map,
        warn,
        origGetters;

    before(() => {
        origGetters = store.getters;
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);
    });

    beforeEach(() => {
        store.getters = {
            isModuleAvailable: sinon.stub().returns(false)
        };
        layerConfig = [
            {
                id: "453",
                name: "Geobasiskarten <br>(HamburgDE)",
                visibility: true,
                url: "https://geodienste.hamburg.de/HH_WMS_HamburgDE",
                typ: "WMS",
                layers: "Geobasiskarten_HHde"
            },
            {
                id: "2426",
                name: "Bezirke",
                visibility: true,
                url: "https://geodienste.hamburg.de/HH_WMS_Verwaltungsgrenzen",
                typ: "WMS",
                layers: "bezirke"
            },
            {
                id: "12883",
                name: "Gelände",
                typ: "Terrain3D",
                visibility: true
            }
        ];

        mapCollection.clear();
        map = new Map({
            id: "ol",
            mode: "2D",
            view: new View()
        });

        mapCollection.addMap(map, "2D");
    });

    after(() => {
        store.getters = origGetters;
        sinon.restore();
    });

    describe("createLayer", () => {
        it("should creates a layer with type WMS", {timeout: 10000}, async () => {
            const wmsLayer = await layerFactory.createLayer(layerConfig[0]);

            expect(wmsLayer).not.to.be.undefined;
            expect(wmsLayer.attributes.typ).to.equals("WMS");
        });
        it("should creates a layer with type WFS", async () => {
            const config = {
                    id: "24266",
                    name: "wfsLayer",
                    visibility: true,
                    url: "https://geodienste.hamburg.de/HH_WMS_Verwaltungsgrenzen",
                    typ: "WFS",
                    layers: "wfsLayer"
                },
                wfsLayer = await layerFactory.createLayer(config);

            expect(wfsLayer).not.to.be.undefined;
            expect(wfsLayer.attributes.typ).to.equals("WFS");
        });

        it("should creates a layer with type TERRAIN3D, if mapMode is 3D", async () => {
            const terrainLayer = await layerFactory.createLayer(layerConfig[2], "3D");

            expect(terrainLayer).not.to.be.undefined;
            expect(terrainLayer.attributes.typ).to.equals("Terrain3D");
        });

        it("should don't creates a layer with type TERRAIN3D, if mapMode is 2D", async () => {
            const terrainLayer = await layerFactory.createLayer(layerConfig[2], "2D");

            expect(terrainLayer).to.be.undefined;
        });
    });

    describe("getVectorLayerTypes", () => {
        it("should return all vector layer types", () => {
            expect(layerFactory.getVectorLayerTypes()).to.deep.equals(["GEOJSON", "OAF", "SENSORTHINGS", "VECTORBASE", "WFS"]);
        });
    });
});
