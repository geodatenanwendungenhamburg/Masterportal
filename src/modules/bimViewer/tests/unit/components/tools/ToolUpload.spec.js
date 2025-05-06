import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ToolUpload from "../../../../components/tools/ToolUpload.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/bimViewer/tests/unit/components/tools/ToolUpload.vue", () => {
    let store, wrapper, dispatchStub;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimViewer: {
                            namespaced: true,
                            actions: {
                                loadModel: sinon.stub().resolves({
                                    on: sinon.stub().callsFake((event, callback) => {
                                        if (event === "loaded") {
                                            // eslint-disable-next-line
                                            callback();
                                        }
                                    })
                                }),
                                fit: sinon.stub()
                            },
                            modules: {
                                ToolSceneFit: {
                                    namespaced: true,
                                    actions: {
                                        fit: sinon.stub()
                                    }
                                }
                            }
                        },
                        Alerting: {
                            namespaced: true,
                            actions: {
                                addSingleAlert: sinon.stub()
                            }
                        }
                    }
                }
            }
        });

        dispatchStub = sinon.stub(store, "dispatch");
        dispatchStub.withArgs("Modules/BimViewer/loadModel", sinon.match.any).returns(
            Promise.resolve({
                on: sinon.stub().callsFake((event, callback) => {
                    if (event === "loaded") {
                        // eslint-disable-next-line
                        callback();
                    }
                })
            })
        );
        dispatchStub.callThrough();

        wrapper = shallowMount(ToolUpload, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        wrapper.unmount();
    });

    it("renders the component", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.find("form.ToolUpload").exists()).to.be.true;
    });

    it("dispatches 'loadModel' and 'fit' when a valid file is uploaded", async () => {
        const file = new File(["content"], "model.ifc", {type: "application/octet-stream"}),
            input = wrapper.find("#uploadButton");

        Object.defineProperty(input.element, "files", {
            value: [file],
            writable: false
        });

        await input.trigger("change");
        await wrapper.vm.$nextTick();

        expect(dispatchStub.calledWith("Modules/BimViewer/loadModel")).to.be.true;
        expect(dispatchStub.calledWith("Modules/BimViewer/ToolSceneFit/fit")).to.be.true;
        expect(input.element.value).to.equal("");
    });

    it("triggers the file input when the upload button is clicked", async () => {
        const uploadButton = wrapper.find("label[for='uploadButton']"),
            input = wrapper.find("#uploadButton"),
            clickStub = sinon.stub(input.element, "click");

        await uploadButton.trigger("keydown", {key: "Enter"});

        expect(clickStub.called).to.be.true;

        clickStub.restore();
    });
});
