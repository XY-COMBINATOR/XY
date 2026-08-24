/**
 * Release switches default to enabled so the additive XY OS route works without
 * another secret. Setting VITE_XY_OS_ENABLED=false disables only the new surface.
 */
export const xyOsEnabled = import.meta.env.VITE_XY_OS_ENABLED !== "false";
