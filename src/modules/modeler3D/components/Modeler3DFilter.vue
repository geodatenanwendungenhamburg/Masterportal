<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

import {uniqueId} from "@shared/js/utils/uniqueId";

import layerCollection from "@core/layers/js/layerCollection";
import processLayerConfig from "@core/layers/js/layerProcessor";

/**
 * The component that handles the 3D modeler filtering & styling.
 * @module modules/modeler3D/components/Modeler3DFilter
 * @vue-data {Object} selectedLayer - The selected layer object.
 * @vue-data {String} selectedAttribute - The selected attribute name.
 * @vue-data {Array} attributes - The available attribute names.
 * @vue-data {Array} layers - The available layers.
 * @vue-data {Boolean} showModal - The modal visibility state.
 * @vue-data {Array} attributeValues - The available attribute values.
 * @vue-data {Boolean} pvoStyleEnabled - The PlanzeichenVO style state.
 * @vue-data {Boolean} newFilter - The new filter state.
 * @vue-data {Number} draggedItemIndex - The index of the dragged item.
 * @vue-data {Number} dzIsDropHovering - The drop hover state.
 * @vue-data {Boolean} dzIsHovering - The hover state.
 * @vue-data {Number} dragCounter - The drag counter.
 * @vue-data {String} filterName - The filter name.
 */
