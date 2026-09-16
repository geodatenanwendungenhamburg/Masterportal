<script>
import {mapGetters} from "vuex";
import MenuContainerBodyRootItemElement from "./MenuContainerBodyRootItemElement.vue";
import changeCase from "@shared/js/utils/changeCase.js";
import {getPiniaModuleStore, isPiniaModule} from "../../modules-store/piniaModules.js";

/**
 * Menu Container Body Root Items
 * @module modules/MenuContainerBodyRootItems
 * @vue-prop {String} idAppendix - The appendix set on the id to make it unique.
 * @vue-prop {Array} path - The path to find the MenuContainerBodyElement inside the store structure.
 * @vue-prop {String} side - The side in which the menu component is being rendered.
 * @vue-computed {Array} sections - Returns the sections of this side.
 * @vue-computed {Array} itemProps - Returns the merged (config + state) properties of all items in this section.
 */
export default {
    name: "MenuContainerBodyRootItems",
    components: {
        MenuContainerBodyRootItemElement
    },
    props: {
        /** Appendix set on the id to make it unique. Needed, as the menu can be rendered multiple times. */
        idAppendix: {
            type: String,
            required: true
        },
        /** Path to find the MenuContainerBodyElement inside the store structure. */
        path: {
            type: Array,
            default: () => []
        },
        side: {
            type: String,
            default: "mainMenu",
            validator: value => value === "mainMenu" || value === "secondaryMenu"
        }
    },
    computed: {
        ...mapGetters("Menu", ["customMenuElementIcon", "section", "sectionsBySide"]),
        sections () {
            return this.sectionsBySide(this.side);
        },

        /**
         * Builds the properties of every item to render, merged from config.json and the module's state.
         * Recomputes automatically whenever the sections or the referenced module state (e.g. Login) changes.
         * @returns {Array} The properties of all items in this section.
         */
        itemProps () {
            const itemProps = [],
                  items = this.section(this.path);

            if (items) {
                const list = Array.isArray(items) ? items : items.elements;

                list.forEach(item => {
                    const props = this.chooseProperties(item);

                    if (props) {
                        itemProps.push(props);
                    }
                });
            }
            return itemProps;
        }
    },
    methods: {
        /**
         * Returns the properties from the state, if available.
         * Otherwise the item (properties from config.json) is returned.
         * @param {Object} item The menu item.
         * @returns {Object} The properties from state or config.json.
         */
        chooseProperties (item) {
            let properties = item;

            if ("type" in item) {
                if (isPiniaModule(item.type)) {
                    const piniaStore = getPiniaModuleStore(item.type)();

                    // merge config item with the module's menu metadata from the Pinia store
                    return {
                        name: piniaStore.name,
                        icon: piniaStore.icon,
                        description: piniaStore.description,
                        ...item,
                        type: item.type
                    };
                }

                const stateProperties = this.$store.state.Modules[changeCase.upperFirst(item.type)];

                if (typeof stateProperties === "object") {
                    properties = {
                        ...stateProperties,
                        ...item
                    };
                }

                if (item.type === "customMenuElement" && !Object.prototype.hasOwnProperty.call(item, "icon")) {
                    properties.icon = this.customMenuElementIcon;
                }
            }
            return properties;
        }
    }
};
</script>

<template>
    <div
        :id="'mp-menu-body-items-' + idAppendix"
        class="flex-column"
    >
        <MenuContainerBodyRootItemElement
            v-for="(props, key) in itemProps"
            :id="'mp-menu-body-items-element-' + key + '-' + idAppendix"
            :key="key"
            :properties="props"
            :name="props.name"
            :icon="props.icon"
            :description="props.description"
            :path="[...path, key]"
        />
    </div>
</template>

<style lang="scss" scoped>

</style>
