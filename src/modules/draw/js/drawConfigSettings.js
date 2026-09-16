const drawTypeSettingsMap = {
    iconPoint: "drawSymbolSettings",
    line: "drawLineSettings",
    pen: "drawCurveSettings",
    box: "drawAreaSettings",
    polygon: "drawAreaSettings",
    circle: "drawCircleSettings",
    doubleCircle: "drawDoubleCircleSettings",
    square: "drawSquareSettings",
    writeText: "writeTextSettings"
};

/**
 * Returns config settings object matching the selected draw type.
 * @param {String} selectedDrawType The currently selected draw type.
 * @param {Object} settingsContainer The object containing draw settings by key.
 * @returns {Object|null} Config settings object for the selected draw type.
 */
function getConfigSettingsByDrawType (selectedDrawType, settingsContainer) {
    const settingsKey = drawTypeSettingsMap[selectedDrawType];

    return settingsKey ? settingsContainer[settingsKey] : null;
}

/**
 * Maps a config opacity value to draw fill transparency percent.
 * @param {Number} opacity Config opacity in range [0, 1].
 * @returns {Number} Transparency in range [0, 100].
 */
function mapOpacityToTransparency (opacity) {
    const safeOpacity = typeof opacity === "number" && !isNaN(opacity) ? opacity : 1,
        normalizedOpacity = Math.max(0, Math.min(1, safeOpacity));

    return Math.round((1 - normalizedOpacity) * 100);
}

/**
 * Maps config style settings into the new currentLayout model.
 * @param {Object|null} configSettings Config settings object.
 * @returns {Object} Layout patch compatible with setCurrentLayout.
 */
function mapConfigStyleSettingsToLayout (configSettings) {
    if (!configSettings || typeof configSettings !== "object") {
        return {};
    }

    const nextLayout = {},
        {color, opacity, colorContour, strokeWidth, squareMethod, squareArea, unit, text, font, fontSize, opacityContour} = configSettings;

    if (Array.isArray(color) && color.length >= 3) {
        nextLayout.fillColor = color.slice(0, 3);
    }

    if (typeof opacity === "number") {
        nextLayout.fillTransparency = mapOpacityToTransparency(opacity);
    }
    else if (Array.isArray(color) && color.length > 3 && typeof color[3] === "number") {
        nextLayout.fillTransparency = mapOpacityToTransparency(color[3]);
    }
    else if (typeof opacityContour === "number") {
        nextLayout.fillTransparency = mapOpacityToTransparency(opacityContour);
    }

    if (Array.isArray(colorContour) && colorContour.length >= 3) {
        nextLayout.strokeColor = colorContour.slice(0, 3);
    }

    if (typeof strokeWidth === "number") {
        nextLayout.strokeWidth = strokeWidth;
    }

    if (typeof squareMethod === "string") {
        nextLayout.squareMethod = squareMethod;
    }

    if (typeof squareArea === "number") {
        nextLayout.squareArea = squareArea;
    }

    if (typeof unit === "string") {
        nextLayout.squareUnit = unit;
    }

    if (typeof text === "string") {
        nextLayout.text = text;
    }

    if (typeof font === "string") {
        nextLayout.font = font;
    }

    if (typeof fontSize === "number") {
        nextLayout.fontSize = fontSize;
    }

    return nextLayout;
}

/**
 * Maps config outer ring styling to the new currentLayoutOuterCircle model.
 * @param {Object|null} configSettings Config settings object for double circles.
 * @returns {Object} Layout patch compatible with setCurrentLayoutOuterCircle.
 */
function mapConfigOuterCircleSettings (configSettings) {
    if (!configSettings || typeof configSettings !== "object") {
        return {};
    }

    const nextLayout = {},
        {color, opacity, outerColorContour, colorContour, strokeWidth} = configSettings;

    if (Array.isArray(color) && color.length >= 3) {
        nextLayout.fillColor = color.slice(0, 3);
    }

    if (typeof opacity === "number") {
        nextLayout.fillTransparency = mapOpacityToTransparency(opacity);
    }

    const validStrokeColor = [outerColorContour, colorContour].find(c => Array.isArray(c) && c.length >= 3);

    if (validStrokeColor) {
        nextLayout.strokeColor = validStrokeColor.slice(0, 3);
    }

    if (typeof strokeWidth === "number") {
        nextLayout.strokeWidth = strokeWidth;
    }

    return nextLayout;
}

/**
 * Maps config circle and double circle options to the new circleOptions model.
 * @param {String} selectedDrawType The currently selected draw type.
 * @param {Object|null} configSettings Config settings object.
 * @returns {Object} Options patch compatible with setCircleOptions.
 */
function mapConfigCircleOptions (selectedDrawType, configSettings) {
    if (!configSettings || typeof configSettings !== "object") {
        return {};
    }

    const nextCircleOptions = {};
    const {unit, circleRadius, circleOuterRadius, circleMethod} = configSettings;

    if (typeof unit === "string") {
        nextCircleOptions.unit = unit;
    }

    if (typeof circleRadius === "number") {
        nextCircleOptions.innerRadius = circleRadius;
    }

    if (selectedDrawType === "doubleCircle") {
        nextCircleOptions.interactive = false;
        if (typeof circleOuterRadius === "number") {
            nextCircleOptions.outerRadius = circleOuterRadius;
        }
    }
    else if (selectedDrawType === "circle" && typeof circleMethod === "string") {
        nextCircleOptions.interactive = circleMethod === "interactive";
    }

    return nextCircleOptions;
}

/**
 * Returns tooltip styles from config draw settings.
 * @param {Object|null} configSettings Config settings object.
 * @returns {Object} Tooltip style map.
 */
function getTooltipStyleFromConfigSettings (configSettings) {
    if (configSettings && configSettings.tooltipStyle && typeof configSettings.tooltipStyle === "object") {
        return configSettings.tooltipStyle;
    }

    return {};
}

export {
    getConfigSettingsByDrawType,
    getTooltipStyleFromConfigSettings,
    mapConfigCircleOptions,
    mapConfigOuterCircleSettings,
    mapConfigStyleSettingsToLayout
};
