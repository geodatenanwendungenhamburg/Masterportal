import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import LayerSelectionTreeNode from "../../../components/LayerSelectionTreeNode.vue";

config.global.mocks.$t = key => key;

describe("src/modules/layerSelection/components/LayerSelectionTreeNode.vue", () => {
    let store,
        wrapper,
        layer,
        propsData;

    beforeEach(() => {
        layer = {
            id: "1",
            name: "layer",
            typ: "WMS",
            type: "layer",
            visibility: false,
            showInLayerTree: true
        };
        propsData = {
            conf: layer,
            showSelectAllCheckBox: false,
            selectAllConfigs: []
        };
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: sinon.stub()
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders a layer", () => {
        wrapper = shallowMount(LayerSelectionTreeNode, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-selection-treenode-1").exists()).to.be.true;
        expect(wrapper.findAll("layer-stub").length).to.be.equals(1);
        expect(wrapper.find("select-all-check-box-stub ").exists()).to.be.false;
    });
    it("renders a folder", () => {
        propsData = {
            conf: {
                name: "Titel Ebene 1",
                description: "description",
                type: "folder",
                elements: []
            }
        };
        wrapper = shallowMount(LayerSelectionTreeNode, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layer-selection-treenode-TitelEbene1").exists()).to.be.true;
        expect(wrapper.findAll("layer-stub").length).to.be.equals(0);
        expect(wrapper.find("select-all-check-box-stub ").exists()).to.be.false;
    });
    it("renders a select all checkbox and one layer", () => {
        propsData = {
            conf: layer,
            showSelectAllCheckBox: true,
            selectAllConfigs: []
        };
        wrapper = shallowMount(LayerSelectionTreeNode, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("select-all-check-box-stub ").exists()).to.be.true;
        expect(wrapper.findAll("layer-stub").length).to.be.equals(1);
    });

    describe("methods", () => {
        beforeEach(() => {
            const folderConfig = {
                name: "Folder",
                type: "folder",
                elements: [
                    {id: "1", name: "Layer 1", layerSequence: 2},
                    {id: "2", name: "Layer 2", layerSequence: 1},
                    {id: "3", name: "Layer 3"}
                ]
            };

            propsData = {
                conf: folderConfig,
                showSelectAllCheckBox: false,
                selectAllConfigs: []
            };

            wrapper = shallowMount(LayerSelectionTreeNode, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            wrapper.vm.folderClicked();
        });
        it("folderClicked - emits showNode with the folder name and the folder elements", () => {
            expect(wrapper.emitted().showNode).to.have.lengthOf(1);
            expect(wrapper.emitted().showNode[0]).to.deep.equal([
                "Folder",
                [
                    {id: "2", name: "Layer 2", layerSequence: 1},
                    {id: "1", name: "Layer 1", layerSequence: 2},
                    {id: "3", name: "Layer 3"}
                ]
            ]);
        });
        it("folderClicked - sorts elements by layerSequence, if layerSequence is present", () => {
            expect(wrapper.vm.conf.elements).to.deep.equal([
                {id: "2", name: "Layer 2", layerSequence: 1},
                {id: "1", name: "Layer 1", layerSequence: 2},
                {id: "3", name: "Layer 3"}
            ]);
        });
    });
});
