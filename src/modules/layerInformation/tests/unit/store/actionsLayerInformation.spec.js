import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/layerInformation/store/actionsLayerInformation.js";
import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import axios from "axios";
import store from "@appstore/index.js";
import {createPinia, setActivePinia} from "pinia";
import {useLayerInformationStore} from "@modules/layerInformation/store/layerInformationStore.js";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

describe("src/modules/layerInformation/store/actionsLayerInformation.js", () => {
    let layerInformationStore,
        pinia,
        rootGetters,
        commit,
        dispatch;

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
        globalThis.Config = {};
    });

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);

        layerInformationStore = useLayerInformationStore();

        rootGetters = {
            configJs: {},
            "Modules/Legend/layerInfoLegend": {
                id: "123"
            },
            isMobile: false,
            "Menu/expanded": () => true,
            restServiceById: () => undefined,
            layerConfigById: () => undefined,
            styleListLoaded: true
        };

        sinon.stub(store, "getters").value(rootGetters);

        commit = sinon.stub(store, "commit");
        dispatch = sinon.stub(store, "dispatch");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("initialize the store", () => {
        let layerConf,
            menuExpanded,
            isMobile;

        beforeEach(() => {
            isMobile = false;
            menuExpanded = true;
            layerConf = {
                id: "123",
                metaID: "layerMetaId",
                layername: "name",
                name: "name of the layer",
                url: "google.de",
                urlIsVisible: true,
                datasets: [
                    {
                        md_id: "123",
                        md_name: "MDName"
                    }
                ]
            };

            rootGetters["Modules/Legend/layerInfoLegend"] = {
                id: "123"
            };
            rootGetters.isMobile = isMobile;
            rootGetters["Menu/expanded"] = () => menuExpanded;
        });

        it("should initialize the LayerInformation", () => {
            const setLayerInfo = sinon.stub(layerInformationStore, "setLayerInfo"),
                setMetadataURL = sinon.stub(layerInformationStore, "setMetadataURL"),
                additionalSingleLayerInfo = sinon.stub(layerInformationStore, "additionalSingleLayerInfo"),
                changeCurrentComponent = sinon.stub(useMenuStore(), "changeCurrentComponent");

            actions.startLayerInformation.call(layerInformationStore, layerConf);

            expect(layerInformationStore.legendAvailable).to.be.true;
            expect(setLayerInfo.calledWith(layerConf)).to.be.true;

            expect(changeCurrentComponent.calledOnceWith({
                type: "layerInformation",
                side: "mainMenu",
                props: {name: layerConf.datasets[0].md_name}
            })).to.be.true;

            expect(setMetadataURL.calledWith(layerConf.datasets[0].md_id)).to.be.true;
            expect(additionalSingleLayerInfo.calledOnce).to.be.true;
        });

        it("should initialize the LayerInformation with name of layer", () => {
            const setLayerInfo = sinon.stub(layerInformationStore, "setLayerInfo"),
                setMetadataURL = sinon.stub(layerInformationStore, "setMetadataURL"),
                additionalSingleLayerInfo = sinon.stub(layerInformationStore, "additionalSingleLayerInfo"),
                changeCurrentComponent = sinon.stub(useMenuStore(), "changeCurrentComponent");

            delete layerConf.datasets[0].md_name;

            actions.startLayerInformation.call(layerInformationStore, layerConf);

            expect(layerInformationStore.legendAvailable).to.be.true;
            expect(setLayerInfo.calledWith(layerConf)).to.be.true;

            expect(changeCurrentComponent.calledOnceWith({
                type: "layerInformation",
                side: "mainMenu",
                props: {name: "name of the layer"}
            })).to.be.true;
            expect(setMetadataURL.calledWith(layerConf.datasets[0].md_id)).to.be.true;
            expect(additionalSingleLayerInfo.calledOnce).to.be.true;
        });

        it("should initialize the LayerInformation and create legend", () => {
            const setLayerInfo = sinon.stub(layerInformationStore, "setLayerInfo"),
                setMetadataURL = sinon.stub(layerInformationStore, "setMetadataURL"),
                additionalSingleLayerInfo = sinon.stub(layerInformationStore, "additionalSingleLayerInfo"),
                changeCurrentComponent = sinon.stub(useMenuStore(), "changeCurrentComponent");

            layerConf.legendURL = "https://legend.de";
            layerConf.id = "another";

            actions.startLayerInformation.call(layerInformationStore, layerConf);

            expect(layerInformationStore.legendAvailable).to.be.true;
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("Modules/Legend/setLayerInfoLegend");
            expect(commit.firstCall.args[1]).to.be.deep.equals({});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Modules/Legend/createLegendForLayerInfo");
            expect(dispatch.firstCall.args[1]).to.equal(layerConf.id);

            expect(changeCurrentComponent.calledOnceWith({
                type: "layerInformation",
                side: "mainMenu",
                props: {name: layerConf.datasets[0].md_name}
            })).to.be.true;
            expect(setLayerInfo.calledWith(layerConf)).to.be.true;
            expect(setMetadataURL.calledWith(layerConf.datasets[0].md_id)).to.be.true;
            expect(additionalSingleLayerInfo.calledOnce).to.be.true;
        });

        it("should toggle the LayerInformation in menu if mobile", () => {
            const setLayerInfo = sinon.stub(layerInformationStore, "setLayerInfo"),
                setMetadataURL = sinon.stub(layerInformationStore, "setMetadataURL"),
                additionalSingleLayerInfo = sinon.stub(layerInformationStore, "additionalSingleLayerInfo"),
                toggleMenu = sinon.stub(useMenuStore(), "toggleMenu"),
                changeCurrentComponent = sinon.stub(useMenuStore(), "changeCurrentComponent");

            isMobile = true;
            menuExpanded = false;

            rootGetters.isMobile = isMobile;
            rootGetters["Menu/expanded"] = () => menuExpanded;
            actions.startLayerInformation.call(layerInformationStore, layerConf);
            expect(layerInformationStore.legendAvailable).to.be.true;
            expect(setLayerInfo.calledWith(layerConf)).to.be.true;

            expect(toggleMenu.calledOnceWith("mainMenu")).to.be.true;

            expect(changeCurrentComponent.calledOnceWith({
                type: "layerInformation",
                side: "mainMenu",
                props: {name: layerConf.datasets[0].md_name}
            })).to.be.true;
            expect(setMetadataURL.calledWith(layerConf.datasets[0].md_id)).to.be.true;
            expect(additionalSingleLayerInfo.calledOnce).to.be.true;
        });

        it("should set metaDataCatalogueId from configJs before initialization", () => {
            sinon.stub(layerInformationStore, "setLayerInfo");
            sinon.stub(layerInformationStore, "setMetadataURL");
            sinon.stub(layerInformationStore, "additionalSingleLayerInfo");
            layerInformationStore.metaDataCatalogueId = "old-id";
            rootGetters.configJs = {
                metaDataCatalogueId: "new-id"
            };

            actions.startLayerInformation.call(layerInformationStore, layerConf);

            expect(layerInformationStore.metaDataCatalogueId).to.equal("new-id");
        });

        it("should set the Meta Data URLs", async () => {
            const metaId = "73A344E9-CDB5-4A17-89C1-05E202989755",
                metaURLs = [
                    "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid=73A344E9-CDB5-4A17-89C1-05E202989755"
                ];

            layerInformationStore.layerInfo = {
                "id": "123",
                "metaID": "layerMetaId",
                "layername": "name",
                "url": "google.de",
                "urlIsVisible": true
            };

            layerInformationStore.metaDataCatalogueId = "2";

            rootGetters.restServiceById = id => id === "2"
                ? {
                    url: "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid="
                }
                : {};

            actions.setMetadataURL.call(layerInformationStore, metaId);

            expect(layerInformationStore.metaURLs).to.deep.equal(metaURLs);
        });

        it("should use showDocUrl if set", async () => {
            layerInformationStore.layerInfo = {
                "id": "123",
                "metaID": "73A344E9-CDB5-4A17-89C1-05E202989755",
                "layername": "name",
                "url": "google.de",
                "urlIsVisible": true,
                "cswUrl": "https://metaver.de/csw",
                "showDocUrl": "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid="
            };
            layerInformationStore.metaDataCatalogueId = "2";

            rootGetters.restServiceById = id => id === "2"
                ? {
                    url: "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid="
                }
                : {};
            actions.setMetadataURL.call(
                layerInformationStore,
                "73A344E9-CDB5-4A17-89C1-05E202989755"
            );

            expect(layerInformationStore.metaURLs).to.deep.equal([
                "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid=73A344E9-CDB5-4A17-89C1-05E202989755"
            ]);
        });

        it("should use the url from metaDataCatalogueId if showDocUrl is not set", async () => {
            const metaURLs = [
                "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid=73A344E9-CDB5-4A17-89C1-05E202989755"
            ];

            layerInformationStore.layerInfo = {
                "id": "123",
                "metaID": "73A344E9-CDB5-4A17-89C1-05E202989755",
                "layername": "name",
                "url": "google.de",
                "urlIsVisible": true,
                "cswUrl": "https://metaver.de/csw"
            };
            layerInformationStore.metaDataCatalogueId = "2";

            rootGetters.restServiceById = id => id === "2"
                ? {
                    url: "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid="
                }
                : {};

            actions.setMetadataURL.call(
                layerInformationStore,
                "73A344E9-CDB5-4A17-89C1-05E202989755"
            );

            expect(layerInformationStore.metaURLs).to.deep.equal(metaURLs);
        });
    });

    describe("restoreFromUrlParams", () => {
        let attributes,
            layerConfig;

        beforeEach(() => {
            attributes = {
                layerInfo: {
                    id: "layerId"
                }
            };
            layerConfig = {
                id: "layerId",
                name: "name"
            };
            rootGetters.layerConfigById = () => layerConfig;
            rootGetters.styleListLoaded = true;
        });

        it("styleListLoaded = true, start layer info", () => {
            const startLayerInformation = sinon.stub(layerInformationStore, "startLayerInformation"),
                updateComponentState = sinon.stub(useMenuStore(), "updateComponentState");

            actions.restoreFromUrlParams.call(layerInformationStore, attributes);

            expect(updateComponentState.calledOnceWith({
                type: "LayerInformation",
                attributes
            })).to.be.true;

            expect(startLayerInformation.calledWith(layerConfig)).to.be.true;
        });
        it("styleListLoaded = false, wait and start layer info", () => {
            const waitAndRestoreLayerInformation = sinon.stub(
                    layerInformationStore,
                    "waitAndRestoreLayerInformation"
                ),
                updateComponentState = sinon.stub(useMenuStore(), "updateComponentState");

            rootGetters.styleListLoaded = false;

            actions.restoreFromUrlParams.call(layerInformationStore, attributes);

            expect(updateComponentState.calledOnceWith({
                type: "LayerInformation",
                attributes
            })).to.be.true;
            expect(waitAndRestoreLayerInformation.calledWith(layerConfig)).to.be.true;
        });
    });
    describe("getAbstractInfo", () => {
        it("should show the about module in menu", async () => {
            const metaInfo = {
                    metaId: "73A344E9-CDB5-4A17-89C1-05E202989755",
                    cswUrl: "https://metaver.de/csw"
                },
                cswReturn = {
                    getTitle: () => "name",
                    getAbstract: () => "abstract",
                    getFrequenzy: () => "123",
                    getDownloadLinks: () => [],
                    getCreationDate: () => "thisIsADate",
                    getPublicationDate: () => "thisIsADate",
                    getContact: () => "contact",
                    getPublisher: () => "publisher",
                    getRevisionDate: () => "thisIsADate"
                };

            layerInformationStore.downloadLinks = [];
            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            await actions.getAbstractInfo.call(layerInformationStore, metaInfo);

            expect(layerInformationStore.downloadLinks).to.deep.equal([]);
            expect(layerInformationStore.title).to.equal("name");
            expect(layerInformationStore.abstractText).to.equal("abstract");
            expect(layerInformationStore.periodicityKey).to.equal("123");
            expect(layerInformationStore.datePublication).to.equal("thisIsADate");
            expect(layerInformationStore.dateCreation).to.equal("thisIsADate");
            expect(layerInformationStore.pointOfContact).to.equal("contact");
            expect(layerInformationStore.publisher).to.equal("publisher");
            expect(layerInformationStore.dateRevision).to.equal("thisIsADate");
        });

        it("ensures that downloadLinks is set to null", async () => {
            const metaInfo = {};

            await actions.getAbstractInfo.call(layerInformationStore, metaInfo);

            expect(layerInformationStore.downloadLinks).to.equal(null);
        });

        it("retrieves data from unmodified cswUrl when metaId is nullish", async () => {
            const metaInfoNull = {
                    customMetadata: true,
                    metaId: null,
                    cswUrl: "https://metaver.de/csw"
                },
                metaInfoUndefined = {
                    customMetadata: true,
                    metaId: undefined,
                    cswUrl: "https://metaver.de/csw"
                },
                getCustomMetaData = sinon.stub(layerInformationStore, "getCustomMetaData");

            sinon.stub(axios, "get").resolves({
                request: {
                    responseXML: new DOMParser().parseFromString(
                        "<Metadata></Metadata>",
                        "application/xml"
                    )
                }
            });

            sinon.stub(getCswRecordById, "getMetadata").returns(undefined);

            await actions.getAbstractInfo.call(layerInformationStore, metaInfoNull);

            expect(axios.get.calledWith(metaInfoNull.cswUrl)).to.be.true;
            expect(getCustomMetaData.calledOnce).to.be.true;

            axios.get.resetHistory();
            getCustomMetaData.resetHistory();

            await actions.getAbstractInfo.call(layerInformationStore, metaInfoUndefined);

            expect(axios.get.calledWith(metaInfoUndefined.cswUrl)).to.be.true;
            expect(getCustomMetaData.calledOnce).to.be.true;
        });
    });
    describe("additionalSingleLayerInfo", () => {
        it("should initialize the other abstract layer infos", async () => {
            layerInformationStore.layerInfo = {
                cswUrl: "https://metaver.de/csw",
                metaID: "73A344E9-CDB5-4A17-89C1-05E202989755",
                attributes: {attr1: "value1"},
                customMetadata: {key: "value"}
            };
            const getAbstractInfo = sinon.stub(layerInformationStore, "getAbstractInfo");

            await actions.additionalSingleLayerInfo.call(layerInformationStore);

            expect(getAbstractInfo.calledOnce).to.be.true;

            expect(getAbstractInfo.firstCall.args[0]).to.deep.equal({
                metaId: layerInformationStore.layerInfo.metaID,
                cswUrl: layerInformationStore.layerInfo.cswUrl,
                attributes: layerInformationStore.layerInfo.attributes,
                customMetadata: layerInformationStore.layerInfo.customMetadata
            });
        });

        it("should dispatches 'getAbstractInfo' with correct payload for metaID array", async () => {
            layerInformationStore.layerInfo = {
                metaID: ["id1", "id2", "id3"],
                cswUrl: "https://metaver.de/csw",
                customMetadata: {key: "value"},
                attributes: {attr1: "value1"}
            };
            layerInformationStore.selectedLayerIndex = 1;

            const getAbstractInfo = sinon.stub(layerInformationStore, "getAbstractInfo");

            await actions.additionalSingleLayerInfo.call(layerInformationStore);

            expect(getAbstractInfo.calledOnce).to.be.true;
            expect(getAbstractInfo.firstCall.args[0]).to.deep.equal({
                metaId: "id2",
                cswUrl: "https://metaver.de/csw",
                customMetadata: {key: "value"},
                attributes: {attr1: "value1"}
            });
        });

        it("should default to the first metaID when selectedLayerIndex is out of bounds", async () => {
            layerInformationStore.layerInfo = {
                metaID: ["id1", "id2", "id3"],
                cswUrl: "https://metaver.de/csw",
                customMetadata: {key: "value"},
                attributes: {attr1: "value1"}
            };
            layerInformationStore.selectedLayerIndex = 10;
            const getAbstractInfo = sinon.stub(layerInformationStore, "getAbstractInfo");

            await actions.additionalSingleLayerInfo.call(layerInformationStore);

            expect(getAbstractInfo.calledOnce).to.be.true;
            expect(getAbstractInfo.firstCall.args[0]).to.deep.equal({
                metaId: "id1",
                cswUrl: "https://metaver.de/csw",
                customMetadata: {key: "value"},
                attributes: {attr1: "value1"}
            });
        });
        it("should throw an error but still fill abstract info on bad metaInformation", async () => {
            const metaInfo = {
                    attributes: "",
                    cswUrl: "e",
                    customMetadata: "",
                    metaId: ""
                },
                consoleError = console.error;

            console.error = sinon.spy();
            sinon.stub(getCswRecordById, "getRecordById").throws();

            await actions.getAbstractInfo.call(layerInformationStore, metaInfo);

            expect(console.error.getCall(0).args[0]).to.equal(
                "modules.layerInformation.noMetadataLoadedConsole"
            );
            expect(layerInformationStore.downloadLinks).to.equal(null);
            expect(layerInformationStore.title).to.equal("");
            expect(layerInformationStore.periodicityKey).to.equal("");
            expect(layerInformationStore.datePublication).to.equal("");
            expect(layerInformationStore.abstractText).to.equal(
                "modules.layerInformation.noMetadataLoaded"
            );
            expect(layerInformationStore.noMetadataLoaded).to.equal(
                "modules.layerInformation.noMetadataLoaded"
            );
            expect(layerInformationStore.pointOfContact).to.equal("");
            expect(layerInformationStore.publisher).to.equal("");
            expect(layerInformationStore.dateRevision).to.equal("");

            console.error = consoleError;
        });
    });
});
