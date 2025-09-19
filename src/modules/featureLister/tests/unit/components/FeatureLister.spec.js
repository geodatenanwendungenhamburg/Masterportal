import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import FeatureListerComponent from "@modules/featureLister/components/FeatureLister.vue";
import sinon from "sinon";
import {expect} from "chai";

config.global.mocks.$t = key => key;

describe("src/modules/featureLister/components/FeatureLister.vue", () => {
    let wrapper, actions, mutations, getters, store,
        removeHighlightFeatureStub, removePointMarkerStub, removePolygonMarkerStub;

    beforeEach(() => {
        removeHighlightFeatureStub = sinon.stub();
        removePointMarkerStub = sinon.stub();
        removePolygonMarkerStub = sinon.stub();
        actions = {
            switchBackToList: sinon.stub(),
            switchToThemes: sinon.stub(),
            switchToDetails: sinon.stub()
        };
        mutations = {
            resetToThemeChooser: sinon.stub()
        };
        getters = {
            layer: () => ({name: "Layer 1"}),
            layerListView: () => "ACTIVE",
            featureListView: () => "ENABLED",
            featureDetailView: () => "DISABLED"
        };
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        FeatureLister: {
                            namespaced: true,
                            actions,
                            mutations,
                            getters,
                            state: {}
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        removeHighlightFeature: removeHighlightFeatureStub,
                        removePointMarker: removePointMarkerStub,
                        removePolygonMarker: removePolygonMarkerStub
                    }
                }
            }
        });
    });
    afterEach(() => {
        sinon.restore();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders list of visible vector layers", () => {
        store.commit("Modules/FeatureLister/setLayerListView", true);
        wrapper = shallowMount(FeatureListerComponent, {global: {plugins: [store]}});

        expect(wrapper.find("#module-feature-lister-themeChooser").exists()).to.be.true;
        expect(wrapper.find("#module-feature-lister-list").exists()).to.be.true;
        expect(wrapper.find("#module-feature-lister-details").exists()).to.be.true;
    });

    it("calls switchToThemes if Theme-Tab was clicked", async () => {
        wrapper = shallowMount(FeatureListerComponent, {global: {plugins: [store]}});

        await wrapper.find("#module-feature-lister-themeChooser a").trigger("click");
        expect(actions.switchToThemes.called).to.be.true;
    });

    it("calls switchBackToList if List-Tab was clicked", async () => {
        wrapper = shallowMount(FeatureListerComponent, {global: {plugins: [store]}});

        await wrapper.find("#module-feature-lister-list a").trigger("click");
        expect(actions.switchBackToList.called).to.be.true;
    });

    it("calls switchToDetails if Details-Tab was clicked", async () => {
        wrapper = shallowMount(FeatureListerComponent, {global: {plugins: [store]}});

        await wrapper.find("#module-feature-lister-details a").trigger("click");
        expect(actions.switchToDetails.called).to.be.true;
    });

    it("calls cleanup methods on unmount", () => {
        wrapper = shallowMount(FeatureListerComponent, {
            global: {plugins: [store]}
        });

        wrapper.unmount();
        expect(mutations.resetToThemeChooser.called).to.be.true;
        expect(removeHighlightFeatureStub.called).to.be.true;
        expect(removePointMarkerStub.called).to.be.true;
        expect(removePolygonMarkerStub.called).to.be.true;
    });
});
