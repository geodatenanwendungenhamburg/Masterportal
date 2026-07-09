/**
 * The getters for the About store.
 *
 * @module modules/About/store/gettersAbout
 */
export default {
    /**
     * Checks whether an additional metadata URL is configured.
     *
     * @param {Object} state The About store state.
     * @param {String} state.metaUrl The metadata URL.
     * @returns {Boolean} Whether a metadata URL is configured.
     */
    hasMetaUrl: state => state.metaUrl.length > 0
};
