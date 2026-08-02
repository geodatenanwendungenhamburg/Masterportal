import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import escapeId from "@shared/js/utils/escapeId.js";
import FolderCheckBox from "@modules/layerTree/components/FolderCheckBox.vue";


describe("src/modules/layerTree/components/FolderCheckBox.vue", () => {
    let changeVisibilitySpy,
        folder,
        propsData,
        store,
        wrapper;

    beforeEach(() => {
        folder = {
            id: "f1",
            name: "folder_1",
            type: "folder",
            isFolderSelectable: true,
            elements: [
                {
                    id: "l1",
                    name: "layer",
                    typ: "WMS",
                    type: "layer",
                    visibility: false,
                    showInLayerTree: true
                },
                {
                    id: "l2",
                    name: "layer",
                    typ: "WMS",
                    type: "layer",
                    visibility: true,
                    showInLayerTree: true
                },
                {
                    id: "f2",
                    name: "folder_2",
                    type: "folder",
                    isFolderSelectable: false,
                    elements: [
                        {
                            id: "l3",
                            name: "layer",
                            typ: "WFS",
                            type: "layer",
                            visibility: false,
                            showInLayerTree: false
                        }
                    ]
                }
            ]
        };
        propsData = {
            conf: folder
        };

        changeVisibilitySpy = sinon.spy();
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    FolderCheckBox,
                    modules: {
                        namespaced: true,
                        LayerSelection: {
                            namespaced: true,
                            actions: {
                                changeVisibility: changeVisibilitySpy
                            }
                        }
                    }
                }
            }
        });
    });


    it("renders the folder checkbox given as property to the component", () => {
        wrapper = shallowMount(FolderCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("div#folder-checkbox-container-" + escapeId(propsData.conf.id)).exists()).to.be.true;
        expect(wrapper.find("button#folder-checkbox-" + escapeId(propsData.conf.id)).exists()).to.be.true;
        expect(wrapper.find("button#folder-checkbox-" + escapeId(propsData.conf.id)).classes()).to.not.include("button-hidden");
        expect(wrapper.find("span#layer-tree-folder-checkbox-" + escapeId(propsData.conf.id)).exists()).to.be.true;
        expect(wrapper.find("span#layer-tree-folder-checkbox-" + escapeId(propsData.conf.id)).classes()).to.includes("bi-dash-square");
    });

    it("hide the folder checkbox, if the attribute 'isFolderSelectable' is false", () => {
        propsData = {
            conf: folder.elements[2]
        };
        wrapper = shallowMount(FolderCheckBox, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("div#folder-checkbox-container-" + escapeId(propsData.conf.id)).exists()).to.be.true;
        expect(wrapper.find("button#folder-checkbox-" + escapeId(propsData.conf.id)).exists()).to.be.true;
        expect(wrapper.find("button#folder-checkbox-" + escapeId(propsData.conf.id)).classes()).to.include("button-hidden");
        expect(wrapper.find("span#layer-tree-folder-checkbox-" + escapeId(propsData.conf.id)).exists()).to.be.true;
    });

    describe("checkLayerStatus", () => {
        it("should return all layer status (true, false) for folder_1", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            const layerVisibilities = wrapper.vm.checkLayerStatus(folder);

            expect(layerVisibilities).to.include(true);
            expect(layerVisibilities).to.include(false);
        });

        it("should return all layer status (false) for folder_2", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            const layerVisibilities = wrapper.vm.checkLayerStatus(folder.elements[2]);

            expect(layerVisibilities).to.not.include(true);
            expect(layerVisibilities).to.include(false);
        });
    });

    describe("currentStatus", () => {
        it("should return the current status", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            expect(wrapper.vm.currentStatus).to.equals("indeterminate");
        });
    });

    describe("folderCheckBoxIcon", () => {
        it("should return the current checkbox icon for folder", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            expect(wrapper.vm.folderCheckBoxIcon).to.equals("bi-dash-square");
        });
    });

    describe("folderCheckboxTitleKey", () => {
        it("should return the checkbox title key for folder", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            expect(wrapper.vm.folderCheckboxTitleKey).to.equals("common:modules.layerSelection.folderCheckbox.unselectedAllLayer");
        });
    });

    describe("changeCheckboxStatus", () => {
        it("should set all layer status in the given folder to visibility=false, if current status is selected", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            wrapper.vm.changeCheckboxStatus("selected");

            expect(changeVisibilitySpy.callCount).to.equals(3);
            expect(changeVisibilitySpy.firstCall.args[1]).to.be.deep.equals({layerId: folder.elements[2].elements[0].id, value: false});
            expect(changeVisibilitySpy.secondCall.args[1]).to.be.deep.equals({layerId: folder.elements[1].id, value: false});
            expect(changeVisibilitySpy.thirdCall.args[1]).to.be.deep.equals({layerId: folder.elements[0].id, value: false});
        });

        it("should set all layer status in the given folder to visibility=true, if current status is unselected", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            wrapper.vm.changeCheckboxStatus("unselected");

            expect(changeVisibilitySpy.callCount).to.equals(3);
            expect(changeVisibilitySpy.firstCall.args[1]).to.be.deep.equals({layerId: folder.elements[2].elements[0].id, value: true});
            expect(changeVisibilitySpy.secondCall.args[1]).to.be.deep.equals({layerId: folder.elements[1].id, value: true});
            expect(changeVisibilitySpy.thirdCall.args[1]).to.be.deep.equals({layerId: folder.elements[0].id, value: true});
        });

        it("should set all layer status in the given folder to visibility=false, if current status is indeterminate", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            wrapper.vm.changeCheckboxStatus("indeterminate");

            expect(changeVisibilitySpy.callCount).to.equals(3);
            expect(changeVisibilitySpy.firstCall.args[1]).to.be.deep.equals({layerId: folder.elements[2].elements[0].id, value: false});
            expect(changeVisibilitySpy.secondCall.args[1]).to.be.deep.equals({layerId: folder.elements[1].id, value: false});
            expect(changeVisibilitySpy.thirdCall.args[1]).to.be.deep.equals({layerId: folder.elements[0].id, value: false});
        });
    });

    describe("changeLayerVisibilities", () => {
        it("should set all layer status in the given folder to visibility=false", async () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            wrapper.vm.changeLayerVisibilities(folder, false);

            expect(changeVisibilitySpy.callCount).to.equals(3);
            expect(changeVisibilitySpy.firstCall.args[1]).to.be.deep.equals({layerId: folder.elements[2].elements[0].id, value: false});
            expect(changeVisibilitySpy.secondCall.args[1]).to.be.deep.equals({layerId: folder.elements[1].id, value: false});
            expect(changeVisibilitySpy.thirdCall.args[1]).to.be.deep.equals({layerId: folder.elements[0].id, value: false});
        });

        it("should set all layer status in the given folder to visibility=true", () => {
            wrapper = shallowMount(FolderCheckBox, {
                global: {
                    plugins: [store]
                },
                propsData
            });

            wrapper.vm.changeLayerVisibilities(folder, true);

            expect(changeVisibilitySpy.callCount).to.equals(3);
            expect(changeVisibilitySpy.firstCall.args[1]).to.be.deep.equals({layerId: folder.elements[2].elements[0].id, value: true});
            expect(changeVisibilitySpy.secondCall.args[1]).to.be.deep.equals({layerId: folder.elements[1].id, value: true});
            expect(changeVisibilitySpy.thirdCall.args[1]).to.be.deep.equals({layerId: folder.elements[0].id, value: true});
        });
    });
});
