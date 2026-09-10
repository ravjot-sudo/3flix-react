import { useCallback, useEffect, useState } from "react";

/**
 * CUSTOM HOOK — state that persists to localStorage.
 *
 * Demonstrates: custom hooks, useState with lazy initialiser, useEffect,
 * useCallback, JSON.parse/stringify, and try/catch around a browser API that
 * genuinely throws (private browsing, full quota).
 *
 * @param {string} key   storage key
 * @param {*} initial    value used when nothing is stored yet
 * @returns {[*, Function, Function]} [value, setValue, reset]
 */
export function useLocalStorage(key, initial) {
  // Lazy initialiser: the function runs once on mount, not on every render.
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  // Write on every change. Failure here is non-fatal: the session still works,
  // it simply will not be remembered.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded or storage blocked */
    }
  }, [key, value]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, reset];
}
