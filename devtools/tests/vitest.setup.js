/* eslint-disable no-empty-function */
import mapCollection from "../../src/core/maps/js/mapCollection.js";
import proj4 from "proj4";
import {unregister as unregisterProjections} from "ol/proj/proj4.js";
import {reset as resetUniqueId} from "@shared/js/utils/uniqueId.js";
import testConfig from "./testConfig.js";
import sinon from "sinon";
import {expect} from "chai";
import {enableAutoUnmount, config} from "@vue/test-utils";
import {vi, beforeAll as vitestBeforeAll, afterAll as vitestAfterAll, beforeEach as vitestBeforeEach, afterEach as vitestAfterEach, test as vitestTest, it as vitestIt} from "vitest";
import {createPinia, setActivePinia} from "pinia";

// Enable auto-unmount once
if (!globalThis.__vitest_auto_unmount_initialized__) {
    enableAutoUnmount(vitestAfterEach);
    globalThis.__vitest_auto_unmount_initialized__ = true;
}

if (!globalThis.ResizeObserver) {
    global.ResizeObserver = class ResizeObserver {
        /**
         *
         */
        observe () {}
        /**
         *
         */
        unobserve () {}
        /**
         *
         */
        disconnect () {}
    };
}

globalThis.fetch = async (url) => {
    throw new Error(`⚠️  MUST BE FIXED WARNING: fetch shall be mocked in tests: ${url}`);
};

globalThis.XMLHttpRequest = class {
    /**
     *
     */
    open () {
        throw new Error("⚠️  MUST BE FIXED WARNING:  XMLHttpRequest shall be mocked in tests!");
    }
    /**
     *
     */
    send () {
        this.onload && this.onload();
    }
    /**
     *
     */
    setRequestHeader () {}
    // add other methods/properties as needed
    /**
     *
     */
    get responseText () {
        return "{\"mock\":\"data\"}";
    }
    /**
     *
     */
    get status () {
        return 200;
    }
};


// Mock the useTranslation composable from i18next-vue and mock i18next
const i18nextMock = {
    t: (key) => {
        return replaceNameSpaceInLocalesKey(key);
    },
    language: "de",
    changeLanguage: vi.fn((language, callback) => {
        i18nextMock.language = language;
        if (callback) {
            // eslint-disable-next-line n/callback-return
            callback();
        }
    }),
    init: vi.fn(),
    exists: vi.fn()
};

vi.mock("i18next-vue", () => ({
    useTranslation: () => ({
        t: (key) => {
            return replaceNameSpaceInLocalesKey(key);
        },
        $t: (key) => {
            return replaceNameSpaceInLocalesKey(key);
        },
        i18n: {language: "de"}
    })
}));
vi.mock("i18next", () => {
    return {
        ...i18nextMock,
        default: i18nextMock
    };
});

// Provide a deterministic draggable stub for jsdom tests.
// The real vuedraggable bundle touches document.currentScript at import-time.
vi.mock("vuedraggable", async () => {
    const {defineComponent, h} = await import("vue");

    return {
        default: defineComponent({
            // eslint-disable-next-line vue/multi-word-component-names
            name: "Draggable",
            props: {
                modelValue: {
                    type: Array,
                    default: undefined
                },
                list: {
                    type: Array,
                    default: undefined
                },
                tag: {
                    type: String,
                    default: "div"
                }
            },
            emits: ["update:modelValue", "change", "start", "end", "add", "remove"],
            setup (props, {slots, attrs}) {
                return () => {
                    let source;

                    if (Array.isArray(props.modelValue)) {
                        source = props.modelValue;
                    }
                    else if (Array.isArray(props.list)) {
                        source = props.list;
                    }
                    else {
                        source = [];
                    }
                    const itemChildren = slots.item
                        ? source.flatMap((element, index) => slots.item({element, index}) || [])
                        : [];
                    const defaultChildren = slots.default ? slots.default() : [];

                    return h(props.tag || "div", attrs, [...defaultChildren, ...itemChildren]);
                };
            }
        })
    };
});

/**
 * Removes the namespace from the given locales key.
 * @param {String} key of to translate
 * @returns {String} the key without namespace
 */
function replaceNameSpaceInLocalesKey (key) {
    if (key.startsWith("common:")) {
        return key.replace("common:", "");
    }
    if (key.startsWith("additional:")) {
        return key.replace("additional:", "");
    }
    return key;
}


// Mock $t and t for all components (template and script)
config.global.mocks = config.global.mocks || {};

config.global.mocks.t = key => key;
config.global.mocks.$t = key => key;

// Provide a fresh, active Pinia instance for every test so components and
// stores that have been migrated to Pinia work without per-test boilerplate.
// Note: We only set the active Pinia and do NOT push it into
// config.global.plugins. Pinia stores resolve via the active instance, so this
// avoids installing Pinia twice (which happens when a spec passes its own Pinia
// in the plugins array) and the resulting "App already provides property with
// key Symbol(pinia)" warning.
vitestBeforeEach(() => {
    setActivePinia(createPinia());
});

if (typeof globalThis.CanvasPattern === "undefined") {
    globalThis.CanvasPattern = function () {};
}

