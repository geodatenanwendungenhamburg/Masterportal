import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ObjectInformation from "../../../../components/sidebar/ObjectInformation.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/sidebar/ObjectInformation.spec.js", () => {
    let store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            getters: {
                                "ToolObjectInfo/pickedObjectId": (state) => state.ToolObjectInfo.pickedObjectId,
                                "ToolObjectInfo/modeObjectInfoActive": () => true
                            },
                            actions: {
                                getObjectDataForId: () => Promise.resolve({
                                    id: "mockObjectId",
                                    name: "Mock Object",
                                    type: "IfcWall",
                                    parent: null,
                                    propertySets: [
                                        {
                                            id: "set1",
                                            name: "PropertySet1",
                                            isActive: true,
                                            properties: [
                                                {name: "Property1", value: "Value1"}
                                            ]
                                        }
                                    ],
                                    metaModels: [
                                        {
                                            schema: "MockSchema",
                                            id: "MockModelId",
                                            createdAt: "2024-01-01",
                                            author: "MockAuthor"
                                        }
                                    ]
                                })
                            },
                            mutations: {
                                "ToolObjectInfo/setModeObjectInfoActive": (state, isActive) => {
                                    state.ToolObjectInfo.modeObjectInfoActive = isActive;
                                },
                                "ToolObjectInfo/setPickedObjectId": (state, id) => {
                                    state.ToolObjectInfo.pickedObjectId = id;
                                }
                            },
                            state: {
                                ToolObjectInfo: {
                                    pickedObjectId: "2FqgbXt9bA5fhc7u8N0XU2"
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(ObjectInformation, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        wrapper.unmount();
    });

    it("renders the base component", () => {
        expect(wrapper.find("div.ObjectInformation").exists()).to.be.true;
    });

    it("loads object information when pickedObjectId changes", async () => {
        const loadObjectInformationSpy = sinon.spy(wrapper.vm, "loadObjectInformation");

        store.commit("Modules/BimViewer/ToolObjectInfo/setPickedObjectId", "newObjectId");
        await wrapper.vm.$nextTick();

        expect(loadObjectInformationSpy.called).to.be.true;

        loadObjectInformationSpy.restore();
    });

    it("does not throw when loadObjectInformation is called with null", async () => {

        expect(() => wrapper.vm.loadObjectInformation(null)).to.not.throw();
    });

    it("sets objectData to null when loadObjectInformation is called with null", async () => {
        wrapper.vm.loadObjectInformation(null);

        expect(wrapper.vm.objectData).to.be.null;
    });

    it("generates hyperlink title correctly", () => {
        const title = wrapper.vm.generatedPsetHyperlinkTitle("http://example.com/path/to/resource");

        expect(title).to.equal("resource");
    });

    it("activates object information mode", () => {
        const commitSpy = sinon.spy(store, "commit");

        wrapper.vm.activateObjectInformation();

        expect(commitSpy.calledWith("Modules/BimViewer/ToolObjectInfo/setModeObjectInfoActive", true)).to.be.true;

        commitSpy.restore();
    });

    it("gets storey from object data", () => {
        const data = {
                type: "IfcBuildingStorey",
                name: "Mock Storey",
                parent: null
            },
            storey = wrapper.vm.getStoreyFromObjectData(data);

        expect(storey).to.equal("Mock Storey");
    });

    it("returns empty string if no storey is found in object data", () => {
        const data = {
                type: "IfcWall",
                parent: null
            },
            storey = wrapper.vm.getStoreyFromObjectData(data);

        expect(storey).to.equal("");
    });
});
