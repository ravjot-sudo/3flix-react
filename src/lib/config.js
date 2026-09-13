/**
 * Project configuration reader for client environment variables.
 * Used for reading optional API keys and URLs without direct inline leakage.
 */
export const AETHER_KEY = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_AETHER_KEY || "").trim() : "";
export const AETHER_BASE_URL = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_AETHER_BASE_URL || "").trim() : "";
export const VIDEO_SOURCE = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_VIDEO_SOURCE || "").trim() : "";
