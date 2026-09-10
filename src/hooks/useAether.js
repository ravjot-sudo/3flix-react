import { useEffect, useState } from "react";
import { apiKey, baseUrl, isConfigured } from "../lib/config.js";

/**
 * CUSTOM HOOK — read from the AetherList API.
 *
 * What is known: the host answers "Backend is working as expected (v2.1.0)"
 * at its root, and unknown routes return a Nitro/h3 404 JSON body. There is no
 * public route list, so the endpoint is a REQUIRED argument rather than a
 * guess baked into the code. Until a path is passed, this hook makes no
 * request at all.
 *
 * Failure policy: every error path resolves to status "error" with the reason,
 * never a throw. Callers keep rendering the bundled catalogue.
 *
 * NOTE: VITE_ variables are inlined into the JavaScript bundle at build time,
 * so the key is visible to anyone who opens the page. Use a read-only key.
 *
 * @param {string|null} path  e.g. "/v2/films" — null means "do not fetch"
 */
export function useAether(path) {
  // Only completed results live in state, keyed by the path they answer.
  const [result, setResult] = useState({ path: null, data: null, error: null });
  const configured = isConfigured();

  useEffect(() => {
    if (!path || !configured) return undefined;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${baseUrl()}${path}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${apiKey()}`, Accept: "application/json" },
        });
        if (res.status === 401 || res.status === 403) {
          throw new Error(`AetherList rejected the key (${res.status})`);
        }
        if (!res.ok) throw new Error(`AetherList ${res.status} for ${path}`);
        const data = await res.json();
        setResult({ path, data, error: null });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.warn("[3flix] AetherList unavailable, using the bundled catalogue:", err.message);
        setResult({ path, data: null, error: err.message });
      }
    })();

    return () => controller.abort();
  }, [path, configured]);

  // Status is DERIVED, never stored: a result for a different path means the
  // request for this one is still in flight.
  let status;
  if (!path) status = "idle";
  else if (!configured) status = "unconfigured";
  else if (result.path !== path) status = "loading";
  else status = result.error ? "error" : "ready";

  const current = result.path === path;
  return { status, data: current ? result.data : null, error: current ? result.error : null };
}
