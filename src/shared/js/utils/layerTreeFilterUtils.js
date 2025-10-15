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

export {
    layerExistsInTree,
    isQueryableLayer,
    filterQueryableTree,
    filterTreeByQueryAndQueryable
};
