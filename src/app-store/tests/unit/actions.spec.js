import axios from "axios";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import sinon from "sinon";
import {expect} from "chai";
import actions from "../../actions.js";

describe("src/app-store/actions.js", () => {
    let axiosMock,
        commit,
        dispatch,
        fetch,
        state,
        initializeLayerListSpy,
        initializeStyleListSpy;
    const restConf = "./resources/rest-services.json",
        layerConf = "./services.json";

    beforeEach(() => {
        fetch = global.fetch;
        global.fetch = sinon.spy(() => new Promise(r => r));
        commit = sinon.spy();
        dispatch = sinon.spy();
        state = {
            configJs: {
                portalConf: "./",
                layerConf: layerConf,
                restConf: restConf
            },
            portalConfigDefaults: {
                tree: {
                    validLayerTypesAutoTree: ["WMS", "SENSORTHINGS", "TERRAIN3D", "TILESET3D", "OBLIQUE"]
                }
            }
        };
        axiosMock = sinon.stub(axios, "get").returns(Promise.resolve({request: {status: 200, data: []}}));
        initializeLayerListSpy = sinon.spy(rawLayerList, "initializeLayerList");
        initializeStyleListSpy = sinon.spy(styleList, "initializeStyleList");
    });

    afterEach(() => {
        global.fetch = fetch;
    });

    describe("app-store actions", () => {
        it("loadConfigJs", () => {
            const payLoad = {
                config: "js"
            };

            actions.loadConfigJs({commit}, payLoad);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setConfigJs");
            expect(commit.firstCall.args[1]).to.equals(payLoad);
        });
        it("loadConfigJson", async () => {
            const getters = {
                isMobile: false
            };

            await actions.loadConfigJson({commit, state, dispatch, getters});

            expect(axiosMock.calledOnce).to.be.true;
            expect(axiosMock.calledWith("config.json")).to.be.true;
            expect(dispatch.calledWith("processLayerNamesHtmlTags")).to.be.true;
        });
        it("loadConfigJson removes duplicate subject layer ids and warns once per id", async () => {
            const getters = {
                    isMobile: false
                },
                responseData = {
                    layerConfig: {
                        subjectlayer: {
                            elements: [
                                {name: "Folder A", type: "folder", elements: [{id: "150"}]},
                                {name: "Folder B", type: "folder", elements: [{id: "150"}, {id: "151"}]}
                            ]
                        }
                    }
                };

            axiosMock.resolves({data: responseData});


            await actions.loadConfigJson({commit, state, dispatch, getters});

            const layerConfig = commit.getCalls().find(call => call.args[0] === "setLayerConfig").args[1],
                layers = layerConfig.subjectlayer.elements.flatMap(folder => folder.elements);

            expect(layers.map(layer => layer.id)).to.deep.equal(["150", "151"]);

        });
        it("loadConfigJson preserves a config without subjectlayer", async () => {
            const getters = {
                    isMobile: false
                },
                responseData = {
                    layerConfig: {
                        LayerSubjects: {elements: []}
                    }
                };

            axiosMock.resolves({data: responseData});

            await actions.loadConfigJson({commit, state, dispatch, getters});

            const layerConfig = commit.getCalls().find(call => call.args[0] === "setLayerConfig").args[1];

            expect(layerConfig).to.deep.equal(responseData.layerConfig);
            expect(Object.prototype.hasOwnProperty.call(layerConfig, "subjectlayer")).to.be.false;
        });
        it("loadConfigJson - portalConf with query params './config.json?abc=xyz' should preserve URL parameters", async () => {
            const getters = {
                isMobile: false
            };

            state.configJs.portalConf = "./config.json?abc=xyz";

            await actions.loadConfigJson({commit, state, dispatch, getters});

            expect(axiosMock.calledOnce).to.be.true;
            expect(axiosMock.calledWith("./config.json?abc=xyz")).to.be.true;
        });
        it("loadRestServicesJson", () => {
            actions.loadRestServicesJson({commit, state});

            expect(axiosMock.calledOnce).to.be.true;
            expect(axiosMock.calledWith(restConf)).to.be.true;
        });
        it("loadServicesJson", () => {
            actions.loadServicesJson({state, commit});

            expect(initializeLayerListSpy.calledOnce).to.be.true;
            expect(initializeLayerListSpy.calledWith(layerConf)).to.be.true;
        });

        it("initializeVectorStyle", () => {
            const getters = {
                    configuredModules: [{a: "b"}, {c: "d"}],
                    allLayerConfigs: [{
                        id: "id",
                        typ: "WMS"
                    }],
                    "Modules/HighlightFeatures/pointStyleId": "pointStyleId",
                    "Modules/HighlightFeatures/polygonStyleId": "polygonStyleId",
                    "Modules/HighlightFeatures/lineStyleId": "lineStyleId",
                    mapMarker: {
                        pointStyleId: "123",
                        polygonStyleId: "abc"
                    },
                    zoomTo: [
                        {
                            id: "zoomToFeatureId",
                            styleId: "eventlotse"
                        }
                    ]
                },
                firstCallArg = {
                    highlightFeaturesPointStyleId: "pointStyleId",
                    highlightFeaturesPolygonStyleId: "polygonStyleId",
                    highlightFeaturesLineStyleId: "lineStyleId",
                    mapMarkerPointStyleId: "123",
                    mapMarkerPolygonStyleId: "abc",
                    zoomToFeatureId: "eventlotse"
                };

            actions.initializeVectorStyle({state, commit, dispatch, getters});

            expect(initializeStyleListSpy.calledOnce).to.be.true;
            expect(initializeStyleListSpy.firstCall.args[0]).to.be.deep.equals(firstCallArg);
            expect(initializeStyleListSpy.firstCall.args[1]).to.equals(state.configJs);
            expect(initializeStyleListSpy.firstCall.args[2]).to.be.deep.equals(getters.allLayerConfigs);
            expect(initializeStyleListSpy.firstCall.args[3]).to.be.deep.equals([{a: "b"}, {c: "d"}]);
            expect(typeof initializeStyleListSpy.firstCall.args[4]).to.be.equals("function");

        });
        describe("moveStartModuleControls", () => {
            let startModule, getters;

            beforeEach(() => {
                startModule = {
                    secondaryMenu: [
                        {
                            type: "module_1",
                            foo: "bar"
                        }
                    ]
                };
                getters = {
                    controlsConfig: {
                        startModule
                    }
                };

                state = {
                    portalConfig: {
                        map: {
                            controls: {
                                startModule
                            }
                        },
                        secondaryMenu: {
                            sections: [
                                [
                                    {
                                        type: "print"
                                    },
                                    {
                                        type: "draw"
                                    }
                                ]
                            ]
                        }
                    }
                };
            });

            it("moveStartModuleControls - no duplicates", () => {
                actions.moveStartModuleControls({getters, state}, "secondaryMenu");

                expect(dispatch.notCalled).to.be.true;
                expect(state.portalConfig.secondaryMenu.sections[0].length).to.be.equals(3);
                expect(state.portalConfig.secondaryMenu.sections[0][2].type).to.be.equals("module_1");
                expect(state.portalConfig.map.controls.startModule.secondaryMenu).to.be.deep.equals([]);

            });

            it("moveStartModuleControls - with duplicates", () => {
                startModule.secondaryMenu[0].type = "print";

                actions.moveStartModuleControls({getters, state}, "secondaryMenu");

                expect(dispatch.notCalled).to.be.true;
                expect(state.portalConfig.secondaryMenu.sections[0].length).to.be.equals(2);
                expect(state.portalConfig.secondaryMenu.sections[0][0].type).to.be.equals("print");
                expect(state.portalConfig.secondaryMenu.sections[0][1].type).to.be.equals("draw");
                expect(state.portalConfig.map.controls.startModule.secondaryMenu).to.be.deep.equals([]);

            });
        });
    });

    describe("processLayerNamesHtmlTags", () => {
        it("should process layer names and extract HTML tags to htmlName", () => {
            const testState = {
                layerConfig: {
                    LayerSubjects: {
                        elements: [
                            {
                                id: "layer1",
                                name: "Layer with <b>HTML</b> tags"
                            },
                            {
                                id: "layer2",
                                name: "Another <br>Layer"
                            }
                        ]
                    }
                }
            };

            actions.processLayerNamesHtmlTags({state: testState});

            expect(testState.layerConfig.LayerSubjects.elements[0].htmlName).to.equals("Layer with <b>HTML</b> tags");
            expect(testState.layerConfig.LayerSubjects.elements[0].name).to.equals("Layer with HTML tags");
            expect(testState.layerConfig.LayerSubjects.elements[1].htmlName).to.equals("Another <br>Layer");
            expect(testState.layerConfig.LayerSubjects.elements[1].name).to.equals("Another Layer");
        });

        it("should not process layer names if htmlName already exists", () => {
            const testState = {
                layerConfig: {
                    LayerSubjects: {
                        elements: [
                            {
                                id: "layer1",
                                name: "Clean name",
                                htmlName: "Already processed <b>name</b>"
                            }
                        ]
                    }
                }
            };

            actions.processLayerNamesHtmlTags({state: testState});

            expect(testState.layerConfig.LayerSubjects.elements[0].name).to.equals("Clean name");
            expect(testState.layerConfig.LayerSubjects.elements[0].htmlName).to.equals("Already processed <b>name</b>");
        });

        it("should handle nested layer structures with getNestedValues", () => {
            const testState = {
                layerConfig: {
                    LayerSubjects: {
                        elements: [
                            {
                                id: "folder1",
                                name: "Folder <i>Name</i>",
                                elements: [
                                    {
                                        id: "layer1",
                                        name: "Nested <strong>Layer</strong>"
                                    }
                                ]
                            }
                        ]
                    }
                }
            };

            actions.processLayerNamesHtmlTags({state: testState});
            expect(testState.layerConfig.LayerSubjects.elements[0].htmlName).to.equals("Folder <i>Name</i>");
            expect(testState.layerConfig.LayerSubjects.elements[0].name).to.equals("Folder Name");
            expect(testState.layerConfig.LayerSubjects.elements[0].elements[0].htmlName).to.equals("Nested <strong>Layer</strong>");
            expect(testState.layerConfig.LayerSubjects.elements[0].elements[0].name).to.equals("Nested Layer");
        });
    });

});
