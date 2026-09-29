import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import escapeId from "@shared/js/utils/escapeId.js";
import layerTypes from "@core/layers/js/layerTypes.js";
import LayerCheckBox from "@modules/layerTree/components/LayerCheckBox.vue";
import baselayerHandler from "@modules/layerSelection/js/handleSingleBaselayer.js";


describe("src/modules/layerTree/components/LayerCheckBox.vue", () => {
    let store,
        wrapper,
        layer,
        propsData,
        replaceByIdInLayerConfigSpy,
        changeVisibilitySpy,
        isLayerTree,
        highlightLayerId,
        loggedIn,
        configJs,
        addSingleAlertSpy,
        singleBaselayer,
        visibleBaselayerConfigs,
        baselayerHandlerSpy;

    beforeEach(() => {
        singleBaselayer = false;
        visibleBaselayerConfigs = [];
        isLayerTree = true;
        highlightLayerId = null;
        loggedIn = false;
        configJs = {};
        addSingleAlertSpy = sinon.spy();
        layer = {
            id: "1",
            name: "layer",
            typ: "WMS",
            visibility: false,
            showInLayerTree: true
        };
        propsData = {
            conf: layer,
            isLayerTree: isLayerTree
        };

        replaceByIdInLayerConfigSpy = sinon.spy();
        changeVisibilitySpy = sinon.spy();
        baselayerHandlerSpy = sinon.spy(baselayerHandler, "checkAndAdd");
        sinon.stub(layerTypes, "getLayerTypes3d").returns(["TERRAIN3D"]);
        store = createStore({
            modules: {
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: addSingleAlertSpy
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        LayerCheckBox,
                        Login: {
                            namespaced: true,
                            getters: {
                                loggedIn: () => loggedIn
                            }
                        },
                        LayerSelection: {
                            namespaced: true,
                            mutations: {
                                setHighlightLayerId: sinon.stub()
                            },
                            actions: {
                                changeVisibility: changeVisibilitySpy
                            },
                            getters: {
                                highlightLayerId: () => highlightLayerId
                            }
                        }
                    }
                }
            },
            actions: {
                replaceByIdInLayerConfig: replaceByIdInLayerConfigSpy
            },
            getters: {
                configJs: () => configJs,
                singleBaselayer: () => singleBaselayer,
                visibleBaselayerConfigs: () => visibleBaselayerConfigs
            }
        });
    });

    it("renders the layer given as property to the component", () => {
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.true;
    });

    it("renders the layer with special id given as property to the component", () => {
        propsData.conf.id = "1234.5";
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + escapeId(propsData.conf.id)).exists()).to.be.true;
    });

    it("renders layer with visibility false and checkbox not disabled", () => {
        let checkbox = null;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });
        checkbox = wrapper.find("#layer-checkbox-" + propsData.conf.id);

        expect(checkbox.exists()).to.be.true;
        expect(checkbox.attributes("role")).to.equal("checkbox");
        expect(checkbox.attributes("aria-checked")).to.equal("false");
        expect(checkbox.attributes("aria-label")).to.equal(propsData.conf.name);
        expect(checkbox.attributes().disabled).to.be.undefined;
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);
        expect(wrapper.find(".layer-tree-layer-checkbox pe-2 bi-check2-square").exists()).to.be.false;
        expect(wrapper.find(".layer-tree-layer-label").text()).to.equal(propsData.conf.name);
        expect(wrapper.find("span").attributes("class")).not.to.include("font-bold");
    });

    it("renders layer with visibility false and checkbox disabled", () => {
        let checkbox = null;

        propsData.disabled = true;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });
        checkbox = wrapper.find("#layer-checkbox-" + propsData.conf.id);

        expect(checkbox.exists()).to.be.true;
        expect(checkbox.attributes().disabled).to.equal("");
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);
        expect(wrapper.find(".layer-tree-layer-checkbox pe-2 bi-check2-square").exists()).to.be.false;
        expect(wrapper.find(".layer-tree-layer-label").text()).to.equal(propsData.conf.name);
        expect(wrapper.find("span").attributes("class")).not.to.include("font-bold");
    });

    it("renders background-layer as simple preview", () => {
        layer.baselayer = true;
        propsData.isLayerTree = false;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.false;
        expect(wrapper.find("#layer-tree-layer-preview-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.find("layer-preview-stub").exists()).to.be.true;
        expect(wrapper.find(".pt-4").text()).to.equal(propsData.conf.name);
    });

    it("renders background-layer with preview in config", () => {
        layer.baselayer = true;
        propsData.isLayerTree = false;
        layer.shortname = "shortname";
        layer.preview = {
            customClass: "customClass",
            center: "1,2",
            zoomLevel: 6
        };

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.false;
        expect(wrapper.find("#layer-tree-layer-preview-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.find("layer-preview-stub").exists()).to.be.true;
        expect(wrapper.find("layer-preview-stub").attributes("center")).to.be.equals(layer.preview.center);
        expect(wrapper.find("layer-preview-stub").attributes("zoomlevel")).to.be.equals(String(layer.preview.zoomLevel));
        expect(wrapper.find("layer-preview-stub").attributes("customclass")).to.be.equals(layer.preview.customClass);
        expect(wrapper.find("layer-preview-stub").attributes("checkable")).to.be.equals("true");
        expect(wrapper.find(".pt-4").text()).to.equal(propsData.conf.shortname);
    });


    it("renders layer with shortname", () => {
        propsData.conf.shortname = "short";
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);
        expect(wrapper.find(".bi-check2-square").exists()).to.be.false;
        expect(wrapper.find(".layer-tree-layer-label").text()).to.equal(propsData.conf.shortname);
        expect(wrapper.find("span").attributes("class")).not.to.include("font-bold");
    });

    it("renders layer with visibility true and checkbox, name is bold", () => {

        propsData.conf.visibility = true;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        const checkbox = wrapper.find("#layer-checkbox-" + propsData.conf.id);

        expect(checkbox.exists()).to.be.true;
        expect(checkbox.attributes("role")).to.equal("checkbox");
        expect(checkbox.attributes("aria-label")).to.equal(propsData.conf.name);
        expect(checkbox.attributes("aria-checked")).to.equal("true");
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);
        expect(wrapper.find(".bi-check-square").exists()).to.be.true;
        expect(wrapper.find(".layer-tree-layer-label").text()).to.equal(propsData.conf.name);
        expect(wrapper.find(".layer-tree-layer-label").attributes("class")).to.include("font-bold");
    });

    it("render the lock fill icon, if the layer has the attribute isSecured=true", () => {
        propsData.conf.isSecured = true;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id + " > i").exists()).to.be.true;
        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id + " > i").classes()).to.be.an("array").that.includes("bi-lock-fill", "pe-1");

    });

    it("render the open lock icon, if the layer has the attribute isSecured=true and the user is logged in", () => {
        propsData.conf.isSecured = true;
        loggedIn = true;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        const icons = wrapper.findAll("#layer-checkbox-" + propsData.conf.id + " > i");

        expect(icons.some(icon => icon.classes().includes("bi-unlock-fill") && icon.classes().includes("pe-1"))).to.be.true;
        expect(icons.some(icon => icon.classes().includes("bi-lock-fill"))).to.be.false;
    });

    it("computed property isLayerVisible with visibility=false ", () => {
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.vm.isLayerVisible).to.be.false;
    });
    it("computed property isLayerVisible with visibility=undefined ", () => {
        layer.visibility = undefined;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.vm.isLayerVisible).to.be.false;
    });
    it("computed property isLayerVisible with visibility=true ", () => {
        layer.visibility = true;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.vm.isLayerVisible).to.be.true;
    });

    it("computed property isBold with no highlightLayerId shall return visibility false of layer", () => {
        layer.visibility = false;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.vm.isBold).to.be.false;
    });

    it("computed property isBold with no highlightLayerId shall return visibility true of layer", () => {
        layer.visibility = true;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.vm.isBold).to.be.true;
    });

    it("computed property isBold with highlightLayerId shall return true although visibility of layer is false", () => {
        layer.visibility = false;
        highlightLayerId = "1";
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.vm.isBold).to.be.true;
    });

    it("layerTree: click on checkbox of layer with visibility false, call replaceByIdInLayerConfig", async () => {
        const spyArg = {
            layerConfigs: [{
                id: layer.id,
                layer: {
                    id: layer.id,
                    visibility: true
                }
            }],
            _source: LayerCheckBox.name
        };
        let checkbox = null;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);

        checkbox = wrapper.find(".layer-tree-layer-checkbox");
        checkbox.trigger("click");
        await wrapper.vm.$nextTick();

        expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
        expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });

    describe("secured layer", () => {
        beforeEach(() => {
            propsData.conf.isSecured = true;
            configJs = {login: {oidcClientId: "portal"}};
        });

        it("should not show a secured layer and ask to log in, if the portal uses the login and the user is not logged in", async () => {
            wrapper = shallowMount(LayerCheckBox, {global: {plugins: [store]}, propsData});

            await wrapper.find("#layer-checkbox-" + propsData.conf.id).trigger("click");

            expect(replaceByIdInLayerConfigSpy.notCalled).to.be.true;
            expect(addSingleAlertSpy.calledOnce).to.be.true;
            expect(addSingleAlertSpy.firstCall.args[1].category).to.equal("info");
            expect(addSingleAlertSpy.firstCall.args[1].content).to.equal("common:modules.layerTree.loginRequired");
        });

        it("should show a secured layer, if the user is logged in", async () => {
            loggedIn = true;
            wrapper = shallowMount(LayerCheckBox, {global: {plugins: [store]}, propsData});

            await wrapper.find("#layer-checkbox-" + propsData.conf.id).trigger("click");

            expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
            expect(addSingleAlertSpy.notCalled).to.be.true;
        });

        it("should show a secured layer, if the portal does not use the login", async () => {
            configJs = {};
            wrapper = shallowMount(LayerCheckBox, {global: {plugins: [store]}, propsData});

            await wrapper.find("#layer-checkbox-" + propsData.conf.id).trigger("click");

            expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
            expect(addSingleAlertSpy.notCalled).to.be.true;
        });

        it("should hide a visible secured layer, even if the user is not logged in", async () => {
            propsData.conf.visibility = true;
            wrapper = shallowMount(LayerCheckBox, {global: {plugins: [store]}, propsData});

            await wrapper.find("#layer-checkbox-" + propsData.conf.id).trigger("click");

            expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
            expect(replaceByIdInLayerConfigSpy.firstCall.args[1].layerConfigs[0].layer.visibility).to.be.false;
            expect(addSingleAlertSpy.notCalled).to.be.true;
        });
    });

    it("click on checkbox of layer with visibility true", async () => {
        const spyArg = {
            layerConfigs: [{
                id: layer.id,
                layer: {
                    id: layer.id,
                    visibility: false
                }
            }],
            _source: LayerCheckBox.name
        };
        let checkbox = null;

        propsData.conf.visibility = true;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);

        checkbox = wrapper.find(".layer-tree-layer-checkbox");
        checkbox.trigger("click");
        await wrapper.vm.$nextTick();

        expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
        expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });

    it("layerTree: keydown space on checkbox triggers clicked behavior", async () => {
        const spyArg = {
            layerConfigs: [{
                id: layer.id,
                layer: {
                    id: layer.id,
                    visibility: true
                }
            }],
            _source: LayerCheckBox.name
        };
        let checkbox = null;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        checkbox = wrapper.find("#layer-checkbox-" + propsData.conf.id);
        await checkbox.trigger("keydown.space");
        await wrapper.vm.$nextTick();

        expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
        expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });

    it("layerTree: keydown enter on checkbox triggers clicked behavior", async () => {
        const spyArg = {
            layerConfigs: [{
                id: layer.id,
                layer: {
                    id: layer.id,
                    visibility: true
                }
            }],
            _source: LayerCheckBox.name
        };
        let checkbox = null;

        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        checkbox = wrapper.find("#layer-checkbox-" + propsData.conf.id);
        await checkbox.trigger("keydown.enter");
        await wrapper.vm.$nextTick();

        expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
        expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });

    it("singleBaselayer is true, create radio-button for baselayer", async () => {
        const spyArg = {
            layerConfigs: [{
                id: layer.id,
                layer: {
                    id: layer.id,
                    visibility: false
                }
            }],
            _source: LayerCheckBox.name
        };
        let radio = null;

        singleBaselayer = true;
        propsData.conf.visibility = true;
        propsData.conf.baselayer = true;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);
        expect(wrapper.findAll(".bi-check-circle").length).to.be.equals(1);
        expect(wrapper.findAll(".bi-check-square").length).to.be.equals(0);
        expect(wrapper.findAll(".bi-circle").length).to.be.equals(0);
        expect(wrapper.findAll(".bi-square").length).to.be.equals(0);

        radio = wrapper.find(".bi-check-circle");
        radio.trigger("click");
        await wrapper.vm.$nextTick();

        expect(baselayerHandlerSpy.calledOnce).to.be.true;
        expect(baselayerHandlerSpy.firstCall.args[0]).to.be.true;
        expect(baselayerHandlerSpy.firstCall.args[1]).to.be.deep.equals(visibleBaselayerConfigs);
        expect(baselayerHandlerSpy.firstCall.args[2]).to.be.deep.equals(spyArg.layerConfigs);
        expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
        expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });

    it("layerSelection: click on checked checkbox of layer with visibility true, call removeSelectedLayer", async () => {
        const spyArg = {
            layerId: layer.id,
            value: true
        };
        let checkbox = null;

        propsData.isLayerTree = false;
        propsData.conf.visibility = false;
        wrapper = shallowMount(LayerCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-checkbox-" + propsData.conf.id).exists()).to.be.true;
        expect(wrapper.findAll(".layer-tree-layer-checkbox").length).to.be.equals(1);

        checkbox = wrapper.find(".layer-tree-layer-checkbox");
        checkbox.trigger("click");
        await wrapper.vm.$nextTick();

        expect(changeVisibilitySpy.calledOnce).to.be.true;
        expect(changeVisibilitySpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });


});