// Mock navigation methods to prevent jsdom errors
if (typeof window !== "undefined") {
    // Use a real Event constructor polyfill instead of vi.fn()
    window.Event = window.Event || function (type, params) {
        const event = document.createEvent("Event");

        event.initEvent(type, params?.bubbles ?? false, params?.cancelable ?? false);
        return event;
    };

    window.matchMedia = window.matchMedia || (() => ({
        matches: false,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {}
    }));

    window.scrollTo = window.scrollTo || (() => {});
    window.getComputedStyle = window.getComputedStyle || (() => ({
        getPropertyValue: () => ""
    }));
}

// Cesium and Chart.js mocks are in separate opt-in files:
// - devtools/tests/cesiumMocks.js (for Cesium/OLCS/widgets)
// - devtools/tests/chartMocks.js (for Chart.js)
// Import them only in the spec files that need them.

/**
 * Wraps Vitest test functions to support legacy done-callback tests.
 * Supports test/it and wraps method variants (only, skip, fails, concurrent).
 * @param {Function} originalTestFn test function from Vitest
 * @param {Number} [callCount=1] current wrapping depth for method variants
 * @returns {Function} wrapped function
 */
function createDoneCallbackWrapper (originalTestFn, callCount = 1) {
    // Function expression is required so method variants can be attached after declaration.
    // eslint-disable-next-line func-style
    const wrappedTestFn = (name, fn, ...args) => {
        if (typeof fn !== "function") {
            return originalTestFn(name, fn, ...args);
        }
        if (fn.length > 0) {
            if (!globalThis.process?.env?.SILENT) {
                console.warn(`⚠️  DEPRECATION WARNING: Test "${name}" uses done callback. Please migrate to Promise-based async tests. This polyfill will be removed in a future version.`);
            }

            return originalTestFn(name, () => new Promise((resolve, reject) => {
                try {
                    const result = fn((error) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve();
                    });

                    if (result && typeof result.then === "function") {
                        result.then(resolve, reject);
                    }
                }
                catch (error) {
                    reject(error);
                }
            }), ...args);
        }
        return originalTestFn(name, fn, ...args);
    };

    if (callCount < 2) {
        ["only", "skip", "fails", "concurrent"].forEach((method) => {
            if (typeof originalTestFn?.[method] === "function") {
                wrappedTestFn[method] = createDoneCallbackWrapper(originalTestFn[method], callCount + 1);
            }
        });
    }

    if (typeof originalTestFn?.todo === "function") {
        wrappedTestFn.todo = originalTestFn.todo;
    }

    ["each", "skipIf", "runIf"].forEach((method) => {
        if (typeof originalTestFn?.[method] === "function") {
            wrappedTestFn[method] = originalTestFn[method];
        }
    });

    return wrappedTestFn;
}

// Create global polyfill functions that map Mocha hooks to Vitest hooks.
globalThis.before = (fn) => {
    if (!globalThis.process?.env?.SILENT) {
        console.warn("⚠️  DEPRECATION WARNING: 'before' hook is deprecated. Please use 'beforeAll' instead. This polyfill will be removed in a future version.");
    }
    return vitestBeforeAll(fn);
};

globalThis.after = (fn) => {
    if (!globalThis.process?.env?.SILENT) {
        console.warn("⚠️  DEPRECATION WARNING: 'after' hook is deprecated. Please use 'afterAll' instead. This polyfill will be removed in a future version.");
    }
    return vitestAfterAll(fn);
};

// beforeEach and afterEach are the same in both frameworks, but provide explicit mapping for consistency.
globalThis.beforeEach = globalThis.beforeEach || vitestBeforeEach;
globalThis.afterEach = globalThis.afterEach || vitestAfterEach;

globalThis.mapCollection = mapCollection;
globalThis.i18next = globalThis.i18next || i18nextMock;
globalThis.Config = testConfig.config;
globalThis.it = createDoneCallbackWrapper(globalThis.it || vitestIt);
globalThis.test = createDoneCallbackWrapper(globalThis.test || vitestTest);

// Also make them available as properties of global/window for different environments
if (typeof window !== "undefined") {
    window.before = globalThis.before;
    window.after = globalThis.after;
    window.beforeEach = globalThis.beforeEach;
    window.afterEach = globalThis.afterEach;
    window.mapCollection = globalThis.mapCollection;
    window.i18next = globalThis.i18next;
    window.Config = globalThis.Config;
    window.it = globalThis.it;
    window.test = globalThis.test;
}

// For Node.js environment
if (typeof global !== "undefined") {
    global.before = globalThis.before;
    global.after = globalThis.after;
    global.beforeEach = globalThis.beforeEach;
    global.afterEach = globalThis.afterEach;
    global.mapCollection = globalThis.mapCollection;
    global.i18next = globalThis.i18next;
    global.Config = globalThis.Config;
    global.it = globalThis.it;
    global.test = globalThis.test;
}

if (!globalThis.__vueTestUtilsSettings) {
    // renderStubDefaultSlot: https://test-utils.vuejs.org/migration/#shallowmount-and-renderstubdefaultslot
    config.global.renderStubDefaultSlot = true;
    globalThis.__vueTestUtilsSettings = true;
}

globalThis.beforeAll(() => {
    expect(mapCollection.count()).to.be.equals(0);
});

globalThis.afterAll(() => {
    mapCollection.clear();
    proj4.defs([]);
    unregisterProjections();
    resetUniqueId();
});

globalThis.afterEach(() => {
    sinon.restore();
});
