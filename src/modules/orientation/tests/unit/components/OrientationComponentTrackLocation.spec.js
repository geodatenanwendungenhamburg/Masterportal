import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import OrientationComponentTrackLocation from "@modules/orientation/components/OrientationComponentTrackLocation.vue";
import {useOrientationStore} from "@modules/orientation/store/orientationStore.js";

describe("src/modules/orientation/components/OrientationComponentTrackLocation.vue", () => {
    let pinia,
        orientationStore,
        store,
        mapMock,
        originalMapCollection,
        zoomToCoordinates,
        addSingleAlert,
        resetCurrentMouseMapInteractionsComponent,
        wrappers;

    beforeEach(() => {
        wrappers = [];
        pinia = createPinia();
        setActivePinia(pinia);

        orientationStore = useOrientationStore();
        orientationStore.geolocation = null;
        orientationStore.iconGeolocationMarker = "bi-circle-fill";
        orientationStore.iconDirectionArrow = "bi-triangle-fill";
        orientationStore.iFrameGeolocationEnabled = true;
        orientationStore.showAccuracy = false;
        orientationStore.showDirection = false;
        orientationStore.zoomMode = "once";
        orientationStore.menuSide = "secondaryMenu";

        mapMock = {
            addOverlay: sinon.stub(),
            addLayer: sinon.stub()
        };
        originalMapCollection = globalThis.mapCollection;
        globalThis.mapCollection = {
            getMap: sinon.stub().returns(mapMock)
        };

        zoomToCoordinates = sinon.stub();
        addSingleAlert = sinon.stub();
        resetCurrentMouseMapInteractionsComponent = sinon.stub();

        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        projection: () => ({getCode: () => "EPSG:4326"})
                    },
                    actions: {zoomToCoordinates, removePointMarker: sinon.stub()}
                },
                Alerting: {
                    namespaced: true,
                    actions: {addSingleAlert}
                },
                Menu: {
                    namespaced: true,
                    actions: {resetCurrentMouseMapInteractionsComponent}
                }
            }
        });
    });

    afterEach(() => {
        wrappers.forEach(wrapper => wrapper.unmount());
        globalThis.mapCollection = originalMapCollection;
        sinon.restore();
    });

    /**
     * Mounts the component with the given poiMode and shared stores.
     * @param {String} poiMode The location mode prop.
     * @returns {Object} The mounted wrapper.
     */
    function mountComponent (poiMode = "customPosition") {
        const wrapper = shallowMount(OrientationComponentTrackLocation, {
            props: {poiMode},
            global: {plugins: [store, pinia]}
        });

        wrappers.push(wrapper);
        return wrapper;
    }

    describe("setIsGeoLocationPossible", () => {
        it("detects geolocation as possible on localhost test environment", () => {
            const wrapper = mountComponent();

            expect(wrapper.vm.isGeoLocationPossible).to.be.true;
        });
    });

    describe("canStartTracking", () => {
        it("returns true when not denied and iframe geolocation is allowed", () => {
            const wrapper = mountComponent();

            expect(wrapper.vm.canStartTracking()).to.be.true;
        });

        it("returns false and triggers onError if geolocation was already denied", () => {
            const wrapper = mountComponent();

            wrapper.vm.isGeolocationDenied = true;

            expect(wrapper.vm.canStartTracking()).to.be.false;
            expect(addSingleAlert.calledOnce).to.be.true;
        });
    });

    describe("ensureGeolocationInstance", () => {
        it("creates and stores a new geolocation instance if none exists yet", () => {
            const wrapper = mountComponent();

            const geolocation = wrapper.vm.ensureGeolocationInstance();

            expect(geolocation).to.exist;
            expect(orientationStore.geolocation).to.equal(geolocation);
        });

        it("returns the existing geolocation instance without creating a new one", () => {
            orientationStore.geolocation = {existing: true};
            const existingGeolocationInStore = orientationStore.geolocation;
            const wrapper = mountComponent();

            expect(wrapper.vm.ensureGeolocationInstance()).to.equal(existingGeolocationInStore);
        });
    });

    describe("bindGeolocationListeners / unbindGeolocationListeners", () => {
        it("binds change and error listeners, and the accuracy listener when enabled", () => {
            orientationStore.showAccuracy = true;
            const wrapper = mountComponent(),
                geolocation = {on: sinon.stub(), un: sinon.stub()};

            wrapper.vm.bindGeolocationListeners(geolocation);

            expect(geolocation.on.calledWith("change", wrapper.vm.positioning)).to.be.true;
            expect(geolocation.on.calledWith("error", wrapper.vm.onError)).to.be.true;
            expect(geolocation.on.calledWith("change:accuracyGeometry", wrapper.vm.onAccuracyGeometryChange)).to.be.true;
        });

        it("does not bind the accuracy listener when showAccuracy is disabled", () => {
            const wrapper = mountComponent(),
                geolocation = {on: sinon.stub(), un: sinon.stub()};

            wrapper.vm.bindGeolocationListeners(geolocation);

            expect(geolocation.on.calledWith("change:accuracyGeometry")).to.be.false;
        });

        it("unbindGeolocationListeners removes all three listeners", () => {
            const wrapper = mountComponent(),
                geolocation = {on: sinon.stub(), un: sinon.stub()};

            wrapper.vm.unbindGeolocationListeners(geolocation);

            expect(geolocation.un.calledThrice).to.be.true;
        });
    });

    describe("showMarkerOverlay", () => {
        it("adds the marker overlay and initializes the accuracy layer when enabled", () => {
            orientationStore.showAccuracy = true;
            orientationStore.geolocation = {getAccuracyGeometry: sinon.stub().returns(null)};
            const wrapper = mountComponent();

            wrapper.vm.showMarkerOverlay();

            expect(mapMock.addOverlay.calledOnceWith(wrapper.vm.marker)).to.be.true;
            expect(mapMock.addLayer.calledOnce).to.be.true;
            expect(wrapper.vm.accuracyLayer).to.exist;
        });

        it("only adds the marker overlay without an accuracy layer when disabled", () => {
            const wrapper = mountComponent();

            wrapper.vm.showMarkerOverlay();

            expect(mapMock.addOverlay.calledOnce).to.be.true;
            expect(mapMock.addLayer.called).to.be.false;
            expect(wrapper.vm.accuracyLayer).to.be.null;
        });
    });

    describe("startTrackingSession / stopTrackingSession", () => {
        it("starts tracking and triggers positioning if a position is already available", () => {
            const wrapper = mountComponent(),
                geolocation = {
                    setTracking: sinon.stub(),
                    getPosition: sinon.stub().returns([1, 2]),
                    getHeading: sinon.stub().returns(0.5)
                };

            sinon.stub(wrapper.vm, "positioning");

            wrapper.vm.startTrackingSession(geolocation);

            expect(geolocation.setTracking.calledOnceWith(true)).to.be.true;
            expect(wrapper.vm.tracking).to.be.true;
            expect(wrapper.vm.positioning.calledOnce).to.be.true;
        });

        it("does not trigger positioning if no position is available yet", () => {
            const wrapper = mountComponent(),
                geolocation = {
                    setTracking: sinon.stub(),
                    getPosition: sinon.stub().returns(null)
                };

            sinon.stub(wrapper.vm, "positioning");

            wrapper.vm.startTrackingSession(geolocation);

            expect(wrapper.vm.positioning.called).to.be.false;
        });

        it("stopTrackingSession stops tracking and resets heading/previousPosition", () => {
            const wrapper = mountComponent(),
                geolocation = {setTracking: sinon.stub(), un: sinon.stub()};

            wrapper.vm.heading = 1.2;
            wrapper.vm.previousPosition = [1, 2];

            wrapper.vm.stopTrackingSession(geolocation);

            expect(geolocation.setTracking.calledOnceWith(false)).to.be.true;
            expect(wrapper.vm.heading).to.be.null;
            expect(wrapper.vm.previousPosition).to.be.null;
        });
    });

    describe("onError", () => {
        it("sends an alert, marks geolocation as denied and emits error", () => {
            const wrapper = mountComponent();

            wrapper.vm.onError();

            expect(addSingleAlert.calledOnce).to.be.true;
            expect(wrapper.vm.isGeolocationDenied).to.be.true;
            expect(wrapper.emitted("error")).to.have.lengthOf(1);
        });
    });

    describe("positionMarker", () => {
        it("sets the marker position without throwing", () => {
            const wrapper = mountComponent();

            expect(() => wrapper.vm.positionMarker([1, 2])).to.not.throw();
            expect(wrapper.vm.marker.getPosition()).to.deep.equal([1, 2]);
        });

        it("catches errors thrown by the overlay and logs them instead of crashing", () => {
            const wrapper = mountComponent(),
                consoleErrorStub = sinon.stub(console, "error");

            sinon.stub(wrapper.vm.marker, "setPosition").throws(new Error("boom"));

            expect(() => wrapper.vm.positionMarker([1, 2])).to.not.throw();
            expect(consoleErrorStub.calledOnce).to.be.true;
        });
    });

    describe("zoomAndCenter", () => {
        it("dispatches zoomToCoordinates with the given position", () => {
            const wrapper = mountComponent();

            wrapper.vm.zoomAndCenter([5, 6]);

            expect(zoomToCoordinates.calledOnce).to.be.true;
            expect(zoomToCoordinates.firstCall.args[1]).to.deep.equal({center: [5, 6], zoom: 6});
        });
    });

    describe("positioning", () => {
        it("stores the transformed position, zooms once on the first geolocation and emits position-received", () => {
            const wrapper = mountComponent();

            orientationStore.geolocation = {
                getPosition: sinon.stub().returns([9.99, 53.55]),
                getHeading: sinon.stub().returns(1.0)
            };

            wrapper.vm.positioning();

            expect(orientationStore.receivedPosition).to.exist;
            expect(zoomToCoordinates.calledOnce).to.be.true;
            expect(wrapper.vm.firstGeolocation).to.be.false;
            expect(wrapper.emitted("position-received")).to.have.lengthOf(1);
            expect(wrapper.emitted("position-received")[0][0].mode).to.equal("currentPosition");
        });

        it("does not zoom again on subsequent updates once zoomMode is 'once'", () => {
            const wrapper = mountComponent();

            orientationStore.geolocation = {
                getPosition: sinon.stub().returns([9.99, 53.55]),
                getHeading: sinon.stub().returns(1.0)
            };

            wrapper.vm.positioning();
            zoomToCoordinates.resetHistory();
            wrapper.vm.positioning();

            expect(zoomToCoordinates.called).to.be.false;
        });
    });
});
