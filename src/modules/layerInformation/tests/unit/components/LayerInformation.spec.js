import {createStore} from "vuex";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import LayerInformationComponent from "@modules/layerInformation/components/LayerInformation.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

afterEach(() => {
    sinon.restore();
});

describe("src/modules/layerInformation/components/LayerInformation.vue", () => {
    let store,
        legendAvailable,
        downloadLinks,
        pointOfContact,
        publisher,
        mainMenu,
        layerConfig;

    beforeEach(() => {
        layerConfig = {};
        downloadLinks = null;
        legendAvailable = true;
        mainMenu = {
            currentComponent: "layerInformation",
            navigation: {
                currentComponent: {
                    type: "layerInformation",
                    props: {
                        name: "abc"
                    }
                }
            }
        };
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        LayerInformation: {
                            namespaced: true,
                            state: {
                                layerInfo: {
                                    typ: "WMS",
                                    metaIdArray: [],
                                    url: "https://wfs.example.org/?evil=1"
                                }
                            },
                            mutations: {
                                setMetaDataCatalogueId: () => sinon.stub()
                            },
                            getters: {
                                customText: () => sinon.stub(),
                                title: () => "",
                                layerInfo: (state) => state.layerInfo,
                                datePublication: () => null,
                                downloadLinks: () => downloadLinks,
                                periodicityKey: () => null,
                                abstractText: () => "Test",
                                noMetadataLoaded: () => "",
                                metaURLs: () => [],
                                currentLayerName: () => "",
                                legendAvailable: () => legendAvailable,
                                showUrlGlobal: () => true,
                                pointOfContact: () => pointOfContact,
                                publisher: () => publisher,
                                dateRevision: sinon.stub()
                            },
                            actions: {
                                setConfigParams: () => sinon.stub(),
                                getAbstractInfo: () => sinon.stub()
                            }
                        },
                        Legend: {
                            namespaced: true,
                            getters: {
                                layerInfoLegend: sinon.stub()
                            },
                            actions: {
                                createLegendForLayerInfo: sinon.stub()
                            }
                        },
                        Contact: {
                            namespaced: true,
                            getters: {
                                name: () => "Contactname",
                                type: () => "contact"
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        mainMenu: () => mainMenu,
                        secondaryMenu: () => {
                            return {
                                sections: [
                                    [
                                        {
                                            type: "section1"
                                        },
                                        {
                                            type: "section2"
                                        }
                                    ]
                                ]
                            };
                        }
                    }
                }
            },
            getters: {
                isModuleAvailable: () => () => true,
                configJs: () => sinon.stub(),
                layerConfigById: () => () => layerConfig,
                restServiceById: () => sinon.stub()
            }
        });

        location = {href: "https://self.example.org/portal/"};
    });


    it("should have an existing title", () => {
        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".subtitle")).to.exist;
    });

    it("should have a close button, active tab is 'layerinfo-legend'", () => {
        downloadLinks = ["https://download.com"];
        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.activeTab).to.be.equals("layerinfo-legend");
        expect(wrapper.find(".bi-x-lg")).to.exist;
        expect(wrapper.find("#layerinfo-legend")).to.exist;
        expect(wrapper.findAll("li > a")[0].attributes().href).to.be.equals("#layerinfo-legend");
    });

    it("if legendAvailable is false: 'LayerInfoDataDownload' is active tab", () => {
        legendAvailable = false;
        downloadLinks = ["https://download.com"];
        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.findAll("#layerinfo-legend").length).to.be.equals(0);
        expect(wrapper.vm.activeTab).to.be.equals("LayerInfoDataDownload");
        expect(wrapper.findAll("li > a")[0].attributes().href).to.be.equals("#LayerInfoDataDownload");
    });

    it("should check if dropdown for group layer to not exists", () => {
        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#changeLayerInfo").exists()).to.be.false;
    });

    it("should generate correct url", () => {
        const wrapper = mount(LayerInformationComponent, {
                global: {
                    plugins: [store]
                }
            }),
            link = wrapper.find("#url div.pt-5 a");

        expect(link.attributes("href")).to.include("https://wfs.example.org/?evil=1&SERVICE=WMS&REQUEST=GetCapabilities");
    });

    it("should show point of contact accordion  using content from pointOfContact", () => {
        pointOfContact = {
            "name": "Behörde ABC",
            "positionName": ["Metadaten-Verantwortlicher"],
            "street": "XYZ Straße 99",
            "housenr": "",
            "postalCode": "D-12345",
            "city": "Hamburg",
            "email": "test@gv.hamburg.de",
            "country": "DEU"
        };
        publisher = null;

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#accordion-container-layer-info-contact").exists()).to.be.true;
    });

    it("should not show point of contact accordion", () => {
        pointOfContact = null;
        publisher = null;

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#accordion-container-layer-info-contact").exists()).to.be.false;
    });

    it("should show point of contact accordion  using content from publisher", () => {
        pointOfContact = null;
        publisher = {
            "name": "Behörde ABC",
            "positionName": ["Metadaten-Verantwortlicher"],
            "street": "XYZ Straße 99",
            "housenr": "",
            "postalCode": "D-12345",
            "city": "Hamburg",
            "email": "test@gv.hamburg.de",
            "country": "DEU"
        };

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#accordion-container-layer-info-contact").exists()).to.be.true;
    });

    it("should show zip code in one line with city", async () => {
        pointOfContact = null;
        publisher = {
            "name": "Behörde ABC",
            "positionName": ["Metadaten-Verantwortlicher"],
            "street": "XYZ Straße 99",
            "housenr": "",
            "postalCode": "D-12345",
            "city": "Hamburg",
            "email": "test@gv.hamburg.de",
            "country": "DEU"
        };

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#accordion-container-layer-info-contact").html()).to.contains("D-12345 Hamburg");
    });


    it("should not show undefined for missing address information", () => {
        pointOfContact = null;
        publisher = {
            "name": "Behörde ABC",
            "email": "test@gv.hamburg.de"
        };

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#accordion-container-layer-info-contact").html()).to.not.contains("undefined");
    });

    it("should show zip code in one line with city", async () => {
        pointOfContact = null;
        publisher = {
            "name": "Behörde ABC",
            "positionName": ["Metadaten-Verantwortlicher"],
            "street": "XYZ Straße 99",
            "housenr": "",
            "postalCode": "D-12345",
            "city": "Hamburg",
            "email": "test@gv.hamburg.de",
            "country": "DEU"
        };

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#accordion-container-layer-info-contact").html()).to.contains("D-12345 Hamburg");
    });


    it("should not show undefined for missing address information", async () => {
        pointOfContact = null;
        publisher = {
            "name": "Behörde ABC",
            "email": "test@gv.hamburg.de"
        };

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#accordion-container-layer-info-contact").html()).to.not.contains("undefined");
    });

    it("should show the dropdown when layerInfo.typ is 'GROUP'", () => {
        store.state.Modules.LayerInformation.layerInfo = {
            typ: "GROUP",
            metaIdArray: ["sample-meta-id"],
            layers: [
                {name: "Layer 1", metaID: "test", typ: "WFS", url: "#"},
                {name: "Layer 2", metaID: "test", typ: "SensorThings", url: "#"},
                {name: "Layer 3", metaID: "test", typ: "WMS", url: "#"}
            ]
        };

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#layer-selection-dropdown").exists()).to.be.true;
    });

    it("should not show the dropdown when layerInfo.typ is not 'GROUP'", () => {
        store.state.Modules.LayerInformation.layerInfo.typ = "WMS";

        const wrapper = mount(LayerInformationComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#layer-selection-dropdown").exists()).to.be.false;
    });

    it("should populate the dropdown with layer names from layerInfo", () => {
        store.state.Modules.LayerInformation.layerInfo = {
            typ: "GROUP",
            metaIdArray: ["sample-meta-id"],
            layers: [
                {name: "Layer 1", metaID: "test", typ: "WFS", url: "#"},
                {name: "Layer 2", metaID: "test", typ: "SensorThings", url: "#"},
                {name: "Layer 3", metaID: "test", typ: "WMS", url: "#"}
            ]
        };

        const wrapper = mount(LayerInformationComponent, {
                global: {
                    plugins: [store]
                }
            }),
            options = wrapper.findAll("#layer-selection-dropdown option");

        expect(options.length).to.be.equals(3);
        expect(options[0].text()).to.equal("Layer 1");
        expect(options[1].text()).to.equal("Layer 2");
        expect(options[2].text()).to.equal("Layer 3");
    });

    describe("methods", () => {
        it("getLayerAddress test WMS with origUrl", () => {
            layerConfig.origUrl = "/origUrl";
            layerConfig.url = "/orig_url";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "WMS"
                },
                expectedUrl = new URL(layerConfig.origUrl, location.href);
            let addressUrl = null;

            expectedUrl.searchParams.set("SERVICE", layerInfo.typ);
            expectedUrl.searchParams.set("REQUEST", "GetCapabilities");

            addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href);
        });

        it("getLayerAddress test WMS without origUrl", () => {
            layerConfig.url = "/url";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "WMS"
                },
                expectedUrl = new URL(layerConfig.url, location.href);
            let addressUrl = null;

            expectedUrl.searchParams.set("SERVICE", layerInfo.typ);
            expectedUrl.searchParams.set("REQUEST", "GetCapabilities");

            addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href);
        });

        it("getLayerAddress test OAF without origUrl", () => {
            layerConfig.url = "/url";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "OAF"
                },
                expectedUrl = new URL(layerConfig.url, location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href);
        });

        it("getLayerAddress for 3D tileset layer with slash at url", () => {
            layerConfig.url = "https://daten.de/gdi3d/objects/";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "TileSet3D"
                },
                expectedUrl = new URL(layerConfig.url, location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href + "tileset.json");
        });

        it("getLayerAddress for 3D tileset layer with json file included", () => {
            layerConfig.url = "https://daten.de/gdi3d/objects/tileset.json";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "TileSet3D"
                },
                expectedUrl = new URL(layerConfig.url, location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href);
        });

        it("getLayerAddress for 3D tileset layer without slash at url", () => {
            layerConfig.url = "https://daten.de/gdi3d/objects";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "TileSet3D"
                },
                expectedUrl = new URL(layerConfig.url, location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href + "/tileset.json");
        });

        it("getLayerAddress for 3D tileset layer with questionmark at url", () => {
            layerConfig.url = "https://daten.de/gdi3d/objects?";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "TileSet3D"
                },
                expectedUrl = new URL(layerConfig.url.slice(0, -1), location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href + "/tileset.json");
        });

        it("getLayerAddress for 3D terrain layer with slash at url", () => {
            layerConfig.url = "https://daten.de/gdi3d/terrain/";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "Terrain3D"
                },
                expectedUrl = new URL(layerConfig.url, location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href + "layer.json");
        });

        it("getLayerAddress for 3D terrain layer without slash at url", () => {
            layerConfig.url = "https://daten.de/gdi3d/terrain";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "Terrain3D"
                },
                expectedUrl = new URL(layerConfig.url, location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href + "/layer.json");
        });

        it("getLayerAddress for 3D terrain layer with questionmark at url", () => {
            layerConfig.url = "https://daten.de/gdi3d/terrain?";
            const wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                layerInfo = {
                    id: "id",
                    url: layerConfig.url,
                    typ: "Terrain3D"
                },
                expectedUrl = new URL(layerConfig.url.slice(0, -1), location.href),
                addressUrl = wrapper.vm.getLayerAddress(layerInfo);

            expect(addressUrl).to.be.equals(expectedUrl.href + "/layer.json");
        });

        it("cleanUrl: questionmark", () => {
            const url = "https://daten.de/gdi3d/terrain?",
                wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                cleanedUrl = wrapper.vm.cleanUrl(url);

            expect(cleanedUrl.endsWith("?")).to.be.false;
        });

        it("cleanUrl: slash", () => {
            const url = "https://daten.de/gdi3d/terrain/",
                wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                cleanedUrl = wrapper.vm.cleanUrl(url);

            expect(cleanedUrl.endsWith("/")).to.be.false;
        });

        it("cleanUrl: slash and questionmark", () => {
            const url = "https://daten.de/gdi3d/terrain/?",
                wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                cleanedUrl = wrapper.vm.cleanUrl(url);

            expect(cleanedUrl.endsWith("/")).to.be.false;
            expect(cleanedUrl.endsWith("?")).to.be.false;
        });

        it("cleanUrl: nothing", () => {
            const url = "https://daten.de/gdi3d/terrain",
                wrapper = mount(LayerInformationComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                cleanedUrl = wrapper.vm.cleanUrl(url);

            expect(cleanedUrl.endsWith("/")).to.be.false;
            expect(cleanedUrl.endsWith("?")).to.be.false;
        });
    });
});
