import mapCollection from "./src/core/maps/js/mapCollection.js";
import testConfig from "./devtools/tests/testConfig.js";
import i18next from "i18next";
import {config, enableAutoUnmount} from "@vue/test-utils";
import { afterAll, afterEach, beforeAll } from "vitest";
import { vi } from "vitest";

if (!globalThis.ResizeObserver) {
    global.ResizeObserver = class ResizeObserver {
      observe() {
        // do nothing
      }
      unobserve() {
        // do nothing
      }
      disconnect() {
        // do nothing
      }
    };
  }

globalThis.mapCollection = mapCollection;
globalThis.i18next = i18next;
globalThis.Config = testConfig;
// create alias for before(), after() and globalThis
globalThis.before = beforeAll;
globalThis.after = afterAll;
global = globalThis;

// renderStubDefaultSlot: https://test-utils.vuejs.org/migration/#shallowmount-and-renderstubdefaultslot
config.global.renderStubDefaultSlot = true;

//todo mock funktioniert nicht:
/*
SyntaxError: Named export 'AutomaticUniforms' not found. The requested module '@cesium/engine' is a CommonJS module, 
which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from '@cesium/engine';
const { AutomaticUniforms } = pkg;
*/
vi.mock("@cesium/engine", () => ({
  default: {
    AutomaticUniforms: vi.fn(() => ({ data: "mocked data" }))
  }
}));