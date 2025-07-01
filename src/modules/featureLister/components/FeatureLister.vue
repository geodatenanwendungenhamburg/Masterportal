<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import tabStatus from "../constantsTabStatus.js";
import FeatureDetailView from "./FeatureDetailView.vue";
import FeatureListView from "./FeatureListView.vue";
import LayerListView from "./LayerListView.vue";

/**
 * Feature Lister
 * @module modules/FeatureLister
 * @vue-data {String} enabledTabClass - The CSS-Class for the enabled tab.
 * @vue-data {String} activeTabClass - The CSS-Class "active" tab.
 * @vue-computed {String} themeTabClasses - The class for the current theme-tab.
 */
export default {
    name: "FeatureLister",
    components: {
        LayerListView,
        FeatureListView,
        FeatureDetailView
    },
    data () {
        return {
            enabledTabClass: "",
            activeTabClass: "active",
            disabledTabClass: "disabled",
            tabStatus: tabStatus
        };
    },
    computed: {
        ...mapGetters("Modules/FeatureLister", [
            "layer",
            "layerListView",
            "featureListView",
            "featureDetailView"
        ]),
        themeTabClasses: function () {
            return this.layerListView ? this.activeTabClass : this.defaultTabClass;
        }
    },
    unmounted () {
        this.resetToThemeChooser();
        this.removeHighlightFeature();
        this.removePointMarker();
        this.removePolygonMarker();
    },
    methods: {
        ...mapActions("Modules/FeatureLister", [
            "switchBackToList",
            "switchToThemes",
            "switchToDetails"
        ]),
        ...mapActions("Maps", ["removeHighlightFeature", "removePointMarker", "removePolygonMarker"]),
        ...mapMutations("Modules/FeatureLister", [
            "resetToThemeChooser"
        ]),
        /**
         * Returns the CSS classes for the tab based on its status.
         * @param {String} view - The current view status of the tab.
         * @returns {String} - The CSS class for the tab.
         */
        tabClasses: function (view) {
            switch (view) {
                case tabStatus.ACTIVE:
                    return this.activeTabClass;
                case tabStatus.ENABLED:
                    return this.enabledTabClass;
                case tabStatus.DISABLED:
                    return this.disabledTabClass;
                default:
                    return this.disabledTabClass;
            }
        }
    }
};
</script>

<template lang="html">
    <div id="feature-lister">
        <ul class="nav nav-tabs">
            <li
                id="module-feature-lister-themeChooser"
                role="presentation"
                class="nav-item"
            >
                <a
                    href="#"
                    class="nav-link"
                    :class="tabClasses(layerListView)"
                    @click.prevent="switchToThemes()"
                >{{ $t("common:modules.featureLister.chooseTheme") }}</a>
            </li>
            <li
                id="module-feature-lister-list"
                role="presentation"
                class="nav-item"
            >
                <a
                    href="#"
                    class="nav-link"
                    :class="tabClasses(featureListView)"
                    @click.prevent="switchBackToList()"
                >{{ $t("common:modules.featureLister.list") }}</a>
            </li>
            <li
                id="module-feature-lister-details"
                role="presentation"
                class="nav-item"
            >
                <a
                    href="#"
                    class="nav-link"
                    :class="tabClasses(featureDetailView)"
                    @click.prevent="switchToDetails()"
                >{{ $t("common:modules.featureLister.details") }}</a>
            </li>
        </ul>
        <template
            v-if="layerListView === tabStatus.ACTIVE"
        >
            <div
                id="feature-lister-themes"
                class="panel panel-default"
            >
                <div
                    id="feature-lister-themes-header"
                    class="panel-heading"
                >
                    {{ $t("common:modules.featureLister.visibleVectorLayers") }}
                </div>
                <LayerListView />
            </div>
        </template>
        <template v-if="featureListView === tabStatus.ACTIVE">
            <div
                id="feature-lister-list-header"
                class="panel-heading"
            >
                <span>{{ $t(layer.name) }}</span>
            </div>
            <div
                id="feature-lister-list"
                class="panel panel-default feature-lister-list"
            >
                <FeatureListView />
            </div>
        </template>
        <template v-if="featureDetailView === tabStatus.ACTIVE">
            <div
                id="feature-lister-details-header"
                class="panel-heading"
            >
                <span> {{ $t("common:modules.featureLister.detailsOfSelected") }} </span>
            </div>
            <FeatureDetailView />
        </template>
    </div>
</template>


<style lang="scss" scoped>

.feature-lister-list {
    margin-bottom: 0;
    display: contents;
    overflow: auto;
}
.panel-heading {
    color: $dark_grey;
    cursor: default;
    border-left: 1px solid $light_grey;
    border-right: 1px solid $light_grey;
    padding: 10px 15px;
    border-bottom: 1px solid transparent;
    font-weight: bold;
}

</style>
