import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import store from "@appstore/index.js";
import objectHash from "object-hash";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

dayjs.extend(duration);

/**
 * Finds an alert by hash value
 * @param {Object[]} haystackAlerts an array of objects{hash, ...} with the alerts
 * @param {String} needleHash Hash of the wanted alert
 * @returns {Object|Boolean} Retrieved alert or false, if nothing found
 */
function findSingleAlertByHash (haystackAlerts, needleHash) {
    const foundAlerts = haystackAlerts.filter(singleAlert => singleAlert.hash === needleHash);

    return foundAlerts.length ? foundAlerts[0] : false;
}
/**
 * Checks if an alert should be displayed considerung its .displayFrom and .displayUntil properties.
 * @param {Object} alertToCheck The alert to check
 * @returns {Boolean} True if its defined timespan includes current time
 */
function checkAlertLifespan (alertToCheck) {
    if (alertToCheck.displayFrom === false && alertToCheck.displayUntil === false) {
        return true;
    }

    return (!alertToCheck.displayFrom || dayjs().isAfter(alertToCheck.displayFrom)) && (!alertToCheck.displayUntil || dayjs().isBefore(alertToCheck.displayUntil));

}
/**
 * Checks if an alert hash exists in localStorage.
 * Supports both object and array serialization to stay compatible with existing data.
 * @param {string} storageKey localStorage key for displayed alerts.
 * @param {string} alertHash hash to check.
 * @returns {boolean} true if hash is already stored.
 */
function hasDisplayedAlertHashInStorage (storageKey, alertHash) {
    const rawStoredAlerts = localStorage[storageKey];

    if (typeof rawStoredAlerts !== "string" || rawStoredAlerts.length < 1) {
        return false;
    }

    try {
        const parsedStoredAlerts = JSON.parse(rawStoredAlerts);

        if (Array.isArray(parsedStoredAlerts)) {
            return parsedStoredAlerts.includes(alertHash);
        }

        if (parsedStoredAlerts && typeof parsedStoredAlerts === "object") {
            return Object.hasOwn(parsedStoredAlerts, alertHash);
        }
    }
    catch {
        return rawStoredAlerts.includes(alertHash);
    }

    return false;
}

/**
 * Checks if an already displayed alert may be displayed again.
 * @param {Object} alertToCheck The alert to check as object{hash, once, ...}
 * @param {Object} [seenInSessionAlerts={}] hash-keyed map of onceInSession alerts already shown in the current session
 * @returns {Boolean} True if the given alert may be displayed again
 */
function checkAlertViewRestriction (alertToCheck, seenInSessionAlerts = {}) {
    const storageKey = store.getters["Alerting/localStorageDisplayedAlertsKey"];
    const isModuleOpenAlert = typeof alertToCheck.displayOnEvent === "object" &&
        alertToCheck.displayOnEvent?.type === "Menu/changeCurrentComponent";

    // if hash is already in localStorage then alert is not shown
    if (hasDisplayedAlertHashInStorage(storageKey, alertToCheck.hash)) {
        return false;
    }

    // onceInSession alerts must not reappear after they have been cleaned up from state.alerts
    if (alertToCheck.onceInSession === true && Object.hasOwn(seenInSessionAlerts, alertToCheck.hash)) {
        return false;
    }

    // displayed, but not restricted to display multiple times
    if (alertToCheck.once === false || alertToCheck.once === undefined) {
        return true;
    }

    // for initial alerts and other legacy alerts: keep old once behavior (persist immediately)
    // for module-open alerts: persist once only after explicit confirmation
    if (alertToCheck.once === true && (!isModuleOpenAlert || alertToCheck.mustBeConfirmed !== true)) {
        store.commit("Alerting/addToDisplayedAlerts", alertToCheck);
    }

    return true;

}

/**
 * Resolves configured alert text. If an i18n key is provided, translated text is returned.
 * @param {string} text configured text or i18n key.
 * @returns {string} resolved text.
 */
