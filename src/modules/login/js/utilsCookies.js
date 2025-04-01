/**
 * Set a cookie value
 *
 * @param {String} name of cookie to set
 * @param {String} value to set into cookie
 * @param {int} days the cookie is valid
 * @return {void}
 */
export function set (name, value, days) {
    let expires = "";

    if (days) {
        const date = new Date();

        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }

    // Set cookie with standard attributes and with domain for better cross-environment compatibility
    const cookie = name + "=" + (value || "") + expires + "; Secure; Path=/; SameSite=None",
        domain = window.location.hostname,
        cookieWithDomain = name + "=" + (value || "") + expires + "; Secure; Path=/; SameSite=None; domain=" + domain;

    document.cookie = cookie;

    document.cookie = cookieWithDomain;
}

/**
 * Gets value of cookie
 *
 * @param {String} name of cookie to retrieve
 * @returns {String} cookie value
 */
export function get (name) {
    const nameEQ = name + "=",
        ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];

        while (c.charAt(0) === " ") {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return undefined;
}

/**
 * Deletes a cookie by setting its expiration date to the past
 * Makes sure to delete both domain and non-domain variants
 *
 * @param {string} name - The name of the cookie to delete
 */
export function erase (name) {
    pastDate.setTime(pastDate.getTime() - (24 * 60 * 60 * 1000)); // Set to yesterday

    // Create expired date in the past
    const pastDate = new Date(),
        expires = "; expires=" + pastDate.toUTCString(),
        domain = window.location.hostname;

    // Delete cookie without domain
    document.cookie = name + "=" + expires + "; Path=/; SameSite=None; Secure";
    document.cookie = name + "=" + expires + "; Path=/; SameSite=None; Secure; domain=" + domain;
}

/**
 * Delete all cookies with names given in list
 *
 * @param {String[]} names of cookies to delete
 * @return {void}
 */
export function eraseAll (names) {
    names.forEach(name => {
        erase(name);
    });
}

export default {
    set,
    get,
    erase,
    eraseAll
};
