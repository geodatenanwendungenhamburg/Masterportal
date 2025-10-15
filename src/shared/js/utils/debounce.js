/**
 * Debounce function
 * @param {Function} callback The callback function to debounce.
 * @param {Number} wait Wait before the callback function is called.
 * @param {Object} [thisArg] Optional context to bind as 'this' in callback.
 * @returns {Function} Calls the given callback after the given time.
 */
export default function debounce (callback, wait, thisArg) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback.apply(thisArg, args), wait);
    };
}
