import axios from "axios";

/**
 * Extracts collections endpoint URL from OAF landing page links.
 * Looks for rel="data" or rel="collections" link, falls back to /collections.
 * @param {Object} landingPage Landing page JSON response
 * @param {String} baseUrl OAF service base URL for fallback
 * @returns {String} Collections endpoint URL
 */
function resolveCollectionsUrl (landingPage, baseUrl) {
    const normalizedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    if (!landingPage.links || !Array.isArray(landingPage.links)) {
        return `${normalizedUrl}/collections`;
    }

    // Look for rel="data" or rel="collections" link
    const collectionsLink = landingPage.links.find(link => link.rel === "data" || link.rel === "collections"
    );

    if (collectionsLink?.href) {
        try {
            return new URL(collectionsLink.href, `${normalizedUrl}/`).toString();
        }
        catch (error) {
            return collectionsLink.href;
        }
    }

    // Fallback to standard path
    return `${normalizedUrl}/collections`;
}

/**
 * Handles OAF (OGC API Features) layer discovery for CSW records.
 * Fetches the landing page, resolves collections endpoint link, then extracts collection titles and IDs.
 * @param {String} baseUrl OAF service base URL
 * @returns {Promise<Object>} Result state with discovered collection names and service title
 */
export default async function handleOafFromCsw (baseUrl) {
    try {
        const normalizedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

        // Fetch landing page to discover collections endpoint
        let landingPage = {};
        let serviceTitle = "";

        try {
            const landingResponse = await axios.get(normalizedUrl, {
                timeout: 7000,
                headers: {Accept: "application/json"}
            });

            landingPage = landingResponse.data || {};
            serviceTitle = landingPage.title || "";
        }
        catch (landingError) {
            // Ignore landing page errors; fallback /collections handling continues below.
        }

        // Resolve actual collections endpoint URL
        const collectionsUrl = resolveCollectionsUrl(landingPage, baseUrl);

        // Fetch collections
        const collResponse = await axios.get(collectionsUrl, {
            timeout: 7000,
            headers: {Accept: "application/json"}
        });

        const collectionsData = collResponse.data;

        // Extract service title from collections response if not found in landing page
        if (!serviceTitle && collectionsData.title) {
            serviceTitle = collectionsData.title;
        }

        // Collections can be at root level or nested in a "collections" array
        let collections = [];

        if (Array.isArray(collectionsData.collections)) {
            collections = collectionsData.collections;
        }
        else if (Array.isArray(collectionsData)) {
            collections = collectionsData;
        }

        // Extract collection names and titles
        const layerTitleEntries = collections
            .filter(collection => collection.id || collection.name)
            .map(collection => ({
                name: collection.id || collection.name,
                title: collection.title || collection.id || collection.name
            }));

        return {
            layersAdded: layerTitleEntries.length > 0,
            serviceUnavailable: false,
            serviceTitle,
            layerNames: layerTitleEntries.map(entry => entry.name),
            layerTitleEntries
        };
    }
    catch (capError) {
        console.warn("handleOafFromCsw: OAF collections endpoint failed, collections will be empty.", capError);
        return {layersAdded: false, serviceUnavailable: true, serviceTitle: "", layerNames: [], layerTitleEntries: []};
    }
}
