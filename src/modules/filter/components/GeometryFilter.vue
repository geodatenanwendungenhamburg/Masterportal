<script>
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import Draw, {createBox, createRegularPolygon} from "ol/interaction/Draw.js";
import {Fill, Stroke, Style} from "ol/style.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {Vector as VectorSource} from "ol/source.js";
import {Vector as VectorLayer} from "ol/layer.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import OL3Parser from "jsts/org/locationtech/jts/io/OL3Parser.js";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import {
    LineString,
    LinearRing,
    Point,
    Polygon,
    MultiPolygon
} from "ol/geom.js";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject.js";
import {translateKeyWithPlausibilityCheck} from "@shared/js/utils/translateKeyWithPlausibilityCheck.js";
import sortBy from "@shared/js/utils/sortBy.js";

/**
 * Geometry Filter
 * @module modules/GeometryFilter
 * @vue-prop {Number} circleSides - The number of circle sides.
 * @vue-prop {Number} defaultBuffer - The default buffer number.
 * @vue-prop {String} fillColor - The fill color as rbga string.
 * @vue-prop {Array} geometries - A list of all the geometries.
 * @vue-prop {Array|Boolean} additionalGeometries - A list of all the geometries or boolean.
 * @vue-prop {Boolean} invertGeometry - Shows if geometry is inverted.
 * @vue-prop {String} strokeColor - The stroke color as rbga string.
 * @vue-prop {Number} strokeWidth - The stroke width.
 * @vue-prop {Object|Boolean} filterGeometry - Shows if geometry should be filtered.
 * @vue-prop {Object} geometryFeature - The geometry feature.
 * @vue-prop {Object} initSelectedGeometryIndex - The initial geometry index.
 * @vue-data {Boolean} isActive - Shows if geometry filter is active.
 * @vue-data {Object} buffer - The buffer.
 * @vue-data {Boolean} isBufferInputVisible - Shows if buffer input is visible.
 * @vue-data {Boolean} isGeometryVisible - Shows if geometry input is visible.
 * @vue-data {Number} selectedGeometryIndex - The selected geometry Index.
 * @vue-data {String} lastMouseMapInteractionsComponent - The last mouse map interaction.
 */
