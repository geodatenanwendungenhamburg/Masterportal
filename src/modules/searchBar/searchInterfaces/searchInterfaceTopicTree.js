import SearchInterface from "./searchInterface.js";
import store from "@appstore/index.js";
import layerTypes from "@core/layers/js/layerTypes.js";

/**
 * The search interface to the topic tree.
 * @module modules/searchBar/searchInterfaces/SearchInterfaceTopicTree
 * @name SearchInterfaceTopicTree
 * @constructs
 * @extends SearchInterface
 * @param {String} [hitTemplate="default"] The template for rendering the hits.
 * @param {Object} [resultEvents] Actions that are executed when an interaction, such as hover or click, is performed with a result list item.
 * @param {String[]} [resultEvents.onClick=["activateLayerInTopicTree"]] Actions that are fired when clicking on a result list item.
 * @param {String} [searchInterfaceId="topicTree"] The id of the service interface.
 * @param {String} [searchType=""] Decides whether the metadata or the name of a layer should be searched. Possible value: "metadata". If empty, name will be searched.
 * @returns {void}
 */
export default function SearchInterfaceTopicTree ({hitTemplate, resultEvents, searchInterfaceId, searchType, toolTip} = {}) {
    const resultEventsDefault = {
            onClick: ["activateLayerInTopicTree"],
            buttons: ["showInTree", "showLayerInfo"]
        },
        resultEventsSupported = ["activateLayerInTopicTree", "showInTree", "showLayerInfo"];

    this.checkConfig(resultEvents, resultEventsSupported, searchInterfaceId);

    SearchInterface.call(this,
        "client",
        searchInterfaceId || "topicTree",
        resultEvents || resultEventsDefault,
        hitTemplate
    );

    this.searchType = searchType || "";
    this.toolTip = toolTip;
}

SearchInterfaceTopicTree.prototype = Object.create(SearchInterface.prototype);

/**
 * Search in topic tree search interface.
 * @override
 * @param {String} searchInput The search input.
 * @returns {void}
 */
SearchInterfaceTopicTree.prototype.search = async function (searchInput) {
    this.searchState = "running";
    const searchInputRegExp = this.createRegExp(searchInput.trim()),
        foundLayers = this.searchInLayers(store.getters.allLayerConfigs, searchInputRegExp),
        foundFolders = this.searchInFolders(store.getters.layerConfig, searchInputRegExp);

    this.pushHitsToSearchResults(foundLayers.concat(foundFolders));

    this.searchState = "finished";
    return this.searchResults;
};

/**
 * Creates a regular Expression to handle special Characters like "(".
 * @param {String} searchInput The search input.
 * @return {String} The search input as regExp String.
 */
