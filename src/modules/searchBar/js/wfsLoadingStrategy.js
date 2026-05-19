import axios from "axios";
import crs from "@masterportal/masterportalapi/src/crs.js";

// Check feature count via resultType=hits to decide loading strategy.
// If the service returns more than WFS_LARGE_LAYER_THRESHOLD features,
// switch to bbox loading to avoid performance issues.
// WFS spec (2.0) requires TYPENAMES or RESOURCEID — never omit it.
const WFS_LARGE_LAYER_THRESHOLD = 1000;

/**
 * Requests the WFS feature count using resultType=hits.
 * @param {String} featureName Technical WFS feature type name.
 * @param {String} baseUrl WFS service base URL.
 * @param {String} wfsVersion WFS service version.
 * @returns {Promise<Number|null>} Feature count or null on error.
 */
async function getWfsHits (featureName, baseUrl, wfsVersion) {
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
 * Shows info alert for large layers and performs one optional zoom.
 * @param {Number} featureCount Matched feature count.
 * @param {Boolean} alreadyZoomed Whether zoom was already performed.
 * @param {Document} responseXml The XML document of the CSW record response for extracting bounds if needed.
 * @param {String} gmdNs The GMD namespace URI for XML parsing.
 * @param {String} gcoNs The GCO namespace URI for XML parsing.
 * @param {Object} mapCollection The map collection for performing zoom if needed.
 * @param {Function} dispatch Vuex dispatch function for triggering alerts and map actions.
 * @returns {Boolean} Updated zoom flag.
 */
function alertLargeLayer ({featureCount, alreadyZoomed, responseXml, gmdNs, gcoNs, mapCollection, dispatch}) {
    dispatch("Alerting/addSingleAlert", {
        category: "info",
        content: i18next.t("common:modules.searchBar.csw.largeWfsLayer", {count: featureCount})
    }, {root: true});

    const {west: recordWest, east: recordEast, south: recordSouth, north: recordNorth} = extractRecordBounds(responseXml, gmdNs, gcoNs);

    if (!alreadyZoomed && recordWest !== null && !isNaN(recordWest)) {
        const mapProjection = mapCollection.getMap("2D")?.getView()?.getProjection()?.getCode(),
            centerLon = (recordWest + recordEast) / 2,
            centerLat = (recordSouth + recordNorth) / 2;
        let center = [centerLon, centerLat];

        if (mapProjection && mapProjection !== "EPSG:4326") {
            center = crs.transformToMapProjection(mapCollection.getMap("2D"), "EPSG:4326", center);
        }
        dispatch("Maps/zoomToCoordinates", {center, zoom: 7}, {root: true});
        return true;
    }
    return alreadyZoomed;
}

/**
 * Determines and applies loading strategies for discovered WFS layers based on feature count.
 * @param {Object[]} entries Array of discovered layer entries with sourceProps containing featureType.
 * @param {Document} responseXml The XML document of the CSW record response for extracting bounds if needed.
 * @param {String} gmdNs The GMD namespace URI for XML parsing.
 * @param {String} gcoNs The GCO namespace URI for XML parsing.
 * @param {Object} mapCollection The map collection for performing zoom if needed.
 * @param {Function} dispatch Vuex dispatch function for triggering alerts and map actions.
 * @param {String} baseUrl WFS service base URL.
 * @param {String} wfsVersion WFS service version.
 * @returns {Promise<void>} Resolves when all strategies have been applied.
*/
async function applyDiscoveredWfsLoadingStrategies (entries, responseXml, gmdNs, gcoNs, mapCollection, dispatch, baseUrl, wfsVersion) {
    let zoomDone = false;

    for (const entry of entries) {
        const featureTypeName = entry.sourceProps?.featureType;

        if (!featureTypeName) {
            continue;
        }

        const featureCount = await getWfsHits(featureTypeName, baseUrl, wfsVersion),
            loadingStrategy = featureCount !== null && featureCount > WFS_LARGE_LAYER_THRESHOLD
                ? "bbox"
                : "all";

        entry.sourceProps = {...entry.sourceProps, loadingStrategy};

        if (loadingStrategy === "bbox") {
            zoomDone = alertLargeLayer({featureCount, alreadyZoomed: zoomDone, responseXml, gmdNs, gcoNs, mapCollection, dispatch});
        }
    }
}

export {
    applyDiscoveredWfsLoadingStrategies,
    alertLargeLayer,
    getWfsHits,
    WFS_LARGE_LAYER_THRESHOLD
};
