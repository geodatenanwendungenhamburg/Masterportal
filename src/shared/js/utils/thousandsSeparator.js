
/**
 * adds thousands seperators into a number and changes the decimal point
 * @param {(Number|String)} num the number as number or string
 * @param {String} [delimAbs="."] the letter(s) to use as thousand point
 * @param {String} [delimDec=","] the letter(s) to use as decimal point
 * @param {boolean} [skipFourDigitYear=false] if true, prevents formatting plain four-digit numbers (e.g. years like "2025") and returns them unchanged.
 * @returns {String}  the given number with thousands seperators or an empty string if any invalid num was given
 */
function thousandsSeparator (num, delimAbs = ".", delimDec = ",", skipFourDigitYear = false) {
    if (typeof num !== "number" && typeof num !== "string") {
        return "";
    }

    if (skipFourDigitYear && (/^\d{4}$/).test(String(num).trim())) {
        return num;
    }

    const value = typeof num !== "string" ? num.toString() : num,
        decPointPos = value.indexOf("."),
        abs = decPointPos > -1 ? value.substring(0, decPointPos) : value,
        result = abs.replace(/\B(?=(\d{3})+(?!\d),?.*)/g, delimAbs),
        dec = decPointPos > -1 ? value.substring(decPointPos + 1) : false;

    return dec ? result + delimDec + dec : result;
}

export default thousandsSeparator;