function resolveAlertText (text) {
    if (typeof text !== "string" || text.length < 1) {
        return "";
    }

    if (text.startsWith("common:") || text.startsWith("additional:")) {
        return i18next.t(text);
    }

    return text;
}

/**
 * Builds a stable hash seed for alert de-duplication and once/localStorage behavior.
 * Includes event-related fields so config changes (e.g. module type) create a new hash.
 * @param {Object} alert alert object to hash.
 * @returns {string} hash seed string.
 */
function buildAlertHashSeed (alert) {
    return objectHash({
        alertId: alert.alertId,
        content: alert.content,
        title: alert.title,
        category: alert.category,
        displayFrom: alert.displayFrom,
        displayUntil: alert.displayUntil,
        displayOnEvent: alert.displayOnEvent,
        moduleType: alert.moduleType,
        modul: alert.modul
    });
}

/**
 * Checks whether the given object is a module-open alert definition.
 * @param {Object} alertCandidate candidate object.
 * @returns {boolean} true if object looks like a module-open alert definition.
 */
function isModuleOpenAlertDefinition (alertCandidate) {
    return alertCandidate && typeof alertCandidate === "object" &&
        (typeof alertCandidate.moduleType === "string" || typeof alertCandidate.modul === "string") &&
        typeof alertCandidate.content === "string";
}

