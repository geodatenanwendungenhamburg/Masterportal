import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, mount} from "@vue/test-utils";
import RoutingRestrictionsInputComponent from "@modules/routing/components/RoutingRestrictionsInput.vue";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/RoutingRestrictionsInput.vue", () => {
    let store,
        wrapper,
        activeRoutingToolOption = "DIRECTIONS";
    const routingRestrictionsInputData = {
            length: 10.0,
            width: 2.4,
            height: 2.8,
            weight: 18,
            axleload: 6,
            hazmat: false
        },
        isochronesRestrictionsInputData = {
            length: 10.0,
            width: 2.4,
            height: 2.8,
            weight: 18,
            axleload: 6,
            hazmat: false
        },
        routingRestrictionIsValid = {
            length: true,
            width: true,
            height: true,
            weight: true,
            axleload: true
        },
        isochronesRestrictionIsValid = {
            length: true,
            width: true,
            height: true,
            weight: true,
            axleload: true
        };

    beforeEach(() => {
        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing: {
                            namespaced: true,
                            getters: {
                                activeRoutingToolOption: () => activeRoutingToolOption
                            },
                            modules: {
                                Directions: {
                                    namespaced: true,
                                    getters: {
                                        routingRestrictionsInputData: () => routingRestrictionsInputData,
                                        routingRestrictionIsValid: () => routingRestrictionIsValid
                                    },
                                    mutations: {
                                        setRoutingRestrictionIsValid: () => sinon.stub()
                                    }
                                },
                                Isochrones: {
                                    namespaced: true,
                                    getters: {
                                        isochronesRestrictionsInputData: () => isochronesRestrictionsInputData,
                                        isochronesRestrictionIsValid: () => isochronesRestrictionIsValid
                                    },
                                    mutations: {
                                        setIsochronesRestrictionIsValid: () => sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should render restrictionsInput", () => {
        wrapper = mount(RoutingRestrictionsInputComponent, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.find("#routing-restrictions").exists()).to.be.true;
    });

    it("should validate input", () => {
        const length = 29.0;

        activeRoutingToolOption = "DIRECTIONS";
        wrapper = mount(RoutingRestrictionsInputComponent, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        wrapper.vm.validateInput("length", length, 0, 30);
        expect(routingRestrictionsInputData.length).to.equal(29);
        expect(routingRestrictionIsValid.length).to.be.true;

    });

    it("should validate input (width out of range)", () => {
        activeRoutingToolOption = "DIRECTIONS";
        wrapper = mount(RoutingRestrictionsInputComponent, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        const height = 25.0,
            isValid = wrapper.vm.validateInput("height", height, 0, 5);

        expect(routingRestrictionsInputData.height).to.equal(2.8);
        expect(isValid).to.be.false;
    });
    it("should validate input", () => {
        activeRoutingToolOption = "ISOCHRONES";
        const width = 1.0;

        wrapper = mount(RoutingRestrictionsInputComponent, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        wrapper.vm.validateInput("width", width, 0, 3.5);
        expect(isochronesRestrictionsInputData.width).to.equal(1.0);
        expect(isochronesRestrictionIsValid.width).to.be.true;

    });

    it("should validate input (axleload out of range)", () => {
        activeRoutingToolOption = "ISOCHRONES";
        wrapper = mount(RoutingRestrictionsInputComponent, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        const axleload = 25.0,
            isValid = wrapper.vm.validateInput("axleload", axleload, 0, 19);

        expect(routingRestrictionsInputData.axleload).to.equal(6);
        expect(isValid).to.be.false;
    });
});
