import store from "@appstore/index.js";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import WMTS from "ol/source/WMTS.js";
import {getWidth, getCenter} from "ol/extent.js";
import {transformExtent} from "ol/proj.js";

const MAX_IMAGE_EDGE = 4000;

/**
 * Creates a CORS-safe WMTS source for off-screen rendering.
 * @param {ol.source.WMTS} source the live WMTS source
 * @returns {ol.source.WMTS} the cloned source
 */
function cloneSourceForRendering (source) {
    const cacheBuster = `mpPrintCacheBuster=${Date.now()}`,
        urls = source.getUrls().map(url => {
            return url + (url.includes("?") ? "&" : "?") + cacheBuster;
        });

    return new WMTS({
        urls,
        layer: source.getLayer(),
        matrixSet: source.getMatrixSet(),
        format: source.getFormat(),
        projection: source.getProjection(),
        tileGrid: source.getTileGrid(),
        style: source.getStyle(),
        requestEncoding: source.getRequestEncoding(),
        crossOrigin: "anonymous"
    });
}

/**
 * Computes the pixel size to render at, capped at MAX_IMAGE_EDGE to keep the print payload small.
 * @param {Number[]} layoutMapInfo the print layout's [width, height] in points
 * @param {Number} dpiForPdf the target print DPI
 * @returns {Number[]} the capped [width, height] in pixels
 */
function computeTargetSize (layoutMapInfo, dpiForPdf) {
    const factor = dpiForPdf / 72;
    let width = Math.round(layoutMapInfo[0] * factor),
        height = Math.round(layoutMapInfo[1] * factor);

    if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE) {
        const scale = MAX_IMAGE_EDGE / Math.max(width, height);

        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    return [width, height];
}

/**
 * Renders a WMTS layer in a hidden map and returns its canvas as a data URL.
 * @param {ol.layer.Tile} renderLayer the layer to render
 * @param {ol.View} view the render view
 * @param {Number[]} targetSize the [width, height] in pixels
 * @returns {Promise<String>} the rendered canvas data URL
 */
function renderToDataUrl (renderLayer, view, targetSize) {
    return new Promise((resolve, reject) => {
        const tempDiv = document.createElement("div");

        tempDiv.style.position = "absolute";
        tempDiv.style.top = "-9999px";
        tempDiv.style.width = `${targetSize[0]}px`;
        tempDiv.style.height = `${targetSize[1]}px`;
        document.body.appendChild(tempDiv);

        const tempMap = new Map({
            target: tempDiv,
            pixelRatio: 1,
            layers: [renderLayer],
            view,
            controls: [],
            interactions: []
        });

        tempMap.once("rendercomplete", () => {
            try {
                const canvas = tempMap.getViewport().querySelector("canvas");

                resolve(canvas.toDataURL("image/png"));
            }
            catch (error) {
                reject(error);
            }
            finally {
                tempMap.setTarget(null);
                tempMap.dispose();
                document.body.removeChild(tempDiv);
            }
        });

        tempMap.updateSize();
    });
}

/**
 * Builds a raster image of a WMTS layer for use as a MapFish image print layer.
 * @param {ol.layer.Tile} layer the WMTS layer
 * @param {ol.source.WMTS} source the layer's live WMTS source
 * @param {ol.Extent} extent the print extent, already expressed in the target projection
 * @param {module:ol/proj/Projection~default} targetProjection the target (map) projection
 * @returns {Promise<{baseURL: String, extent: ol.Extent}|null>} the rendered image spec, or null on failure
 */
async function buildWmtsImage (layer, source, extent, targetProjection) {
    const sourceProjection = source.getProjection(),
        sourceExtent = transformExtent(extent, targetProjection, sourceProjection),
        targetSize = computeTargetSize(store.state.Modules.Print.layoutMapInfo, store.state.Modules.Print.dpiForPdf),
        resolution = getWidth(sourceExtent) / targetSize[0],
        renderLayer = new TileLayer({
            source: cloneSourceForRendering(source),
            opacity: layer.getOpacity()
        }),
        view = new View({
            projection: sourceProjection,
            center: getCenter(sourceExtent),
            resolution,
            constrainResolution: false
        });

    try {
        const baseURL = await renderToDataUrl(renderLayer, view, targetSize);

        return {baseURL, extent};
    }
    catch (error) {
        console.warn(`Rendering the WMTS layer “${layer.get("name")}” as a raster image for printing failed: ${error.message}. Check if the layer is accessible.`);
        return null;
    }
}

export {buildWmtsImage, cloneSourceForRendering, computeTargetSize};
