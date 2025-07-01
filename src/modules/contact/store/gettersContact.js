import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import initialState from "./stateContact.js";
import {minMessageLength, regexMail, regexPhone, regexUsername} from "./constantsContact.js";

const getters = {
    ...generateSimpleGetters(initialState),
    validForm: (
        {showPrivacyPolicy, privacyPolicyAccepted},
        {validMail, validMessage, validPhone, validUsername}
    ) => (!showPrivacyPolicy || privacyPolicyAccepted) &&
        validMail &&
        validMessage &&
        validPhone &&
        validUsername,
    validMail: ({mail}) => regexMail.test(mail),
    validMessage: ({message}) => message.length >= minMessageLength,
    validPhone: ({phone}) => regexPhone.test(phone),
    validUsername: ({username}) => regexUsername.test(username)
};

export default getters;
