/**
 * Recursively collects all WMS layer names and titles from a WMS GetCapabilities Layer element tree.
 * @param {Element} layerEl The Layer XML element to traverse.
 * @returns {Array<{name: string, title: string}>} Array of objects with layer name and title.
 */
export default function collectWmsLayerTitles (layerEl) {
    let layers = [];
    let name = "";
    let title = "";

    for (const child of Array.from(layerEl.children || [])) {
        if (child.localName === "Name") {
            name = child.textContent?.trim() || "";
        }
        if (child.localName === "Title") {
            title = child.textContent?.trim() || "";
        }
    }
    if (name) {
        layers.push({name, title});
    }
    for (const child of Array.from(layerEl.children || [])) {
        if (child.localName === "Layer") {
            layers = layers.concat(collectWmsLayerTitles(child));
        }
    }
    return layers;
}
