import store from "@appstore/index.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import mapMarker from "../js/mapMarker.js";

/**
 * Creates a feature from the given geometry and adds it to the map.
 * @param {ol/Feature} features The ol features to be highlighted
 * @param {Boolean} isAdditional - Flag if the style should be for additional or default polygon
 * @returns {void}
 */
export default function placingAdditionalPolygonMarker (features, isAdditional) {
    const PolygonStyleId = isAdditional ? store.getters["MapMarker/additionalPolygonStyleId"] : store.getters["MapMarker/polygonStyleId"],
        styleListModel = styleList.returnStyleObject("defaultMapMarkerPolygon");

    if (styleListModel && features.length > 0) {
        features.forEach(feature => {
            const featureStyle = createStyle.createStyle(styleListModel, feature, false),
                layerId = "marker_polygon_layer";

            feature.setStyle(featureStyle);
            mapMarker.addFeatureToMapMarkerLayer(layerId, feature);
        });
    }
    else {
        store.dispatch("Alerting/addSingleAlert", i18next.t("common:modules.mapMarker.noStyleModel", {styleId: PolygonStyleId}), {root: true});
    }
}
