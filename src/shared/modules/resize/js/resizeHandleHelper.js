import {mainMenu, secondaryMenu} from "@shared/js/utils/constants.js";

/**
 * Clamps the calculated width between the component's min/max bounds
 * (relative to the masterportal container, accounting for the opposite menu's width
 * and the minimum required distance between both menus) and applies it to the handle element.
 * Also updates the corresponding Vuex state for the affected menu side.
 * Removes any inline maxWidth restriction before applying the new value.
 * @param {object} context - The ResizeHandle component instance.
 * @param {number} calculatedWidth - The raw width in pixels derived from cursor movement.
 * @param {number} minDistanceBetweenMenus - The minimum required distance in pixels between both menus.
 * @returns {void}
 */
export function clampAndApplyWidth (
    context, calculatedWidth, minDistanceBetweenMenus
) {
    const containerElement = document.getElementById("masterportal-container"),
        otherMenuElement = document.getElementById(
            `mp-menu-${context.side === mainMenu ? secondaryMenu : mainMenu}`
        );

    if (!containerElement || !otherMenuElement) {
        return;
    }

    const containerWidth = containerElement.offsetWidth,
        otherMenuElementWidth = otherMenuElement.offsetWidth,
        newWidth = Math.min(
            containerWidth * context.maxWidth - otherMenuElementWidth - minDistanceBetweenMenus,
            Math.max(containerWidth * context.minWidth, calculatedWidth)
        );

    if (context.side === mainMenu) {
        context.setMainMenuWidth(newWidth);
    }
    else if (context.side === secondaryMenu) {
        context.setSecondaryMenuWidth(newWidth);
    }

    if (context.handleElement.style.maxWidth !== "none") {
        context.handleElement.style.maxWidth = "none";
    }

    context.handleElement.style.width = `${Math.round(newWidth)}px`;
}

/**
 * Checks whether the given values is a Number and is between 0 and 1.
 *
 * @param {*} val Value given for any of the dimension props.
 * @returns {Boolean} Whether the given value is between 0 and 1.
 */
export function dimensionValidator (val) {
    return !isNaN(val) && typeof val === "number"
        && val >= 0 && val <= 1;
}
