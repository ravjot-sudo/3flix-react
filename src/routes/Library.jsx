import { useMemo, useState } from "react";
import { Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import SearchForm from "../components/SearchForm.jsx";
import FilmGrid from "../components/FilmGrid.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import { useRemote } from "../hooks/useTmdb.js";
import { newReleases } from "../lib/tmdb.js";

/**
 * Library — the browse page, and a PARENT route.
 *
 * Two collections share one grid, one search box and one genre filter:
 *   new       the 100 most popular films of 2023–2025 (TMDB). Each opens its
 *             /movies page: official trailer, and where it streams.
 *   classics  the 24 public-domain films. These play right here, in the
 *             nested /library/:filmId route.
 *
 * /library                     new & popular (the default)
 * /library?c=classics          the classics
 * /library?c=classics&genre=…  filtered — the home page links straight here
 * /library/:filmId             a classic's player, above the classics grid
 *
 * Demonstrates: LIFTING STATE UP (query and genre live here, because both the
 * form and the grid need them), URL state with useSearchParams, useMemo for
 * derived data, a custom hook for debouncing, nested routing, and useParams to
 * know whether a child is open.
 */
// One shared empty list, so "nothing loaded yet" is the same value every render.
const NONE = [];

const COLLECTIONS = [
  ["new", "New & popular · 2023–25"],
  ["classics", "Free classics · play here"],
];

export default function Library({ films, progress, watchlist }) {
  // Lifted state: owned by the parent, passed down to two different children.
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { filmId } = useParams();

  // A classic's player is open → we are in the classics, whatever the URL says.
  const collection = params.get("c") === "classics" || filmId ? "classics" : "new";

  const fresh = useRemote(collection === "new" ? "library|new" : null, () => newReleases());
  const source = collection === "new" ? fresh.data ?? NONE : films;

  // Genres come from whichever collection is showing; an unknown value in the
  // URL is ignored rather than trusted.
  const genres = useMemo(() => [...new Set(source.flatMap((f) => f.genres))].sort(), [source]);
  const requested = params.get("genre");
  const genre = genres.includes(requested) ? requested : null;
  const debouncedQuery = useDebounce(query, 180);

  const setGenre = (g) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    if (g) next.set("genre", g);
    else next.delete("genre");
    return next;
  }, { replace: true });

  // Switching collection closes any open player and drops a genre that may
  // not exist in the other set.
  const setCollection = (c) => navigate(c === "classics" ? "/library?c=classics" : "/library", { replace: true });

  // useMemo: filtering runs only when its inputs change, not on every render
  // (and this component re-renders on every keystroke).
  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return source.filter((film) => {
      if (genre && !film.genres.includes(genre)) return false;
      if (!q) return true;
      return (
        film.title.toLowerCase().includes(q) ||
        film.director.toLowerCase().includes(q) ||
        film.genres.some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [source, debouncedQuery, genre]);

  const matching = `${genre ? ` in ${genre}` : ""}${debouncedQuery.trim() ? ` matching “${debouncedQuery.trim()}”` : ""}`;
  const all = visible.length === source.length;
  const loading = collection === "new" && fresh.loading;

  return (
    <section className="section library">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>02</span><span className="folio-label">Library</span></p>
          <div className="sec-head-body">
            <h1 className="sec-title display-xl">
              {collection === "new" ? <>New <em>&amp; popular.</em></> : <>Free <em>classics.</em></>}
            </h1>
            <p className="sec-note" aria-live="polite">
              {loading
                ? "Loading the newest films…"
                : fresh.error && collection === "new"
                  ? "Couldn’t load the new releases right now."
                  : collection === "new"
                    ? `${all ? "The" : `${visible.length} of the`} ${source.length} most popular films of 2023–2025${matching}. Open one for its trailer and where to watch it.`
                    : `${all ? "All" : `${visible.length} of`} ${source.length} public-domain films${matching}. These play right here, free.`}
            </p>
          </div>
        </header>

        <nav className="mv-tabs" aria-label="Collection">
          {COLLECTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`mv-tab${collection === key ? " is-on" : ""}`}
              aria-pressed={collection === key}
              onClick={() => setCollection(key)}
            >
              {collection === key && (
                <motion.span layoutId="lib-tab-fill" className="mv-tab-fill"
                  transition={{ type: "spring", duration: 0.45, bounce: 0.15 }} />
              )}
              <span className="mv-tab-label">{label}</span>
            </button>
          ))}
        </nav>

        <SearchForm
          query={query}
          onQueryChange={setQuery}
          genre={genre}
          genres={genres}
          onGenreChange={setGenre}
        />

        {/* Child route renders here when the URL carries a :filmId. */}
        {filmId && (
          <div className="detail-slot">
            <Outlet />
          </div>
        )}

        {loading ? (
          <div className="grid" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <span key={i} className="mv-skel" />)}
          </div>
        ) : (
          <FilmGrid films={visible} progress={progress} watchlist={watchlist} />
        )}
      </div>
    </section>
  );
}
