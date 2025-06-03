import actions from "../../../store/actionsBimViewer";
import sinon from "sinon";
import {expect} from "chai";

describe("src/modules/bimViewer/store/actionsBimViewer.js", () => {
    let commit,
        dispatch;

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.stub().resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("action: pushLoadedModel()", () => {
        const payload = {
            theModel: {}
        };

        actions.pushLoadedModel({commit}, payload);

        expect(commit.calledOnce).to.be.true;
        expect(commit.getCall(0).args).to.eql(["pushLoadedModel", {}]);
    });

    it("action: resetLoadedModels()", () => {
        actions.resetLoadedModels({commit});

        expect(commit.calledOnce).to.be.true;
        expect(commit.getCall(0).args).to.eql(["setLoadedModels", []]);
    });

    it("action: loadModel() exception: missing loader", async function () {
        const payload = {
            type: "abc",
            url: "http://localhost/model.ifc",
            visible: true
        };

        try {
            await actions.loadModel({
                dispatch,
                getters: {
                    xeokitIfcLoader: null
                },
                rootGetters: {
                    "Modules/BimViewer/xeokitViewer": {
                        scene: {}
                    }
                }
            }, payload);
        }
        catch (e) {
            expect(e.message).to.equal("No loader found for type: abc");
            return;
        }
        // catch block must succeed the test, here final report to fail.
        expect(false, "Test failed!").to.be.true;
    });

    it("action: loadModel() from url", async function () {
        const payload = {
                type: "ifc",
                url: "http://localhost/model.ifc",
                visible: true
            },
            mockLoadedModel = {
                on: sinon.stub().callsFake((event, callback) => {
                    if (event === "loaded") {
                        return callback();
                    }
                    return undefined;
                })
            },
            mockIfcLoader = {
                load: sinon.stub().returns(mockLoadedModel)
            },
            mockGetters = {
                xeokitIfcLoader: mockIfcLoader,
                loadedModels: []
            },
            rootGetters = {
                "Modules/BimViewer/xeokitViewer": {
                    scene: {
                        setObjectsSelected: sinon.stub()
                    }
                }
            };

        dispatch = sinon.stub().callsFake((action, payload2) => {
            if (action === "handleModelLoaderEvents") {
                payload2.loadedModel.on("loaded", () => {
                    payload2.resolve(payload2.loadedModel);
                });
                return Promise.resolve();
            }
            return Promise.resolve();
        });

        // eslint-disable-next-line one-var
        const result = await actions.loadModel({
            dispatch,
            getters: mockGetters,
            rootGetters
        }, payload);

        expect(dispatch.calledWith("loadFromBlob")).to.be.false;
        expect(dispatch.calledWith("handleModelLoaderEvents")).to.be.true;
        expect(result).to.equal(mockLoadedModel);
    });

    it("action: loadModel() from blob", async function () {
        const payload = {
                type: "ifc",
                url: "blob:http://localhost/model.ifc",
                visible: true
            },
            mockBlob = new Blob(["mock data"], {type: "application/octet-stream"}),
            mockLoadedModel = {
                on: sinon.stub().callsFake((event, callback) => {
                    if (event === "loaded") {
                        return callback();
                    }
                    return undefined;
                })
            },
            mockIfcLoader = {
                load: sinon.stub().returns(mockLoadedModel)
            },
            mockGetters = {
                xeokitIfcLoader: mockIfcLoader
            },
            rootGetters = {
                "Modules/BimViewer/xeokitViewer": {
                    scene: {
                        setObjectsSelected: () => sinon.stub()
                    }
                }
            },
            globalFetch = global.fetch,
            localDispatch = sinon.stub().callsFake((action, payload2) => {
                if (action === "handleModelLoaderEvents") {
                    payload2.loadedModel.on("loaded", () => {
                        payload2.resolve(payload2.loadedModel);
                    });
                    return Promise.resolve();
                }
                if (action === "loadFromBlob") {
                    return Promise.resolve(mockLoadedModel);
                }
                return Promise.resolve();
            });

        global.fetch = sinon.stub().resolves({
            blob: sinon.stub().resolves(mockBlob)
        });

        // eslint-disable-next-line one-var
        const result = await actions.loadModel({dispatch: localDispatch, getters: mockGetters, rootGetters}, payload);

        expect(localDispatch.calledWith("loadFromBlob")).to.be.true;
        expect(localDispatch.calledWith("handleModelLoaderEvents")).to.be.false;
        expect(result).to.equal(mockLoadedModel);

        delete global.fetch;
        global.fetch = globalFetch;
    });

});
