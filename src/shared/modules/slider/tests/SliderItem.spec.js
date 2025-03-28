import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import SliderItem from "../components/SliderItem.vue";

config.global.mocks.$t = key => key;

describe("src/shared/components/SliderItem.vue", () => {
    let interactionSpy, props;

    beforeEach(() => {
        interactionSpy = sinon.spy();

        props = {
            aria: "Aria-Label hier einfügen",
            id: "shared-slider",
            label: "Slider-Label",
            list: "datalist-id",
            min: 0,
            max: 100,
            step: 1,
            value: 40,
            disabled: false,
            showMarkers: true
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    /**
     * Creates a Vuex store instance for testing purposes.
     * Allows for customization of modules, states, getters, mutations, or actions.
     * @param {Object} [overrides={}] - Custom overrides for the Vuex store configuration.
     * @param {Object} [overrides.ResizeHandle] - Overrides for the `ResizeHandle` module, such as getters.
     * @returns {Object} - A Vuex store instance configured with the provided overrides.
     */
    function createTestStore (overrides = {}) {
        return createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        ResizeHandle: {
                            namespaced: true,
                            getters: {
                                mainMenuWidth: () => 800,
                                secondaryMenuWidth: () => 800,
                                ...overrides.ResizeHandle?.getters
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Mounts the `RoutingSliderInputComponent` for testing with customized props and Vuex store.
     * Automatically integrates the test Vuex store created by `createTestStore`.
     * @param {Object} [propsOverrides={}] - Custom overrides for component props.
     * @param {Object} [storeOverrides={}] - Custom overrides for the Vuex store configuration.
     * @returns {Wrapper} - A Vue Test Utils wrapper instance for the mounted component.
     */
    function mountComponent (propsOverrides = {}, storeOverrides = {}) {
        const testStore = createTestStore(storeOverrides);

        return shallowMount(SliderItem, {
            global: {plugins: [testStore]},
            props: {
                ...props,
                interaction: interactionSpy,
                ...propsOverrides}
        });
    }

    it("should render a slider and trigger the given interaction on change", async () => {
        const wrapper = mountComponent({side: "mainMenu"}),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.attributes("aria-label")).to.equal("Aria-Label hier einfügen");
        expect(input.attributes("type")).to.equal("range");
        expect(input.attributes("class")).to.equal("slider form-range");

        input.trigger("input");
        await wrapper.vm.$nextTick();
        expect(interactionSpy.calledOnce).to.be.true;
    });

    it("should render a disabled slider correctly and block interactions", async () => {
        const wrapper = mountComponent({disabled: true}),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.element.disabled).to.equal(true);

        await input.trigger("input");
        await wrapper.vm.$nextTick();
        expect(interactionSpy.called).to.be.false;
    });

    it("renders a slider with props that aren't required", () => {
        const wrapper = mountComponent(),
            input = wrapper.find("input"),
            label = wrapper.find("label");

        expect(input.exists()).to.be.true;
        expect(input.attributes("aria-label")).to.equal("Aria-Label hier einfügen");
        expect(input.attributes("id")).to.equal("shared-slider");
        expect(label.exists()).to.be.true;
        expect(label.text()).to.equal("Slider-Label");
        expect(input.attributes("list")).to.equal("datalist-id");
        expect(input.attributes("min")).to.equal("0");
        expect(input.attributes("max")).to.equal("100");
        expect(input.attributes("step")).to.equal("1");
        expect(input.element.value).to.equal("40");
        expect(input.element.disabled).to.equal(false);
    });

    it("renders a slider that is disable", () => {
        const wrapper = mountComponent({disabled: true}),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.element.disabled).to.equal(true);
    });

    it("computes correct marker values", () => {
        const wrapper = mountComponent({min: 0, max: 10, step: 5, maxMarkers: 3});

        expect(wrapper.vm.markers).to.deep.equal([0, 5, 10]);
    });

    it("disables markers if showMarkers prop is false", () => {
        const wrapper = mountComponent({showMarkers: false});

        expect(wrapper.vm.showMarkers).to.be.false;
        expect(wrapper.findAll(".marker").length).to.equal(0);
    });

    it("hides markers when viewport width is insufficient", () => {
        const currentWidthStub = sinon.stub().returns(50),

            wrapper = mountComponent(
                {max: 100, maxMarkers: 20},
                {ResizeHandle: {getters: {mainMenuWidth: currentWidthStub}}}
            );

        expect(wrapper.vm.shouldShowMarkers).to.be.false;
    });
});
