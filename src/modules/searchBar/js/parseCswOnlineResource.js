/**
 * Parses relevant values from one gmd:CI_OnlineResource element.
 * Supports protocol values encoded as gco:CharacterString or gmx:Anchor (xlink:href).
 * @param {Element} onlineResource XML element for one online resource.
 * @returns {Object} Parsed values for service detection and layer extraction.
 */
function normalizeMalformedCswUrl (url) {
    if (!url) {
        return "";
    }

    try {
        const parsedUrl = new URL(url);

        // Some CSW records encode query parameters in path as '&key=value' without '?'.
        if (!parsedUrl.search && parsedUrl.pathname.includes("&")) {
            const ampIndex = parsedUrl.pathname.indexOf("&"),
                potentialQuery = parsedUrl.pathname.slice(ampIndex + 1);

            if ((/^[A-Za-z_][A-Za-z0-9_.-]*=.*/).test(potentialQuery)) {
                parsedUrl.pathname = parsedUrl.pathname.slice(0, ampIndex);
                parsedUrl.search = `?${potentialQuery}`;
            }
        }

        return parsedUrl.toString();
    }
    catch (error) {
        return url;
    }
}

/**
 * Parses protocol, URL and layer hints from one CSW online resource node.
 * @param {Element} onlineResource XML element for one online resource.
 * @returns {Object} Normalized online resource data.
 */
function parseCswOnlineResource (onlineResource) {
    const gmdNs = "http://www.isotc211.org/2005/gmd",
        gcoNs = "http://www.isotc211.org/2005/gco",
        gmxNs = "http://www.isotc211.org/2005/gmx",
        protocolParentEl = onlineResource.getElementsByTagNameNS(gmdNs, "protocol")[0],
        protocolCharString = protocolParentEl?.getElementsByTagNameNS(gcoNs, "CharacterString")[0],
        protocolAnchor = protocolParentEl?.getElementsByTagNameNS(gmxNs, "Anchor")[0],
        protocol = protocolCharString?.textContent?.trim()
            || (
                (protocolAnchor?.getAttribute("xlink:href") || "")
                + " "
                + (protocolAnchor?.textContent?.trim() || "")
            ).trim()
            || "",
        urlEl = onlineResource.getElementsByTagNameNS(gmdNs, "linkage")[0]
            ?.getElementsByTagNameNS(gmdNs, "URL")[0],
        rawUrl = urlEl?.textContent?.trim() || "",
        url = normalizeMalformedCswUrl(rawUrl),
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
