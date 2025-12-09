import DrawItemAttributes from "@modules/draw_old/components/DrawItemAttributes.vue";
import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/draw/components/DrawItemAttributes.vue", () => {
    let testFeature, testLayer, wrapper;

    const store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Draw_old: {
                            namespaced: true,
                            actions: {
                                setDownloadFeatures: () => sinon.stub()
                            },
                            getters: {
                                oldStyle: () => sinon.stub()
                            }
                        }
                    }
                }
            }
        }),
        requiredProps = {
            selectedFeature: undefined,
            layer: undefined
        },
        factory = {
            getShallowMount: (props = requiredProps) => {
                return shallowMount(DrawItemAttributes, {
                    global: {plugins: [store]},
                    propsData: {
                        ...props
                    }
                });
            }
        };

    beforeEach(function () {
        testFeature = new Feature({
            isVisible: false,
            fromDrawTool: false,
            drawState: {
                drawType: {
                    id: "drawSymbol"
                }
            }
        });
        testLayer = {
            get: () => sinon.stub(),
            set: () => sinon.stub()
        };
    });

    afterEach(() => {
        sinon.restore();
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    describe("Component DOM", () => {
        it("should exists", () => {
            wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });
        it("should have a form", () => {
            const formElement = wrapper.find("form");

            wrapper = factory.getShallowMount();
            expect(formElement.exists()).to.be.true;
        });
        it("should have a form element with the id 'draw-attributes", () => {
            const formElement = wrapper.find("form");

            wrapper = factory.getShallowMount();
            expect(formElement.attributes("id")).to.equal("draw-attributes");
        });
        it("should have form element without input fields", () => {
            wrapper = factory.getShallowMount();

            expect(wrapper.findAllComponents({name: "InputText"})).to.have.lengthOf(0);
        });
        it("should have form element with 2 input fields if a feature is selected", () => {
            const props = {selectedFeature: testFeature};

            wrapper = factory.getShallowMount(props);

            expect(wrapper.findAllComponents({name: "InputText"})).to.have.lengthOf(2);
        });
        it("should have form element with 4 input fields if a feature is selected", async () => {
            const props = {selectedFeature: testFeature};

            wrapper = factory.getShallowMount(props);

            wrapper.vm.attributes = [{
                foo: "bar"
            }];
            await wrapper.vm.$nextTick();
            expect(wrapper.findAllComponents({name: "InputText"})).to.have.lengthOf(4);
        });
    });

    describe("User interaction", () => {
        it("should add attributes to feature and local attributes array", () => {
            const props = {selectedFeature: testFeature},
                expectedLocal = {key: "foo", value: "bar"},
                expected = {foo: "bar"};

            wrapper = factory.getShallowMount(props);

            wrapper.vm.attributeKey = "foo";
            wrapper.vm.attributeValue = "bar";
            wrapper.vm.addAttributesToFeature();
            expect(wrapper.vm.attributes).to.be.an("array").and.to.deep.include(expectedLocal);
            expect(testFeature.getProperties()).to.deep.include(expected);
        });
        it("should remove attributes from the feature and row in local attributes array", () => {
            testFeature.setProperties({foo: "bar", biz: "buz"});
            const props = {selectedFeature: testFeature},
                notExpected = {key: "biz", value: "buz"},
                localExpected = {key: "foo", value: "bar"},
                expected = {foo: "bar"};

            wrapper = factory.getShallowMount(props);

            wrapper.vm.removeAttribute(1);

            expect(wrapper.vm.attributes).to.be.an("array").and.to.not.include(notExpected);
            expect(wrapper.vm.attributes).to.be.an("array").and.to.deep.include(localExpected);
            expect(testFeature.getProperties()).to.deep.include(expected);
        });
        it("should update the attributes on the feature", () => {
            testFeature.setProperties({foo: "bar", biz: "buz"});
            const props = {selectedFeature: testFeature},
                expected = {foo: "bar", biz: "buz"},
                attributes = [{key: "foo", value: "bar"}, {key: "biz", value: "buz"}];

            wrapper = factory.getShallowMount(props);

            wrapper.vm.saveChanges(attributes, testFeature, testLayer);

            expect(testFeature.getProperties()).to.deep.include(expected);
        });
        it("should update the attributes from the feature", async () => {
            testFeature.setProperties({foo: "bar", biz: "buz"});
            const props = {selectedFeature: testFeature},
                localExpected = {key: "fow", value: "bar"},
                expected = {fow: "bar", biz: "buz"};

            wrapper = factory.getShallowMount(props);

            wrapper.vm.attributes[3].key = "fow";
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.attributes).to.deep.include(localExpected);
            expect(testFeature.getProperties()).to.deep.include(expected);
        });
    });
    describe("checkAttributes", () => {
        it("should return true if empty array is given", () => {
            wrapper = factory.getShallowMount();

            expect(wrapper.vm.checkAttributes([])).to.be.true;
        });
        it("should return true if valid array of objects are given", () => {
            wrapper = factory.getShallowMount();

            expect(wrapper.vm.checkAttributes([{key: "foo"}, {key: "bar"}])).to.be.true;
        });
        it("should return false if array of objects has the same keys", () => {
            wrapper = factory.getShallowMount();

            expect(wrapper.vm.checkAttributes([{key: "foo"}, {key: "foo"}])).to.be.false;
        });
    });
});
