import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import DrawModuleComponent from "@modules/draw/components/DrawModule.vue";
import {mapConfigStyleSettingsToLayout} from "@modules/draw/js/drawConfigSettings.js";


describe("src/modules/draw/components/DrawModule.vue", () => {
    let selectedDrawType,
        selectedDrawTypeMain,
        enableAttributesSelector,
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
        enableAttributesSelector = true;

        store = createStore({
            actions: {
                addLayerToLayerConfig: sinon.stub()
            },
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Draw: {
                            namespaced: true,
                            actions: {
                                initializeDrawLayer: sinon.stub().resolves(null)
                            },
                            getters: {
                                buttonsDisabled: () => false,
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
                                        strokeWidth: 1,
                                        squareMethod: "interactive",
                                        squareArea: 0,
                                        squareUnit: "m"
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
                                drawEdits: () => ["deleteAll", "delete", "modify", "editAttributes", "undo", "redo"],
                                enableAttributesSelector: () => enableAttributesSelector,
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
                                drawSymbolSettings: () => null,
                                drawLineSettings: () => null,
                                drawCurveSettings: () => null,
                                drawAreaSettings: () => null,
                                drawCircleSettings: () => null,
                                drawDoubleCircleSettings: () => null,
                                drawSquareSettings: () => null,
                                writeTextSettings: () => null,
                                drawTypesGeometrie: () => ["line", "box", "polygon", "circle", "doubleCircle"],
                                drawTypesMain: () => ["pen", "geometries", "symbols"],
                                drawTypesSymbols: () => ["point"],
                                iconList: () => [],
                                selectedDrawType: () => selectedDrawType,
                                selectedDrawTypeMain: () => selectedDrawTypeMain,
                                selectedInteraction: () => "draw",
                                strokeRange: () => [1, 16],
                                units: sinon.stub().returns(["m", "km"])
                            },
                            mutations: {
                                addDrawTypeSymbol: sinon.stub(),
                                incrementIdCounter: sinon.stub(),
                                setCircleOptions: sinon.stub(),
                                setCurrentLayout: sinon.stub(),
                                setCurrentLayoutOuterCircle: sinon.stub(),
                                setLineLength: sinon.stub(),
                                setSelectedDrawType: sinon.stub(),
                                setSelectedDrawTypeMain: sinon.stub(),
                                setSelectedInteraction: sinon.stub(),
                                setSelectedSymbol: sinon.stub()
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

    describe("config settings mapping", () => {
        it("positive: maps drawLineSettings to current layout", () => {
            const result = mapConfigStyleSettingsToLayout({
                strokeWidth: 3,
                colorContour: [10, 20, 30, 1],
                opacityContour: 0.25,
                squareMethod: "defined"
            });

            expect(result).to.deep.equal({
                strokeWidth: 3,
                strokeColor: [10, 20, 30],
                fillTransparency: 75,
                squareMethod: "defined"
            });
        });

        it("negative: returns empty layout for invalid config settings", () => {
            const result = mapConfigStyleSettingsToLayout(undefined);

            expect(result).to.deep.equal({});
        });
    });

    describe("isEditAttributesControlEnabled", () => {
        it("positive: passes false to DrawEdit when enableAttributesSelector is false", () => {
            enableAttributesSelector = false;
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.isEditAttributesControlEnabled).to.be.false;
            expect(wrapper.findComponent({name: "DrawEdit"}).props("showEditAttributesControl")).to.be.false;
        });

        it("negative: passes true to DrawEdit when enableAttributesSelector is true", () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.isEditAttributesControlEnabled).to.be.true;
            expect(wrapper.findComponent({name: "DrawEdit"}).props("showEditAttributesControl")).to.be.true;
        });
    });
});
