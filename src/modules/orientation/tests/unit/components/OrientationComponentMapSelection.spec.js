import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import OrientationComponentMapSelection from "@modules/orientation/components/OrientationComponentMapSelection.vue";
import {useOrientationStore} from "@modules/orientation/store/orientationStore.js";

describe("src/modules/orientation/components/OrientationComponentMapSelection.vue", () => {
    let pinia,
        orientationStore,
        store,
        mapMock,
        mapViewMock,
        originalMapCollection,
        registerListener,
        unregisterListener,
        changeCurrentMouseMapInteractionsComponent,
        resetCurrentMouseMapInteractionsComponent;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);

        orientationStore = useOrientationStore();
        orientationStore.menuSide = "secondaryMenu";
        orientationStore.customPositionMarker = null;

        mapMock = {
            addOverlay: sinon.stub(),
            removeOverlay: sinon.stub()
        };
        mapViewMock = {
            getCenter: sinon.stub().returns([1, 2])
        };
        originalMapCollection = globalThis.mapCollection;
        globalThis.mapCollection = {
            getMap: sinon.stub().returns(mapMock),
            getMapView: sinon.stub().returns(mapViewMock)
        };

        registerListener = sinon.stub();
        unregisterListener = sinon.stub();
        changeCurrentMouseMapInteractionsComponent = sinon.stub();
        resetCurrentMouseMapInteractionsComponent = sinon.stub();

        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {registerListener, unregisterListener}
                },
                Menu: {
                    namespaced: true,
                    actions: {changeCurrentMouseMapInteractionsComponent, resetCurrentMouseMapInteractionsComponent}
                }
            }
        });
    });

    afterEach(() => {
        globalThis.mapCollection = originalMapCollection;
        sinon.restore();
    });

    it("claims mouse interactions, creates a marker and registers listeners on mount", () => {
        shallowMount(OrientationComponentMapSelection, {
            global: {plugins: [store, pinia]}
        });

        expect(changeCurrentMouseMapInteractionsComponent.calledOnce).to.be.true;
        expect(changeCurrentMouseMapInteractionsComponent.firstCall.args[1]).to.deep.equal({type: "orientation", side: "secondaryMenu"});
        expect(mapMock.addOverlay.calledOnce).to.be.true;
        expect(orientationStore.customPositionMarker).to.exist;
        expect(registerListener.calledTwice).to.be.true;
    });

    it("does not create a new marker if one already exists", () => {
        orientationStore.customPositionMarker = {setPosition: sinon.stub()};
        const markerBeforeMount = orientationStore.customPositionMarker;

        shallowMount(OrientationComponentMapSelection, {
            global: {plugins: [store, pinia]}
        });

        expect(mapMock.addOverlay.called).to.be.false;
        expect(orientationStore.customPositionMarker).to.equal(markerBeforeMount);
    });

    it("onMapClick moves the marker, emits position-received and unregisters listeners", () => {
        const wrapper = shallowMount(OrientationComponentMapSelection, {
            global: {plugins: [store, pinia]}
        });

        registerListener.resetHistory();
        unregisterListener.resetHistory();

        wrapper.vm.onMapClick({coordinate: [5, 6]});

        expect(wrapper.emitted("position-received")).to.deep.equal([[{position: [5, 6], mode: "customPosition"}]]);
        expect(unregisterListener.calledTwice).to.be.true;
    });

    it("beforeUnmount resets the mouse map interaction claim without recreating listeners", () => {
        const wrapper = shallowMount(OrientationComponentMapSelection, {
            global: {plugins: [store, pinia]}
        });

        wrapper.unmount();

        expect(resetCurrentMouseMapInteractionsComponent.calledOnceWith(sinon.match.any, "secondaryMenu")).to.be.true;
    });
});
