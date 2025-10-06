<script>
import {mapActions, mapGetters} from "vuex";
import visibilityChecker from "@shared/js/utils/visibilityChecker";
import LightButton from "@shared/modules/buttons/components/LightButton.vue";

/**
 * Menu Container Body Root Item Element
 * @module modules/MenuContainerBodyRootItemElement
 * @vue-prop {String} name - The text displayed inside the element.
 * @vue-prop {String} description - The description used as it's name and aria-label.
 * @vue-prop {String} icon - The icon displayed inside the element.
 * @vue-prop {Boolean} showDescription - Shows whether the description should be displayed alongside the element.
 * @vue-prop {Array} path - The path to find the element inside the store structure.
 * @vue-prop {Object} properties - All properties of the module to show in menu.
 * @vue-computed {Object} menu - The menu configuration for the given menu.
 * @vue-computed {Boolean} showIcon - Shows wether icon will be displayed.
 * @vue-computed {String} side - The menu side.
 * @vue-computed {String} type - The type of the component.
 */
export default {
    name: "MenuContainerBodyRootItemElement",
    components: {LightButton},
    props: {
        /** Text displayed inside the element. */
        name: {
            type: String,
            required: true,
            validator: value => value !== ""
        },
        /** Description used as it's name and aria-label. May be displayed alongside the element. */
        description: {
            type: String,
            default: ""
        },
        /** Icon displayed inside the element. */
        icon: {
            type: String,
            default: "",
            validator: value => value.startsWith("bi-")
        },
        /** Path to find the element inside the store structure. */
        path: {
            type: Array,
            default: () => []
        },
        /** All properties of the module to show in menu. */
        properties: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters(["deviceMode", "portalConfig"]),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Menu", [
            "mainMenu",
            "secondaryMenu",
            "showDescription",
            "expanded",
            "currentComponent",
            "currentComponentName",
            "navigationHistory"
        ]),

        ...mapGetters([
            "visibleLayerConfigs"
        ]),

        /**
         * @returns {Object} Menu configuration for the given menu.
         */
        menu () {
            return this.side === "mainMenu" ? this.mainMenu : this.secondaryMenu;
        },

        /**
         * @returns {Boolean} Depending on whether the icon is given it is decided whether on is shown.
         */
        showIcon () {
            return typeof this.icon === "string" && this.icon.length > 0;
        },

        /**
         * @returns {String} The menu side.
         */
        side () {
            return this.path[0];
        },

        /**
         * @returns {String} The type of the component.
         */
        type () {
            return this.properties.type;
        },

        /**
         * @returns {Boolean} Whether all required layers for this item are visible.
         */
        isAllRequiredLayersVisible () {
            return this.areLayersVisible(this.properties?.showOnlyByLayersVisible);
        },

        /**
         * Checks if at least one element inside 'properties.elements' has its required layers visible.
         * @returns {Boolean} Whether any child element should be visible.
         */
        hasVisibleChildElement () {
            if (!Array.isArray(this.properties?.elements)) {
                return false;
            }

            return this.properties.elements.some(element => {
                return this.areLayersVisible(element.showOnlyByLayersVisible);
            });
        }
    },
    watch: {
        /**
         * Watches visibility changes in layers and opens the folder only once
         * for each unique set of visible layers defined by child elements.
         */
        visibleLayerConfigs: {
            handler (newVal, oldVal) {
                if (!Array.isArray(this.properties.elements)) {
                    return;
                }

                const oldVisibleIds = (oldVal || [])
                        .filter(layer => layer.visibility)
                        .map(layer => layer.id),
                    newVisibleIds = (newVal || [])
                        .filter(layer => layer.visibility)
                        .map(layer => layer.id);

                for (const element of this.properties.elements) {
                    const requiredLayerIds = element.showOnlyByLayersVisible || [],
                        newlyVisible = requiredLayerIds.some(
                            id => newVisibleIds.includes(id) && !oldVisibleIds.includes(id)
                        );

                    if (requiredLayerIds.length === 0) {
                        continue;
                    }


                    if (newlyVisible && this.areLayersVisible(requiredLayerIds)) {
                        if (this.properties.showEntryDirectly === true && this.type === "folder") {
                            if (!this.expanded(this.side)) {
                                this.toggleMenu(this.side);
                            }
                            if (
                                this.currentComponent(this.side)?.props?.name !== this.name &&
                        !this.navigationHistory(this.side)?.some(entry => entry?.props?.name === this.name)
                            ) {
                                this.changeCurrentComponent({
                                    type: this.type,
                                    side: this.side,
                                    props: {name: this.name, path: this.path}
                                });
                            }
                        }
                        break;
                    }
                }
            },
            deep: true
        }
    },
    /**
     * Lifecycle-Hook: Sets the configured current component.
     * @returns {void}
     */
    created () {
        if (this.type === this.menu.currentComponent && this.type !== "folder") {
            this.clickedMenuElement({
                name: this.name,
                path: this.path,
                side: this.side,
                type: this.type,
                properties: this.properties
            });
        }
    },
    methods: {
        ...mapActions("Menu", ["clickedMenuElement", "resetMenu", "changeCurrentComponent", "toggleMenu"]),

        /**
         * Generic helper to check visibility of layers.
         * @param {Array} requiredLayerIds - Array of required layer IDs.
         * @returns {Boolean} Whether all required layers are visible.
         */
        areLayersVisible (requiredLayerIds) {
            if (!Array.isArray(requiredLayerIds) || requiredLayerIds.length === 0) {
                return true;
            }

            const visibleLayerIds = this.visibleLayerConfigs
                ?.filter(layer => layer.visibility)
                .map(layer => layer.id);

            return requiredLayerIds.every(id => visibleLayerIds?.includes(id));
        },

        /**
        * Checks module visibility and resets menu if not visible.
        * @returns {Boolean} True if the module and its layers or children are visible; otherwise, false.
        */
        checkIsVisible () {
            const {supportedMapModes, supportedDevices, supportedTreeTypes, elements} = this.properties,

                showModule = visibilityChecker.isModuleVisible({
                    mapMode: this.mode,
                    deviceMode: this.deviceMode,
                    treeType: this.portalConfig?.tree?.type,
                    elements,
                    supportedMapModes,
                    supportedDevices,
                    supportedTreeTypes,
                    visibleLayerConfigs: this.visibleLayerConfigs
                });

            if (!showModule && this.menu.currentComponent === this.type && this.menu.navigation.currentComponent.props.name === this.name) {
                this.resetMenu(this.side);
            }

            return showModule && (this.isAllRequiredLayersVisible || this.hasVisibleChildElement);
        }
    }
};
</script>

<template>
    <div>
        <LightButton
            v-if="checkIsVisible()"
            :interaction="() => clickedMenuElement({name, path, side, type, properties})"
            :text="name"
            :icon="showIcon ? icon : null"
            :description="showDescription(side) ? description : null"
            customclass="w-100 justify-content-start mp-menu-root-element"
        />
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.mp-menu-root-element {
    min-height: 2.3rem;
}

</style>
