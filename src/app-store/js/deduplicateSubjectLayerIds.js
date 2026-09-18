/**
 * Removes later occurrences of layer ids from a subject layer tree.
 * @param {Object} subjectLayer Subject layer tree from config.json.
 * @returns {{subjectLayer: Object, duplicateIds: String[]}} Normalized tree and duplicate ids.
 */
export default function deduplicateSubjectLayerIds (subjectLayer) {
    const seenLayerIds = new Set(),
        duplicateIds = new Set(),
        normalizedSubjectLayer = normalizeNode(subjectLayer, seenLayerIds, duplicateIds, false);

    return {
        subjectLayer: normalizedSubjectLayer || subjectLayer,
        duplicateIds: [...duplicateIds]
    };
}

/**
 * Normalizes one node and removes duplicate layer entries below it.
 * @param {Object} node Current tree node.
 * @param {Set<String>} seenLayerIds Layer ids already retained.
 * @param {Set<String>} duplicateIds Layer ids found more than once.
 * @param {Boolean} isNestedNode Whether the node is nested below subjectlayer.
 * @returns {Object|null} Normalized node or null when a folder became empty.
 */
function normalizeNode (node, seenLayerIds, duplicateIds, isNestedNode) {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
        return node;
    }

    const normalizedNode = {...node};

    if (Array.isArray(node.elements)) {
        const normalizedElements = node.elements
            .map(element => normalizeNode(element, seenLayerIds, duplicateIds, true))
            .filter(Boolean);

        if (node.type === "folder" && node.elements.length > 0 && normalizedElements.length === 0) {
            return null;
        }
        normalizedNode.elements = normalizedElements;
    }

    if (isNestedNode && node.type !== "folder" && Object.prototype.hasOwnProperty.call(node, "id")) {
        const layerId = node.id;

        if (typeof layerId === "string" || typeof layerId === "number" || Array.isArray(layerId)) {
            const layerIdentity = getLayerIdentity(layerId);

            if (seenLayerIds.has(layerIdentity)) {
                duplicateIds.add(Array.isArray(layerId) ? JSON.stringify(layerId) : String(layerId));
                return null;
            }
            seenLayerIds.add(layerIdentity);
        }
    }

    return normalizedNode;
}

/**
 * Creates an identity key for a layer id without changing grouped-layer order.
 * @param {String|Number|Array} layerId Layer id from the configuration.
 * @returns {String} Identity key for duplicate detection.
 */
function getLayerIdentity (layerId) {
    return Array.isArray(layerId) ? `array:${JSON.stringify(layerId)}` : `${typeof layerId}:${layerId}`;
}
