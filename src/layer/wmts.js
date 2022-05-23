import WMTS, {optionsFromCapabilities} from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import TileLayer from "ol/layer/Tile";
import {DEVICE_PIXEL_RATIO} from "ol/has";
import {getWidth} from "ol/extent";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import {get as getProjection} from "ol/proj";

/**
 * Shows error message in console for various WMTS errors.
 * @param {String} errorMessage error message
 * @param {String} layerName layerName
 * @returns {void}
 */
export function showErrorMessage (errorMessage, layerName) {
    console.error("content: Layer " + layerName + ": " + errorMessage);
}

/**
 * Generates resolutions and matrixIds arrays for the WMTS LayerSource.
 * @param {Array} resolutions The resolutions array for the LayerSource.
 * @param {Array} matrixIds The matrixIds array for the LayerSource.
 * @param {Number} length The length of the given arrays.
 * @param {Number} size The tileSize depending on the extent.
 * @returns {void}
 */
export function generateArrays (resolutions, matrixIds, length, size) {
    for (let i = 0; i < length; ++i) {
        resolutions[i] = size / Math.pow(2, i);
        matrixIds[i] = i;
    }
}

/**
 * Gets the WMTS-GetCapabilities document and parse it
 * @param {String} url url for getting capabilities
 * @throws {Error} on unexpected return
 * @returns {promise} promise resolves to parsed WMTS-GetCapabilities object
 */
export function getWMTSCapabilities (url) {
    return fetch(url)
        .then(response => {
            if (response && response.status === 200) {
                return response.text();
            }
            console.error(response);
            throw new Error(`Failing WMTS request to ${url}. Status: ${response?.status}`);
        })
        .then((text) => new WMTSCapabilities().read(text));
}

/**
* Creates the LayerSource from definitions in the service.json for this WMTSLayer.
* @param {Object} attrs attributes of the layer
* @param {WMTS} tileLayer layer object
* @returns {void}
*/
export function createLayerSourceByDefinitions (attrs, tileLayer) {
    const projection = getProjection(attrs.coordinateSystem),
        extent = projection.getExtent(),
        style = attrs.style,
        format = attrs.format,
        wrapX = attrs.wrapX ? attrs.wrapX : false,
        urls = attrs.urls,
        size = extent ? getWidth(extent) / parseInt(attrs.tileSize, 10) : null,
        resLength = parseInt(attrs.resLength, 10),
        resolutions = new Array(resLength),
        matrixIds = new Array(resLength),
        source = new WMTS({
            projection: projection,
            attributions: attrs.olAttribution,
            tileGrid: new WMTSTileGrid({
                origin: attrs.origin,
                resolutions: resolutions,
                matrixIds: matrixIds,
                tileSize: attrs.tileSize
            }),
            tilePixelRatio: DEVICE_PIXEL_RATIO,
            urls: urls,
            matrixSet: attrs.tileMatrixSet,
            matrixSizes: attrs.matrixSizes,
            layer: attrs.layers,
            format: format,
            style: style,
            version: attrs.version,
            transparent: attrs.transparent.toString(),
            wrapX: wrapX,
            requestEncoding: attrs.requestEncoding,
            scales: attrs.scales
        });

    if (size) {
        generateArrays(resolutions, matrixIds, resLength, size);
    }
    else {
        showErrorMessage(attrs.name, `${projection.getCode()} has been given as projection to wmts.js for layer with id ${attrs.id}, but only "EPSG:4326" and "EPSG:3857" are supported. Please use the "capabilitiesUrl" and "optionsFromCapabilities" configuration parameters on this layer.`);
    }

    source.matrixSizes = attrs.matrixSizes;
    source.scales = attrs.scales;
    tileLayer.setSource(source);
    tileLayer.getSource().refresh();
}

/**
* Creates the LayerSource for this WMTSLayer from the WMTS capabilities.
* @param {Object} attrs  attributes of the layer
* @param {WMTS} tileLayer layer object
* @returns {void}
*/
export function createLayerSourceByCapabilities (attrs, tileLayer) {
    const layerIdentifier = attrs.layers,
        url = attrs.capabilitiesUrl,
        matrixSet = attrs.tileMatrixSet,
        capabilitiesOptions = {
            layer: layerIdentifier
        };

    // use the matrixSet (if defined) for optionsFromCapabilities
    // else look for a tilematrixset in epsg:3857
    if (matrixSet && matrixSet.length > 0) {
        capabilitiesOptions.matrixSet = matrixSet;
    }
    else {
        capabilitiesOptions.projection = "EPSG:3857";
    }

    getWMTSCapabilities(url)
        .then((result) => {
            const options = optionsFromCapabilities(result, capabilitiesOptions),
                tileMatrixSet = result.Contents.TileMatrixSet.filter(set => set.Identifier === options.matrixSet)[0],
                matrixSizes = [],
                scales = [];

            // Add the parameters "ScaleDenominator" and "MatrixHeight" / "MatrixWidth" to the source to be able to print WMTS layers
            tileMatrixSet.TileMatrix.forEach(({MatrixHeight, MatrixWidth, ScaleDenominator}) => {
                matrixSizes.push([MatrixWidth, MatrixHeight]);
                scales.push(ScaleDenominator);
            });

            if (options !== null) {
                const source = new WMTS(options);

                source.matrixSizes = matrixSizes;
                source.scales = scales;
                tileLayer.set("options", options);
                tileLayer.setSource(source);
                tileLayer.getSource().refresh();
            }
            else {
                const errorMessage = "Cannot get options from WMTS-Capabilities";

                showErrorMessage(errorMessage, attrs.name || attrs.id);
                throw new Error(errorMessage);
            }
        })
        .catch((error) => {
            if (error === "Fetch error") {
                // error message has already been printed earlier
                return;
            }
            showErrorMessage(error, attrs.name || attrs.id);
        });
}

/**
 * Creates the WMTSLayer.
 * @param {Object} attrs  attributes of the layer
 * @returns {void}
 */
export function createLayer (attrs) {
    const tileLayer = new TileLayer({
        id: attrs.id,
        source: new WMTS({}),
        name: attrs.name,
        minResolution: attrs.minScale,
        maxResolution: attrs.maxScale,
        supported: ["2D", "3D"],
        showSettings: true,
        extent: null,
        typ: attrs.typ,
        legendURL: attrs.legendURL,
        infoFormat: attrs.infoFormat
    });

    if (attrs.optionsFromCapabilities === undefined) {
        createLayerSourceByDefinitions(attrs, tileLayer);
    }
    else {
        createLayerSourceByCapabilities(attrs, tileLayer);
    }

    return tileLayer;
}
