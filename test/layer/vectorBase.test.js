import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector.js";
import * as vectorBase from "../../src/layer/vectorBase";

describe("vectorBase.js", function () {

    describe("createLayerSource", function () {
        it("creates a layerSource with features", function () {
            const attr = {
                    features: [
                        new Feature({geometry: new Polygon([[[565086.1948534324, 5934664.461947621], [565657.6945448224, 5934738.54524095], [565625.9445619675, 5934357.545446689], [565234.3614400891, 5934346.962119071], [565086.1948534324, 5934664.461947621]]])}),
                        new Feature({geometry: new Point([565826.38, 5934174.40])})
                    ]
                },
                source = vectorBase.createLayerSource(attr);

            expect(source).toBeInstanceOf(VectorSource);
        });

        it("creates a layerSource without features", function () {
            const source = vectorBase.createLayerSource({});

            expect(source).toBeInstanceOf(VectorSource);
        });
    });

    describe("createLayer", function () {
        it("creates a vector Base Layer", function () {
            const attr = {
                    name: "Albus Percival Wulfric Brian Dumbledore",
                    typ: "VectorBase",
                    gfiAttributes: "ignore",
                    id: "Rawenclaw_01"
                },
                layer = vectorBase.createLayer(attr);

            expect(layer).toBeInstanceOf(VectorLayer);
            expect(layer.get("name")).toEqual("Albus Percival Wulfric Brian Dumbledore");
            expect(layer.get("typ")).toEqual("VectorBase");
            expect(layer.get("id")).toEqual("Rawenclaw_01");
        });
    });

    describe("updateSource", function () {
        it("updateSource will fetch layer again", function () {
            const layer = vectorBase.createLayer({id: "id"}),
                layerGetSourceMock = jest.fn(() => {
                    return {
                        clear: () => this,
                        addFeatures: () => this
                    };
                });

            layer.getSource = layerGetSourceMock;
            vectorBase.updateSource(layer);
            expect(layerGetSourceMock.mock.calls.length).toBe(2);
        });
    });

});
