<script>
import {mapGetters} from "vuex";
import axios from "axios";
import visibilityChecker from "@shared/js/utils/visibilityChecker.js";
import DOMPurify from "dompurify";

/**
 * This module can display HTML from config.json or an external file.
 * @module modules/CustomMenuElement
 * @vue-prop {String} side - The side in which the menu component is being rendered.
 * @vue-data {String} htmlContentFromPath - The hmtl string for configurations.
 * @vue-computed {String} htmlContent - The html string for the content.
 * @vue-computed {String} pathToContent - The path for the content.
 */
export default {
    name: "CustomMenuElement",
    props: {
        /** Defines in which menu the component is being rendered */
        side: {
            type: String,
            default: "mainMenu",
            validator: value => value === "mainMenu" || value === "secondaryMenu"
        },
        mapMode: {
            type: String,
            default: "2D",
            validator: value => value === "2D" || value === "3D"
        },
        deviceMode: {
            type: String,
            default: "Desktop",
            validator: value => value === "Desktop" || value === "Mobile" || value === "Table"
        }
    },
    data: () => {
        return {
            htmlContentFromPath: null
        };
    },
    computed: {
        ...mapGetters("Menu", ["currentComponent"]),
        htmlContent () {
            const component = this.currentComponent(this.side);
            const raw = component?.props?.htmlContent;
            console.log("htmlContent - side:", this.side, "component:", component, "raw:", raw);

            return raw ? DOMPurify.sanitize(raw) : "";
        },
        pathToContent () {
            return this.currentComponent(this.side).props.pathToContent;
        },
        supportedMapModes () {
            return this.currentComponent(this.side).props.supportedMapModes || ["2D", "3D"];
        },
        supportedDevices () {
            return this.currentComponent(this.side).props.supportedDevices || ["Desktop", "Mobile", "Table"];
        },
        isVisible () {
            return visibilityChecker.isModuleVisible({
                mapMode: this.mapMode,
                deviceMode: this.deviceMode,
                supportedMapModes: this.supportedMapModes,
                supportedDevices: this.supportedDevices
            });
        },
        hasValidPathToContent () {
            return this.pathToContent !== undefined && this.pathToContent.length > 3;
        }
    },
    watch: {
        pathToContent: {
            handler (newPath) {
                if (newPath !== undefined && newPath.length > 3) {
                    this.readHTMLFromPath();
                }
            },
            immediate: true
        }
    },
    methods: {
        /**
         * Reads content of file configured by pathToContent.
         * @returns {void}
         */
        readHTMLFromPath () {
            axios.get(this.pathToContent, {responseType: "document"}).then(response => {
                const data = response.data;

                if (data.body) {
                    this.htmlContentFromPath = data.body.innerHTML;
                }
                else {
                    this.htmlContentFromPath = data;
                }

                this.htmlContentFromPath = DOMPurify.sanitize(this.htmlContentFromPath);
            })
                .catch(error => {
                    console.error("Failed to load content for CustomMenuElement with pathToContent", this.pathToContent, error);
                });
        }

    }
};
</script>

<template lang="html">
    <div
        v-if="isVisible"
        class="custom-menu-element"
    >
        <div
            v-if="htmlContent && htmlContent.length > 3"
            v-html="htmlContent"
        />
        <div
            v-else-if="hasValidPathToContent"
            v-html="htmlContentFromPath"
        />
    </div>
</template>
