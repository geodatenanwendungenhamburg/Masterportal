<script>
import {DragBox, Select} from "ol/interaction";
import {platformModifierKeyOnly, touchOnly} from "ol/events/condition";
import VectorSource from "ol/source/Vector.js";
import {Style, Stroke, Fill, Circle as CircleStyle} from "ol/style";

import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersSelectFeatures";
import mutations from "../store/mutationsSelectFeatures";

import {isUrl} from "@shared/js/utils/urlHelper";
import {isEmailAddress} from "@shared/js/utils/isEmailAddress.js";
import {isPhoneNumber, getPhoneNumberAsWebLink} from "@shared/js/utils/isPhoneNumber.js";

/**
 * Select Features
 * @module modules/SelectFeatures
 */
export default {
    name: "SelectFeatures",
    data () {
        return {
            selectedFeatureStyle: new Style({
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: "rgba(0, 153, 255, 0.5)"
                    }),
                    stroke: new Stroke({
                        color: "rgba(0, 153, 255, 1)",
                        width: 2
                    })
                }),
                stroke: new Stroke({
                    color: "rgba(0, 153, 255, 1)",
                    width: 2
                }),
                fill: new Fill({
                    color: "rgba(0, 153, 255, 0.3)"
                })
            })
        };
    },
    computed: {
        ...mapGetters(["ignoredKeys", "isMobile"]),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Modules/SelectFeatures", Object.keys(getters))
    },
    mounted () {
        this.createInteractions();
        this.addInteractions();
    },
    unmounted () {
        this.removeInteractions();
        this.clearFeatures();
    },
    methods: {
        ...mapMutations("Modules/SelectFeatures", Object.keys(mutations)),
        ...mapActions("Maps", {
            addInteractionToMap: "addInteraction",
            removeInteractionFromMap: "removeInteraction"
        }),
        ...mapActions("Modules/SelectFeatures", ["highlightFeature", "toggleFeatureSelection"]),
        isEmailAddress,
        isPhoneNumber,
        getPhoneNumberAsWebLink,

        /**
         * Creates the interactions for selecting features.
         * @returns {void}
         */
        createInteractions: function () {
            const select = new Select({
                    condition: (event) => event.originalEvent.ctrlKey && event.type === "pointerdown",
                    style: null
                }),
                dragBox = new DragBox(this.isMobile ? {condition: touchOnly} : {condition: platformModifierKeyOnly});

            dragBox.on("boxend", this.setFeaturesFromDrag.bind(this));

            select.on("select", (event) => {
                this.setFeaturesFromClick(event.mapBrowserEvent);
            });
            this.setSelectInteraction(select);
            this.setDragBoxInteraction(dragBox);
        },

        /**
         * Resets the map interactions by removing existing ones and adding them again.
         * @returns {void}
         */
        resetInteractions () {
            this.removeInteractions();
            this.createInteractions();
            this.addInteractions();
        },

        /**
         * Removes a single feature from the selection.
         * @param {Number} index - The index of the feature to remove.
         * @param {Object} feature - The feature object to deselect.
         * @returns {void}
         */
        removeFeature (index, feature) {
            if (feature) {
                feature.setStyle(null);
                this.selectedFeatures.splice(index, 1);
                this.selectedFeaturesWithRenderInformation.splice(index, 1);
                if (this.selectedFeatures.length === 0) {
                    this.resetInteractions();
                }
            }
        },

        /**
         * Clears the selected features of all current instances.
         * @returns {void}
         */
        clearFeatures: function () {
            if (this.selectedFeatures) {
                this.selectedFeatures.forEach(feature => feature.setStyle(null));
                this.setSelectedFeatures([]);
            }
            this.setSelectedFeaturesWithRenderInformation([]);
        },

        /**
         * Adds the interactions to the Map.
         * @returns {void}
         */
        addInteractions: function () {
            this.addInteractionToMap(this.dragBoxInteraction);
            this.addInteractionToMap(this.selectInteraction);
        },

        /**
         * Removes the Interactions from the Map.
         * @returns {void}
         */
        removeInteractions: function () {
            this.removeInteractionFromMap(this.dragBoxInteraction);
            this.removeInteractionFromMap(this.selectInteraction);
            this.selectedFeaturesWithRenderInformation.length = 0;
        },

        /**
         * Infers features from interaction state and sets them to the selectedFeatures.
         * @returns {void}
         */
        setFeaturesFromDrag: function () {
            const map = mapCollection.getMap("2D"),
                extent = this.dragBoxInteraction.getGeometry().getExtent();

            map.getLayers()
                .getArray()
                .filter(layer => layer.get("visible") && layer.get("source") instanceof VectorSource)
                .forEach(layer => {
                    if (layer.get("typ") === "VectorTile" && layer.get("renderer") === "webgl") {
                        const features = layer.get("source")?.getFeaturesInExtent(extent);

                        features.forEach(feature => {
                            const featureId = feature.getId(),
                                alreadySelected = this.selectedFeatures.some(f => f.getId() === featureId);

                            if (!alreadySelected) {
                                feature.setStyle(this.selectedFeatureStyle);
                                this.prepareFeature(layer, feature);
                            }
                        });
                    }
                    else {
                        layer.get("source").forEachFeatureIntersectingExtent(
                            extent,
                            feature => {
                                const featureId = feature.getId(),
                                    alreadySelected = this.selectedFeatures.some(f => f.getId() === featureId);

                                if (!alreadySelected) {
                                    feature.setStyle(this.selectedFeatureStyle);
                                    this.prepareFeature(layer, feature);
                                }
                            }
                        );
                    }
                });
        },

        /**
         * Infers features from a click event and sets them to the selectedFeatures.
         * @param {Object} event The click event
         * @returns {void}
         */
        setFeaturesFromClick: function (event) {
            const map = mapCollection.getMap("2D"),
                coordinate = event.coordinate,
                pixel = map.getPixelFromCoordinate(coordinate);

            map.forEachFeatureAtPixel(pixel, (feature, layer) => {
                if (!layer) {
                    console.warn("No layer found for feature", feature);
                    return true;
                }

                if (layer.get("visible") && layer.get("source") instanceof VectorSource) {
                    const featureId = feature.getId(),
                        alreadySelected = this.selectedFeatures.some(f => f.getId() === featureId);

                    if (!alreadySelected) {
                        feature.setStyle(this.selectedFeatureStyle);
                        this.prepareFeature(layer, feature);
                    }
                }
                else {
                    console.warn("Layer not visible or not a vector source", layer);
                }
                return true;
            });
        },

        /**
         * Gets a feature or multiple features and forwards it/them to the pushFeatures Function.
         * Also pushes the features to the selected features.
         * @param {module:ol/Layer} layer layer the feature belongs to (for gfi attributes)
         * @param {module:ol/Feature} feature feature to be pushed
         * @returns {void}
         */
        prepareFeature: function (layer, feature) {
            this.addSelectedFeature(feature);
            if (feature.get("features") === undefined) {
                this.pushFeatures(layer, feature);
            }
            else {
                feature.get("features").forEach(item => {
                    this.pushFeatures(layer, item);
                });
            }
        },

        /**
         * Adds a feature to the selected list if it is not already present.
         * @param {module:ol/Feature} feature
         * @returns {void}
         */
        addSelectedFeature: function (feature) {
            const featureId = feature.getId();

            if (this.selectedFeatures.some(f => f.getId() === featureId)) {
                return;
            }
            this.selectedFeatures.push(feature);
        },

        /**
         * Pushes the given feature and its properties to the selectedFeaturesWithRenderInformation array.
         * @param {module:ol/Layer} layer layer the feature belongs to (for gfi attributes)
         * @param {module:ol/Feature} item feature to be pushed
         * @returns {void}
         */
        pushFeatures: function (layer, item) {
            this.addSelectedFeatureWithRenderInformation({
                item,
                properties: this.translateGFI(
                    item.getProperties(),
                    layer.get("gfiAttributes")
                ),
                layerId: layer.get("id")
            });
        },

        /**
         * Iterates the Properties and adds Links and Breaks.
         * @param {Array} properties Technical key to display value
         * @returns {Array.<String[]>} Array of [key,value]-pairs - may be empty
         */
        processLinksAndBreaks: function (properties) {
            const resultProperties = properties;

            Object.entries(properties).forEach(([key, propValue]) => {
                let propertyValue = propValue;

                if (Array.isArray(propValue)) {
                    propertyValue = propValue.join("|");
                }
                if (this.isValidKey(key) && this.isValidValue(propertyValue) && propertyValue.indexOf("|") > -1) {
                    resultProperties[key] = "";
                    propertyValue.split("|").forEach(arrayItemValue => {
                        if (isUrl(arrayItemValue)) {
                            resultProperties[key] += `<a href="${arrayItemValue}" target="_blank">${arrayItemValue}</a><br/>`;
                        }
                        else {
                            resultProperties[key] += arrayItemValue + "<br/>";
                        }
                    });
                }
                else if (this.isValidKey(key) && this.isValidValue(propertyValue) && isUrl(propertyValue)) {
                    resultProperties[key] = `<a href="${propertyValue}" target="_blank">${propertyValue}</a>`;
                }
            });
            return resultProperties;
        },

        /**
         * Prepares the properties of a feature for tabular display.
         * @param {Array} properties Technical key to display value
         * @param {Object} gfiAttributes Technical key to display key
         * @returns {Array.<String[]>} Array of [key,value]-pairs - may be empty
         */
        translateGFI: function (properties, gfiAttributes) {
            const resultProperties = this.processLinksAndBreaks(properties);

            if (gfiAttributes === "showAll") {
                return Object
                    .entries(resultProperties)
                    .map(([key, value]) => {
                        if (this.isValidKey(key) && this.isValidValue(value)) {
                            return [this.beautifyKey(key), this.beautifyValue(value)];
                        }
                        return false;
                    });
            }

            if (typeof gfiAttributes === "object") {
                return Object
                    .keys(gfiAttributes)
                    .map(key => [
                        gfiAttributes[key],
                        this.beautifyValue(resultProperties[key] || "")
                    ]);
            }

            if (gfiAttributes !== "ignore") {
                console.warn(`Layer has invalid gfiAttributes "${gfiAttributes}". Acting as if "ignore" was given.`);
            }

            return [];
        },

        /**
         * Prepares a key for display.
         * e.g. "very_important_field" becomes "Very Important Field"
         * @param {String} str key to beautify
         * @returns {String} beautified key
         */
        beautifyKey: function (str) {
            if (typeof str !== "string") {
                return "";
            }
            return str
                .split("_")
                .map(item => item.substring(0, 1).toUpperCase() + item.substring(1))
                .join(" ");
        },

        /**
         * Translates | separators to newlines.
         * @param {String} str string, potentially with separators '|'
         * @returns {String} beautified string
         */
        beautifyValue: function (str) {
            if (typeof str !== "string") {
                return "";
            }
            return str
                .split("|")
                .map(item => item.trim())
                .join("<br/>");
        },

        /**
         * helper function: check, if key has a valid value
         * @param {String} key parameter
         * @returns {Boolean} key is valid (i.e. not a member of ignoredKeys)
         */
        isValidKey: function (key) {
            return this.ignoredKeys.indexOf(key.toUpperCase()) === -1;
        },

        /**
         * helper function: check, if str has a valid value
         * @param {String} str parameter
         * @returns {Boolean} value is valid
         */
        isValidValue: function (str) {
            return Boolean(str && typeof str === "string" && str.toUpperCase() !== "NULL");
        },

        /**
         * Feature listing offer clickable elements to zoom to a feature.
         * @param {Object} event click event
         * @returns {void}
         */
        featureZoom: function (event) {
            const map = mapCollection.getMap("2D"),
                featureIndex = event.currentTarget.id.split("-")[0],
                selected = this.selectedFeaturesWithRenderInformation[featureIndex];

            map.getView().fit(selected.item.getGeometry());
            this.highlightFeature({feature: selected.item, layerId: selected.layerId});
        },

        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate (key, options = null) {
            if (key === "common:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the common translation");
            }
            return this.$t(key, options);
        }
    }
};
</script>

