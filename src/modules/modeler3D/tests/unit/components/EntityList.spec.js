import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";
import Modeler3D from "@modules/modeler3D/store/indexModeler3D.js";
import {mount, config} from "@vue/test-utils";
import EntityListComponent from "@modules/modeler3D/components/ui/EntityList.vue";

config.global.mocks.$t = key => key;

describe("src/modules/modeler3D/components/EntityList.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        Modeler3D
                    }
                }
            }
        });
        mapCollection.clear();
        const entities = {
                getById: (val) => {
                    return entities.values.find(x => x.id === val);
                },
                values: [],
                add: (val) => {
                    entities.values.push(val);
                    return val;
                },
                remove: (val) => {
                    entities.values.splice(entities.values.indexOf(val), 1);
                },
                removeById: (id) => {
                    entities.remove(entities.getById(id));
                }
            },
            map = {
                id: "olcs",
                mode: "3D",
                getDataSourceDisplay: () => {
                    return {
                        defaultDataSource: {
                            entities: entities
                        }
                    };
                }
            };

        mapCollection.addMap(map, "3D");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("shows buttons for importedModel", () => {
        wrapper = mount(EntityListComponent, {
            propsData: {
                objects: [{
                    id: "id",
                    name: "name",
                    show: false
                }],
                objectsLabel: "Test",
                entity: true
            },
            global: {
                plugins: [store]
            }
        });

        const zoomToButton = wrapper.find("#list-zoomTo"),
            hideButton = wrapper.find("#list-hide"),
            deleteButton = wrapper.find("#list-delete");

        expect(zoomToButton.exists()).to.be.true;
        expect(hideButton.exists()).to.be.true;
        expect(deleteButton.exists()).to.be.true;
    });

    it("should render checkboxes", () => {
        wrapper = mount(EntityListComponent, {
            propsData: {
                objects: [{
                    id: "id",
                    name: "name",
                    show: false
                }],
                objectsLabel: "Test",
                entity: true
            },
            global: {
                plugins: [store]
            }
        });

        const checkbox = wrapper.find(".checkbox-selected-entity");

        expect(checkbox.exists()).to.be.true;
    });

    it("should not render checkboxes if enableCheckboxes is false", () => {
        wrapper = mount(EntityListComponent, {
            propsData: {
                objects: [{
                    id: "id",
                    name: "name",
                    show: false
                }],
                objectsLabel: "Test",
                entity: true,
                enableCheckboxes: false
            },
            global: {
                plugins: [store]
            }
        });

        const checkbox = wrapper.find(".checkbox-selected-entity");

        expect(checkbox.exists()).to.be.false;
    });


    it("shows buttons for hiddenObjects", () => {
        wrapper = mount(EntityListComponent, {
            propsData: {
                objects: [{
                    id: "id",
                    name: "name",
                    show: false
                }],
                objectsLabel: "Test",
                entity: true
            },
            global: {
                plugins: [store]
            }
        });

        const hideButton = wrapper.find("#list-hide");

        expect(hideButton.exists()).to.be.true;
    });

    it("changes activeObject", () => {
        store.commit("Modules/Modeler3D/setCurrentModelId", "someId");
        wrapper = mount(EntityListComponent, {
            propsData: {
                objects: [
                    {
                        id: "id",
                        name: "name",
                        show: false
                    },
                    {
                        id: "someId",
                        name: "name2",
                        show: false
                    }
                ],
                objectsLabel: "Test",
                entity: true
            },
            global: {
                plugins: [store]
            }
        });

        const buttons = wrapper.findAll("button.listButton");

        expect(buttons.at(0).classes()).to.not.include("active");
        expect(buttons.at(1).classes()).to.include("active");
    });

    it("should remove active class if active class exists", async () => {
        store.commit("Modules/Modeler3D/setCurrentModelId", "someId");
        wrapper = mount(EntityListComponent, {
            propsData: {
                objects: [
                    {
                        id: "id",
                        name: "name",
                        show: false
                    },
                    {
                        id: "someId",
                        name: "name2",
                        show: false
                    }
                ],
                objectsLabel: "Test",
                entity: true
            },
            global: {
                plugins: [store]
            }
        });

        const button = wrapper.findAll("button.listButton").at(1);

        expect(button.classes()).to.include("active");
        await button.trigger("click");
        expect(button.classes()).to.not.include("active");

    });
});
