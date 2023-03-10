import createStyle from "../createStyle";
/**
 * Creates the style objects for the layer
 * @param   {object[]} rules styling rules from the styleObject
 * @param   {string[]} geometryType Array of geometry types
 * @param   {String} wfsImgPath path to wfsImg from Config
 * @returns {void}
 */
export function createLegendInfo (rules, geometryType, wfsImgPath) {
    let styleObject,
        simpleGeom;

    geometryType.forEach(geom => rules.forEach(rule => {
        if (geom === "MultiSurface") {
            simpleGeom = "Polygon";
            styleObject = createStyle.getSimpleGeometryStyle(simpleGeom, "", rule, false, wfsImgPath);
            return styleObject;
        }
        else if (geom.includes("Multi")) {
            simpleGeom = geom.replace("Multi", "");
            styleObject = createStyle.getMultiGeometryStyle(simpleGeom, "", rule, false, wfsImgPath);
            return styleObject;
        }

        simpleGeom = geom;
        styleObject = createStyle.getSimpleGeometryStyle(simpleGeom, "", rule, false, wfsImgPath);
        return styleObject;
    }));
}