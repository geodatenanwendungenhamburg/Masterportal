import {getSimpleGeometryStyle, getMultiGeometryStyle} from "../createStyle";
/**
 * Creates the style objects for the layer
 * @param   {object[]} rules styling rules from the styleObject
 * @param   {string[]} geometryType Array of geometry types
 * @returns {void}
 */
export function createLegendInfo (rules, geometryType) {
    let styleObject,
        simpleGeom;

    geometryType.forEach(geom => rules.forEach(rule => {
        if (geom === "MultiSurface") {
            simpleGeom = "Polygon";
            styleObject = getSimpleGeometryStyle(simpleGeom, "", rule, false);
            return styleObject;
        }
        else if (geom.includes("Multi")) {
            simpleGeom = geom.replace("Multi", "");
            styleObject = getMultiGeometryStyle(simpleGeom, "", rule, false);
            return styleObject;
        }

        simpleGeom = geom;
        styleObject = getSimpleGeometryStyle(simpleGeom, "", rule, false);
        return styleObject;
    }));
}