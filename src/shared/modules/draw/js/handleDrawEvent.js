import store from "@appstore/index.js";

/**
 * @param {Object} event drawInteraction event
 */
export default function handleDrawEvent (event) {
    const stateDrawCopy = JSON.parse(JSON.stringify(store.state.Modules.Draw));
    const drawState = {};

    if (stateDrawCopy.selectedDrawType === "doubleCircle") {
        event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {
            "fromDrawTool": true,
            styleId: stateDrawCopy.idCounter + 2
        }));
    }
    else {
        event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {
            "fromDrawTool": true,
            styleId: stateDrawCopy.idCounter + 1
        }));
    }

    if (event.feature.getGeometry().getType() === "Polygon" && stateDrawCopy.selectedDrawType === "square") {
        event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {
            "isSquare": true,
            "squareCoords": event.feature.getGeometry().getCoordinates()[0]
        }));
    }

    drawState.drawType = stateDrawCopy.selectedDrawType;
    drawState.imgPath = Config.wfsImgPath;
    drawState.zIndex = stateDrawCopy.selectedDrawType === "doubleCircle" ? stateDrawCopy.idCounter + 1 : stateDrawCopy.idCounter;
    drawState.strokeWidth = stateDrawCopy.currentLayout.strokeWidth;


    if (["line", "pen"].includes(stateDrawCopy.selectedDrawType)) {
        stateDrawCopy.currentLayout.strokeColor.push(1 - stateDrawCopy.currentLayout.fillTransparency / 100);
        drawState.colorContour = stateDrawCopy.currentLayout.strokeColor;
    }
    else {
        stateDrawCopy.currentLayout.fillColor.push(1 - stateDrawCopy.currentLayout.fillTransparency / 100);
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
            drawState.circleRadius = stateDrawCopy.circleOptions.innerRadius;
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
            drawState.outerColorFill = stateDrawCopy.currentLayoutOuterCircle.fillColor.concat(1 - stateDrawCopy.currentLayoutOuterCircle.fillTransparency / 100);
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
            drawState.pointSize = stateDrawCopy.pointSize;
            drawState.symbol = {
                value: "simple_point",
                scale: 1
            };
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
        case "square":
            drawState.drawType = {
                "id": "drawSquare",
                "geometry": "Square"
            };
            break;
        default: {
            const selectedSymbol = stateDrawCopy.selectedSymbol;

            if (selectedSymbol) {
                drawState.symbol = {
                    value: selectedSymbol.value,
                    scale: selectedSymbol.scale || 1
                };
                if (selectedSymbol.type === "simple_point") {
                    drawState.pointSize = 16;
                }
            }
            drawState.drawType = {
                "id": "drawSymbol",
                "geometry": "Point"
            };
            break;
        }
    }

    event.feature.set("masterportal_attributes", Object.assign(event.feature.get("masterportal_attributes") ?? {}, {"drawState": drawState}), false);
}
