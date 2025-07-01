import {expect} from "chai";
import Map from "ol/Map";

import layerCollection from "@core/layers/js/layerCollection.js";

describe("src/core/js/layers/layerCollection.js", () => {
    let layer1,
        layer2,
        layer3,
        map;

    before(() => {
        mapCollection.clear();
        map = new Map();
        mapCollection.addMap(map, "2D");

        layer1 = {
            attributes: {
                id: "firstLayer",
                visible: true
            },
            get: function (key) {
                return layer1.attributes[key];
            },
            getLayer: () => {
                return {
                    get: (key) => {
                        return layer1.attributes[key];
                    }
                };
            }
        };
        layer2 = {
            attributes: {
                id: "secondLayer",
                visible: false
            },
            get: function (key) {
                return layer1.attributes[key];
            },
            getLayer: () => {
                return {
                    get: (key) => {
                        return layer2.attributes[key];
                    }
                };
            }
        };
        layer3 = {
            attributes: {
                id: "thirdLayer",
                visible: true
            },
            get: function (key) {
                return layer1.attributes[key];
            },
            getLayer: () => {
                return {
                    get: (key) => {
                        return layer3.attributes[key];
                    }
                };
            }
        };
    });

    beforeEach(() => {
        layerCollection.clear();
    });

    after(() => {
        layerCollection.clear();
    });

    describe("addLayer and getLayers", () => {
        it("adds one layer to collection", () => {
            layerCollection.addLayer(layer1);

            expect(layerCollection.getLayers().length).to.equals(1);
            expect(layerCollection.getLayers()).to.deep.include(layer1);
        });

        it("adds two layer to collection", () => {
            layerCollection.addLayer(layer1);
            layerCollection.addLayer(layer2);

            expect(layerCollection.getLayers().length).to.equals(2);
            expect(layerCollection.getLayers()).to.have.deep.members([layer1, layer2]);
        });
    });

    describe("addLayer and getLayerById", () => {
        it("adds three layer to collection and get the layers by id", () => {
            layerCollection.addLayer(layer1);
            layerCollection.addLayer(layer2);
            layerCollection.addLayer(layer3);

            expect(layerCollection.getLayers().length).to.equals(3);
            expect(layerCollection.getLayerById("thirdLayer")).to.equals(layer3);
            expect(layerCollection.getLayerById("secondLayer")).to.equals(layer2);
            expect(layerCollection.getLayerById("firstLayer")).to.equals(layer1);
        });
    });

    describe("get olLayers", () => {
        it("adds three layer to collection and get the layers that are visible", () => {
            layerCollection.addLayer(layer1);
            layerCollection.addLayer(layer2);
            layerCollection.addLayer(layer3);

            expect(layerCollection.getOlLayers().length).to.equals(2);
            expect(layerCollection.getOlLayers()[0].get("id")).to.deep.equals("firstLayer");
            expect(layerCollection.getOlLayers()[1].get("id")).to.deep.equals("thirdLayer");
        });
    });

    describe("removeLayerById", () => {
        it("adds three layer to collection and get the layers that are visible", () => {
            layerCollection.addLayer(layer1);
            layerCollection.addLayer(layer2);
            layerCollection.addLayer(layer3);

            layerCollection.removeLayerById("firstLayer");

            expect(layerCollection.getLayers().length).to.equals(2);
        });
    });
});
