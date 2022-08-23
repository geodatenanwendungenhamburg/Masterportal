import {getSimpleGeometryStyle, getMultiGeometryStyle} from "../createStyle";
/**
 * Creates the style objects for the layer
 * @param   {string[]} geometryType Array of geometry types
 * @returns {void}
 */
export function createLegendInfo (geometryType) {
    const rules = this.get("rules");
    // eslint-disable-next-line no-unused-vars
    let styleObject,
        simpleGeom;

    geometryType.forEach(geom => rules.forEach(rule => {
        if (geom === "MultiSurface") {
            simpleGeom = "Polygon";
            styleObject = getSimpleGeometryStyle(simpleGeom, "", rule, false);
        }
        else if (geom.includes("Multi")) {
            simpleGeom = geom.replace("Multi", "");
            styleObject = getMultiGeometryStyle(simpleGeom, "", rule, false);
        }
        else {
            simpleGeom = geom;
            styleObject = getSimpleGeometryStyle(simpleGeom, "", rule, false);
        }
        // TODO: Was passiert hiermit? addLegendInfo(simpleGeom, styleObject, rule);
    }));
}