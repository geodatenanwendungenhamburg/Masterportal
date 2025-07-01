import {nextTick} from "vue";
import layerUrlParams from "@core/layers/js/layerUrlParams.js";
import mapUrlParams from "@core/maps/js/mapUrlParams.js";
import menuUrlParams from "@modules/menu/js/menuUrlParams.js";
import searchBarUrlParams from "@modules/searchBar/js/searchBarUrlParams.js";

/**
 * Processes the url params.
 * @returns {void}
 */
export function startProcessUrlParams () {
    nextTick(() => {
        layerUrlParams.processLayerUrlParams();
        mapUrlParams.processMapUrlParams();
        menuUrlParams.processMenuUrlParams();
        searchBarUrlParams.processSearchBarUrlParams();
    });
}
