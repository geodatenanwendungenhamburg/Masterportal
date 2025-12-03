import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import RoutingDownloadComponent from "@modules/routing/components/RoutingDownload.vue";
import mutations from "@modules/routing/store/mutationsRouting.js";
import actions from "@modules/routing/store/actionsRouting.js";
import Directions from "@modules/routing/store/directions/indexDirections.js";
import Isochrones from "@modules/routing/store/isochrones/indexIsochrones.js";
import directionsRouteStyle from "@modules/routing/js/map/directions/route/directionsRouteStyle.js";
import tsrRouteStyle from "@modules/routing/js/map/tsr/route/tsrRouteStyle.js";
import {Stroke, Style} from "ol/style.js";
import Feature from "ol/Feature.js";
import LineString from "ol/geom/LineString.js";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/RoutingDownload.vue", () => {
    let activeRoutingToolOption,
        downloadFileName,
        store,
        wrapper,
        props;

    beforeEach(() => {
        activeRoutingToolOption = "DIRECTIONS";
        downloadFileName = "";

        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing:
                        {
                            namespaced: true,
                            modules: {
                                Directions,
                                Isochrones
                            },
                            // state,
                            mutations,
                            actions,
                            getters: {
                                activeRoutingToolOption: () => activeRoutingToolOption,
                                download: () => {
                                    return {
                                        fileName: downloadFileName,
                                        format: "GEOJSON"
                                    };
                                }
                            }
                        }
                    },
                    Alerting: {
                        namespaced: true,
                        actions: {
                            addSingleAlert: sinon.stub()
                        }
                    }
                }
            }
        });

        props = {
            hideGpx: false
        };
    });

    afterEach(() => {
        sinon.restore();
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders RoutingDownloadComponent", () => {
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.find("#routing-download").exists()).to.be.true;
    });

    it("filters GPX download option", () => {
        props.hideGpx = true;
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect(wrapper.vm.downloadFormatOptions.includes("GPS")).to.be.false;
    });

    it("disables input without filename", () => {
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        wrapper.vm.download.fileName = "";
        expect(wrapper.vm.isDisabled).to.be.true;
    });

    it("enables input with filename", () => {
        downloadFileName = "testfilename";
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });

        expect(wrapper.vm.isDisabled).to.be.false;
    });

    it("returns features for 'DIRECTIONS'", () => {
        store.commit("Modules/Routing/setActiveRoutingToolOption", "DIRECTIONS");
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        expect("isHighlight" in wrapper.vm.getDownloadFeatures()[0].getProperties()).to.be.true;
    });

    it("returns features for 'ISOCHRONES'", () => {
        activeRoutingToolOption = "ISOCHRONES";
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });

        expect(wrapper.vm.getDownloadFeatures().length).equal(0);
    });

    it("converts feature to 'GEOJSON'", async () => {
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        wrapper.vm.download.format = "GEOJSON";
        wrapper.vm.transformCoordinatesLocalToWgs84Projection = (coordinates) => coordinates;
        const downloadString = await wrapper.vm.getDownloadStringInFormat([
            new Feature({
                geometry: new LineString([[8, 52], [9, 53]])
            })
        ]);

        expect(downloadString).equal("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[8,52],[9,53]]},\"properties\":null}]}");
    });

    it("converts feature to 'GPX'", async () => {
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        wrapper.vm.download.format = "GPX";
        wrapper.vm.transformCoordinatesLocalToWgs84Projection = (coordinates) => coordinates;
        const downloadString = await wrapper.vm.getDownloadStringInFormat([
            new Feature({
                geometry: new LineString([[8, 52], [9, 53]])
            })
        ]);

        expect(downloadString).equal("<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"OpenLayers\"><rte><rtept lat=\"52\" lon=\"8\"/><rtept lat=\"53\" lon=\"9\"/></rte></gpx>");
    });

    it("should add file type to file name", async () => {
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        wrapper.vm.download.format = "GEOJSON";
        wrapper.vm.download.fileName = "test";

        expect(wrapper.vm.getFileName().name).equal("test.geojson");
    });

    it("validates file names successfully", async () => {
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        const fileNames = ["test", "test_123", "test-123", "Test"];

        fileNames.forEach(fileName => expect(wrapper.vm.validateFileName(fileName).isValid).to.be.true);
    });

    it("doesn't validate file names successfully", async () => {
        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        const fileNames = ["test file", "test?", "%test#.geojson", "test_with_too_many_characters_0123456789_"];

        fileNames.forEach(fileName => expect(wrapper.vm.validateFileName(fileName).isValid).to.be.false);
        expect(wrapper.vm.validateFileName(fileNames[0]).errorMsg).to.equal("common:modules.routing.download.error.fileNameContainsWhiteSpace");
        expect(wrapper.vm.validateFileName(fileNames[1]).errorMsg).to.equal("common:modules.routing.download.error.fileNameContainsInvalidChars");
        expect(wrapper.vm.validateFileName(fileNames[2]).errorMsg).to.equal("common:modules.routing.download.error.fileNameContainsInvalidChars");
        expect(wrapper.vm.validateFileName(fileNames[3]).errorMsg).to.equal("common:modules.routing.download.error.fileNameTooLong");
    });

    it("should call convertTSRResultToCsv", async () => {
        const convertTSRResultToCsv = sinon.spy(RoutingDownloadComponent.methods, "convertTSRResultToCsv");

        wrapper = shallowMount(RoutingDownloadComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });

        wrapper.vm.download.format = "CSV";
        await wrapper.vm.getDownloadStringInFormat();

        expect(convertTSRResultToCsv.calledOnce).to.be.true;
    });
    describe("Methods", () => {
        describe("styleFeatures", () => {
            it("should return and style the features with the second style if activeRoutingToolOption is DIRECTIONS for export", async () => {
                const features = [
                    new Feature({
                        geometry: new LineString([[8, 52], [9, 53]])
                    })
                ];

                wrapper = shallowMount(RoutingDownloadComponent, {
                    global: {
                        plugins: [store]
                    },
                    props: props
                });
                sinon.stub(directionsRouteStyle, "createDirectionsRouteStyle").callsFake(function () {
                    return [
                        new Style({
                            stroke: new Stroke({
                                color: "#008000",
                                width: 5
                            })
                        }),
                        new Style({
                            stroke: new Stroke({
                                color: "#FF0000",
                                width: 1
                            })
                        })
                    ];
                });

                await expect(wrapper.vm.styleFeatures(features)[0].getStyle()).to.deep.equal(new Style({
                    stroke: new Stroke({
                        color: "#FF0000",
                        width: 1
                    })
                }));
            });
            it("should return and style the features with the first style  if activeRoutingToolOption is TSR for export", async () => {
                const features = [
                    new Feature({
                        geometry: new LineString([[8, 52], [9, 53]])
                    })
                ];

                activeRoutingToolOption = "TSR";

                wrapper = shallowMount(RoutingDownloadComponent, {
                    global: {
                        plugins: [store]
                    },
                    props: props
                });
                sinon.stub(tsrRouteStyle, "createtsrRouteStyle").callsFake(function () {
                    return [
                        new Style({
                            stroke: new Stroke({
                                color: "#008000",
                                width: 5
                            })
                        }),
                        new Style({
                            stroke: new Stroke({
                                color: "#FF0000",
                                width: 1
                            })
                        })
                    ];
                });

                await expect(wrapper.vm.styleFeatures(features)[0].getStyle()).to.deep.equal(new Style({
                    stroke: new Stroke({
                        color: "#008000",
                        width: 5
                    })
                }));
            });
        });
    });
});
