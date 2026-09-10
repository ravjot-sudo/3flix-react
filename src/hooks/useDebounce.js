import { useEffect, useState } from "react";

/**
 * CUSTOM HOOK — returns `value` only after it has stopped changing for `delay`.
 *
 * Demonstrates: useEffect with a cleanup function, and why cleanup matters —
 * without the clearTimeout, every keystroke would leave a live timer behind.
 *
 * @param {*} value
 * @param {number} delay milliseconds
 */
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);   // cleanup: cancels the previous timer
  }, [value, delay]);

  return debounced;
}