<template lang="html">
    <div
        id="selectFeatures"
    >
        <div
            v-if="selectedFeaturesWithRenderInformation.length === 0"
            class="selectFeaturesDefaultMessage"
        >
            {{ translate("common:modules.selectFeatures.noFeatureChosen") }}
        </div>
        <div
            v-else
            ref="select-features-tables"
            class="select-features-tables"
        >
            <div class="sticky-clear-container">
                <button
                    class="btn btn-primary btn-sm"
                    @click="clearFeatures"
                >
                    {{ translate("common:modules.selectFeatures.clearSelection") }}
                </button>
            </div>
            <br>
            <template
                v-for="(selectedFeature, index) in selectedFeaturesWithRenderInformation"
                :key="index"
            >
                <table
                    v-if="selectedFeature.properties.length > 0"
                    class="table table-striped table-bordered"
                >
                    <tbody>
                        <tr
                            v-for="(property, propIndex) in selectedFeature.properties"
                            :key="propIndex"
                        >
                            <td class="featureName">
                                {{ property[0] }}
                            </td>
                            <td
                                v-if="isEmailAddress(property[1])"
                                class="featureValue"
                            >
                                <a :href="`mailto:${property[1]}`">{{ property[1] }}</a>
                            </td>
                            <td
                                v-else-if="isPhoneNumber(property[1])"
                                class="featureValue"
                            >
                                <a :href="getPhoneNumberAsWebLink(property[1])">{{ property[1] }}</a>
                            </td>
                            <td
                                v-else-if="property[1] && (property[1].includes('<br') || property[1].includes('<a'))"
                                class="featureValue"
                                v-html="property[1]"
                            />
                            <td
                                v-else
                                class="featureValue"
                            >
                                {{ property[1] }}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p
                    v-else
                    :key="index + 'z'"
                >
                    {{ translate("common:modules.selectFeatures.propertylessFeature") }}
                </p>
                <div
                    class="feature-actions"
                >
                    <a
                        :id="index + '-selectFeatures-feature'"
                        :key="'a' + index"
                        href="#"
                        class="select-features-zoom-link"
                        @click="featureZoom"
                    >
                        {{ translate("common:modules.selectFeatures.zoomToFeature") }}
                    </a>
                    <button
                        class="btn btn-link btn-sm remove-feature-btn"
                        @click="removeFeature(index, selectedFeature.item)"
                    >
                        {{ translate("common:modules.selectFeatures.deselectFeature") }}
                    </button>
                </div>
                <hr
                    v-if="index !== selectedFeaturesWithRenderInformation.length - 1"
                    :key="'h' + index"
                >
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
.selectFeatures {
    max-width: 600px;
    max-height: 745px;
}

.select-features-tables {
    overflow-y: auto;
    position: relative;
}

.feature-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 5px;
}

.remove-feature-btn {
    color: red;
    cursor: pointer;
    font-size: 0.875rem;
    margin-left: 10px;
}

.sticky-clear-container {
    position: sticky;
    top: 0;
    background-color: #fff;
    z-index: 10;
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

td.featureName {
    width: 30%;
}

td.featureValue {
    width: 70%;
}
</style>
