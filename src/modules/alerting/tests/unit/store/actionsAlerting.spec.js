import actions from "@modules/alerting/store/actionsAlerting.js";
import store from "@appstore/index.js";
import sinon from "sinon";
import {expect} from "chai";
import {createPinia, setActivePinia} from "pinia";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

describe("src/modules/alerting/store/actionsAlerting.js", () => {
    let commit,
        dispatch,
        storeCommitStub,
        pinia,
        menuStore;

    /**
 * Mock class for localStorage (used in tests)
 */
    class LocalStorageMock {
    /**
     * Internal store object
     * @type {Object}
     */
        constructor () {
            this.store = {};
        }
        /**
   * Clear all stored keys
   */
        clear () {
            this.store = {};
        }
        /**
   * Get an item by key
   * @param {string} key
   */
        getItem (key) {
        /**
   * @returns {string|null}
   */
            return Object.prototype.hasOwnProperty.call(this.store, key)
                ? this.store[key]
                : null;
        }
        /**
   * Set an item by key
   * @param {string} key
   * @param {string} value
   */
        setItem (key, value) {
            this.store[key] = String(value);
        }
        /**
   * Remove an item by key
   * @param {string} key
   */
        removeItem (key) {
            delete this.store[key];
        }
    }

    globalThis.localStorage = new LocalStorageMock();

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
        globalThis.localStorage.clear();
        storeCommitStub = sinon.stub(store, "commit");
        pinia = createPinia();
        setActivePinia(pinia);
        menuStore = useMenuStore();
    });

    afterEach(() => {
        storeCommitStub.restore();
    });


    it("cleanup", () => {
        const state = {
            alerts: [
                {
                    hash: "123",
                    initial: true,
                    mustBeConfirmed: false,
                    once: true
                }
            ]
        };

        actions.cleanup({state, commit});
        expect(commit.calledThrice).to.be.true;
        expect(commit.getCall(0).args).to.eql(["addToDisplayedAlerts", {hash: "123", initial: true, mustBeConfirmed: false, once: true}]);
        expect(commit.getCall(1).args).to.eql(["removeFromAlerts", {hash: "123", initial: true, mustBeConfirmed: false, once: true}]);
        expect(commit.getCall(2).args).to.eql(["setReadyToShow", false]);
    });

    it("cleanup with once:false", () => {
        const state = {
            alerts: [
                {
                    hash: "123",
                    initial: true,
                    mustBeConfirmed: false,
                    once: false
                }
            ]
        };

        actions.cleanup({state, commit});
        expect(commit.calledOnce).to.be.true;
        expect(commit.getCall(0).args).to.eql(["setReadyToShow", false]);
    });

    it("cleanup stores once:true alerts after they have been confirmed", () => {
        const state = {
            alerts: [
                {
                    hash: "123",
                    initial: true,
                    mustBeConfirmed: true,
                    once: true
                }
            ]
        };

        actions.alertHasBeenRead({state, commit}, "123");
        expect(commit.calledOnce).to.be.true;
        expect(commit.firstCall.args).to.eql(["setAlertAsRead", {hash: "123", initial: true, mustBeConfirmed: true, once: true}]);

        state.alerts[0].mustBeConfirmed = false;
        actions.cleanup({state, commit});

        expect(commit.callCount).to.equals(4);
        expect(commit.getCall(1).args).to.eql(["addToDisplayedAlerts", {hash: "123", initial: true, mustBeConfirmed: false, once: true}]);
        expect(commit.getCall(2).args).to.eql(["removeFromAlerts", {hash: "123", initial: true, mustBeConfirmed: false, once: true}]);
        expect(commit.getCall(3).args).to.eql(["setReadyToShow", false]);
    });

    it("cleanup with onceInSession:true moves alert to seenInSessionAlerts", () => {
        const state = {
            alerts: [
                {
                    hash: "123",
                    mustBeConfirmed: false,
                    once: false,
                    onceInSession: true
                }
            ]
        };

        actions.cleanup({state, commit});
        expect(commit.calledThrice).to.be.true;
        expect(commit.getCall(0).args).to.eql(["addToSeenInSessionAlerts", {hash: "123", mustBeConfirmed: false, once: false, onceInSession: true}]);
        expect(commit.getCall(1).args).to.eql(["removeFromAlerts", {hash: "123", mustBeConfirmed: false, once: false, onceInSession: true}]);
        expect(commit.getCall(2).args).to.eql(["setReadyToShow", false]);
    });

    it("cleanup does not move mustBeConfirmed:true onceInSession alerts", () => {
        const state = {
            alerts: [
                {
                    hash: "123",
                    mustBeConfirmed: true,
                    once: false,
                    onceInSession: true
                }
            ]
        };

        actions.cleanup({state, commit});
        expect(commit.calledOnce).to.be.true;
        expect(commit.getCall(0).args).to.eql(["setReadyToShow", false]);
    });

    it("setAlertAsRead", () => {
        const state = {
            alerts: [
                {
                    hash: "found",
                    mustBeConfirmed: true
                }
            ]
        };

        actions.alertHasBeenRead({state, commit}, "found");
        expect(commit.calledOnce).to.be.true;
        expect(commit.firstCall.args).to.eql(["setAlertAsRead", {hash: "found", mustBeConfirmed: true}]);
    });

    it("setAlertAsUnread", () => {
        const state = {
            alerts: [
                {
                    hash: "found",
                    mustBeConfirmed: false
                }
            ]
        };

        actions.alertHasBeenRead({state, commit}, "found");
        expect(commit.calledOnce).to.be.true;
        expect(commit.firstCall.args).to.eql(["setAlertAsUnread", {hash: "found", mustBeConfirmed: false}]);
    });

    it("addSingleAlert adds a valid alert", () => {
        const state = {
                alerts: [],
                displayedAlerts: [],
                availableCategories: ["news", "success", "warning", "error", "info"]
            },
            checkValue = actions.addSingleAlert({state, commit}, {hash: "123", content: "123", displayFrom: false, isNews: true});

        expect(checkValue).to.be.true;
        expect(commit.calledTwice).to.be.true;
        expect(commit.firstCall.args[0]).to.eql("Modules/News/addNews");
        expect(commit.firstCall.args[1].content).to.eql("123");
    });

    it("addSingleAlert stores once:true alerts immediately when mustBeConfirmed is false", () => {
        const state = {
                alerts: [],
                displayedAlerts: [],
                availableCategories: ["news", "success", "warning", "error", "info"]
            },
            checkValue = actions.addSingleAlert({state, commit}, {
                hash: "once-no-confirm",
                content: "123",
                displayFrom: false,
                once: true,
                mustBeConfirmed: false
            });

        expect(checkValue).to.be.true;
        expect(storeCommitStub.calledWith("Alerting/addToDisplayedAlerts")).to.be.true;
    });

    it("addSingleAlert stores once:true initial alerts immediately when mustBeConfirmed is true", () => {
        const state = {
                alerts: [],
                displayedAlerts: [],
                availableCategories: ["news", "success", "warning", "error", "info"]
            },
            checkValue = actions.addSingleAlert({state, commit}, {
                hash: "once-with-confirm",
                content: "123",
                displayFrom: false,
                once: true,
                mustBeConfirmed: true,
                initial: true
            });

        expect(checkValue).to.be.true;
        expect(storeCommitStub.calledWith("Alerting/addToDisplayedAlerts")).to.be.true;
    });

    it("addSingleAlert does not store module-open once:true alerts immediately when mustBeConfirmed is true", () => {
        const state = {
                alerts: [],
                displayedAlerts: [],
                availableCategories: ["news", "success", "warning", "error", "info"]
            },
            checkValue = actions.addSingleAlert({state, commit}, {
                hash: "module-open-with-confirm",
                content: "123",
                displayFrom: false,
                once: true,
                mustBeConfirmed: true,
                displayOnEvent: {
                    type: "Menu/changeCurrentComponent",
                    value: {
                        type: "print"
                    }
                }
            });

        expect(checkValue).to.be.true;
        expect(storeCommitStub.calledWith("Alerting/addToDisplayedAlerts")).to.be.false;
    });

    it("addSingleAlert doesnt show alert with not valid time restriction", () => {
        const state = {
                alerts: [],
                displayedAlerts: [],
                availableCategories: ["news", "success", "warning", "error", "info"]
            },
            checkValue = actions.addSingleAlert({state, commit}, {hash: "123", content: "123", "displayFrom": "2022-08-24 05:00", "displayUntil": "2022-09-28 23:59", isNews: true});

        expect(checkValue).to.be.false;
        expect(commit.calledOnce).to.be.true;
        expect(commit.firstCall.args[0]).to.eql("Modules/News/addNews");
        expect(commit.firstCall.args[1].content).to.eql("123");
    });

    it("addSingleAlert shows alert with valid time restriction", () => {
        const state = {
                alerts: [],
                displayedAlerts: [],
                availableCategories: ["news", "success", "warning", "error", "info"]
            },
            checkValue = actions.addSingleAlert({state, commit}, {hash: "123", content: "123", "displayFrom": "2022-08-24 05:00", "displayUntil": "2088-09-28 23:59", isNews: true});

        expect(checkValue).to.be.true;
        expect(commit.calledTwice).to.be.true;
        expect(commit.firstCall.args[0]).to.eql("Modules/News/addNews");
        expect(commit.firstCall.args[1].content).to.eql("123");
    });

    it("addSingleAlert does not re-add an alert already seen this session, even after it was cleaned up from state.alerts", () => {
        // pre-computed buildAlertHashSeed value for {content: "123", onceInSession: true, isNews: true, displayCategory: "info"} (see actionsAlerting.js)
        const expectedHash = "40c9c0e635a6b01d468a552d8d3e5465824fb02a",
            state = {
                alerts: [],
                displayedAlerts: [],
                seenInSessionAlerts: {[expectedHash]: true},
                availableCategories: ["news", "success", "warning", "error", "info"]
            },
            checkValue = actions.addSingleAlert({state, commit}, {content: "123", onceInSession: true, isNews: true});

        expect(checkValue).to.be.false;
        expect(state.alerts.length).to.eql(0);
    });

    it("addSingleAlert doesnt show alert with already existing hash", () => {
        const state = {
            alerts: [],
            displayedAlerts: [],
            availableCategories: ["news", "success", "warning", "error", "info"]
        };
        const newAlert = {
            isNews: true,
            content: "123",
            displayFrom: "2022-08-24 05:00",
            displayUntil: "2088-09-28 23:59"
        };

        actions.addSingleAlert({state, commit}, newAlert);
        state.alerts = [commit.getCalls().find(call => call.args[0] === "addToAlerts").args[1]];
        commit.resetHistory();

        actions.addSingleAlert({state, commit}, newAlert);

        expect(commit.calledTwice).to.be.true;
        expect(commit.firstCall.args[0]).to.eql("Modules/News/addNews");
        expect(commit.firstCall.args[1].content).to.eql("123");
        expect(commit.secondCall.args[0]).to.eql("setReadyToShow");
        expect(commit.secondCall.args[1]).to.be.true;
    });

    it("should only execute addNews if onceInSession === true and new alert already exists", () => {
        const state = {
            alerts: [],
            displayedAlerts: [],
            availableCategories: ["news", "success", "warning", "error", "info"]
        };
        const newAlert = {
            content: "123",
            displayFrom: "2022-08-24 05:00",
            displayUntil: "2088-09-28 23:59",
            onceInSession: true,
            isNews: true
        };

        actions.addSingleAlert({state, commit}, newAlert);
        state.alerts = [commit.getCalls().find(call => call.args[0] === "addToAlerts").args[1]];
        commit.resetHistory();

        actions.addSingleAlert({state, commit}, newAlert);

        expect(commit.calledOnce).to.be.true;
        expect(commit.firstCall.args[0]).to.eql("Modules/News/addNews");
        expect(commit.firstCall.args[1].content).to.eql("123");
    });

    it("addAlertsFromConfig", () => {
        actions.addAlertsFromConfig({dispatch}, {testAlert: {"title": "testAlert"}, testAlert2: {"title": "testAlert2"}});

        expect(dispatch.calledTwice).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equals("addSingleAlert");
        expect(dispatch.firstCall.args[1].title).to.equals("testAlert");
        expect(dispatch.secondCall.args[0]).to.equals("addSingleAlert");
        expect(dispatch.secondCall.args[1].title).to.equals("testAlert2");
    });

    it("addModuleOpenAlertsFromConfig registers alerts from object map", () => {
        actions.addModuleOpenAlertsFromConfig({dispatch}, {
            first: {
                modul: "compareFeatures",
                content: "test"
            }
        });

        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equals("addSingleAlertOnModuleOpen");
        expect(dispatch.firstCall.args[1].alertId).to.equals("first");
        expect(dispatch.firstCall.args[1].modul).to.equals("compareFeatures");
    });

    it("addModuleOpenAlertsFromConfig supports arrays", () => {
        actions.addModuleOpenAlertsFromConfig({dispatch}, [{
            moduleType: "print",
            content: "test"
        }]);

        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equals("addSingleAlertOnModuleOpen");
        expect(dispatch.firstCall.args[1].moduleType).to.equals("print");
    });

    it("addModuleOpenAlertsFromConfig supports single object without wrapper key", () => {
        actions.addModuleOpenAlertsFromConfig({dispatch}, {
            modul: "print",
            content: "test"
        });

        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equals("addSingleAlertOnModuleOpen");
        expect(dispatch.firstCall.args[1].modul).to.equals("print");
    });

    it("addModuleOpenAlertsFromConfig exits for invalid payload", () => {
        actions.addModuleOpenAlertsFromConfig({dispatch}, undefined);

        expect(dispatch.called).to.be.false;
    });

    it("addSingleAlertOnModuleOpen registers module-open alert and activates it when module is open", () => {
        menuStore.mainMenu.currentComponent = "compareFeatures";

        actions.addSingleAlertOnModuleOpen({dispatch}, {
            alertId: "compare-features-release",
            modul: "compareFeatures",
            title: "Compare",
            content: "test",
            displayFrom: "2024-01-01 00:00",
            displayUntil: "2099-01-01 00:00"
        });

        expect(dispatch.calledTwice).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equals("addSingleAlert");
        expect(dispatch.firstCall.args[1].alertId).to.equals("compare-features-release");
        expect(dispatch.firstCall.args[1].displayFrom).to.equals("2024-01-01 00:00");
        expect(dispatch.firstCall.args[1].displayUntil).to.equals("2099-01-01 00:00");
        expect(dispatch.firstCall.args[1].displayOnEvent.type).to.equals("Menu/changeCurrentComponent");
        expect(dispatch.firstCall.args[1].displayOnEvent.value.type).to.equals("compareFeatures");
        expect(dispatch.secondCall.args[0]).to.equals("activateDisplayOnEventAlerts");
    });

    it("addSingleAlertOnModuleOpen defaults mustBeConfirmed to false when omitted", () => {
        const rootState = {
            Menu: {
                mainMenu: {
                    currentComponent: "root"
                },
                secondaryMenu: {
                    currentComponent: "root"
                }
            }
        };

        actions.addSingleAlertOnModuleOpen({dispatch, rootState}, {
            moduleType: "populationRequest",
            title: "Routing",
            content: "Open the routing module to create and export a map printout.",
            once: true
        });

        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.firstCall.args[0]).to.equals("addSingleAlert");
        expect(dispatch.firstCall.args[1].mustBeConfirmed).to.be.false;
        expect(dispatch.firstCall.args[1].initialConfirmed).to.be.false;
        expect(dispatch.firstCall.args[1].once).to.be.true;
    });

    it("addSingleAlertOnModuleOpen exits for invalid payload", () => {
        const rootState = {
            Menu: {
                mainMenu: {
                    currentComponent: "root"
                },
                secondaryMenu: {
                    currentComponent: "root"
                }
            }
        };

        actions.addSingleAlertOnModuleOpen({dispatch, rootState}, {
            modul: "",
            content: ""
        });

        expect(dispatch.called).to.be.false;
    });

    describe("activateDisplayOnEventAlerts() init", () => {
        const state = {
            alerts: [{
                content: "test alert simple",
                displayOnEvent: {
                    "type": "test",
                    "value": "teststring"
                },
                onceInSession: true,
                once: false
            },
            {
                content: "test alert layer",
                displayOnEvent: {
                    "type": "showLayerAttributions",
                    "value": {
                        "id": "453",
                        "visibility": false
                    }
                },
                onceInSession: true,
                once: false
            },
            {
                content: "Second alerts for the same event",
                displayOnEvent: {
                    "type": "showLayerAttributions",
                    "value": {
                        "id": "453",
                        "visibility": false
                    }
                },
                onceInSession: true,
                once: false
            },
            {
                content: "default alert",
                onceInSession: true,
                once: false
            }]
        };

        it("event alert - event type A", () => {
            const action = {
                type: "test",
                payload: "teststring"
            };

            actions.activateDisplayOnEventAlerts({state, commit}, action);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.eql("setReadyToShow");
            expect(commit.firstCall.args[1]).to.eql(true);
            expect(state.alertsOnEvent.length).to.eql(1);
        });

        it("event alert - event type B - two alerts", () => {
            const action = {
                "type": "showLayerAttributions",
                "payload": {
                    "id": "453",
                    "visibility": false
                }
            };

            actions.activateDisplayOnEventAlerts({state, commit}, action);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.eql("setReadyToShow");
            expect(commit.firstCall.args[1]).to.eql(true);
            expect(state.alertsOnEvent.length).to.eql(2);
        });
    });
});
