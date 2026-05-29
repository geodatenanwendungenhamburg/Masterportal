import {uniqueId} from "@shared/js/utils/uniqueId.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";

/**
 * Returns hostname for service URL if available.
 * @param {String} baseUrl Service URL
 * @returns {String} Hostname or original URL
 */
function getHostnameOrUrl (baseUrl) {
    try {
        return new URL(baseUrl).hostname;
    }
    catch (error) {
        return baseUrl;
    }
}

/**
 * Finds an existing external service folder by name or creates a new one.
 * @param {Object} rootGetters Vuex rootGetters
 * @param {Function} dispatch Vuex dispatch
 * @param {String} serviceName Folder name
 * @returns {Promise<String|null>} Folder id or null if creation failed
 */
async function getOrCreateExternalServiceFolderId (rootGetters, dispatch, serviceName) {
    const existingFolder = rootGetters.allFolders
        .find(folder => folder.type === "folder" && folder.isExternal === true && folder.name === serviceName);

    if (existingFolder?.id) {
        return existingFolder.id;
    }

    const folderId = uniqueId("folder-");
    const folderConfig = {
        id: folderId,
        type: "folder",
        isExternal: true,
        name: serviceName,
        elements: []
    };
    const added = await dispatch("addLayerToLayerConfig", {
        layerConfig: folderConfig,
        parentKey: treeSubjectsKey
    }, {root: true});

    return added ? folderId : rootGetters.allFolders
        .find(folder => folder.type === "folder" && folder.isExternal === true && folder.name === serviceName)?.id || null;
}

/**
 * Adds discovered service layers to an external service folder.
 * @param {Object} param Parameters
 * @param {Object} param.rootGetters Vuex root getters
 * @param {Function} param.dispatch Vuex dispatch
 * @param {String} param.serviceType Layer service type, e.g. WMS or WFS
 * @param {String} param.serviceTitle Service title used as folder name
 * @param {Object[]} param.layerEntries Layer entries with name and sourceProps
 * @param {String} param.baseUrl Service base URL
 * @param {String} param.fileIdentifier CSW file identifier
 * @param {String} param.cswUrl CSW endpoint URL
 * @param {String} [param.showDocUrl] Optional metadata viewer base URL
 * @param {Number} param.resourceIndex Resource index
 * @param {Object} [param.additionalLayerProps={}] Extra layer props added to each entry
 * @returns {Promise<Boolean>} True if folder exists and layers were processed
 */
async function addServiceLayersToExternalFolder ({
    rootGetters,
    dispatch,
    serviceType,
    serviceTitle,
    layerEntries,
    baseUrl,
    fileIdentifier,
    cswUrl,
    showDocUrl,
    resourceIndex,
    additionalLayerProps = {}
}) {
    const folderName = serviceTitle || getHostnameOrUrl(baseUrl) || fileIdentifier,
        folderId = await getOrCreateExternalServiceFolderId(rootGetters, dispatch, folderName);

    if (!folderId || !Array.isArray(layerEntries) || layerEntries.length === 0) {
        return false;
    }

    const activateByDefault = layerEntries.length === 1;

    for (const layerEntry of layerEntries) {
        const layerName = layerEntry?.name || "",
            metadataName = layerEntry?.title || layerName || fileIdentifier,
            layerId = `csw-${fileIdentifier}-${resourceIndex}-${layerName}`,
            layerConfig = {
                id: layerId,
                name: layerName || fileIdentifier,
                url: baseUrl,
                typ: serviceType,
                metaID: fileIdentifier,
                cswUrl,
                datasets: [{
                    md_id: fileIdentifier,
                    csw_url: cswUrl,
                    md_name: metadataName,
                    ...showDocUrl && {show_doc_url: showDocUrl}
                }],
                type: "layer",
                isExternal: true,
                parentId: folderId,
                showInLayerTree: activateByDefault,
                visibility: activateByDefault,
                ...additionalLayerProps,
                ...layerEntry?.sourceProps
            };

        if (serviceType === "WMS" && !layerConfig.layers) {
            layerConfig.layers = layerName;
        }
        if (serviceType === "WFS" && !layerConfig.featureType) {
            layerConfig.featureType = layerName;
        }
        if (serviceType === "OAF" && !layerConfig.collection) {
            layerConfig.collection = layerName;
        }

        await dispatch("addLayerToLayerConfig", {
            layerConfig,
            parentKey: folderId
        }, {root: true});
    }

    return true;
}

export {
    addServiceLayersToExternalFolder
};
