import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import sinon from "sinon";

import DrawEditAttributesComponent from "@shared/modules/draw/components/DrawEditAttributes.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/draw/components/DrawEditAttributes.vue", () => {
    let layer,
        wrapper;

    beforeEach(() => {
        layer = new VectorLayer({source: new VectorSource()});

        mapCollection.clear();
        mapCollection.addMap({
            id: "ol",
            mode: "2D",
            on: sinon.stub(),
            un: sinon.stub(),
            forEachFeatureAtPixel: sinon.stub()
        }, "2D");
    });

    afterEach(() => {
        wrapper?.unmount();
        sinon.restore();
        mapCollection.clear();
    });

    describe("onFeatureClick", () => {
        it("should set selectedFeature and load attributes from feature properties", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });

            const feature = new Feature();

            feature.set("name", "Test");
            feature.set("value", "42");

            wrapper.vm.onFeatureClick(feature);

            expect(wrapper.vm.selectedFeature).to.not.be.null;
            expect(wrapper.vm.selectedFeature.get("name")).to.equal("Test");
            expect(wrapper.vm.attributes.length).to.equal(2);
            expect(wrapper.vm.attributes[0].key).to.equal("name");
            expect(wrapper.vm.attributes[0].value).to.equal("Test");
            expect(wrapper.vm.attributes[1].key).to.equal("value");
            expect(wrapper.vm.attributes[1].value).to.equal("42");
        });

        it("should filter out EXCLUDED_KEYS from attributes", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });

            const feature = new Feature();

            feature.set("name", "Test");
            feature.set("drawType", "should be excluded");
            feature.set("textContent", "should be excluded");
            feature.set("textFont", "should be excluded");

            wrapper.vm.onFeatureClick(feature);

            expect(wrapper.vm.attributes.every(a => a.key === "name")).to.be.true;
            expect(wrapper.vm.attributes.length).to.equal(1);
        });

        it("should reset newKey, newValue and newKeyError", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });

            wrapper.vm.newKey = "old";
            wrapper.vm.newValue = "old";
            wrapper.vm.newKeyError = "error";

            wrapper.vm.onFeatureClick(new Feature());

            expect(wrapper.vm.newKey).to.equal("");
            expect(wrapper.vm.newValue).to.equal("");
            expect(wrapper.vm.newKeyError).to.equal("");
        });
    });

    describe("addAttribute", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });
            wrapper.vm.selectedFeature = new Feature();
        });

        it("should add a new attribute and set it on the feature", () => {
            wrapper.vm.newKey = "city";
            wrapper.vm.newValue = "Hamburg";

            wrapper.vm.addAttribute();

            expect(wrapper.vm.attributes.length).to.equal(1);
            expect(wrapper.vm.attributes[0].key).to.equal("city");
            expect(wrapper.vm.attributes[0].value).to.equal("Hamburg");
            expect(wrapper.vm.selectedFeature.get("city")).to.equal("Hamburg");
        });

        it("should set newKeyError if key is empty", () => {
            wrapper.vm.newKey = "";
            wrapper.vm.newValue = "Hamburg";

            wrapper.vm.addAttribute();

            expect(wrapper.vm.newKeyError).to.not.equal("");
            expect(wrapper.vm.attributes.length).to.equal(0);
        });

        it("should set newKeyError if key already exists", () => {
            wrapper.vm.attributes = [{key: "city", originalKey: "city", value: "Berlin"}];
            wrapper.vm.newKey = "city";
            wrapper.vm.newValue = "Hamburg";

            wrapper.vm.addAttribute();

            expect(wrapper.vm.newKeyError).to.not.equal("");
            expect(wrapper.vm.attributes.length).to.equal(1);
        });

        it("should set newValueError if value is empty", () => {
            wrapper.vm.newKey = "city";
            wrapper.vm.newValue = "";

            wrapper.vm.addAttribute();

            expect(wrapper.vm.newValueError).to.not.equal("");
            expect(wrapper.vm.attributes.length).to.equal(0);
        });

        it("should reset newKey and newValue after successful add", () => {
            wrapper.vm.newKey = "city";
            wrapper.vm.newValue = "Hamburg";

            wrapper.vm.addAttribute();

            expect(wrapper.vm.newKey).to.equal("");
            expect(wrapper.vm.newValue).to.equal("");
        });
    });

    describe("removeAttribute", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });
            wrapper.vm.selectedFeature = new Feature();
            wrapper.vm.selectedFeature.set("city", "Hamburg");
            wrapper.vm.attributes = [{key: "city", originalKey: "city", value: "Hamburg"}];
        });

        it("should remove attribute from list", () => {
            wrapper.vm.removeAttribute(0);

            expect(wrapper.vm.attributes.length).to.equal(0);
        });

        it("should unset the key on the feature", () => {
            wrapper.vm.removeAttribute(0);

            expect(wrapper.vm.selectedFeature.get("city")).to.be.undefined;
        });

        it("should do nothing if idx is out of bounds", () => {
            wrapper.vm.removeAttribute(5);

            expect(wrapper.vm.attributes.length).to.equal(1);
        });
    });

    describe("saveKeyChange", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });
            wrapper.vm.selectedFeature = new Feature();
            wrapper.vm.selectedFeature.set("oldKey", "value");
            wrapper.vm.attributes = [{key: "oldKey", originalKey: "oldKey", value: "value"}];
        });

        it("should rename key on feature and update originalKey", () => {
            wrapper.vm.attributes[0].key = "newKey";
            wrapper.vm.saveKeyChange(0);

            expect(wrapper.vm.selectedFeature.get("oldKey")).to.be.undefined;
            expect(wrapper.vm.selectedFeature.get("newKey")).to.equal("value");
            expect(wrapper.vm.attributes[0].originalKey).to.equal("newKey");
        });

        it("should do nothing if key is unchanged", () => {
            wrapper.vm.saveKeyChange(0);

            expect(wrapper.vm.selectedFeature.get("oldKey")).to.equal("value");
        });
    });

    describe("saveValueChange", () => {
        it("should update the value on the feature", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });
            wrapper.vm.selectedFeature = new Feature();
            wrapper.vm.attributes = [{key: "city", originalKey: "city", value: "Hamburg"}];

            wrapper.vm.saveValueChange(0);

            expect(wrapper.vm.selectedFeature.get("city")).to.equal("Hamburg");
        });
    });

    describe("checkAttributes", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });
        });

        it("should return true and set all keys valid if no duplicates or empty keys", () => {
            wrapper.vm.attributes = [
                {key: "name", originalKey: "name", value: "A"},
                {key: "city", originalKey: "city", value: "B"}
            ];

            const result = wrapper.vm.checkAttributes();

            expect(result).to.be.true;
            expect(wrapper.vm.validKeys.name.valid).to.be.true;
            expect(wrapper.vm.validKeys.city.valid).to.be.true;
        });

        it("should return false and mark duplicate keys as invalid", () => {
            wrapper.vm.attributes = [
                {key: "name", originalKey: "name", value: "A"},
                {key: "name", originalKey: "name", value: "B"}
            ];

            const result = wrapper.vm.checkAttributes();

            expect(result).to.be.false;
            expect(wrapper.vm.validKeys.name.valid).to.be.false;
        });

        it("should return false and mark empty keys as invalid", () => {
            wrapper.vm.attributes = [
                {key: "", originalKey: "", value: "A"}
            ];

            const result = wrapper.vm.checkAttributes();

            expect(result).to.be.false;
        });
    });

    describe("getValidKeyState", () => {
        it("should return {valid: true} for unknown index", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });

            const state = wrapper.vm.getValidKeyState(99);

            expect(state.valid).to.be.true;
        });

        it("should return the validation state for a known key", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });
            wrapper.vm.attributes = [{key: "city", originalKey: "city", value: "Hamburg"}];
            wrapper.vm.validKeys = {city: {valid: false, message: "error"}};

            const state = wrapper.vm.getValidKeyState(0);

            expect(state.valid).to.be.false;
            expect(state.message).to.equal("error");
        });
    });

    describe("unregisterClickHandler", () => {
        it("should call map.un with singleclick and clear clickHandler", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });

            const map = mapCollection.getMap("2D");
            const handler = sinon.stub();

            wrapper.vm.clickHandler = handler;
            wrapper.vm.unregisterClickHandler();

            expect(map.un.calledWith("singleclick", handler)).to.be.true;
            expect(wrapper.vm.clickHandler).to.be.null;
        });

        it("should do nothing if clickHandler is already null", () => {
            wrapper = shallowMount(DrawEditAttributesComponent, {
                propsData: {layer}
            });

            const map = mapCollection.getMap("2D");

            map.un.resetHistory();
            wrapper.vm.clickHandler = null;
            wrapper.vm.unregisterClickHandler();

            expect(map.un.called).to.be.false;
        });
    });
});
