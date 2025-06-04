import {expect} from "chai";
import validateGltfUris from "../../utils/validateGltfUris";

/**
 * @param {String} str
 * @returns {TextEncoder} Array buffer
 */
function toArrayBuffer (str) {
    return new TextEncoder().encode(str).buffer;
}

describe("src/modules/bimViewer/utils/validateGltfUris.js", () => {
    before(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    it("checks valid data:application URIs", async () => {
        const gltf = {
                images: [
                    {uri: "data:application/octet-stream;base64,AAAA"}
                ],
                buffers: [
                    {uri: "data:application/octet-stream;base64,BBBB"}
                ]
            },
            ab = toArrayBuffer(JSON.stringify(gltf));

        await validateGltfUris(ab); // should not throw
    });

    it("checks throwing error for empty URI", async () => {
        const gltf = {
                images: [
                    {uri: ""}
                ]
            },
            ab = toArrayBuffer(JSON.stringify(gltf));

        try {
            await validateGltfUris(ab);
            expect.fail("Expected error for empty URI");
        }
        catch (err) {
            expect(err).to.be.an("error");
        }
    });

    it("checks throwing error for non-data:application URI", async () => {
        const gltf = {
                images: [
                    {uri: "texture.png"}
                ]
            },
            ab = toArrayBuffer(JSON.stringify(gltf));

        try {
            await validateGltfUris(ab);
            expect.fail("Expected error for non-data:application URI");
        }
        catch (err) {
            expect(err).to.be.an("error");
        }
    });

    it("checks for missing URI", async () => {
        const gltf = {
                images: [
                    {notUri: "something"}
                ]
            },
            ab = toArrayBuffer(JSON.stringify(gltf));

        await validateGltfUris(ab); // not throwing
    });

    it("checks invalid JSON", async () => {
        const ab = toArrayBuffer("{");

        try {
            await validateGltfUris(ab);
            expect.fail("Expected error for invalid JSON");
        }
        catch (err) {
            expect(err.message).to.equal("modules.bimViewer.tools.errorInvalidGltfJsonFormat");
        }
    });
});
