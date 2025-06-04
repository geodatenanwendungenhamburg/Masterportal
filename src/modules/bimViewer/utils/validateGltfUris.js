/**
 * Helper: Parse glTF JSON and check all "uri" attributes.
 * If a "uri" value does not start with "data:application", is empty, or is not a string, throw an error.
 * @param {ArrayBuffer|Blob} gltfBuffer
 * @returns {Promise<void>}
 */
export default async function validateGltfUris (gltfBuffer) {
    // Convert ArrayBuffer or Blob to string
    let
        jsonString,
        gltfJson;

    if (gltfBuffer instanceof Blob) {
        jsonString = await gltfBuffer.text();
    }
    else if (gltfBuffer instanceof ArrayBuffer) {
        jsonString = new TextDecoder().decode(gltfBuffer);
    }
    else {
        throw new Error(i18next.t("modules.bimViewer.tools.errorInvalidGltfType"));
    }

    try {
        gltfJson = JSON.parse(jsonString);
    }
    catch (e) {
        throw new Error(i18next.t("modules.bimViewer.tools.errorInvalidGltfJsonFormat"));
    }

    /**
     * Recursive function to check all "uri" keys
     */
    function checkUris (obj, path = "") {
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => checkUris(item, `${path}[${index}]`));
        }
        else if (obj && typeof obj === "object") {
            const message = "modules.bimViewer.tools.uploadValidateGltfUrisError";

            for (const key in obj) {
                if (key === "uri") {
                    const value = obj[key];

                    if (
                        typeof value !== "string"
                        || value === ""
                        || !value.startsWith("data:application")
                    ) {
                        throw new Error(i18next.t(message, {path: path, value: value}));
                    }
                }
                else {
                    checkUris(obj[key], path ? `${path}.${key}` : key);
                }
            }
        }
    }

    checkUris(gltfJson);
}
