import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import drawInteraction from "@masterportal/masterportalapi/src/maps/interactions/drawInteraction.js";
import {expect} from "chai";
import sinon from "sinon";
import VectorSource from "ol/source/Vector.js";

import DrawTypesComponent from "@shared/modules/draw/components/DrawTypes.vue";


describe("src/shared/modules/draw/components/DrawTypes.vue", () => {
    let addInteractionSpy,
        createDrawInteractionSpy,
        currentLayout,
        drawCircleSpy,
        removeInteractionSpy,
        selectedInteraction,
        setSelectedDrawType,
        setSelectedDrawTypeMain,
        source,
        store,
        wrapper;

    beforeEach(() => {
        addInteractionSpy = sinon.spy();
        createDrawInteractionSpy = sinon.spy(drawInteraction, "createDrawInteraction");
        currentLayout = {
            fillColor: [55, 126, 184],
            fillTransparency: 0,
            strokeColor: [0, 0, 0],
            strokeWidth: 1
        };
        drawCircleSpy = sinon.spy(drawInteraction, "drawCircle");
        removeInteractionSpy = sinon.spy();
        selectedInteraction = "draw";
        setSelectedDrawType = sinon.spy();
        setSelectedDrawTypeMain = sinon.spy();
        source = new VectorSource();


        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addInteraction: addInteractionSpy,
                        removeInteraction: removeInteractionSpy
                    },
                    getters: {
                        projection: () => "EPSG:4326"
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        Draw: {
                            namespaced: true,
                            getters: {
                                iconList: () => []
                            },
                            mutations: {
                                setCircleOptions: sinon.stub(),
                                addDrawTypeSymbol: sinon.stub(),
                                incrementIdCounter: sinon.stub(),
                                setLineLength: sinon.stub(),
                                setSelectedSymbol: sinon.stub()
                            },
                            state: {
                                drawTypesGeometrie: ["line", "box", "polygon", "circle", "doubleCircle"],
                                drawTypesMain: ["pen", "geometries", "symbols"],
                                drawTypesSymbols: [],
                                buttonsDisabled: false,
                                drawSymbolImgPath: "",
                                selectedSymbol: null
                            }
                        }
                    }
                }
            }
        });
        mapCollection.clear();
        mapCollection.addMap({
            id: "ol",
            mode: "2D",
            addOverlay: sinon.spy(),
            on: sinon.spy()
        }, "2D");
    });


    it("renders the drawTypes", () => {
        wrapper = shallowMount(DrawTypesComponent, {
            propsData: {
                currentLayout,
                setSelectedDrawType,
                source
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#draw-pen").exists()).to.be.true;
        expect(wrapper.find("#draw-pen").attributes().aria).to.equals("common:shared.modules.draw.drawTypes.pen");

        expect(wrapper.find("#draw-geometries").exists()).to.be.true;
        expect(wrapper.find("#draw-geometries").attributes().aria).to.equals("common:shared.modules.draw.drawTypes.geometries");

        expect(wrapper.find("#draw-symbols").exists()).to.be.true;
        expect(wrapper.find("#draw-symbols").attributes().aria).to.equals("common:shared.modules.draw.drawTypes.symbols");
    });

    describe("startDrawingInitial", () => {
        it("should start drawing initial, if selectedDrawTypeMain === 'pen' and selectedDrawType === 'pen'", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    selectedDrawType: "pen",
                    selectedDrawTypeMain: "pen",
                    selectedInteraction,
                    setSelectedDrawType,
                    setSelectedDrawTypeMain,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            const regulateDrawInteractionSpy = sinon.spy(wrapper.vm, "regulateDrawInteraction");

            wrapper.vm.startDrawingInitial();

            expect(regulateDrawInteractionSpy.calledOnce).to.be.true;
            expect(regulateDrawInteractionSpy.firstCall.args[0]).to.equals("pen");
        });

        it("should start drawing initial, if selectedDrawTypeMain === '' and selectedDrawType === 'circle'", async () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    selectedDrawType: "circle",
                    selectedDrawTypeMain: "",
                    selectedInteraction,
                    setSelectedDrawType,
                    setSelectedDrawTypeMain,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            const regulateInteractionSpy = sinon.spy(wrapper.vm, "regulateInteraction");

            expect(setSelectedDrawType.calledOnce).to.be.true;
            expect(setSelectedDrawType.firstCall.args[0]).to.equals("");

            await wrapper.vm.$nextTick();

            expect(regulateInteractionSpy.calledOnce).to.be.true;
            expect(regulateInteractionSpy.firstCall.args[0]).to.equals("circle");
        });
    });

    describe("selectedInteraction", () => {
        beforeEach(() => {
            selectedInteraction = "delete";
        });

        it("should set selectedDrawType and selectedDrawTypeMain to empty string, if selectedInteraction is not 'draw'", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    selectedInteraction,
                    setSelectedDrawType,
                    setSelectedDrawTypeMain,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.$options.watch.selectedInteraction.call(wrapper.vm, selectedInteraction);

            expect(setSelectedDrawType.calledOnce).to.be.true;
            expect(setSelectedDrawType.firstCall.args[0]).to.equals("");
            expect(setSelectedDrawTypeMain.calledOnce).to.be.true;
            expect(setSelectedDrawTypeMain.firstCall.args[0]).to.equals("");
        });
    });

    describe("regulateInteraction", () => {
        it("should remove current interaction and add new interaction", () => {
            const drawType = "pen";

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.regulateInteraction(drawType);

            expect(removeInteractionSpy.calledOnce).to.be.true;
            expect(addInteractionSpy.calledOnce).to.be.true;
        });
    });

    describe("regulateInteraction", () => {
        it("should remove current interaction and don't add interaction, if drawType is missing", () => {
            const drawType = "abc";

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.regulateInteraction(drawType);

            expect(removeInteractionSpy.calledOnce).to.be.true;
            expect(addInteractionSpy.notCalled).to.be.true;
        });
    });

    describe("regulateDrawInteraction", () => {
        it("should create 'box' draw interaction and add interaction ", () => {
            const drawType = "box";

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.regulateDrawInteraction(drawType);

            expect(createDrawInteractionSpy.calledOnce).to.be.true;
            expect(createDrawInteractionSpy.firstCall.args[0]).to.equals(drawType);
            expect(createDrawInteractionSpy.firstCall.args[1]).to.deep.equals(source);
            expect(addInteractionSpy.calledOnce).to.be.true;
        });

        it("should create 'circle' draw interaction and add interaction ", () => {
            const drawType = "circle";

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.regulateDrawInteraction(drawType);

            expect(createDrawInteractionSpy.calledOnce).to.be.true;
            expect(createDrawInteractionSpy.firstCall.args[0]).to.equals(drawType);
            expect(createDrawInteractionSpy.firstCall.args[1]).to.deep.equals(source);
            expect(drawCircleSpy.calledOnce).to.be.true;
            expect(drawCircleSpy.firstCall.args[0]).to.deep.equals(wrapper.vm.currentDrawInteraction);
            expect(drawCircleSpy.firstCall.args[1]).to.equals(drawType);
            expect(drawCircleSpy.firstCall.args[2]).to.equals("EPSG:4326");
            expect(drawCircleSpy.firstCall.args[3]).to.deep.equals(source);
            expect(drawCircleSpy.firstCall.args[4]).to.deep.equals({
                innerRadius: 0,
                interactive: true,
                outerRadius: 0,
                unit: "m"
            });
            expect(addInteractionSpy.calledOnce).to.be.true;
        });

        describe("getButtonLabel", () => {
            it("Should return a empty string, if the given button type is not correct", () => {
                wrapper = shallowMount(DrawTypesComponent, {
                    propsData: {
                        currentLayout,
                        setSelectedDrawType,
                        source
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getButtonLabel("")).equal("");
                expect(wrapper.vm.getButtonLabel(null)).equal("");
                expect(wrapper.vm.getButtonLabel({})).equal("");
                expect(wrapper.vm.getButtonLabel([])).equal("");
                expect(wrapper.vm.getButtonLabel(123)).equal("");
                expect(wrapper.vm.getButtonLabel(true)).equal("");
            });
            it("Should return a empty string, if the given button type does not exist in the list", () => {
                wrapper = shallowMount(DrawTypesComponent, {
                    propsData: {
                        currentLayout,
                        setSelectedDrawType,
                        source
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getButtonLabel("abc")).equal("");
            });
            it("Should return the label of the button type pen", () => {
                const drawType = "pen",
                    label = "additional:modules.tools.simulationTool.freeForm";

                wrapper = shallowMount(DrawTypesComponent, {
                    propsData: {
                        currentLayout,
                        setSelectedDrawType,
                        source,
                        drawTypeLabels: [{type: "pen", label: "additional:modules.tools.simulationTool.freeForm"}, {type: "geometries", label: "additional:modules.tools.simulationTool.rectangle"}, {type: "symbols", label: ""}]
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getButtonLabel(drawType)).equal(label);
            });
            it("Should return the label of the button type geometries", () => {
                const drawType = "geometries",
                    label = "additional:modules.tools.simulationTool.rectangle";

                wrapper = shallowMount(DrawTypesComponent, {
                    propsData: {
                        currentLayout,
                        setSelectedDrawType,
                        source,
                        drawTypeLabels: [{type: "pen", label: "additional:modules.tools.simulationTool.freeForm"}, {type: "geometries", label: "additional:modules.tools.simulationTool.rectangle"}, {type: "symbols", label: ""}]
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getButtonLabel(drawType)).equal(label);
            });
        });

        it("should emit start-drawing events", async () => {
            const drawType = "circle";

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    shouldEmitEvents: true
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.regulateInteraction(drawType);

            expect(wrapper.emitted("stop-drawing")).to.be.ok;
            expect(wrapper.emitted("start-drawing")).to.be.ok;
        });
    });

    describe("regulateStaticCircleInteraction", () => {
        it("should start drawCircle", () => {
            const drawType = "circle";

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.regulateStaticCircleInteraction(drawType);

            expect(drawCircleSpy.calledOnce).to.be.true;
            expect(drawCircleSpy.firstCall.args[0]).to.deep.equals(wrapper.vm.currentDrawInteraction);
            expect(drawCircleSpy.firstCall.args[1]).to.equals(drawType);
            expect(drawCircleSpy.firstCall.args[2]).to.equals("EPSG:4326");
            expect(drawCircleSpy.firstCall.args[3]).to.deep.equals(source);
            expect(drawCircleSpy.firstCall.args[4]).to.deep.equals({
                innerRadius: 0,
                interactive: true,
                outerRadius: 0,
                unit: "m"
            });
        });
    });

    describe("getButtonLabel with textLabels: true", () => {
        it("should return '' if drawType is null or empty", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    textLabels: true
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.getButtonLabel("")).to.equal("");
            expect(wrapper.vm.getButtonLabel(null)).to.equal("");
        });

        it("should return translated label from drawTypeLabels if entry exists for drawType", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    textLabels: true,
                    drawTypeLabels: [{type: "pen", label: "some:label.key"}]
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.getButtonLabel("pen")).to.equal("some:label.key");
        });

        it("should return getDrawTypeName result if drawType is in allDrawTypes but not in drawTypeLabels", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    textLabels: true,
                    drawTypeLabels: []
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.getButtonLabel("pen")).to.equal("common:shared.modules.draw.drawTypes.pen");
        });

        it("should return '' if drawType is unknown and not in drawTypeLabels", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    textLabels: true,
                    drawTypeLabels: []
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.getButtonLabel("unknown")).to.equal("");
        });
    });

    describe("drawLayout prop", () => {
        it("should accept drawLayout: true as prop", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    drawLayout: true
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.props("drawLayout")).to.equal(true);
        });

        it("should default drawLayout to false", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.props("drawLayout")).to.equal(false);
        });
    });

    describe("buttonsDisabled", () => {
        it("should disable all IconButtons when buttonsDisabled is true in store", () => {
            const disabledStore = createStore({
                modules: {
                    Maps: {
                        namespaced: true,
                        actions: {
                            addInteraction: addInteractionSpy,
                            removeInteraction: removeInteractionSpy
                        },
                        getters: {
                            projection: () => "EPSG:4326"
                        }
                    },
                    Modules: {
                        namespaced: true,
                        modules: {
                            Draw: {
                                namespaced: true,
                                getters: {
                                    iconList: () => []
                                },
                                state: {
                                    drawTypesGeometrie: ["line", "box", "polygon", "circle", "doubleCircle"],
                                    drawTypesMain: ["pen", "geometries", "symbols"],
                                    drawTypesSymbols: [],
                                    buttonsDisabled: true,
                                    drawSymbolImgPath: "",
                                    selectedSymbol: null
                                }
                            }
                        }
                    }
                }
            });

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    buttonsDisabled: true,
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [disabledStore]
                }
            });

            wrapper.findAllComponents({name: "IconButton"}).forEach(btn => {
                expect(btn.props("disabled")).to.equal(true);
            });
        });

        it("should not disable IconButtons when buttonsDisabled is false in store", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.findAllComponents({name: "IconButton"}).forEach(btn => {
                expect(btn.props("disabled")).to.equal(false);
            });
        });
    });

    describe("tooltip logic on drawstart and drawend", () => {
        let fakeInteraction, callbacks;

        beforeEach(() => {
            callbacks = {};
            fakeInteraction = {
                on: sinon.stub().callsFake((event, cb) => {
                    callbacks[event] = cb;
                })
            };
            createDrawInteractionSpy.restore();
            drawCircleSpy.restore();
            sinon.stub(drawInteraction, "createDrawInteraction").returns(fakeInteraction);
            sinon.stub(drawInteraction, "drawCircle");
        });

        it("should emit 'drawstart' event on drawstart", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {currentLayout, setSelectedDrawType, source},
                global: {plugins: [store]}
            });
            wrapper.vm.regulateDrawInteraction("line");

            const mockGeom = {getLength: () => 100, on: sinon.stub()};

            callbacks.drawstart({feature: {getGeometry: () => mockGeom}});

            expect(wrapper.emitted("drawstart")).to.be.ok;
        });

        it("should emit 'circle-radius' with rounded radius on geometry change for 'circle'", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {currentLayout, setSelectedDrawType, source},
                global: {plugins: [store]}
            });
            wrapper.vm.regulateDrawInteraction("circle");

            const geometryCallbacks = {};
            const mockGeom = {
                getRadius: () => 150.7,
                on: sinon.stub().callsFake((event, cb) => {
                    geometryCallbacks[event] = cb;
                })
            };

            callbacks.drawstart({feature: {getGeometry: () => mockGeom}});
            geometryCallbacks.change();

            expect(wrapper.emitted("circle-radius")).to.be.ok;
            expect(wrapper.emitted("circle-radius")[0][0]).to.equal(151);
        });

        it("should call setLineLength with rounded length on geometry change for 'line'", () => {
            const setLineLengthSpy = sinon.spy();

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {currentLayout, setSelectedDrawType, source, setLineLength: setLineLengthSpy},
                global: {plugins: [store]}
            });

            wrapper.vm.regulateDrawInteraction("line");

            const geometryCallbacks = {};
            const mockGeom = {
                getLength: () => 234.6,
                on: sinon.stub().callsFake((event, cb) => {
                    geometryCallbacks[event] = cb;
                })
            };

            callbacks.drawstart({feature: {getGeometry: () => mockGeom}});
            geometryCallbacks.change();

            expect(setLineLengthSpy.calledOnce).to.be.true;
            expect(setLineLengthSpy.firstCall.args[0]).to.equal(235);
        });

        it("should emit 'drawend' event on drawend", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {currentLayout, setSelectedDrawType, source},
                global: {plugins: [store]}
            });
            wrapper.vm.regulateDrawInteraction("box");

            callbacks.drawend({feature: {get: sinon.stub(), set: sinon.stub(), setStyle: sinon.stub(), getGeometry: () => ({getType: () => "Polygon"})}});

            expect(wrapper.emitted("drawend")).to.be.ok;
        });

        it("should emit 'circle-radius' with rounded radius on drawend for 'circle'", () => {
            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {currentLayout, setSelectedDrawType, source},
                global: {plugins: [store]}
            });
            wrapper.vm.regulateDrawInteraction("circle");

            const mockStartGeom = {getRadius: () => 100, on: sinon.stub()};

            callbacks.drawstart({feature: {getGeometry: () => mockStartGeom}});

            const mockEndGeom = {getRadius: () => 250.4, getType: () => "Circle", un: sinon.stub()};

            callbacks.drawend({feature: {get: sinon.stub(), set: sinon.stub(), setStyle: sinon.stub(), getGeometry: () => mockEndGeom}});

            const emitted = wrapper.emitted("circle-radius");

            expect(emitted).to.be.ok;
            expect(emitted[emitted.length - 1][0]).to.equal(250);
        });
    });

    describe("setSelectedSymbol", () => {
        it("should call setSelectedSymbol(null) when toggling off the currently active drawType", () => {
            const setSelectedSymbolSpy = sinon.spy();

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    selectedDrawType: "pen",
                    setSelectedSymbol: setSelectedSymbolSpy
                },
                global: {plugins: [store]}
            });

            wrapper.vm.regulateInteraction("pen");

            expect(setSelectedSymbolSpy.calledOnce).to.be.true;
            expect(setSelectedSymbolSpy.firstCall.args[0]).to.be.null;
        });

        it("should call setSelectedSymbol with the symbol object when switching to a symbol drawType", () => {
            const symbol = {id: "my-symbol", type: "image", value: "/img/s.png"};
            const symbolStore = createStore({
                modules: {
                    Maps: {
                        namespaced: true,
                        actions: {addInteraction: addInteractionSpy, removeInteraction: removeInteractionSpy},
                        getters: {projection: () => "EPSG:4326"}
                    },
                    Modules: {
                        namespaced: true,
                        modules: {
                            Draw: {
                                namespaced: true,
                                getters: {iconList: () => [symbol]},
                                mutations: {
                                    setCircleOptions: sinon.stub(),
                                    addDrawTypeSymbol: sinon.stub(),
                                    incrementIdCounter: sinon.stub(),
                                    setLineLength: sinon.stub(),
                                    setSelectedSymbol: sinon.stub()
                                },
                                state: {
                                    drawTypesGeometrie: ["line", "box", "polygon", "circle", "doubleCircle"],
                                    drawTypesMain: ["pen", "geometries", "symbols"],
                                    drawTypesSymbols: [],
                                    buttonsDisabled: false,
                                    drawSymbolImgPath: "",
                                    selectedSymbol: null
                                }
                            }
                        }
                    }
                }
            });

            const setSelectedSymbolSpy = sinon.spy();

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    selectedDrawType: "pen",
                    iconList: [symbol],
                    setSelectedSymbol: setSelectedSymbolSpy
                },
                global: {plugins: [symbolStore]}
            });

            wrapper.vm.regulateInteraction(symbol.id);

            expect(setSelectedSymbolSpy.calledOnce).to.be.true;
            expect(setSelectedSymbolSpy.firstCall.args[0]).to.deep.equal(symbol);
        });
    });

    describe("symbol image style on drawstart", () => {
        let fakeInteraction, callbacks;

        beforeEach(() => {
            callbacks = {};
            fakeInteraction = {
                on: sinon.stub().callsFake((event, cb) => {
                    callbacks[event] = cb;
                })
            };
            createDrawInteractionSpy.restore();
            drawCircleSpy.restore();
            sinon.stub(drawInteraction, "createDrawInteraction").returns(fakeInteraction);
            sinon.stub(drawInteraction, "drawCircle");
        });

        it("should call feature.setStyle with Style and Icon when drawType is an image symbol", () => {
            const symbolId = "my-symbol";
            const imageStore = createStore({
                modules: {
                    Maps: {
                        namespaced: true,
                        actions: {
                            addInteraction: addInteractionSpy,
                            removeInteraction: removeInteractionSpy
                        },
                        getters: {
                            projection: () => "EPSG:4326"
                        }
                    },
                    Modules: {
                        namespaced: true,
                        modules: {
                            Draw: {
                                namespaced: true,
                                getters: {
                                    iconList: () => [{id: symbolId, type: "image", value: "/img/symbol.png", scale: 2}]
                                },
                                mutations: {
                                    setCircleOptions: sinon.stub(),
                                    addDrawTypeSymbol: sinon.stub(),
                                    incrementIdCounter: sinon.stub(),
                                    setLineLength: sinon.stub(),
                                    setSelectedSymbol: sinon.stub()
                                },
                                state: {
                                    drawTypesGeometrie: ["line", "box", "polygon", "circle", "doubleCircle"],
                                    drawTypesMain: ["pen", "geometries", "symbols"],
                                    drawTypesSymbols: [],
                                    buttonsDisabled: false,
                                    drawSymbolImgPath: "/path/",
                                    selectedSymbol: null
                                }
                            }
                        }
                    }
                }
            });

            wrapper = shallowMount(DrawTypesComponent, {
                propsData: {
                    currentLayout,
                    setSelectedDrawType,
                    source,
                    iconList: [{id: symbolId, type: "image", value: "/img/symbol.png", scale: 2}]
                },
                global: {plugins: [imageStore]}
            });

            wrapper.vm.regulateDrawInteraction(symbolId);

            const setStyleSpy = sinon.spy();

            callbacks.drawstart({feature: {getGeometry: () => ({}), setStyle: setStyleSpy}});

            expect(setStyleSpy.calledOnce).to.be.true;
        });
    });
});
