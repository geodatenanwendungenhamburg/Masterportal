import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import copyrightConstraintsState from "./stateCopyrightConstraints.js";

const getters = {
    ...generateSimpleGetters(copyrightConstraintsState)
};

export default getters;
