import axios from "axios";
import crs from "@masterportal/masterportalapi/src/crs.js";

const WFS_LARGE_LAYER_THRESHOLD = 1000;

/**
 * Extracts bounding box from CSW record response XML for zooming.
 * @param {Document} responseXml The XML document of the CSW record response.
 * @param {String} gmdNs The GMD namespace URI.
 * @param {String} gcoNs The GCO namespace URI.
 * @returns {Object} An object with west, east, south, north properties or null values.
 * @throws Will throw an error if the XML structure is unexpected.
 */
function extractRecordBounds (responseXml, gmdNs, gcoNs) {
    const bboxEl = responseXml.getElementsByTagNameNS(gmdNs, "EX_GeographicBoundingBox")[0],
        recordWest = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "westBoundLongitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
        recordSouth = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "southBoundLatitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
        recordEast = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "eastBoundLongitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null,
        recordNorth = bboxEl ? parseFloat(bboxEl.getElementsByTagNameNS(gmdNs, "northBoundLatitude")[0]?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent) : null;

    return {west: recordWest, east: recordEast, south: recordSouth, north: recordNorth};
}

/**
 * Creates a WFS loading strategy service that closes over request and runtime context.
 * @param {Object} param Service context parameters.
 * @param {String} param.baseUrl WFS service base URL.
 * @param {String} param.wfsVersion WFS service version.
 * @param {Document} param.responseXml CSW record XML document.
 * @param {String} param.gmdNs GMD namespace URI.
 * @param {String} param.gcoNs GCO namespace URI.
 * @param {Object} param.mapCollection Map collection for optional zoom.
 * @param {Function} param.dispatch Vuex dispatch function.
 * @returns {Object} Service API for WFS loading strategy operations.
 */
function createWfsLoadingStrategyService ({baseUrl, wfsVersion, responseXml, gmdNs, gcoNs, mapCollection, dispatch}) {
    let zoomToRecordDone = false;

    /**
     * Requests the WFS feature count using resultType=hits.
     * @param {String} featureName Technical WFS feature type name.
     * @returns {Promise<Number|null>} Feature count or null on error.
     */
    async function getWfsHits (featureName) {
        try {
            const hitsResponse = await axios.get(baseUrl, {
                    params: {
                        SERVICE: "WFS",
                        REQUEST: "GetFeature",
                        VERSION: wfsVersion,
                        TYPENAME: featureName,
                        resultType: "hits"
                    }
                }),
                hitsDoc = hitsResponse.request?.responseXML
                    || new DOMParser().parseFromString(hitsResponse.data, "application/xml"),
                fcEl = hitsDoc.documentElement,
                hitsAttr = fcEl?.getAttribute("numberOfFeatures")
                    || fcEl?.getAttribute("numberMatched");

            return hitsAttr ? parseInt(hitsAttr, 10) : null;
        }
        catch (hitsError) {
            console.warn("addLayerFromCswRecord: WFS hits request failed.", hitsError);
            return null;
        }
    }

    /**
     * Shows info alert for large layers and performs one optional zoom.
     * @param {Object} param Alert and zoom parameters.
     * @param {Number} param.featureCount Matched feature count for a single large layer.
     * @param {String} [param.layerName] Layer name for single-layer message.
     * @param {Number} [param.largeLayerCount=1] Number of large layers detected.
     * @returns {Boolean} Whether zoom was performed already.
     */
    function alertLargeLayer ({featureCount, layerName, largeLayerCount = 1}) {
        const operationTimestamp = new Date(Date.now() - 1000).toISOString();

        dispatch("Alerting/addSingleAlert", {
            category: "info",
            content: largeLayerCount > 1
                ? i18next.t("common:modules.searchBar.csw.largeWfsLayers", {layerCount: largeLayerCount})
                : i18next.t("common:modules.searchBar.csw.largeWfsLayer", {count: featureCount, layerName}),
            multipleAlert: true,
            once: true,
            initial: false,
            displayFrom: operationTimestamp
        }, {root: true});

        const {west: recordWest, east: recordEast, south: recordSouth, north: recordNorth} = extractRecordBounds(responseXml, gmdNs, gcoNs);

        if (!zoomToRecordDone && recordWest !== null && !isNaN(recordWest)) {
            const mapProjection = mapCollection.getMap("2D")?.getView()?.getProjection()?.getCode(),
                centerLon = (recordWest + recordEast) / 2,
                centerLat = (recordSouth + recordNorth) / 2;
            let center = [centerLon, centerLat];

            if (mapProjection && mapProjection !== "EPSG:4326") {
                center = crs.transformToMapProjection(mapCollection.getMap("2D"), "EPSG:4326", center);
            }
            dispatch("Maps/zoomToCoordinates", {center, zoom: 7}, {root: true});
            zoomToRecordDone = true;
        }
        return zoomToRecordDone;
    }

    /**
     * Determines and applies loading strategies for discovered WFS layers.
     * @param {Object[]} entries Array of discovered layer entries.
     * @returns {Promise<void>} Resolves when all strategies are applied.
    */
    async function applyDiscoveredWfsLoadingStrategies (entries) {
        let largeLayerCount = 0,
            firstLargeFeatureCount = null,
            firstLargeLayerName = null;

        for (const entry of entries) {
            const featureTypeName = entry.sourceProps?.featureType;

            if (!featureTypeName) {
                continue;
            }

            const featureCount = await getWfsHits(featureTypeName),
                loadingStrategy = featureCount !== null && featureCount > WFS_LARGE_LAYER_THRESHOLD
                    ? "bbox"
                    : "all";

            entry.sourceProps = {...entry.sourceProps, loadingStrategy};

            if (loadingStrategy === "bbox") {
                largeLayerCount++;
                if (firstLargeFeatureCount === null) {
                    firstLargeFeatureCount = featureCount;
                    firstLargeLayerName = entry.name || featureTypeName;
                }
            }
        }

        if (largeLayerCount > 0) {
            alertLargeLayer({featureCount: firstLargeFeatureCount, layerName: firstLargeLayerName, largeLayerCount});
        }
    }

    return {
        getWfsHits,
        alertLargeLayer,
        applyDiscoveredWfsLoadingStrategies,
        WFS_LARGE_LAYER_THRESHOLD
    };
}

export {
    createWfsLoadingStrategyService,
    WFS_LARGE_LAYER_THRESHOLD
};
