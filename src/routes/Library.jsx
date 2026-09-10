import { useMemo, useState } from "react";
import { Outlet, useParams, useSearchParams } from "react-router-dom";
import SearchForm from "../components/SearchForm.jsx";
import FilmGrid from "../components/FilmGrid.jsx";
import { GENRES } from "../data/films.js";
import { useDebounce } from "../hooks/useDebounce.js";

/**
 * Library — the browse page, and a PARENT route.
 *
 * /library          renders the grid
 * /library/:filmId  renders the grid *and* the detail child in <Outlet/>
 *
 * Demonstrates: LIFTING STATE UP (query and genre live here, because both the
 * form and the grid need them), URL state with useSearchParams, useMemo for
 * derived data, a custom hook for debouncing, nested routing, and useParams to
 * know whether a child is open.
 */
export default function Library({ films, progress, watchlist }) {
  // Lifted state: owned by the parent, passed down to two different children.
  const [query, setQuery] = useState("");

  // The genre lives in the URL (?genre=Noir) rather than in useState, so a
  // filtered view can be linked to — the home page's genre menu does exactly
  // that. An unknown value is ignored rather than trusted.
  const [params, setParams] = useSearchParams();
  const requested = params.get("genre");
  const genre = GENRES.includes(requested) ? requested : null;
  const setGenre = (g) => setParams(g ? { genre: g } : {}, { replace: true });
  const debouncedQuery = useDebounce(query, 180);
  const { filmId } = useParams();

  // useMemo: filtering runs only when its inputs change, not on every render
  // (and this component re-renders on every keystroke).
  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return films.filter((film) => {
      if (genre && !film.genres.includes(genre)) return false;
      if (!q) return true;
      return (
        film.title.toLowerCase().includes(q) ||
        film.director.toLowerCase().includes(q) ||
        film.genres.some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [films, debouncedQuery, genre]);

  return (
    <section className="section library">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>02</span><span className="folio-label">Library</span></p>
          <div className="sec-head-body">
            <h1 className="sec-title display-xl">Library</h1>
            <p className="sec-note">
              {visible.length} of {films.length} titles
              {genre ? ` in ${genre}` : ""}
              {debouncedQuery.trim() ? ` matching “${debouncedQuery.trim()}”` : ""}.
            </p>
          </div>
        </header>

        <SearchForm
          query={query}
          onQueryChange={setQuery}
          genre={genre}
          genres={GENRES}
          onGenreChange={setGenre}
        />

        {/* Child route renders here when the URL carries a :filmId. */}
        {filmId && (
          <div className="detail-slot">
            <Outlet />
          </div>
        )}

        <FilmGrid films={visible} progress={progress} watchlist={watchlist} />
      </div>
    </section>
  );
}
