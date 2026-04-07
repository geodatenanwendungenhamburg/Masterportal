import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import DrawModuleComponent from "@modules/draw/components/DrawModule.vue";


describe("src/modules/draw/components/DrawModule.vue", () => {
    let selectedDrawType,
        selectedDrawTypeMain,
        store,
        wrapper;

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            addLayer: sinon.spy(),
            getLayers: () => {
                return {
                    getArray: () => []
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        selectedDrawType = "";
        selectedDrawTypeMain = "";

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Draw: {
                            namespaced: true,
                            actions: {},
                            getters: {
                                circleOptions: () => {
                                    return {
                                        innerRadius: 100,
                                        interactive: true,
                                        outerRadius: 500
                                    };
                                },
                                currentLayout: () => {
                                    return {
                                        fillColor: [55, 126, 184],
                                        fillTransparency: 0,
                                        strokeColor: [0, 0, 0],
                                        strokeWidth: 1
                                    };
                                },
                                currentLayoutOuterCircle: () => {
                                    return {
                                        fillColor: [0, 0, 0],
                                        fillTransparency: 100,
                                        strokeColor: [200, 0, 0],
                                        strokeWidth: 1
                                    };
                                },
                                drawEdits: () => ["deleteAll", "delete", "modify", "undo", "redo"],
                                drawIcons: () => {
                                    return {
                                        box: "bi-square",
                                        circle: "bi-circle",
                                        doubleCircle: "bi-record-circle",
                                        geometries: "bi-hexagon-fill",
                                        line: "bi-slash-lg",
                                        pen: "bi-pencil-fill",
                                        point: "bi-circle-fill",
                                        polygon: "bi-octagon",
                                        symbols: "bi-circle-square"
                                    };
                                },
                                drawTypesGeometrie: () => ["line", "box", "polygon", "circle", "doubleCircle"],
                                drawTypesMain: () => ["pen", "geometries", "symbols"],
                                drawTypesSymbols: () => ["point"],
                                selectedDrawType: () => selectedDrawType,
                                selectedDrawTypeMain: () => selectedDrawTypeMain,
                                selectedInteraction: () => "draw",
                                strokeRange: () => [1, 16],
                                units: sinon.stub().returns(["m", "km"])
                            }
                        }
                    }
                }
            }
        });

        sinon.stub(document, "getElementById").callsFake(() => {
            return {
                getBoundingClientRect: () => ({
                    left: 100,
                    right: 200
                })
            };
        });
    });


    describe("DrawModule", () => {
        it("renders the draw module component", () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#modules-draw-module").exists()).to.be.true;
        });
    });

    describe("DrawEdit", () => {
        it("renders the shared module drawEdit", async () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit >draw-edit-stub").exists()).to.be.true;
            expect(wrapper.findAll("draw-edit-stub").length).to.equals(1);
        });
    });

    describe("DrawTypes and DrawLayout", () => {
        it("renders the shared module drawTypes", () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#draw-types > div > draw-types-stub").exists()).to.be.true;
        });

        it("renders the shared module drawTypes for selectedDrawTypeMain - geometries", () => {
            selectedDrawTypeMain = "geometries";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("layout-frame-stub").exists()).to.be.true;

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
        });

        it("renders the shared module drawTypes for selectedDrawTypeMain - symbols", () => {
            selectedDrawTypeMain = "symbols";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
        });

        it("renders the shared module drawTypes and draw layouts for selectedDrawTypeMain - symbols and selectedDrawType - circle", () => {
            selectedDrawTypeMain = "geometries";
            selectedDrawType = "circle";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
            expect(wrapper.findAll("layout-frame-stub").length).to.equals(2);
        });

        it("renders the shared module drawTypes and draw layouts for selectedDrawTypeMain - symbols and selectedDrawType - doubleCircle", () => {
            selectedDrawTypeMain = "geometries";
            selectedDrawType = "doubleCircle";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
            expect(wrapper.findAll("layout-frame-stub").length).to.equals(2);
        });
    });
});
