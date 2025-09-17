import mapCollection from "./src/core/maps/js/mapCollection.js";
import testConfig from "./devtools/tests/testConfig.js";
import i18next from "i18next";
import {config, enableAutoUnmount} from "@vue/test-utils";
import {vi, beforeAll as vitestBeforeAll, afterAll as vitestAfterAll, beforeEach as vitestBeforeEach, afterEach as vitestAfterEach, test as vitestTest, it as vitestIt} from "vitest";

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

// renderStubDefaultSlot: https://test-utils.vuejs.org/migration/#shallowmount-and-renderstubdefaultslot
config.global.renderStubDefaultSlot = true;

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

// Mock @cesium/engine as fallback for any direct imports
vi.mock("@cesium/engine", () => ({
    default: {},
    AutomaticUniforms: vi.fn(() => ({data: "mocked data"}))
}));

// Mock @cesium/widgets as fallback
vi.mock("@cesium/widgets", () => ({
    default: {}
}));

// Mocha-to-Vitest Polyfill for backward compatibility
// Maps Mocha hook names to Vitest hook names for 3rd party repos

// Done-callback to Promise polyfill for Mocha-style async tests
// Wraps test functions to support done callback while maintaining Promise compatibility
/**
 *
 */
function createDoneCallbackWrapper (originalTestFn) {
    return (name, fn, ...args) => {
    // If no test function provided, just pass through
        if (typeof fn !== "function") {
            return originalTestFn(name, fn, ...args);
        }

        // Check if function expects a 'done' callback (has more than 0 parameters)
        if (fn.length > 0) {
            console.warn(`⚠️  DEPRECATION WARNING: Test "${name}" uses done callback. Please migrate to Promise-based async tests. This polyfill will be removed in a future version.`);

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
}

// Create global polyfill functions that map Mocha hooks to Vitest hooks
globalThis.before = (fn) => {
    console.warn("⚠️  DEPRECATION WARNING: 'before' hook is deprecated. Please use 'beforeAll' instead. This polyfill will be removed in a future version.");
    return vitestBeforeAll(fn);
};

globalThis.after = (fn) => {
    console.warn("⚠️  DEPRECATION WARNING: 'after' hook is deprecated. Please use 'afterAll' instead. This polyfill will be removed in a future version.");
    return vitestAfterAll(fn);
};

// beforeEach and afterEach are the same in both frameworks, but provide explicit mapping for consistency
globalThis.beforeEach = globalThis.beforeEach || vitestBeforeEach;
globalThis.afterEach = globalThis.afterEach || vitestAfterEach;
globalThis.mapCollection = mapCollection;
globalThis.i18next = i18next;
globalThis.Config = testConfig;
globalThis.it = createDoneCallbackWrapper(globalThis.it || vitestIt, "it");
globalThis.test = createDoneCallbackWrapper(globalThis.test || vitestTest, "test");

// Also make them available as properties of global/window for different environments
if (typeof window !== "undefined") {
    window.before = globalThis.before;
    window.after = globalThis.after;
    window.beforeEach = globalThis.beforeEach;
    window.afterEach = globalThis.afterEach;
    window.mapCollection = globalThis.mapCollection;
    window.i18next = globalThis.i18next;
    window.Config = globalThis.testConfig;
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
    global.Config = globalThis.testConfig;
    global.it = globalThis.it;
    global.test = globalThis.test;
}