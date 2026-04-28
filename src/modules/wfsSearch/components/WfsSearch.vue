<script>
import TableComponent from "@shared/modules/table/components/TableComponent.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import WfsSearchLiteral from "./WfsSearchLiteral.vue";
import {createUserHelp} from "../js/literalFunctions.js";
import requestProvider from "../js/requests.js";
import getGeometry from "../js/getGeometry.js";
import isObject from "@shared/js/utils/isObject.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import Feature from "ol/Feature.js";
import mapMarker from "@core/maps/js/mapMarker.js";

/**
 * Wfs Search
 * @module modules/WfsSearch
 * @vue-props {Number} zoomLevelProp - Can be set if a zoom level (after succesfull parcel search) is required that is different from the configured one.
 * @vue-props {Boolean} showResetButton - Can be set to false to not render a reset button.
 * @vue-computed {Object} headers - The table headers für Search Results.
 * @vue-computed {Object} resultsForTable - The results in the right format for the table.
 * @vue-computed {String} geometryName - The name of the geometry.
 * @vue-computed {Boolean} showResults - Shows if results should be displayed.
 * @vue-computed {Object} tableData - Object for the TableComponent.
 */
export default {
    name: "WfsSearch",
    components: {
        WfsSearchLiteral,
        TableComponent,
        FlatButton
    },
    props: {
        zoomLevelProp: {
            type: Number,
            required: false,
            default: undefined
        },
        showResetButton: {
            type: Boolean,
            required: false,
            default: true
        },
        resetParcelSearch: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    data () {
        return {
            noResultsFound: false,
            zoomToSlotName: "cell-geometry",
            selectedRows: []
        };
    },
    computed: {
        ...mapGetters("Modules/WfsSearch", [
            "name",
            "instances",
            "userHelp",
            "results",
            "searched",
            "service",
            "showResultList",
            "zoomLevel",
            "resultsPerPage",
            "multiSelect",
            "fullViewEnabled",
            "currentInstance",
            "requiredFields"
        ]),
        ...mapGetters("Modules/Language", ["currentLocale"]),
        zoomButtonInColumn () {
            return this.currentInstance.zoomButtonInColumn !== false;
        },
        headers () {
            if (this.results.length === 0) {
                return null;
            }

            const {resultList} = this.currentInstance;

            if (isObject(resultList)) {
                const tableHeaders = [];

                Object.keys(resultList).forEach(result => {
                    const resultName = resultList[result];

                    tableHeaders.push({name: result, displayName: resultName, order: "origin"});
                });
                return tableHeaders;
            }
            if (resultList === "showAll") {
                const tableHeaders = [],
                    lengths = this.results.map(feature => Object.keys(feature.values_).length),
                    indexOfFeatureWithMostAttr = lengths.indexOf(Math.max(...lengths));

                Object.keys(this.results[indexOfFeatureWithMostAttr].values_)
                    .reduce((acc, curr) => {
                        const headerObj = {name: curr, order: "origin"};

                        tableHeaders.push(headerObj);

                        return tableHeaders;
                    }, {});
                return tableHeaders;
            }
            this.setShowResultList(false);
            return null;
        },
        resultsForTable () {
            const resultArr = [];

            if (this.results.length > 0) {
                this.results.forEach((result) => {
                    resultArr.push(result.values_);
                });
                return resultArr;
            }
            return this.results;
        },
        geometryName () {
            return this.results[0].getGeometryName();
        },
        tableData () {
            return {
                "headers": this.headers,
                "items": this.resultsForTable
            };
        },
        selectedItemNames () {
            if (!this.selectedRows || this.selectedRows.length === 0) {
                return [];
            }
            const {resultList} = this.currentInstance;

            return this.selectedRows.map((row, index) => {
                if (isObject(resultList)) {
                    const displayParts = [];

                    Object.keys(resultList).forEach(fieldName => {
                        if (row[fieldName] !== undefined && row[fieldName] !== null && fieldName !== "geometry" && fieldName !== "geom") {
                            displayParts.push(row[fieldName]);
                        }
                    });

                    if (displayParts.length > 0) {
                        return displayParts.join(" - ");
                    }
                }

                const values = Object.entries(row)
                    .filter(([key, val]) => key !== "geometry" && key !== "geom" && val !== null && val !== undefined)
                    .map(([, val]) => val);

                return values.length > 0 ? values[0] : `Item ${index + 1}`;
            });
        }
    },
    watch: {
        currentLocale () {
            if (this.userHelp !== "hide") {
                createUserHelp(this.currentInstance.literals);
            }
        },
        resetParcelSearch (val) {
            if (val) {
                this.resetUI();
            }
        }
    },
    created () {
        this.prepareModule();
    },
    unmounted () {
        this.resetModule(true);
    },
    methods: {
        ...mapMutations("Modules/WfsSearch", [
            "setSearched",
            "setResults",
            "setShowResultList",
            "setZoomLevel"
        ]),
        ...mapActions("Modules/WfsSearch", [
            "instanceChanged",
            "prepareModule",
            "resetModule",
            "resetResult"
        ]),
        ...mapActions("Maps", [
            "placingPointMarker",
            "placingPolygonMarker",
            "removePointMarker",
            "removePolygonMarker",
            "setCenter",
            "setZoom",
            "zoomToExtent"
        ]),
        /**
         * Gets the keys to use for comparing rows, filtering out geometry and technical fields.
         * @param {Object} row The row object.
         * @returns {Array<String>} Array of key names to use for comparison.
         */
        getCompareKeys (row) {
            const {resultList} = this.currentInstance,
                geometryKeys = ["geometry", "geom", "the_geom", "wkb_geometry"],
                technicalKeys = ["boundedBy", "code", "fuuid", "identificatie", "ligtInProvincieCode"];

            if (isObject(resultList)) {
                return Object.keys(resultList).filter(key => !geometryKeys.includes(key) && key in row
                );
            }

            return Object.keys(row).filter(key => !geometryKeys.includes(key) && !technicalKeys.includes(key)
            );
        },
        /**
         * Generates a unique ID for a row based on its data.
         * @param {Object} row The row object.
         * @returns {String} A unique identifier for the row.
         */
        getRowId (row) {
            const compareKeys = this.getCompareKeys(row),
                signature = compareKeys.map(key => String(row[key] || "")).join("-");
            let hash = 0;

            for (let i = 0; i < signature.length; i++) {
                const char = signature.charCodeAt(i);

                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return `row-${Math.abs(hash)}`;
        },
        /**
         * Checks if a row is currently selected.
         * @param {Object} row The row object to check.
         * @returns {Boolean} True if the row is selected, false otherwise.
         */
        isRowSelected (row) {
            if (!this.multiSelect || this.selectedRows.length === 0) {
                return false;
            }

            const compareKeys = this.getCompareKeys(row),
                rowSignature = compareKeys.map(key => `${key}:${row[key]}`).sort().join("|");

            return this.selectedRows.some(selectedRow => {
                const selectedSignature = compareKeys
                    .filter(key => key in selectedRow)
                    .map(key => `${key}:${selectedRow[key]}`)
                    .sort()
                    .join("|");

                return rowSignature === selectedSignature;
            });
        },
        /**
         * Resets the selection and inputs fields and the results.
         * @returns {void}
         */
        resetUI () {
            this.noResultsFound = false;
            this.selectedRows = [];
            const inputFields = document.getElementsByClassName("module-wfsSearch-field-input");

            for (const input of inputFields) {
                input.value = "";
            }
            this.resetResult();
            this.setShowResultList(false);
            this.removePolygonMarker();
        },
        /**
         * Searches the configured service and shows adds the results to the List in the Modal.
         * @returns {Promise<void>} The returned promise isn't used any further as it resolves to nothing.
         */
        async search () {
            this.noResultsFound = false;
            this.setSearched(true);
            const features = await requestProvider.searchFeatures(this.$store, this.currentInstance, this.service);

            if (features.length === 0) {
                this.noResultsFound = true;
            }

            this.setResults([]);
            features.forEach(feature => {
                this.results.push(feature);
            });

            if (this.currentInstance?.resultList !== undefined) {
                this.setShowResultList(true);
            }
            else if (features.length > 0) {
                this.markerAndZoom(features[0].getGeometry());
            }
        },

        /**
         * Sets a point or polygon marker for a feature geometry and zoom to it.
         * @param {ol/geom/Geometry} geometry The geometry of a ol feature with coordinates.
         * @returns {void}
         */
        markerAndZoom (geometry) {
            const coordinates = geometry.getCoordinates();

            if (coordinates.length === 2 && !Array.isArray(coordinates[0])) {
                this.placingPointMarker(coordinates);
                this.setCenter(coordinates);
                this.setZoom(this.zoomLevelProp || this.zoomLevel);
            }
            else {
                this.placingPolygonMarker(geometry);
                this.zoomToExtent({extent: geometry.getExtent()});
            }
        },
        /**
         * Retracts the geometry from the row object.
         * @param {Object} row row object from the table.
         * * @returns {ol/geom/Geometry} The geometry of the row.
         */
        returnGeometryFromRow (row) {
            return getGeometry(this.results, row);
        },
        /**
         * Handles row selection. If multiSelect is enabled, adds/removes rows from selection,
         * otherwise replaces the selection with the new row.
         * @param {Object} row The selected row object from the table.
         * @returns {void}
         */
        handleRowSelected (row) {
            if (this.multiSelect) {
                const rowClone = JSON.parse(JSON.stringify(row)),
                    compareKeys = this.getCompareKeys(rowClone),
                    rowSignature = compareKeys.map(key => `${key}:${rowClone[key]}`).sort().join("|"),
                    existingIndex = this.selectedRows.findIndex(selectedRow => {
                        const selectedSignature = compareKeys
                            .filter(key => key in selectedRow)
                            .map(key => `${key}:${selectedRow[key]}`)
                            .sort()
                            .join("|");

                        return rowSignature === selectedSignature;
                    });

                if (compareKeys.length === 0) {
                    return;
                }

                if (existingIndex >= 0) {
                    this.selectedRows.splice(existingIndex, 1);
                }
                else {
                    const rowToStore = {};

                    compareKeys.forEach(key => {
                        if (key in rowClone) {
                            rowToStore[key] = rowClone[key];
                        }
                    });
                    this.selectedRows.push(rowToStore);
                }

                this.updateMultiSelectMarkers();
            }
            else {
                this.selectedRows = [row];
                const geometry = this.returnGeometryFromRow(row);

                if (geometry) {
                    this.markerAndZoom(geometry);
                }
            }
        },
        /**
         * Calculates the combined extent of multiple geometries.
         * @param {ol/geom/Geometry[]} geometries Array of geometries.
         * @returns {Array<Number>} The combined extent [minX, minY, maxX, maxY].
         */
        getCombinedExtent (geometries) {
            if (geometries.length === 0) {
                return null;
            }

            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

            geometries.forEach(geometry => {
                if (geometry && typeof geometry.getExtent === "function") {
                    const extent = geometry.getExtent();

                    minX = Math.min(minX, extent[0]);
                    minY = Math.min(minY, extent[1]);
                    maxX = Math.max(maxX, extent[2]);
                    maxY = Math.max(maxY, extent[3]);
                }
            });

            return [minX, minY, maxX, maxY];
        },
        /**
         * Updates markers on the map for all currently selected rows when multiSelect is enabled.
         * Clears all previous markers and places new ones for each selected feature.
         * @returns {void}
         */
        updateMultiSelectMarkers () {
            const polygonLayer = mapMarker.getMapmarkerLayerById("marker_polygon_layer"),
                geometries = this.selectedRows
                    .map(row => this.returnGeometryFromRow(row))
                    .filter(geometry => geometry !== null && typeof geometry.getExtent === "function");

            if (polygonLayer) {
                polygonLayer.getSource().clear();
            }

            if (this.selectedRows.length === 0) {
                return;
            }

            if (geometries.length === 0) {
                console.warn("No valid geometries found for selected rows");
                return;
            }

            geometries.forEach((geometry, index) => {
                const feature = new Feature({geometry: geometry.clone()});

                feature.setId(`wfsSearch_polygon_${index}_${Date.now()}`);
                mapMarker.addFeatureToMapMarkerLayer("marker_polygon_layer", feature);
            });
        },
        /**
         * Zooms to all currently selected features when multiSelect is enabled.
         * @param {Event} event The click event from the button.
         * @returns {void}
         */
        zoomToSelectedFeatures (event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            const geometries = this.selectedRows
                .map(row => this.returnGeometryFromRow(row))
                .filter(geometry => geometry !== null && typeof geometry.getExtent === "function");

            if (geometries.length === 0) {
                return;
            }

            if (geometries.length === 1) {
                this.markerAndZoom(geometries[0]);
            }
            else {
                const combinedExtent = this.getCombinedExtent(geometries);

                if (combinedExtent) {
                    this.zoomToExtent({extent: combinedExtent});
                }
            }
        }
    }
};
</script>

<template>
    <div>
        <div>
            <form
                role="form"
                @submit.prevent="search"
            >
                <template
                    v-if="instances.length > 1"
                >
                    <div class="form-floating">
                        <select
                            id="module-wfsSearch-instances-select"
                            class="form-select"
                            @change="instanceChanged($event.currentTarget.value)"
                        >
                            <option
                                v-for="({title}, i) of instances"
                                :key="title + i"
                                :value="i"
                            >
                                {{ $t(title) }}
                            </option>
                        </select>
                        <label
                            id="module-wfsSearch-instances-select-label"
                            for="module-wfsSearch-instances-select"
                        >
                            {{ $t("common:modules.wfsSearch.instancesSelectLabel") }}
                        </label>
                    </div>
                </template>
                <div
                    v-if="userHelp !== 'hide'"
                    id="module-wfsSearch-userHelp"
                    class="justify-content-center mt-3"
                >
                    <i
                        id="module-wfsSearch-userHelp-icon"
                        class="col-md-1 bi-info-circle me-3"
                    />
                    <span
                        id="module-wfsSearch-userHelp-text"
                        class="col-md-11"
                        :aria-label="$t('common:modules.wfsSearch.userHelp.label')"
                        v-html="$t('common:modules.wfsSearch.userHelp.text', {userHelp})"
                    />
                </div>
                <div
                    v-for="(literal, i) of currentInstance.literals"
                    :key="'module-wfsSearch-clause' + i"
                >
                    <WfsSearchLiteral
                        :literal="literal"
                    />
                </div>
                <div class="row">
                    <div
                        :class="[showResetButton ? 'col-md-6' : 'col']"
                        class="d-flex justify-content-center"
                    >
                        <FlatButton
                            id="module-wfsSearch-button-search"
                            :type="'submit'"
                            :text="$t('common:modules.wfsSearch.searchButton')"
                            :icon="'bi-search'"
                            :disabled="requiredFields"
                        />
                    </div>
                    <div
                        v-if="showResetButton"
                        class="col-md-6 d-flex justify-content-center"
                    >
                        <FlatButton
                            id="module-wfsSearch-button-resetUI"
                            :interaction="resetUI"
                            :text="$t('common:modules.wfsSearch.resetButton')"
                            :icon="'bi-x'"
                            :secondary="true"
                        />
                    </div>
                </div>
            </form>
        </div>
        <div
            v-if="showResultList && results.length > 0"
            class="mt-5"
        >
            <span>
                <h5>{{ $t("common:modules.wfsSearch.showResultHeading") }}</h5>
            </span>
            <div
                v-if="multiSelect && selectedRows.length > 0"
                class="mb-3"
            >
                <FlatButton
                    id="zoom-to-all-btn"
                    :aria-label="$t('common:modules.wfsSearch.zoomToAllSelected')"
                    :interaction="zoomToSelectedFeatures"
                    :text="$t('common:modules.wfsSearch.zoomToAllSelected')"
                    :icon="'bi-zoom-in'"
                />
                <div class="mt-2">
                    <strong>{{ $t('common:modules.wfsSearch.selectedCount', {count: selectedRows.length}) }}:</strong>
                    <ul class="mb-0 mt-1">
                        <li
                            v-for="(name, index) in selectedItemNames"
                            :key="index"
                        >
                            {{ name }}
                        </li>
                    </ul>
                </div>
            </div>
            <TableComponent
                :id="'resultTable'"
                :data="tableData"
                :sortable="true"
                select-mode="row"
                :run-select-row-on-mount="false"
                table-class="tableHeight"
                :full-view-enabled="fullViewEnabled"
                @rowSelected="handleRowSelected"
            >
                <template
                    v-if="zoomButtonInColumn"
                    #[zoomToSlotName]="{ row }"
                >
                    <div
                        v-if="multiSelect"
                        class="form-check d-flex justify-content-center"
                    >
                        <input
                            :id="'checkbox-' + getRowId(row)"
                            class="form-check-input"
                            type="checkbox"
                            :checked="isRowSelected(row)"
                            :aria-label="isRowSelected(row) ? $t('common:modules.wfsSearch.deselectRow') : $t('common:modules.wfsSearch.selectRow')"
                            @click.stop="handleRowSelected(row)"
                        >
                    </div>
                    <FlatButton
                        v-else
                        id="zoom-to-btn"
                        :aria-label="$t('common:modules.searchBar.actions.zoomToResult')"
                        :interaction="() => {
                            const geometry = returnGeometryFromRow(row);
                            if (geometry) markerAndZoom(geometry);
                        }"
                        :text="$t('common:modules.searchBar.actions.zoomToResult')"
                    />
                </template>
            </TableComponent>
        </div>
        <div v-else-if="noResultsFound">
            {{ $t("common:modules.wfsSearch.noResults") }}
        </div>
    </div>
</template>

<style lang="scss" scoped>

    .btn {
        margin-top: 10px;
    }
    .form-group > span {
        display: inline-block;
    }
    .title {
            font-size: $font-size-base;
    }
</style>
