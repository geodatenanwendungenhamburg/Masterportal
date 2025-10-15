# Vue.js Add-ons (Vue 3, Options API)

The Masterportal offers a mechanism to inject your own developments into the sources, without them becoming a part of the Masterportal repository. See **[setting up the development environment](../Contributing/setupDev.md)** for more information.

An add-on in itself is programmed identically to a native module. For an example, see **[Tutorial 01: Creating a new module (Scale Switcher)](./tutorial.md)**. However, an add-on lives in another repository and thus allows separate management.

All add-ons to be added are placed in the folder `addons` found at Masterportal root level. Any number of such add-ons may be configured in a portal's **[config.js](../../User/Portal-Config/config.js.md)**. Add-ons may bring their own `package.json` file to specify further dependencies.

Please adhere to the following structure, in this example adding a **tool** (`vueAddon`) and a GFI theme (`myGfiTheme`). The structure reflects **Vue 3 + Vuex 4** and the **Options API** (no Composition API required).

## Add-on folder structure

### File system example

Only files related to add-ons must be placed in the `addons` folder.

```
addons
|-- vueAddon
|   |-- index.js
|   |-- components
|   |   |-- VueAddon.vue
|   |-- store
|   |   |-- actionsVueAddon.js
|   |   |-- gettersVueAddon.js
|   |   |-- indexVueAddon.js
|   |   |-- mutationsVueAddon.js
|   |   |-- stateVueAddon.js
|   |-- locales
|   |   |-- en
|   |       |-- additional.json
|   |   |-- de
|   |       |-- additional.json
|   |-- tests
|   |   |-- unit
|   |       |-- components
|   |           |-- VueAddon.spec.js
|
|-- myGfiTheme
|   |-- index.js
|   |-- components
|   |   |-- MyGfiTheme.vue
|   |-- locales
|   |   |-- en
|   |       |-- additional.json
|   |-- tests
|   |   |-- unit
|   |       |-- components
|   |           |-- MyGfiTheme.spec.js
```

The entry point of each add-on must be a file named `index.js` on the add-on folder root level.

### Configuration file

Within the add-ons folder, a configuration file `addonsConf.json` must exist. This file contains JSON that has the add-on's name as a key; i.e., an add-on in `addons/vueAddon` would have `vueAddon` as a key.

#### `addonsConf.json` example

Matching the example above, this is a fitting configuration.

These add-on types are supported:
* Tools (`"type": "tool"`)
* GFI themes (`"type": "gfiTheme"`)
* Controls (`"type": "control"`)
* JavaScript (`"type": "javascript"`)
* SearchInterface (`"type": "searchInterface"`)
* FilterSnippet (`"type": "filterSnippet"`)

All entries in `addonsConf.json` defined by an object are expected to be written in Vue or plain JavaScript.

By default, an add-on's key is the name of its folder. By using the parameter `path` you may specify any other path. This way, you may group multiple add-ons in a folder.

```json
{
  "vueAddon": {
    "type": "tool"
  },
  "myGfiTheme": {
    "type": "gfiTheme"
  },
  "anotherGFITheme": {
    "type": "gfiTheme",
    "path": "myGFIThemesFolder/myGFISubFolder"
  },
  "myControl": {
    "type": "control"
  },
  "anotherControl": {
    "type": "control",
    "path": "myControlFolder/myControlSubFolder"
  },
  "myJavascript": {
    "type": "javascript"
  },
  "mySearchInterface": {
    "type": "searchInterface"
  }
}
```

Only files related to add-ons may end up in this folder.

For additional required dependencies not included in the Masterportal, add a separate minimal `package.json` file.

```json
{
  "name": "exampleAddon",
  "version": "1.0.0",
  "description": "Example Vue add-on with infoText support.",
  "dependencies": {
    "hello": "^0.3.2"
  }
}
```

## Add-on example (Tool)

### Create files

The add-on example has the name *vueAddon* with entry point file `index.js`. The component `VueAddon.vue` is placed in the folder `components`. From this, the following file structure results:

```
myMasterPortalFolder/
  addons/
    vueAddon/
      index.js
      components/
        VueAddon.vue
      store/
        indexVueAddon.js
        actionsVueAddon.js
        gettersVueAddon.js
        mutationsVueAddon.js
        stateVueAddon.js
      locales/
        en/additional.json
        de/additional.json
```

### Example store (Vue 3 + Vuex 4, Options API)

> **Note:** The Vuex module is namespaced and split into state/getters/mutations/actions.

```js title="myMasterPortalFolder/addons/vueAddon/store/stateVueAddon.js"
const state = {
    description: "additional:modules.vueAddon.description",
    icon: "bi-tools",
    name: "additional:modules.vueAddon.title",
    type: "vueAddon",
    // addon specific state variables
    infoText: "additional:modules.vueAddon.content"
};

export default state;
```

```js title="myMasterPortalFolder/addons/vueAddon/store/gettersVueAddon.js"
import {generateSimpleGetters} from "@shared/js/utils/generators";
import state from "./stateVueAddon";
export default {
  ...generateSimpleGetters(state)
};
```

```js title="myMasterPortalFolder/addons/vueAddon/store/mutationsVueAddon.js"
import {generateSimpleMutations} from "@shared/js/utils/generators";
import state from "./stateVueAddon";
export default {
  ...generateSimpleMutations(state)
};
```

```js title="myMasterPortalFolder/addons/vueAddon/store/actionsVueAddon.js"
import i18next from "i18next";
const actions = {
  initialize() {},
  showAlert({dispatch}, content = "additional:modules.vueAddon.hello") {
    dispatch(
      "Alerting/addSingleAlert",
      {
        title: "Info",
        category: "info",
        content: i18next.t(content)
      },
      {root: true}
    );
  }
};
export default actions;
```

