
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import fileImportState from "./stateFileImport.js";

const getters = {
    ...generateSimpleGetters(fileImportState)

    // NOTE overwrite getters here if you need a special behaviour in a getter
};

export default getters;
