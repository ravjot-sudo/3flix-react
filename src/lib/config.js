/**
 * One place that reads configuration, so nothing else in the app touches
 * import.meta.env directly.
 *
 * Everything here is optional: with no key the app runs on its bundled
 * catalogue and generated posters exactly as before. That is why the whole
 * project still works with no network and no setup.
 */

/** @returns {string|null} the key, or null when unset. */
export function apiKey() {
  const k = import.meta.env.VITE_AETHER_KEY;
  return typeof k === "string" && k.trim() ? k.trim() : null;
}

/** @returns {string|null} the API base URL, or null when unset. */
export function baseUrl() {
  const u = import.meta.env.VITE_AETHER_BASE_URL;
  return typeof u === "string" && u.trim() ? u.trim().replace(/\/+$/, "") : null;
}

/** True only when both halves are present — a key with no URL is useless. */
export const isConfigured = () => apiKey() !== null && baseUrl() !== null;
