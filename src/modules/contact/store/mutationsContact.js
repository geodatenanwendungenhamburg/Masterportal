import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import initialState from "./stateContact.js";

const mutations = {
    ...generateSimpleMutations(initialState),
    togglePrivacyPolicyAccepted: state => {
        state.privacyPolicyAccepted = !state.privacyPolicyAccepted;
    }
};

export default mutations;
