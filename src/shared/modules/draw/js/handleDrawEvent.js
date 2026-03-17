import stateDraw from "@modules/draw/store/stateDraw.js";

/**
 * @param {Object} event drawInteraction event
 */
export default function handleDrawEvent (event) {
    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {"fromDrawTool": true}));
    console.warn("handleDrawEvent, event: ", event);
    const stateDrawCopy = JSON.parse(JSON.stringify(stateDraw));

    // Add transparency to rgb for fillColor, braucht Fallunterscheidung für transparente Linien
    stateDrawCopy.currentLayout.fillColor.push(stateDrawCopy.currentLayout.fillTransparency);
    stateDrawCopy.currentLayout.strokeColor.push(1);

    // Add transparency to outerColorContour, only used for Doppelkreis, no transparency on outer doppelkreis
    stateDrawCopy.currentLayoutOuterCircle.strokeColor.push(1);

    let strokeWidth = 1;

    if (stateDrawCopy.selectedDrawType === "line") {
        strokeWidth = stateDrawCopy.currentLayout.strokeWidth;
    }

    console.warn("current draw state: ", stateDrawCopy);


    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {"drawState": {
        circleOuterRadius: stateDrawCopy.circleOptions.outerRadius,
        circleRadius: stateDrawCopy.circleOptions.innerRadius,
        color: stateDrawCopy.currentLayout.fillColor,
        colorContour: stateDrawCopy.currentLayout.strokeColor,
        // drawType,
        // font: styleSettingsCopy.font,
        // fontSize: parseInt(styleSettingsCopy.fontSize, 10),
        // imgPath,
        // lineLength: styleSettingsCopy.length,
        outerColorContour: stateDrawCopy.currentLayoutOuterCircle.strokeColor,
        pointSize: stateDrawCopy.pointSize,
        strokeWidth,
        // symbol,
        text: stateDrawCopy.text,
        zIndex: stateDrawCopy.zIndex
    }}), false);

    console.warn("Feature after handleDrawEvent:", event.feature);

}
