import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import OrientationComponent from "@modules/orientation/components/OrientationComponent.vue";
import {useOrientationStore} from "@modules/orientation/store/orientationStore.js";

describe("src/modules/orientation/components/OrientationComponent.vue", () => {
    let pinia,
        orientationStore,
        store,
        visibleLayerConfigs,
        mapMock,
        mapViewMock,
        originalMapCollection,
        zoomToCoordinates,
        zoomToExtent,
        removePointMarker,
        addSingleAlert;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);

        orientationStore = useOrientationStore();
        orientationStore.receivedPosition = null;
        orientationStore.customPositionMarker = null;
        orientationStore.currentPage = "choice";
        orientationStore.selectedMode = "";
        orientationStore.accuracyFeature = null;

        visibleLayerConfigs = [{typ: "WFS", visibility: true, id: "1"}];

        mapMock = {
            addOverlay: sinon.stub(),
            removeOverlay: sinon.stub()
        };
        mapViewMock = {
            getResolutions: sinon.stub().returns([1, 0.5, 0.2645831904584105, 0.1])
        };
        originalMapCollection = globalThis.mapCollection;
        globalThis.mapCollection = {
            getMap: sinon.stub().callsFake(() => mapMock),
            getMapView: sinon.stub().callsFake(() => mapViewMock)
        };

        zoomToCoordinates = sinon.stub();
        zoomToExtent = sinon.stub();
        removePointMarker = sinon.stub();
        addSingleAlert = sinon.stub();

        store = createStore({
            getters: {
                visibleLayerConfigs: () => visibleLayerConfigs
            },
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        projection: () => ({getCode: () => "EPSG:25832"})
                    },
                    actions: {zoomToCoordinates, zoomToExtent, removePointMarker}
                },
                Alerting: {
                    namespaced: true,
                    actions: {addSingleAlert}
                }
            }
        });
    });

    afterEach(() => {
        orientationStore.customPositionMarker = null;
        orientationStore.accuracyFeature = null;

        globalThis.mapCollection = originalMapCollection;
        sinon.restore();
    });

    /**
     * Mounts the OrientationComponent with the shared pinia and vuex store.
     * @returns {Object} The mounted wrapper.
     */
    function mountComponent () {
        return shallowMount(OrientationComponent, {
            global: {plugins: [store, pinia]}
        });
    }

    describe("hasValidVectorLayer / poiDistancesLocal", () => {
        it("is true when a visible WFS layer exists", () => {
            const wrapper = mountComponent();

            expect(wrapper.vm.hasValidVectorLayer).to.be.true;
        });

        it("is false when no visible vector layer exists", () => {
            visibleLayerConfigs = [{typ: "WMS", visibility: true, id: "1"}];
            const wrapper = mountComponent();

            expect(wrapper.vm.hasValidVectorLayer).to.be.false;
        });

        it("resolves poiDistances true to the default distance array", () => {
            orientationStore.poiDistances = true;
            const wrapper = mountComponent();

            expect(wrapper.vm.poiDistancesLocal).to.deep.equal([500, 1000, 2000]);
        });

        it("returns the configured array as-is if poiDistances is not true", () => {
            orientationStore.poiDistances = [100];
            const wrapper = mountComponent();

            expect(wrapper.vm.poiDistancesLocal).to.deep.equal([100]);
        });
    });

    describe("onModeSelected", () => {
        it("sets the selected mode and switches to the location page", () => {
            const wrapper = mountComponent();

            wrapper.vm.onModeSelected("currentPosition");

            expect(wrapper.vm.selectedMode).to.equal("currentPosition");
            expect(wrapper.vm.currentPage).to.equal("location");
        });

        it("removes an existing custom position marker when switching mode", () => {
            const wrapper = mountComponent();

            wrapper.vm.customPositionMarker = {};
            wrapper.vm.onModeSelected("customPosition");

            expect(mapMock.removeOverlay.called).to.be.true;
        });
    });

    describe("backToChoice", () => {
        it("resets the page to choice and clears the selected mode", () => {
            const wrapper = mountComponent();

            wrapper.vm.selectedMode = "currentPosition";
            wrapper.vm.currentPage = "location";

            wrapper.vm.backToChoice();

            expect(wrapper.vm.currentPage).to.equal("choice");
            expect(wrapper.vm.selectedMode).to.be.null;
        });
    });

    describe("onPositionReceived", () => {
        it("stores the received position and switches to the results page", () => {
            const wrapper = mountComponent();

            wrapper.vm.onPositionReceived({position: [1, 2], mode: "currentPosition"});

            expect(wrapper.vm.receivedPosition).to.deep.equal([1, 2]);
            expect(wrapper.vm.currentPage).to.equal("results");
        });
    });

    describe("onFeatureSelected", () => {
        /**
         * Builds a fake ol/Feature-like object with a fixed extent.
         * @returns {Object} A fake feature.
         */
        function makeFeature () {
            return {
                getGeometry: () => ({getExtent: () => [10, 20, 30, 40]})
            };
        }

        it("zooms to the feature extent using the maxZoom index matching the known resolution", () => {
            const wrapper = mountComponent();

            wrapper.vm.onFeatureSelected(makeFeature());

            expect(zoomToExtent.calledOnce).to.be.true;
            expect(zoomToExtent.firstCall.args[1]).to.deep.equal({
                extent: [10, 20, 30, 40],
                options: {maxZoom: 2}
            });
        });

        it("falls back to the resolutions length if the known resolution is not present", () => {
            mapViewMock.getResolutions.returns([1, 0.5, 0.1]);
            const wrapper = mountComponent();

            wrapper.vm.onFeatureSelected(makeFeature());

            expect(zoomToExtent.firstCall.args[1].options.maxZoom).to.equal(3);
        });

        it("re-enables the current position mode and removes the point marker", () => {
            const wrapper = mountComponent();

            wrapper.vm.currentPositionModeEnabled = false;
            wrapper.vm.onFeatureSelected(makeFeature());

            expect(wrapper.vm.currentPositionModeEnabled).to.be.true;
            expect(removePointMarker.calledOnce).to.be.true;
        });
    });

    describe("removeCustomPositionMarker", () => {
        it("removes the marker overlay and clears the store reference", () => {
            const wrapper = mountComponent();

            wrapper.vm.customPositionMarker = {};

            wrapper.vm.removeCustomPositionMarker();

            expect(mapMock.removeOverlay.called).to.be.true;
            expect(wrapper.vm.customPositionMarker).to.not.exist;
        });

        it("does nothing if there is no marker to remove", () => {
            const wrapper = mountComponent();

            wrapper.vm.removeCustomPositionMarker();

            expect(mapMock.removeOverlay.called).to.be.false;
        });
    });

    describe("beforeUnmount", () => {
        it("clears the accuracy geometry listener if an accuracy feature exists", () => {
            const wrapper = mountComponent(),
                geolocationUn = sinon.stub();

            orientationStore.accuracyFeature = {setGeometry: sinon.stub()};
            orientationStore.geolocation = {un: geolocationUn};

            wrapper.unmount();

            expect(geolocationUn.calledOnce).to.be.true;
        });

        it("removes the custom position marker even if there is no accuracy feature", () => {
            const wrapper = mountComponent();

            orientationStore.customPositionMarker = {setPosition: sinon.stub()};

            wrapper.unmount();

            expect(mapMock.removeOverlay.called).to.be.true;
        });
    });

    describe("showCustomPositionMarker watcher", () => {
        it("creates a custom position marker once the results page is showing a custom position", () => {
            const wrapper = mountComponent();

            orientationStore.receivedPosition = [1, 2];
            orientationStore.currentPage = "results";
            orientationStore.selectedMode = "customPosition";

            return wrapper.vm.$nextTick().then(() => {
                expect(mapMock.addOverlay.called).to.be.true;
                expect(wrapper.vm.customPositionMarker).to.exist;
            });
        });

        it("does not create a marker while still on the choice page", () => {
            mountComponent();

            expect(mapMock.addOverlay.called).to.be.false;
        });
    });

    describe("onAccuracyGeometryChange", () => {
        it("does not throw when invoked with an active geolocation projection", () => {
            const wrapper = mountComponent();

            expect(() => wrapper.vm.onAccuracyGeometryChange()).to.not.throw();
        });
    });
});
