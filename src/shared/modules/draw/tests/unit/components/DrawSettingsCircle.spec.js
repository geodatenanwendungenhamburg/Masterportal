import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import DrawSettingsCircleComponent from "@shared/modules/draw/components/DrawSettingsCircle.vue";


describe("src/shared/modules/draw/components/DrawSettingsCircle.vue", () => {
    let circleOptions,
        setCircleOptionsSpy,
        store,
        wrapper;

    beforeEach(() => {
        circleOptions = {
            innerRadius: 0,
            interactive: true,
            outerRadius: 100,
            unit: "m"
        };
        setCircleOptionsSpy = sinon.spy();
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Draw: {
                            namespaced: true,
                            state: {
                                currentLayout: {strokeWidth: 1}
                            }
                        }
                    }
                }
            }
        });
    });


    describe("render", () => {
        it("renders the elements for drawtype === 'circle' and interactive === true", () => {
            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {
                    circleOptions: circleOptions,
                    selectedDrawType: "circle",
                    setCircleOptions: setCircleOptionsSpy
                }
            });

            expect(wrapper.find("switch-input-stub#draw-settings-circle-interactive-circle").exists()).to.be.true;
        });

        it("renders the elements for drawtype === 'circle' and interactive === false", () => {
            circleOptions.interactive = false;

            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {
                    circleOptions: circleOptions,
                    selectedDrawType: "circle",
                    setCircleOptions: setCircleOptionsSpy
                }
            });

            expect(wrapper.find("switch-input-stub#draw-settings-circle-interactive-circle").exists()).to.be.true;

            expect(wrapper.find("select#draw-circle-settings-circle").exists()).to.be.true;
            expect(wrapper.find("select#draw-circle-settings-circle > option[value='m']").exists()).to.be.true;
            expect(wrapper.find("select#draw-circle-settings-circle > option[value='km']").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-circle']").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-circle']").text()).to.equals("common:shared.modules.draw.drawSettingsCircle.unit");

            expect(wrapper.find("input#draw-circle-settings-radius").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-radius']").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-radius']").text()).to.equals("common:shared.modules.draw.drawSettingsCircle.radii.radius");
        });

        it("renders the elements for drawtype === 'doubleCircle'", () => {
            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {
                    circleOptions: circleOptions,
                    selectedDrawType: "doubleCircle",
                    setCircleOptions: setCircleOptionsSpy
                }
            });

            expect(wrapper.find("select#draw-circle-settings-doubleCircle").exists()).to.be.true;
            expect(wrapper.find("select#draw-circle-settings-doubleCircle > option[value='m']").exists()).to.be.true;
            expect(wrapper.find("select#draw-circle-settings-doubleCircle > option[value='km']").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-doubleCircle']").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-doubleCircle']").text()).to.equals("common:shared.modules.draw.drawSettingsCircle.unit");

            expect(wrapper.find("input#draw-circle-settings-innerRadius").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-innerRadius']").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-innerRadius']").text()).to.equals("common:shared.modules.draw.drawSettingsCircle.radii.innerRadius");

            expect(wrapper.find("input#draw-circle-settings-outerRadius").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-outerRadius']").exists()).to.be.true;
            expect(wrapper.find("label[for='draw-circle-settings-outerRadius']").text()).to.equals("common:shared.modules.draw.drawSettingsCircle.radii.outerRadius");
        });
    });

    describe("updateRadiusInCircleOptions", () => {
        it("should set the innerRadius in circle options", () => {
            const value = "10",
                radius = "innerRadius";

            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {
                    circleOptions: circleOptions,
                    selectedDrawType: "circle",
                    setCircleOptions: setCircleOptionsSpy
                }
            });

            wrapper.vm.updateRadiusInCircleOptions(value, radius);

            expect(setCircleOptionsSpy.calledOnce).to.be.true;
            expect(setCircleOptionsSpy.firstCall.args[0]).to.deep.equals({
                innerRadius: 10
            });
        });

        it("should start updateRadiusInCircleOptions radius by trigger input", async () => {
            const value = "100",
                radius = "radius";
            let input = null,
                updateRadiusInCircleOptionsSpy = null;

            circleOptions.interactive = false;
            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {
                    circleOptions: circleOptions,
                    selectedDrawType: "circle",
                    setCircleOptions: setCircleOptionsSpy
                }
            });

            updateRadiusInCircleOptionsSpy = sinon.spy(wrapper.vm, "updateRadiusInCircleOptions");

            input = wrapper.find("input#draw-circle-settings-radius");
            input.element.value = value;

            await wrapper.vm.$nextTick();
            await input.trigger("input");

            expect(updateRadiusInCircleOptionsSpy.calledOnce).to.be.true;
            expect(updateRadiusInCircleOptionsSpy.firstCall.args[0]).to.equals(value);
            expect(updateRadiusInCircleOptionsSpy.firstCall.args[1]).to.equals(radius);

            expect(setCircleOptionsSpy.calledOnce).to.be.true;
            expect(setCircleOptionsSpy.firstCall.args[0]).to.deep.equals({
                innerRadius: 100
            });
        });

        it("should set the outerRadius in circle options", () => {
            const value = "50",
                radius = "outerRadius";

            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {
                    circleOptions: circleOptions,
                    selectedDrawType: "doubleCircle",
                    setCircleOptions: setCircleOptionsSpy
                }
            });

            wrapper.vm.updateRadiusInCircleOptions(value, radius);

            expect(setCircleOptionsSpy.calledOnce).to.be.true;
            expect(setCircleOptionsSpy.firstCall.args[0]).to.deep.equals({
                outerRadius: 50
            });
        });

        it("should start updateRadiusInCircleOptions outerRadius by trigger input", async () => {
            const value = "500",
                radius = "outerRadius";
            let input = null,
                updateRadiusInCircleOptionsSpy = null;

            circleOptions.interactive = false;
            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {
                    circleOptions: circleOptions,
                    selectedDrawType: "doubleCircle",
                    setCircleOptions: setCircleOptionsSpy
                }
            });

            updateRadiusInCircleOptionsSpy = sinon.spy(wrapper.vm, "updateRadiusInCircleOptions");

            input = wrapper.find("input#draw-circle-settings-outerRadius");
            input.element.value = value;

            await input.trigger("input");

            expect(updateRadiusInCircleOptionsSpy.calledOnce).to.be.true;
            expect(updateRadiusInCircleOptionsSpy.firstCall.args[0]).to.equals(value);
            expect(updateRadiusInCircleOptionsSpy.firstCall.args[1]).to.equals(radius);

            expect(setCircleOptionsSpy.calledOnce).to.be.true;
            expect(setCircleOptionsSpy.firstCall.args[0]).to.deep.equals({
                outerRadius: 500
            });
        });
    });

    describe("isRadiusInvalid computed", () => {
        it("should return true if innerRadius > outerRadius", () => {
            circleOptions.innerRadius = 200;
            circleOptions.outerRadius = 100;

            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {circleOptions, selectedDrawType: "doubleCircle", setCircleOptions: setCircleOptionsSpy},
                global: {plugins: [store]}
            });

            expect(wrapper.vm.isRadiusInvalid).to.be.true;
        });

        it("should return false if innerRadius <= outerRadius", () => {
            circleOptions.innerRadius = 50;
            circleOptions.outerRadius = 100;

            wrapper = shallowMount(DrawSettingsCircleComponent, {
                propsData: {circleOptions, selectedDrawType: "doubleCircle", setCircleOptions: setCircleOptionsSpy},
                global: {plugins: [store]}
            });

            expect(wrapper.vm.isRadiusInvalid).to.be.false;
        });
    });
});
