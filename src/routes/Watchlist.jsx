import { Link } from "react-router-dom";
import FilmGrid from "../components/FilmGrid.jsx";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Watchlist — like every page past the opening, reached only when signed in.
 *
 * Everything starred anywhere — the library grids, the movies shelves, or a
 * film's own page — lands here. Classics resolve from the catalogue; starred
 * TMDB films resolve from the snapshots saved when they were starred (App.jsx).
 *
 * Demonstrates: consuming context via a custom hook, conditional rendering
 * for the empty state, and derived data from props.
 */
export default function Watchlist({ films, watchlist, progress, savedFilms = {}, onToggleWatchlist }) {
  const { user, mode } = useAuth();
  const saved = watchlist
    .map((id) => (id.startsWith("tmdb-") ? savedFilms[id] : films.find((f) => f.id === id)))
    .filter(Boolean);

  return (
    <section className="section">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>03</span><span className="folio-label">Watchlist</span></p>
          <div className="sec-head-body">
            <h1 className="sec-title display-xl">Your watchlist</h1>
            <p className="sec-note">
              Signed in as {user.name}. {saved.length} title
              {saved.length === 1 ? "" : "s"} saved {mode === "cloud" ? "to your account" : "in this browser"}.
            </p>
          </div>
        </header>

        {saved.length === 0 ? (
          <div className="empty">
            <h2>Nothing saved yet</h2>
            <p>Tap the star on any film and it will wait for you here.</p>
            <Link className="btn btn-ghost" to="/library">Browse the library</Link>
          </div>
        ) : (
          <FilmGrid films={saved} progress={progress} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        )}
      </div>
    </section>
  );
}
