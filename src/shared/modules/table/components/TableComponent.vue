<script>
import {mapGetters, mapActions} from "vuex";
import draggable from "vuedraggable";
import localeCompare from "@shared/js/utils/localeCompare.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import ExportButtonCSV from "@shared/modules/buttons/components/ExportButtonCSV.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject.js";
import Multiselect from "vue-multiselect";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import {isPhoneNumber, getPhoneNumberAsWebLink} from "@shared/js/utils/isPhoneNumber.js";
import {isWebLink} from "@shared/js/utils/urlHelper.js";
import {isEmailAddress} from "@shared/js/utils/isEmailAddress.js";
import ExportButtonGeoJSON from "@shared/modules/buttons/components/ExportButtonGeoJSON.vue";
import GeoJSON from "ol/format/GeoJSON.js";

/**
 * TableComponent: A variable component to show data in a table.
 * @module shared/modules/table/TableComponent
 * @vue-prop {Array} additionalColumnsForDownload - can be used to provide additional columns for downloading the table data.
 * @vue-prop {Object|Boolean} exportData - can be used to define the csv-data to be exported manually.
 * @vue-prop {Object} data - is the data to be presented in the table.
 * @vue-prop {Boolean} dynamicColumnTable - can be set to true to make the columns of the tableComponent dynamically alterable by the user.
 * @vue-prop {String|Boolean} hits - can be set to display the amount of data entries of the table. The information is put above the table. If filled with a string, said string will be the prefix of the display of entries of the table.
 * @vue-prop {Boolean} showHeader - defaults to true and can be set false to not display the header, thus hiding any information about the columns of the table and only showing raw data.
 * @vue-prop {Boolean} sortable - can be set to true to make the singular columns of the tableComponent sortable.
 * @vue-prop {Boolean} fullViewEnabled - if set to true, a toggle-button will be displayed above the table that can enlarge the menu to 95% viewwidth for better readability of big tables.
 * @vue-prop {Boolean} enableSettings - if set to true, a button is displayed above the table that will open a dropdown menu where the columns of the table can be set to be displayed or hidden, stickied or moved.
 * @vue-prop {Boolean} filterable - if set to true, each column-header will be clickable, revealing a dropdown menu in which you can filter the table to only display the rows with a specific value in said column.
 * @vue-prop {String} fontSize - can be set to small or medium, changing the fontSize of the entire table. Default is medium.
 * @vue-prop {String} title - sets the title of the table, to be displayed above the table.
 * @vue-prop {Boolean} downloadable - if set to true, a button will be displayed that enables a download of the tables data.
 * @vue-prop {Array} downloadFormat - can be used to set the download format, default is csv.
 * @vue-prop {String} exportFileName - sets the name of the downloaded file.
 * @vue-prop {String} id - can be used to set the id of the encapsulating div, default is tableId.
 * @vue-prop {String} tableClass - can be set to use custom classes to the div encapsulating the table.
  * @vue-prop {Object} fixedColumnWithOrder - can set the column with a fixed order in table.
 * @vue-prop {Object} fixedRow - can set the row in a fixed order in table.
 * @vue-prop {Object} fixedBottomData - can be used for the data only shown in bottom of table.
 * @vue-prop {String|Boolean} selectMode - can be set with "row" or "column" to allow to click a whole row or column in table.
 * @vue-prop {Object|Boolean} totalProp - can be used to set the total count information of data.
 * @vue-prop {Boolean} sortByNumericValue  - optional, defaults to false. If set to true, data elements are compared by their parsed numeric value when user triggers sorting. By default, they are sorted by their string value.
 * @vue-prop {Boolean} sortAlphanumerical - if set to true, the sorting will be alphanumerical.
 * @vue-prop {String|Number|Boolean} maxDecimalPlaces - if set, this will restrict the entries of the table to a fixed number of decimal digits.
 * @vue-prop {Boolean} removable - if set to true, rows of the tableComponent can be removed from view through a small x left of the row.
 * @vue-prop {String|Number} maxAttributesToShow - limits the amount of attributes shown in the tableComponent, it defaults to 30.
 * @vue-prop {Boolean} runSelectRowOnMount - if set to true, the first row of the table will be selected on mounting of tableComponent. Defaults to true.
 * @vue-prop {Boolean} runSelectOnHover - if set to true, tableComponent emits rowOnHover event on hover over row, only if selectMode is "row".
 */
