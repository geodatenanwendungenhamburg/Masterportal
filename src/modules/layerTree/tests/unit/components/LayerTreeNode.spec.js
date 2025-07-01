import {createStore} from "vuex";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";
import LayerTreeNode from "@modules/layerTree/components/LayerTreeNode.vue";

config.global.mocks.$t = key => key;

describe("src/modules/layerTree/components/LayerTreeNode.vue", () => {
    let store,
        wrapper,
        mapMode,
        layerBG_1,
        layerBG_2,
        layers2D,
        layers3D,
        layer2D_1,
        layer2D_2,
        layer2D_3,
        layer3D,
        subjectDataLayers,
        layersWithFolder,
        layersBG,
        addLayerButton,
        treeType,
        removeLayerSpy,
        setRemoveOnSpillSpy,
        allowBaselayerDrag;

    beforeEach(() => {
        mapMode = "2D";
        removeLayerSpy = sinon.spy();
        setRemoveOnSpillSpy = sinon.spy();
        addLayerButton = {
            active: false
        };
        allowBaselayerDrag = false;
        treeType = "";
        layer2D_1 = {
            id: "1",
            name: "layer2D_1",
            typ: "WMS",
            type: "layer",
            visibility: false,
            showInLayerTree: true
        };
        layer2D_2 = {
            id: "2",
            name: "layer2D_2",
            typ: "WFS",
            type: "layer",
            visibility: false,
            showInLayerTree: true
        };
        layer2D_3 = {
            id: "2D_3",
            name: "layer2D_3",
            typ: "WFS",
            type: "layer",
            visibility: false,
            showInLayerTree: true
        };
        layer3D = {
            id: "3",
            name: "layer3D",
            typ: "Terrain3D",
            type: "layer",
            visibility: false,
            showInLayerTree: true
        };
        layerBG_1 = {
            id: "11",
            name: "layerBG_1",
            typ: "WMS",
            type: "layer",
            visibility: true,
            showInLayerTree: true
        };
        layerBG_2 = {
            id: "12",
            name: "layerBG_2",
            typ: "WFS",
            type: "layer",
            visibility: false,
            showInLayerTree: true,
            isNeverVisibleInTree: true
        };
        layers2D = [
            layer2D_1,
            layer2D_2
        ];
        layers3D = [
            layer3D
        ];
        layersBG = [
            layerBG_1,
            layerBG_2
        ];
        layersWithFolder = [
            {
                name: "Titel Ebene 1",
                type: "folder",
                elements: [
                    {
                        name: "Titel Ebene 2",
                        type: "folder",
                        elements: [layer2D_1, layer2D_2,
                            {
                                name: "Titel Ebene 3",
                                type: "folder",
                                elements: [layer2D_3]
                            }]
                    }
                ]
            }];
        subjectDataLayers = layers2D;
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        LayerTreeNode,
                        LayerInformation: {
                            namespaced: true,
                            getters: {
                                icon: sinon.stub(),
                                pointOfContact: () => "ABC Kontakt",
                                publisher: () => ""
                            }
                        },
                        LayerTree: {
                            namespaced: true,
                            getters: {
                                delay: () => 500,
                                delayOnTouchOnly: () => true,
                                removeOnSpill: () => true,
                                touchStartThreshold: () => 3
                            },
                            actions: {
                                removeLayer: removeLayerSpy
                            },
                            mutations: {
                                setRemoveOnSpill: setRemoveOnSpillSpy
                            }
                        },
                        LayerSelection: {
                            namespaced: true,
                            getters: {
                                highlightLayerId: sinon.stub()
                            }
                        },
                        Contact: {
                            namespaced: true,
                            getters: {
                                name: () => "Contactname",
                                type: () => "contact"
                            }
                        },
                        ResizeHandle: {
                            namespaced: true,
                            getters: {
                                mainMenuWidth: () => 0,
                                secondaryMenuWidth: () => 0
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: () => mapMode
                    }
                }
            },
            getters: {
                isModuleAvailable: () => () => true,
                allLayerConfigs: () => layersBG.concat(subjectDataLayers),
                layerConfig: () => {
                    return {
                        [treeSubjectsKey]: {
                            elements: subjectDataLayers
                        },
                        [treeBaselayersKey]: {
                            elements: layersBG
                        }
                    };
                },
                layerConfigsByAttributes: () => () => [],
                portalConfig: () => {
                    return {
                        tree: {
                            type: treeType,
                            addLayerButton: addLayerButton,
                            allowBaselayerDrag: allowBaselayerDrag
                        }
                    };
                },
                showLayerAddButton: () => addLayerButton.active,
                showFolderPath: () => true
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("computed", () => {
        describe("sortedLayerConfig", () => {
            it("should sort by layerSequence when layerSequence is present", () => {
                layersBG = [];
                subjectDataLayers = [
                    {id: "1", zIndex: 3, layerSequence: 2, showInLayerTree: true},
                    {id: "2", zIndex: 2, layerSequence: 1, showInLayerTree: true},
                    {id: "3", zIndex: 1, layerSequence: 3, showInLayerTree: true}
                ];
                addLayerButton.active = false; // Use allLayerConfigs

                wrapper = mount(LayerTreeNode, {
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.sortedLayerConfig.map(layer => layer.id)).to.deep.equal(["2", "1", "3"]);
            });

            it("should sort by zIndex when layerSequence is not present", () => {
                layersBG = [];
                subjectDataLayers = [
                    {id: "B", zIndex: 2, showInLayerTree: true},
                    {id: "A", zIndex: 1, showInLayerTree: true}
                ];
                addLayerButton.active = false;

                wrapper = mount(LayerTreeNode, {
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.sortedLayerConfig.map(layer => layer.id)).to.deep.equal(["B", "A"]);
            });
        });
    });

    it("renders a simple layer", () => {
        wrapper = mount(LayerTreeNode, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".no-list").exists()).to.be.true;
        expect(wrapper.findAll("layer-tree-node-stub").length).to.be.equals(0);
        expect(wrapper.find(".dragArea").exists()).to.be.true;
        expect(wrapper.find("ul").exists()).to.be.true;
        expect(wrapper.findAll("li").length).to.be.equals(4);
        expect(wrapper.vm.getLayerArray(layer2D_1)).to.be.deep.equals([]);
        expect(wrapper.vm.getLayerArray(layer2D_2)).to.be.deep.equals([]);
        expect(wrapper.vm.getLayerArray(layerBG_1)).to.be.deep.equals([]);
        expect(wrapper.vm.getLayerArray(layerBG_2)).to.be.deep.equals([]);
        expect(wrapper.find("#layer-tree-layer-" + layer2D_1.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layer2D_2.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layerBG_1.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layerBG_2.id).exists()).to.be.false;
    });
    it("renders the LayerTree with 2D layers in folder structure", () => {
        subjectDataLayers = layersWithFolder;
        wrapper = mount(LayerTreeNode, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".no-list").exists()).to.be.true;
        expect(wrapper.find(".dragArea").exists()).to.be.true;
        expect(wrapper.find("ul").exists()).to.be.true;
        expect(wrapper.findAll("li").length).to.be.equals(3);
        expect(wrapper.find("li:nth-child(1) > div").exists()).to.be.true;
        expect(wrapper.find("li:nth-child(2) > div").exists()).to.be.false;
        // folder is only a li-tag with no children:
        expect(wrapper.find("li:nth-child(3) > div").exists()).to.be.false;
        expect(wrapper.vm.isLayerShowInLayerTree(layerBG_1)).to.be.true;
        expect(wrapper.vm.isLayerShowInLayerTree(layerBG_2)).to.be.false;
        expect(wrapper.find("#layer-tree-layer-" + layerBG_1.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layerBG_2.id).exists()).to.be.false;
        expect(setRemoveOnSpillSpy.calledOnce).to.be.true;
    });

    it("renders the LayerTree with 3D layers", () => {
        mapMode = "3D";
        subjectDataLayers = layers2D.concat(layers3D);
        wrapper = mount(LayerTreeNode, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".no-list").exists()).to.be.true;
        expect(wrapper.find(".dragArea").exists()).to.be.true;
        expect(wrapper.find("ul").exists()).to.be.true;
        expect(wrapper.findAll("li").length).to.be.equals(5);
        expect(wrapper.vm.isLayerShowInLayerTree(layer2D_1)).to.be.true;
        expect(wrapper.vm.isLayerShowInLayerTree(layer2D_2)).to.be.true;
        expect(wrapper.vm.isLayerShowInLayerTree(layer3D)).to.be.true;
        expect(wrapper.vm.isLayerShowInLayerTree(layerBG_1)).to.be.true;
        expect(wrapper.vm.isLayerShowInLayerTree(layerBG_2)).to.be.false;
        expect(wrapper.find("#layer-tree-layer-" + layer2D_1.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layer2D_2.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layer3D.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layerBG_1.id).exists()).to.be.true;
        expect(wrapper.find("#layer-tree-layer-" + layerBG_2.id).exists()).to.be.false;
        expect(setRemoveOnSpillSpy.calledOnce).to.be.true;
    });
    describe("methods", () => {
        it("removeLayerOnSpill - calls removeLayer if showLayerAddButton is true", () => {
            wrapper = mount(LayerTreeNode, {
                global: {
                    plugins: [store]
                }
            });
            wrapper.vm.removeLayerOnSpill({oldIndex: 1});
            expect(removeLayerSpy.notCalled).to.be.true;
        });
        it("removeLayerOnSpill - calls not removeLayer if showLayerAddButton is false", () => {
            addLayerButton.active = true;
            wrapper = mount(LayerTreeNode, {
                global: {
                    plugins: [store]
                }
            });
            wrapper.vm.removeLayerOnSpill({oldIndex: 1});
            expect(removeLayerSpy.calledOnce).to.be.true;
            expect(setRemoveOnSpillSpy.notCalled).to.be.true;
        });

        it("hideTooltip - should hide the corresponding tooltip of the event item", async () => {
            wrapper = mount(LayerTreeNode, {
                global: {
                    plugins: [store]
                }
            });
            const eventItem = document.createElement("div"),
                eventItemChild = document.createElement("span"),
                tooltipDiv = document.createElement("div");

            tooltipDiv.setAttribute("id", "tooltip1234");
            tooltipDiv.style.display = "block";
            document.body.appendChild(tooltipDiv);
            eventItemChild.classList.add("layer-checkbox-tooltip");
            eventItemChild.setAttribute("aria-describedby", "tooltip1234");
            eventItem.appendChild(eventItemChild);

            wrapper.vm.hideTooltip({item: eventItem});

            expect(document.getElementById("tooltip1234").style.display).to.equal("none");
            document.body.removeChild(tooltipDiv);
        });

        it("checkMove - should always allow moving base layer over base layer", () => {
            const checkMoveSpy = sinon.spy(wrapper.vm, "checkMove"),
                draggedLayer = {id: "1", baselayer: true},
                targetLayer = {id: "2", baselayer: true},
                event = {
                    draggedContext: {element: draggedLayer},
                    relatedContext: {element: targetLayer}
                },
                result = wrapper.vm.checkMove(event);

            expect(result).to.be.true;
            expect(checkMoveSpy.calledOnce).to.be.true;
        });
        it("checkMove - should not allow dragging base layer over non-base layer, when allowBaselayerDrag is false", () => {
            const checkMoveSpy = sinon.spy(wrapper.vm, "checkMove"),
                draggedLayer = {id: "1", baselayer: true},
                targetLayer = {id: "2", baselayer: false},
                event = {
                    draggedContext: {element: draggedLayer},
                    relatedContext: {element: targetLayer}
                },
                result = wrapper.vm.checkMove(event);

            expect(result).to.be.false;
            expect(checkMoveSpy.calledOnce).to.be.true;
        });
        it("checkMove - should allow dragging non-base layer over base layer, when allowBaselayerDrag is true", () => {
            allowBaselayerDrag = true;

            store = createStore({
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            namespaced: true,
                            LayerTreeNode,
                            LayerInformation: {
                                namespaced: true,
                                getters: {
                                    icon: sinon.stub(),
                                    pointOfContact: () => "ABC Kontakt",
                                    publisher: () => ""
                                }
                            },
                            LayerTree: {
                                namespaced: true,
                                getters: {
                                    delay: () => 500,
                                    delayOnTouchOnly: () => true,
                                    removeOnSpill: () => true,
                                    touchStartThreshold: () => 3
                                },
                                actions: {
                                    removeLayer: removeLayerSpy
                                },
                                mutations: {
                                    setRemoveOnSpill: setRemoveOnSpillSpy
                                }
                            },
                            LayerSelection: {
                                namespaced: true,
                                getters: {
                                    highlightLayerId: sinon.stub()
                                }
                            },
                            Contact: {
                                namespaced: true,
                                getters: {
                                    name: () => "Contactname",
                                    type: () => "contact"
                                }
                            },
                            ResizeHandle: {
                                namespaced: true,
                                getters: {
                                    mainMenuWidth: () => 0,
                                    secondaryMenuWidth: () => 0
                                }
                            }
                        }
                    },
                    Maps: {
                        namespaced: true,
                        getters: {
                            mode: () => mapMode
                        }
                    }
                },
                getters: {
                    isModuleAvailable: () => () => true,
                    allLayerConfigs: () => layersBG.concat(subjectDataLayers),
                    layerConfig: () => ({
                        [treeSubjectsKey]: {elements: subjectDataLayers},
                        [treeBaselayersKey]: {elements: layersBG}
                    }),
                    layerConfigsByAttributes: () => () => [],
                    portalConfig: () => ({
                        tree: {
                            type: treeType,
                            addLayerButton: addLayerButton,
                            allowBaselayerDrag: allowBaselayerDrag // Now set to true
                        }
                    }),
                    showLayerAddButton: () => addLayerButton.active,
                    showFolderPath: () => true
                }
            });

            wrapper = mount(LayerTreeNode, {
                global: {
                    plugins: [store]
                }
            });

            const checkMoveSpy = sinon.spy(wrapper.vm, "checkMove"),
                draggedLayer = {id: "1", baselayer: false},
                targetLayer = {id: "2", baselayer: true},
                event = {
                    draggedContext: {element: draggedLayer},
                    relatedContext: {element: targetLayer}
                },
                result = wrapper.vm.checkMove(event);

            expect(result).to.be.true;
            expect(checkMoveSpy.calledOnce).to.be.true;
        });
    });
});