export default {
    name: "GeometryFilter",
    components: {
        ButtonGroup,
        IconButton,
        FlatButton
    },
    props: {
        circleSides: {
            type: Number,
            required: false,
            default: 256
        },
        defaultBuffer: {
            type: Number,
            required: false,
            default: 20
        },
        fillColor: {
            type: String,
            required: false,
            default: "rgba(0, 0, 0, 0.33)"
        },
        geometries: {
            type: Array,
            required: false,
            default: () => ["Polygon", "Rectangle", "Circle", "LineString"]
        },
        additionalGeometries: {
            type: [Array, Boolean],
            required: false,
            default: false
        },
        invertGeometry: {
            type: Boolean,
            required: false,
            default: true
        },
        isActive: {
            type: Boolean,
            required: false,
            default: false
        },
        strokeColor: {
            type: String,
            required: false,
            default: "rgba(0, 0, 0, 1)"
        },
        strokeWidth: {
            type: Number,
            required: false,
            default: 1
        },
        filterGeometry: {
            type: [Object, Boolean],
            required: false,
            default: false
        },
        geometryFeature: {
            type: Object,
            required: false,
            default: undefined
        },
        initSelectedGeometryIndex: {
            type: Number,
            required: false,
            default: 0
        }
    },
    emits: ["updateGeometrySelectorOptions", "updateFilterGeometry", "updateGeometryFeature"],
    data () {
        return {
            buffer: this.defaultBuffer,
            isBufferInputVisible: false,
            isGeometryVisible: false,
            selectedGeometryIndex: this.initSelectedGeometryIndex === null ? 0 : this.initSelectedGeometryIndex,
            lastMouseMapInteractionsComponent: "",
            buttonGroupLevels: [
                {name: translateKeyWithPlausibilityCheck("common:modules.filter.geometryFilter.geometries", key => this.$t(key))},
                {name: translateKeyWithPlausibilityCheck("common:modules.filter.geometryFilter.regions", key => this.$t(key))}
            ],
            selectedGroup: ""
        };
    },
    computed: {
        ...mapGetters("Menu", [
            "currentComponent",
            "currentMouseMapInteractionsComponent"
        ]),
        ...mapGetters("Modules/Filter", [
            "type",
            "menuSide"
        ])
    },
    watch: {
        isActive: {
            handler (val) {
                if (!val) {
                    if (this.selectedGroup === "geom" && this.draw instanceof Draw) {
                        this.draw.setActive(false);
                        this.selectedGeometryIndex = -10;
                    }
                }
            },
            deep: true
        },
        selectedGroup (newValue) {
            if (this.draw instanceof Draw) {
                this.draw.setActive(!(newValue === "addit"));
            }
        },
        selectedGeometryIndex (newValue) {
            if (newValue === -1) {
                this.reset();
                return;
            }
            const selectedGeometry = this.getSelectedGeometry(newValue);

            if (this.draw) {
                this.removeInteraction(this.draw);
            }
            if (selectedGeometry?.type === "additional") {
                this.layer.getSource().clear();
                this.update(selectedGeometry.feature, selectedGeometry.type, selectedGeometry.innerPolygon);
                this.layer.getSource().addFeature(this.feature);
            }
            else if (selectedGeometry?.type) {
                this.setDrawInteraction(selectedGeometry?.type);
            }
        },
        buffer (val) {
            if (!this.feature) {
                return;
            }
            const newValue = isNaN(parseInt(val, 10)) ? this.defaultBuffer : val,
                jstsGeom = this.ol3Parser.read(this.initFeatureGeometry),
                buffered = BufferOp.bufferOp(jstsGeom, newValue);

            if (newValue <= 0) {
                return;
            }
            this.setGeometryAtFeature(this.feature, this.ol3Parser.write(buffered), this.invertGeometry);

            clearInterval(this.intvBuffer);
            this.intvBuffer = setInterval(() => {
                clearInterval(this.intvBuffer);
                this.emitGeometryOfLineBuffer(this.feature.getGeometry().getCoordinates());
            }, 800);
            if (!isNaN(parseInt(val, 10))) {
                this.$emit("updateGeometrySelectorOptions", {
                    "defaultBuffer": Number(val)
                });
            }
        },
        additionalGeometries: {
            handler (value) {
                if (!Array.isArray(value) && value.length) {
                    return;
                }
                this.allGeometries = this.getGeometries();
            },
            deep: true
        }
    },
    created () {
        this.setNonReactiveData();
        this.initializeLayer(this.filterGeometry);
        this.lastMouseMapInteractionsComponent = this.currentMouseMapInteractionsComponent;
        this.setHasMouseMapInteractions(true);
        this.changeCurrentMouseMapInteractionsComponent({type: this.type, side: this.menuSide});
        if (this.draw instanceof Draw && this.getSelectedGeometry(this.selectedGeometryIndex)?.type !== "additional") {
            this.draw.setActive(true);
        }
    },
    mounted () {
        this.setSelectedGroup(this.buttonGroupLevels[0].name);
    },
    beforeUnmount () {
        if (this.draw) {
            this.removeInteraction(this.draw);
        }
        mapCollection.getMap("2D").removeLayer(this.layer);
    },

    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction", "addLayer"]),
        ...mapActions("Menu", ["changeCurrentMouseMapInteractionsComponent"]),
        ...mapMutations("Modules/Filter", ["setHasMouseMapInteractions"]),
        translateKeyWithPlausibilityCheck,

        /**
         * Sets the selected geometry index
         * @param {Number} index - The selected geometry index
         * @returns {void}
         */
        setSelectedGeometryIndex (index) {
            if (this.selectedGeometryIndex === index) {
                if (this.selectedGroup === "geom") {
                    if (this.draw instanceof Draw) {
                        this.draw.setActive(false);
                    }
                    this.selectedGeometryIndex = -10;
                }
                else {
                    this.selectedGeometryIndex = -1;
                }
                return;
            }
            this.selectedGeometryIndex = index;
        },
        /**
         * Sets the selected group
         * @param {String} grp - The selected group.
         * @returns {void}
         */
        setSelectedGroup (grp) {
            switch (grp) {
                case this.$t("common:modules.filter.geometryFilter.geometries"):
                    this.selectedGroup = "geom";
                    break;
                case this.$t("common:modules.filter.geometryFilter.regions"):
                    this.selectedGroup = "addit";
                    break;
                default:
                    throw new Error(grp + " is invalid");
            }
        },
        /**
         * Sets all needed non reactive data.
         * @returns {void}
         */
        setNonReactiveData () {
            // the current feature of the geometry filter
            this.feature = undefined;

            // jsts is used to calculate a buffer around a linestring
            this.ol3Parser = new OL3Parser();
            this.ol3Parser.inject(
                Point,
                LineString,
                LinearRing,
                Polygon
            );

            // is also used to calculate the buffer around a linestring
            this.initFeatureGeometry = null;

            // sets the layer representing the filter geometry
            this.setLayer();

            // default geometries and possible additional geometries
            this.allGeometries = this.getGeometries();

            // sets the interaction to draw the filter geometry
            if (isObject(this.getSelectedGeometry(this.selectedGeometryIndex))
                && this.getSelectedGeometry(this.selectedGeometryIndex).type !== "additional") {
                this.setDrawInteraction(this.getSelectedGeometry(this.selectedGeometryIndex).type);
            }
        },

        /**
         * Initializes the layer and registers it at the map.
         * @returns {void}
         */
        setLayer () {
            this.layer = new VectorLayer({
                id: "geometry-filter",
                name: "geometry-filter",
                source: new VectorSource(),
                style: new Style({
                    fill: new Fill({
                        color: this.fillColor
                    }),
                    stroke: new Stroke({
                        color: this.strokeColor,
                        width: this.strokeWidth
                    })
                }),
                alwaysOnTop: true
            });

            this.addLayer(this.layer);
            if (typeof this.geometryFeature !== "undefined") {
                this.layer.getSource().addFeature(this.geometryFeature);
            }
        },

        /**
         * Sets interaction for drawing feature geometries and registers it at the map.
         * @param {String} drawType - Geometry type of the geometry being drawn with this interaction.
         * @returns {void}
         */
        setDrawInteraction (drawType) {
            this.draw = new Draw({
                source: this.layer.getSource(),
                type: drawType === "Rectangle" ? "Circle" : drawType,
                geometryFunction: this.getGeometryFunction(drawType, this.circleSides)
            });

            this.draw.on("drawend", (evt) => {
                const feature = evt.feature,
                    geometry = this.getGeometryOnDrawEnd(feature, drawType, this.buffer);

                this.initFeatureGeometry = feature.getGeometry();
                this.setGeometryAtFeature(feature, geometry, this.invertGeometry);
                this.update(feature, drawType, geometry);
            });

            this.draw.on("drawstart", () => {
                this.isGeometryVisible = false;
                this.layer.getSource().clear();
            });

            this.draw.setActive(true);
            this.addInteraction(this.draw);
        },

        /**
         * Returns the currently selected geometry bases on the index set at the select box.
         * @param {Number} index - The index of the selected geometry.
         * @returns {Object} The currently selected geometry as object with type and name.
         */
        getSelectedGeometry (index) {
            return this.allGeometries[index];
        },
        /**
         * Returns the corresponding icon.
         * @param {String} type - The type of the icon.
         * @returns {string} bootsrap icon class.
         */
        getIcon (type) {
            switch (type) {
                case "Polygon":
                    return "bi-octagon";
                case "Rectangle":
                    return "bi-square";
                case "Circle":
                    return "bi-circle";
                case "LineString":
                    return "bi-slash-lg";
                default:
                    throw new Error(type + " is invalid");
            }
        },
        /**
         * Returns the list of all possible geometries with translations.
         * @returns {Object[]} A list of objects containing type and name of geometries.
         */
        getGeometries () {
            const result = [],
                possibleGeometries = {
                    "Polygon": this.$t("common:modules.filter.geometryFilter.geometryTypes.polygon"),
                    "Rectangle": this.$t("common:modules.filter.geometryFilter.geometryTypes.rectangle"),
                    "Circle": this.$t("common:modules.filter.geometryFilter.geometryTypes.circle"),
                    "LineString": this.$t("common:modules.filter.geometryFilter.geometryTypes.lineString")
                },
                additionalGeometries = this.prepareAdditionalGeometries(this.additionalGeometries);

            this.geometries.forEach(type => {
                if (Object.prototype.hasOwnProperty.call(possibleGeometries, type)) {
                    result.push({
                        type,
                        name: possibleGeometries[type]
                    });
                }
            });

            return result.concat(sortBy(additionalGeometries, "name"));
        },

        /**
         * Returns a list of all additional geometries.
         * @param {Object|Boolean} additionalGeometries - The additional geometries otherwise false.
         * @returns {Object[]} A list of objects containing the prepared additional geometries.
         */
        prepareAdditionalGeometries (additionalGeometries) {
            const result = [];

            if (!additionalGeometries) {
                return result;
            }
            additionalGeometries.forEach(additionalGeometry => {
                if (!Array.isArray(additionalGeometry?.features)) {
                    return;
                }
                additionalGeometry.features.forEach(feature => {
                    if (typeof feature.get !== "function") {
                        return;
                    }

                    if (feature.getGeometry() instanceof MultiPolygon) {
                        this.setGeometryAtFeature(feature, feature.getGeometry(), this.invertGeometry);
                    }

                    result.push({
                        type: "additional",
                        feature: feature,
                        innerPolygon: this.getInnerPolygon(feature.getGeometry()),
                        name: feature.get(`${additionalGeometry.attrNameForTitle}`)
                    });
                });
            });

            return result;
        },

        /**
         * Checks the number of rings of the polygon and gets only the interior ring as a polygon.
         * If there are more than two rings, the exterior linear ring is available at index 0 and the interior rings at index 1 and beyond
         * @param {ol/Polygon} geometry - Polygon.
         * @returns {ol/Polygon} The interior ring as a polygon.
         */
        getInnerPolygon (geometry) {
            if (geometry.getLinearRingCount() > 1) {
                return new Polygon([geometry.getLinearRings()[1].getCoordinates()]);
            }
            return new Polygon([geometry.getLinearRings()[0].getCoordinates()]);
        },

        /**
         * Returns the geometry of the given feature and calculates a buffer around the geometry if it is a linestring.
         * @param {ol/Feature} feature - The feature to get the geometry from.
         * @param {String} type - The type of the feature geometry.
         * @param {Number} buffer - The buffer to use for buffered line.
         * @returns {ol/geom/Geometry} The geometry of the feature.
         */
        getGeometryOnDrawEnd (feature, type, buffer) {
            if (type === "LineString") {
                const jstsGeom = this.ol3Parser.read(feature.getGeometry()),
                    buffered = BufferOp.bufferOp(jstsGeom, buffer);

                return this.ol3Parser.write(buffered);
            }
            return feature.getGeometry();
        },

        /**
         * Returns the geometryFunction for the given geometry type.
         * @param {String} selectedGeometryType The geometry type.
         * @param {Number} circleSides The number of points to use in case of a circle to polygon transformation.
         * @returns {Function} The function to use or undefined.
         */
        getGeometryFunction (selectedGeometryType, circleSides) {
            if (selectedGeometryType === "Rectangle") {
                return createBox();
            }
            else if (selectedGeometryType === "Circle") {
                return createRegularPolygon(circleSides < 3 ? 3 : circleSides);
            }
            return undefined;
        },

        /**
         * Update the geometry filter.
         * @param {ol/Feature} feature - The current feature to get the geometry from.
         * @param {String} type - The type of the feature geometry.
         * @param {ol/geom/Geometry} geometry - The geometry to set.
         * @returns {void}
         */
        update (feature, type, geometry) {
            this.feature = feature;
            this.isGeometryVisible = true;
            this.isBufferInputVisible = type === "LineString";
            this.$emit("updateFilterGeometry", geometry);
            this.$emit("updateGeometryFeature", this.feature);
            this.$emit("updateGeometrySelectorOptions", {
                "selectedGeometry": this.selectedGeometryIndex,
                "defaultBuffer": Number(this.buffer)
            });
        },

        /**
         * Sets the given geometry or the inverted at the feature of the instance.
         * @param {ol/Feature} feature - The feature to set the geometry at.
         * @param {ol/geom/Geometry} geometry - The geometry to set.
         * @param {Boolean} invertGeometry - If the geometry should be inverted.
         * @returns {void}
         */
        setGeometryAtFeature (feature, geometry, invertGeometry) {
            if (invertGeometry && typeof invertGeometry === "boolean") {
                const quiteLargePolygon = new Polygon([
                    [
                        [-1877994.66, 3932281.56],
                        [-1877994.66, 9494203.2],
                        [804418.76, 9494203.2],
                        [804418.76, 3932281.56],
                        [-1877994.66, 3932281.56]
                    ]
                ]);

                if (geometry instanceof Polygon) {
                    this.addInteriorPolygon(quiteLargePolygon, geometry);
                    feature.setGeometry(quiteLargePolygon);
                }
                else if (geometry instanceof MultiPolygon) {
                    geometry.getPolygons().forEach(polygon => {
                        this.addInteriorPolygon(quiteLargePolygon, polygon);
                    });
                    feature.setGeometry(quiteLargePolygon);
                }
            }
            else {
                feature.setGeometry(geometry);
            }
        },

        /**
         * Adds interior linear ring(s) to a polygon.
         * If necessary, the coordinates are converted to the correct geometry layout (e.g. "XYZ" -> "XY").
         * @param {ol/geom/Polygon} polygon - The surface of the polygon (outer-boundary).
         * @param {ol/geom/Polygon} interiorPolygon - The hole(s) in the surface of the polygon (inner-boundary).
         * @return {void}
         */
        addInteriorPolygon (polygon, interiorPolygon) {
            if (interiorPolygon.getLayout() !== "XY") {
                const coords = interiorPolygon.getCoordinates();

                interiorPolygon.setCoordinates(coords, "XY");
            }
            interiorPolygon.getLinearRings().forEach(linearRing => {
                polygon.appendLinearRing(linearRing);
            });
        },

        /**
         * Resets the geometry filter.
         * @returns {void}
         */
        reset () {
            this.isGeometryVisible = false;
            this.isBufferInputVisible = false;
            this.selectedGeometryIndex = -1;
            this.draw?.setActive(false);
            this.layer.getSource().clear();
            this.$emit("updateFilterGeometry", false);
            this.$emit("updateGeometryFeature", undefined);
            this.$emit("updateGeometrySelectorOptions", {
                "selectedGeometry": 0,
                "defaultBuffer": 20
            });
        },

        /**
         * Emits updateFilterGeometry with a new polygon, using the given coordinates.
         * @param {ol/coordinate[]} coordinates The coordinates of the polygon.
         * @returns {void}
         */
        emitGeometryOfLineBuffer (coordinates) {
            if (!Array.isArray(coordinates)) {
                this.$emit("updateFilterGeometry", false);
                return;
            }
            const geomCoordinate = coordinates.length === 2 ? coordinates[1] : coordinates[0];

            this.$emit("updateFilterGeometry", new Polygon([geomCoordinate]));
        },

        /**
         * Initializes the layer if the geometry exists already
         * @param {ol/geom/Geometry|Boolean} filterGeometry The filtered geometry, false if it does not exist.
         * @returns {void}
         */
        initializeLayer (filterGeometry) {
            if (isObject(filterGeometry)) {
                this.isGeometryVisible = true;
            }
        }
    }
};
</script>

