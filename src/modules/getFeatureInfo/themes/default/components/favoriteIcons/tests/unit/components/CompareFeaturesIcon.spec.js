import sinon from "sinon";
import {expect} from "chai";
import {config, shallowMount} from "@vue/test-utils";
import CompareFeatureIcon from "@modules/getFeatureInfo/themes/default/components/favoriteIcons/components/CompareFeatureIcon.vue";

config.global.mocks.$t = key => key;

describe("src/modules/getFeatureInfo/themes/default/components/favoriteIcons/components/CompareFeatureIcon.vue", () => {
    describe("featureIsOnCompareList = false", () => {
        let wrapper;

        beforeEach(() => {
            wrapper = shallowMount(CompareFeatureIcon, {
                propsData: {
                    feature: {
                        getId: () => "feature1",
                        getLayerId: () => "1234",
                        getTitle: () => "TestTitle",
                        getAttributesToShow: () => "TestAttributes",
                        getMappedProperties: () => "TestProperties"
                    }
                },
                computed: {
                    featureIsOnCompareList: sinon.fake.returns(false),
                    mode: sinon.fake.returns("2D"),
                    configuredModules: sinon.fake.returns([{
                        "type": "compareFeatures"
                    }]),
                    compareFeaturesType: sinon.fake.returns("compareFeatures")
                }
            });
        });
        afterEach(() => {
            sinon.restore();
        });

        it("should draw a star if the compareFeatures is configured", () => {
            expect(wrapper.find("span > i").exists()).to.be.true;
        });
        it("should render empty star button if feature is already on compare list", () => {
            expect(wrapper.find("span > i").classes("bi-star")).to.be.true;
            expect(wrapper.find("span > i").classes("bi-star-fill")).to.be.false;
            const span = wrapper.find("span");

            expect(span.attributes("title")).to.equal("modules.getFeatureInfo.favoriteIcons.compareFeatureIcon.toCompareList");
        });
    });

    describe("featureIsOnCompareList = true", () => {
        let wrapper;

        beforeEach(() => {
            wrapper = shallowMount(CompareFeatureIcon, {
                propsData: {
                    feature: {
                        getId: () => "feature1",
                        getLayerId: () => "1234",
                        getTitle: () => "TestTitle",
                        getAttributesToShow: () => "TestAttributes",
                        getMappedProperties: () => "TestProperties"
                    }
                },
                computed: {
                    featureIsOnCompareList: sinon.fake.returns(true),
                    mode: sinon.fake.returns("2D"),
                    configuredModules: sinon.fake.returns([{
                        "type": "compareFeatures"
                    }]),
                    compareFeaturesType: sinon.fake.returns("compareFeatures")
                }
            });
        });
        afterEach(() => {
            sinon.restore();
        });

        it("should render filled star button if feature is already on compare list", () => {
            expect(wrapper.find("span > i").classes("bi-star")).to.be.false;
            expect(wrapper.find("span > i").classes("bi-star-fill")).to.be.true;
            const span = wrapper.find("span");

            expect(span.attributes("title")).to.equal("modules.getFeatureInfo.favoriteIcons.compareFeatureIcon.fromCompareList");
        });
    });

});
