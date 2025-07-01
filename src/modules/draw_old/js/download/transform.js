import store from "@appstore/index.js";
import {transform, transformPoint} from "./transformGeometry.js";

/**
 * Transforms the given geometry from EPSG:25832 to EPSG:4326.
 * If the geometry is not an instance of ol/LineString, ol/Point or ol/Polygon an Alert is send to the user.
 *
 * @param {module:ol/geom/Geometry} geometry Geometry to be transformed.
 * @returns {(Array<number>|Array<Array<number>>|Array<Array<Array<number>>>)} The transformed Geometry or an empty array.
 */
function transformCoordinates (geometry) {
    const coords = geometry.getCoordinates(),
        type = geometry.getType(),
        alert = {
            category: "error",
            content: i18next.t("common:modules.draw_old.download.unknownGeometry", {geometry: type}),
            displayClass: "error",
            multipleAlert: true
        };

    switch (type) {
        case "LineString":
            return transform(store.getters["Maps/projection"].getCode(), coords, false);
        case "Point":
            return transformPoint(store.getters["Maps/projection"].getCode(), coords);
        case "Polygon":
            return transform(store.getters["Maps/projection"].getCode(), coords, true);
        default:
            store.dispatch("Alerting/addSingleAlert", alert, {root: true});
            return [];
    }
}

export default {
    transformCoordinates
};