<template lang="html">
    <div id="geometryFilter">
        <div
            class="col-md-auto mb-3"
        >
            <ButtonGroup
                :buttons="buttonGroupLevels"
                :pre-checked-value="selectedGroup"
                group="geoGroups"
                class="level-switch"
                @set-selected-button="setSelectedGroup"
            />
            <div
                v-if="selectedGroup === 'addit'"
                class="mt-3 mb-3 ms-0"
            >
                {{ translateKeyWithPlausibilityCheck("common:modules.filter.geometryFilter.selectRegion", key => $t(key)) }}
            </div>
            <div
                v-else
                class="mt-3 mb-3 ms-0"
            >
                {{ translateKeyWithPlausibilityCheck("common:modules.filter.geometryFilter.selectGeometry", key => $t(key)) }}
            </div>
            <div
                class="d-flex flex-wrap bd-highlight mb-3"
            >
                <div
                    v-for="(geometry, index) in allGeometries"
                    :key="index"
                >
                    <div
                        v-if="selectedGroup !== 'addit' && geometry.type !== 'additional'"
                        class="icon-btn-wrapper flex-column d-flex align-items-center"
                    >
                        <IconButton
                            v-if="selectedGroup !== 'addit' && geometry.type !== 'additional'"
                            :id="geometry.type"
                            :key="geometry.type"
                            :aria="$t('common:modules.filter.geometryFilter.selectGeometry')"
                            :class-array="[
                                'btn-primary',
                                selectedGeometryIndex === index ? 'active' : ''
                            ]"
                            :interaction="() => setSelectedGeometryIndex(index)"
                            :icon="getIcon(geometry.type)"
                            :label="geometry.name"
                            class="d-flex align-items-center mx-1 mb-1"
                        />
                    </div>
                    <FlatButton
                        v-if="selectedGroup === 'addit' && geometry.type === 'additional'"
                        :text="geometry.name"
                        :interaction="() => setSelectedGeometryIndex(index)"
                        :customclass="selectedGeometryIndex === index ? 'active selected me-1 button-primary' : 'me-1 button-primary'"
                    />
                </div>
                <div class="flex-column d-flex trash-btn-wrapper">
                    <IconButton
                        :class-array="['btn-primary']"
                        :aria="$t('common:modules.filter.geometryFilter.delete')"
                        icon="bi bi-trash"
                        :interaction="() => reset()"
                        :label="$t('common:modules.filter.geometryFilter.delete')"
                    />
                </div>
            </div>
        </div>
        <div
            v-if="isBufferInputVisible"
            class="form-floating mb-3 mt-3"
        >
            <input
                id="inputLineBuffer"
                v-model="buffer"
                class="form-control"
                type="number"
                min="1"
            >
            <label
                for="inputLineBuffer"
                class="form-label"
            >
                {{ translateKeyWithPlausibilityCheck("common:modules.filter.geometryFilter.buffer", key => $t(key)) }}
            </label>
        </div>
    </div>
