import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import ShareViewComponent from "@modules/shareView/components/ShareView.vue";
import ShareView from "@modules/shareView/store/indexShareView";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/shareView/components/ShareView.vue", () => {
    const mockConfigJson = {
            portalConfig: {
                navigationSecondary: {
                    sections: [
                        {
                            shareView: {
                                title: "Share",
                                icon: "bi-share",
                                itemType: "shareView",
                                facebookShare: true,
                                copyShare: true,
                                qrShare: true
                            }
                        }
                    ]
                }
            }
        },
        addSingleAlertSpy = sinon.spy();
    let defaultState,
        store,
        wrapper;

    before(() => {
        defaultState = {...ShareView.state};
    });

    beforeEach(() => {
        mapCollection.clear();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        ShareView: {
                            namespaced: true,
                            getters: {
                                url: () => sinon.stub(),
                                facebookShare: () => sinon.stub(),
                                copyShare: () => sinon.stub(),
                                qrShare: () => sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        getView: sinon.stub()
                    },
                    actions: {}
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: addSingleAlertSpy
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                visibleLayerConfigs: sinon.stub(),
                isMobile: sinon.stub()
            }
        });

    });

    afterEach(() => {
        sinon.restore();
    });

    after(() => {
        ShareView.state = defaultState;
    });

    it("renders the shareView component", () => {
        wrapper = shallowMount(ShareViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#share-view").exists()).to.be.true;
        expect(wrapper.find("#facebook-btn").exists()).to.be.true;
        expect(wrapper.find("#copy-btn").exists()).to.be.true;
        expect(wrapper.find("#qr-btn").exists()).to.be.true;
    });

    describe("copyToClipboard", () => {
        let localWindow,
            localNavigator;

        before(() => {
            localWindow = global.window;
            localNavigator = global.navigator;
        });

        afterEach(() => {
            global.window = localWindow;
            global.navigator = localNavigator;
        });

        it("copy to clipboard for secure websites", function () {
            let text = "";

            window.isSecureContext = true;
            navigator.clipboard = {
                writeText: (aText) => {
                    text = aText;
                }
            };
            const writeTextStub = sinon.stub(navigator.clipboard, "writeText").resolves(text);

            wrapper = shallowMount(ShareViewComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.copyToClipboard();

            expect(writeTextStub.calledOnceWithExactly("stub#")).to.be.true;
            expect(writeTextStub.callCount).to.equals(1);
        });

        it("draw an alert for unsecure websites", () => {
            global.window.isSecureContext = false;
            wrapper = shallowMount(ShareViewComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.copyToClipboard();

            expect(addSingleAlertSpy.callCount).to.equals(1);
            expect(addSingleAlertSpy.firstCall.args[1]).to.deep.equals({
                category: "error",
                content: "common:modules.shareView.copyErrorAlert"
            });
        });
        it("copies the URL with attached # to clipboard", function () {
            let text = "";

            window.isSecureContext = true;
            navigator.clipboard = {
                writeText: (aText) => {
                    text = aText;
                }
            };
            const writeTextStub = sinon.stub(navigator.clipboard, "writeText").resolves(text);

            wrapper = shallowMount(ShareViewComponent, {
                global: {plugins: [store]}
            });

            wrapper.vm.copyToClipboard();

            expect(writeTextStub.calledOnceWithExactly("stub#")).to.be.true;
            expect(writeTextStub.callCount).to.equals(1);
        });

        it("includes existing URL parameters in the share URL", () => {
            const mockLayerUrlParams = [
                    {id: "layer1", visibility: true},
                    {id: "layer2", visibility: false}
                ],
                mockMapUrlParams = "MAP=mapValue",
                mockMenuUrlParams = {
                    main: {
                        currentComponent: "root"
                    },
                    secondary: {
                        currentComponent: "root"
                    }
                },
                mockAddonUrlParams = "ADDONPARAM=addonValue",
                rootGetters = {
                    layerUrlParams: mockLayerUrlParams,
                    "Maps/urlParams": mockMapUrlParams,
                    "Menu/urlParams": mockMenuUrlParams
                },
                originalLocation = global.location,
                state = {},
                getters = {},
                expectedURL = "https://self.example.org/portal/?MAP=mapValue&MENU={\"main\":{\"currentComponent\":\"root\"},\"secondary\":{\"currentComponent\":\"root\"}}&LAYERS=[{\"id\":\"layer1\",\"visibility\":true},{\"id\":\"layer2\",\"visibility\":false}]&ADDONPARAM=addonValue";

            global.location = {
                ...originalLocation,
                origin: "https://self.example.org",
                pathname: "/portal/",
                search: mockAddonUrlParams
            };

            expect(ShareView.getters.url(state, getters, {}, rootGetters)).to.equal(expectedURL);
            global.location = originalLocation;
        });
        it("ignore existing basic URL parameters in the share URL", () => {
            const mockLayerUrlParams = [
                    {id: "layer1", visibility: true},
                    {id: "layer2", visibility: false}
                ],
                mockMapUrlParams = "MAP=mapValue",
                mockMenuUrlParams = {
                    main: {
                        currentComponent: "root"
                    },
                    secondary: {
                        currentComponent: "root"
                    }
                },
                mockExistingParams = "MAP=oldMapValue&LAYERS=oldLayerValue&MENU=oldMenuValue&ADDONPARAM=addonValue",
                rootGetters = {
                    layerUrlParams: mockLayerUrlParams,
                    "Maps/urlParams": mockMapUrlParams,
                    "Menu/urlParams": mockMenuUrlParams
                },
                originalLocation = global.location,
                state = {},
                getters = {},
                expectedURL = "https://self.example.org/portal/?MAP=mapValue&MENU={\"main\":{\"currentComponent\":\"root\"},\"secondary\":{\"currentComponent\":\"root\"}}&LAYERS=[{\"id\":\"layer1\",\"visibility\":true},{\"id\":\"layer2\",\"visibility\":false}]&ADDONPARAM=addonValue";

            global.location = {
                ...originalLocation,
                origin: "https://self.example.org",
                pathname: "/portal/",
                search: mockExistingParams
            };

            expect(ShareView.getters.url(state, getters, {}, rootGetters)).to.equal(expectedURL);
            global.location = originalLocation;
        });
    });

});
