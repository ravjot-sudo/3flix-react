import { useCallback, useEffect, useState } from "react";
import { FILMS } from "../data/films.js";

/**
 * CUSTOM HOOK — loads the catalogue asynchronously.
 *
 * The data is local, so this deliberately goes through fetch() against a JSON
 * file in /public. That keeps the async path real — Promises, async/await,
 * response.ok checking, error state and a loading state — instead of faking a
 * delay around an import.
 *
 * Demonstrates: Promises, async/await, fetch, AbortController cleanup,
 * error handling, and the loading / error / success triad every real data
 * component needs.
 */
export function useFilms() {
  const [films, setFilms] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);

  // No setStatus("loading") here: status already *starts* as "loading", so
  // setting it again on mount would trigger an extra render for no change.
  // The reload wrapper below sets it, because a manual retry genuinely is a
  // transition back into the loading state.
  const load = useCallback(async (signal) => {
    try {
      const res = await fetch("/films.json", { signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setFilms(data);
      setError(null);      // clear any error from a previous attempt
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;   // unmounted, not a failure
      // The bundled catalogue is the fallback: a broken fetch degrades to
      // "works anyway" rather than an empty library.
      setFilms(FILMS);
      setError(err.message);
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // The linter flags this because `load` eventually calls setState. That
    // warning targets effects that set state to derive a value — this one is
    // fetching from the network, which is the "synchronizing with an external
    // system" case the rule explicitly allows. Every state write inside `load`
    // happens after an `await`, and the request is aborted on cleanup.
    // eslint-disable-next-line react/set-state-in-effect
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    setStatus("loading");
    setError(null);
    return load();
  }, [load]);

  return { films, status, error, reload };
}