export default {
    name: "Modeler3DFilter",
    components: {
        AccordionItem,
        ModalItem,
        FlatButton,
        InputText
    },
    data () {
        return {
            selectedLayer: {},
            selectedAttribute: "",
            attributes: [""],
            layers: [],
            showModal: false,
            attributeValues: [],
            pvoStyleEnabled: false,
            newFilter: true,
            draggedItemIndex: null,
            dzIsDropHovering: null,
            dzIsHovering: false,
            dragCounter: 0,
            filterName: ""
        };
    },
    computed: {
        ...mapGetters(["visibleSubjectDataLayerConfigs", "allLayerConfigs"]),
        ...mapGetters("Modules/Modeler3D", [
            "currentFilterId",
            "filterGroupOrder",
            "filterList",
            "layerList",
            "buildingFunctionURL",
            "buildingSource",
            "allowedAttributes",
            "pvoColors"
        ]),
        attributeValuesSorted () {
            return this.attributeValues.toSorted((a, b) => a.name.localeCompare(b.name));
        },
        groupedFiltersByLayer () {
            return this.filterList.reduce((groups, filter) => {
                const layerName = filter.layer.name;

                if (!groups[layerName]) {
                    groups[layerName] = [];
                }
                groups[layerName].unshift(filter);
                return groups;
            }, {});
        },
        sortedGroupedFilters () {
            const groupedFilters = this.groupedFiltersByLayer,
                orderedGroups = this.filterGroupOrder,
                sortedGroups = {};

            orderedGroups.forEach(group => {
                if (groupedFilters[group]) {
                    sortedGroups[group] = groupedFilters[group];
                }
            });

            return sortedGroups;
        },
        visibleLayers () {
            const visibleLayerIds = this.visibleSubjectDataLayerConfigs.map(layer => layer.id);

            return this.layers.filter(layer => visibleLayerIds.includes(layer.id));
        }
    },
    watch: {
        visibleSubjectDataLayerConfigs (newVal, oldVal) {
            let newVal3dLayer = newVal.filter(layer => layer.typ === "TileSet3D"),
                oldVal3dLayer = oldVal.filter(layer => layer.typ === "TileSet3D");

            if (oldVal3dLayer.length !== newVal3dLayer.length) {
                newVal3dLayer = newVal3dLayer.filter(x => !oldVal3dLayer.includes(x));
                oldVal3dLayer = oldVal3dLayer.filter(x => !newVal3dLayer.includes(x));
                if (newVal3dLayer.length > 0 || oldVal3dLayer.length > 0) {
                    processLayerConfig(this.allLayerConfigs, "3D");
                    this.initialize3dLayers();
                }
            }
        }
    },
    created () {
        this.initialize3dLayers();
    },
    methods: {
        ...mapMutations("Modules/Modeler3D", [
            "setCurrentFilterId",
            "setFilterList",
            "setLayerList"
        ]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        /**
         * Creates layer objects that contains values like id, name of a layer as well as its style.
         * @param {Object} tilesets tileset that contains relevant data of a layer
         */
        createFilterLayers (tilesets) {
            const filterLayers = tilesets.map(tileset => {
                const layer = tileset.layer.values;

                tileset.layer.tileset.then(ts => {
                    layer.style = ts.style;
                });

                return layer || {};
            });

            return filterLayers;
        },

        /**
         * Sets the layer selection for setting filters, as well as the selected layer and the attribute values of the selected layer.
         */
        initialize3dLayers () {
            const tilesets = layerCollection.getLayers().filter(layer => layer.get("typ") === "TileSet3D"),
                activeTileset = tilesets?.filter(layer => layer.get("visibility") === true)[0];

            if (!activeTileset) {
                this.layers = [];
                return;
            }

            if (this.layers.length === 0) {
                this.layers = this.createFilterLayers(tilesets);
            }
            else {
                const existingLayerIds = this.layers.map(layer => layer.id),
                    newLayers = this.createFilterLayers(tilesets).filter(layer => !existingLayerIds.includes(layer.id));

                this.layers = this.layers.concat(newLayers);
            }

            this.selectedLayer = this.layers.find(layer => layer.id === activeTileset.layer.values.id);
            if (!this.selectedLayer) {
                return;
            }
            activeTileset.layer.tileset
                .then(tileset => tileset.readyPromise)
                .then(this.getAllGfiAttributes());

            this.loadAttributeValues();
        },

        /**
         * Adds a new filter to the filter list.
         */
        addFilter () {
            const id = uniqueId("filter-");

            this.attributeValues.forEach(value => {
                value.color = "#ffffff";
            });
            this.filterName = this.selectedAttribute || "[unbenannt]";

            this.filterList.push({
                id: id,
                name: this.filterName,
                layer: this.selectedLayer,
                attribute: this.selectedAttribute,
                values: this.attributeValues,
                pvoStyleEnabled: false
            });

            if (!this.filterGroupOrder.includes(this.selectedLayer.name)) {
                this.filterGroupOrder.push(this.selectedLayer.name);
            }

            this.setCurrentFilterId(id);
            this.newFilter = true;
            this.pvoStyleEnabled = false;

            this.showModal = true;
        },
        /**
         * Gets all possible attributes of the currently selected layer
         */
        async getAllGfiAttributes () {
            this.selectedAttribute = "";
            layerCollection.getLayers().filter(layer => layer.get("typ") === "TileSet3D" && layer.get("id") === this.selectedLayer.id)[0].layer.tileset.then(tileset => {
                const removeListener = tileset.tileVisible.addEventListener(tile => {
                    const content = tile.content,
                        feature = content.getFeature(0),
                        properties = Object.keys(feature.getProperty("attributes"));

                    this.attributes = properties.filter(value => this.allowedAttributes.includes(value));
                    this.selectedAttribute = this.attributes[0];

                    removeListener();
                });
            });
        },
        /**
         * Prepares style editing of an existing filter.
         * @param {Object} filter - The filter object to edit.
         */
        editFilter (filter) {
            this.attributeValues = filter.values;
            this.pvoStyleEnabled = filter.pvoStyleEnabled;
            this.filterName = filter.name;
            this.setCurrentFilterId(filter.id);
            this.newFilter = false;
            this.showModal = true;
        },
        /**
         * Resets the style of all attribute values to white.
         */
        resetStyle () {
            this.pvoStyleEnabled = false;
            this.attributeValues.forEach(value => {
                value.color = "#ffffff";
            });
        },
        /**
         * Changes the styling of the attribute values to the recommended colors based on the PlanzeichenVO.
         * @param {boolean} val - The new PVO style value.
         */
        pvoStyleChanged (val) {
            if (val) {
                this.attributeValues.forEach(value => {
                    if (value.id >= 1000 && value.id < 2000) {
                        value.color = this.pvoColors.housing;
                    }
                    else if (value.id >= 2000 && value.id < 3000) {
                        value.color = this.pvoColors.commercial;
                    }
                    else if (value.id >= 3000 && value.id < 9999) {
                        value.color = this.pvoColors.public;
                    }
                    else {
                        value.color = "#ffffff";
                    }
                });
            }
            else {
                this.attributeValues.forEach(value => {
                    value.color = "#ffffff";
                });
            }
        },
        /**
         * Copies the color values from the attribute values to the current filter.
         */
        copyColorValues () {
            this.filterList.find(filter => filter.id === this.currentFilterId).values = this.attributeValues.map(value => {
                return {
                    id: value.id,
                    name: value.name,
                    color: value.color
                };
            });
        },
        /**
         * Applies the style to the layers based on the filter list.
         * @param {boolean} recalculate - If the map styling should be recalculated.
         */
        applyStyle (recalculate = false) {
            if (this.filterList.length === 0 || recalculate) {
                this.setLayerList([]);
                layerCollection.getLayers().filter(layer => layer.get("typ") === "TileSet3D").forEach(t => {
                    t.layer.tileset.then(tileset => {
                        const tileLayer = this.layers.find(layer => layer.id === t.layer.values.id);

                        if (!tileLayer) {
                            return;
                        }

                        tileset.style = tileLayer.style;

                    });
                });
            }

            this.layerList.forEach(entry => {
                entry.stylingConfig = [];
            });

            if (this.currentFilterId !== null) {
                if (this.filterList.some(filter => filter.name === this.filterName && filter.id !== this.currentFilterId)) {
                    this.filterList.find(filter => filter.id === this.currentFilterId).name = `${this.filterName} (${this.currentFilterId})`;
                }
                else {
                    this.filterList.find(filter => filter.id === this.currentFilterId).name = this.filterName;
                }
                this.copyColorValues();
            }

            this.populateLayerStylingConfig();

            this.layerList.forEach(entry => {
                layerCollection.getLayerById(entry.layer.id).layer.tileset.then(tileset => {
                    tileset.style = new Cesium.Cesium3DTileStyle({
                        color: {
                            conditions: entry.stylingConfig
                        }
                    });
                });
            });

            this.setCurrentFilterId(null);

            this.showModal = false;
        },
        /**
         *  Sets the data object showModal to false to close the modal dialog
         */
        abortStyle () {
            this.showModal = false;
        },
        /**
         * Populates the styling configuration for each layer based on the filters.
         */
        populateLayerStylingConfig () {
            this.filterList.forEach(filter => {
                const stylingConfig = [];

                filter.values.forEach(value => {
                    if (!value?.color || value?.color === "#ffffff") {
                        return;
                    }
                    stylingConfig.push(["${attributes['" + filter.attribute + "']} === '" + value.name + "'", "color('" + value.color + "')"]);
                });


                if (!this.layerList.some(entry => entry.layer.id === filter.layer.id)) {
                    this.layerList.push({layer: filter.layer, stylingConfig: [...stylingConfig, ["true", "color('white')"]]});
                }
                else {
                    const index = this.layerList.findIndex(entry => entry.layer.id === filter.layer.id);

                    this.layerList[index].stylingConfig.unshift(...stylingConfig);
                }
            });
        },
        /**
         * Removes a filter from the filter list and recalculates styling.
         * @param {number} id - The id of the filter to remove.
         */
        removeFilter (id) {
            this.setFilterList(this.filterList.filter(filter => filter.id !== id));
            this.setCurrentFilterId(null);
            this.applyStyle(true);
        },
        /**
         * Loads the attribute values from an external XML file.
         */
        async loadAttributeValues () {
            try {
                const response = await fetch(this.buildingFunctionURL);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                else {
                    const data = await response.text(),
                        parser = new DOMParser(),
                        xmlDoc = parser.parseFromString(data, "text/xml"),
                        elements = xmlDoc.getElementsByTagName("dictionaryEntry"),
                        uniqueNames = new Set();

                    this.attributeValues = Array.from(elements)
                        .filter(element => element.getElementsByTagName("gml:description")[0].textContent === this.buildingSource)
                        .map(element => {
                            const gid = element.getElementsByTagName("gml:name")[0].textContent.split("_"),
                                name = element.getElementsByTagName("gml:name")[1].textContent,
                                id = gid[0] === "31001" ? parseInt(gid[1], 10) : parseInt(gid[1], 10) + (parseInt(gid[0], 10) * 1000);

                            if (!uniqueNames.has(name)) {
                                uniqueNames.add(name);
                                return {
                                    id,
                                    name,
                                    color: "#ffffff"
                                };
                            }

                            return undefined;
                        })
                        .filter(Boolean);
                }
            }
            catch (error) {
                console.error("Fehler beim Abrufen der Daten:", error);
                this.addSingleAlert({
                    title: i18next.t("common:modules.modeler3D.name"),
                    content: i18next.t("common:modules.modeler3D.filter.errorLoadingData"),
                    category: "error"
                });
            }
        },
        /**
         * Finds the group that contains the filter with the given ID.
         * @param {number} id - The ID of the filter to find.
         * @returns {Array} The group that contains the filter, or null if not found.
         */
        findGroupByFilterId (id) {
            for (const group of Object.values(this.groupedFiltersByLayer)) {
                if (group.some(filter => filter.id === id)) {
                    return group;
                }
            }
            return null;
        },
        /**
         * Updates the filter list with the current grouped filters.
         */
        updateFilterList () {
            const flattenedFilters = Object.values(this.groupedFiltersByLayer).flat();

            this.setFilterList(flattenedFilters.reverse());
            this.applyStyle();
        },
        /**
         * Moves a filter up within its group in the filter list.
         * @param {number} id - The ID of the filter to move up.
         */
        moveFilterUp (id) {
            const group = this.findGroupByFilterId(id),
                index = group ? group.findIndex(filter => filter.id === id) : -1;

            if (!group || index === -1) {
                return;
            }

            if (index > 0) {
                const temp = group[index - 1];

                group[index - 1] = group[index];
                group[index] = temp;

                this.updateFilterList();
            }
        },
        /**
         * Moves a filter down within its group in the filter list.
         * @param {number} id - The ID of the filter to move down.
         */
        moveFilterDown (id) {
            const group = this.findGroupByFilterId(id),
                index = group ? group.findIndex(filter => filter.id === id) : -1;

            if (!group || index === -1) {
                return;
            }

            if (index < group.length - 1) {
                const temp = group[index + 1];

                group[index + 1] = group[index];
                group[index] = temp;

                this.updateFilterList();
            }
        },
        /**
         * Handles the drag start event for a filter.
         * - Sets the dragged item index and hover state.
         * @param {Event} event - The drag start event.
         * @param {number} id - The ID of the dragged filter.
         */
        onDragStart (event, id) {
            this.draggedItemIndex = id;
            this.dzIsHovering = true;
        },
        /**
         * Handles the drag end event.
         * - Decrements the drag counter and resets the hover state if necessary.
         */
        onDragEnd () {
            this.dragCounter--;
            if (this.dragCounter === 0) {
                this.dzIsDropHovering = null;
            }
        },
        /**
         * Handles the drag enter event for a filter.
         * - Increments the drag counter and sets the drop hover state.
         * @param {Event} event - The drag enter event.
         * @param {number} id - The ID of the filter being dragged over.
         */
        onDragEnter (event, id) {
            this.dragCounter++;
            this.dzIsDropHovering = id;
        },
        /**
         * Handles the drop event for a filter.
         * - Swaps the dragged filter with the dropped filter if within the same group.
         * - Resets the drag state and applies the new styles.
         * @param {Event} event - The drop event.
         * @param {number} id - The ID of the filter being dropped on.
         */
        onDrop (event, id) {
            const draggedGroup = this.findGroupByFilterId(this.draggedItemIndex),
                targetGroup = this.findGroupByFilterId(id);

            if (draggedGroup === targetGroup) {
                const draggedIndex = draggedGroup.findIndex(filter => filter.id === this.draggedItemIndex),
                    targetIndex = targetGroup.findIndex(filter => filter.id === id),
                    temp = draggedGroup[draggedIndex];

                draggedGroup[draggedIndex] = targetGroup[targetIndex];
                targetGroup[targetIndex] = temp;

                this.updateFilterList();
            }

            this.draggedItemIndex = null;
            this.dzIsDropHovering = null;
            this.dzIsHovering = false;
            this.dragCounter = 0;
        }
    }
};
</script>

<template>
    <div
        id="modeler3d-filter"
    >
        <ModalItem
            :show-modal="showModal"
            @modalHid="showModal = false"
        >
            <template #header>
                <div>
                    <h1 class="mb-0 p-xxl-1 fs-5">
                        {{ $t('modules.modeler3D.filter.captions.styleSettingsTitle') }}
                    </h1>
                </div>
                <hr class="m-0 mt-2">
            </template>
            <div>
                <div class="form-floating mb-3">
                    <InputText
                        id="filterName"
                        v-model="filterName"
                        :placeholder="$t('modules.modeler3D.filter.captions.filterName')"
                        :label="$t('modules.modeler3D.filter.captions.filterName')"
                    />
                </div>
                <div class="form-check">
                    <input
                        id="pvoStyleCheck"
                        v-model="pvoStyleEnabled"
                        class="form-check-input"
                        type="checkbox"
                        @change="pvoStyleChanged($event.target.checked)"
                    >
                    <label
                        class="form-check-label"
                        for="pvoStyleCheck"
                    >
                        {{ $t('modules.modeler3D.filter.captions.pvoCheck') }}
                    </label>
                </div>
                <table
                    id="styleTable"
                    class="table mt-3"
                >
                    <thead>
                        <tr>
                            <th scope="col">
                                {{ $t('modules.modeler3D.filter.captions.value') }}
                            </th>
                            <th scope="col">
                                {{ $t('modules.modeler3D.filter.captions.fillColor') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="value in attributeValuesSorted"
                            :key="value.name"
                        >
                            <td>
                                {{ value.name }}
                            </td>
                            <td>
                                <input
                                    id="colorPicker"
                                    v-model="value.color"
                                    class="colorPicker border-0"
                                    type="color"
                                >
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <template #footer>
                <div
                    id="footer-buttons"
                    class="d-flex justify-content-between p-2 mt-2"
                >
                    <FlatButton
                        id="modeler3d-applyStyle"
                        :aria-label="$t('modules.modeler3D.filter.captions.applyStyle')"
                        :interaction="applyStyle"
                        :text="$t('modules.modeler3D.filter.captions.applyStyle')"
                    />
                    <FlatButton
                        id="modeler3d-resetStyle"
                        :aria-label="$t('modules.modeler3D.filter.captions.resetStyle')"
                        :interaction="resetStyle"
                        :text="$t('modules.modeler3D.filter.captions.resetStyle')"
                    />
                    <FlatButton
                        v-if="!newFilter"
                        id="modeler3d-abortStyle"
                        :aria-label="$t('modules.modeler3D.filter.captions.abortStyle')"
                        :interaction="abortStyle"
                        :text="$t('modules.modeler3D.filter.captions.abortStyle')"
                    />
                </div>
            </template>
        </ModalItem>

        <AccordionItem
            id="info-section"
            class="p-0"
            :title="$t('modules.modeler3D.filter.captions.info')"
            icon="bi bi-info-circle"
        >
            <p
                class="cta"
                v-html="$t('modules.modeler3D.filter.captions.introInfo')"
            />
            <p
                class="cta"
                v-html="$t('modules.modeler3D.filter.captions.introInfo2')"
            />
        </AccordionItem>
        <hr class="m-0">

        <AccordionItem
            id="filter-section"
            class="p-0"
            :title="$t('modules.modeler3D.filter.captions.title')"
            icon="bi bi-brush"
            :is-open="true"
        >
            <div class="container p-0">
                <div class="form-floating mb-3">
                    <select
                        id="layerSelect"
                        v-model="selectedLayer"
                        class="form-select"
                        :aria-label="$t('modules.modeler3D.filter.captions.selectLayer')"
                        @change="getAllGfiAttributes"
                    >
                        <option
                            v-for="layer in visibleLayers"
                            :key="layer.id"
                            :value="layer"
                        >
                            {{ $t(layer.name) }}
                        </option>
                    </select>
                    <label for="layerSelect">
                        {{ $t("modules.modeler3D.filter.captions.selectLayer") }}
                    </label>
                </div>

                <div class="form-floating mb-3">
                    <select
                        id="attributeSelect"
                        v-model="selectedAttribute"
                        class="form-select"
                        :aria-label="$t('modules.modeler3D.filter.captions.selectAttribute')"
                        @change="loadAttributeValues"
                    >
                        <option
                            v-for="attribute in attributes"
                            :key="attribute"
                            :value="attribute"
                        >
                            {{ attribute }}
                        </option>
                    </select>
                    <label for="attributeSelect">
                        {{ $t("modules.modeler3D.filter.captions.selectAttribute") }}
                    </label>
                </div>
                <FlatButton
                    id="modeler3d-addFilter"
                    :aria-label="$t('modules.modeler3D.filter.captions.addFilter')"
                    :interaction="addFilter"
                    :text="$t('modules.modeler3D.filter.captions.addFilter')"
                    :disabled="visibleLayers.length === 0"
                />
            </div>
        </AccordionItem>
        <hr class="m-0">

        <AccordionItem
            id="filter-list-section"
            class="p-0"
            :title="$t('modules.modeler3D.filter.captions.filterList')"
            icon="bi bi-list"
            :is-open="filterList.length > 0"
        >
            <div id="filter-list-section">
                <p
                    v-if="filterList.length === 0"
                    class="cta"
                >
                    {{ $t("modules.modeler3D.filter.captions.noFilter") }}
                </p>
                <div v-else>
                    <div
                        v-for="(filters, layerName) in sortedGroupedFilters"
                        :key="layerName"
                        class="layer-group"
                    >
                        <h5 class="small-heading">
                            {{ layerName }}
                        </h5>
                        <ul class="list-group list-group-flush">
                            <li
                                v-for="(filter, index) in filters"
                                :key="filter.id"
                                class="list-group-item"
                            >
                                <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
                                <a
                                    draggable="true"
                                    role="button"
                                    class="drag-item d-flex justify-content-between align-items-center"
                                    :class="{dzReady: dzIsHovering, dzHovering: dzIsDropHovering === filter.id}"
                                    tabindex="0"
                                    @dragstart="onDragStart($event, filter.id)"
                                    @dragover.prevent
                                    @dragenter.prevent="onDragEnter($event, filter.id)"
                                    @dragleave="onDragEnd"
                                    @drop.prevent="onDrop($event, filter.id)"
                                >
                                    <!--
                                        The previous element does not provide a @focusin or @focus reaction as would
                                        be considered correct by the linting rule set. Since it's a drop-area for file
                                        dropping by mouse, the concept does not apply. Keyboard users may use the
                                        matching input fields.
                                    -->
                                    <div class="move-button-container d-flex flex-column justify-items-between align-items-center">
                                        <button
                                            :aria-label="$t('common:modules.modeler3D.filter.captions.moveFilterUp')"
                                            class="btn-image btn-small d-flex align-items-center justify-items-center mb-auto"
                                            :disabled="index === 0"
                                            @click="moveFilterUp(filter.id)"
                                        >
                                            <i
                                                class="bi bi-caret-up-fill"
                                                role="img"
                                            />
                                        </button>
                                        <button
                                            :aria-label="$t('common:modules.modeler3D.filter.captions.moveFilterDown')"
                                            class="btn-image btn-small d-flex align-items-center justify-items-center mb-auto"
                                            :disabled="index === filters.length - 1"
                                            @click="moveFilterDown(filter.id)"
                                        >
                                            <i
                                                class="bi bi-caret-down-fill"
                                                role="img"
                                            />
                                        </button>
                                    </div>
                                    <span class="id-field">
                                        {{ index + 1 }}
                                    </span>
                                    <span class="name-field">
                                        {{ filter.name }}
                                    </span>
                                    <div class="d-flex">
                                        <button
                                            :aria-label="$t('common:modules.modeler3D.filter.captions.editFilter')"
                                            class="btn-image btn-blue d-flex align-items-center justify-items-center mb-auto"
                                            @click="editFilter(filter)"
                                        >
                                            <i
                                                class="bi bi-pencil"
                                                role="img"
                                            />
                                        </button>
                                        <button
                                            :aria-label="$t('common:modules.modeler3D.filter.captions.removeFilter')"
                                            class="btn-image btn-red d-flex align-items-center justify-items-center mb-auto"
                                            @click="removeFilter(filter.id)"
                                        >
                                            <i
                                                class="bi bi-trash"
                                                role="img"
                                            />
                                        </button>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AccordionItem>
    </div>
</template>

<style lang="scss" scoped>
@import "~mixins";
@import "~variables";

.small-heading {
    font-size: $font_size_big;
    font-weight: bold;
}

.colorPicker {
    width: 2.5em;
    height: 1.5em;
}

.id-field {
    width: 10%;
}

.name-field {
    width: 100%;
}

.move-button-container {
    width: 15%;
}

.drag-item {
    cursor: move;
    background-color: $white;
    border-radius: 12px;
    padding: 0.5rem 0;
    transition: background 0.25s, border-color 0.25s;
    text-decoration: none;

    &.dzHovering {
        background-color:$accent_hover;
        border-color:transparent;
    }

    &.dzReady {
        border: 2px dashed $accent;
    }

    > span {
        color: $black;
    }
}

.list-group-item {
    padding: 0;
}

.btn-image {
    position: sticky;
    text-align: center;
    top: auto;
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
    border-radius: 50%;
    border: solid $white 1px;
    background-color: lighten($secondary, 100%);
    /* position icon in center of button */
    > i {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        // adjust line-height to use same height as ::before Element
        line-height: 0;
    }
}

.btn-image:not(:disabled) {
    &.active {
        background-color: lighten($secondary, 20%);
        color: $light_grey_contrast;
    }

    &:focus {
        @include primary_action_focus;
    }
    &:hover {
        background-color: lighten($secondary, 10%);
        color: $light_grey_contrast;
        cursor: pointer;
    }
}

.btn-small {
    width: 1.5rem;
    height: 1.5rem;
}

.btn-blue {
    &.active {
        background-color: lighten($secondary, 20%);
        color: $light_grey_contrast;
    }

    &:focus {
        @include primary_action_focus;
    }
    &:hover {
        background-color: lighten($secondary, 10%);
        color: $light_grey_contrast;
        cursor: pointer;
    }
}

.btn-red {
    &.active {
        background-color: lighten($light_red, 20%);
        color: $light_grey_contrast;
    }

    &:focus {
        @include primary_action_focus;
    }
    &:hover {
        background-color: lighten($light_red, 10%);
        color: $light_grey_contrast;
        cursor: pointer;
    }
}

</style>