SearchInterfaceTopicTree.prototype.createRegExp = function (searchInput) {
    const searchInputRegExp = new RegExp(searchInput.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");

    return searchInputRegExp;
};

/**
 * Executes the search in the layer variable with search string and finds in the layer name and dataset name.
 * Note: 3D layers will not be found in 2D map mode.
 * @param {Object[]} layerConfigs The layerConfigs from topic tree.
 * @param {String} searchInputRegExp The search input as regExp String.
 * @returns {Object[]} The found layers.
 */
SearchInterfaceTopicTree.prototype.searchInLayers = function (layerConfigs, searchInputRegExp) {
    const foundLayers = [];

    layerConfigs.forEach(layer => {
        if (store.getters["Maps/mode"] === "3D" || !layerTypes.getLayerTypes3d().includes(layer?.typ?.toUpperCase())) {
            const datasets = layer.datasets;
            let searchString = "",
                datasetsExist = false;

            if (this.searchType === "metadata" && Array.isArray(datasets) && datasets.length > 0 && typeof datasets[0].md_name === "string") {
                searchString = i18next.t(layer.datasets[0].md_name);
            }
            else if (typeof layer.name === "string") {
                searchString = i18next.t(layer.name);
            }
            if (Array.isArray(datasets) && datasets.length > 0 && typeof datasets[0].md_name === "string") {
                datasetsExist = true;
            }
            if (this.toolTip === "path") {
                layer.layerPath = this.getPath(layer);
            }
            if (searchString.search(searchInputRegExp) !== -1) {
                foundLayers.push(this.normalizeLayerResult(layer, datasetsExist));
            }
        }
    });

    return foundLayers;
};

/**
 * creates the path in the layertree of the given layer/folder
 * @param {Object} layerOrFolder - given layer or leaf folder
 * @return {String} path - the path in the layertree
 */
SearchInterfaceTopicTree.prototype.getPath = function (layerOrFolder) {
    let layerPath = [layerOrFolder.name];

    layerPath = this.getNamesOfParentFolder(layerOrFolder.parentId, layerPath).reverse();

    return layerPath.length > 0 ? layerPath.join("/") : undefined;
};

/**
 * Looks up for the names of all parent folders.
 * @param {String} parentId id of the parent folder
 * @param {Array} names to store names
 * @returns {Array}  the names of all parent folders
 */
SearchInterfaceTopicTree.prototype.getNamesOfParentFolder = function (parentId, names) {
    if (parentId !== undefined) {
        const parent = store.getters.folderById(parentId);

        if (parent) {
            names.push(parent.name);
            this.getNamesOfParentFolder(parent.parentId, names);
        }
    }
    return names;
};

/**
 * Normalizes the layer search results to display them in a SearchResult.
 * @param {Object} layer The search results layer.
 * @param {Boolean} datasetsExist Is true, if layer has datasets.
 * @returns {Object} The normalized layer search result.
 */
SearchInterfaceTopicTree.prototype.normalizeLayerResult = function (layer, datasetsExist) {
    let toolTip = "";

    if (this.toolTip === "path") {
        toolTip = layer.layerPath;
    }
    else if (datasetsExist) {
        toolTip = layer.datasets[0].md_name;
    }
    return {
        events: this.normalizeResultEvents(this.resultEvents, layer),
        category: layer.baselayer ? i18next.t("common:modules.searchBar.type.topicBaselayer") : i18next.t("common:modules.searchBar.type.topic"),
        icon: "bi-stack",
        id: layer.id,
        name: layer.name,
        toolTip: toolTip
    };
};

/**
 * Executes the search in the folders.
 * @param {Object} layerConfig The layerConfig from topic tree.
 * @param {String} searchInputRegExp The search input as regExp String.
 * @returns {Object[]} The found folders.
 */
SearchInterfaceTopicTree.prototype.searchInFolders = function (layerConfig, searchInputRegExp) {
    const folders = [],
        foundFolders = [];

    Object.keys(layerConfig).forEach(parentKeys => {
        this.searchInFolder(layerConfig[parentKeys], folders);
    });

    folders.forEach(folder => {
        if (folder.name.search(searchInputRegExp) !== -1) {
            if (this.toolTip === "path") {
                folder.folderPath = this.getPath(folder);
            }
            foundFolders.push(this.normalizeFolderResult(folder));
        }
    });

    return foundFolders;
};

/**
 * Search recursively in folders for elements of type folder.
 * @param {Object} folder The folder from topic tree.
 * @param {Object[]} folders The folders from topic tree.
 * @returns {void}
 */
SearchInterfaceTopicTree.prototype.searchInFolder = function (folder, folders) {
    folder?.elements?.forEach(element => {
        if (element?.type === "folder") {
            this.searchInFolder(element, folders);
            folders.push(element);
        }
    });
};

/**
 * Normalizes the folder search results to display them in a SearchResult.
 * @param {Object} folder The search results folder.
 * @returns {Object} The normalized folder search result.
 */
SearchInterfaceTopicTree.prototype.normalizeFolderResult = function (folder) {
    return {
        events: this.normalizeResultEvents({...this.resultEvents}, folder),
        category: i18next.t("common:modules.searchBar.type.folder"),
        icon: "bi-folder",
        id: folder.id,
        name: folder.name,
        toolTip: this.toolTip ? folder.folderPath : folder.name
    };
};

/**
 * Creates the possible actions and fills them.
 * @override
 * Note: Folders do not have activateLayerInTopicTree action.
 * @param {Object} searchResult The search result of topic tree.
 * @returns {Object} The possible actions.
 */
SearchInterfaceTopicTree.prototype.createPossibleActions = function (searchResult) {
    const possibleActions = {};

    if (searchResult.type !== "folder") {
        Object.assign(possibleActions, {
            activateLayerInTopicTree: {
                layerId: searchResult.id
            },
            showInTree: {
                layerId: searchResult.id
            },
            showLayerInfo: {
                layerId: searchResult.id
            }
        });
    }

    return possibleActions;
};
