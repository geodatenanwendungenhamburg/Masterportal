import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import sinon from "sinon";
import actions from "@modules/about/store/actionsAbout.js";
import packageJson from "../../../../../../package.json";

const {initializeAboutInfo, currentMasterportalVersionNumber} = actions;

afterEach(() => {
    sinon.restore();
});

describe("src/modules/layerInformation/store/actionsAbout.js", () => {
    describe("initialize the store", () => {
        it("should show the about module in menu", async () => {
            const state = {
                    metaId: "portalId",
                    cswUrl: "test.de"
                },
                rootGetters = {
                    isMobile: false,
                    "Menu/expanded": () => true
                },
                cswReturn = {
                    getTitle: () => "name",
                    getAbstract: () => "abstract",
                    getContact: () => "contact"
                },
                commit = sinon.spy(),
                dispatch = sinon.spy();

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            await initializeAboutInfo({commit, dispatch, state, rootGetters});

            expect(commit.getCall(0).args).to.deep.equal(["setTitle", "name"]);
            expect(commit.getCall(1).args).to.deep.equal(["setAbstractText", "abstract"]);
            expect(commit.getCall(2).args).to.deep.equal(["setContact", "contact"]);
            expect(dispatch.calledWith("currentMasterportalVersionNumber")).to.be.true;
        });

        it("should set the masterportal version from state, if version is a string", async () => {
            const state = {
                    version: "3.4.0"
                },
                commit = sinon.spy();

            currentMasterportalVersionNumber({commit, state});

            expect(commit.calledWith("setVersion", "3.4.0")).to.be.true;
        });

        it("should set the masterportal version from package.json, if version is true", async () => {
            const state = {
                    version: true
                },
                commit = sinon.spy();

            currentMasterportalVersionNumber({commit, state});

            expect(commit.calledWith("setVersion", packageJson.version)).to.be.true;
        });
        it("should NOT call CSW if cswUrl is empty", async () => {
            const state = {
                metaId: "portalId",
                cswUrl: ""
            };

            const spy = sinon.spy(getCswRecordById, "getRecordById");

            await initializeAboutInfo({commit: () => {
                null;
            }, dispatch: () => {
                null;
            }, state, rootGetters: {}});

            sinon.assert.notCalled(spy);
        });
        it("should NOT overwrite existing abstractText if metadata is missing", async () => {
            const commit = sinon.spy();

            const state = {
                metaId: "portalId",
                cswUrl: null,
                abstractText: "existing text"
            };

            await initializeAboutInfo({
                commit,
                dispatch: () => {
                    null;
                },
                state,
                rootGetters: {}
            });

            const calls = commit.getCalls().map(c => c.args[0]);

            if (calls.includes("setAbstractText")) {
                throw new Error("abstractText should not be overwritten");
            }
        });
        it("should use publisher if contact is not available", async () => {
            const state = {
                    metaId: "portalId",
                    cswUrl: "test.de"
                },
                cswReturn = {
                    getTitle: () => "name",
                    getAbstract: () => "abstract",
                    getContact: () => null,
                    getPublisher: () => "publisher"
                },
                commit = sinon.spy(),
                dispatch = sinon.spy();

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            await initializeAboutInfo({commit, dispatch, state, rootGetters: {}});

            expect(commit.getCall(0).args).to.deep.equal(["setTitle", "name"]);
            expect(commit.getCall(1).args).to.deep.equal(["setAbstractText", "abstract"]);
            expect(commit.getCall(2).args).to.deep.equal(["setContact", "publisher"]);
            expect(dispatch.calledWith("currentMasterportalVersionNumber")).to.be.true;
        });
    });
});
