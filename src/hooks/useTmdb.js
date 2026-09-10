import { useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage.js";
import { detectRegion } from "../lib/tmdb.js";

/**
 * CUSTOM HOOKS for remote data.
 *
 * Both hooks follow the same rule: state is only set when a request settles,
 * and "loading" is DERIVED (the answer we hold is for a different key than
 * the one we are asking about) rather than stored. That means no setState in
 * an effect body, and no flash of stale results when the inputs change.
 * Every request is cancelled with AbortController if its inputs change first.
 */

/** One-shot request, re-run whenever `key` changes. key = null → idle. */
export function useRemote(key, load) {
  const [state, setState] = useState({ key: null, data: null, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (key == null) return undefined;
    const ctrl = new AbortController();
    load(ctrl.signal).then(
      (data) => setState({ key, data, error: null }),
      (error) => { if (error.name !== "AbortError") setState({ key, data: null, error }); },
    );
    return () => ctrl.abort();
    // `load` is a fresh closure every render; `key` is what identifies the request.
  }, [key, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: key != null && !current,
    retry: () => setNonce((n) => n + 1),
  };
}

/**
 * A paged list with "load more". `fetchPage(page, signal)` must resolve to
 * { results, total, totalPages }. Pages accumulate until `key` changes.
 */
export function usePaged(key, fetchPage) {
  const [list, setList] = useState({ key: null, page: 0, items: [], total: 0, totalPages: 0, error: null });
  const [want, setWant] = useState({ key: null, page: 1 });
  const [nonce, setNonce] = useState(0);
  const page = want.key === key ? want.page : 1;

  useEffect(() => {
    if (key == null) return undefined;
    const ctrl = new AbortController();
    fetchPage(page, ctrl.signal).then(
      (r) => setList((prev) => {
        const carry = prev.key === key && page > 1 ? prev.items : [];
        const seen = new Set(carry.map((f) => f.id));
        return {
          key, page, error: null, total: r.total, totalPages: r.totalPages,
          items: carry.concat(r.results.filter((f) => !seen.has(f.id))),
        };
      }),
      (error) => {
        if (error.name !== "AbortError") setList((prev) => ({ ...prev, key, page, error }));
      },
    );
    return () => ctrl.abort();
  }, [key, page, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = list.key === key;
  return {
    items: current ? list.items : [],
    total: current ? list.total : 0,
    error: current ? list.error : null,
    loading: key != null && (!current || list.page !== page),
    hasMore: current && !list.error && list.page < list.totalPages,
    loadMore: () => setWant({ key, page: page + 1 }),
    retry: () => setNonce((n) => n + 1),
  };
}

/** The visitor's country for "on Netflix in …", remembered between visits. */
export function useRegion() {
  const [region, setRegion] = useLocalStorage("3flix:region", detectRegion());
  return [region, setRegion];
}
