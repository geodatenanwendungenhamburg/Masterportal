import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import TsrComponent from "../../../../components/TSR/TsrItem.vue";
import TsrUpload from "../../../../components/TSR/TsrUpload.vue";

config.global.mocks.$t = key => key;

describe("src/modules/routing/components/TSR/TsrUpload.vue", () => {
    let mapInteractionMode,
        tsrDirections,
        store,
        wrapper;

    beforeEach(() => {
        mapInteractionMode = "WAYPOINTS";
        tsrDirections = null;

        mapCollection.clear();
        mapCollection.addMap({
            mode: "2D",
            mapMode: "2D"
        }, "2D");

        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing:
                        {
                            namespaced: true,
                            modules: {
                                TSR: {
                                    namespaced: true,
                                    getters: {
                                        isInputDisabled: () => false,
                                        mapInteractionMode: () => mapInteractionMode,
                                        routingAvoidFeaturesOptions: () => [],
                                        tsrDirections: () => tsrDirections,
                                        settings: () => {
                                            return {
                                                speedProfile: "CAR",
                                                tsrPointLimit: 5
                                            };
                                        },
                                        waypoints: () => [
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                getCoordinates: () => sinon.stub()
                                            },
                                            {
                                                index: sinon.stub(),
                                                getDisplayName: () => sinon.stub(),
                                                getCoordinates: () => sinon.stub()
                                            }
                                        ],
                                        getTSRSpeedProfiles: sinon.stub()
                                    },
                                    mutations: {
                                        setMapInteractionMode: sinon.stub(),
                                        setTsrDirections: sinon.stub()
                                    },
                                    actions: {
                                        createInteractionFromMapInteractionMode: sinon.stub(),
                                        initTSR: sinon.stub(),
                                        isStartEndInput: sinon.stub()
                                    }
                                }
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    mode: "2D"
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.stub()
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders TSRUpload", async () => {
        sinon.stub(TsrComponent.methods, "appendModalToBody");
        wrapper = shallowMount(TsrComponent, {global: {
            plugins: [store]
        }});

        expect(wrapper.findComponent(TsrUpload).exists()).to.be.true;
    });

    it("renders drag & drop field", async () => {
        wrapper = shallowMount(TsrUpload, {global: {
            plugins: [store]
        }});

        expect(wrapper.find("#fileUpload").exists()).to.be.true;
    });

    it("splits csv", () => {
        wrapper = shallowMount(TsrUpload, {global: {
            plugins: [store]
        }});

        const csv = "1;8.12;50.67;9.12;51.67\n7;8.12;50.99;9.99;51.99\n4;8.12;50.99;9.99;51.11\n1;8.12;50.99;9.99;51.22",
            csvSplit = wrapper.vm.splitCsv(csv);

        expect(csvSplit.length).to.equal(4);
    });

    it("validates correct file", async () => {
        const csv = `
        1;8.12;50.67
        1;8.13;50.68
        1;8.14;50.69
        1;8.15;50.70
        `;

        expect(await wrapper.vm.validateCsv(csv)).to.be.true;
    });
    it("validates invalid file", async () => {
        const invalidCsvString = `
        1;8.12;abc
        2;8.13;50.68
        `,
            invalidCsvOutOfRange = `
        1;-190;200
        2;8.13;50.68
        `,
            invalidCsvWrongNAttributes = `
        1;8.13;50.68
        2;8.12
        `,
            invalidCsvEmptyFields = `
        1;8.13;50.68
        2;;50.68
        `,
            invalidCsvEmptyLine = `
        1;8.13;50.68
        
        1;8.12;50.65
        `;

        expect(await wrapper.vm.validateCsv(invalidCsvString)
            .then(true)
            .catch(() => false)
        ).to.be.false;

        expect(await wrapper.vm.validateCsv(invalidCsvOutOfRange)
            .then(true)
            .catch(() => false)
        ).to.be.false;

        expect(await wrapper.vm.validateCsv(invalidCsvWrongNAttributes)
            .then(true)
            .catch(() => false)
        ).to.be.false;

        expect(await wrapper.vm.validateCsv(invalidCsvEmptyFields)
            .then(true)
            .catch(() => false)
        ).to.be.false;

        expect(await wrapper.vm.validateCsv(invalidCsvEmptyLine)
            .then(true)
            .catch(() => false)
        ).to.be.false;
    });

    it("checks file type", () => {
        const validFile = new File([""],
                "valid.csv",
                {
                    lastModified: 1699276519681,
                    webkitRelativePath: "",
                    size: 81,
                    type: "text/csv"
                }),
            invalidFile = new File([""],
                "invalid.csv",
                {
                    lastModified: 1699276519681,
                    webkitRelativePath: "",
                    size: 81,
                    type: "image/jpeg"
                });

        expect(wrapper.vm.checkFileType(validFile)).to.be.true;
        expect(wrapper.vm.checkFileType(invalidFile)).to.be.false;
    },

    it("checks tsr point limit", async () => {
        const csvTooManyPoints = `
        1;8.12;50.67
        1;8.13;50.68
        1;8.14;50.69
        1;8.15;50.71
        1;8.15;50.72
        1;8.15;50.73
        `;

        expect(await wrapper.vm.validateCsv(csvTooManyPoints)
            .then(true)
            .catch(() => false)
        ).to.be.false;
    })
    );
});
