/**
 * Recursively collects all WMS layer names from a WMS GetCapabilities Layer element tree.
 * @param {Element} layerEl The Layer XML element to traverse.
 * @returns {String[]} Array of layer names found in the tree.
 */
export default function collectWmsLayerNames (layerEl) {
    let names = [];

    for (const child of Array.from(layerEl.children || [])) {
        if (child.localName === "Name") {
            const n = child.textContent?.trim();

            if (n) {
                names.push(n);
            }
        }
        if (child.localName === "Layer") {
            names = names.concat(collectWmsLayerNames(child));
        }
    }
    return names;
}
