import {expect} from "chai";
import {vi} from "vitest";

vi.mock("@shared/js/utils/find3DPickedFeature.js", () => ({
    default: vi.fn()
}));

vi.mock("@shared/js/utils/applyTileStyle.js", () => ({
    default: vi.fn()
}));

vi.mock("@shared/js/utils/get3DHighlightColor.js", () => ({
    default: vi.fn((c) => c)
}));

vi.mock("@shared/js/utils/coordToPixel3D.js", () => ({
    default: {
        coordToPixel3D: vi.fn()
    }
}));


import {
    waitForRenderComplete,
    waitForFeatureReady,
    getClickPixel
} from "@shared/js/utils/sceneRenderUtils.js";

import find3DPickedFeature from "@shared/js/utils/find3DPickedFeature.js";
import transformer from "@shared/js/utils/coordToPixel3D.js";

describe("sceneRenderUtils.js", () => {

    beforeEach(() => {
        vi.clearAllMocks();

        global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

        global.mapCollection = {
            getMap: () => ({
                getCesiumScene: () => ({
                    _primitives: {_primitives: []}
                })
            })
        };
    });

    describe("waitForRenderComplete", () => {
        it("resolves when tilesLoaded becomes true", async () => {

            /**
             * Placeholder callback function for testing `waitForRenderComplete`.
             * Will be reassigned to the actual `postRender` callback during the test.
             *
             * @returns {void}
             */
            function callback () {
                null;
            }

            const scene = {
                globe: {tilesLoaded: false},
                postRender: {
                    addEventListener (cb) {
                        callbackImpl = cb;
                        return () => undefined;
                    }
                }
            };

            let callbackImpl = callback;

            const promise = waitForRenderComplete(scene);

            scene.globe.tilesLoaded = true;
            callbackImpl();

            await promise;

            expect(true).to.be.true;
        });
    });

    describe("waitForFeatureReady", () => {

        it("resolves immediately if feature is ready", async () => {
            find3DPickedFeature.mockResolvedValue({
                content: {tile: {boundingSphere: true}}
            });

            await waitForFeatureReady({}, "ready", "BLUE");

            expect(find3DPickedFeature.mock.calls.length).to.equal(1);
        });

        it("retries until feature becomes ready", async () => {
            let calls = 0;

            find3DPickedFeature.mockImplementation(async () => {
                calls++;
                if (calls < 3) {
                    return {content: {tile: null}};
                }
                return {content: {tile: {boundingSphere: true}}};
            });

            await waitForFeatureReady({}, "delayed", "RED");

            expect(calls).to.equal(3);
        });
    });

    describe("getClickPixel", () => {
        it("returns transformer result", () => {
            transformer.coordToPixel3D.mockReturnValue([100, 200]);

            const result = getClickPixel([1, 2, 3]);

            expect(result).to.deep.equal([100, 200]);
        });
    });
});
