import {createStore} from "vuex";
import {mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createPinia, setActivePinia} from "pinia";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

import LayerComponentSubMenu from "@modules/layerTree/components/LayerComponentSubMenu.vue";


describe("src/modules/layerTree/components/LayerComponentSubMenu.vue", () => {
    let pinia,
        changeCurrentComponentStub,
        layer,
        layerConfigStub,
        propsData,
        removeLayerSpy,
        showLayerStub,
        store,
        updateTransparencySpy,
        wrapper,
        showFolderPath;
    const folder_1 = {
            id: "folder-1",
            name: "folder-1",
            parentId: "folder-2"
        },
        folder_2 = {
            id: "folder-2",
            name: "folder-2"
        };

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        layer = {
            id: "1",
            name: "layer",
            typ: "WMS",
            transparency: 50,
            datasets: [
                {
                    md_id: "123456789",
                    md_name: "Layer ABC"
                }
            ]
        };

        propsData = {
            layerConf: layer
        };

        removeLayerSpy = sinon.spy();
        updateTransparencySpy = sinon.spy();
        changeCurrentComponentStub = sinon.stub(useMenuStore(), "changeCurrentComponent");
        showLayerStub = sinon.stub();
        layerConfigStub = sinon.stub().callsFake(() => {
            return {
                subjectlayer: {
                    elements: []
                }
            };
        });

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LayerTree: {
                            namespaced: true,
                            actions: {
                                removeLayer: removeLayerSpy,
                                updateTransparency: updateTransparencySpy
                            },
                            getters: {
                                menuSide: () => "mainMenu"
                            }
                        },
                        LayerInformation: {
                            namespaced: true,
                            getters: {
                                layerInfo: () => ({"metaIdArray": [], "url": ["https://wms.example.org/", "https://wfs.example.org/?evil=1", "./local.geojson"], "typ": ["WMS", "WFS", "GeoJSON"], "layerNames": ["X-WMS", "X-WFS", ""]}),
                                pointOfContact: () => "Contact XYZ",
                                publisher: () => ""
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
                        },
                        LayerSelection: {
                            namespaced: true,
                            getters: {
                                type: () => "layerSelection",
                                name: () => layer.name
                            },
                            actions: {
                                showLayer: showLayerStub
                            }
                        }
                    }
                }
            },
            getters: {
                isModuleAvailable: () => () => true,
                showFolderPath: () => showFolderPath,
                folderById: () => (id) => {
                    if (id === "folder-1") {
                        return folder_1;
                    }
                    if (id === "folder-2") {
                        return folder_2;
                    }
                    return null;
                },
                portalConfig: () => {
                    return {
                        tree: {
                            contactButton: true
                        }
                    };
                },
                layerConfig: layerConfigStub
            }
        });
    });


    it("renders the sub menu given as property to the component without path if showFolderPath is false", () => {
        showFolderPath = false;
        wrapper = shallowMount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-sub-menu-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.find(".path").exists()).to.be.false;
    });
    it("renders the sub menu given as property to the component with path and rootLayer", () => {
        showFolderPath = true;
        layerConfigStub.callsFake(() => {
            return {
                subjectlayer: {
                    elements: [layer]
                }
            };
        });
        wrapper = mount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-sub-menu-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.find(".path").exists()).to.be.true;
        expect(wrapper.find(".path").text()).to.equal("common:modules.layerTree.rootLayerPath");
    });
    it("renders the sub menu given as property to the component with path and folder exists", () => {
        showFolderPath = true;
        layer.parentId = "folder-1";
        wrapper = mount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-sub-menu-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.find(".path").exists()).to.be.true;
        expect(wrapper.find(".path").text()).to.equal("folder-2/folder-1");
    });
    it("renders the sub menu given as property to the component without path because folder does not exists", () => {
        showFolderPath = true;
        wrapper = shallowMount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-sub-menu-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.find(".path").exists()).to.be.false;
    });
    it("navigates to the layer selection tree when the path is clicked", async () => {
        showFolderPath = true;
        layer.parentId = "folder-1";
        wrapper = mount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        await wrapper.find(".path").trigger("click");
        sinon.assert.calledWith(changeCurrentComponentStub, {
            type: "layerSelection",
            side: "mainMenu",
            props: {
                "layerId": "1",
                "name": layer.name
            }
        }
        );
        sinon.assert.calledWith(showLayerStub,
            sinon.match.any,
            {
                layerId: layer.id
            }
        );
    });
    it("renders the remove-layer", () => {
        wrapper = shallowMount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find(".remove-layer-container").exists()).to.be.true;
    });

    it("should remove layer if remove layer button is clicked", async () => {
        wrapper = mount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        await wrapper.find(".remove-layer-container > button").trigger("click");

        expect(removeLayerSpy.calledOnce).to.be.true;
        expect(removeLayerSpy.firstCall.args[1]).to.deep.equals(layer);
    });
    it("renders the transparency", () => {
        wrapper = mount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-icon-sub-menu-transparency-container-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.find(".transparency-container > i").classes()).to.includes("bi-droplet-half");
        expect(wrapper.find(".transparency-container .transparency-text").exists()).to.be.true;
        expect(wrapper.find(".transparency-container input").exists()).to.be.true;
        expect(wrapper.find(".transparency-container input").attributes("aria-label")).to.not.be.undefined;
    });

    it("set value to input field", () => {
        let input = null;

        wrapper = mount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        input = wrapper.find(".transparency-container input");
        input.setValue(50);

        expect(input.element.value).to.equals("50");
        expect(updateTransparencySpy.calledOnce).to.be.true;
        expect(updateTransparencySpy.firstCall.args[1]).to.deep.equals({
            layerConf: {
                id: "1",
                name: "layer",
                typ: "WMS",
                transparency: 50,
                datasets: [
                    {
                        md_id: "123456789",
                        md_name: "Layer ABC"
                    }
                ]
            },
            transparency: 50
        });
    });

    it("render not the transparency-container, if layer type Terrain3D is not supported ", () => {
        const layer1 = {
            id: "2",
            name: "layer",
            typ: "Terrain3D",
            datasets: [
                {
                    md_id: "123456789",
                    md_name: "Layer ABC"
                }
            ]
        };

        wrapper = shallowMount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: {
                layerConf: layer1
            }
        });


        expect(wrapper.find("#layer-component-icon-sub-menu-transparency-container-" + layer1.id).exists()).to.be.false;
    });

    it("render the transparency-container, if layer type Tileset3D is supported ", () => {
        const layer1 = {
            id: "2",
            name: "layer",
            typ: "Tileset3D",
            datasets: [
                {
                    md_id: "123456789",
                    md_name: "Layer ABC"
                }
            ]
        };

        wrapper = shallowMount(LayerComponentSubMenu, {
            global: {
                plugins: [store, pinia]
            },
            propsData: {
                layerConf: layer1
            }
        });


        expect(wrapper.find("#layer-component-icon-sub-menu-transparency-container-" + layer1.id).exists()).to.be.true;
    });

    describe("methods", () => {
        it("getPath - no folders --> no path", () => {
            wrapper = shallowMount(LayerComponentSubMenu, {
                global: {
                    plugins: [store, pinia]
                },
                propsData
            });

            expect(wrapper.vm.getPath()).to.be.equals(null);
        });
        it("getPath - reversed path from folders", () => {
            layer.parentId = "folder-1";
            showFolderPath = true;

            wrapper = shallowMount(LayerComponentSubMenu, {
                global: {
                    plugins: [store, pinia]
                },
                propsData
            });

            expect(wrapper.vm.getPath()).to.be.equals("folder-2/folder-1");
        });
        it("getNamesOfParentFolder returns array with folder names", () => {
            wrapper = shallowMount(LayerComponentSubMenu, {
                global: {
                    plugins: [store, pinia]
                },
                propsData
            });

            expect(wrapper.vm.getNamesOfParentFolder("folder-1", [])).to.be.deep.equals(["folder-1", "folder-2"]);
        });
        it("getNamesOfParentFolder returns empty array if parentId is undefined of folder is unknown", () => {
            wrapper = shallowMount(LayerComponentSubMenu, {
                global: {
                    plugins: [store, pinia]
                },
                propsData
            });

            expect(wrapper.vm.getNamesOfParentFolder("folder-unknown", [])).to.be.deep.equals([]);
        });
    });
});
