import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import sinon from "sinon";
import {createPinia, setActivePinia} from "pinia";
import {useAboutStore} from "@modules/about/store/aboutStore.pinia.js";
import packageJson from "../../../../../../package.json";


describe("src/modules/about/store/actionsAbout.js", () => {
    let aboutStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        aboutStore = useAboutStore();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("initialize the store", () => {
        it("should load metadata from CSW", async () => {
            aboutStore.$patch({
                metaId: "portalId",
                cswUrl: "test.de"
            });

            const cswReturn = {
                getTitle: () => "name",
                getAbstract: () => "abstract",
                getContact: () => "contact"
            };

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            await aboutStore.initializeAboutInfo();

            expect(aboutStore.title).to.equal("name");
            expect(aboutStore.abstractText).to.equal("abstract");
            expect(aboutStore.contact).to.equal("contact");
        });

        it("should set the masterportal version from state, if version is a string", () => {
            aboutStore.$patch({version: "3.4.0"});

            aboutStore.currentMasterportalVersionNumber();

            expect(aboutStore.version).to.equal("3.4.0");
        });

        it("should set the masterportal version from package.json, if version is true", () => {
            aboutStore.$patch({version: true});

            aboutStore.currentMasterportalVersionNumber();

            expect(aboutStore.version).to.equal(packageJson.version);
        });

        it("should NOT call CSW if cswUrl is empty", async () => {
            aboutStore.$patch({
                metaId: "portalId",
                cswUrl: ""
            });

            const spy = sinon.spy(getCswRecordById, "getRecordById");

            await aboutStore.initializeAboutInfo();

            sinon.assert.notCalled(spy);
        });

        it("should NOT overwrite existing abstractText if metadata is missing", async () => {
            aboutStore.$patch({
                metaId: "portalId",
                cswUrl: "",
                abstractText: "existing text"
            });

            await aboutStore.initializeAboutInfo();

            expect(aboutStore.abstractText).to.equal("existing text");
        });

        it("should use publisher if contact is not available", async () => {
            aboutStore.$patch({
                metaId: "portalId",
                cswUrl: "test.de"
            });

            const cswReturn = {
                getTitle: () => "name",
                getAbstract: () => "abstract",
                getContact: () => null,
                getPublisher: () => "publisher"
            };

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            await aboutStore.initializeAboutInfo();

            expect(aboutStore.title).to.equal("name");
            expect(aboutStore.abstractText).to.equal("abstract");
            expect(aboutStore.contact).to.equal("publisher");
        });
    });
});
