import {expect} from "chai";
import sinon from "sinon";

import httpClientModule from "@modules/contact/js/httpClient.js";
import actions from "@modules/contact/store/actionsContact.js";

const {onSendSuccess, send} = actions;

describe("src/modules/contact/store/actionsContact.js", () => {
    describe("onSendSuccess", () => {
        const payload = "0401-TICK-ETID";
        let state;

        beforeEach(() => {
            state = {
                id: "contact",
                closeAfterSend: true,
                deleteAfterSend: true,
                withTicketNo: true
            };
        });

        afterEach(() => {
            sinon.restore();
        });

        it("calls all expected commits and dispatches when configured to do so", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                rootGetters = {"Menu/currentComponent": () => ({type: ""})};

            onSendSuccess({commit, dispatch, state, rootGetters}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "success",
                content: i18next.t("common:modules.contact.successMessage") +
                    "\r\n" +
                    i18next.t("common:modules.contact.successTicket") +
                    payload
            })).to.be.true;
            expect(commit.calledWith("setPrivacyPolicyAccepted", false)).to.be.true;
            expect(commit.calledWith("setMail", "")).to.be.true;
            expect(commit.calledWith("setMessage", "")).to.be.true;
            expect(commit.calledWith("setPhone", "")).to.be.true;
            expect(commit.calledWith("setUsername", "")).to.be.true;
        });

        it("builds reduced alert message when configured so", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                rootGetters = {"Menu/currentComponent": () => ({type: ""})};

            state.withTicketNo = false;

            onSendSuccess({commit, dispatch, state, rootGetters}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "success",
                content: i18next.t("common:modules.contact.successMessage")
            })).to.be.true;
            expect(commit.calledWith("setPrivacyPolicyAccepted", false)).to.be.true;
            expect(commit.calledWith("setMail", "")).to.be.true;
            expect(commit.calledWith("setMessage", "")).to.be.true;
            expect(commit.calledWith("setPhone", "")).to.be.true;
            expect(commit.calledWith("setUsername", "")).to.be.true;
        });

        it("doesn't reset form when configured so", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                rootGetters = {"Menu/currentComponent": () => ({type: ""})};

            state.deleteAfterSend = false;

            onSendSuccess({commit, dispatch, state, rootGetters}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "success",
                content: i18next.t("common:modules.contact.successMessage") +
                    "\r\n" +
                    i18next.t("common:modules.contact.successTicket") +
                    payload
            })).to.be.true;
            expect(commit.calledWith("setPrivacyPolicyAccepted", false)).to.be.true;
        });

        it("doesn't close form when configured so", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            state.closeAfterSend = false;

            onSendSuccess({commit, dispatch, state}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "success",
                content: i18next.t("common:modules.contact.successMessage") +
                    "\r\n" +
                    i18next.t("common:modules.contact.successTicket") +
                    payload
            })).to.be.true;
            expect(commit.calledWith("setPrivacyPolicyAccepted", false)).to.be.true;
            expect(commit.calledWith("setMail", "")).to.be.true;
            expect(commit.calledWith("setMessage", "")).to.be.true;
            expect(commit.calledWith("setPhone", "")).to.be.true;
            expect(commit.calledWith("setUsername", "")).to.be.true;
        });
    });

    describe("send", () => {
        let state;

        beforeEach(() => {
            state = {
                from: Symbol.for("from"),
                to: Symbol.for("to"),
                serviceId: "007",
                includeSystemInfo: true
            };
        });

        afterEach(() => {
            sinon.restore();
        });

        it("creates httpClient call as expected", async () => {
            const httpClientStub = sinon.stub(httpClientModule, "httpClient");

            send({
                state,
                dispatch: sinon.spy(),
                getters: {
                    validForm: true
                },
                rootGetters: {
                    portalTitle: "Test",
                    restServiceById: id => id === "007" ? {url: "example.com"} : {}
                }
            });

            expect(httpClientStub.calledOnce).to.be.true;
            const [url, data] = httpClientStub.firstCall.args;

            expect(url).to.equal("example.com");
            expect(data.from).to.equal(Symbol.for("from"));
            expect(data.to).to.equal(Symbol.for("to"));
            expect(data.subject).to.be.a("string");
            expect(data.text).to.be.a("string");
        });

        it("creates httpClient call as expected if called with props", async () => {
            const props = {
                to: "abc@gv.hamburg.de",
                from: Symbol.for("from"),
                subject: "Anfrage zum Datensatz Schulstammdaten und Schülerzahlen der Hamburger Schulen",
                noConfigProps: true
            };
            const httpClientStub = sinon.stub(httpClientModule, "httpClient");

            send({
                state,
                dispatch: sinon.spy(),
                getters: {
                    validForm: true
                },
                rootGetters: {
                    portalTitle: "Test",
                    restServiceById: id => id === "007" ? {url: "example.com"} : {}
                }
            },
            props
            );

            expect(httpClientStub.calledOnce).to.be.true;
            const [url, data] = httpClientStub.firstCall.args;

            expect(url).to.equal("example.com");
            expect(data.from).to.equal(Symbol.for("from"));
            expect(data.to).to.equal("abc@gv.hamburg.de");
            expect(data.subject).to.be.a("string");
            expect(data.text).to.be.a("string");
        });
    });
});
