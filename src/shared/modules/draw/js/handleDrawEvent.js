import store from "@appstore/index.js";

/**
 * @param {Object} event drawInteraction event
 */
export default function handleDrawEvent (event) {
    const stateDrawCopy = JSON.parse(JSON.stringify(store.state.Modules.Draw));
    const drawState = {};

<<<<<<< HEAD
    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {
        "fromDrawTool": true,
        styleId: stateDrawCopy.idCounter + 1
    }));

    drawState.drawType = stateDrawCopy.selectedDrawType;
    drawState.imgPath = stateDrawCopy.drawSymbolImgPath;
    drawState.zIndex = stateDrawCopy.idCounter;
    drawState.strokeWidth = stateDrawCopy.currentLayout.strokeWidth;


    if (["line", "pen"].includes(stateDrawCopy.selectedDrawType)) {
        stateDrawCopy.currentLayout.strokeColor.push(stateDrawCopy.currentLayout.fillTransparency / 100);
        drawState.colorContour = stateDrawCopy.currentLayout.strokeColor;
    }
    else {
        stateDrawCopy.currentLayout.fillColor.push(stateDrawCopy.currentLayout.fillTransparency / 100);
        stateDrawCopy.currentLayout.strokeColor.push(1);
        drawState.colorContour = stateDrawCopy.currentLayout.strokeColor;
        drawState.color = stateDrawCopy.currentLayout.fillColor;
        drawState.opacity = stateDrawCopy.currentLayout.fillTransparency / 100;
    }

    switch (stateDrawCopy.selectedDrawType) {
        case "line":
            drawState.lineLength = stateDrawCopy.currentLayout.lineLength;
            drawState.drawType = {
                "id": "drawLine",
                "geometry": "LineString"
            };
            break;
        case "pen":
            drawState.drawType = {
                "id": "drawCurve",
                "geometry": "LineString"
            };
            break;
        case "circle":
            if (stateDrawCopy.circleOptions.interactive) {
                const gRadius = event.feature.getGeometry().getRadius();

                drawState.circleRadius = stateDrawCopy.circleOptions.unit === "km"
                    ? Math.round(gRadius / 1000)
                    : Math.round(gRadius);
            }
            else {
                drawState.circleRadius = stateDrawCopy.circleOptions.innerRadius;
            }
            drawState.drawType = {
                "id": "drawCircle",
                "geometry": "Circle"
            };
            break;
        case "doubleCircle":
            drawState.circleRadius = stateDrawCopy.circleOptions.innerRadius;
            drawState.circleOuterRadius = stateDrawCopy.circleOptions.outerRadius;
            stateDrawCopy.currentLayoutOuterCircle.strokeColor.push(1);
            drawState.outerColorContour = stateDrawCopy.currentLayoutOuterCircle.strokeColor;
            drawState.drawType = {
                "id": "drawCircle",
                "geometry": "Circle"
            };
            break;
        case "writeText":
            drawState.font = stateDrawCopy.currentLayout.font;
            drawState.fontSize = stateDrawCopy.currentLayout.fontSize;
            drawState.text = stateDrawCopy.currentLayout.text;
            drawState.drawType = {
                "id": "writeText",
                "geometry": "Point"
            };
            break;
        case "point":
            // symbol missing
            drawState.pointSize = stateDrawCopy.pointSize;
            drawState.drawType = {
                "id": "drawSymbol",
                "geometry": "Point"
            };
            break;
        case "box":
            drawState.drawType = {
                "id": "drawArea",
                "geometry": "Polygon"
            };
            break;
        case "polygon":
            drawState.drawType = {
                "id": "drawArea",
                "geometry": "Polygon"
            };
            break;
        default:
            break;
    }

    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {"drawState": drawState}), false);

=======
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

>>>>>>> 0893bf3372 (Draw: masterportal_attributes WIP)
}
