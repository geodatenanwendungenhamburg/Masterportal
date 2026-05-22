import {expect} from "chai";
import actions from "@modules/print/store/actionsPrint.js";
import VectorLayer from "ol/layer/Vector.js";
import sinon from "sinon";

const {activatePrintStarted, getMetaDataForPrint, createPrintJob, migratePayload, waitForPrintJob, waitForPrintJobSuccess, downloadFile} = actions;

afterEach(() => {
    sinon.restore();
});

describe("src/modules/print/store/actionsPrint", function () {
    describe("activatePrintStarted", function () {
        it("should set activatePrintStarted to true", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            activatePrintStarted({commit, dispatch, state: {}}, undefined);

            expect(commit.calledWith("setPrintStarted", true)).to.be.true;
        });
    });

    describe("getMetaDataForPrint", function () {
        it("should get metadata", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {
                    getResponse: () => {
                        return true;
                    },
                    keyList: ["date", "orgaOwner", "address", "email", "tel", "url"],
                    layer: new VectorLayer(),
                    layerName: "Grenze der Metropolregion Hamburg",
                    metaId: "76E7AE5D-9C06-48A5-BC7F-94DDBF62745C",
                    uniqueId: "89"
                },
                useProxy = [
                    "http://www.sh-mis.schleswig-holstein.de/soapServices/CSWStartup",
                    "http://zebis.landsh.de/metadaten/servants/de/disy/preludio2/service/cat/csw/v_2_0_2/GetRecordByIdServant$Get",
                    "https://mis.bkg.bund.de/csw",
                    "https://www.geodaten-mv.de/soapServices/CSWStartup",
                    "https://metaver.de/csw"
                ],
                rootGetters = {
                    metadata: {
                        useProxy
                    },
                    restServiceById: () => {
                        return {url: "https:\\url.de"};
                    }
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            getMetaDataForPrint({commit, dispatch, state: {}, rootGetters}, payload);
        });
    });
    describe("createPrintJob", function () {
        it("should create a printJob", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                defaults = {
                    attributes: {title: "Mein Titel", map: {}, scale: "1:60000", showGfi: false, gfi: {}},
                    layout: "A4 Hochformat",
                    outputFilename: "Ausdruck",
                    outputFormat: "pdf",
                    uniqueIdList: [],
                    visibleLayerIds: ["453", "8712", "1711"]
                },
                data = {
                    ownloadURL: "/mapfish_print_internet/print/report/2ca7f8ab-24f0-48e1-9fd7-a6fe3349ccd0@89c12004-d327-4fb1-88a3-2a3332fa36a0",
                    ref: "2ca7f8ab-24f0-48e1-9fd7-a6fe3349ccd0@89c12004-d327-4fb1-88a3-2a3332fa36a0",
                    statusURL: "/mapfish_print_internet/print/status/2ca7f8ab-24f0-48e1-9fd7-a6fe3349ccd0@89c12004-d327-4fb1-88a3-2a3332fa36a0.json"
                },
                payload = {
                    payload: encodeURIComponent(JSON.stringify(defaults)),
                    getResponse: () => {
                        return {data};
                    }
                },
                state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master",
                    currentFormat: "A4 Hochformat"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            await createPrintJob({commit, dispatch, state, getters: {}}, payload);

            expect(commit.calledWith("setPrintFileReady", false)).to.be.true;
            expect(commit.calledWith("setProgressWidth", "width: 50%")).to.be.true;
            expect(dispatch.calledWith("waitForPrintJob", data)).to.be.true;
        });
    });
    describe("migratePayload", function () {
        it("should migrate the for mapfish generated JSON to plotservice", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {
                    attributes: {
                        title: "Mein Titel",
                        map: {
                            dpi: 120,
                            projection: "EPSG:25832",
                            center: [561210, 5932600],
                            scale: 100000,
                            layers: []
                        },
                        legend: {},
                        showLegend: false
                    },
                    layout: "Default A4 hoch",
                    outputFilename: "Ausdruck",
                    outputFormat: "pdf",
                    uniqueIdList: [],
                    visibleLayerIds: ["453"]
                },
                state = {
                    outputFilename: "",
                    outputFormat: "",
                    layoutMapInfo: [504, 640]
                },
                rootState = {
                    Maps: {
                        projection: {code_: "EPSG:25832"},
                        scale: 100000,
                        resolution: 26.458319045841044
                    }
                };

            migratePayload({commit, dispatch, state, rootState}, payload);
        });
    });
    describe("waitForPrintJob", function () {
        it("should start another print request", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master"
                },
                response = {
                    ref: "d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a",
                    index: 0
                },
                serviceRequest = {
                    "index": 0,
                    "serviceUrl": "https://geodienste.hamburg.de/mapfish_print_internet/print/master/status/d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a.json",
                    "requestType": "GET",
                    "onSuccess": "waitForPrintJobSuccess"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            waitForPrintJob({commit, dispatch, state, getters: {}}, response);

            expect(commit.calledWith("setProgressWidth", "width: 75%")).to.be.true;
            expect(dispatch.calledWith("sendRequest", serviceRequest)).to.be.true;
        });
        it("should start another print request with service url without /print/", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/",
                    printAppId: "master",
                    printService: "mapfish"
                },
                response = {
                    ref: "d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a",
                    index: 0
                },
                serviceRequest = {
                    "index": 0,
                    "serviceUrl": "https://geodienste.hamburg.de/mapfish_print_internet/print/master/status/d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a.json",
                    "requestType": "GET",
                    "onSuccess": "waitForPrintJobSuccess"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            waitForPrintJob({commit, dispatch, state, getters: {}}, response);

            expect(commit.calledWith("setProgressWidth", "width: 75%")).to.be.true;
            expect(dispatch.calledWith("sendRequest", serviceRequest)).to.be.true;
        });
        it("should trigger addSingleAlert when response.status is 'error'", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master"
                },
                response = {
                    status: "error"
                };

            waitForPrintJobSuccess({commit, dispatch, state, getters: {}}, response);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.print.waitForPrintErrorMessage")
            })).to.be.true;
            expect(commit.calledWith("setPrintStarted", false)).to.be.true;
            expect(commit.calledWith("setFileDownloads", [])).to.be.true;
        });
    });
    it("should trigger addSingleAlert when response.data.status is 'error'", async () => {
        const commit = sinon.spy(),
            dispatch = sinon.spy(),
            state = {
                serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                printAppId: "master"
            },
            response = {
                data: {
                    status: "error"
                }
            };

        waitForPrintJobSuccess({commit, dispatch, state, getters: {}}, response);

        expect(dispatch.calledWith("Alerting/addSingleAlert", {
            category: "error",
            content: i18next.t("common:modules.print.waitForPrintErrorMessage")
        })).to.be.true;
        expect(commit.calledWith("setPrintStarted", false)).to.be.true;
        expect(commit.calledWith("setFileDownloads", [])).to.be.true;
    });

    describe("waitForPrintJobSuccess", function () {
        let clock;

        beforeAll(function () {
            clock = sinon.useFakeTimers();
        });
        afterAll(function () {
            clock.restore();
        });
        it("is not done yet so it should start another print request", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master"
                },
                response = {
                    index: 0,
                    done: false,
                    downloadURL: "/mapfish_print_internet/print/report/5dbc66f1-0ff5-4ba6-8257-640c600150d0@a8cb3d11-7c03-48d3-995e-b7734c564164",
                    elapsedTime: 4278,
                    status: "running",
                    waitingTime: 0
                },
                serviceRequest = {
                    index: 0,
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/master/status/5dbc66f1-0ff5-4ba6-8257-640c600150d0@a8cb3d11-7c03-48d3-995e-b7734c564164.json",
                    requestType: "GET",
                    onSuccess: "waitForPrintJobSuccess"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            waitForPrintJobSuccess({commit, dispatch, state, getters: {}}, response);
            clock.tick(2001);

            expect(commit.calledWith("setProgressWidth", "width: 80%")).to.be.true;
            expect(dispatch.calledWith("sendRequest", serviceRequest)).to.be.true;
        });
        it("is done so it should activate the download", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master",
                    filename: "Meine Datey"
                },
                response = {
                    index: 0,
                    done: true,
                    downloadURL: "/mapfish_print_internet/print/report/d75d96af-63b1-41b0-860c-96333e05e876@a8cb3d11-7c03-48d3-995e-b7734c564164",
                    elapsedTime: 6145,
                    status: "finished",
                    waitingTime: 0
                },
                fileSpecs = {
                    index: 0,
                    fileUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/master/report/d75d96af-63b1-41b0-860c-96333e05e876@a8cb3d11-7c03-48d3-995e-b7734c564164",
                    filename: "Meine Datey"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            waitForPrintJobSuccess({commit, dispatch, state, getters: {}}, response);

            expect(commit.calledWith("setProgressWidth", "width: 100%")).to.be.true;
            expect(dispatch.calledWith("downloadFile", fileSpecs)).to.be.true;
        });

        describe("downloadFile", function () {
            it("should set parameters for one download file", async () => {
                const commit = sinon.spy(),
                    dispatch = sinon.spy(),
                    state = {
                        serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                        printAppId: "master",
                        filename: "Pikachu"
                    },
                    fileSpecs = {
                        fileUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/master/report/d75d96af-63b1-41b0-860c-96333e05e876@a8cb3d11-7c03-48d3-995e-b7734c564164",
                        filename: "Raichu"
                    };

                downloadFile({commit, dispatch, state, getters: {}}, fileSpecs);

                expect(commit.calledWith("setPrintStarted", false)).to.be.true;
                expect(commit.calledWith("setPrintFileReady", true)).to.be.true;
                expect(commit.calledWith("setFileDownloadUrl", fileSpecs.fileUrl)).to.be.true;
                expect(commit.calledWith("setFilename", fileSpecs.filename)).to.be.true;
            });

            it("should set parameters for more than one download file", async () => {
                const commit = sinon.spy(),
                    dispatch = sinon.spy(),
                    state = {
                        serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                        printAppId: "master",
                        filename: "Pikachu"
                    },
                    fileSpecs = {
                        index: 0,
                        fileUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/master/report/d75d96af-63b1-41b0-860c-96333e05e876@a8cb3d11-7c03-48d3-995e-b7734c564164",
                        filename: "Raichu"
                    };

                downloadFile({commit, dispatch, state, getters: {}}, fileSpecs);

                expect(commit.calledWith("setPrintStarted", false)).to.be.true;
                expect(commit.calledWith("setPrintFileReady", true)).to.be.true;
                expect(commit.calledWith("setFileDownloadUrl", fileSpecs.fileUrl)).to.be.true;
                expect(commit.calledWith("setFilename", fileSpecs.filename)).to.be.true;
                expect(commit.calledWith("updateFileDownload", {
                    index: fileSpecs.index,
                    finishState: true,
                    downloadUrl: fileSpecs.fileUrl
                })).to.be.true;
            });
        });
    });
});
