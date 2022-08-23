import {Style} from "ol/style.js";
import PointStyle from "./styles/point/stylePoint";
import TextStyle from "./styles/styleText";
import PolygonStyle from "./styles/polygon/stylePolygon";
import LineStringStyle from "./styles/styleLine";
import CesiumStyle from "./styles/styleCesium";
import {getRuleForIndex, getRulesForFeature} from "./lib/getRuleForIndex";

const legendsOfAllStyles = [];

/**
 * Returns true if feature contains some kind of MultiGeometry
 * @param   {string}  geometryType     the geometry type to check
 * @returns {Boolean} is geometrytype a multiGeometry
 */
function isMultiGeometry (geometryType) {
    return geometryType === "MultiPoint" || geometryType === "MultiLineString" || geometryType === "MultiPolygon" || geometryType === "GeometryCollection" || geometryType === "Cesium";
}

/**
 * Returns the style for simple (non-multi) geometry types
 * @param   {string}  geometryType GeometryType
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object}  rule       styling rules to check.
 * @param   {Boolean} isClustered  Flag to show if feature is clustered.
 * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
 * @returns {ol/style/Style}    style is always returned
 */
export function getSimpleGeometryStyle (geometryType, feature, rule, isClustered, wfsImgPathFromConfig) {
    const style = rule?.style;
    let styleObject;

    // if (style && Object.prototype.hasOwnProperty.call(style, "labelField")) {
    //     console.log("hat er label?");
    //     set("labelField", style.labelField);
    // }
    feature.legendValue = style.legendValue;

    if (geometryType === "Point") {
        styleObject = new PointStyle(feature, style, isClustered);
        styleObject.initialize(feature, style, isClustered, wfsImgPathFromConfig);
        styleObject.addLegendInfo("Point", styleObject, rule);
        styleObject.legendValue = style.legendValue;
        return styleObject;
    }
    else if (geometryType === "LineString") {
        styleObject = new LineStringStyle(feature, style, isClustered);
        styleObject.initialize(feature, style, isClustered);
        styleObject.addLegendInfo("LineString", styleObject, rule);
        styleObject.legendValue = style.legendValue;
        return styleObject;
    }
    else if (geometryType === "LinearRing") {
        console.warn("Geometry type not implemented: " + geometryType);
        return new Style();
    }
    else if (geometryType === "Polygon") {
        styleObject = new PolygonStyle(feature, style, isClustered);
        styleObject.initialize(feature, style, isClustered);
        styleObject.addLegendInfo("Polygon", styleObject, rule);
        styleObject.legendValue = style.legendValue;
        return styleObject;
    }
    else if (geometryType === "Cesium") {
        styleObject = new CesiumStyle(rule);
        styleObject.initialize(rule);
        styleObject.addLegendInfo("Cesium", styleObject, rule);
        styleObject.legendValue = style.legendValue;
        return styleObject;
    }
    else if (geometryType === "Circle") {
        // TODO(roehlipa): Wird dies noch implementiert? Beispiel für ein einfaches Stylings eines Kreises ist src/modules/tools/draw/utils/style/createDrawStyle.js im Masterportal
        console.warn("Geometry type not implemented: " + geometryType);
        return new Style();
    }

    console.warn("Geometry type not implemented: " + geometryType);
    return new Style();
}

/**
 * Returns an array of simple geometry styles.
 * @param   {string}  geometryType GeometryType
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object[]}  rules       styling rules to check.
 * @param   {Boolean} isClustered  Flag to show if feature is clustered.
 * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
 * @returns {ol/style/Style[]}    style array of simple geometry styles is always returned
 */
export function getMultiGeometryStyle (geometryType, feature, rules, isClustered, wfsImgPathFromConfig) {
    const olStyle = [];
    let geometries = [];

    if (typeof feature === "object") {
        if (geometryType === "MultiPoint") {
            geometries = feature.getGeometry().getPoints();
        }
        else if (geometryType === "MultiLineString") {
            geometries = feature.getGeometry().getLineStrings();
        }
        else if (geometryType === "MultiPolygon") {
            geometries = feature.getGeometry().getPolygons();
        }
        else if (geometryType === "GeometryCollection") {
            geometries = feature.getGeometry().getGeometries();
        }

        geometries.forEach((geometry, index) => {
            const geometryTypeSimpleGeom = geometry.getType(),
                rule = rules ? getRuleForIndex(rules, index) : undefined,
                simpleStyle = getSimpleGeometryStyle(geometryTypeSimpleGeom, feature, rule, isClustered, wfsImgPathFromConfig);

            // For simplicity reasons we do not support multi encasulated multi geometries but ignore them.
            if (isMultiGeometry(geometryTypeSimpleGeom)) {
                console.warn("Multi encapsulated multiGeometries are not supported.");
            }
            else if (!simpleStyle.styleMultiGeomOnlyWithRule || rule) {
                olStyle.push(simpleStyle);
            }
        });
    }
    else if (geometryType === "Cesium") {
        rules.forEach(rule => {
            const simpleStyle = getSimpleGeometryStyle(geometryType, feature, rule, isClustered, wfsImgPathFromConfig);

            olStyle.push(simpleStyle);
        });
    }
    else {
        const simpleStyle = getSimpleGeometryStyle(geometryType, feature, rules, isClustered, wfsImgPathFromConfig);

        simpleStyle.getStyle().setGeometry(geometryType);
        olStyle.push(simpleStyle);
    }
    return olStyle;
}

