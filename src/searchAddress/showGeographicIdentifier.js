import defaults from "../defaults";

let showGeographicIdentifier = defaults.showGeographicIdentifier;

/**
 * Setzt ob geographicIdentifier als name eines Suchergebnisses verwendet werden soll
 * @param {boolean} show geographicIdentifier should be used as name of a search result
 * @returns {void}
 */
export function setShowGeographicIdentifier (show) {
    show ? showGeographicIdentifier = show : null;
}

/**
 * Retrieves active gazetteer URL.
 * @returns {boolean} geographicIdentifier should be used as name of a search result
 */
export function getShowGeographicIdentifier () {
    return showGeographicIdentifier;
}
