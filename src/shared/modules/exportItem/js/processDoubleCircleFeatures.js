/**
 * Processes double-circle features by splitting shared draw-state attributes
 * into separate inner and outer circle representations.
 * A "double circle" is identified as exactly two geo-circle features sharing
 * the same center coordinate, where the styled attributes contain an
 * outerColorContour property.
 * @param {module:ol/Feature[]} features - Array of prepared OpenLayers features.
 * @returns {module:ol/Feature[]} The same array with updated masterportal_attributes on double-circle features.
 */
export function processDoubleCircleFeatures (features) {
    const circleGroups = {},
        geoFields = ["isGeoCircle", "geoCircleCenter", "geoCircleRadius"];

    features.forEach((feature, idx) => {
        const attrs = feature.get("masterportal_attributes");

        if (attrs?.isGeoCircle) {
            const center = attrs.geoCircleCenter;

            if (!circleGroups[center]) {
                circleGroups[center] = [];
            }
            circleGroups[center].push(idx);
        }
    });

    for (const indices of Object.values(circleGroups)) {
        if (indices.length !== 2) {
            continue;
        }

        const [idx1, idx2] = indices,
            attrs1 = features[idx1].get("masterportal_attributes"),
            attrs2 = features[idx2].get("masterportal_attributes"),
            styledAttrs = [attrs1, attrs2].find(attrs => attrs?.drawState?.outerColorContour)
                || (attrs1.fromDrawTool ? attrs1 : attrs2);

        if (!styledAttrs.drawState?.outerColorContour) {
            continue;
        }

        const sourceDrawState = styledAttrs.drawState,
            baseStyleAttrs = Object.fromEntries(
                Object.entries(styledAttrs).filter(([k]) => !geoFields.includes(k))
            ),
            geoAttrs1 = Object.fromEntries(Object.entries(attrs1).filter(([k]) => geoFields.includes(k))),
            geoAttrs2 = Object.fromEntries(Object.entries(attrs2).filter(([k]) => geoFields.includes(k))),
            outerDrawState = {
                ...sourceDrawState,
                colorContour: sourceDrawState.outerColorContour,
                color: sourceDrawState.outerColorFill,
                circleRadius: sourceDrawState.circleOuterRadius,
                strokeWidth: sourceDrawState.outerStrokeWidth ?? sourceDrawState.strokeWidth
            },
            innerDrawState = {
                ...sourceDrawState,
                zIndex: (sourceDrawState.zIndex ?? 0) + 1
            };

        delete outerDrawState.outerColorContour;
        delete outerDrawState.outerColorFill;
        delete outerDrawState.outerStrokeWidth;
        delete innerDrawState.outerColorContour;
        delete innerDrawState.outerColorFill;
        delete innerDrawState.outerStrokeWidth;

        if (geoAttrs1.geoCircleRadius > geoAttrs2.geoCircleRadius) {
            features[idx1].set("masterportal_attributes", {...baseStyleAttrs, drawState: outerDrawState, ...geoAttrs1});
            features[idx2].set("masterportal_attributes", {...baseStyleAttrs, drawState: innerDrawState, ...geoAttrs2});
        }
        else {
            features[idx1].set("masterportal_attributes", {...baseStyleAttrs, drawState: innerDrawState, ...geoAttrs1});
            features[idx2].set("masterportal_attributes", {...baseStyleAttrs, drawState: outerDrawState, ...geoAttrs2});
        }
    }

    return features;
}
