import stateRouting from "../../store/stateRouting.js";
import {convertColor} from "@shared/js/utils/convertColor.js";

/**
 * @description Abstracts the search results of isochrones areas.
 * @class RoutingIsochronesArea
 */
class RoutingIsochronesArea {
    /**
     * creates new RoutingIsochronesArea
     * @param {Array<Array<{Number, Number}>>} coordinates of area as polygon.
     * @param {Number} groupIndex of area.
     * @param {Number} value of area.
     * @param {Number} maximum value for interval.
     * @param {Number} interval value parameter.
     * @param {String} speedProfile parameter.
     * @param {String} optimization parameter.
     * @param {String[]} avoidSpeedProfileOptions parameter.
     * @param {Number} displayValue of area for GUI
     * @param {Number} population of area
     * @param {Number} area of area
     */
    constructor ({coordinates, groupIndex, value, maximum, interval, speedProfile, optimization, avoidSpeedProfileOptions, displayValue, population, area}) {
        this.coordinates = coordinates;
        this.groupIndex = groupIndex;
        this.value = value;
        this.maximum = maximum;
        this.interval = interval;
        this.speedProfile = speedProfile;
        this.optimization = optimization;
        this.avoidSpeedProfileOptions = avoidSpeedProfileOptions;
        this.displayValue = displayValue;
        this.calculateColor();
        this.population = population;
        this.area = area;
    }

    /**
     * Calculates the color for the area by interpolating between start and end color.
     * @returns {void}
     */
    calculateColor () {
        const startColor = stateRouting.Isochrones.settings.styleIsochrones.startColor,
            endColor = stateRouting.Isochrones.settings.styleIsochrones.endColor,
            startValue = this.getValue() - this.getInterval(),
            endValue = this.getMaximum() - this.getInterval(),
            fraction = startValue === 0 || endValue === 0 ? 0 : startValue / endValue;

        this.color = [
            (endColor[0] - startColor[0]) * fraction + startColor[0],
            (endColor[1] - startColor[1]) * fraction + startColor[1],
            (endColor[2] - startColor[2]) * fraction + startColor[2]
        ];
    }

    /**
     * Polygon coordinates.
     * @returns {Array<Array<{Number, Number}>>} coordinates of area as polygon.
     */
    getCoordinates () {
        return this.coordinates;
    }

    /**
     * Group index of area.
     * @returns {Number} groupIndex of area.
     */
    getGroupIndex () {
        return this.groupIndex;
    }

    /**
     * Value of area.
     * @returns {Number} value of area.
     */
    getValue () {
        return this.value;
    }

    /**
     * Maximum value of area.
     * @returns {Number} maximum value of area.
     */
    getMaximum () {
        return this.maximum;
    }
    /**
     * Interval value of area.
     * @returns {Number} interval value of area.
     */
    getInterval () {
        return this.interval;
    }
    /**
     * SpeedProfile parameter used.
     * @returns {String} speedProfile parameter used.
     */
    getSpeedProfile () {
        return this.speedProfile;
    }
    /**
     * Optimization parameter used.
     * @returns {String} optimization parameter used.
     */
    getOptimization () {
        return this.optimization;
    }

    /**
     * RGB color to display the area in.
     * @returns {Array<{Number, Number, Number}>} rgb color to display the area in.
     */
    getColor () {
        return this.color;
    }

    /**
     * RGB color string to display the area in.
     * @returns {Array<{Number, Number, Number}>} rgb color string to display the area in.
     */
    getColorRgbString () {
        return convertColor(this.color, "rgbString");
    }

    /**
     * Avoided speed profile options.
     * @returns {String[]} avoided speed profile options.
     */
    getAvoidSpeedProfileOptions () {
        return this.avoidSpeedProfileOptions;
    }

    /**
     * DisplayValue of area for GUI.
     * @returns {Number} displayValue of area for GUI.
     */
    getDisplayValue () {
        return this.displayValue;
    }

    /**
     * Creates GEOJSON polygon feature for area
     * @param {Object} additionalProperties to add to the feature properties.
     * @returns {Feature<Polygon>} GEOJSON polygon feature.
     */
    getGeojsonFeature (additionalProperties) {
        return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: this.getCoordinates()
            },
            properties: {
                value: this.getValue(),
                interval: this.getInterval(),
                maximum: this.getMaximum(),
                color: this.getColor(),
                groupIndex: this.getGroupIndex(),
                optimization: this.getOptimization(),
                speedProfile: this.getSpeedProfile(),
                avoidSpeedProfileOptions: this.getAvoidSpeedProfileOptions(),
                ...additionalProperties,
                ...this.getPopulation() && {population: this.getPopulation()},
                ...this.getArea() && {area: this.getArea()}
            }
        };
    }

    /**
     * Population of the area
     * @returns {Number} population of the area
     */
    getPopulation () {
        return this.population;
    }

    /**
     * Area of the isochrone
     * @returns {Number} Area of the isochrone
     */
    getArea () {
        return this.area;
    }

}

export {RoutingIsochronesArea};
