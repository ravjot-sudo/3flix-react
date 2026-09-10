import { useEffect, useState } from "react";

/**
 * CUSTOM HOOK — subscribe to a CSS media query from JavaScript.
 *
 * Demonstrates: useEffect subscribing to a browser event and cleaning up,
 * and keeping JS breakpoints in step with the CSS ones rather than
 * hard-coding a second set of numbers.
 *
 * @param {string} query e.g. "(min-width: 900px)"
 */
export function useMediaQuery(query) {
  // Lazy initialiser reads the current value once, on mount. The listener
  // below covers every change after that, so there is nothing to re-sync
  // inside the effect.
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
