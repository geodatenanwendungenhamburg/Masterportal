// import {generateSimpleMutations} from "../../../../../src/app-store/utils/generators";
import {generateSimpleMutations} from "../../../../shared/js/utils/generators";
import state from "./state";

const mutations = {
    ...generateSimpleMutations(state)
};

export default mutations;
