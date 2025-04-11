// import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import {generateSimpleGetters} from "../../../shared/js/utils/generators";
import bimViewer from "./stateBimViewer";

const getters = {
    ...generateSimpleGetters(bimViewer)
};

export default getters;
