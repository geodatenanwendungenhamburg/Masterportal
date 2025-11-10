/**
 * Checks if a layer with the given ID exists anywhere in the tree.
 * @param {Array<Object>} tree Array of layer and folder configurations
 * @param {String} layerId The ID of the layer to search for
 * @returns {Boolean} True if a layer with the given ID exists in the tree
 */
function layerExistsInTree (tree, layerId) {
    return tree.some(conf => {
        if (conf.type === "folder" && Array.isArray(conf.elements)) {
            return layerExistsInTree(conf.elements, layerId);
        }
        return conf.id === layerId;
    });
}

/**
 * Checks if the configuration is a queryable layer.
 * @param {Object} layer layer configuration
 * @returns {Boolean} true, if the configuration is a queryable layer
 */
function isQueryableLayer (layer) {
    return layer?.type === "layer";
}

/**
 * Filters the tree and returns only the queryable layers.
 * @param {Array} configs list of layer and folder configs
 * @returns {Array} filtered configs
 */
function filterQueryableTree (configs) {
    return configs
        .map(conf => {
            if (conf.type === "folder" && Array.isArray(conf.elements)) {
                const filteredElements = filterQueryableTree(conf.elements);

                if (filteredElements.length > 0) {
                    return {
                        ...conf,
                        elements: filteredElements
                    };
                }
                return null;
            }
            return isQueryableLayer(conf) ? conf : null;
        })
        .filter(conf => conf !== null);
}

/**
 * Filters the tree by query and returns only the matching elements.
 * @param {Array} configs list of layer and folder configs
 * @param {String} query search query
 * @returns {Array} filtered configs
 */
function filterTreeByQueryAndQueryable (configs, query) {
    const lowerQuery = query.toLowerCase();

    return configs
        .map(conf => {
            if (conf.type === "folder" && Array.isArray(conf.elements)) {
                const filteredElements = filterTreeByQueryAndQueryable(conf.elements, lowerQuery);

                if (filteredElements.length > 0) {
                    return {
                        ...conf,
                        elements: filteredElements
                    };
                }

                if (conf.name?.toLowerCase().includes(lowerQuery)) {
                    return {
                        ...conf,
                        elements: conf.elements
                    };
                }

                return null;
            }

            if (isQueryableLayer(conf)) {
                const matchesQuery = conf.name?.toLowerCase().includes(lowerQuery);

                return matchesQuery ? conf : null;
            }

            return null;
        })
        .filter(conf => conf !== null);
}

/**
 * Recursively filters a tree of layers and folders based on a search query and highlighted layer.
 *
 * Keeps folders only if they contain children that match the filter.
 *
 * @param {Array<Object>} nodes - Array of layer/folder objects to filter.
 * @param {string} query - Search string to filter layers by name (case-insensitive).
 * @returns {Array<Object>} Filtered array of layers and folders.
 */
function filterRecursive (nodes, query = "") {
    if (!Array.isArray(nodes)) {
        return [];
    }

    const lowerQuery = query.toLowerCase(),
        result = [];

    for (const node of nodes) {
        if (node.type === "folder" && node.elements) {
            const filteredChildren = filterRecursive(node.elements, query);

            if (filteredChildren.length) {
                result.push({...node, elements: filteredChildren});
            }
        }
        else if (node.type === "layer") {
            if (!query || node.name.toLowerCase().includes(lowerQuery)) {
                result.push(node);
            }
        }
    }

    return result;
}

/**
 * Filters out external layers and sorts folders before layers.
 *
 * @param {Array<Object>} currentFolder - The array of layer and folder configurations.
 * @returns {Array<Object>} - A new array containing only non-external configs, with folders first.
 */
function getVisibleLayers (currentFolder) {
    if (!Array.isArray(currentFolder)) {
        return [];
    }

    return currentFolder
        .filter(conf => !conf.isExternal)
        .sort((a, b) => {
            if (a.type === "folder" && b.type !== "folder") {
                return -1;
            }
            if (a.type !== "folder" && b.type === "folder") {
                return 1;
            }
            return 0;
        });
}

export {
    layerExistsInTree,
    isQueryableLayer,
    filterQueryableTree,
    filterTreeByQueryAndQueryable,
    filterRecursive,
    getVisibleLayers
};
