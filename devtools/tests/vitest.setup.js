/* eslint-disable no-empty-function, n/no-process-env */
import mapCollection from "../../src/core/maps/js/mapCollection.js";
import testConfig from "./testConfig.js";
import i18next from "i18next";
import sinon from "sinon";
import {expect} from "chai";
import {enableAutoUnmount, config} from "@vue/test-utils";
import {vi, beforeAll as vitestBeforeAll, afterAll as vitestAfterAll, beforeEach as vitestBeforeEach, afterEach as vitestAfterEach, test as vitestTest, it as vitestIt} from "vitest";

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
        observe () {
        // do nothing
        }
        /**
         *
         */
        unobserve () {
        // do nothing
        }
        /**
         *
         */
        disconnect () {
        // do nothing
        }
    };
}

globalThis.fetch = async (url) => {
    console.warn("⚠️  MUST BE FIXED WARNING: fetch shall be mocked in tests: ", url);
    return {
        ok: true,
        status: 200,
        json: async () => ({ /* your mock data here */ }),
        text: async () => ""
    };
};

globalThis.XMLHttpRequest = class {
    /**
     *
     */
    open () {
        console.warn("⚠️  MUST BE FIXED WARNING: XMLHttpRequest shall be mocked in tests!");
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
    const mock = {
        t: (key) => {
            return replaceNameSpaceInLocalesKey(key);
        },
        language: "de",
        changeLanguage: vi.fn(),
        init: vi.fn(),
        exists: vi.fn()

    };

    return {
        ...mock,
        default: mock
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

// Comprehensive Cesium mocks to handle CommonJS/ESM compatibility issues
// Mock the main cesium package that OLCS actually imports from
vi.mock("cesium", () => ({
    default: {
        // Core Cesium classes that OLCS uses
        AutomaticUniforms: vi.fn(() => ({data: "mocked data"})),
        Viewer: vi.fn(),
        Scene: vi.fn(),
        Camera: vi.fn(),
        Globe: vi.fn(),
        Ellipsoid: vi.fn(),
        Cartesian3: vi.fn(),
        Matrix4: vi.fn(),
        Color: vi.fn(),
        Material: vi.fn(),
        Primitive: vi.fn(),
        GeometryInstance: vi.fn(),
        PerInstanceColorAppearance: vi.fn(),
        ClassificationType: vi.fn(),
        HeightReference: vi.fn(),
        VerticalOrigin: vi.fn(),
        HorizontalOrigin: vi.fn(),
        SceneMode: vi.fn(),
        ScreenSpaceEventHandler: vi.fn(),
        ScreenSpaceEventType: vi.fn(),
        KeyboardEventModifier: vi.fn(),
        CesiumTerrainProvider: vi.fn(),
        WebMercatorProjection: vi.fn(),
        GeographicProjection: vi.fn(),
        DataSource: vi.fn(),
        EntityCollection: vi.fn(),
        Entity: vi.fn(),
        CallbackProperty: vi.fn(),
        ConstantProperty: vi.fn(),
        SampledProperty: vi.fn(),
        TimeInterval: vi.fn(),
        TimeIntervalCollection: vi.fn(),
        JulianDate: vi.fn(),
        Clock: vi.fn(),
        ClockRange: vi.fn(),
        ClockStep: vi.fn()
    },
    // Named exports that OLCS expects
    AutomaticUniforms: vi.fn(() => ({data: "mocked data"})),
    Viewer: vi.fn(),
    Scene: vi.fn(),
    Camera: vi.fn(),
    Globe: vi.fn(),
    Ellipsoid: vi.fn(),
    Cartesian3: vi.fn(),
    Matrix4: vi.fn(),
    Color: vi.fn(),
    Material: vi.fn(),
    Primitive: vi.fn(),
    GeometryInstance: vi.fn(),
    PerInstanceColorAppearance: vi.fn(),
    ClassificationType: vi.fn(),
    HeightReference: vi.fn(),
    VerticalOrigin: vi.fn(),
    HorizontalOrigin: vi.fn(),
    SceneMode: vi.fn(),
    ScreenSpaceEventHandler: vi.fn(),
    ScreenSpaceEventType: vi.fn(),
    KeyboardEventModifier: vi.fn(),
    CesiumTerrainProvider: vi.fn(),
    WebMercatorProjection: vi.fn(),
    GeographicProjection: vi.fn(),
    DataSource: vi.fn(),
    EntityCollection: vi.fn(),
    Entity: vi.fn(),
    CallbackProperty: vi.fn(),
    ConstantProperty: vi.fn(),
    SampledProperty: vi.fn(),
    TimeInterval: vi.fn(),
    TimeIntervalCollection: vi.fn(),
    JulianDate: vi.fn(),
    Clock: vi.fn(),
    ClockRange: vi.fn(),
    ClockStep: vi.fn()
}));

// Mock chart.js, @cesium/engine, @cesium/widgets as fallback for any direct imports
vi.mock("chart.js", () => ({
    Chart: class {
        /**
         *
         */
        constructor (canvas, chartsConfig) {
            this.data = chartsConfig.data;
            this.destroy = vi.fn();
            this.update = vi.fn();
            this.render = vi.fn();
        }
    }
}));
vi.mock("@cesium/engine", () => ({
    default: {},
    AutomaticUniforms: vi.fn(() => ({data: "mocked data"}))
}));
vi.mock("@cesium/widgets", () => ({
    default: {}
}));

// Mocha-to-Vitest Polyfill for backward compatibility
// Maps Mocha hook names to Vitest hook names for 3rd party repos

/**
 * Done-callback to Promise polyfill for Mocha-style async tests.
 * Wraps test functions to support done callback while maintaining Promise compatibility.
 * @param {Object} originalTestFn the original test-function from vitest
 * @param {Number} [callCount=1] amount of calls to this function
 * @returns {Object} the polyfilled function
 */
function createDoneCallbackWrapper (originalTestFn, callCount = 1) {
    // eslint-disable-next-line func-style
    const wrappedTestFn = (name, fn, ...args) => {
        // If no test function provided, just pass through
        if (typeof fn !== "function") {
            return originalTestFn(name, fn, ...args);
        }

        // Check if function expects a 'done' callback (has more than 0 parameters)
        if (fn.length > 0) {
            if (!process.env.SILENT) {
                console.warn(`⚠️  DEPRECATION WARNING: Test "${name}" uses done callback. Please migrate to Promise-based async tests. This polyfill will be removed in a future version.`);
            }

            /**
             * Create a wrapper that returns a Promise
             */
            function wrappedFn () {
                return new Promise((resolve, reject) => {
                    try {
                        // Call the original function with the done callback
                        const result = fn((error) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                resolve();
                            }
                        });

                        // If the function also returns a Promise (mixed approach), handle that too
                        if (result && typeof result.then === "function") {
                            result.then(resolve, reject);
                        }
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }
            return originalTestFn(name, wrappedFn, ...args);
        }
        // No done callback expected, use original function as-is
        return originalTestFn(name, fn, ...args);

    };

    if (callCount < 2) {
        wrappedTestFn.only = createDoneCallbackWrapper(originalTestFn.only, 2);
        wrappedTestFn.skip = createDoneCallbackWrapper(originalTestFn.skip, 2);
    }
    return wrappedTestFn;
}

// Create global polyfill functions that map Mocha hooks to Vitest hooks
globalThis.before = (fn) => {
    if (!process.env.SILENT) {
        console.warn("⚠️  DEPRECATION WARNING: 'before' hook is deprecated. Please use 'beforeAll' instead. This polyfill will be removed in a future version.");
    }
    return vitestBeforeAll(fn);
};

globalThis.after = (fn) => {
    if (!process.env.SILENT) {
        console.warn("⚠️  DEPRECATION WARNING: 'after' hook is deprecated. Please use 'afterAll' instead. This polyfill will be removed in a future version.");
    }
    return vitestAfterAll(fn);
};

// beforeEach and afterEach are the same in both frameworks, but provide explicit mapping for consistency
globalThis.beforeEach = globalThis.beforeEach || vitestBeforeEach;
globalThis.afterEach = globalThis.afterEach || vitestAfterEach;
globalThis.mapCollection = mapCollection;
globalThis.i18next = i18next;
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


globalThis.before(() => {
    expect(mapCollection.count()).to.be.equals(0);
});

globalThis.after(() => {
    mapCollection.clear();

    // hier auch folgendes zurücksetzen?
    // - projections
    // - vuex state, etc. --> es wird in vielen Tests der store importiert und manipuliert
});

globalThis.afterEach(() => {
    sinon.restore();
});