export default {
    name: "TableComponent",
    components: {
        Draggable: draggable,
        FlatButton,
        ExportButtonCSV,
        ExportButtonGeoJSON,
        IconButton,
        Multiselect
    },
    props: {
        additionalColumnsForDownload: {
            type: Array,
            required: false,
            default () {
                return [];
            }
        },
        exportData: {
            type: [Object, Boolean],
            required: false,
            default: false
        },
        data: {
            type: Object,
            required: true
        },
        dynamicColumnTable: {
            type: Boolean,
            required: false,
            default: false
        },
        hits: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        showHeader: {
            type: Boolean,
            required: false,
            default: true
        },
        sortable: {
            type: Boolean,
            required: false,
            default: false
        },
        fullViewEnabled: {
            type: Boolean,
            required: false,
            default: false
        },
        enableSettings: {
            type: Boolean,
            required: false,
            default: false
        },
        filterable: {
            type: Boolean,
            required: false,
            default: false
        },
        fontSize: {
            type: String,
            required: false,
            default: "medium"
        },
        title: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        downloadable: {
            type: Boolean,
            required: false,
            default: false
        },
        downloadFormat: {
            type: Array,
            required: false,
            default: () => ["csv"]
        },
        exportFileName: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        id: {
            type: String,
            required: false,
            default: "tableId"
        },
        tableClass: {
            type: String,
            required: false,
            default: ""
        },
        fixedColumnWithOrder: {
            type: Object,
            required: false,
            default: undefined
        },
        fixedRow: {
            type: Object,
            required: false,
            default: undefined
        },
        fixedBottomData: {
            type: Object,
            required: false,
            default: undefined
        },
        selectMode: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        totalProp: {
            type: [Object, Boolean],
            required: false,
            default: false
        },
        sortByNumericValue: {
            type: Boolean,
            required: false,
            default: false
        },
        sortAlphanumerical: {
            type: Boolean,
            required: false,
            default: false
        },
        maxDecimalPlaces: {
            type: [Number, Boolean],
            required: false,
            default: false
        },
        removable: {
            type: [Number, Boolean],
            required: false,
            default: false
        },
        maxAttributesToShow: {
            type: Number,
            default: 30
        },
        runSelectRowOnMount: {
            type: Boolean,
            required: false,
            default: true
        },
        runSelectOnHover: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ["columnSelected", "rowSelected", "setSortedRows", "removeItem", "rowOnHover"],
    data () {
        return {
            currentSorting: {
                columnName: "",
                order: "origin"
            },
            visibleHeadersIndices: [],
            draggableHeader: [],
            visibleHeaders: [],
            fixedColumn: undefined,
            dropdownSelected: {},
            filterObject: {},
            originFilteredRows: undefined,
            selectedColumn: "",
            selectedRow: "",
            sortedRows: [],
            showTotal: this.totalProp === true || this.totalProp.enabled,
            showTotalData: false,
            firstColumnName: "",
            showExportDropdown: false,
            exportDropdownRequired: this.downloadFormat.length > 1,
            fullViewActivated: false,
            fixedColumnTitle: undefined,
            fixedRowTitle: undefined,
            fixedTopData: undefined
        };
    },
    computed: {
        ...mapGetters("Menu", ["currentSecondaryMenuWidth", "mainExpanded", "currentMenuWidth"]),
        ...mapGetters("Modules/Language", ["currentLocale"]),

        /**
         * Prepares the table, sorting data for later functionalities like exports and interactions with table data. Also makes sure metadata does not appear in the final table.
         * @returns {Object} The table data.
         */
        editedTable () {
            const table = {
                    headers: [],
                    items: []
                },
                items = Object.keys(this.filterObject).length === 0 ? this.data?.items : this.editedTable?.items;

            table.headers = this.visibleHeaders;
            table.items = this.getSortedItems(items, this.currentSorting.columnName, this.currentSorting.order);

            table.items = table.items.map(item => {
                const newItem = {};

                // id is needed to identify the item in the table for zooming
                if (item.id) {
                    newItem.id = item.id;
                }
                // the geom is needed for exporting the table as geojson
                if (item.geom) {
                    newItem.geom = item.geom;
                }

                this.visibleHeaders.forEach(header => {
                    newItem[header.name] = item[header.name] ?? "";
                });

                return newItem;
            });

            return table;
        },
        originRows: function () {
            return this.data.items;
        },
        isSorted: function () {
            return this.currentSorting.order !== "origin";
        },
        totalRow () {
            return this.getTotalData(this.totalProp, this.editedTable);
        }
    },
    watch: {
        data: {
            handler () {
                this.setupTableData();
            },
            deep: true
        },

        draggableHeader: {
            handler (val) {
                this.visibleHeadersIndices = [];
                val?.forEach(header => {
                    if (!this.visibleHeaders.length || this.isHeaderVisible(header.name)) {
                        this.visibleHeadersIndices.push(header.index);
                    }
                });
            },
            deep: true,
            immediate: true
        },

        visibleHeadersIndices: {
            handler (val) {
                if (typeof this.fixedColumnWithOrder !== "undefined") {
                    this.toggleColumnFix(this.fixedColumnWithOrder?.name, this.fixedColumnWithOrder?.index);
                    this.fixedColumn = this.fixedColumnWithOrder?.name;
                    this.fixedColumnTitle = this.fixedColumnWithOrder?.title;
                }
                this.visibleHeaders = this.draggableHeader?.filter(header => val.includes(header.index));
                if (this.fixedColumn && !this.isHeaderVisible(this.fixedColumn)) {
                    this.toggleColumnFix(this.fixedColumn);
                }
                if (!Array.isArray(this.visibleHeaders)) {
                    return;
                }

                const clonedFilterObject = JSON.parse(JSON.stringify(this.filterObject));

                Object.keys(this.filterObject).forEach(filteredColumn => {
                    if (!this.visibleHeaders.some(header => header.name === filteredColumn)) {
                        delete clonedFilterObject[filteredColumn];
                        this.dropdownSelected = {};
                    }
                });
                this.filterObject = clonedFilterObject;
            },
            deep: true,
            immediate: true
        },
        fixedColumnWithOrder: {
            handler (val) {
                if (typeof val === "undefined") {
                    this.resetAll();
                }
            },
            immediate: true
        },
        fixedRow: {
            handler (val) {
                this.fixedRowTitle = val?.title;
                if (typeof val === "undefined") {
                    this.fixedTopData = undefined;
                    this.resetAll();
                }
            },
            immediate: true
        },
        filterObject: {
            handler () {
                const filteredRows = this.getFilteredRows(this.filterObject, this.originRows);

                this.originFilteredRows = filteredRows;
                if (this.isSorted) {
                    this.editedTable.items = this.getSortedItems(this.originFilteredRows ? this.originFilteredRows : this.editedTable.items, this.currentSorting.columnName, this.currentSorting.order);
                }
                else {
                    this.editedTable.items = filteredRows;
                }
            },
            deep: true
        },
        currentSecondaryMenuWidth: {
            handler () {
                if (this.fullViewActivated && this.currentSecondaryMenuWidth < 0.55) {
                    this.fullView();
                }
            }
        },
        editedTable: {
            handler (val) {
                const items = val?.items;

                val.items = [];
                for (let i = 0; i < items.length; i++) {
                    const newItem = {};

                    this.visibleHeaders.forEach(header => {
                        newItem[header.name] = items[i][header.name] ?? "";
                        // add id and geom for export and zoom
                        if (items[i].id) {
                            newItem.id = items[i].id;
                        }
                        if (items[i].geom) {
                            newItem.geom = items[i].geom;
                        }
                    });

                    if (this.fixedRow?.name !== newItem?.[Object.keys(newItem).reverse()[0]]) {
                        val.items.push(newItem);
                    }
                    else if (typeof this.fixedRow?.name !== "undefined") {
                        this.fixedTopData = newItem;
                    }
                }
            },
            deep: true
        }
    },
    mounted () {
        this.setupTableData();

        if (this.totalProp !== false && Array.isArray(this.data?.headers)) {
            this.firstColumnName = this.data?.headers[0]?.name;
        }

        if (this.selectMode === "column" && Array.isArray(this.data?.headers)) {
            this.selectColumn(this.data.headers[1], 1);
        }
        else if (this.runSelectRowOnMount && this.selectMode === "row" && Array.isArray(this.data?.items)) {
            this.selectRow(this.data.items[0]);
        }

        this.setFixedReferenceColumnPosition();
    },
    unmounted () {
        if (this.fullViewActivated) {
            this.fullView(true);
        }
    },
    methods: {
        isPhoneNumber,
        getPhoneNumberAsWebLink,
        isWebLink,
        isEmailAddress,
        removeVerticalBar (value) {
            return value.replaceAll("|", "<br>");
        },
        thousandsSeparator,

        ...mapActions("Menu", ["toggleMenu", "setCurrentMenuWidth"]),
        /**
         * Returns the decimal or group separator of current locale
         * @param {String} separatorType - The type of the separator 'decimal' or 'group'
         * @returns {String} the decimal or group separator
         */
        getSeparator (separatorType) {
            const numberWithGroupAndDecimalSeparator = 1000.1;

            return Intl.NumberFormat(i18next.language).formatToParts(numberWithGroupAndDecimalSeparator).find(part => part.type === separatorType).value;
        },

        /**
         * Setups the table data. Call it to set fresh and new table.
         * Headers which are set up as not visible are not displayed.
         * @returns {void}
         */
        setupTableData () {
            const visibleHeaders = this.data?.headers?.filter(header => header.visible !== false);

            this.visibleHeaders = visibleHeaders;
            this.draggableHeader = visibleHeaders;
            if (typeof this.fixedColumn !== "undefined") {
                this.fixedColumn = undefined;
            }
        },
        /**
         * Gets the items sorted by column and order.
         * @param {Object[]} items - The items to sort.
         * @param {String} columnToSort - The column name which is sorted.
         * @param {String} order - The order to sort by. Can be origin, desc, asc.
         * @returns {Object[]} the sorted items.
         */
        getSortedItems (items, columnToSort, order) {
            let sorted;

            if (!Array.isArray(items)) {
                return [];
            }
            if (order === "origin") {
                return items;
            }

            if (this.sortAlphanumerical) {
                sorted = this.getAlphanumericalSortedItems(items, columnToSort);
            }

            else {
                sorted = [...items].sort((a, b) => {
                    if (typeof a[columnToSort] === "undefined") {
                        return -1;
                    }
                    if (typeof b[columnToSort] === "undefined") {
                        return 1;
                    }
                    if (this.sortByNumericValue) {
                        if (!isNaN(parseFloat(a[columnToSort])) && isNaN(parseFloat(b[columnToSort]))) {
                            return 1;
                        }
                        if (isNaN(parseFloat(a[columnToSort])) && !isNaN(parseFloat(b[columnToSort]))) {
                            return -1;
                        }
                        return parseFloat(a[columnToSort]) - parseFloat(b[columnToSort]);
                    }
                    return localeCompare(a[columnToSort], b[columnToSort], this.currentLocale, {ignorePunctuation: true});
                });
            }
            return order === "asc" ? sorted : sorted.reverse();
        },
        /**
         * Sorts the data alphanumerical.
         * @param {Object} items - The items to sort.
         * @param {Object} columnToSort - The column to sort.
         * @returns {Object} the sorted items.
         */
        getAlphanumericalSortedItems (items, columnToSort) {
            /**
             * Checks if a value is numeric.
             * @param {any} val - The value to check.
             * @returns {boolean} true if the value is numeric, false otherwise.
             */
            function isNumeric (val) {
                return typeof val === "string" && val.trim() !== "" && !isNaN(val);
            }

            const sorted = [...items].sort((a, b) => {
                const va = a[columnToSort],
                    vb = b[columnToSort];

                if (va === null || va === "") {
                    return 1;
                }
                if (vb === null || vb === "") {
                    return -1;
                }

                if (isNumeric(va) && isNumeric(vb)) {
                    return parseFloat(va) - parseFloat(vb);
                }

                if (isNumeric(va)) {
                    return -1;
                }

                if (isNumeric(vb)) {
                    return 1;
                }
                return localeCompare(va, vb, this.currentLocale, {ignorePunctuation: true});
            });

            return sorted;
        },
        /**
         * Gets the rows based on given filter.
         * @param {Object} filter The filter object.
         * @param {Object[]} allRows All rows to filter.
         * @returns {Object[]} the rows who matches the filter object.
         */
        getFilteredRows (filter, allRows) {
            if (!isObject(filter) || !Array.isArray(allRows)) {
                return [];
            }
            return allRows.filter((row) => {
                let filterHit = true,
                    allMatching = true;

                Object.keys(filter).forEach(key => {
                    if (!allMatching) {
                        return;
                    }
                    const filterValue = typeof row[key] === "string" ? filter[key][row[key].toLowerCase()] : false;

                    if (!filterValue) {
                        allMatching = false;
                        filterHit = false;
                    }
                });
                return filterHit;
            });
        },
        /**
         * Gets the unique values for given column name.
         * @param {String} columnName The column name.
         * @param {Object[]} originRows The rows to iterate.
         * @returns {String[]} the unique values.
         */
        getUniqueValuesByColumnName (columnName, originRows) {
            if (typeof columnName !== "string" || !Array.isArray(originRows) || !originRows.length) {
                return [];
            }
            const result = {};

            originRows.forEach(row => {
                if (typeof row[columnName] !== "undefined" && !result[row[columnName]]) {
                    result[row[columnName]] = true;
                }
            });
            return Object.keys(result).sort((a, b) => localeCompare(a, b, this.currentLocale, {ignorePunctuation: true}));
        },
        /**
         * Adds a filter to the filterObject property.
         * @param {String} selectedOption The selected option.
         * @param {String} columnName The name of the column.
         * @returns {void}
         */
        addFilter (selectedOption, columnName) {
            if (typeof selectedOption !== "string" || typeof columnName !== "string") {
                return;
            }

            const value = selectedOption.toLowerCase(),
                filterObject = JSON.parse(JSON.stringify(this.filterObject));

            if (!Object.prototype.hasOwnProperty.call(filterObject, columnName)) {
                filterObject[columnName] = {};
            }
            filterObject[columnName][value] = true;
            this.filterObject = filterObject;
        },
        /**
         * Removes a filter from the filterObject property.
         * @param {String} removedOption The selected option.
         * @param {String} columnName The name of the column.
         * @returns {void}
         */
        removeFilter (removedOption, columnName) {
            if (typeof removedOption !== "string" || typeof columnName !== "string") {
                return;
            }
            const value = removedOption.toLowerCase(),
                filterObject = JSON.parse(JSON.stringify(this.filterObject));

            if (Object.keys(filterObject[columnName]).length === 1) {
                delete filterObject[columnName];
            }
            else {
                delete filterObject[columnName][value];
            }
            this.filterObject = filterObject;
        },
        /**
         * Gets the fixed row title.
         * @param {String} val The fixed column name.
         * @returns {String} The fixed row title.
         */
        getFixedRowTitle (val) {
            if (this.fixedRow?.name === val) {
                return this.fixedRow?.title;
            }

            return undefined;
        },
        /**
         * Gets a specific icon class to the passed order.
         * @param {String} column - The column in which the table is sorted.
         * @returns {String} The icon css class for the given order.
         */
        getIconClassByOrder (column) {
            if (this.currentSorting?.columnName !== column) {
                return "bi-arrow-down-up origin-order";
            }
            if (this.currentSorting.order === "asc") {
                return "bi-arrow-up";
            }
            if (this.currentSorting.order === "desc") {
                return "bi-arrow-down";
            }
            return "bi-arrow-down-up origin-order";
        },
        /**
         * Gets the next sort order.
         * @param {String} order - The order in which the table is sorted.
         * @returns {String} The sort order. Can be origin, desc, asc.
         */
        getNextSortOrder (order) {
            if (order === "origin") {
                return "desc";
            }
            if (order === "desc") {
                return "asc";
            }
            return "origin";
        },
        /**
         * Sets the order and sorts the table by the given column.
         * Sorting by a new column resets the order of the old column.
         * @param {String} columnName - The column to sort by.
         * @returns {void}
         */
        runSorting (columnName) {
            const newSorting = {
                columnName: columnName,
                order: null
            };

            if (newSorting.columnName === this.currentSorting.columnName) {
                newSorting.order = this.getNextSortOrder(this.currentSorting.order);
            }
            else {
                newSorting.order = this.getNextSortOrder("origin");
            }

            this.currentSorting = newSorting;
        },
        /**
         * Returns the edited table data for export. Removes possible id fields from data.
         * @returns {Object} The edited table data.
         */
        exportTable (mode = "csv") {
            if (mode === "csv") {
                const tableToExport = this.editedTable.items.map(obj => {
                    const rest = {...obj};

                    delete rest.id;
                    delete rest.geom;
                    delete rest.geometry;
                    return rest;
                });

                this.additionalColumnsForDownload.forEach(column => {
                    if (typeof column?.key === "string" && typeof column?.value === "string") {
                        tableToExport.forEach(item => {
                            item[column.key] = column.value;
                        });
                    }
                });
                return tableToExport;
            }
            else if (mode === "geojson") {
                const geoJsonToExport = {
                    type: "FeatureCollection",
                    features: this.editedTable.items.map(obj => {
                        const geojsonFormat = new GeoJSON({
                                featureProjection: this.$store.getters["Maps/projection"],
                                dataProjection: "EPSG:4326"
                            }),
                            geojsonGeom = obj.geom ? geojsonFormat.writeGeometryObject(obj.geom) : undefined,
                            feature = {type: "Feature", id: obj.id, geometry: geojsonGeom, properties: {...obj}};

                        delete feature.properties.id;
                        delete feature.properties.geom;

                        return feature;
                    })
                };

                return JSON.stringify(geoJsonToExport);
            }
            return "";
        },

        /**
         * Check if the header is visible in the table, if the header is hidden, it could not be draggable.
         * @param {String} name - The column name.
         * @returns {Boolean} true if it is visible
         */
        isHeaderVisible (name) {
            if (typeof name !== "string" || !this.visibleHeaders.length) {
                return false;
            }
            return this.visibleHeaders.some(header => header?.name === name);
        },
        /**
         * Resets the table data to original data.
         * @returns {void}
         */
        resetAll () {
            const visibleHeaders = this.data?.headers?.filter(header => header.visible !== false);

            this.visibleHeadersIndices = [];
            visibleHeaders?.forEach(header => {
                this.visibleHeadersIndices.push(header.index);
            });
            this.draggableHeader = visibleHeaders;
            this.currentSorting.order = "origin";

            if (this.fixedColumn) {
                this.toggleColumnFix(this.fixedColumn);
            }
            this.filterObject = {};
            this.dropdownSelected = {};
        },

        /**
         * Toggles the fixed column.
         * @param {String} columnName The name of the column.
         * @param {Number} [index=0] The index of column.
         * @returns {void}
         */
        toggleColumnFix (columnName, index = 0) {
            if (typeof columnName !== "string"
                || typeof this.draggableHeader.find(header => header.name === columnName) === "undefined") {
                return;
            }
            if (this.fixedColumn === columnName) {
                this.fixedColumn = undefined;
                return;
            }
            this.fixedColumn = columnName;
            this.moveColumnToPlace(columnName, index);
        },

        /**
         * Moves the given column by name to the first place in array.
         * @param {String} columnName The name of the column.
         * @param {Number} [newIndex=0] The new index of column.
         * @returns {void}
         */
        moveColumnToPlace (columnName, newIndex = 0) {
            if (typeof columnName !== "string") {
                return;
            }
            const draggableCopy = JSON.parse(JSON.stringify(this.draggableHeader));
            let oldIndex = null;

            draggableCopy.forEach(draggableElement => {
                if (!isObject(draggableElement)) {
                    return;
                }
                if (draggableElement.name === columnName) {
                    oldIndex = draggableElement.index;
                    draggableElement.index = newIndex;
                }
                else if (oldIndex === null) {
                    draggableElement.index += 1;
                }
            });

            this.draggableHeader = draggableCopy.sort((a, b) => a.index - b.index);
        },

        /**
         * Callback function which decides if the move is allowed to do or not.
         * Returns false if the move goes above the fixated column.
         * @param {Object} evt The event object. See for more info: https://github.com/SortableJS/vue.draggable.next?tab=readme-ov-file#move
         * @returns {Boolean} false to prevent and true to do nothing.
         */
        preventMoveAboveFixedColumn (evt) {
            if (this.fixedColumn && evt?.draggedContext?.futureIndex === 0) {
                return false;
            }
            return true;
        },

        /**
         * Gets the row stringified.
         * @param {Array} row The row.
         * @returns {String} the stringified row.
         */
        getStringifiedRow (row) {
            return row.join("");
        },
        processedRow (row) {
            return Array.isArray(row) ? this.getStringifiedRow(row) : row;
        },
        /**
         * Selects the row.
         * @emits rowSelected The row stringified.
         * @param {Array} row The row as array.
         * @returns {void}
         */
        selectRow (row) {
            if (this.selectMode !== "row") {
                return;
            }
            this.selectedRow = this.processedRow(row);

            this.$emit("rowSelected", this.selectedRow);
        },
        selectOnHover (row) {
            if (!this.runSelectOnHover) {
                return;
            }
            this.selectedRow = this.processedRow(row);
            this.$emit("rowOnHover", this.selectedRow);
        },
        /**
         * Selects the column.
         * @emits columnSelected The selected column name.
         * @param {String} columnName The column name.
         * @param {Number} idx The index of the column.
         * @returns {void}
         */
        selectColumn (columnName, idx) {
            if (this.selectMode !== "column" || !columnName || idx === 0) {
                return;
            }
            const nameOfColumn = isObject(columnName) ? columnName.name : columnName;

            this.selectedColumn = nameOfColumn;
            this.$emit("columnSelected", nameOfColumn);
        },

        /**
         * Gets the total data.
         * @param {Object} totalProp The total prop from parent component.
         * @param {Object} data The editedTable data
         * @returns {Array} The total data.
         */
        getTotalData (totalProp, data) {
            if (!totalProp || !totalProp?.enabled) {
                return [];
            }

            if (totalProp?.enabled && !totalProp?.rowTitle) {
                // Todos
                return [];
            }

            const totalData = [];

            if (Array.isArray(data?.headers) && Array.isArray(data?.items)) {

                let indexOfFirstColumn = "";

                data.headers.forEach((header, index) => {
                    let value = 0;

                    if (Object.values(header).includes(this.firstColumnName)) {
                        indexOfFirstColumn = index;
                    }

                    if (!header?.name) {
                        return;
                    }
                    data.items.forEach(item => {
                        if (!item[header.name]) {
                            return;
                        }

                        const parsedData = isNaN(parseFloat(item[header.name])) ? 0 : parseFloat(item[header.name]);

                        if (typeof this.maxDecimalPlaces === "number") {
                            value = Number((parsedData + parseFloat(value)).toFixed(this.maxDecimalPlaces));
                        }
                        else {
                            value += parsedData;
                        }
                    });

                    totalData.push(typeof value === "number" && !isNaN(value) ? value : "-");

                });
                indexOfFirstColumn !== "" ? totalData.splice(indexOfFirstColumn, 1, this.$t("common:shared.modules.table.total")) : "";
            }

            return totalData;
        },

        /**
         * Toggles the total row.
         * @param {Boolean} val The current flag to show the total row.
         * @returns {void}
         */
        toggleShowTotalData (val) {
            this.showTotalData = !val;
            this.$nextTick(() => {
                if (!val && this.$refs.totalDataRow) {
                    this.$refs.totalDataRow.scrollIntoView({behavior: "smooth"});
                }
            });
        },

        /**
         * Checks if to show hint text.
         * @param {Object} totalProp total prop.
         * @param {Object} showTotalData show total data.
         * @returns {Boolean} the hint text.
         */
        checkTotalHint (totalProp, showTotalData) {
            return typeof totalProp?.hintText === "string" && showTotalData;
        },

        /**
         * Gets the selected class if given columnIdx is selected.
         * @param {Number} columnIdx The column id.
         * @returns {String} the 'selected' class if column is selected, empty string otherwise.
         */
        getClassForSelectedColumn (columnIdx) {
            return isObject(this.visibleHeaders[columnIdx]) && this.selectedColumn === this.visibleHeaders[columnIdx].name ? "selected" : "";
        },
        /**
         * Removes the row with the given index.
         * @param {Number} idx the index of the row
         * @returns {void}
         */
        remove (idx) {
            this.$emit("removeItem", this.originRows[idx].id, this.originRows[idx].idLayer);
        },

        /**
         * Parses given number to match the max decimal places.
         * @param {Number|String} value The value to parse.
         */
        parseDecimalPlaces (value) {
            if (typeof this.maxDecimalPlaces !== "number" || isNaN(value)) {
                return value;
            }
            return Number(parseFloat(value).toFixed(this.maxDecimalPlaces));
        },

        /**
         * Handles export download for selected format
         */
        downloadExport (format) {
            if (format === "csv" && this.$refs.exportCsvButton) {
                const btn = this.$refs.exportCsvButton.$el || this.$refs.exportCsvButton;

                if (btn && typeof btn.click === "function") {
                    btn.click();
                }
            }
            else if (format === "geojson" && this.$refs.exportGeoJsonButton) {
                const btn = this.$refs.exportGeoJsonButton.$el || this.$refs.exportGeoJsonButton;

                if (btn && typeof btn.click === "function") {
                    btn.click();
                }
            }
        },
        /**
         * Expands table to fullscreen view, hides sorting elements, footer and layerPills to make space. Also enlarges the header row of the table on smaller screens.
         * @param {boolean} unmounted True if leaving the tableComponent by navigating back to menu or closing the secondary Menu
         * @returns {void}
         */
        fullView (unmounted = false) {
            const footer = document.getElementById("module-portal-footer"),
                layerPills = document.getElementById("layer-pills"),
                select = document.querySelectorAll("#mp-menu-secondaryMenu .multiselect > .multiselect__select"),
                tags = document.querySelectorAll("#mp-menu-secondaryMenu .multiselect > .multiselect__tags"),
                tableRow = this.$refs.headerRow,
                clientWidth = document.body.clientWidth;

            if (!this.fullViewEnabled) {
                return;
            }

            if (this.fullViewActivated) {
                if (!this.mainExpanded) {
                    this.toggleMenu("mainMenu");
                }
                this.setCurrentMenuWidth({type: "secondaryMenu", attributes: {width: 25}});
                if (layerPills) {
                    layerPills.style.display = "";
                }
                if (footer) {
                    footer.style.display = "";
                }
                if (!unmounted) {
                    if (clientWidth <= 1280) {
                        tableRow.classList.remove("fullscreen-tr");
                    }
                    for (let i = 0; i < tableRow.cells.length; i++) {
                        tableRow.cells[i].classList.add("fixedWidth");
                        if (tags[i]) {
                            tags[i].classList.remove("fullscreen_view");
                        }
                        if (select[i]) {
                            select[i].style.display = "";
                        }
                    }
                }
                this.fullViewActivated = false;
            }
            else {
                if (this.mainExpanded) {
                    this.toggleMenu("mainMenu");
                }
                if (layerPills) {
                    layerPills.style.display = "none";
                }
                if (footer) {
                    footer.style.display = "none";
                }
                if (clientWidth <= 1280) {
                    tableRow.classList.add("fullscreen-tr");
                }
                this.setCurrentMenuWidth({type: "secondaryMenu", attributes: {width: 95}});
                for (let i = 0; i < tableRow.cells.length; i++) {
                    tableRow.cells[i].classList.remove("fixedWidth");
                    if (tags[i]) {
                        tags[i].classList.add("fullscreen_view");
                    }
                    if (select[i]) {
                        select[i].style.display = "none";
                    }
                }
                this.fullViewActivated = true;
            }
        },
        /**
         * Checks if the given value is numeric.
         * @param {string|number} val - The value to check.
         * @returns {boolean} True if the value is numeric, otherwise false.
         */
        isNumeric (val) {
            return typeof val === "number" || (typeof val === "string" && (/^[\d.,]+$/).test(val));
        },
        /**
         * Sets the fixed reference column with a fixed position on left.
         * @returns {void}
         */
        setFixedReferenceColumnPosition () {
            if (document.querySelector(".fixedColumn.reference")) {
                const fixedFirstColumnWidth = document.querySelector(".dynamic-column-table th").clientWidth;

                document.querySelectorAll("table td.fixedColumn.reference:not(.first)").forEach(ele => {
                    ele.style.left = fixedFirstColumnWidth + "px";
                });
                document.querySelector("table th.fixedColumn.reference:not(.first)").style.left = fixedFirstColumnWidth + "px";
            }
        }
    }
};
</script>

<template>
    <div
        v-if="title"
        class="mb-3 text-center title"
        :class="fontSize === 'small' ? 'small-title' : 'fs-4'"
    >
        {{ title }}
    </div>
    <div
        v-if="hits"
        class="row mb-3 hits"
    >
        <div class="col col-md-auto">
            {{ $t(hits) }}
        </div>
        <div class="font-bold text-secondary col col-md ps-0">
            {{ editedTable.items?.length || 0 }}
        </div>
    </div>
    <div
        :id="id"
        class="btn-toolbar sticky-top bg-white"
    >
        <div
            class="btn-group"
        >
            <div
                v-if="enableSettings"
                class="btn-group"
            >
                <FlatButton
                    v-if="enableSettings"
                    id="table-settings"
                    aria-label="$t('common:shared.modules.table.settings')"
                    :text="$t('common:shared.modules.table.settings')"
                    :title="$t('common:shared.modules.table.settingsTooltip')"
                    :icon="'bi-gear'"
                    :class="'me-3 rounded-pill'"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                />
                <div
                    class="dropdown-menu p-0 border-0 mt-1"
                    @click.stop=""
                >
                    <Draggable
                        v-model="draggableHeader"
                        group="people"
                        class="dragArea no-list ps-0 m-2"
                        tag="ul"
                        item-key="id"
                        handle=".list-group-item-draggable"
                        :move="preventMoveAboveFixedColumn"
                    >
                        <template #item="{ element }">
                            <li
                                :key="element.index"
                                class="list-group-item d-flex justify-content-between align-items-center p-2 rounded"
                                :class="[
                                    'index+' + element.index,
                                    {'list-group-item-draggable': fixedColumn !== element.name && isHeaderVisible(element.name)},
                                    {'pinnedSelectRow': fixedColumn === element.name}]"
                            >
                                <span
                                    :class="fixedColumn !== element.name && isHeaderVisible(element.name) ? '' : 'invisible'"
                                    class="me-2"
                                >
                                    <i class="bi bi-grip-vertical" />
                                </span>
                                <div class="ms-2 me-auto d-flex form-check">
                                    <input
                                        :id="element.name + element.index"
                                        v-model="visibleHeadersIndices"
                                        :value="element.index"
                                        :disabled="typeof fixedColumnWithOrder !== 'undefined'"
                                        class="me-2 mt-1 form-check-input"
                                        type="checkbox"
                                    >
                                    <label
                                        class="text-nowrap form-check-label"
                                        :for="element.name + element.index"
                                    >
                                        <span
                                            v-if="fixedColumn === element.name && typeof fixedColumnTitle !== 'undefined'"
                                        >
                                            {{ fixedColumnTitle + " " + element.name }}
                                        </span>
                                        <span v-else>
                                            {{ element.name }}
                                        </span>
                                    </label>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="me-2">
                                        <IconButton
                                            :class-array="['btn-light', 'pinnedButton', !isHeaderVisible(element.name) ? 'invisible' : '']"
                                            :interaction="() => toggleColumnFix(element.name)"
                                            :icon="fixedColumn !== element.name ? 'bi bi-pin-angle' : 'bi bi-pin-angle-fill'"
                                            :aria="$t('common:shared.modules.table.fixColumnAriaLabel')"
                                            :disabled="typeof fixedColumnWithOrder !== 'undefined'"
                                        />
                                    </span>
                                </div>
                            </li>
                        </template>
                    </Draggable>
                </div>
            </div>
            <div class="btn-group">
                <FlatButton
                    v-if="enableSettings"
                    id="table-reset"
                    aria-label="$t('common:shared.modules.table.reset')"
                    :text="$t('common:shared.modules.table.reset')"
                    :title="$t('common:shared.modules.table.resetToolTip')"
                    :icon="'bi-x-circle'"
                    :class="'me-3 rounded-pill'"
                    :interaction="() => resetAll()"
                />
            </div>
        </div>
        <div class="btn-toolbar bg-white">
            <FlatButton
                v-if="fullViewEnabled"
                id="table-view-full"
                aria-label="$t('common:shared.modules.table.reset')"
                :text="fullViewActivated ? $t('common:shared.modules.table.fullscreenViewActive') : $t('common:shared.modules.table.fullscreenView')"
                :title="fullViewActivated ? $t('common:shared.modules.table.fullscreenViewActiveToolTip') : $t('common:shared.modules.table.fullscreenViewToolTip') "
                :icon="'bi-fullscreen'"
                :class="fullViewActivated ? 'active-Fullview me-3 rounded-pill' : 'me-3 me-3 rounded-pill'"
                :interaction="() => fullView()"
            />
        </div>
        <button
            v-if="showTotal"
            class="btn btn-secondary align-items-center mb-3 total-button"
            :class="[showTotalData? 'active' : '']"
            :title="$t('common:shared.modules.table.totalTitle')"
            @click="toggleShowTotalData(showTotalData)"
            @keydown.enter="toggleShowTotalData(showTotalData)"
        >
            <span class="btn-texts">&Sigma;</span>
        </button>
        <div
            v-if="downloadable"
            class="btn-group"
        >
            <FlatButton
                v-if="exportDropdownRequired"
                id="table-download"
                :text="$t('common:shared.modules.table.download')"
                :icon="'bi-download'"
                :class="'me-3 rounded-pill dropdown-toggle'"
                aria-haspopup="true"
                :aria-expanded="showExportDropdown ? 'true' : 'false'"
                @click="showExportDropdown = !showExportDropdown"
            />
            <div
                v-if="exportDropdownRequired && showExportDropdown"
                class="export-dropdown-menu"
            >
                <button
                    v-if="downloadFormat.includes('csv')"
                    class="dropdown-item"
                    @click="downloadExport('csv'); showExportDropdown = false;"
                >
                    CSV
                </button>
                <button
                    v-if="downloadFormat.includes('geojson')"
                    class="dropdown-item"
                    @click="downloadExport('geojson'); showExportDropdown = false;"
                >
                    GeoJSON
                </button>
            </div>
            <ExportButtonCSV
                v-show="!exportDropdownRequired && downloadFormat.includes('csv')"
                id="table-download-csv"
                ref="exportCsvButton"
                :url="false"
                :data="!exportData ? exportTable('csv') : exportData"
                :filename="exportFileName"
                :use-semicolon="true"
                :title="$t('common:shared.modules.table.download')"
                :class="'me-3 rounded-pill export-button btn btn-secondary'"
            />
            <ExportButtonGeoJSON
                v-show="!exportDropdownRequired && downloadFormat.includes('geojson')"
                id="table-download-geojson"
                ref="exportGeoJsonButton"
                :data="exportTable('geojson')"
                :filename="exportFileName"
                :title="$t('common:shared.modules.table.download')"
                :class="'me-3 rounded-pill export-button btn btn-secondary'"
            />
        </div>
    </div>
    <div
        class="fixed"
        :class="tableClass"
    >
        <table
            class="table table-sm table-hover rounded-pill"
            :class="[dynamicColumnTable && !filterable ? 'dynamic-column-table' : '']"
        >
            <thead>
                <tr
                    v-if="showHeader"
                    ref="headerRow"
                >
                    <th
                        v-if="removable"
                        class="p-0"
                        :style="{ width: '3rem' }"
                    />
                    <th
                        v-for="(column, idx) in editedTable.headers"
                        v-show="idx < maxAttributesToShow"
                        :key="idx"
                        class="filter-select-box-wrapper fixedWidth"
                        :class="['p-0', fixedColumn === column.name ? 'fixedColumn' : '', typeof fixedColumnTitle !== 'undefined' && idx === 0 ? 'fixedColumn first' : '', selectMode === 'column' && idx > 0 ? 'selectable' : '', selectedColumn === column.name ? 'selected' : '', fontSize === 'medium' ? 'medium-font-size' : '', fontSize === 'small' ? 'small-font-size' : '', typeof fixedColumnTitle !== 'undefined' ? 'reference' : '']"
                        @click="selectColumn(column, idx)"
                    >
                        <div
                            class="d-flex justify-content-between me-3"
                        >
                            <span
                                v-if="filterable"
                                class="multiselect-dropdown w-100"
                            >
                                <Multiselect
                                    id="multiselect"
                                    v-model="dropdownSelected[column.name]"
                                    :options="getUniqueValuesByColumnName(column.name, data.items)"
                                    :multiple="true"
                                    :show-labels="false"
                                    open-direction="auto"
                                    :close-on-select="true"
                                    :clear-on-select="false"
                                    :searchable="false"
                                    placeholder=""
                                    :taggable="true"
                                    class="multiselect-dropdown my-1"
                                    @select="(selectedOption) => addFilter(selectedOption, column.name)"
                                    @remove="(removedOption) => removeFilter(removedOption, column.name)"
                                >
                                    <template
                                        #selection
                                    >
                                        <span
                                            class="multiselect__single"
                                        >{{ column.name }}</span>
                                    </template>
                                </Multiselect>
                            </span>
                            <span
                                v-else
                                class="mx-2 my-3 th-style"
                            >
                                <span
                                    v-if="fixedColumn === column.name && typeof fixedColumnTitle !== 'undefined'"
                                    class="subtitle"
                                >
                                    {{ fixedColumnTitle }}
                                </span>
                                {{ column.displayName ? column.displayName : column.name }}
                            </span>
                            <span
                                v-if="sortable"
                                class="sortable-icon mt-1"
                                role="button"
                                tabindex="0"
                                :style="{ display: fullViewActivated ? 'none' : ''}"
                                :class="getIconClassByOrder(column.name)"
                                @click.stop="runSorting(column.name)"
                                @keypress.stop="runSorting(column.name)"
                            />
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <template v-if="typeof fixedTopData !== 'undefined'">
                    <tr
                        class="fixed-row"
                    >
                        <td
                            v-for="(entry, columnIdx) in draggableHeader"
                            :key="'fixed-top-'+columnIdx"
                            class="custom-p-2"
                            :class="[
                                selectMode === 'column' && columnIdx > 0 ? 'selectable' : '',
                                getClassForSelectedColumn(columnIdx), fontSize === 'medium' ? 'medium-font-size' : '',
                                fontSize === 'small' ? 'small-font-size' : '',
                                typeof fixedTopData[entry.name] === 'number' ? 'pull-right' : 'pull-left',
                                fixedColumn === entry.name ? 'fixedColumn' : '',
                            ]"
                        >
                            <p>
                                <span
                                    v-if="typeof getFixedRowTitle(fixedTopData[entry?.name]) === 'string'"
                                    class="subtitle"
                                >
                                    {{ getFixedRowTitle(fixedTopData[entry?.name]) }}
                                </span>
                                {{ fixedTopData[entry?.name] }}
                            </p>
                        </td>
                    </tr>
                </template>
                <tr
                    v-for="(item, idx) in editedTable.items"
                    :key="idx"
                    @click="selectRow(item)"
                    @mouseenter="selectOnHover(item)"
                    @focus="selectOnHover(item)"
                >
                    <td
                        v-if="removable"
                        :class="['p-2', fontSize === 'medium' ? 'medium-font-size' : '', fontSize === 'small' ? 'small-font-size' : '', 'pull-left']"
                        @click.stop
                    >
                        <button
                            class="remove-row"
                            type="button"
                            :title="$t('common:modules.compareFeatures.removeFromList')"
                            @click.stop="remove(idx)"
                            @keydown.enter.stop="remove(idx)"
                        >
                            <i class="bi-x-lg" />
                        </button>
                    </td>
                    <td
                        v-for="(entry, columnIdx) in visibleHeaders"
                        v-show="columnIdx < maxAttributesToShow"
                        :key="columnIdx"
                        :class="[
                            'custom-p-2',
                            fixedColumn === entry.name ? 'fixedColumn' : '',
                            selectMode === 'column' && columnIdx > 0 ? 'selectable' : '',
                            getClassForSelectedColumn(columnIdx),
                            fontSize === 'medium' ? 'medium-font-size' : '',
                            fontSize === 'small' ? 'small-font-size' : '',
                            isNumeric(item[entry.name]) ? 'pull-right' : 'pull-left',
                            typeof fixedColumnTitle !== 'undefined' ? 'reference' : '',
                            typeof fixedColumnTitle !== 'undefined' && columnIdx === 0 ? 'fixedColumn first' : ''
                        ]"
                    >
                        <template v-if="$slots['cell-' + entry.name]">
                            <slot
                                :name="'cell-' + entry.name"
                                :row="item"
                            />
                        </template>

                        <template v-else>
                            <p v-if="isWebLink(item[entry.name])">
                                <a
                                    :href="item[entry.name]"
                                    target="_blank"
                                >{{ item[entry.name] }}</a>
                            </p>
                            <p v-else-if="item[entry.name] && typeof item[entry.name] === 'string' && (item[entry.name].toLowerCase() === 'true' || item[entry.name].toLowerCase() === 'yes')">
                                <span>{{ $t('common:modules.compareFeatures.trueFalse.true') }}</span>
                            </p>
                            <p v-else-if="item[entry.name] && typeof item[entry.name] === 'string' && (item[entry.name].toLowerCase() === 'false' || item[entry.name].toLowerCase() === 'no')">
                                <span>{{ $t('common:modules.compareFeatures.trueFalse.false') }}</span>
                            </p>
                            <p v-else-if="isEmailAddress(item[entry.name])">
                                <a :href="`mailto:${item[entry.name]}`">{{ item[entry.name] }}</a>
                            </p>
                            <p v-else-if="isPhoneNumber(item[entry.name])">
                                <a :href="getPhoneNumberAsWebLink(item[entry.name])">{{ item[entry.name] }}</a>
                            </p>
                            <p
                                v-else-if="typeof item[entry.name] === 'string' && item[entry.name].includes('|')"
                            >
                                <span v-html="removeVerticalBar(item[entry.name])" />
                            </p>
                            <p
                                v-else-if="typeof item[entry.name] === 'string' && item[entry.name].includes('<br>')"
                            >
                                <span v-html="item[entry.name]" />
                            </p>
                            <p v-else-if="isNumeric(item[entry.name])">
                                {{ thousandsSeparator(parseDecimalPlaces(item[entry.name]), getSeparator('group'), getSeparator('decimal'), true) }}
                            </p>
                            <p v-else-if="typeof item[entry.name] === 'string'">
                                {{ item[entry.name] || "" }}
                            </p>
                            <p v-else>
                                {{ parseDecimalPlaces(item[entry.name]) }}
                            </p>
                        </template>
                    </td>
                </tr>
                <template v-if="showTotalData">
                    <tr
                        ref="totalDataRow"
                        class="fixed"
                    >
                        <td
                            v-for="(entry, index) in totalRow"
                            :key="'total-'+index"
                            :fixed="typeof fixedColumn !== 'undefined'"
                            class="custom-p-2 total"
                            :class="[selectMode === 'column' && index > 0 ? 'selectable' : '', getClassForSelectedColumn(index), typeof entry === 'number' ? 'pull-right' : '']"
                        >
                            {{ typeof entry === 'number' ? thousandsSeparator(entry, getSeparator('group'), getSeparator('decimal'), true) : entry }}
                        </td>
                    </tr>
                </template>
                <template v-if="typeof fixedBottomData !== 'undefined' || Array.isArray(fixedBottomData?.items)">
                    <tr
                        v-for="(row, idx) in fixedBottomData.items"
                        :key="'fixed-'+idx"
                        :class="[selectMode === 'row' ? 'selectable' : '', selectedRow === processedRow(row) ? 'selected' : '', 'fixed']"
                    >
                        <td
                            v-for="(entry, columnIdx) in row"
                            :key="'fixed-'+columnIdx"
                            class="p-2"
                            :class="[selectMode === 'column' && columnIdx > 0 ? 'selectable' : '', getClassForSelectedColumn(columnIdx), fontSize === 'medium' ? 'medium-font-size' : '', fontSize === 'small' ? 'small-font-size' : '']"
                        >
                            {{ entry }}
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
        <div
            v-if="checkTotalHint(totalProp, showTotalData)"
            class="hint"
        >
            <div class="row justify-content-center my-3">
                <div
                    class="col col-md-9 d-flex align-items-center justify-content-center mt-2 alert alert-secondary info-text"
                    role="note"
                >
                    <i class="bi bi-info-circle me-4" />
                    {{ totalProp.hintText }}
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>


