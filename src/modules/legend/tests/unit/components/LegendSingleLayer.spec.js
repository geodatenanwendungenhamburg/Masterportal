import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import LegendSingleLayerComponent from "@modules/legend/components/LegendSingleLayer.vue";
import Legend from "@modules/legend/store/indexLegend";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/legend/components/LegendSingleLayer.vue", () => {
    let store,
        wrapper;

    Legend.getters.sldVersion = () => {
        return "1.1.0";
    };

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Legend: Legend
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("LegendSingleLayerComponent.vue rendering", () => {
        describe("renders legend with pdf", () => {
            it("renders the legend with pdf from array with single string", () => {
                const propsData = {
                    legendObj: {
                        name: "myLayer",
                        legend: ["https://link_to_pdf.pdf"],
                        position: 1
                    }
                };

                wrapper = shallowMount(LegendSingleLayerComponent, {
                    global: {plugins: [store]},
                    propsData
                });

                expect(wrapper.find("a[href=\"https://link_to_pdf.pdf\"]").exists()).to.be.true;
            });

            it("renders the legends with pdf from array of strings", () => {
                const propsData = {
                    legendObj: {
                        name: "myLayer",
                        legend: ["https://link_to_pdf.pdf", "https://another_link_to_pdf.pdf"],
                        position: 1
                    }
                };

                wrapper = shallowMount(LegendSingleLayerComponent, {
                    global: {plugins: [store]},
                    propsData
                });

                expect(wrapper.find("a[href=\"https://link_to_pdf.pdf\"]").exists()).to.be.true;
                expect(wrapper.find("a[href=\"https://another_link_to_pdf.pdf\"]").exists()).to.be.true;
            });

            it("renders the legend with pdf from array with single object", () => {
                const propsData = {
                    legendObj: {
                        name: "myLayer",
                        legend: [{name: "foobar", graphic: "https://link_to_pdf.pdf"}],
                        position: 1
                    }
                };

                wrapper = shallowMount(LegendSingleLayerComponent, {
                    global: {plugins: [store]},
                    propsData
                });

                expect(wrapper.find("a[href=\"https://link_to_pdf.pdf\"]").exists()).to.be.true;
                expect(wrapper.find(".layer-legend-container span").text()).to.equal("foobar");
            });

            it("renders the legends with pdf from array of objects", () => {
                const propsData = {
                    legendObj: {
                        name: "myLayer",
                        legend: [
                            {name: "foobar", graphic: "https://link_to_pdf.pdf"},
                            {name: "barfoo", graphic: "https://another_link_to_pdf.pdf"}
                        ],
                        position: 1
                    }
                };

                wrapper = shallowMount(LegendSingleLayerComponent, {
                    global: {plugins: [store]},
                    propsData
                });

                expect(wrapper.find("a[href=\"https://link_to_pdf.pdf\"]").exists()).to.be.true;
                expect(wrapper.find("a[href=\"https://another_link_to_pdf.pdf\"]").exists()).to.be.true;
                expect(wrapper.findAll(".layer-legend-container span")[0].text()).to.equal("foobar");
                expect(wrapper.findAll(".layer-legend-container span")[1].text()).to.equal("barfoo");
            });
        });
    });

    describe("renders legend with img", () => {
        it("renders the legend with img from array with single string", () => {
            const propsData = {
                legendObj: {
                    name: "myLayer",
                    legend: ["some_string_interpreted_as_image"],
                    position: 1
                }
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.find("img[src=\"some_string_interpreted_as_image\"]").exists()).to.be.true;
        });

        it("renders the legends with img from array of strings", () => {
            const propsData = {
                legendObj: {
                    name: "myLayer",
                    legend: ["some_string_interpreted_as_image", "another_string_interpreted_as_image"],
                    position: 1
                }
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.find("img[src=\"some_string_interpreted_as_image\"]").exists()).to.be.true;
            expect(wrapper.find("img[src=\"another_string_interpreted_as_image\"]").exists()).to.be.true;
        });

        it("renders the legend with img from array with single object", () => {
            const propsData = {
                legendObj: {
                    name: "myLayer",
                    legend: [{name: "foobar", graphic: "some_string_interpreted_as_image"}],
                    position: 1
                }
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.find("img[src=\"some_string_interpreted_as_image\"]").exists()).to.be.true;
            expect(wrapper.find(".layer-legend-container span").text()).to.equal("foobar");
        });

        it("renders the legends with img from array of objects", () => {
            const propsData = {
                legendObj: {
                    name: "myLayer",
                    legend: [
                        {name: "foobar", graphic: "some_string_interpreted_as_image"},
                        {name: "barfoo", graphic: "another_string_interpreted_as_image"}
                    ],
                    position: 1
                }
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.find("img[src=\"some_string_interpreted_as_image\"]").exists()).to.be.true;
            expect(wrapper.findAll(".layer-legend-container span")[0].text()).to.equal("foobar");
            expect(wrapper.find("img[src=\"another_string_interpreted_as_image\"]").exists()).to.be.true;
            expect(wrapper.findAll(".layer-legend-container span")[1].text()).to.equal("barfoo");
        });

        it("renders the legend with img with sldVersion request", () => {
            const propsData = {
                id: "legend_myLayer",
                legendObj: {
                    name: "myLayer",
                    legend: ["some_request_for_an_image?REQUEST=GetLegendGraphic"],
                    position: 1
                }
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });
            expect(wrapper.find("#legend_myLayer img").exists()).to.be.true;
            expect(wrapper.find("#legend_myLayer img").attributes().src).to.include("&sld_version=1.1.0");
        });
    });

    describe("renders legend with svg", () => {
        it("renders the legend with svg from array with single object", () => {
            const propsData = {
                legendObj: {
                    name: "myLayer",
                    legend: [{
                        name: "foobar",
                        graphic: "data:image/svg+xml;charset=utf-8," +
                            "<svg height='35' width='35' version='1.1' xmlns='http://www.w3.org/2000/svg'>" +
                            "<polygon points='5,5 30,5 30,30 5,30' style='fill:rgba(255,0,0);fill-opacity:0;stroke:rgba(0,0,255);stroke-opacity:0;stroke-width:1;'/>" +
                            "</svg>"
                    }],
                    position: 1
                }
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.find("img").exists()).to.be.true;
            expect(wrapper.find(".layer-legend-container span").text()).to.equal("foobar");
        });

        it("renders the legends with svg from array of objects", () => {
            const svg = "data:image/svg+xml;charset=utf-8," +
                "<svg height='35' width='35' version='1.1' xmlns='http://www.w3.org/2000/svg'>" +
                "<polygon points='5,5 30,5 30,30 5,30' style='fill:rgba(255,0,0);fill-opacity:0;stroke:rgba(0,0,255);stroke-opacity:0;stroke-width:1;'/>" +
                "</svg>",

                propsData = {
                    legendObj: {
                        name: "myLayer",
                        legend: [
                            {name: "foobar", graphic: svg},
                            {name: "barfoo", graphic: svg}
                        ],
                        position: 1
                    }
                };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.find("img").exists()).to.be.true;
            expect(wrapper.findAll(".layer-legend-container span")[0].text()).to.equal("foobar");
            expect(wrapper.findAll(".layer-legend-container span")[1].text()).to.equal("barfoo");
        });

        it("renders the legends with graphic is an array", () => {
            const propsData = {
                legendObj: {
                    name: "myLayer",
                    legend: [{
                        name: "foobar",
                        graphic: ["some_string_interpreted_as_image1", "some_string_interpreted_as_image2"],
                        iconSize: ["60", "60"],
                        iconSizeDifferenz: "10"
                    }],
                    position: 1
                }
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.find("img.first-image").exists()).to.be.true;
            expect(wrapper.find("img.first-image").attributes().src).to.equal("some_string_interpreted_as_image2");
            expect(wrapper.find("img.first-image").attributes().style).to.equal("width: 60px; height: 60px; margin: 10px;");
            expect(wrapper.find(".layer-legend-container span").text()).to.equal("foobar");
            expect(wrapper.find("img.second-image").exists()).to.be.true;
            expect(wrapper.find("img.second-image").attributes().src).to.equal("some_string_interpreted_as_image1");
        });
    });

    describe("filteredLegend", () => {
        it("returns an empty array if legendObj or legendObj.legend is undefined", () => {
            const propsData = {legendObj: undefined};

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.vm.filteredLegend).to.deep.equal([]);
        });

        it("returns all legend entries if selectedLayer is null and legend is not grouped", () => {
            const propsData = {
                legendObj: {legend: ["legend1", "legend2"]},
                selectedLayer: null
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.vm.filteredLegend).to.deep.equal(["legend1", "legend2"]);
        });

        it("returns the legend entry for the selected layer index when legend is not grouped", () => {
            const propsData = {
                legendObj: {legend: ["legend1", "legend2", "legend3"]},
                selectedLayer: 1
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.vm.filteredLegend).to.deep.equal(["legend2"]);
        });

        it("returns an empty array if selectedLayer index is out of bounds and legend is not grouped", () => {
            const propsData = {
                legendObj: {legend: ["legend1", "legend2"]},
                selectedLayer: 5
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.vm.filteredLegend).to.deep.equal([]);
        });

        it("returns a flattened legend array if selectedLayer is null and legend is grouped", () => {
            const propsData = {
                legendObj: {
                    legend: [
                        [
                            {graphic: "https://example.com/group1-legend1.png", name: "Group 1 - Legend 1"},
                            {graphic: "https://example.com/group1-legend2.png", name: "Group 1 - Legend 2"}
                        ],
                        [
                            {graphic: "https://example.com/group2-legend1.png", name: "Group 2 - Legend 1"},
                            {graphic: "https://example.com/group2-legend2.png", name: "Group 2 - Legend 2"}
                        ],
                        [
                            "https://example.com/group3-legend1.png"
                        ]
                    ]
                },
                selectedLayer: null
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.vm.filteredLegend).to.deep.equal([
                {graphic: "https://example.com/group1-legend1.png", name: "Group 1 - Legend 1"},
                {graphic: "https://example.com/group1-legend2.png", name: "Group 1 - Legend 2"},
                {graphic: "https://example.com/group2-legend1.png", name: "Group 2 - Legend 1"},
                {graphic: "https://example.com/group2-legend2.png", name: "Group 2 - Legend 2"},
                "https://example.com/group3-legend1.png"
            ]);
        });

        it("returns legends for the specified group index when legend is grouped", () => {
            const propsData = {
                legendObj: {
                    legend: [
                        [
                            {graphic: "https://example.com/group1-legend1.png", name: "Group 1 - Legend 1"},
                            {graphic: "https://example.com/group1-legend2.png", name: "Group 1 - Legend 2"}
                        ],
                        [
                            {graphic: "https://example.com/group2-legend1.png", name: "Group 2 - Legend 1"},
                            {graphic: "https://example.com/group2-legend2.png", name: "Group 2 - Legend 2"}
                        ],
                        [
                            "https://example.com/group3-legend1.png"
                        ]
                    ]
                },
                selectedLayer: 1
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.vm.filteredLegend).to.deep.equal([
                {graphic: "https://example.com/group2-legend1.png", name: "Group 2 - Legend 1"},
                {graphic: "https://example.com/group2-legend2.png", name: "Group 2 - Legend 2"}
            ]);
        });

        it("returns an empty array if selectedLayer index is out of bounds and legend is grouped", () => {
            const propsData = {
                legendObj: {
                    legend: [
                        ["group1-legend1", "group1-legend2"],
                        ["group2-legend1", "group2-legend2"]
                    ]
                },
                selectedLayer: 5
            };

            wrapper = shallowMount(LegendSingleLayerComponent, {
                global: {plugins: [store]},
                propsData
            });

            expect(wrapper.vm.filteredLegend).to.deep.equal([]);
        });
    });
});
