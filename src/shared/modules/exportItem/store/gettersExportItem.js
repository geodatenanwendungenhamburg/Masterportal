import {generateSimpleGetters} from "@shared/js/utils/generators";
import eState from "./stateExportItem";

const getters = {
    /**
     * Creates from every state-key a getter.
     */
    ...generateSimpleGetters(eState)
};

export default getters;
