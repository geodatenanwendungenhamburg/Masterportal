// import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import {generateSimpleGetters} from "../../../shared/js/utils/generators";
import bimViewer from "./stateBimViewer";

const getters = {
    ...generateSimpleGetters(bimViewer),
    /**
     * Extract BCF viewpoint data. (BIM Collaboration Format)
     * This viewpoint data contains camera position, orientation and projection,
     * entity visibilities and selection states, SectionPlanes
     * to slice the model, lineSets to show 3D lines,
     * bitmaps to show images. This data does not contain comments/marker.
     *
     * @param {Object} state
     * @returns {String|null} BCF viewpoint data as JSON object or null if not available
     */
    getBcfViewpointJson: (state) => {
        if (!state.xeokitPluginBCFViewpoints) {
            return null;
        }

        const viewpoint = state.xeokitPluginBCFViewpoints.getViewpoint({
            spacesVisible: false,
            spaceBoundariesVisible: false,
            openingsVisible: false,
            snapshot: true
        });

        return JSON.stringify(viewpoint, null, 4);
    },
    /**
     * Get the metaobject for a given objectId.
     *
     * @param {Object} state
     * @returns {Function} Function that takes objectId and returns the metaobject
     */
    getObjectDataForId: (state) => (objectId) => {
        return state.xeokitViewer?.metaScene?.metaObjects?.[objectId];
    }
};

export default getters;