```js title="myMasterPortalFolder/addons/vueAddon/store/indexVueAddon.js"
import actions from "./actionsVueAddon";
import getters from "./gettersVueAddon";
import mutations from "./mutationsVueAddon";
import state from "./stateVueAddon";

export default {
  namespaced: true,
  state: {...state},
  actions,
  mutations,
  getters
};
```

### Vue component (Options API)

```vue title="myMasterPortalFolder/addons/vueAddon/components/VueAddon.vue"
<script>
import {mapGetters, mapActions} from "vuex";

export default {
  name: "VueAddon",
  computed: {
    ...mapGetters("Modules/VueAddon", ["icon", "infoText", "name"])
  },
  mounted () {
    this.initialize();
  },
  methods: {
   ...mapActions("Modules/VueAddon", ["initialize", "showAlert"])
  }
};
</script>

<template>
  <div id="vue-addon" class="p-3">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h5 class="mb-0">
        <i v-if="icon" :class="icon" class="me-2" />
        {{ $t(name) }}
      </h5>
    </div>

    <div class="mt-2">
      <p class="mb-2">{{ $t(infoText) }}</p>
      <button type="button" class="btn btn-primary btn-sm" @click="showAlert()">
        {{ $t("additional:modules.vueAddon.trigger") }}
      </button>
    </div>
  </div>
</template>

```

### Writing the `index.js` file

Within the `index.js` file, the component (Vue component), store, and translations are aggregated and exported via a single entry point.

> **Required:** the entry point must be `index.js`, otherwise the add-on will not be loaded correctly.

```js title="myMasterPortalFolder/addons/vueAddon/index.js"
import VueAddonComponent from "./components/VueAddon.vue";
import VueAddonStore from "./store/indexVueAddon";

import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: VueAddonComponent,
    store: VueAddonStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
```

### Creating the `addonsConf.json`

```json title="myMasterPortalFolder/addons/addonsConf.json"
{
  "vueAddon": {
    "type": "tool"
  }
}
```

### Activate the add-on in the portal's `config.js` (if used)

```js title="myMasterPortalFolder/config.js"
const Config = {
  addons: ["vueAddon"],
  // [...]
};
export default Config;
```

### Configure the add-on as a tool in the portal's `config.json` (to appear in the menu)

```json title="myMasterPortalFolder/config.json"
{
  "portalConfig": {
    "mainMenu": {
      "sections": [
        [
          {
            "type": "vueAddon"
          }
        ]
      ]
    }
  }
}
```

### Example i18n file

```json title="myMasterPortalFolder/addons/vueAddon/locales/en/additional.json"
{
    "modules": {
            "vueAddon": {
                "content": "Hello from the Vue 3 add-on!",
                "description": "Additional description text for the Vue add-on.",
                "hello": "Hello from the Vue add-on!",
                "title": "Vue Add-on",
                "trigger": "Show message"
            }
    }
}
```


```json title="myMasterPortalFolder/addons/vueAddon/locales/de/additional.json"
{
    "modules": {
            "vueAddon": {
                "content": "Hallo vom Vue 3 Add-on!",
                "description": "Zusätzlicher Beschreibungstext für das Vue Add-on.",
                "hello": "Hallo vom Vue Add-on!",
                "title": "Vue Add-on",
                "trigger": "Nachricht anzeigen"
            }
    }
}
```

### Unit test

```js title="myMasterPortalFolder/addons/vueAddon/tests/unit/components/VueAddon.spec.js"
import {createStore} from "vuex";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import VueAddon from "../../../components/VueAddon.vue";

// mock i18n
config.global.mocks.$t = (key) => key;

describe("addons/vueAddon/components/VueAddon.vue", () => {
  const showAlertSpy = sinon.spy();
  let store;

  beforeEach(() => {
    store = createStore({
      namespaced: true,
      modules: {
        Modules: {
          namespaced: true,
          modules: {
            VueAddon: {
              namespaced: true,
              state: {
                name: "additional:modules.vueAddon.title",
                infoText: "additional:modules.vueAddon.content",
                icon: "bi-tools"
              },
              getters: {
                name: (s) => s.name,
                infoText: (s) => s.infoText,
                icon: (s) => s.icon
              },
              actions: {
                showAlert: showAlertSpy,
                initialize: () => {}
              }
            }
          }
        }
      }
    });
  });

  afterEach(() => {
    sinon.restore();
    showAlertSpy.resetHistory();
  });

 it("renders and calls showAlert", async () => {
    const wrapper = mount(VueAddon, { global: { plugins: [store] } });
    expect(wrapper.find("#vue-addon").exists()).to.be.true;
    await wrapper.find("#vue-addon .btn-primary").trigger("click");
    expect(showAlertSpy.calledOnce).to.be.true;
  });
});

```

### Write JSDoc

For this, create a file `namespaces.js` in the `jsdoc` folder and **add** `Addons` as `@memberof`.

```js
/**
 * @namespace VueAddon
 * @memberof Addons
 */
```

In the file `model.js`, `@memberof` must be prefixed with `Addons.` for this to work correctly.

```js
/**
* @class VueAddon
* @memberof Addons.VueAddon
* @constructs
*/
```

### Additional examples

Besides the tool-based example (vueAddon), there are also further minimal examples included in the repository:

- **Control add-on:** `addons/controls/exampleControl`  
  Demonstrates how to implement a simple control with its own Vue component and Vuex store.

- **SearchInterface add-on:** `addons/searchInterfaces/exampleSearch`  
  Demonstrates how to implement a simple search interface add-on.
