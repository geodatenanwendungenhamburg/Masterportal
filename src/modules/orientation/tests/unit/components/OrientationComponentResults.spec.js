import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import OrientationComponentResults from "@modules/orientation/components/OrientationComponentResults.vue";

describe("src/modules/orientation/components/OrientationComponentResults.vue", () => {
    let store, feature500, getFeaturesInCircle;

    beforeEach(() => {
        sinon.stub(styleList, "returnStyleObject").returns(undefined);

        feature500 = {
            getId: () => "f1",
            dist2Pos: 100,
            nearbyTitleText: [],
            styleId: "s1",
            layerName: "LayerA",
            get: key => key === "name" ? "FeatureName" : undefined
        };

        getFeaturesInCircle = sinon.stub().callsFake((layerConfigs, distance) => {
            return distance === 500 ? [feature500] : [];
        });

        store = createStore({
            getters: {
                visibleLayerConfigs: () => []
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    /**
     * Mounts the component with default props merged with the given overrides.
     * @param {Object} propsOverride Props to override.
     * @returns {Object} The mounted wrapper.
     */
    function mountComponent (propsOverride = {}) {
        return shallowMount(OrientationComponentResults, {
            props: {
                position: [0, 0],
                selectedMode: "currentPosition",
                poiDistances: [500, 1000],
                getFeaturesInCircle,
                ...propsOverride
            },
            global: {plugins: [store]}
        });
    }

    it("builds poiFeatures grouped by distance on mount and resolves the fallback title", () => {
        const wrapper = mountComponent();

        expect(wrapper.vm.poiFeatures).to.deep.equal([
            {category: 500, features: [feature500]},
            {category: 1000, features: []}
        ]);
        expect(feature500.nearbyTitleText).to.deep.equal(["FeatureName"]);
    });

    it("initializes the active category to the first one containing features", () => {
        const wrapper = mountComponent();

        expect(wrapper.vm.activeCategory).to.equal(500);
    });

    it("falls back to the first category if none contain features", () => {
        getFeaturesInCircle.callsFake(() => []);
        const wrapper = mountComponent();

        expect(wrapper.vm.activeCategory).to.equal(500);
        expect(wrapper.vm.poiFeatures.every(poi => poi.features.length === 0)).to.be.true;
    });

    it("fillImagePath sets an empty string if no style object is found", () => {
        const wrapper = mountComponent();

        expect(wrapper.vm.imgPathByFeature.f1).to.equal("");
    });

    describe("getFeatureTitle", () => {
        it("returns the existing nearbyTitleText if it is a non-empty array", () => {
            const wrapper = mountComponent();

            expect(wrapper.vm.getFeatureTitle({nearbyTitleText: ["Existing"]})).to.deep.equal(["Existing"]);
        });

        it("falls back to the layerName if no name attribute and no nearbyTitleText exist", () => {
            const wrapper = mountComponent();

            expect(wrapper.vm.getFeatureTitle({nearbyTitleText: [], layerName: "FallbackLayer", get: () => undefined})).to.deep.equal(["FallbackLayer"]);
        });
    });

    it("changedCategory updates the active category", () => {
        const wrapper = mountComponent();

        wrapper.vm.changedCategory(1000);

        expect(wrapper.vm.activeCategory).to.equal(1000);
    });

    it("zoomFeature emits feature-selected with the feature matching the clicked id in the active category", () => {
        const wrapper = mountComponent();

        wrapper.vm.zoomFeature({currentTarget: {id: "f1"}});

        expect(wrapper.emitted("feature-selected")).to.have.lengthOf(1);
        expect(wrapper.emitted("feature-selected")[0][0].getId()).to.equal("f1");
    });
});
