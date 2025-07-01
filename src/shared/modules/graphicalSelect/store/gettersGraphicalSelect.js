import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import gsState from "./stateGraphicalSelect.js";

const getters = {
    /**
     * Creates from every state-key a getter.
     */
    ...generateSimpleGetters(gsState)
};

export default getters;
