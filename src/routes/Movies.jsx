import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import MovieCard from "../components/MovieCard.jsx";
import { TmdbCredit, TmdbSetup } from "../components/TmdbNotes.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import { usePaged, useRegion, useRemote } from "../hooks/useTmdb.js";
import {
  LISTS, REGIONS, SORTS, discoverFree, hasTmdb, img, movieGenres,
  inRegion, nowPlaying, regionName, savedOn, searchMovies, topRated, trending,
} from "../lib/tmdb.js";

/**
 * /movies — the current-film catalogue, via TMDB, on four shelves:
 *
 *   trending  this week's most-watched films worldwide (the default)
 *   top       highest rated since 2000 (5,000+ votes), filterable by genre
 *   cinema    playing in cinemas in your country
 *   free      streaming free and legally (ad-supported services) where you are
 *
 * Shelf, genre, sort and search all live in the URL (?list=free&genre=18),
 * so Back returns to exactly the list you left and any view can be linked to.
 * Typing in the search box switches to "every film TMDB knows"; each film's
 * page then says where it streams.
 *
 * Demonstrates: URL state, a debounced controlled input, derived data, paged
 * fetching with "load more", a shared-layout tab highlight, and loading /
 * error / empty states.
 */
const COPY = {
  top: (place, n) => ({
    title: <>Top rated <em>since 2000.</em></>,
    note: `${n} films from 2000 to today with 5,000+ votes on TMDB, highest rated first. Each page shows where it streams in ${place}.`,
  }),
  // No count here: TMDB caps the trending list at 10,000, which is not a fact about the films.
  trending: (place) => ({
    title: <>Trending <em>this week.</em></>,
    note: `The films the world is watching and talking about right now. Official posters and trailers; each page shows where it streams in ${place}.`,
  }),
  cinema: (place, n) => ({
    title: <>In cinemas <em>in {place}.</em></>,
    note: `${n} films playing in cinemas in ${place} now. Trailers play here.`,
  }),
  free: (place, n) => ({
    title: <>Free to watch <em>in {place}.</em></>,
    note: `${n} films you can stream free and legally in ${place}, on ad-supported services. Open one to see where.`,
  }),
};

const FETCH = {
  top: ({ genre, page }, signal) => topRated({ genre, page }, signal),
  trending: ({ page }, signal) => trending({ page }, signal),
  cinema: ({ region, page }, signal) => nowPlaying({ region, page }, signal),
  free: (args, signal) => discoverFree(args, signal),
};

