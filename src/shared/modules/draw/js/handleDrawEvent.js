import store from "@appstore/index.js";

/**
 * @param {Object} event drawInteraction event
 */
export default function handleDrawEvent (event) {
    const stateDrawCopy = JSON.parse(JSON.stringify(store.state.Modules.Draw));
    const drawState = {};

    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {
        "fromDrawTool": true,
        styleId: stateDrawCopy.idCounter + 1
    }));
    console.warn("handleDrawEvent, event: ", event);

    drawState.drawType = stateDrawCopy.selectedDrawType;
    drawState.imgPath = stateDrawCopy.drawSymbolImgPath;
    drawState.zIndex = stateDrawCopy.idCounter;


    if (["line", "pen"].includes(stateDrawCopy.selectedDrawType)) {
        stateDrawCopy.currentLayout.strokeColor.push(stateDrawCopy.currentLayout.fillTransparency);
        drawState.colorContour = stateDrawCopy.currentLayout.strokeColor;
    }
    else {
        stateDrawCopy.currentLayout.fillColor.push(stateDrawCopy.currentLayout.fillTransparency);
        stateDrawCopy.currentLayout.strokeColor.push(1);
        drawState.colorContour = stateDrawCopy.currentLayout.strokeColor;
        drawState.color = stateDrawCopy.currentLayout.fillColor;
    }

    switch (stateDrawCopy.selectedDrawType) {
        case "line":
            drawState.strokeWidth = stateDrawCopy.currentLayout.strokeWidth;
            drawState.lineLength = stateDrawCopy.currentLayout.lineLength;
            break;
        case "pen":
            drawState.strokeWidth = stateDrawCopy.currentLayout.strokeWidth;
            break;
        case "circle":
            drawState.circleRadius = stateDrawCopy.circleOptions.innerRadius;
            break;
        case "doubleCircle":
            drawState.circleRadius = stateDrawCopy.circleOptions.innerRadius;
            drawState.circleOuterRadius = stateDrawCopy.circleOptions.outerRadius;
            stateDrawCopy.currentLayoutOuterCircle.strokeColor.push(1);
            drawState.outerColorContour = stateDrawCopy.currentLayoutOuterCircle.strokeColor;
            break;
        case "writeText":
            drawState.font = stateDrawCopy.currentLayout.font;
            drawState.fontSize = stateDrawCopy.currentLayout.fontSize;
            drawState.text = stateDrawCopy.currentLayout.text;
            break;
        case "point":
            // symbol missing
            drawState.pointSize = stateDrawCopy.pointSize;
            break;
        default:
            break;
    }


    console.warn("current draw state: ", stateDrawCopy);


    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {"drawState": drawState}), false);


    console.warn("Feature after handleDrawEvent:", event.feature);

}
