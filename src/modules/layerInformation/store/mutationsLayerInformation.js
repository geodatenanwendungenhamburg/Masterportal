import {generateSimpleMutations} from "../../../shared/js/utils/generators";
import stateLayerInformation from "./stateLayerInformation";

/**
 * The mutations for the layerInformation.
 * @module modules/layerInformation/store/mutationsLayerInformation
 */
export default {
    ...generateSimpleMutations(stateLayerInformation),

    /**
     * Sets the layerinfo of the active layer.
     * @param {Object} state Context object.
     * @param {Object} layerConf The layer configuration.
     * @returns {void}
     */
    setLayerInfo (state, layerConf) {
        const metaID = layerConf?.datasets?.length > 0 ? layerConf.datasets[0].md_id : null,
            url = layerConf?.url || layerConf?.capabilitiesUrl,
            layers = [];

        let cswUrl = layerConf?.datasets?.[0]?.csw_url ?? null,
            customMetadata = layerConf?.datasets?.[0]?.customMetadata ?? null,
            attributes = layerConf?.datasets?.[0]?.attributes ?? null,
            showDocUrl = layerConf?.datasets?.[0]?.show_doc_url ?? null;

        if (layerConf?.typ === "GROUP") {
            layerConf.children.forEach(child => {
                const childUrl = child.url || child.capabilitiesUrl,
                    dataset = child.datasets?.[0] || {},
                    childMetaID = dataset.md_id || null,
                    childCswUrl = dataset.csw_url || null,
                    childCustomMetadata = dataset.customMetadata || null,
                    childAttributes = dataset.attributes || null,
                    childShowDocUrl = dataset.show_doc_url || null;

                layers.push({
                    name: child.name,
                    type: child.typ,
                    metaID: childMetaID,
                    url: childUrl
                });

                if (child.datasets?.length > 0) {
                    if (!cswUrl) {
                        cswUrl = childCswUrl;
                    }
                    if (!customMetadata) {
                        customMetadata = childCustomMetadata;
                    }
                    if (!attributes) {
                        attributes = childAttributes;
                    }
                    if (!showDocUrl) {
                        showDocUrl = childShowDocUrl;
                    }
                }
            });
        }
        state.layerInfo = {
            cswUrl,
            id: layerConf?.id,
            layername: layerConf?.name,
            showDocUrl,
            typ: layerConf?.typ,
            ...customMetadata && {customMetadata},
            ...attributes && {attributes},
            ...metaID && {metaID},
            ...layers.length > 0 && {layers},
            ...layerConf?.legendURL && {legendURL: layerConf.legendURL},
            ...url && {url},
            ...(layerConf?.urlIsVisible !== undefined) && {urlIsVisible: layerConf?.urlIsVisible}
        };
    }
};
