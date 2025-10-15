import {createStore} from "vuex";
import {config, shallowMount, mount} from "@vue/test-utils";
import {expect} from "chai";
import crs from "@masterportal/masterportalapi/src/crs";
import sinon from "sinon";
import AddWMSComponent from "@modules/addWMS/components/AddWMS.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

config.global.mocks.$t = key => key;

describe("src/modules/addWMS/components/AddWMS.vue", () => {
    let addLayerToLayerConfigSpy,
        componentData,
        featureCount,
        visibility,
        showInLayerTree,
        store,
        wrapper,
        portalConfig;

    beforeEach(() => {
        crs.registerProjections();
        addLayerToLayerConfigSpy = sinon.spy();

        visibility = false;
        showInLayerTree = false;
        featureCount = undefined;
        portalConfig = {};

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        AddWMS: {
                            namespaced: true,
                            getters: {
                                exampleURLs: () => [],
                                featureCount: () => featureCount,
                                visibility: () => visibility,
                                showInLayerTree: () => showInLayerTree
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        projection: () => {
                            return {
                                id: "http://www.opengis.net/gml/srs/epsg.xml#25832",
                                name: "EPSG:25832",
                                projName: "utm",
                                getCode: () => "EPSG:25832"
                            };
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.stub()
                    }
                }
            },
            actions: {
                addLayerToLayerConfig: addLayerToLayerConfigSpy
            },
            getters: {
                portalConfig: () => portalConfig
            }
        });

        componentData = () => {
            return {
                treeTyp: ""
            };
        };

        const elem = document.createElement("div");

        if (document.body) {
            document.body.appendChild(elem);
        }
        wrapper = shallowMount(AddWMSComponent, {
            global: {
                plugins: [store],
                components: {InputText}
            },
            data: componentData,
            attachTo: elem
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders the AddWMS Module", () => {
        expect(wrapper.find("#addWMS").exists()).to.be.true;
    });

    it("renders the input field", () => {
        expect(wrapper.find("#wmsUrl").exists()).to.be.true;
    });

    it("renders the AddWMS button", () => {
        expect(wrapper.find("#addWMSButton").exists()).to.be.true;
    });

    it("sets focus to first input control", async () => {
        wrapper = mount(AddWMSComponent, {
            global: {
                plugins: [store],
                components: {InputText}
            },
            data: componentData,
            attachTo: document.body
        });
        wrapper.vm.setFocusToFirstControl();
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#wmsUrl").element).to.equal(document.activeElement);
    });

    it("getParsedTitle", () => {
        it("should return parsed title without space and be replaced with minus", function () {
            expect(wrapper.vm.getParsedTitle("test title")).to.equal("test-title");
        });
        it("should return parsed title without slash and be replaced with minus", function () {
            expect(wrapper.vm.getParsedTitle("WMS Digitales Höhenmodell Hamburg (DGM1) - 1:10.000")).to.equal("WMS-Digitales-Höhenmodell-Hamburg--DGM1----1-10.000");
        });
        it("should return parsed title without slash and be replaced with minus", function () {
            expect(wrapper.vm.getParsedTitle("test/title")).to.equal("test-title");
        });
        it("should return parsed title as original title", function () {
            expect(wrapper.vm.getParsedTitle(undefined)).to.equal("undefined");
            expect(wrapper.vm.getParsedTitle("test")).to.equal("test");
            expect(wrapper.vm.getParsedTitle(1234)).to.equal("1234");
        });
    });

    it("isVersionEnabled", () => {
        it("should return false if the type of version is not string", function () {
            expect(wrapper.vm.isVersionEnabled(null)).to.be.false;
        });
        it("should return false if the version is lower than 1.3.0", function () {
            expect(wrapper.vm.isVersionEnabled("0.3.0")).to.be.false;
            expect(wrapper.vm.isVersionEnabled("1.2.9")).to.be.false;
        });
        it("should return true if the version is equal or higher than 1.3.0", function () {
            expect(wrapper.vm.isVersionEnabled("1.3.0")).to.be.true;
            expect(wrapper.vm.isVersionEnabled("2.3.5")).to.be.true;
        });
    });

    describe("getInfoFormat", () => {
        it("should return 'text/xml', if possible formats are empty", () => {
            expect(wrapper.vm.getInfoFormat([])).to.equals("text/xml");
        });
        it("should return configured default format, if possible formats are empty", () => {
            portalConfig = {
                tree: {
                    rasterLayerDefaultInfoFormat: "text/html"
                }
            };
            expect(wrapper.vm.getInfoFormat([])).to.equals("text/html");
        });
        it("should return 'application/vnd.ogc.gml', if possible formats contains 'gml'", () => {
            expect(wrapper.vm.getInfoFormat(["text/xml", "gml", "text/json"])).to.equals("application/vnd.ogc.gml");
        });
        it("should return 'application/vnd.ogc.gml', if possible formats contains 'application/vnd.ogc.gml'", () => {
            expect(wrapper.vm.getInfoFormat(["text/xml", "application/vnd.ogc.gml", "text/json"])).to.equals("application/vnd.ogc.gml");
        });
        it("should return 'text/json' if the first entry is 'text/json' in possible formats and gml or 'application/vnd.ogc.gml' are not included", () => {
            expect(wrapper.vm.getInfoFormat(["text/json", "text/xml"])).to.equals("text/json");
        });
        it("should return 'text/json' if defined as default and included in possible formats and gml or 'application/vnd.ogc.gml' are not included", () => {
            portalConfig = {
                tree: {
                    rasterLayerDefaultInfoFormat: "text/json"
                }
            };
            expect(wrapper.vm.getInfoFormat(["text/xml", "text/json"])).to.equals("text/json");
        });
        it("should not return configured default format if not included in possible formats", () => {
            portalConfig = {
                tree: {
                    rasterLayerDefaultInfoFormat: "text/html"
                }
            };
            expect(wrapper.vm.getInfoFormat(["text/json", "text/xml"])).to.equals("text/json");
        });
    });

    describe("parseLayerStructure", () => {
        it("should add layer object to folder structure", () => {
            const folder = {
                    type: "folder",
                    name: "part 1",
                    elements: []
                },
                object = {
                    MaxScaleDenominator: undefined,
                    MinScaleDenominator: undefined,
                    Name: "geb_sum",
                    Style: [
                        {
                            LegendURL: [
                                {
                                    Format: "image/png",
                                    OnlineResource: "https://geodienste.hamburg.de/HH_WMS_Solaratlas?request=GetLegendGraphic&version=1.3.0&service=WMS&layer=geb_sum&style=style_solaratlas_geb_sum&format=image/png"
                                }
                            ],
                            Name: "style_solaratlas_geb_sum",
                            Title: "style_solaratlas_geb_sum"
                        }
                    ],
                    Title: "geb_sum"
                },
                level = 1;

            wrapper.vm.wmsUrl = "https://geodienste.hamburg.de/HH_WMS_Solaratlas";
            wrapper.vm.version = "1.3.0";
            wrapper.vm.infoFormat = "text/xml";
            wrapper.vm.parseLayerStructure(folder, object, level);

            expect(folder).to.deep.equals({
                type: "folder",
                name: "part 1",
                elements: [
                    {
                        datasets: [],
                        id: "geb_sum",
                        isExternal: true,
                        layers: ["geb_sum"],
                        legendURL: "https://geodienste.hamburg.de/HH_WMS_Solaratlas?request=GetLegendGraphic&version=1.3.0&service=WMS&layer=geb_sum&style=style_solaratlas_geb_sum&format=image/png",
                        maxScale: undefined,
                        minScale: undefined,
                        name: "geb_sum",
                        showInLayerTree: false,
                        featureCount: undefined,
                        infoFormat: "text/xml",
                        typ: "WMS",
                        type: "layer",
                        url: "https://geodienste.hamburg.de/HH_WMS_Solaratlas",
                        version: "1.3.0",
                        visibility: false
                    }
                ]
            });
        });

        it("should add layer object to subfolder in the folder structure", () => {
            const folder = {
                    type: "folder",
                    name: "part 1",
                    elements: []
                },
                object = {
                    Layer: [
                        {
                            MaxScaleDenominator: undefined,
                            MinScaleDenominator: undefined,
                            Name: "geb_sum",
                            Style: [
                                {
                                    LegendURL: [
                                        {
                                            Format: "image/png",
                                            OnlineResource: "https://geodienste.hamburg.de/HH_WMS_Solaratlas?request=GetLegendGraphic&version=1.3.0&service=WMS&layer=geb_sum&style=style_solaratlas_geb_sum&format=image/png"
                                        }
                                    ],
                                    Name: "style_solaratlas_geb_sum",
                                    Title: "style_solaratlas_geb_sum"
                                }
                            ],
                            Title: "geb_sum"
                        }
                    ],
                    Title: "Example"
                },
                level = 1;

            featureCount = 5;

            wrapper.vm.wmsUrl = "https://geodienste.hamburg.de/HH_WMS_Solaratlas";
            wrapper.vm.version = "1.3.0";
            wrapper.vm.infoFormat = "text/xml";
            wrapper.vm.parseLayerStructure(folder, object, level);

            expect(folder).to.deep.equals({
                type: "folder",
                name: "part 1",
                elements: [
                    {
                        type: "folder",
                        name: "Example",
                        elements: [
                            {
                                datasets: [],
                                id: "geb_sum",
                                layers: ["geb_sum"],
                                legendURL: "https://geodienste.hamburg.de/HH_WMS_Solaratlas?request=GetLegendGraphic&version=1.3.0&service=WMS&layer=geb_sum&style=style_solaratlas_geb_sum&format=image/png",
                                maxScale: undefined,
                                minScale: undefined,
                                name: "geb_sum",
                                showInLayerTree: false,
                                featureCount: 5,
                                infoFormat: "text/xml",
                                isExternal: true,
                                typ: "WMS",
                                type: "layer",
                                url: "https://geodienste.hamburg.de/HH_WMS_Solaratlas",
                                version: "1.3.0",
                                visibility: false
                            }
                        ]
                    }
                ]
            });
        });

        it("should set configured flags to imported layer", () => {
            const folder = {
                    type: "folder",
                    name: "part 1",
                    elements: []
                },
                object = {
                    MaxScaleDenominator: undefined,
                    MinScaleDenominator: undefined,
                    Name: "geb_sum",
                    Style: [
                        {
                            LegendURL: [
                                {
                                    Format: "image/png",
                                    OnlineResource: "https://geodienste.hamburg.de/HH_WMS_Solaratlas?request=GetLegendGraphic&version=1.3.0&service=WMS&layer=geb_sum&style=style_solaratlas_geb_sum&format=image/png"
                                }
                            ],
                            Name: "style_solaratlas_geb_sum",
                            Title: "style_solaratlas_geb_sum"
                        }
                    ],
                    Title: "geb_sum"
                },
                level = 1;

            visibility = true;
            showInLayerTree = true;

            wrapper.vm.wmsUrl = "https://geodienste.hamburg.de/HH_WMS_Solaratlas";
            wrapper.vm.version = "1.3.0";
            wrapper.vm.infoFormat = "text/xml";
            wrapper.vm.parseLayerStructure(folder, object, level);

            expect(folder).to.deep.equals({
                type: "folder",
                name: "part 1",
                elements: [
                    {
                        datasets: [],
                        id: "geb_sum",
                        isExternal: true,
                        layers: ["geb_sum"],
                        legendURL: "https://geodienste.hamburg.de/HH_WMS_Solaratlas?request=GetLegendGraphic&version=1.3.0&service=WMS&layer=geb_sum&style=style_solaratlas_geb_sum&format=image/png",
                        maxScale: undefined,
                        minScale: undefined,
                        name: "geb_sum",
                        showInLayerTree: true,
                        featureCount: undefined,
                        infoFormat: "text/xml",
                        typ: "WMS",
                        type: "layer",
                        url: "https://geodienste.hamburg.de/HH_WMS_Solaratlas",
                        version: "1.3.0",
                        visibility: true
                    }
                ]
            });
        });
    });

    describe("addLayerToTopicTree", () => {
        it("should add folder structure to topic tree", () => {
            const folder = {
                type: "folder",
                name: "part 1",
                elements: [
                    {
                        datasets: [],
                        id: "geb_sum",
                        layers: ["geb_sum"],
                        legendURL: "https://geodienste.hamburg.de/HH_WMS_Solaratlas?request=GetLegendGraphic&version=1.3.0&service=WMS&layer=geb_sum&style=style_solaratlas_geb_sum&format=image/png",
                        maxScale: undefined,
                        minScale: undefined,
                        name: "geb_sum",
                        showInLayerTree: false,
                        typ: "WMS",
                        type: "layer",
                        url: "https://geodienste.hamburg.de/HH_WMS_Solaratlas",
                        version: "1.3.0",
                        visibility: false
                    }
                ]
            };

            wrapper.vm.addLayerToTopicTree(folder);

            expect(addLayerToLayerConfigSpy.calledOnce).to.be.true;
            expect(addLayerToLayerConfigSpy.firstCall.args[1]).to.deep.equals({
                layerConfig: folder,
                parentKey: "subjectlayer"
            });

        });
    });

    describe("getIfInExtent", () => {
        let capability = {
                Capability: {
                    Layer: {
                        "BoundingBox": [
                            {
                                "crs": "EPSG:25832",
                                "extent": [
                                    302907.887193,
                                    5435104.982326,
                                    389523.673913,
                                    5508222.768538
                                ]
                            }
                        ]
                    }
                }
            },
            currentExtent = [];

        it("should return true if the currentExtent intersects the capability extent", function () {
            currentExtent = [
                205000,
                5009000,
                730000,
                6075800
            ];
            expect(wrapper.vm.getIfInExtent(capability, currentExtent)).to.be.true;
        });

        it("should return true if the currentExtent intersects the capability extent", function () {
            currentExtent = [
                205000,
                5009000,
                730000
            ];
            expect(wrapper.vm.getIfInExtent(capability, currentExtent)).to.be.true;
        });

        it("should return true if the currentExtent is not in the right format", function () {
            currentExtent = "";
            expect(wrapper.vm.getIfInExtent(capability, currentExtent)).to.be.true;
        });

        it("should return true if the layer in Capability does not have the right crs", function () {
            capability = {
                Capability: {
                    Layer: {
                        "BoundingBox": [
                            {
                                "crs": "EPSG:3067",
                                "extent": [
                                    336385.4535501953,
                                    6628495.2621008465,
                                    447592.181149918,
                                    7646073.290737241
                                ]
                            }
                        ]
                    }
                }
            };
            currentExtent = [
                455000,
                5809000,
                730000,
                6075800
            ];
            expect(wrapper.vm.getIfInExtent(capability, currentExtent)).to.be.true;
        });

        it("should return true if the layer in Capability does not have the right extent", () => {
            capability = {
                Capability: {
                    Layer: {
                        "BoundingBox": [
                            {
                                "crs": "EPSG:25832",
                                "extent": [
                                    302907.887193,
                                    5435104.982326,
                                    389523.673913
                                ]
                            }
                        ]
                    }
                }
            };
            currentExtent = [
                455000,
                5809000,
                730000,
                6075800
            ];
            expect(wrapper.vm.getIfInExtent(capability, currentExtent)).to.be.true;
        });
        it("should return true if the transformed extent of the layer in Capability intersects the extent", () => {
            capability = {
                Capability: {
                    Layer: {
                        "BoundingBox": [
                            {
                                "crs": "EPSG:4326",
                                "extent": [
                                    47,
                                    5,
                                    56,
                                    15
                                ]
                            }
                        ]
                    }
                }
            };
            currentExtent = [
                455000,
                5809000,
                730000,
                6075800
            ];
            expect(wrapper.vm.getIfInExtent(capability, currentExtent)).to.be.true;
        });
        it("should return false if the transformed extent of the layer in Capability intersects the extent", () => {
            capability = {
                Capability: {
                    Layer: {
                        "BoundingBox": [
                            {
                                "crs": "EPSG:4326",
                                "extent": [
                                    56,
                                    9,
                                    56,
                                    10
                                ]
                            }
                        ]
                    }
                }
            };
            currentExtent = [
                455000,
                5809000,
                730000,
                6075800
            ];
            expect(wrapper.vm.getIfInExtent(capability, currentExtent)).to.be.false;
        });
    });

    it("getReversedData", () => {
        const data = "<Layer><SRS>EPSG:4326</SRS><Layer queryable=\"1\"><SRS>EPSG:102100</SRS><BoundingBox SRS=\"EPSG:4326\" minx=\"6.355978\" miny=\"49.11015\" maxx=\"7.413363\" maxy=\"49.644331\"/></Layer></Layer>",
            dataXml = new DOMParser().parseFromString(data, "text/xml");

        it("should replace all SRS with CRS in the xml node and attribute", function () {
            expect(wrapper.vm.getReversedData(dataXml).getElementsByTagName("SRS").length).to.equal(0);
            expect(wrapper.vm.getReversedData(dataXml).getElementsByTagName("CRS").length).not.to.equal(0);
        });
    });
    describe("getUrl", () => {
        it("creates url correctly", function () {
            const serviceUrl = "https://test/test?map=/storage/mapfiles/test.map";

            expect(wrapper.vm.getUrl(serviceUrl)).to.equal("https://test/test?map=%2Fstorage%2Fmapfiles%2Ftest.map&request=GetCapabilities&service=WMS");
            expect(wrapper.vm.getUrl(serviceUrl).split("?").length - 1).to.equal(1);
            expect(wrapper.vm.getUrl(serviceUrl)).to.contain("request=GetCapabilities&service=WMS");
        });

        it("creates url with lowercase parameter keys request and service", function () {
            const serviceUrl = "https://test/test?SERVICE=WMS&REQUEST=GetCapabilities";

            expect(wrapper.vm.getUrl(serviceUrl)).to.equal("https://test/test?request=GetCapabilities&service=WMS");
            expect(wrapper.vm.getUrl(serviceUrl).split("?").length - 1).to.equal(1);
            expect(wrapper.vm.getUrl(serviceUrl)).to.contain("request=GetCapabilities&service=WMS");
        });
    });
    describe("getBaseServiceUrl", () => {

        it("keeps other parameters", function () {
            const serviceUrl = "https://test/test?map=/storage/mapfiles/test.map&request=GetCapabilities&service=WMS&version=1.3.0";

            expect(wrapper.vm.getBaseServiceUrl(serviceUrl)).to.equal("https://test/test?map=%2Fstorage%2Fmapfiles%2Ftest.map");
            expect(wrapper.vm.getBaseServiceUrl(serviceUrl).split("?").length - 1).to.equal(1);
            expect(wrapper.vm.getBaseServiceUrl(serviceUrl)).to.not.contain("request=GetCapabilities&service=WMS");
        });

        it("removes uppercase", function () {
            const serviceUrl = "https://test/test?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";

            expect(wrapper.vm.getBaseServiceUrl(serviceUrl)).to.equal("https://test/test");
            expect(wrapper.vm.getBaseServiceUrl(serviceUrl)).to.not.contain("request=GetCapabilities&service=WMS");
        });
    });
});
