import {generateSimpleMutations} from "../../../shared/js/utils/generators";
import stateBimViewer from "./stateBimViewer";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateBimViewer),

    /**
     * If name from config.json starts with "translate#", the corrected key is set to name here.
     * @param {object} state of this component
     * @param {string} payload name of this component
     * @returns {void}
     */
    applyTranslationKey: (state, payload) => {
        if (payload && payload.indexOf("translate#") > -1) {
            state.name = payload.substring("translate#".length);
        }
    },
    /**
     * Pushes a model to the model instance array
     *
     * @param {object} state of this component
     * @param {object} theModel Ifc, xkt or gltf model instance
     * @returns {void}
     */
    pushLoadedModel (state, theModel) {
        state.loadedModels.push({
            sceneModel: theModel,
            extraSettings: {
                xRayed: false,
                visible: true
            }
        });
    },
    /**
     * Update the hierarchy property of the TreeView plugin
     *
     * @param {object} state of this component
     * @param {string} hierarchyType Type of hierarchy (containment|storeys|types)
     */
    updateXeokitPluginTreeViewHierarchyType (state, hierarchyType) {
        if (state.loadedModels?.length) {
            state.xeokitPluginTreeView.hierarchy = hierarchyType;
        }
    },
    /**
     * Remove a model from the loaded model list
     *
     * @param {object} state of this component
     * @param {string} modelId ModelId to be removed
     */
    removeFromLoadedModels (state, modelId) {
        state.loadedModels = state.loadedModels.filter(
            item => item.sceneModel.id !== modelId
        );
    }
};

export default mutations;
