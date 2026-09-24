import {expect} from "chai";
import sinon from "sinon";
import "../../../../../../devtools/tests/cesiumMocks.js";
import buildCesiumImageLayer from "@modules/print/js/buildCesiumImageLayer.js";
describe("buildCesiumImageLayer", () => {
    describe("takeOl3DScreenshot", () => {
        it("should return a rejected promise", async () => {
            const scene = {
                events: [],
                postRender: {
                    addEventListener: (evt) => {
                        scene.events.push(evt);
                    }
                },
                requestRender: () => {
                    scene.events[0]();
                }
            };

            await buildCesiumImageLayer.takeOl3DScreenshot(scene).catch(e => {
                expect(e instanceof Error).to.be.true;
            });
        });
        it("should return a resolved promise", async () => {
            const scene = {
                events: [],
                postRender: {
                    addEventListener: (evt) => {
                        scene.events.push(evt);
                        return () => sinon.stub();
                    }
                },
                requestRender: () => {
                    scene.events[0]();
                },
                canvas: {
                    toDataURL: () => "foo"
                }
            };

            await buildCesiumImageLayer.takeOl3DScreenshot(scene).then(result => {
                expect(result).to.be.equal("foo");
            });
        });
        it("should return promise with expected result", async () => {
            const scene = {
                events: [],
                postRender: {
                    addEventListener: (evt) => {
                        scene.events.push(evt);
                        return () => sinon.stub();
                    }
                },
                requestRender: () => {
                    scene.events[0]();
                },
                canvas: document.createElement("canvas")
            };

            await buildCesiumImageLayer.takeOl3DScreenshot(scene, {width: 0, height: 0}).then(result => {
                expect(result).to.be.equal("data:,");
            });
        });
        it("should scale the cropped canvas down to targetWidth/targetHeight when given", async () => {
            let createdCanvas;
            const scene = {
                    events: [],
                    postRender: {
                        addEventListener: (evt) => {
                            scene.events.push(evt);
                            return () => sinon.stub();
                        }
                    },
                    requestRender: () => {
                        scene.events[0]();
                    },
                    canvas: document.createElement("canvas")
                },
                originalCreateElement = document.createElement.bind(document);

            sinon.stub(document, "createElement").callsFake(tag => {
                const element = originalCreateElement(tag);

                if (tag === "canvas") {
                    createdCanvas = element;
                }
                return element;
            });

            await buildCesiumImageLayer.takeOl3DScreenshot(scene, {offsetX: 0, offsetY: 0, width: 20, height: 10, targetWidth: 5, targetHeight: 2});
            document.createElement.restore();

            expect(createdCanvas.width).to.be.equal(5);
            expect(createdCanvas.height).to.be.equal(2);
        });
    });
    describe("createFakeExtent", () => {
        it("should return expected array", () => {
            const view = {
                    getResolution: () => 1,
                    getCenter: () => [1, 1]
                },
                pixels = [1, 1],
                result = [
                    0.5,
                    0.5,
                    1.5,
                    1.5
                ];

            expect(buildCesiumImageLayer.createFakeExtent(view, pixels)).to.deep.equal(result);
        });
    });
    describe("createMapfishPrintImageLayerFromCesium", () => {
        it("should return mapfish print dialog as expected", async () => {
            const ol3d = {
                    getOlMap: () => {
                        return {
                            getView: () => {
                                return {
                                    getResolution: () => 1,
                                    getCenter: () => [1, 1]
                                };
                            }
                        };
                    },
                    getCesiumScene: () => {
                        const scene = {
                            events: [],
                            postRender: {
                                addEventListener: (evt) => {
                                    scene.events.push(evt);
                                    return () => sinon.stub();
                                }
                            },
                            requestRender: () => {
                                scene.events[0]();
                            },
                            canvas: document.createElement("canvas")
                        };

                        return scene;
                    }
                },
                expected = {
                    type: "image",
                    name: "Cesium",
                    opacity: 1,
                    imageFormat: "image/jpeg",
                    extent: [1, 1, 1, 1],
                    baseURL: "data:,"
                };

            expect(await buildCesiumImageLayer.createMapfishPrintImageLayerFromCesium(ol3d, {width: 0, height: 0})).to.deep.equal(expected);
        });
    });
});
