import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import AddWMSState from "./stateAddWMS.js";

const getters = {
    ...generateSimpleGetters(AddWMSState)
};

export default getters;