</template>

<style lang="scss">

#geometryFilter {

    .btn-check:checked + .btn {
        background: $secondary;
        color: $white;
        border-color: $secondary;
        position: relative;

        .loading {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.3);
            text-align: center;
            align-content: center;
        }
    }

    .btn-primary .btn:hover {
        background: $dark;
        border-color: $dark;
    }

    .button-wrapper {
        &:first-child {
            .btn {
                border-top-left-radius: 20px;
                border-bottom-left-radius: 20px;
            }
        }

        &:last-child {
            .btn {
                border-top-right-radius: 20px;
                border-bottom-right-radius: 20px;
            }
        }
    }
    .form-control:focus ~ label {
    color: $secondary;
}
    .input-label {
        color: $placeholder-color;
    }

    hr {
        margin-left: -20px;
        margin-right: -20px;
    }

    .form-check {
        label {
            margin-top: 3px;
        }
    }
    .btn-wrapper {
        font-family: MasterPortalFont, Arial, sans-serif;
        font-size: 0.857rem;
    }
    .icon-btn-wrapper {
        width: 62px;
    }
    .trash-btn-wrapper {
        width: 60px;
    }
    .button-primary {
        --bs-btn-color: #001B3D;
        --bs-btn-bg: #D6E3FF;
        --bs-btn-border-radius: 16px;
        --bs-btn-hover-color: #fff;
        --bs-btn-hover-bg: #001B3D;
        --bs-btn-active-color: #fff;
        --bs-btn-active-bg: #151C27;
        --bs-btn-focus-color: #fff;
        border-color: var(--bs-btn-hover-border-color);
    }
    .button-primary:hover {
        color: var(--bs-btn-hover-color);
        background-color: var(--bs-btn-hover-bg);
        border-color: var(--bs-btn-hover-border-color);
    }
    .btn-label {
        margin-top: $content_space;
    }
}
</style>
