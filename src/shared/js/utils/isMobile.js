import variables from "@/assets/css/export-variables.module.scss";

/**
 * Breakpoint in pixels at which to switch to mobile mode.
 */
const mobileBreakpoint = parseInt(variables.gridBreakpointsMd, 10) || 768;

/**
 * Checks if the current window size indicates a mobile device.
 * @returns {Boolean}  true if screen is considered mobile device
 */
export default function isMobile () {
    return window.innerWidth < mobileBreakpoint;
}
