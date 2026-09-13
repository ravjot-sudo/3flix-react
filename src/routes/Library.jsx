import { useMemo, useState } from "react";
import { Outlet, useParams, useSearchParams } from "react-router-dom";
import SearchForm from "../components/SearchForm.jsx";
import FilmGrid from "../components/FilmGrid.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import { useRemote } from "../hooks/useTmdb.js";
import { newReleases } from "../lib/tmdb.js";

/**
 * Library — the browse page, and a PARENT route.
 *
 * One grid, one search box and one genre filter over the 100 most popular
 * films of 2023–2025 (TMDB). Each opens its /movies page: official trailer,
 * and where it streams. Every card carries a star for the watchlist.
 *
 * /library                     new & popular
 * /library?genre=…             filtered — the home page links straight here
 * /library/:filmId             a classic's player, above the grid
 *
 * Demonstrates: LIFTING STATE UP (query and genre live here, because both the
 * form and the grid need them), URL state with useSearchParams, useMemo for
 * derived data, a custom hook for debouncing, nested routing, and useParams to
 * know whether a child is open.
 */
// One shared empty list, so "nothing loaded yet" is the same value every render.
const NONE = [];

export default function Library({ progress, watchlist, onToggleWatchlist }) {
  // Lifted state: owned by the parent, passed down to two different children.
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const { filmId } = useParams();

  const fresh = useRemote("library|new", () => newReleases());
  const source = fresh.data ?? NONE;

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
  const loading = fresh.loading;

  return (
    <section className="section library">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>02</span><span className="folio-label">Library</span></p>
          <div className="sec-head-body">
            <h1 className="sec-title display-xl">
              New <em>&amp; popular.</em>
            </h1>
            <p className="sec-note" aria-live="polite">
              {loading
                ? "Loading the newest films…"
                : fresh.error
                  ? "Couldn’t load the new releases right now."
                  : `${all ? "The" : `${visible.length} of the`} ${source.length} most popular films of 2023–2025${matching}. Open one for its trailer and where to watch it.`}
            </p>
          </div>
        </header>

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
          <FilmGrid films={visible} progress={progress} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        )}
      </div>
    </section>
  );
}