/**
 * Returns the style for the geometry object
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object[]}  rules       styling rules to check. Array can be empty.
 * @param   {Boolean} isClustered Flag to show if feature is clustered.
 * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
 * @returns {ol/style/Style}    style is always returned
 */
export function getGeometryStyle (feature, rules, isClustered, wfsImgPathFromConfig) {
    const geometryType = feature ? feature.getGeometry().getType() : "Cesium";

    // For simple geometries the first styling rule is used.
    // That algorithm implements an OR statement between multiple valid conditions giving precedence to its order in the style.json.
    if (!isMultiGeometry(geometryType) && Object.prototype.hasOwnProperty.call(rules, 0) && Object.prototype.hasOwnProperty.call(rules[0], "style")) {
        return getSimpleGeometryStyle(geometryType, feature, rules[0], isClustered, wfsImgPathFromConfig);
    }
    // MultiGeometries must be checked against all rules because there might be a "sequence" in the condition.
    else if (isMultiGeometry(geometryType) && rules.length > 0 && rules.every(element => element?.style)) {
        return getMultiGeometryStyle(geometryType, feature, rules, isClustered, wfsImgPathFromConfig);
    }

    // fall back to default styles as configured in geomType specific styles, if no rule is matched
    console.warn("No valid styling rule found. Falling back to defaults");
    return isMultiGeometry(geometryType)
        ? getMultiGeometryStyle(geometryType, feature, undefined, isClustered, wfsImgPathFromConfig)
        : getSimpleGeometryStyle(geometryType, feature, undefined, isClustered, wfsImgPathFromConfig);
}

/**
 * Returns the style to label the object
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object}  style       styling rule from style.json
 * @param   {Boolean} isClustered Flag to show if feature is clustered.
 * @returns {ol/style/Text}    style is always returned
 */
function getLabelStyle (feature, style, isClustered) {
    const styleObject = new TextStyle(feature, style, isClustered);

    styleObject.initialize(feature, style, isClustered);
    return styleObject.getStyle();
}

/**
 * Captures the legend from a feature and pushes it to an array of all legends.
 * @param   {string}  styleId styleId from a given feature
 * @param   {object}  legendInformation legendInformation from a given feature
 * @returns {void}
 */
function captureLegendFromFeature (styleId, legendInformation) {
    if (!legendsOfAllStyles.find(element => element.id === styleId)) {
        legendsOfAllStyles.push({id: styleId, legendInformation: []});
    }
    else if (styleId === "default") {
        const defaultLegends = legendsOfAllStyles.find(element => element.id === styleId);

        if (!defaultLegends.legendInformation.find(element => element.id === legendInformation.id)) {
            defaultLegends.legendInformation.push(legendInformation);
        }
    }
    const found = legendsOfAllStyles.find(element => element.id === styleId);

    if (found && !found.legendInformation.find(element => element.label === legendInformation.label)) {
        found.legendInformation.push(legendInformation);
    }
}

/**
     * Function is called from layer models for each feature.
     * @param   {String}  styleObject     id of the style
     * @param   {ol/feature}  feature     the feature to style
     * @param   {Boolean} isClustered is feature clustered
     * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
     * @returns {ol/style/Style} style used in layer model
     */
export function createStyle (styleObject, feature, isClustered, wfsImgPathFromConfig) {
    const rules = getRulesForFeature(styleObject, feature),
        // Takes first rule in array for labeling so that is giving precedence to the order in the style.json
        style = Array.isArray(rules) && rules.length > 0 ? rules[0].style : null,
        hasLabelField = style?.labelField,
        geometryStyle = getGeometryStyle(feature, rules, isClustered, wfsImgPathFromConfig),
        legendInformation = Array.isArray(geometryStyle) ? geometryStyle[0].legendInfos[0] : geometryStyle.legendInfos[0],
        styleObjectGeometry = Array.isArray(geometryStyle) ? geometryStyle[0].getStyle() : geometryStyle.getStyle();

    captureLegendFromFeature(styleObject.styleId, legendInformation);

    // label style is optional and depends on some fields
    if (isClustered || hasLabelField) {
        if (Array.isArray(styleObjectGeometry)) {
            styleObjectGeometry[0].setText(getLabelStyle(feature, style, isClustered));
        }
        else {
            styleObjectGeometry.setText(getLabelStyle(feature, style, isClustered));
        }
    }
    return styleObjectGeometry;
}

export function returnLegends () {
    return legendsOfAllStyles;
}
