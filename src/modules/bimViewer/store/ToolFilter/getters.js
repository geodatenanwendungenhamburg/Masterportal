// import {generateSimpleGetters} from "../../../../../src/app-store/utils/generators";
import {generateSimpleGetters} from "../../../../shared/js/utils/generators";
import state from "./state";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
