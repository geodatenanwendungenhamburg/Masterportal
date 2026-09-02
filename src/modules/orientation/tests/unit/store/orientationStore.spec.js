import {expect} from "chai";
import {createPinia, setActivePinia} from "pinia";
import {useOrientationStore} from "@modules/orientation/store/orientationStore.js";

describe("src/modules/orientation/store/orientationStore.js", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("initializes with the expected default state", () => {
        const orientationStore = useOrientationStore();

        expect(orientationStore.type).to.equal("orientation");
        expect(orientationStore.name).to.equal("common:modules.orientation.name");
        expect(orientationStore.icon).to.equal("bi-geo-alt");
        expect(orientationStore.supportedDevices).to.deep.equal(["Desktop", "Mobile"]);
        expect(orientationStore.supportedMapModes).to.deep.equal(["2D", "3D"]);
        expect(orientationStore.zoomMode).to.equal("once");
        expect(orientationStore.geolocation).to.be.null;
        expect(orientationStore.poiDistances).to.deep.equal([]);
        expect(orientationStore.onlyFilteredFeatures).to.be.false;
        expect(orientationStore.currentPage).to.equal("choice");
        expect(orientationStore.selectedMode).to.be.null;
        expect(orientationStore.receivedPosition).to.be.null;
        expect(orientationStore.accuracyFeature).to.be.null;
        expect(orientationStore.accuracyLayer).to.be.null;
        expect(orientationStore.currentPositionModeEnabled).to.be.true;
        expect(orientationStore.showAccuracy).to.be.false;
        expect(orientationStore.showDirection).to.be.false;
        expect(orientationStore.hasMouseMapInteractions).to.be.true;
        expect(orientationStore.customPositionMarker).to.be.null;
        expect(orientationStore.menuSide).to.equal("secondaryMenu");
    });

    it("does not carry over state from a previous pinia instance", () => {
        const firstStore = useOrientationStore();

        firstStore.currentPage = "results";
        firstStore.selectedMode = "customPosition";

        setActivePinia(createPinia());
        const secondStore = useOrientationStore();

        expect(secondStore.currentPage).to.equal("choice");
        expect(secondStore.selectedMode).to.be.null;
    });

    it("updates multiple state properties at once via $patch", () => {
        const orientationStore = useOrientationStore();

        orientationStore.$patch({
            currentPage: "location",
            selectedMode: "currentPosition",
            showAccuracy: true
        });

        expect(orientationStore.currentPage).to.equal("location");
        expect(orientationStore.selectedMode).to.equal("currentPosition");
        expect(orientationStore.showAccuracy).to.be.true;
    });
});
