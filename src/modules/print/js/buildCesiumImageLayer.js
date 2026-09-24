// Note: eslint jsdoc does not support the import syntax:
// import('olcs/OLCesium.js').default
// so I am using the broken olcs.OLCesium string instead.
// See https://eslint.org/blog/2018/11/jsdoc-end-of-life/
/**
 *
 * @param {Cesium.Scene} scene Cesium scene
 * @param {Object?} options Options; when given, the region [offsetX, offsetY, width, height]
 * is cropped and scaled down to [targetWidth, targetHeight] (defaulting to [width, height]
 * when not given) and encoded as JPEG to keep the print payload small.
 * @returns {Promise<string>} the promise
 */
function takeOl3DScreenshot (scene, options) {
    return new Promise((resolve, reject) => {
        // preserveDrawingBuffers is false so we render on demand and immediately read the buffer
        const remover = scene.postRender.addEventListener(() => {
            remover();
            try {
                let url;

                if (options) {
                    const smallerCanvas = document.createElement("canvas"),
                        targetWidth = options.targetWidth || options.width,
                        targetHeight = options.targetHeight || options.height;

                    smallerCanvas.width = targetWidth;
                    smallerCanvas.height = targetHeight;
                    smallerCanvas.getContext("2d").drawImage(
                        scene.canvas,
                        options.offsetX, options.offsetY, options.width, options.height,
                        0, 0, targetWidth, targetHeight);
                    url = smallerCanvas.toDataURL("image/jpeg", 0.85);
                }
                else {
                    url = scene.canvas.toDataURL();
                }
                resolve(url);
            }
            catch (e) {
                reject(e);
            }
        });

        scene.requestRender();
    });
}
/**
 * Creates a fake extent based on the given view and given pixels
 * @param {ol.View} view ol view
 * @param {Number[]} pixels canvas dimensions
 * @returns {Number[]} extent
 */
function createFakeExtent (view, pixels) {
    const res = view.getResolution(),
        center = view.getCenter();

    return [
        center[0] - pixels[0] / 2 * res, // xmin
        center[1] - pixels[1] / 2 * res, // ymin
        center[0] + pixels[0] / 2 * res, // xmax
        center[1] + pixels[1] / 2 * res // ymax
    ];
}
/**
 * Creates the print image layer for mapfish from the given 3dmap
 * @param {olcs.OLCesium} ol3d The 3d map
 * @param {Object} options Options; see takeOl3DScreenshot for the downscale/crop fields.
 * @returns {Promise<Object>} the promise
 */
async function createMapfishPrintImageLayerFromCesium (ol3d, options) {
    const ol2d = ol3d.getOlMap(),
        pixels = [options.targetWidth || options.width, options.targetHeight || options.height];

    return {
        type: "image",
        name: "Cesium",
        opacity: 1,
        imageFormat: "image/jpeg",
        extent: createFakeExtent(ol2d.getView(), pixels),
        baseURL: await takeOl3DScreenshot(ol3d.getCesiumScene(), options)
    };
}
export default {
    createMapfishPrintImageLayerFromCesium,
    takeOl3DScreenshot,
    createFakeExtent
};