export default function Movies() {
  const ready = hasTmdb();
  const [region, setRegion] = useRegion();
  const [params, setParams] = useSearchParams();
  const ids = { q: useId(), region: useId(), sort: useId() };

  // The box keeps its own state so every keystroke lands immediately; the URL
  // is only a copy. Reading the value back from the URL drops characters when
  // typing fast, because router updates arrive a render late.
  const [text, setText] = useState(() => params.get("q") ?? "");
  const shelf = LISTS[params.get("list")] ? params.get("list") : "trending";
  const filters = LISTS[shelf].filters;
  const genre = filters ? params.get("genre") ?? "" : "";
  // Top rated has one order by definition; the other filterable shelves can sort.
  const sortable = filters && LISTS[shelf].sort !== false;
  const sort = sortable && SORTS[params.get("sort")] ? params.get("sort") : "popular";
  const query = useDebounce(text.trim(), 350);
  const searching = query.length > 1;

  /** Change one URL parameter, keeping the others. */
  const setParam = (name, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    }, { replace: true });
  };

  const genres = useRemote(ready ? "genres" : null, (signal) => movieGenres(signal));
  const key = !ready ? null : searching ? `search|${query}` : `${shelf}|${region}|${genre}|${sort}`;
  const list = usePaged(key, (page, signal) =>
    searching ? searchMovies({ query, page }, signal) : FETCH[shelf]({ region, genre, sort, page }, signal));

  // A saved cinema list may be for another country than the one picked
  // (lib/tmdb.js keeps India, the US and the UK), so the copy names its own.
  const place = inRegion(list.region ?? region);         // in a sentence: "the United Kingdom"
  const placeLabel = regionName(list.region ?? region);  // on a label: "United Kingdom"
  const copy = COPY[shelf](place, list.total.toLocaleString());
  const featured = !searching ? list.items[0] : null;
  const grid = featured ? list.items.slice(1) : list.items;

  return (
    <section className="section movies" aria-labelledby="movies-title">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>05</span><span className="folio-label">Movies</span></p>
          <div className="sec-head-body">
            <h1 id="movies-title" className="sec-title display-xl">
              {searching ? <>Results for <em>“{query}”</em></> : copy.title}
            </h1>
            <div className="sec-aside">
              <p className="sec-note" aria-live="polite">
                {!ready
                  ? "Trending films, what’s in cinemas and what’s free to stream — once TMDB is connected."
                  : list.loading && !list.items.length
                    ? "Loading the catalogue…"
                    : searching
                      ? `${list.total.toLocaleString()} films across TMDB. Open one to see where it streams.`
                      : copy.note}
              </p>
              {list.saved && !searching && (
                <p className="saved-note label">
                  Saved list · as of {savedOn(list.saved)} — the live one isn’t reachable right now
                </p>
              )}
            </div>
          </div>
        </header>

        {ready && !searching && (
          <nav className="mv-tabs" aria-label="Shelves">
            {Object.entries(LISTS).map(([k, l]) => (
              <button
                key={k}
                type="button"
                className={`mv-tab${shelf === k ? " is-on" : ""}`}
                aria-pressed={shelf === k}
                onClick={() => setParam("list", k === "trending" ? "" : k)}
              >
                {/* One gold block, handed between tabs: it slides, it does not blink. */}
                {shelf === k && (
                  <motion.span layoutId="mv-tab-fill" className="mv-tab-fill"
                    transition={{ type: "spring", duration: 0.45, bounce: 0.15 }} />
                )}
                <span className="mv-tab-label">{l.label}</span>
              </button>
            ))}
          </nav>
        )}

        {!ready ? <TmdbSetup /> : (
          <>
            <form className="mv-tools" role="search" onSubmit={(e) => e.preventDefault()}>
              <label className="sr-only" htmlFor={ids.q}>Search all films</label>
              <input
                id={ids.q}
                className="mv-search"
                type="search"
                value={text}
                onChange={(e) => { setText(e.target.value); setParam("q", e.target.value.trim()); }}
                placeholder="Search every film…"
                autoComplete="off"
              />
              <label className="mv-select">
                <span className="label">Country</span>
                <select id={ids.region} value={region} onChange={(e) => setRegion(e.target.value)}>
                  {[...new Set([region, ...REGIONS])].map((r) => (
                    <option key={r} value={r}>{regionName(r)}</option>
                  ))}
                </select>
              </label>
              <label className="mv-select">
                <span className="label">Sort</span>
                <select id={ids.sort} value={sort} onChange={(e) => setParam("sort", e.target.value === "popular" ? "" : e.target.value)} disabled={searching || !sortable}>
                  {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
              </label>
            </form>

            {!searching && filters && genres.data && (
              <div className="genre-list mv-genres" role="group" aria-label="Filter by genre">
                <button type="button" className={`genre-chip${!genre ? " is-on" : ""}`} aria-pressed={!genre} onClick={() => setParam("genre", "")}>
                  All
                </button>
                {genres.data.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`genre-chip${genre === String(g.id) ? " is-on" : ""}`}
                    aria-pressed={genre === String(g.id)}
                    onClick={() => setParam("genre", genre === String(g.id) ? "" : String(g.id))}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {featured && <Billboard film={featured} shelf={shelf} place={placeLabel} />}

            {list.error?.status === 503 && !list.items.length ? (
              <TmdbSetup />
            ) : list.error && !list.items.length ? (
              <div className="empty">
                <h2>Couldn’t load the catalogue.</h2>
                <p>{list.error.message}</p>
                <button type="button" className="btn btn-ghost" onClick={list.retry}>Try again</button>
              </div>
            ) : list.loading && !list.items.length ? (
              <ul className="mv-grid" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => <li key={i} className="mv-skel" />)}
              </ul>
            ) : !list.items.length ? (
              <div className="empty">
                <h2>No films match.</h2>
                <p>Try another genre, or search every film instead.</p>
              </div>
            ) : (
              <ul className="mv-grid">
                {grid.map((film, i) => (
                  <motion.li
                    key={film.id}
                    initial={{ opacity: 0, transform: "translateY(14px)" }}
                    animate={{ opacity: 1, transform: "translateY(0px)" }}
                    transition={{ duration: 0.45, delay: (i % 20) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <MovieCard film={film} />
                  </motion.li>
                ))}
              </ul>
            )}

            {list.items.length > 0 && (
              <div className="mv-more">
                <p className="label">
                  Showing {list.items.length.toLocaleString()} of {list.total.toLocaleString()}
                </p>
                {list.hasMore && (
                  <button type="button" className="btn btn-ghost" onClick={list.loadMore} disabled={list.loading}>
                    {list.loading ? "Loading…" : "Load more"}
                  </button>
                )}
                {list.error && <button type="button" className="btn btn-ghost" onClick={list.retry}>Retry</button>}
              </div>
            )}

            <TmdbCredit />
          </>
        )}
      </div>
    </section>
  );
}

const KICKER = {
  top: () => "No. 1 · top rated since 2000",
  trending: () => "No. 1 trending this week",
  cinema: (place) => `In cinemas · ${place}`,
  free: (place) => `Free to watch · ${place}`,
};

/** The first film on the current shelf, full width, with its official art. */
function Billboard({ film, shelf, place }) {
  return (
    <section className="mv-bill" aria-label={`Featured: ${film.title}`}>
      {film.backdrop && (
        <img className="mv-bill-img" src={img(film.backdrop, "w1280")} alt="" decoding="async" />
      )}
      <div className="mv-bill-shade" aria-hidden="true" />
      <div className="mv-bill-copy">
        <p className="label">{KICKER[shelf](place)}</p>
        <h2 className="mv-bill-title">{film.title}</h2>
        {film.overview && <p className="mv-bill-text">{film.overview}</p>}
        <div className="mv-bill-actions">
          <Link className="btn btn-primary btn-go" to={`/movies/${film.id}`}>
            Trailer & where to watch
          </Link>
        </div>
      </div>
    </section>
  );
}
