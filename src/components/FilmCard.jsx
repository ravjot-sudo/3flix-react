import { useRef } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import Poster from "./Poster.jsx";
import { formatRuntime } from "../data/films.js";

/**
 * SPOTLIGHT POSTER CARD — 21st.dev Popular #4, "Spotlight Card" (7.7k).
 *
 * A warm pool of light follows the pointer across the poster, like a
 * projector beam catching a lobby card.
 *
 * Performance: pointermove writes two CSS custom properties straight onto the
 * element, at most once per frame. React does not re-render on mouse movement
 * at all — the light is pure CSS reading --x and --y.
 *
 * Demonstrates: props, useRef for direct DOM writes, conditional rendering,
 * composition (<Poster/> is reused, not reimplemented), and <Link>.
 */
export default function FilmCard({ film, progress = 0, inWatchlist = false }) {
  const ref = useRef(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();
  const pct = Math.round(progress * 100);

  function onPointerMove(e) {
    if (reduced || e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${clientX - r.left}px`);
      el.style.setProperty("--y", `${clientY - r.top}px`);
    });
  }

  return (
    <Link
      ref={ref}
      to={`/library/${film.id}`}
      className="tile spot"
      onPointerMove={onPointerMove}
      aria-label={`${film.title}, ${film.year}, directed by ${film.director}.${
        pct > 0 ? ` ${pct} percent watched.` : ""
      }`}
    >
      <Poster film={film} />
      <span className="spot-light" aria-hidden="true" />

      {inWatchlist && <span className="tile-flag">List</span>}

      {pct > 0 && (
        <div className="tile-progress">
          <span style={{ "--p": `${pct}%` }} />
        </div>
      )}

      <span className="sr-only">{formatRuntime(film.runtime)}</span>
    </Link>
  );
}
