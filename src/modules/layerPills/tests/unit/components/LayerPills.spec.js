import {createStore} from "vuex";
import {config, shallowMount, mount} from "@vue/test-utils";
import LayerPillsComponent from "@modules/layerPills/components/LayerPills.vue";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

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

    before(() => {
        resizeObserver = global.resizeObserver;
    });

    after(() => {
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
            {id: 0, name: "layer1", typ: "WMS"},
            {id: 1, name: "layer2", typ: "WMS"},
            {id: 2, name: "layer3", typ: "WFS"},
            {id: 3, name: "layer4", typ: "WFS"}
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
        sinon.restore();
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

    describe("left scroll disabled", () => {
        it.skip("left scroll is disabled", () => {
            wrapper = mount(LayerPillsComponent, {
                components: {
                    IconButton: {
                        name: "IconButton",
                        template: "<button>Hier</button>"
                    }
                },
                global: {
                    plugins: [store]
                }});
            expect(wrapper.find("#layerpills-left-button").attributes().style).to.include("visibility: hidden");
        });
    });
    describe.skip("right scroll enabled", () => {
        it("right scroll is enabled", async () => {

            wrapper = mount(LayerPillsComponent, {
                components: {
                    IconButton: {
                        name: "IconButton",
                        template: "<button>Hier</button>"
                    }
                },
                global: {
                    plugins: [store]
                }});

            wrapper.vm.$el.offsetWidth = 400;
            wrapper.vm.$el.scrollWidth = 500;

            wrapper.vm.$nextTick(function () {
                expect(wrapper.find("#layerpills-right-button").attributes().style).to.be.undefined;
            });

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
            expect(setVisibleSubjectDataLayersSpy.firstCall.args[1]).to.deep.equal(visibleLayers);
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
        describe.skip("skipped", () => {
            it("shall set scrolled and showRightbutton by moveLayerPills - scroll right", () => {
                const scrollLeft = 1000,
                    scrollBySpy = sinon.spy();

        it("does not show toggle button when there is enough space", async () => {
            wrapper = mount(LayerPillsComponent, {
                global: {plugins: [store]},
                attachTo: document.body
            });

            const container = wrapper.find("#layer-pills").element;

            sinon.stub(container, "querySelectorAll").returns([{offsetWidth: 100}]);
            sinon.stub(container, "querySelector").returns({offsetWidth: 50});
            Object.defineProperty(container, "clientWidth", {value: 400});

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

            const container = wrapper.vm.$refs.layerPillsContainer,

                queryStub = sinon.stub(container, "querySelectorAll");

            queryStub.withArgs(".nav-item").returns([{offsetWidth: 150}]);
            queryStub.withArgs(".nav-pills").returns([{
                getBoundingClientRect: () => ({width: 100})
            }]);
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
            wrapper = createWrapper();

            wrapper.findAll("li.nav-item button").forEach((element, index) => {
                expect(element.attributes()).to.own.include({"data-bs-toggle": "tooltip"});
                expect(element.attributes()).to.own.include({"data-bs-placement": "bottom"});
                expect(element.attributes()).to.own.include({"data-bs-custom-class": "custom-tooltip"});
                expect(element.attributes()).to.own.include({"title": visibleLayers[index].name});
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

            initialSorted = wrapper.vm.layerTreeSortedLayerConfigs().filter(
                l => wrapper.vm.visibleSubjectDataLayerConfigs.some(n => n.id === l.id)
            );

            expect(setVisibleLayersSpy.firstCall.args[0]).to.deep.equal(initialSorted);
            expect(setVisibleLayersSpy.firstCall.args[1]).to.equal("2D");

            expectedLayers = wrapper.vm.layerTreeSortedLayerConfigs();

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

            initialSorted = wrapper.vm.layerTreeSortedLayerConfigs().filter(
                l => wrapper.vm.visibleSubjectDataLayerConfigs.some(n => n.id === l.id)
            );
            expectedLayers = wrapper.vm.layerTreeSortedLayerConfigs();

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
            expect(setVisibleLayersSpy.secondCall.args[0]).to.be.deep.equals(visibleSubjectDataLayerConfigs);
            expect(setVisibleLayersSpy.secondCall.args[1]).to.be.equals("3D");
        });

    });
    describe("menus", () => {
        it.skip("should call setToggleButtonVisibility on mount and whenever combinedMenuWidthState changes", async () => {
            const stubSetToggleButtonVisibility = sinon.stub(LayerPillsComponent.methods, "setToggleButtonVisibility");

            wrapper = createWrapper();
            expect(stubSetToggleButtonVisibility.calledOnce).to.be.true;
            store.hotUpdate({
                modules: {
                    Menu: {
                        namespaced: true,
                        getters: {
                            currentMainMenuWidth: () => 20,
                            currentSecondaryMenuWidth: () => 30
                        }
                    }
                }
            });
            await wrapper.vm.$nextTick();

            expect(stubSetToggleButtonVisibility.calledTwice).to.be.true;

            store.hotUpdate({
                modules: {
                    Menu: {
                        namespaced: true,
                        getters: {
                            currentMainMenuWidth: () => 15,
                            currentSecondaryMenuWidth: () => 0
                        }
                    }
                }
            });

            await wrapper.vm.$nextTick();

            expect(stubSetToggleButtonVisibility.calledThrice).to.be.true;
            stubSetToggleButtonVisibility.restore();
        });
    });
});
