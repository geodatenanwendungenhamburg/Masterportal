import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import GeometryFilter from "@modules/filter/components/GeometryFilter.vue";
import {expect} from "chai";
import sinon from "sinon";
import Draw from "ol/interaction/Draw.js";
import {Vector as VectorLayer} from "ol/layer.js";
import Feature from "ol/Feature.js";
import {Polygon, LineString} from "ol/geom.js";
import {nextTick} from "vue";

config.global.mocks.$t = key => key;

afterEach(() => {
    sinon.restore();
});

describe("src/modules/filter/components/GeometryFilter.vue", () => {
    let wrapper = null,
        sandbox,
        store;

    const stubChangeCurrentMouseMapInteractionsComponent = sinon.stub();

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        store = createStore({
            namespaced: true,
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addInteraction: sinon.stub(),
                        removeInteraction: sinon.stub(),
                        addLayer: sinon.stub()
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        currentMouseMapInteractionsComponent: sinon.stub()
                    },
                    actions: {
                        changeCurrentMouseMapInteractionsComponent: stubChangeCurrentMouseMapInteractionsComponent
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        Filter: {
                            namespaced: true,
                            mutations: {
                                setHasMouseMapInteractions: sinon.stub()
                            },
                            getters: {
                                type: sinon.stub(),
                                menuSide: sinon.stub()
                            }
                        },
                        GetFeatureInfo: {
                            namespaced: true
                        }
                    }
                }
            }
        });
        wrapper = shallowMount(GeometryFilter, {
            global: {
                plugins: [store]
            }});
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });
        it("should render geometry filter if component is created", () => {
            expect(wrapper.find("#geometryFilter").exists()).to.be.true;
        });
        it("should set correct buttonGroup initially", () => {
            expect(wrapper.vm.selectedGroup).to.be.equal("geom");
        });
        it("should render the correct ButtonGroupLevels", async () => {
            const expectedButtonGroupLevels = [
                {name: "common:modules.filter.geometryFilter.geometries"},
                {name: "common:modules.filter.geometryFilter.regions"}
            ];

            expect(wrapper.vm.buttonGroupLevels).to.deep.equal(expectedButtonGroupLevels);
        });
        it("should render the correct geometrie buttons", async () => {
            const feature = new Feature({
                    bezirk: "Altona",
                    geometry: new Polygon([
                        [
                            [0, 0],
                            [0, 3],
                            [3, 3],
                            [3, 0],
                            [0, 0]
                        ]
                    ])
                }),
                additionalGeometries = [{
                    attrNameForTitle: "bezirk",
                    features: [feature]
                }];

            await wrapper.setProps({additionalGeometries: additionalGeometries, selectedGroup: "geom"});

            expect(wrapper.find("#Polygon").exists()).to.be.true;
            expect(wrapper.find("#Rectangle").exists()).to.be.true;
            expect(wrapper.find("#Circle").exists()).to.be.true;
            expect(wrapper.find("#LineString").exists()).to.be.true;
        });

        it("should render the button wrapper", () => {
            expect(wrapper.find(".icon-btn-wrapper").exists()).to.be.true;
        });

        it("should render buffer input", async () => {
            await wrapper.setData({isBufferInputVisible: true});

            expect(wrapper.find("#inputLineBuffer").exists()).to.be.true;
        });

        it("should first set the polygon type to the drawing interaction", async () => {
            expect(wrapper.vm.draw.type_).to.be.equal("Polygon");
        });
    });

    describe("User Interactions", () => {
        it("should set correct data initially", async () => {
            await wrapper.setData({isGeometryVisible: true});

            expect(wrapper.vm.isBufferInputVisible).to.be.false;
            expect(wrapper.vm.layer.getSource().getFeatures()).to.have.lengthOf(0);
        });
        it.skip("should set correct geometryIndex if user click on the geometry", async () => {
            await wrapper.setData({isGeometryVisible: true});

            expect(wrapper.vm.selectedGeometryIndex).to.be.equal(0);

            nextTick(() => {
                wrapper.find("#Rectangle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(1);

                wrapper.find("#Circle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(2);

                wrapper.find("#LineString").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(3);

            });
        });
        it.skip("should set the geometry index -10, if user click at the same geometry type and selected group is 'geom'", async () => {
            await wrapper.setData({isGeometryVisible: true});
            await wrapper.setData({isActive: true});
            await wrapper.setData({selectedGroup: "geom"});

            nextTick(() => {
                wrapper.find("#Rectangle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(1);

                wrapper.find("#Rectangle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(-10);

                wrapper.find("#Circle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(2);

                wrapper.find("#Circle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(-10);

                wrapper.find("#LineString").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(3);

                wrapper.find("#LineString").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(-10);
            });
        });
        it.skip("should set the geometry index -1, if user click at the same geometry type and selected group is 'addit'", async () => {
            await wrapper.setData({isGeometryVisible: true});
            await wrapper.setData({isActive: true});
            await wrapper.setData({selectedGroup: "addit"});

            nextTick(() => {
                wrapper.find("#Rectangle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(1);

                wrapper.find("#Rectangle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(-1);

                wrapper.find("#Circle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(2);

                wrapper.find("#Circle").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(-1);

                wrapper.find("#LineString").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(3);

                wrapper.find("#LineString").trigger("click");
                expect(wrapper.vm.selectedGeometryIndex).to.be.equal(-1);
            });
        });
        it.skip("should set the draw to active, if selected group is 'geom'", async () => {
            await wrapper.setData({isGeometryVisible: true});
            await wrapper.setData({isActive: true});
            await wrapper.setData({selectedGroup: "geom"});

            nextTick(() => {
                expect(wrapper.vm.draw.getActive().to.be.true);
            });
        });
        it.skip("should set the draw to inactive, if selected group is 'aadit'", async () => {
            await wrapper.setData({isGeometryVisible: true});
            await wrapper.setData({isActive: true});
            await wrapper.setData({selectedGroup: "addit"});

            nextTick(() => {
                expect(wrapper.vm.draw.getActive().to.be.false);
            });
        });
    });

    describe("methods", () => {
        describe("getGeometries", () => {
            it("should return a specific structure", () => {
                expect(wrapper.vm.getGeometries()).to.deep.equal([
                    {
                        "type": "Polygon",
                        "name": "common:modules.filter.geometryFilter.geometryTypes.polygon"
                    },
                    {
                        "type": "Rectangle",
                        "name": "common:modules.filter.geometryFilter.geometryTypes.rectangle"
                    },
                    {
                        "type": "Circle",
                        "name": "common:modules.filter.geometryFilter.geometryTypes.circle"
                    },
                    {
                        "type": "LineString",
                        "name": "common:modules.filter.geometryFilter.geometryTypes.lineString"
                    }
                ]);
            });
        });
        describe("prepareAdditionalGeometries", () => {
            it("should return an empty array", () => {
                expect(wrapper.vm.prepareAdditionalGeometries(false)).to.be.an("array").that.is.empty;
            });

            it("should return the correct name and type of the additonal geometry", () => {
                const feature = new Feature({
                        bezirk: "Altona",
                        geometry: new Polygon([
                            [
                                [0, 0],
                                [0, 3],
                                [3, 3],
                                [3, 0],
                                [0, 0]
                            ]
                        ])
                    }),
                    additionalGeometries = [{
                        attrNameForTitle: "bezirk",
                        features: [feature]
                    }],
                    results = wrapper.vm.prepareAdditionalGeometries(additionalGeometries);

                expect(results[0]).to.have.all.keys("type", "feature", "name", "innerPolygon");
            });
        });

        describe("getSelectedGeometry", () => {
            it("should return the first geometry on startup", () => {
                expect(wrapper.vm.getSelectedGeometry(0)).to.deep.equal({
                    "type": "Polygon",
                    "name": "common:modules.filter.geometryFilter.geometryTypes.polygon"
                });
            });

            it("should return the second geometry if data.selectedGeometry is set 1", () => {
                expect(wrapper.vm.getSelectedGeometry(1)).to.deep.equal({
                    "type": "Rectangle",
                    "name": "common:modules.filter.geometryFilter.geometryTypes.rectangle"
                });
            });

            it("should return the third geometry if data.selectedGeometry is set 2", () => {
                expect(wrapper.vm.getSelectedGeometry(2)).to.deep.equal({
                    "type": "Circle",
                    "name": "common:modules.filter.geometryFilter.geometryTypes.circle"
                });
            });

            it("should return the fourth geometry if data.selectedGeometry is set 3", () => {
                expect(wrapper.vm.getSelectedGeometry(3)).to.deep.equal({
                    "type": "LineString",
                    "name": "common:modules.filter.geometryFilter.geometryTypes.lineString"
                });
            });
        });

        describe("setDrawInteraction", () => {
            it("should set the draw state", () => {
                wrapper.vm.draw = false;
                wrapper.vm.setDrawInteraction("LineString");
                expect(wrapper.vm.draw).to.be.instanceOf(Draw);
            });
        });

        describe("setLayer", () => {
            it("should set the layer", () => {
                wrapper.vm.layer = false;
                wrapper.vm.setLayer();
                expect(wrapper.vm.layer).to.be.instanceOf(VectorLayer);
            });
        });

        describe("reset", () => {
            it("should set isGeometryVisible to false", () => {
                wrapper.vm.isGeometryVisible = true;
                wrapper.vm.reset();
                expect(wrapper.vm.isGeometryVisible).to.be.false;
            });
        });

        it("should set isBufferInputVisible to false", () => {
            wrapper.vm.isBufferInputVisible = true;
            wrapper.vm.reset();
            expect(wrapper.vm.isBufferInputVisible).to.be.false;
        });
        it("should return the given geometry", () => {
            wrapper.vm.reset();
            expect(wrapper.emitted()).to.have.all.keys("updateFilterGeometry", "updateGeometryFeature", "updateGeometrySelectorOptions");
        });
        it("should return the given geometry", () => {
            wrapper.vm.reset();
            expect(wrapper.emitted().updateFilterGeometry[0]).to.deep.equal([false]);
        });
        it("should return the given geometry", () => {
            wrapper.vm.reset();
            expect(wrapper.emitted().updateGeometryFeature[0]).to.deep.equal([undefined]);
        });
        it("should return the given geometry", () => {
            const expectedSelectorOptions = {
                selectedGeometry: 0,
                defaultBuffer: 20
            };

            wrapper.vm.reset();
            expect(wrapper.emitted().updateGeometrySelectorOptions[0]).to.deep.equal([expectedSelectorOptions]);
        });
    });
    describe("getGeometryOnDrawEnd", () => {
        it("should return the given geometry", () => {
            const feature = new Feature({
                    geometry: new Polygon([
                        [
                            [0, 0],
                            [0, 3],
                            [3, 3],
                            [3, 0],
                            [0, 0]
                        ]
                    ])
                }),
                geometry = wrapper.vm.getGeometryOnDrawEnd(feature, "Circle");

            expect(geometry).to.deep.equal(feature.getGeometry());
        });
        it("should return a polygon geometry if the given geometry is a LineString", () => {
            const feature = new Feature({
                    geometry: new LineString(
                        [
                            [200, 200],
                            [300, 300]
                        ]
                    )
                }),
                geometry = wrapper.vm.getGeometryOnDrawEnd(feature, "LineString", 10);

            expect(geometry.getType()).to.be.equal("Polygon");
        });
    });
    describe("update", () => {
        const feature = new Feature({
            geometry: new Polygon([
                [
                    [0, 0],
                    [0, 3],
                    [3, 3],
                    [3, 0],
                    [0, 0]
                ]
            ])
        });

        it("should return the given feature", () => {
            wrapper.vm.update(feature, "Circle", feature.getGeometry());
            expect(wrapper.vm.feature).to.deep.equal(feature);
        });
        it("should set 'isGeometryVisible' true", () => {
            wrapper.vm.update(feature, "Circle", feature.getGeometry());
            expect(wrapper.vm.isGeometryVisible).to.be.true;
        });
        it("should set 'isBufferInputVisible' true", () => {
            wrapper.vm.update(feature, "Circle", feature.getGeometry());
            expect(wrapper.vm.isBufferInputVisible).to.be.false;
        });
        it("should set 'isBufferInputVisible' false, if the given geometry type is LineString", () => {
            wrapper.vm.update(feature, "LineString", feature.getGeometry());
            expect(wrapper.vm.isBufferInputVisible).to.be.true;
        });
        it("should emit the correct events", () => {
            wrapper.vm.update(feature, "LineString", feature.getGeometry());
            expect(wrapper.emitted()).to.have.all.keys("updateFilterGeometry", "updateGeometryFeature", "updateGeometrySelectorOptions");
        });
        it("should emit the correct geometry", () => {
            wrapper.vm.update(feature, "LineString", feature.getGeometry());
            expect(wrapper.emitted().updateFilterGeometry[0]).to.deep.equal([feature.getGeometry()]);
        });
        it("should emit the correct feature", () => {
            wrapper.vm.update(feature, "LineString", feature.getGeometry());
            expect(wrapper.emitted().updateGeometryFeature[0]).to.deep.equal([feature]);
        });
        it("should emit the correct 'selectorOptions'", () => {
            const expectedSelectorOptions = {
                selectedGeometry: 0,
                defaultBuffer: 20
            };

            wrapper.vm.update(feature, "LineString", feature.getGeometry());
            expect(wrapper.emitted().updateGeometrySelectorOptions[0]).to.deep.equal([expectedSelectorOptions]);
        });
    });
});
