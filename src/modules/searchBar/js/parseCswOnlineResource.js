/**
 * Parses relevant values from one gmd:CI_OnlineResource element.
 * @param {Element} onlineResource XML element for one online resource.
 * @returns {Object} Parsed values for service detection and layer extraction.
 */
function parseCswOnlineResource (onlineResource) {
    const gmdNs = "http://www.isotc211.org/2005/gmd",
        gcoNs = "http://www.isotc211.org/2005/gco",
        protocolEl = onlineResource.getElementsByTagNameNS(gmdNs, "protocol")[0]
            ?.getElementsByTagNameNS(gcoNs, "CharacterString")[0],
        protocol = protocolEl?.textContent?.trim() || "",
        urlEl = onlineResource.getElementsByTagNameNS(gmdNs, "linkage")[0]
            ?.getElementsByTagNameNS(gmdNs, "URL")[0],
        url = urlEl?.textContent?.trim() || "",
        nameEl = onlineResource.getElementsByTagNameNS(gmdNs, "name")[0]
            ?.getElementsByTagNameNS(gcoNs, "CharacterString")[0],
        layerName = nameEl?.textContent?.trim() || "",
        urlQuery = url.includes("?") ? url.split("?")[1] : "",
        urlParams = new URLSearchParams(urlQuery),
        urlLayerParam = urlParams.get("LAYERS") || urlParams.get("layers") || urlParams.get("Layers") || "",
        baseUrl = url ? url.split("?")[0] : "";

    return {
        protocol,
        url,
        layerName,
        urlLayerParam,
        baseUrl
    };
}

export default parseCswOnlineResource;
