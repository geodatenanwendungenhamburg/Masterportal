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

}
