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
        }
    },
    watch: {
        sections: {
            /**
             * Is triggered if sections change. E.g. if module 'openConfig' is used with another config.json.
             * Loads new sections.
             * @returns {void}
             */
            handler () {
                this.prepareItemProps();
            },
            deep: true
        }
    },
    created () {
        this.prepareItemProps();
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

                if (item.type === "customMenuElement" && !Object.prototype.hasOwnProperty.call(properties, "icon")) {
                    properties.icon = this.customMenuElementIcon;
                }
                if (typeof stateProperties === "object") {
                    properties = stateProperties;
                }
            }
            return properties;
        },

        prepareItemProps () {
            this.itemProps = [];
            const items = this.section(this.path);

            if (items) {
                if (Array.isArray(items)) {
                    this.section(this.path).forEach(item => {
                        const props = this.chooseProperties(item);

                        if (props) {
                            this.itemProps.push(props);
                        }
                    });
                }
                else {
                    items.elements.forEach(element => {
                        const props = this.chooseProperties(element);

                        if (props) {
                            this.itemProps.push(props);
                        }
                    });
                }
            }
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
