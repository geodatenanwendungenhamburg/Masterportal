import {expect} from "chai";
import {config, shallowMount, mount} from "@vue/test-utils";
import sinon from "sinon";
import {createStore} from "vuex";
import Modeler3DFilterComponent from "../../../components/Modeler3DFilter.vue";
import Modeler3D from "../../../store/indexModeler3D";
import layerCollection from "../../../../../core/layers/js/layerCollection";

config.global.mocks.$t = key => key;

describe("src/modules/tools/modeler3D/components/Modeler3DFilter.vue", () => {
    let store,
        wrapper;
    const values1 = {name: "Layer1", typ: "TileSet3D", visibility: true},
        values2 = {name: "Layer2", typ: "TileSet3D", visibility: false},
        tilesets = [
            {
                layer: {
                    values: values1,
                    tileset: Promise.resolve({
                        style: "Styling",
                        readyPromise: Promise.resolve(true)
                    })
                },
                get: (key) => {
                    return values1[key];
                }
            },
            {
                layer: {
                    values: values2,
                    tileset: Promise.resolve({
                        style: "Styling",
                        readyPromise: Promise.resolve(true)
                    })
                },
                get: (key) => {
                    return values2[key];
                }
            }
        ];

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
            },
            getters: {
                visibleSubjectDataLayerConfigs: () => [
                    {name: "Layer1", id: "1"},
                    {name: "Layer2", id: "2"}
                ]
            }
        });
        sinon.stub(global, "fetch").returns(
            Promise.resolve({
                ok: true,
                text: () => Promise.resolve(`
                <xml>
                    <dictionaryEntry>
                        <gml:description>ALKIS</gml:description>
                        <gml:name>31001_1000</gml:name>
                        <gml:name>name1</gml:name>
                    </dictionaryEntry>
                </xml>
            `)
            })
        );
        sinon.stub(layerCollection, "getLayers").returns(tilesets);

        store.commit("Modules/Modeler3D/setFilterList", []);
        store.commit("Modules/Modeler3D/setLayerList", []);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Modeler3DFilter.vue rendering", () => {
        it("should render the modal", () => {
            wrapper = mount(Modeler3DFilterComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#modeler3d-filter").exists()).to.be.true;
        });

        it("should render the layer select dropdown", () => {
            wrapper = mount(Modeler3DFilterComponent, {
                global: {
                    plugins: [store]
                }
            });

            const layerSelect = wrapper.find("#layerSelect");

            expect(layerSelect.exists()).to.be.true;
            expect(layerSelect.classes()).to.include("form-select");
        });

        it("should render the attribute select dropdown", () => {
            wrapper = mount(Modeler3DFilterComponent, {
                global: {
                    plugins: [store]
                }
            });

            const attributeSelect = wrapper.find("#attributeSelect");

            expect(attributeSelect.exists()).to.be.true;
            expect(attributeSelect.classes()).to.include("form-select");
        });

        it("should render the add filter button", () => {
            wrapper = mount(Modeler3DFilterComponent, {
                global: {
                    plugins: [store]
                }
            });

            const addFilterButton = wrapper.find("#modeler3d-addFilter");

            expect(addFilterButton.exists()).to.be.true;
            expect(addFilterButton.text()).to.equal("modules.modeler3D.filter.captions.addFilter");
        });

        it("should render the filter list section", () => {
            wrapper = mount(Modeler3DFilterComponent, {
                global: {
                    plugins: [store]
                }
            });

            const filterListSection = wrapper.find("#filter-list-section");

            expect(filterListSection.exists()).to.be.true;
        });

        it("should render the filter list items", () => {
            store.commit("Modules/Modeler3D/setFilterList", [
                {id: 0, layer: {name: "TestLayer1"}, name: "Filter1"},
                {id: 1, layer: {name: "TestLayer1"}, name: "Filter2"},
                {id: 2, layer: {name: "TestLayer2"}, name: "Filter3"},
                {id: 3, layer: {name: "TestLayer2"}, name: "Filter4"}
            ]);
            store.commit("Modules/Modeler3D/setFilterGroupOrder", ["TestLayer1", "TestLayer2"]);
            wrapper = mount(Modeler3DFilterComponent, {
                global: {
                    plugins: [store]
                }
            });

            const filterListItems = wrapper.findAll(".list-group-item");

            expect(filterListItems.length).to.equal(4);
        });
    });

    describe("Modeler3DDraw.vue methods", () => {
        beforeEach(() => {
            wrapper = shallowMount(Modeler3DFilterComponent, {
                global: {
                    plugins: [store]
                }
            });
        });

        it("should add a filter", () => {
            wrapper.setData({
                attributeValues: [{name: "attr1", color: "#000000"}],
                selectedLayer: {name: "Layer1"},
                selectedAttribute: "Attribute1"
            });
            store.commit("Modules/Modeler3D/setFilterList", []);

            wrapper.vm.addFilter();

            expect(wrapper.vm.filterList).to.have.lengthOf(1);
            expect(wrapper.vm.filterList[0]).to.include({
                name: "Attribute1",
                attribute: "Attribute1",
                pvoStyleEnabled: false
            });
            expect(wrapper.vm.filterList[0].layer.name).to.equal("Layer1");
            expect(wrapper.vm.filterList[0].values[0].color).to.equal(
                "#ffffff"
            );
            expect(wrapper.vm.newFilter).to.be.true;
            expect(wrapper.vm.pvoStyleEnabled).to.be.false;
            expect(wrapper.vm.showModal).to.be.true;
        });

        it("should edit a filter", () => {
            const filter = {
                id: 1,
                name: "Filter1",
                values: [{name: "attr1", color: "#000000"}],
                pvoStyleEnabled: true
            };

            wrapper.vm.editFilter(filter);

            expect(wrapper.vm.attributeValues).to.deep.equal(filter.values);
            expect(wrapper.vm.pvoStyleEnabled).to.equal(filter.pvoStyleEnabled);
            expect(wrapper.vm.filterName).to.equal(filter.name);
            expect(wrapper.vm.newFilter).to.be.false;
            expect(wrapper.vm.showModal).to.be.true;
            expect(wrapper.vm.currentFilterId).to.equal(1);
        });

        it("should reset style", () => {
            wrapper.setData({
                attributeValues: [{name: "attr1", color: "#000000"}]
            });

            wrapper.vm.resetStyle();

            expect(wrapper.vm.attributeValues[0].color).to.equal("#ffffff");
        });

        it("should change pvo style", () => {
            wrapper.setData({
                attributeValues: [
                    {id: 1000, name: "Gebäude A", color: "#ffffff"},
                    {id: 2000, name: "Gebäude B", color: "#ffffff"},
                    {id: 3000, name: "Gebäude C", color: "#ffffff"},
                    {id: 800, name: "Gebäude D", color: "#ffffff"},
                    {id: 12000, name: "Gebäude E", color: "#ffffff"}
                ]
            });

            wrapper.vm.pvoStyleChanged(true);

            expect(wrapper.vm.attributeValues[0].color).to.equal("#ff0000");
            expect(wrapper.vm.attributeValues[1].color).to.equal("#666666");
            expect(wrapper.vm.attributeValues[2].color).to.equal("#44ff44");
            expect(wrapper.vm.attributeValues[3].color).to.equal("#ffffff");
            expect(wrapper.vm.attributeValues[4].color).to.equal("#ffffff");
        });

        it("should copy color values", () => {
            wrapper.setData({
                attributeValues: [
                    {id: 1, name: "attr1", color: "#000000"},
                    {id: 2, name: "attr2", color: "#ffffff"}
                ]
            });
            store.commit("Modules/Modeler3D/setFilterList", [
                {id: 0, values: []}
            ]);
            store.commit("Modules/Modeler3D/setCurrentFilterId", 0);

            wrapper.vm.copyColorValues();

            expect(wrapper.vm.filterList[0].values).to.deep.equal([
                {id: 1, name: "attr1", color: "#000000"},
                {id: 2, name: "attr2", color: "#ffffff"}
            ]);
        });

        it("should apply style with recalculate", () => {
            const populateLayerStylingConfigStub = sinon.stub(
                wrapper.vm,
                "populateLayerStylingConfig"
            );

            wrapper.setData({
                filterName: "Test Filter"
            });
            store.commit("Modules/Modeler3D/setCurrentFilterId", 0);
            store.commit("Modules/Modeler3D/setFilterList", [
                {id: 0, name: "Test Filter", values: []}
            ]);

            wrapper.vm.applyStyle(true);

            store.commit("Modules/Modeler3D/setLayerList", [
                {layer: {name: "Gebäude LoD2", id: 1}, stylingConfig: []}
            ]);

            expect(populateLayerStylingConfigStub.calledOnce).to.be.true;
            expect(wrapper.vm.currentFilterId).to.equal(null);
            expect(wrapper.vm.showModal).to.be.false;
        });

        it("should apply style without recalculate", () => {
            const populateLayerStylingConfigStub = sinon.stub(
                wrapper.vm,
                "populateLayerStylingConfig"
            );

            sinon.stub(layerCollection, "getLayerById").returns({
                layer: {tileset: Promise.resolve({style: null})}
            });

            wrapper.setData({
                filterName: "Test Filter"
            });
            store.commit("Modules/Modeler3D/setCurrentFilterId", 0);
            store.commit("Modules/Modeler3D/setFilterList", [
                {id: 0, name: "Test Filter", values: []}
            ]);
            store.commit("Modules/Modeler3D/setLayerList", [
                {layer: {name: "Gebäude LoD2", id: "12884"}, stylingConfig: []}
            ]);

            wrapper.vm.applyStyle(false);

            expect(populateLayerStylingConfigStub.calledOnce).to.be.true;
            expect(wrapper.vm.currentFilterId).to.equal(null);
            expect(wrapper.vm.showModal).to.be.false;
        });

        it("should populate layer styling config when layerList exists", () => {
            store.commit("Modules/Modeler3D/setFilterList", [
                {
                    id: 0,
                    layer: {name: "Gebäude LoD2", id: 1},
                    name: "Test Filter",
                    values: [{name: "attr1", color: "#000000"}],
                    attribute: "Wertbezeichnung"
                }
            ]);
            store.commit("Modules/Modeler3D/setLayerList", [
                {layer: {name: "Gebäude LoD2", id: 1}, stylingConfig: []}
            ]);

            wrapper.vm.populateLayerStylingConfig();

            expect(wrapper.vm.layerList[0].stylingConfig).to.deep.equal([
                [
                    "${attributes['Wertbezeichnung']} === 'attr1'",
                    "color('#000000')"
                ]
            ]);
        });

        it("should populate layer styling config when layerList is empty", () => {
            store.commit("Modules/Modeler3D/setFilterList", [
                {
                    id: 0,
                    layer: {name: "Gebäude LoD2", id: 1},
                    name: "Test Filter",
                    values: [{name: "attr1", color: "#000000"}],
                    attribute: "Wertbezeichnung"
                }
            ]);
            store.commit("Modules/Modeler3D/setLayerList", []);

            wrapper.vm.populateLayerStylingConfig();

            expect(wrapper.vm.layerList[0].stylingConfig).to.deep.equal([
                [
                    "${attributes['Wertbezeichnung']} === 'attr1'",
                    "color('#000000')"
                ],
                ["true", "color('white')"]
            ]);
        });

        it("should move filter up", () => {
            const applyStyleStub = sinon.stub(wrapper.vm, "applyStyle");

            store.commit("Modules/Modeler3D/setFilterList", [
                {id: 0, layer: {name: "TestLayer1"}, name: "filter1"},
                {id: 1, layer: {name: "TestLayer1"}, name: "filter2"},
                {id: 2, layer: {name: "TestLayer1"}, name: "filter3"}
            ]);

            wrapper.vm.moveFilterUp(0);

            expect(wrapper.vm.filterList).to.deep.equal([
                {id: 1, layer: {name: "TestLayer1"}, name: "filter2"},
                {id: 0, layer: {name: "TestLayer1"}, name: "filter1"},
                {id: 2, layer: {name: "TestLayer1"}, name: "filter3"}
            ]);
            expect(applyStyleStub.calledOnce).to.be.true;
        });

        it("should move filter down", () => {
            const applyStyleStub = sinon.stub(wrapper.vm, "applyStyle");

            store.commit("Modules/Modeler3D/setFilterList", [
                {id: 0, layer: {name: "TestLayer1"}, name: "filter1"},
                {id: 1, layer: {name: "TestLayer1"}, name: "filter2"},
                {id: 2, layer: {name: "TestLayer1"}, name: "filter3"}
            ]);

            wrapper.vm.moveFilterDown(2);

            expect(wrapper.vm.filterList).to.deep.equal([
                {id: 0, layer: {name: "TestLayer1"}, name: "filter1"},
                {id: 2, layer: {name: "TestLayer1"}, name: "filter3"},
                {id: 1, layer: {name: "TestLayer1"}, name: "filter2"}
            ]);
            expect(applyStyleStub.calledOnce).to.be.true;
        });
    });
});
