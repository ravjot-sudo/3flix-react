import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Poster from "./Poster.jsx";
import { FILMS } from "../data/films.js";
import { useToast } from "../hooks/useToast.js";

/**
 * HIGHEST RATED — the collection's top six, as a ranked row.
 *
 * Each place is a big outlined numeral with the film's official poster set
 * against it; the row rises in one by one as it scrolls into view. The heart
 * on each poster is a real control: it toggles the same watchlist the library
 * and detail pages use, and confirms with an undoable toast. It sits beside
 * the link, never inside it — a button nested in a link is invalid HTML.
 *
 * Demonstrates: lifted state passed down as props, whileInView with a
 * staggered delay, a keyed remount to replay a spring on every toggle, and
 * derived data at module scope.
 */
const TOP = [...FILMS].sort((a, b) => b.rating - a.rating || a.year - b.year).slice(0, 6);
const EASE = [0.16, 1, 0.3, 1];

export default function FilmShelf({ watchlist, onToggleWatchlist }) {
  const toast = useToast();

  function toggle(film, saved) {
    onToggleWatchlist(film.id);
    toast.show(
      saved ? `Removed ${film.title} from your watchlist.` : `Added ${film.title} to your watchlist.`,
      { undo: () => onToggleWatchlist(film.id) },
    );
  }

  return (
    <section className="section shelf" aria-labelledby="shelf-title">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>03</span><span className="folio-label">Highest rated</span></p>
          <div className="sec-head-body">
            <h2 id="shelf-title" className="sec-title">The top six, <em>ranked.</em></h2>
            <div className="sec-aside">
              <p className="sec-note">
                The best-rated films in the collection, in order. Heart one to keep it on your list.
              </p>
              <Link className="link-go" to="/library">Browse all {FILMS.length} films</Link>
            </div>
          </div>
        </header>

        <ol className="rank">
          {TOP.map((film, i) => {
            const saved = watchlist.includes(film.id);
            return (
              <motion.li
                key={film.id}
                className="rank-item"
                initial={{ opacity: 0, transform: "translateY(28px)" }}
                whileInView={{ opacity: 1, transform: "translateY(0px)" }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: EASE }}
              >
                <span className="rank-n" aria-hidden="true">{i + 1}</span>

                <div className="rank-card">
                  <Link className="rank-link" to={`/library/${film.id}`}>
                    <span className="rank-poster">
                      <Poster film={film} showText={false} sizes="(max-width: 700px) 40vw, 180px" />
                    </span>
                    <span className="rank-title">{film.title}</span>
                    <span className="rank-meta">
                      <span className="sr-only">Number {i + 1}. </span>
                      {film.year} · <span aria-label={`rated ${film.rating.toFixed(1)}`}>★ {film.rating.toFixed(1)}</span>
                    </span>
                  </Link>

                  <button
                    type="button"
                    className={`rank-heart${saved ? " is-on" : ""}`}
                    aria-pressed={saved}
                    aria-label={`${saved ? "Remove" : "Add"} ${film.title} ${saved ? "from" : "to"} watchlist`}
                    onClick={() => toggle(film, saved)}
                  >
                    {/* New key on every toggle: the icon remounts and springs in. */}
                    <motion.svg
                      key={saved ? "on" : "off"}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.35, bounce: 0.35 }}
                    >
                      <path
                        d="M12 20.3 4.3 12.6a4.6 4.6 0 0 1 6.5-6.5L12 7.3l1.2-1.2a4.6 4.6 0 0 1 6.5 6.5z"
                        fill={saved ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
