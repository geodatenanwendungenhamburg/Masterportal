import crs from "@masterportal/masterportalapi/src/crs.js";

import SearchInterface from "./searchInterface.js";
import getCswRecords from "@shared/js/api/getCswRecords.js";
import store from "@appstore/index.js";
import {uniqueId} from "@shared/js/utils/uniqueId.js";

/**
 * The search interface for CSW (Catalogue Service for the Web) catalogs.
 * Performs a full-text GetRecords request against one or more CSW endpoints.
 * @module modules/searchBar/searchInterfaces/searchInterfaceCSW
 * @name SearchInterfaceCSW
 * @constructs
 * @extends SearchInterface
 * @see {@link https://www.ogc.org/standards/cat}
 * @param {Object[]} definitions CSW search endpoint definitions.
 * @param {String} definitions[].url URL of the CSW endpoint.
 * @param {String} [definitions[].version="2.0.2"] CSW version ("2.0.2" or "3.0").
 * @param {Number} [definitions[].maxRecords=10] Maximum number of records to return per request.
 * @param {String} [definitions[].typeName="gmd:MD_Metadata"] Type name for the CSW query.
 * @param {String[]} [definitions[].serviceTypeFilter=null] Optional INSPIRE ServiceType filter. Restricts results to records with matching ServiceType (e.g. ["view"] for WMS only, ["view","download"] for WMS+WFS).
 * @param {String} [hitTemplate="default"] The template for rendering the hits.
 * @param {Object} [resultEvents] Actions that are executed when an interaction, such as hover or click, is performed with a result list item.
 * @param {String[]} [resultEvents.onClick=["addLayerFromCswRecord", "zoomToResult"]] Actions fired when clicking a result.
 * @param {String[]} [resultEvents.buttons=["showLayerInfo"]] Actions shown as buttons on a result.
 * @param {String} [searchInterfaceId="csw"] The id of the search interface.
 * @returns {void}
 */
export default function SearchInterfaceCSW ({definitions, hitTemplate, resultEvents, searchInterfaceId} = {}) {
    const resultEventsDefault = {
            onClick: ["addLayerFromCswRecord", "zoomToResult"],
            buttons: ["showLayerInfo"]
        },
        resultEventsSupported = ["showLayerInfo", "zoomToResult", "addLayerFromCswRecord"];

    this.checkConfig(resultEvents, resultEventsSupported, searchInterfaceId);
    SearchInterface.call(this,
        "request",
        searchInterfaceId || "csw",
        resultEvents || resultEventsDefault,
        hitTemplate
    );

    this.definitions = definitions || [];
}

SearchInterfaceCSW.prototype = Object.create(SearchInterface.prototype);

/**
 * Search in all configured CSW endpoints.
 * @override
 * @param {String} searchInput The search input.
 * @returns {Object[]} The accumulated search results.
 */
SearchInterfaceCSW.prototype.search = async function (searchInput) {
    this.searchState = "running";

    for (const definition of this.definitions) {
        const xml = this.buildGetRecordsXml(definition, searchInput, 1);

        try {
            const responseXml = await this.requestSearch(definition.url, "POST", xml, "application/xml; charset=UTF-8"),
                parsed = getCswRecords.parseGetRecordsResponse(responseXml),
                normalized = this.normalizeResults(parsed.records, definition);

            this.totalHits = (this.totalHits || 0) + parsed.numberOfRecordsMatched;
            this.pushHitsToSearchResults(normalized);
        }
        catch (error) {
            if (error.name !== "AbortError" && error.code !== "ERR_CANCELED") {
                console.warn(`SearchInterfaceCSW: search failed for ${definition.url}.`, error);
            }
        }
    }

    this.searchState = "finished";
    return this.searchResults;
};

/**
 * Builds a CSW GetRecords XML body for the given definition and search input.
 * @param {Object} definition The CSW endpoint definition.
 * @param {String} searchInput The search string.
 * @param {Number} [startPosition=1] Start position for pagination.
 * @returns {String} The GetRecords XML string.
 */
SearchInterfaceCSW.prototype.buildGetRecordsXml = function (definition, searchInput, startPosition = 1) {
    return getCswRecords.buildGetRecordsXml(searchInput, {
        version: definition.version || "2.0.2",
        maxRecords: definition.maxRecords || 10,
        startPosition: startPosition,
        typeName: definition.typeName || "gmd:MD_Metadata",
        serviceTypeFilter: definition.serviceTypeFilter || null
    });
};

/**
 * Normalizes an array of parsed CSW records into search result objects.
 * @param {Object[]} records Array of parsed record objects from parseGetRecordsResponse.
 * @param {Object} definition The CSW endpoint definition that returned these records.
 * @returns {Object[]} Normalized search result objects.
 */
SearchInterfaceCSW.prototype.normalizeResults = function (records, definition) {
    const normalizedResults = [];

    records.forEach(record => {
        if (record.title) {
            normalizedResults.push(this.normalizeResult(record, definition));
        }
    });

    return normalizedResults;
};

/**
 * Normalizes a single parsed CSW record into a search result object.
 * @param {Object} record The parsed CSW record.
 * @param {Object} definition The CSW endpoint definition.
 * @returns {Object} Normalized search result object.
 */
SearchInterfaceCSW.prototype.normalizeResult = function (record, definition) {
    return {
        events: this.normalizeResultEvents(this.resultEvents, record, definition),
        category: i18next.t("common:modules.searchBar.type.csw"),
        id: uniqueId("CswSearch"),
        icon: "bi-list-ul",
        name: record.title,
        toolTip: record.abstract ? `${record.title} — ${record.abstract}` : record.title
    };
};

/**
 * Creates the possible actions for a CSW search result.
 * @override
 * @param {Object} record The parsed CSW record.
 * @param {Object} definition The CSW endpoint definition.
 * @returns {Object} The possible actions with their parameters.
 */
SearchInterfaceCSW.prototype.createPossibleActions = function (record, definition) {
    const possibleActions = {
        showLayerInfo: {
            layerId: record.fileIdentifier,
            source: {
                id: record.fileIdentifier,
                metaID: record.fileIdentifier,
                name: record.title,
                typ: "WMS",
                datasets: [{
                    md_id: record.fileIdentifier,
                    csw_url: definition?.url || "",
                    md_name: record.title
                }]
            }
        },
        addLayerFromCswRecord: {
            fileIdentifier: record.fileIdentifier,
            recordTitle: record.title,
            cswUrl: definition?.url || ""
        }
    };

    if (record.boundingBox) {
        const {west, south, east, north} = record.boundingBox,
            mapProjection = store.getters["Maps/projection"]?.getCode();

        /**
         * Transforms a WGS84 coordinate pair into the current map projection.
         * @param {Number} lon Longitude in EPSG:4326.
         * @param {Number} lat Latitude in EPSG:4326.
         * @returns {Number[]} Coordinate pair in the map projection.
         */
        function transformCoord (lon, lat) {
            if (mapProjection && mapProjection !== "EPSG:4326") {
                return crs.transformToMapProjection(mapCollection.getMap("2D"), "EPSG:4326", [lon, lat]);
            }
            return [lon, lat];
        }

        const sw = transformCoord(west, south),
            ne = transformCoord(east, north);

        possibleActions.zoomToResult = {
            coordinates: [sw[0], sw[1], ne[0], ne[1]]
        };
    }

    return possibleActions;
};
