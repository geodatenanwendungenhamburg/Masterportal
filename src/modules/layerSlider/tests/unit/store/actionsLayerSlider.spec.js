import sinon from "sinon";
import {expect} from "chai";
import actions from "@modules/layerSlider/store/actionsLayerSlider.js";

const {
    addInformationToLayerIds,
    checkIfAllLayersAvailable,
    sendModification,
    setActiveIndex,
    toggleLayerVisibility
} = actions;


describe("src/modules/layerSlider/store/actionsLayerSlider.js", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("addInformationToLayerIds", () => {
        it("addInformationToLayerIds", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                layerIds = [
                    {
                        layerId: "123",
                        title: "Pommes"
                    },
                    {
                        layerId: "456",
                        title: "Ketchup"
                    },
                    {
                        layerId: "789",
                        title: "Mayonnaise"
                    }
                ],
                layerIdsWithInformation = [
                    {
                        layerId: "123",
                        title: "Pommes",
                        index: 0,
                        visibility: false,
                        transparency: 0
                    },
                    {
                        layerId: "456",
                        title: "Ketchup",
                        index: 1,
                        visibility: true,
                        transparency: 1
                    },
                    {
                        layerId: "789",
                        title: "Mayonnaise",
                        index: 2,
                        visibility: false,
                        transparency: 2
                    }
                ];

            addInformationToLayerIds({commit, dispatch, state: {}, rootGetters: {
                allLayerConfigs: [
                    {id: "123", visibility: false, transparency: 0},
                    {id: "456", visibility: true, transparency: 1},
                    {id: "789", visibility: false, transparency: 2}
                ]
            }}, layerIds);

            expect(commit.calledWith("setLayerIds", layerIdsWithInformation)).to.be.true;
        });
    });

    describe("checkIfAllLayersAvailable", () => {
        it("checkIfAllLayersAvailable", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                layerIds = [
                    {
                        layerId: "123",
                        title: "Pommes",
                        index: 0
                    }
                ],
                rootGetters = {
                    allLayerConfigs: [
                        {
                            id: "123"
                        }
                    ]
                };

            checkIfAllLayersAvailable({commit, dispatch, state: {}, rootGetters}, layerIds);

            expect(commit.calledWith("setLayerIds", layerIds)).to.be.true;
        });
    });

    describe("sendModification", () => {
        it("sendModification", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                layerId = {
                    layerId: "123",
                    title: "Pommes",
                    index: 0
                },
                visibility = true,
                transparency = 0.5;

            sendModification({commit, dispatch, state: {}}, {layerId, visibility, transparency});

            expect(dispatch.calledWith("replaceByIdInLayerConfig", {
                layerConfigs: [{
                    id: layerId,
                    layer: {
                        visibility: visibility,
                        transparency: transparency
                    }
                }]
            })).to.be.true;
        });
    });

    describe("setActiveIndex", () => {
        it("setActiveIndex", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                activeLayer = {
                    layerId: "123",
                    title: "Pommes",
                    index: 0
                },
                layerIds = [
                    {
                        layerId: "123",
                        title: "Pommes",
                        index: 0
                    },
                    {
                        layerId: "456",
                        title: "Ketchup",
                        index: 1
                    },
                    {
                        layerId: "789",
                        title: "Myonnaise",
                        index: 2
                    }
                ],
                state = {
                    activeLayer,
                    layerIds
                };

            setActiveIndex({commit, dispatch, state}, 0);

            expect(commit.calledWith("setActiveLayer", layerIds[0])).to.be.true;
            expect(dispatch.calledWith("toggleLayerVisibility", activeLayer.layerId)).to.be.true;
        });
    });

    describe("toggleLayerVisibility", () => {
        it("toggleLayerVisibility", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                activeLayerId = "123",
                state = {
                    layerIds: [
                        {
                            layerId: "123",
                            title: "Pommes",
                            index: 0
                        },
                        {
                            layerId: "456",
                            title: "Ketchup",
                            index: 1
                        },
                        {
                            layerId: "789",
                            title: "Myonnaise",
                            index: 2
                        }
                    ]
                };

            toggleLayerVisibility({commit, dispatch, state}, activeLayerId);

            expect(dispatch.getCall(0).args).to.deep.equal(["sendModification", {layerId: "123", visibility: true}]);
            expect(dispatch.getCall(1).args).to.deep.equal(["sendModification", {layerId: "456", visibility: false}]);
            expect(dispatch.getCall(2).args).to.deep.equal(["sendModification", {layerId: "789", visibility: false}]);
        });
    });
});
