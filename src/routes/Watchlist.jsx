import { Link } from "react-router-dom";
import FilmGrid from "../components/FilmGrid.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { OPEN_FILMS } from "../data/openFilms.js";

/**
 * Watchlist — like every page past the opening, reached only when signed in.
 *
 * Demonstrates: consuming context via a custom hook, conditional rendering
 * for the empty state, and derived data from props.
 */
export default function Watchlist({ films, watchlist, progress }) {
  const { user, mode } = useAuth();
  const saved = [...films, ...OPEN_FILMS].filter((f) => watchlist.includes(f.id));

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
            <p>Open any film and add it to your watchlist.</p>
            <Link className="btn btn-ghost" to="/library">Browse the library</Link>
          </div>
        ) : (
          <FilmGrid films={saved} progress={progress} watchlist={watchlist} />
        )}
      </div>
    </section>
  );
}