.dropdown-menu {
    --bs-dropdown-min-width: 25em;
    height: 45vh;
    overflow: auto;
    li {
        cursor: pointer;
        input:hover {
            cursor: pointer;
        }
        .form-check-label {
            cursor: pointer;
        }
        &:hover {
            background: $light_blue;
        }
        &.list-group-item:not(.pinnedSelectRow) {
            label {
                -webkit-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
        }
    }
}
.active-Fullview {
    --bs-btn-bg:  #151C27;
}
.title {
    font-family: $font_family_accent;
}
.small-title {
    font-size: 16px;
}
.btn-toolbar {
    float: left;
}

.small-font-size {
    font-size: 12px;
}

.medium-font-size {
    font-size: 14px;
}
.custom-p-2 {
    padding: 0.5rem;
}
.pull-left {
    text-align: left;
}
.pull-right {
    text-align: right;
    padding-right: 25px;
}

.fullscreen-tr {
    vertical-align: top;
    height: 64px;
}

table {
    table-layout: auto;
    width: 100%;
    --bs-table-hover-bg: #D6E3FF;
    border-collapse: separate;
    border-spacing: 0;
    tr.fixed-row td{
        position: sticky;
        top: 47px;
        background-color: $white;
        border-top: 1px solid $secondary;
        border-bottom: 1px solid $secondary;
        vertical-align: middle;
        p {
            color: $secondary;
            font-family: "MasterPortalFont Bold";
            .subtitle {
                font-family: "MasterPortalFont";
                font-size: $font_size_sm;
                display: block;
            }
        }
    }
    td {
        word-wrap: break-word;
        white-space: normal;
        &.total:not(.selected) {
            background: $light_blue;
            font-family: "MasterPortalFont Bold";
            color: #3C5F94;
        }
    }
    .fixedWidth {
        min-width: 15rem;
    }
    th {
        white-space: nowrap;
        overflow: visible;
        position: sticky;
        top: 0px;
        background: $light_blue;
        font-family: $font_family_accent;
        z-index: 2;
        span.sortable-icon {
            align-content: center;
            cursor: pointer;
        }
        &.selected {
            background-color: $primary;
        }
        &:first-child {
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
        }
        &:last-child {
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
        }
    }
    .th-style {
        display: block;
        min-height: 1rem;
    }
    .fixedColumn, th.fixedColumn {
        position: sticky;
        left: 0;
        background-color: $light_blue;
        z-index: 1;
        &.reference:not(.first) {
            color: $secondary;
            font-family: "MasterPortalFont Bold";
            background-color: $white;
            border-left: 1px solid $secondary;
            border-right: 1px solid $secondary;
            p {
                color: $secondary;
            }
        }
    }
    .fixedColumn {
        &:not(.reference) {
            border-bottom: 1px solid $light_grey_hover;
            border-right: 1px solid $light_grey_hover;
        }
    }
    th.fixedColumn {
        z-index: 3;
        .subtitle {
            font-family: "MasterPortalFont";
            font-size: $font_size_sm;
            display: block;
        }
    }
    td:first-child[fixed=true] {
        position: sticky;
        left: 0;
        background-color: $light_blue;
        z-index: 1;
    }
}

.dynamic-column-table {
    table-layout: inherit;
    th {
        width: fit-content;
        position: sticky;
        span.sortable-icon {
            position: static;
            padding-top: 10px;
        }
    }
}

.fixed {
    max-height: calc(100vh - 225px);
    box-sizing: border-box;
    width: 100%;
    overflow-y: scroll;
}
.tableHeight {
    max-height: 36vh;
}
.pinnedSelectRow {
    background-color: $light_blue;
    & .pinnedButton {
        background-color: $light_blue;
        border: solid $light_blue 1px;
    }
    & .pinnedButton:hover {
        background-color: $white;
        border-color: $white;
    }
}

.selected {
    background-color: $primary;
    border-bottom: 1px solid $light_grey_hover;
}

.total-button {
    -webkit-user-select: none; /* Chrome/Safari */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+ */
    -o-user-select: none;
    user-select: none;
    font-size: 18px;
    cursor: pointer;
    border-radius: 36px;
    width: 36px;
    height: 36px;
}

.hint {
    font-size: 12px;
}
.export-button {
    height: 2.5rem;
    max-width: fit-content;
    padding-right: 1.5rem;
    padding-left: 1rem;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
}
.export-dropdown-menu {
    position: absolute !important;
    left: 0;
    top: 100%;
    min-width: 160px;
    width: max-content;
    max-width: 240px;
    background: $white;
    border: 1px solid $light_grey_hover;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(60, 95, 148, 0.12);
    padding: 0.5em 0;
    z-index: 1000;
    display: block;
    margin-top: 0.25em;
    transition: min-width 0.2s, max-width 0.2s;
    .dropdown-item {
        padding: 0.5em 1.5em;
        font-size: 1rem;
        background: none;
        border: none;
        text-align: left;
        width: 100%;
        cursor: pointer;
        &:hover {
            background: $primary;
        }
    }
}
</style>

<style lang="scss">


.filter-select-box-wrapper {
    .multiselect__single {
        background: $light_blue;
    }
    .multiselect__tags {
        background: $light_blue;
        border: none;
        height: 2.5rem;
        padding: 10px 40px 0 8px;
        &.fullscreen_view {
            padding: 5px 0px 0 5px;
        }
    }
    border: none;
    .multiselect-dropdown {
        cursor: pointer;
    }
    .multiselect__single {
        font-family: inherit;
        font-size: $font-size-sm;
        margin: 0;
        padding: 0;
        vertical-align: baseline;
    }
    .multiselect__option--highlight {
        background: $secondary;
        outline: none;
        color: #fff;
    }
    .multiselect__option {
        display: block;
        padding: 10px;
        min-height: 2rem;
        line-height: 1rem;
        font-size: $font-size-sm;
        text-decoration: none;
        text-transform: none;
        position: relative;
        cursor: pointer;
        white-space: nowrap;
    }
    .multiselect__select {
        transition: transform .2s ease;
    }
}
.remove-row {
        padding: 0;
        border: none;
        background: none;
}
</style>
