import {expect} from "chai";
import sinon from "sinon";
import Layer2dRaster from "@core/layers/js/layer2dRaster";
import Layer2d from "@core/layers/js/layer2d";
import store from "@appstore";
import {nextTick} from "vue";

describe("src/core/js/layers/layer2dRaster.js", () => {
    let warn,
        layer2dSpy,
        origGetters;

    beforeEach(() => {
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);

        layer2dSpy = sinon.spy();

        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            }
        };

        origGetters = store.getters;
        mapCollection.addMap(map, "2D");
    });

    afterEach(() => {
        sinon.restore();
        store.getters = origGetters;
    });

    describe("createLayer", () => {
        it("new Layer2dRaster should create an layer with warning", () => {
            const layerWrapper = new Layer2dRaster({});

            expect(layerWrapper).not.to.be.undefined;
            expect(warn.calledOnce).to.be.true;
        });

        it("default infoFormat from config should be used", async () => {
            store.getters = {
                portalConfig: {
                    tree: {
                        rasterLayerDefaultInfoFormat: "text/html"
                    }
                }
            };
            sinon.stub(Layer2d, "call").callsFake(layer2dSpy);

            await nextTick(() => {
                new Layer2dRaster({});
            });

            expect(layer2dSpy.calledOnce).to.be.true;
            expect(layer2dSpy.firstCall.args[1]).to.be.deep.equal({infoFormat: "text/html"});
        });

        it("infoFormat should be text/xml if not set in config", () => {
            sinon.stub(Layer2d, "call").callsFake(layer2dSpy);

            new Layer2dRaster({});

            expect(layer2dSpy.calledOnce).to.be.true;
            expect(layer2dSpy.firstCall.args[1]).to.be.deep.equal({infoFormat: "text/xml"});
        });
    });
});