export default {
    /**
     * Registers module-open alerts from config.js alerting.moduleOpenAlerts.
     * Accepts either an object map or an array of alert definitions.
     * @param {Object} context the vuex context.
     * @param {Function} context.dispatch the dispatch function.
     * @param {Object|Object[]} moduleOpenAlerts alert definitions to register.
     * @returns {void}
     */
    addModuleOpenAlertsFromConfig ({dispatch}, moduleOpenAlerts) {
        if (!moduleOpenAlerts || typeof moduleOpenAlerts !== "object") {
            return;
        }

        let alertList = [];

        if (Array.isArray(moduleOpenAlerts)) {
            alertList = moduleOpenAlerts;
        }
        else if (isModuleOpenAlertDefinition(moduleOpenAlerts)) {
            alertList = [moduleOpenAlerts];
        }
        else {
            alertList = Object.entries(moduleOpenAlerts).map(([alertId, moduleOpenAlert]) => ({
                ...moduleOpenAlert,
                alertId
            }));
        }

        alertList.forEach(moduleOpenAlert => {
            if (moduleOpenAlert && typeof moduleOpenAlert === "object") {
                dispatch("addSingleAlertOnModuleOpen", moduleOpenAlert);
            }
        });
    },

    /**
     * Registers an alert that is displayed when a specific module is opened via menu navigation.
     * If the module is already open, the event alert is triggered immediately.
     * @param {Object} context the vuex context.
     * @param {Function} context.dispatch the dispatch function.
     * @param {Object} context.rootState the root state.
     * @param {Object} payload payload for the module-open alert.
     * @param {string} [payload.alertId] optional stable config identifier for hash generation.
     * @param {string} payload.moduleType type of the module, e.g. "compareFeatures".
     * @param {string} payload.content alert content text.
     * @param {string} [payload.title=""] optional alert title.
     * @param {string} [payload.category="info"] alert category.
     * @returns {void}
     */
    addSingleAlertOnModuleOpen ({dispatch}, {alertId, moduleType, modul, content, title = "", category = "info", mustBeConfirmed = false, once = true, onceInSession = true, displayFrom, displayUntil} = {}) {
        const configuredModuleType = typeof modul === "string" && modul.length > 0 ? modul : moduleType;

        if (typeof configuredModuleType !== "string" || configuredModuleType.length < 1 || typeof content !== "string" || content.length < 1) {
            return;
        }

        dispatch("addSingleAlert", {
            alertId,
            category,
            moduleType: configuredModuleType,
            title: resolveAlertText(title),
            content: resolveAlertText(content),
            displayFrom,
            displayUntil,
            initial: true,
            initialConfirmed: mustBeConfirmed,
            mustBeConfirmed,
            once,
            onceInSession,
            displayOnEvent: {
                type: "Menu/changeCurrentComponent",
                value: {
                    type: configuredModuleType
                }
            }
        });

        const menuStore = useMenuStore();

        if (menuStore.mainMenu.currentComponent === configuredModuleType ||
            menuStore.secondaryMenu.currentComponent === configuredModuleType) {
            dispatch("activateDisplayOnEventAlerts", {
                type: "Menu/changeCurrentComponent",
                payload: {
                    type: configuredModuleType
                }
            });
        }
    },

    /**
     * Updates localStorage with read and once:true alerts, set displayed alerts as displayed and hide modal.
     * @param {Object} state state
     * @param {Object} commit commit
     * @returns {void}
     */
    cleanup: function ({state, commit}, {visibleAlertHashes} = {}) {
        const storageKey = state.localStorageDisplayedAlertsKey,
            hasVisibleFilter = Array.isArray(visibleAlertHashes);

        state.alerts.forEach(singleAlert => {
            if (hasVisibleFilter && !visibleAlertHashes.includes(singleAlert.hash)) {
                return;
            }

            if (!singleAlert.mustBeConfirmed && singleAlert.initialConfirmed !== false && singleAlert.initial !== undefined && singleAlert.once === true) {
                commit("addToDisplayedAlerts", singleAlert);
                commit("removeFromAlerts", singleAlert);
            }
            else if (!singleAlert.mustBeConfirmed && singleAlert.onceInSession === true) {
                commit("addToSeenInSessionAlerts", singleAlert);
                commit("removeFromAlerts", singleAlert);
            }
        });

        if (localStorage[storageKey]) {
            localStorage[storageKey] = JSON.stringify({...state.displayedAlerts, ...JSON.parse(localStorage[storageKey])});
        }
        else {
            localStorage[storageKey] = JSON.stringify(state.displayedAlerts);
        }
        commit("setReadyToShow", false);

    },
    /**
     * Marks a single alert as un/read. Triggers callback function if defined.
     * @param {Object} state state
     * @param {String} hash Hash of read alert
     * @returns {void}
     */
    alertHasBeenRead: function ({state, commit}, hash) {
        const singleAlert = findSingleAlertByHash(state.alerts, hash);

        if (singleAlert !== false) {
            if (singleAlert.mustBeConfirmed === true) {
                commit("setAlertAsRead", singleAlert);
            }
            else {
                commit("setAlertAsUnread", singleAlert);
            }
        }
    },
    /**
     * Checks a new alert object, if it may be added to alerting queue. This includes checking, if
     *  1: alert is already in queue
     *  2: alert is limited to be displayed in a past time
     *  3: alert is limited to be display in the future
     *  4: alert has already been read and is not ready to be displayed again yet
     *  5: allows multiple alerts from newsFeedPortaljson (singleAlert.multipleAlert = true) in state.alerts.
     * @param {Object} state state
     * @param {Object} newAlert alert object to be added to queue
     * @returns {void}
     */
    addSingleAlert: function ({state, commit}, newAlert) {
        const newAlertObj = typeof newAlert === "string" ? {content: newAlert} : newAlert,
            alertProtoClone = {...state.alertProto},
            hasInitAlert = state.alerts.some(function (alert) {
                return alert.initial === true;
            });

        let category,
            isUnique = false,
            onceInSession = false,
            isNotRestricted = false,
            isInTime = false,
            displayAlert = false;

        if (newAlertObj === undefined) {
            return false;
        }

        if (newAlertObj?.category !== undefined) {
            category = newAlertObj.category.toLowerCase();
        }

        if (state.availableCategories.includes(category)) {
            newAlertObj.displayCategory = `common:modules.alerting.categories.${category}`;
        }
        else if (newAlertObj.category === undefined || newAlertObj.category === "") {
            newAlertObj.displayCategory = "info";
        }
        else {
            newAlertObj.displayCategory = newAlertObj.category;
        }

        // in case its not an object with a non empty string at .content, dont continue
        if (typeof newAlertObj.content !== "string" || newAlertObj.content.length < 1) {
            console.warn("Alert cancelled, bad content value:", newAlertObj.content);
            return false;
        }
        for (const key in newAlertObj) {
            alertProtoClone[key] = newAlertObj[key];
        }

        alertProtoClone.hash = buildAlertHashSeed(alertProtoClone);
        isUnique = findSingleAlertByHash(state.alerts, alertProtoClone.hash) === false;
        onceInSession = !isUnique ? alertProtoClone.onceInSession : false;
        isInTime = checkAlertLifespan(alertProtoClone);
        isNotRestricted = checkAlertViewRestriction(alertProtoClone, state.seenInSessionAlerts);

        if (alertProtoClone.isNews) {
            commit("Modules/News/addNews", alertProtoClone, {root: true});
        }

        if (typeof alertProtoClone.displayOnEvent === "object") {
            commit("addToDisplayOnEventList", alertProtoClone.displayOnEvent);
        }

        displayAlert = isUnique && isInTime && isNotRestricted;
        if (displayAlert) {
            if ((newAlert.multipleAlert !== true && !newAlert.initial && state.initialClosed === true) || (newAlert.multipleAlert === true && hasInitAlert === true && state.initialClosed === true)) {
                state.alerts = state.alerts.filter(singleAlert => Object.hasOwn(singleAlert, "displayOnEvent"));
            }
            if (!hasDisplayedAlertHashInStorage(state.localStorageDisplayedAlertsKey, alertProtoClone.hash)) {
                commit("addToAlerts", alertProtoClone);
            }
        }
        // even if current alert got seeded out, there still might be another one in the pipe
        if (state.alerts.length > 0) {
            if (findSingleAlertByHash(state.alerts, alertProtoClone.hash) !== false && isInTime && isNotRestricted && !onceInSession) {
                // this is necessary because this action returned false even if the alert was displayed
                displayAlert = true;
            }

            if (displayAlert) {
                commit("setReadyToShow", true);
            }
        }

        return displayAlert;
    },

    /**
     * Loops trough defined alerts from config.js and add it to the alerting module.
     * @param {Object} context the vue context
     * @param {Object} context.dispatch the commit
     * @param {Object} alerts object with defined alerts
     * @returns {void}
     */
    addAlertsFromConfig ({dispatch}, alerts) {
        Object.values(alerts).forEach((value) => {
            value.initial = true;
            value.isNews = true;
            value.initialConfirmed = value.mustBeConfirmed;
            dispatch("addSingleAlert", value);
        });
    },
    /**
     * Check if a current event has alert items and activate them.
     * @param {Object} state state
     * @param {Object} action Event type and value to check for alertsOnEvent items
     * @returns {void}
     */
    activateDisplayOnEventAlerts ({state, commit}, action) {
        state.alertsOnEvent = [];

        state.alerts.forEach((alert) => {
            let displayProps;

            if (Object.hasOwn(alert, "displayOnEvent")) {
                displayProps = alert.displayOnEvent;

                if (action.type === displayProps.type) {
                    if (typeof displayProps.value === "string" && displayProps.value === action.payload) {
                        state.alertsOnEvent.push(alert);
                    }
                    else if (typeof displayProps.value === "object" &&
                        Object.entries(displayProps.value).every(([key, value]) => action.payload[key] === value)
                    ) {
                        state.alertsOnEvent.push(alert);
                    }
                }
            }
        });

        commit("setReadyToShow", true);
    }
};
