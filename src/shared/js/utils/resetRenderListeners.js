/**
 * Function used on layer with pre-/postrender listeners to reset them.
 * @param {Layer} layer – layer to reset render listeners on
 * @returns {void}
 */
export function resetRenderListeners (layer) {
    if (layer?._onPrerenderListener) {
        layer.getLayer().un("prerender", layer._onPrerenderListener);
        delete layer._onPrerenderListener;
    }
    if (layer?._onPostrenderListener) {
        layer.getLayer().un("postrender", layer._onPostrenderListener);
        delete layer._onPostrenderListener;
    }
}
