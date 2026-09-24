import {expect} from "chai";
import sinon from "sinon";
import store from "@appstore/index.js";
import Map from "ol/Map.js";
import TileLayer from "ol/layer/Tile.js";
import WMTS from "ol/source/WMTS.js";
import WMTSTileGrid from "ol/tilegrid/WMTS.js";
import {get as getProjection} from "ol/proj.js";
import {buildWmtsImage, cloneSourceForRendering} from "@modules/print/utils/buildWmtsImage.js";

/**
 * Creates a WMTS source for testing.
 * @param {Object} [options={}] overrides for the default source options
 * @returns {WMTS} the configured WMTS source
 */
function createSource (options = {}) {
    return new WMTS({
        urls: ["https://example.com/wmts", "https://example.org/wmts?token=test"],
        layer: "layer1",
        matrixSet: "matrixSet",
        format: "image/png",
        projection: "EPSG:3857",
        tileGrid: new WMTSTileGrid({
            origin: [0, 256],
            resolutions: [1],
            matrixIds: ["level0"]
        }),
        style: "printStyle",
        requestEncoding: "KVP",
        ...options
    });
}

describe("src/modules/print/utils/buildWmtsImage.js", () => {
    describe("cloneSourceForRendering", () => {
        let clock,
            source;

        beforeEach(() => {
            clock = sinon.useFakeTimers({now: 1700000000000, toFake: ["Date"]});
            source = createSource();
        });

        afterEach(() => {
            clock.restore();
        });

        it("should create a separate source with the same WMTS configuration", () => {
            const clonedSource = cloneSourceForRendering(source);

            expect(clonedSource).to.be.an.instanceOf(WMTS);
            expect(clonedSource).not.to.equal(source);
            expect(clonedSource.getLayer()).to.equal("layer1");
            expect(clonedSource.getMatrixSet()).to.equal("matrixSet");
            expect(clonedSource.getFormat()).to.equal("image/png");
            expect(clonedSource.getProjection()).to.equal(source.getProjection());
            expect(clonedSource.getTileGrid()).to.equal(source.getTileGrid());
            expect(clonedSource.getStyle()).to.equal("printStyle");
            expect(clonedSource.getRequestEncoding()).to.equal("KVP");
        });

        it("should use anonymous CORS for cloned tiles without changing the live source", () => {
            const clonedSource = cloneSourceForRendering(source),
                projection = source.getProjection(),
                clonedTile = clonedSource.getTile(0, 0, 0, 1, projection),
                originalTile = source.getTile(0, 0, 0, 1, projection);

            expect(clonedTile.getImage().crossOrigin).to.equal("anonymous");
            expect(originalTile.getImage().crossOrigin).to.equal(null);
        });

        it("should append the same cache buster to all URLs and preserve the original URLs", () => {
            const originalUrls = source.getUrls().slice(),
                clonedSource = cloneSourceForRendering(source);

            expect(clonedSource.getUrls()).to.deep.equal([
                "https://example.com/wmts?mpPrintCacheBuster=1700000000000",
                "https://example.org/wmts?token=test&mpPrintCacheBuster=1700000000000"
            ]);
            expect(source.getUrls()).to.deep.equal(originalUrls);
        });

        it("should preserve REST encoding and substitute the tile coordinates in the URL template", () => {
            source = createSource({
                urls: ["https://example.com/wmts/{TileMatrix}/{TileRow}/{TileCol}.png"],
                requestEncoding: "REST"
            });

            const clonedSource = cloneSourceForRendering(source),
                tileUrl = clonedSource.getTileUrlFunction()([0, 0, 0], 1, source.getProjection());

            expect(tileUrl).to.equal("https://example.com/wmts/level0/0/0.png?mpPrintCacheBuster=1700000000000");
        });
    });

    describe("buildWmtsImage", () => {
        let sandbox,
            renderStub,
            source,
            layer,
            canvas,
            dataUrl,
            extent,
            tempMap,
            tempDiv,
            dispose,
            warn;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            sandbox.stub(store, "state").value({
                Modules: {
                    Print: {layoutMapInfo: [72, 36], dpiForPdf: 150}
                }
            });
            renderStub = sandbox.stub(Map.prototype, "render");
            dispose = sandbox.spy(Map.prototype, "dispose");
            warn = sandbox.stub(console, "warn");
            source = createSource();
            layer = new TileLayer({source});
            layer.set("name", "Test WMTS");
            extent = [0, 0, 100, 50];
            canvas = document.createElement("canvas");
            canvas.width = 150;
            canvas.height = 75;
            dataUrl = canvas.toDataURL("image/png");
            tempMap = undefined;
            tempDiv = undefined;
        });

        afterEach(() => {
            if (tempMap) {
                tempMap.dispose();
            }
            if (tempDiv && tempDiv.parentNode) {
                tempDiv.parentNode.removeChild(tempDiv);
            }
            sandbox.restore();
        });

        /**
         * Starts the rendering of the WMTS image and sets up the temporary map and div elements.
         * @param {module:ol/proj/Projection~default} targetProjection the target projection for the render
         * @returns {Promise<{baseURL: String, extent: ol.Extent}|null>} the result of the buildWmtsImage function
         */
        function startRender (targetProjection) {
            const result = buildWmtsImage(layer, source, extent, targetProjection);

            tempMap = renderStub.firstCall.thisValue;
            tempDiv = tempMap.getTargetElement();
            tempMap.getViewport().appendChild(canvas);

            return result;
        }

        it("should return the exported image and print extent and release temporary resources", async () => {
            const resultPromise = startRender(source.getProjection());

            expect(dispose.called).to.be.false;
            expect(document.body.contains(tempDiv)).to.be.true;

            tempMap.dispatchEvent("rendercomplete");

            expect(await resultPromise).to.deep.equal({baseURL: dataUrl, extent});
            expect(dispose.calledOnce).to.be.true;
            expect(tempMap.getTarget()).to.equal(null);
            expect(document.body.contains(tempDiv)).to.be.false;
            expect(warn.called).to.be.false;
        });

        it("should return null, warn and release temporary resources when canvas export fails", async () => {
            const resultPromise = startRender(source.getProjection());

            sandbox.stub(canvas, "toDataURL").throws(new Error("Canvas export failed"));
            tempMap.dispatchEvent("rendercomplete");

            expect(await resultPromise).to.equal(null);
            expect(warn.calledOnce).to.be.true;
            expect(warn.firstCall.args[0]).to.include("Test WMTS");
            expect(warn.firstCall.args[0]).to.include("Canvas export failed");
            expect(dispose.calledOnce).to.be.true;
            expect(tempMap.getTarget()).to.equal(null);
            expect(document.body.contains(tempDiv)).to.be.false;
        });

        it("should render the transformed extent in the WMTS source projection", async () => {
            const targetProjection = getProjection("EPSG:4326"),
                resultPromise = startRender(targetProjection),
                renderView = tempMap.getView();

            tempMap.dispatchEvent("rendercomplete");

            expect(await resultPromise).to.deep.equal({baseURL: dataUrl, extent});
            expect(renderView.getProjection()).to.equal(source.getProjection());
            expect(renderView.getCenter()[0]).to.be.closeTo(5565974.54, 0.1);
            expect(renderView.getResolution()).to.be.closeTo(74212.99, 0.1);
        });
    });
});
