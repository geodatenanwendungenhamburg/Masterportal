import stateDraw from "@modules/draw/store/stateDraw.js";

/**
 * @param {Object} context actions context object.
 * @param {Object} event drawInteraction event
 */
export default function handleDrawEvent (event) {
    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {"fromDrawTool": true}));
    console.warn("handleDrawEvent, event: ", event);
    const stateDrawCopy = JSON.parse(JSON.stringify(stateDraw));

    // Add transparency to rgb for fillColor, for strokeColor transparency/opacity is always 1, e.g. no transparency
    stateDrawCopy.currentLayout.fillColor.push(stateDrawCopy.currentLayout.fillTransparency);
    stateDrawCopy.currentLayout.strokeColor.push(1);

    console.warn("current draw state: ", stateDrawCopy);

/*
    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {"drawState": {
        circleOuterRadius: stateDrawCopy.circleOptions.outerRadius,
        circleRadius: stateDrawCopy.circleOptions.innerRadius,
        color: stateDrawCopy.currentLayout.fillColor,
        colorContour: styleSettingsCopy.currentLayout.strokeColor,
        drawType,
        font: styleSettingsCopy.font,
        fontSize: parseInt(styleSettingsCopy.fontSize, 10),
        imgPath,
        lineLength: styleSettingsCopy.length,
        opacity: styleSettingsCopy.opacity,
        opacityContour: styleSettingsCopy.opacityContour,
        outerColorContour: styleSettingsCopy.outerColorContour,
        pointSize,
        squareArea: styleSettingsCopy.squareArea,
        squareMethod: styleSettingsCopy.squareMethod,
        strokeWidth: styleSettingsCopy.strokeWidth,
        symbol,
        text: styleSettingsCopy.text,
        zIndex
    }}), false);
*/
}
