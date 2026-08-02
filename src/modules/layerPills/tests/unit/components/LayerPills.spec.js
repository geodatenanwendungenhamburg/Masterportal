import {createStore} from "vuex";
import {shallowMount, mount, config} from "@vue/test-utils";
import LayerPillsComponent from "@modules/layerPills/components/LayerPills.vue";
import {expect} from "chai";
import sinon from "sinon";

config.global.directives = {"bs-tooltip": {mounted: () => { /* stub */ }}};

let observeSpy, disconnectSpy, ResizeObserverStub;

describe("src/modules/LayerPills.vue", () => {
    let store,
        wrapper,
        visibleLayers,
        active,
        mobileOnly,
        visibleSubjectDataLayers,
        mobile,
        initializeModuleSpy,
        replaceByIdInLayerConfigSpy,
        setVisibleSubjectDataLayersSpy,
        startLayerInformationSpy,
        resizeObserver;

    /**
     * Creates a shallow mounted Wrapper for the component
     * @param {*} props the props to include
     * @returns {object} the shallow mounted Wrapper
     */
    function createWrapper (props) {
        return shallowMount(LayerPillsComponent, {
            components: {
                IconButton: {
                    name: "IconButton",
                    template: "<button>Hier</button>"
                }
            },
            global: {
                plugins: [store]
            },
            props: {
                ...props
            }
        });
    }

    beforeAll(() => {
        resizeObserver = global.resizeObserver;
    });

    afterAll(() => {
        global.resizeObserver = resizeObserver;
    });

    beforeEach(() => {
        observeSpy = sinon.spy();
        disconnectSpy = sinon.spy();
        ResizeObserverStub = sinon.stub();
        ResizeObserverStub.returns({
            observe: observeSpy,
            unobserve: sinon.spy(),
            disconnect: disconnectSpy
        });
        global.ResizeObserver = ResizeObserverStub;
        active = true;
        visibleSubjectDataLayers = [{
            name: "layer1"
        }];
        mobile = false;
        mobileOnly = false;
        initializeModuleSpy = sinon.spy();
        replaceByIdInLayerConfigSpy = sinon.spy();
        setVisibleSubjectDataLayersSpy = sinon.spy();
        startLayerInformationSpy = sinon.spy();
        visibleLayers = [
            {id: 0, name: "layer1", typ: "WMS", showInLayerTree: true},
            {id: 1, name: "layer2", typ: "WMS", showInLayerTree: true},
            {id: 2, name: "layer3", typ: "WFS", showInLayerTree: true},
            {id: 3, name: "layer4", typ: "WFS", showInLayerTree: true}
        ];
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LayerPills: {
                            namespaced: true,
                            getters: {
                                active: () => active,
                                mobileOnly: () => mobileOnly,
                                configPaths: () => ["portalConfig.map.layerPills"],
                                type: () => "layerPills",
                                visibleSubjectDataLayers: () => visibleSubjectDataLayers,
                                hidden: () => false
                            },
                            mutations: {
                                setActive: sinon.stub(),
                                setMobileOnly: sinon.stub(),
                                setVisibleSubjectDataLayers: setVisibleSubjectDataLayersSpy
                            }
                        },
                        LayerTree: {
                            namespaced: true,
                            getters: {
                                layerTreeSortedLayerConfigs: () => () => visibleLayers
                            }
                        },
                        LayerInformation: {
                            namespaced: true,
                            actions: {
                                startLayerInformation: startLayerInformationSpy
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: () => "2D"
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        currentSecondaryMenuWidth: () => 25,
                        currentMainMenuWidth: () => 25,
                        mainExpanded: () => true,
                        secondaryExpanded: () => true
                    }
                }
            },
            getters: {
                isMobile: () => mobile,
                visibleSubjectDataLayerConfigs: () => visibleLayers
            },
            mutations: {
                setVisibleSubjectDataLayerConfigs: (state, layer) => {
                    visibleLayers = layer;
                }
            },
            actions: {
                replaceByIdInLayerConfig: replaceByIdInLayerConfigSpy,
                initializeModule: initializeModuleSpy
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    describe("functionality and lifecycle and resizeObserver", () => {
        it("should initialize module and set layers on created", () => {
            wrapper = createWrapper();
            expect(initializeModuleSpy.calledOnce).to.be.true;
            expect(setVisibleSubjectDataLayersSpy.calledOnce).to.be.true;
        });

        it("should set up ResizeObserver and observe container on mounted", () => {
            wrapper = mount(LayerPillsComponent, {
                global: {
                    plugins: [store]
                },
                attachTo: document.body
            });
            expect(ResizeObserverStub.calledOnce).to.be.true;
            expect(observeSpy.calledOnce).to.be.true;
        });

        it("should disconnect ResizeObserver on beforeUnmount", () => {
            wrapper = mount(LayerPillsComponent, {
                global: {
                    plugins: [store]
                },
                attachTo: document.body
            });
            wrapper.unmount();
            wrapper = null;
            expect(disconnectSpy.calledOnce).to.be.true;
        });
        it("should call setToggleButtonVisibility when ResizeObserver fires", async () => {
            wrapper = createWrapper();
            const stub = sinon.stub(wrapper.vm, "setToggleButtonVisibility"),
                callbackArg = ResizeObserverStub.firstCall.args[0];

            callbackArg();
            await wrapper.vm.$nextTick();
            expect(stub.calledOnce).to.be.true;
            stub.restore();
        });
    });

    describe("renders or does not render div", () => {
        it("renders div", () => {
            wrapper = createWrapper();
            expect(wrapper.find("#layer-pills").exists()).to.be.true;
        });

        it("no visibleSubjectDataLayers", () => {
            visibleSubjectDataLayers = [];

            wrapper = createWrapper();

            expect(wrapper.find("#layer-pills").exists()).to.be.false;
        });

        it("should not exist if active false", () => {
            active = false;

            wrapper = createWrapper();
            expect(wrapper.find("#layer-pills").exists()).to.be.false;
        });

        it("should set class if mobileOnly true", () => {
            mobileOnly = true;

            wrapper = createWrapper();
            expect(wrapper.find("#layer-pills").classes()).to.contain("mobileOnly");
        });
    });

    describe("close layerPill", () => {
        it("count close-buttons", () => {
            wrapper = mount(LayerPillsComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.findAll(".close-button").length).to.equals(visibleSubjectDataLayers.length);
        });
    });

    describe("method testing", () => {
        it("setVisibleLayers", () => {
            wrapper = createWrapper();

            expect(setVisibleSubjectDataLayersSpy.calledOnce).to.be.true;
            expect(setVisibleSubjectDataLayersSpy.firstCall.args[1]).to.deep.equal([
                {id: 0, name: "layer1", typ: "WMS", showInLayerTree: true},
                {id: 1, name: "layer2", typ: "WMS", showInLayerTree: true},
                {id: 2, name: "layer3", typ: "WFS", showInLayerTree: true},
                {id: 3, name: "layer4", typ: "WFS", showInLayerTree: true}
            ]);
        });

        it("setVisibleLayers only sets 2D layers if 2D mode is selected", () => {
            const visibleLayers3D2D = [
                {id: 0, name: "layer1", typ: "ENTITIES3D"},
                {id: 1, name: "layer2", typ: "ENTITIES3D"},
                {id: 2, name: "layer3", typ: "WFS"},
                {id: 3, name: "layer4", typ: "WFS"}
            ];

            wrapper = createWrapper();
            wrapper.vm.setVisibleLayers(visibleLayers3D2D, "2D");

            expect(setVisibleSubjectDataLayersSpy.calledTwice).to.be.true;
            expect(setVisibleSubjectDataLayersSpy.secondCall.args[1]).to.deep.equal([
                {id: 2, name: "layer3", typ: "WFS"},
                {id: 3, name: "layer4", typ: "WFS"}]
            );
        });
        it("setVisibleLayers does not set layers that are never visible in tree", () => {
            const visibleLayers3D2D = [
                {id: 0, name: "layer1", isNeverVisibleInTree: true},
                {id: 1, name: "layer2", isNeverVisibleInTree: false},
                {id: 2, name: "layer3", isNeverVisibleInTree: true},
                {id: 3, name: "layer4", isNeverVisibleInTree: false}
            ];

            wrapper = createWrapper();
            wrapper.vm.setVisibleLayers(visibleLayers3D2D);

            expect(setVisibleSubjectDataLayersSpy.calledTwice).to.be.true;
            expect(setVisibleSubjectDataLayersSpy.secondCall.args[1]).to.deep.equal([
                {id: 1, name: "layer2", isNeverVisibleInTree: false},
                {id: 3, name: "layer4", isNeverVisibleInTree: false}]
            );
        });

        it("setVisibleLayers excludes showInLayerTree false layers from pills", () => {
            visibleLayers = [
                {id: 0, name: "layer1", typ: "WMS", showInLayerTree: true},
                {id: 1, name: "layer2", typ: "WMS"},
                {id: 2, name: "layer3", typ: "WFS", showInLayerTree: false},
                {id: 3, name: "layer4", typ: "WFS", showInLayerTree: true}
            ];

            wrapper = createWrapper();

            expect(setVisibleSubjectDataLayersSpy.firstCall.args[1]).to.deep.equal([
                {id: 0, name: "layer1", typ: "WMS", showInLayerTree: true},
                {id: 1, name: "layer2", typ: "WMS"},
                {id: 3, name: "layer4", typ: "WFS", showInLayerTree: true}
            ]);
        });

        it("removeLayerFromVisibleLayers shall call replaceByIdInLayerConfig", () => {
            wrapper = createWrapper();
            wrapper.vm.removeLayerFromVisibleLayers(visibleLayers[0], "2D");

            expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
            expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.deep.equals({
                layerConfigs: [{
                    id: visibleLayers[0].id,
                    layer: {
                        id: visibleLayers[0].id,
                        visibility: false
                    }
                }]
            });
        });

        it("does not show toggle button when there is enough space", async () => {
            wrapper = mount(LayerPillsComponent, {
                global: {plugins: [store]},
                attachTo: document.body
            });

            const container = wrapper.find("#layer-pills").element;
            const queryAllStub = sinon.stub(container, "querySelectorAll");
            const querySingleStub = sinon.stub(container, "querySelector");

            queryAllStub.withArgs(".nav-pills > li").returns([{offsetWidth: 100}]);

            querySingleStub.withArgs(".nav-pills").returns({
                getBoundingClientRect: () => ({width: 500})
            });

            await wrapper.vm.$nextTick();
            wrapper.vm.setToggleButtonVisibility();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.showToggleButton).to.be.false;
        });

        it("shows toggle button when pills overflow container", async () => {
            visibleSubjectDataLayers = [{name: "l1"}, {name: "l2"}];

            wrapper = mount(LayerPillsComponent, {
                global: {plugins: [store]},
                attachTo: document.body
            });

            const container = wrapper.vm.$refs.layerPillsContainer;
            const queryAllStub = sinon.stub(container, "querySelectorAll");
            const querySingleStub = sinon.stub(container, "querySelector");

            queryAllStub.withArgs(".nav-pills > li").returns([{offsetWidth: 150}, {offsetWidth: 150}]);

            querySingleStub.withArgs(".nav-pills").returns({
                getBoundingClientRect: () => ({width: 250})
            });

            wrapper.vm.setToggleButtonVisibility();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.showToggleButton).to.be.true;
        });

        it("showLayerInformationInMenu layerConf with datasets calls startLayerInformation", () => {
            const layerConf = {
                datasets: []
            };

            wrapper = createWrapper();

            wrapper.vm.showLayerInformationInMenu(layerConf);

            expect(startLayerInformationSpy.calledOnce).to.be.true;
        });

        it("showLayerInformationInMenu layerConf of group calls startLayerInformation", () => {
            const layerConf = {
                type: "GROUP",
                datasets: []
            };

            wrapper = createWrapper();

            wrapper.vm.showLayerInformationInMenu(layerConf);

            expect(startLayerInformationSpy.calledOnce).to.be.true;
        });

        it("showLayerInformationInMenu layerConf of group3D calls startLayerInformation", () => {
            const layerConf = {
                type: "GROUP3D",
                datasets: []
            };

            wrapper = createWrapper();

            wrapper.vm.showLayerInformationInMenu(layerConf);

            expect(startLayerInformationSpy.calledOnce).to.be.true;
        });


        it("showLayerInformationInMenu layerConf without datasets does nothing", () => {
            const layerConf = {
            };

            wrapper = createWrapper();

            wrapper.vm.showLayerInformationInMenu(layerConf);

            expect(startLayerInformationSpy.notCalled).to.be.true;
        });
    });


    describe("tooltip of anchor", () => {
        it("anchors should have the correct tooltip", () => {
            const bsTooltipStub = {mounted: sinon.stub()};

            wrapper = shallowMount(LayerPillsComponent, {
                components: {
                    IconButton: {
                        name: "IconButton",
                        template: "<button>Hier</button>"
                    }
                },
                global: {
                    plugins: [store],
                    directives: {"bs-tooltip": bsTooltipStub}
                }
            });

            wrapper.findAll("li.nav-item button.nav-link").forEach((element, index) => {
                expect(element.attributes("title")).to.equal(visibleLayers[index].name);
            });

            expect(bsTooltipStub.mounted.callCount).to.equal(visibleSubjectDataLayers.length);
            expect(bsTooltipStub.mounted.firstCall.args[1].value).to.deep.equal({
                customClass: "custom-tooltip",
                placement: "bottom",
                trigger: "hover"
            });
        });
    });

    describe("watcher", () => {
        it("calls setVisibleLayers when visibleSubjectDataLayerConfigs changes", () => {
            let initialSorted = null,
                expectedLayers = null;

            const setVisibleLayersSpy = sinon.spy(LayerPillsComponent.methods, "setVisibleLayers"),
                newValue = [{id: 0}];

            wrapper = createWrapper();

            wrapper.vm.$options.watch.visibleSubjectDataLayerConfigs.handler.call(wrapper.vm, newValue, []);

            expect(setVisibleLayersSpy.calledTwice).to.be.true;

            initialSorted = wrapper.vm.sortedVisibleLayerPills;

            expect(setVisibleLayersSpy.firstCall.args[0]).to.deep.equal(initialSorted);
            expect(setVisibleLayersSpy.firstCall.args[1]).to.equal("2D");

            expectedLayers = wrapper.vm.sortedVisibleLayerPills;

            expect(setVisibleLayersSpy.secondCall.args[0]).to.deep.equal(expectedLayers);
            expect(setVisibleLayersSpy.secondCall.args[1]).to.equal("2D");
        });

        it("visibleSubjectDataLayerConfigs triggers setVisibleLayers correctly", () => {
            let initialSorted = null,
                expectedLayers = null;

            const setVisibleLayersSpy = sinon.spy(LayerPillsComponent.methods, "setVisibleLayers"),
                newValue = [{id: 0}];

            wrapper = createWrapper();

            wrapper.vm.$options.watch.visibleSubjectDataLayerConfigs.handler.call(wrapper.vm, newValue);

            initialSorted = wrapper.vm.sortedVisibleLayerPills;
            expectedLayers = wrapper.vm.sortedVisibleLayerPills;

            expect(setVisibleLayersSpy.calledTwice).to.be.true;
            expect(setVisibleLayersSpy.firstCall.args[0]).to.deep.equal(initialSorted);
            expect(setVisibleLayersSpy.firstCall.args[1]).to.equal("2D");
            expect(setVisibleLayersSpy.secondCall.args[0]).to.deep.equal(expectedLayers);
            expect(setVisibleLayersSpy.secondCall.args[1]).to.equal("2D");
        });

        it("mode change shall call setVisibleLayers", () => {
            const visibleSubjectDataLayerConfigs = [{
                    id: "id1"
                }, {
                    id: "id2"
                }],
                setVisibleLayersSpy = sinon.spy(LayerPillsComponent.methods, "setVisibleLayers");

            store.commit("setVisibleSubjectDataLayerConfigs", visibleSubjectDataLayerConfigs);
            wrapper = createWrapper();
            wrapper.vm.$options.watch.mode.call(wrapper.vm, "3D");
            // called once on mounted and once on watcher call
            expect(setVisibleLayersSpy.calledTwice).to.be.true;
            expect(setVisibleLayersSpy.secondCall.args[0]).to.be.deep.equals(wrapper.vm.sortedVisibleLayerPills);
            expect(setVisibleLayersSpy.secondCall.args[1]).to.be.equals("3D");
        });

    });
});
