/**
 * Converts heading in radians to degrees.
 * @param {Number} headingRad Heading in radians clockwise from north.
 * @returns {Number} Heading in degrees (0-360).
 */
export function toHeadingDegrees (headingRad) {
    return (headingRad * 180 / Math.PI + 360) % 360;
}

/**
 * Validates heading from geolocation sensor.
 * @param {Number|null|undefined} nativeHeading Heading from Geolocation API.
 * @returns {Number|null} Heading in radians if valid, null otherwise.
 */
export function resolveHeading (nativeHeading) {
    if (Number.isFinite(nativeHeading)) {
        return nativeHeading;
    }

    return null;
}

/**
 * Generates CSS style object for direction marker rotation.
 * @param {Boolean} showDirection Whether direction display is enabled.
 * @param {Number|null} heading Heading in radians.
 * @returns {Object} Style object with CSS variable or empty.
 */
export function getMarkerDirectionStyle (showDirection, heading) {
    if (!showDirection || !Number.isFinite(heading)) {
        return {};
    }

    const headingInDegree = toHeadingDegrees(heading);

    return {
        "--marker-heading-angle": `${headingInDegree}deg`
    };
}
