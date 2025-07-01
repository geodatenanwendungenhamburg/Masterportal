const decodingMap = {
    "&nbsp;": " ",
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": "\"",
    "&apos;": "'",
    "&ndash;": "-"
};

/**
 * Decode html entities from a string.
 * @param {String} text The input HTML-encoded string
 * @returns {String} The decoded html string.
 */
export default function decodeHtmlEntites (text) {
    if (typeof text !== "string") {
        return "";
    }

    return text.replace(/&[\w#]+;/g, entity => decodingMap[entity] || entity);
}
