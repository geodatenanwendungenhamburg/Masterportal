import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import PoiOrientationComponent from "@modules/controls/orientation/components/poi/PoiOrientation.vue";
import Feature from "ol/Feature.js";
import sinon from "sinon";


describe("src/modules/controls/orientation/components/PoiOrientation.vue", () => {
    let store,
        propsData,
        wrapper,
        returnLegendByStyleIdSpy,
        styleObj,
        setActiveCategoryStub,
        featureStyleObject;


    beforeEach(() => {
        setActiveCategoryStub = sinon.stub();

        store = createStore({
            namespaced: true,
            modules: {
                Controls: {
                    namespaced: true,
                    state: {},
                    modules: {
                        Orientation: {
                            namespaced: true,
                            getters: {
                                activeCategory: sinon.stub(),
                                position: sinon.stub()
                            },
                            mutations: {
                                setActiveCategory: setActiveCategoryStub
                            }
                        }
                    }
                }
            },
            getters: {
                visibleLayerConfigs: sinon.stub()
            }
        });

        propsData = {
            poiDistances: [
                500,
                1000,
                2000
            ],
            getFeaturesInCircle: () => {
                const feature = new Feature(),
                    featuresAll = [];

                feature.setId("first");
                feature.set("styleId", "styleId");

                featuresAll.push(feature);
                return featuresAll;
            }
        };
        styleObj = {
            styleId: "styleId",
            rules: [],
            getImage: () => {
                return {
                    getSrc: () => "src"
                };
            }
        };
        featureStyleObject = {
            styleId: "f_styleId",
            rules: [],
            attributes: {
                type: "icon"
            }
        };
        sinon.stub(styleList, "returnStyleObject").returns(styleObj);
        sinon.stub(createStyle, "createStyle").returns(styleObj);
        sinon.stub(createStyle, "getGeometryStyle").returns(featureStyleObject);
        returnLegendByStyleIdSpy = sinon.spy(createStyle, "returnLegendByStyleId");

        wrapper = shallowMount(PoiOrientationComponent,
            {
                global: {
                    plugins: [store]
                },
                propsData: propsData
            });
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    describe("Render Component", function () {
        it("renders the Poi Orientation component", () => {
            expect(wrapper.find("#surrounding_vectorfeatures").exists()).to.be.true;
            expect(wrapper.find(".modal-backdrop").exists()).to.be.true;
        });
    });

    describe("getFeatureTitle", function () {
        let feature = new Feature();

        it("should return layerName when name is unset", function () {
            feature = Object.assign(feature, {
                layerName: "LayerName"
            });
            expect(wrapper.vm.getFeatureTitle(feature)).to.be.an("array").to.deep.equal(["LayerName"]);
        });
        it("should return name when set", function () {
            feature.set("name", "Name");
            expect(wrapper.vm.getFeatureTitle(feature)).to.be.an("array").to.deep.equal(["Name"]);
        });
        it("should return nearby title text when set", function () {
            feature = Object.assign(feature, {
                nearbyTitleText: ["nearbyTitleText"]
            });
            expect(wrapper.vm.getFeatureTitle(feature)).to.be.an("array").to.deep.equal(["nearbyTitleText"]);
        });
    });


    describe("fillImagePath", function () {
        it("should fill data 'imgPathByFeature' and return image on mount.", function () {
            expect(Object.keys(wrapper.vm.imgPathByFeature).length).to.be.equals(1);
            expect(Object.keys(wrapper.vm.imgPathByFeature)[0]).to.be.equals("first");
            expect(wrapper.vm.imgPathByFeature.first).to.be.equals("src");
            expect(returnLegendByStyleIdSpy.notCalled).to.be.true;
        });

        it("should fill second entry of data 'imgPathByFeature' and call 'returnLegendByStyleId'.", function () {
            const feature = new Feature();

            feature.setId("id");
            feature.set("styleId", "styleId");
            featureStyleObject.attributes = {};
            wrapper.vm.fillImagePath(feature);

            expect(Object.keys(wrapper.vm.imgPathByFeature).length).to.be.equals(2);
            expect(Object.keys(wrapper.vm.imgPathByFeature)[1]).to.be.equals("id");
            expect(wrapper.vm.imgPathByFeature.id).not.to.be.equals("src");
            expect(returnLegendByStyleIdSpy.calledOnce).to.be.true;
        });

    });
    describe("changedCategory", function () {
        it("should call setActiveCategory with the category value", function () {
            wrapper.vm.changedCategory(500);
            expect(setActiveCategoryStub.calledWith(sinon.match.any, 500)).to.be.true;
        });
    });
});
